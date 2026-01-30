import axios from 'axios';
import dotenv from 'dotenv';
import { Client as MCPClient } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

dotenv.config();

class WhatsAppMoltbot {
  constructor() {
    this.apiUrl = 'http://localhost:8080';
    this.apiKey = 'evolution-api-key-secure-2026';
    this.instanceName = 'moltbot';
    this.mcpClient = null;
    this.context7Client = null;
    this.context7Ready = false;
    this.ready = false;
  }

  async initializeMCP() {
    console.log('🔧 Inicializando conexão com Moltbot MCP...');

    const transport = new StdioClientTransport({
      command: "node",
      args: ["index.js"],
    });

    this.mcpClient = new MCPClient(
      {
        name: "whatsapp-moltbot",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );

    await this.mcpClient.connect(transport);
    console.log('✅ Conectado ao Moltbot MCP');
  }

  async initializeContext7MCP() {
    const apiKey = process.env.CONTEXT7_API_KEY;
    const useDocker = process.env.CONTEXT7_USE_DOCKER === 'true';
    const dockerImage = process.env.CONTEXT7_DOCKER_IMAGE || 'context7-mcp';

    if (!apiKey && !useDocker) {
      console.log('ℹ️ Context7 MCP não configurado (CONTEXT7_API_KEY ausente).');
      return;
    }

    try {
      console.log('🔧 Inicializando conexão com Context7 MCP...');

      let command = 'npx';
      let args = ['-y', '@upstash/context7-mcp@latest'];

      if (useDocker) {
        command = 'docker';
        args = ['run', '-i', '--rm'];
        if (apiKey) {
          args.push('-e', `CONTEXT7_API_KEY=${apiKey}`);
        }
        args.push(dockerImage);
      } else if (apiKey) {
        args = [...args, '--api-key', apiKey];
      }

      const transport = new StdioClientTransport({
        command,
        args,
      });

      this.context7Client = new MCPClient(
        {
          name: "context7-client",
          version: "1.0.0",
        },
        {
          capabilities: {},
        }
      );

      await this.context7Client.connect(transport);
      this.context7Ready = true;
      console.log('✅ Conectado ao Context7 MCP');
    } catch (error) {
      this.context7Ready = false;
      console.log('⚠️ Falha ao conectar ao Context7 MCP. Bot seguirá sem docs.');
    }
  }

  async initializeWhatsApp() {
    console.log('🔧 Inicializando WhatsApp via Evolution API...');

    try {
      // Verificar se instância já existe
      const instancesResponse = await axios.get(`${this.apiUrl}/instance/fetchInstances`, {
        headers: {
          'apikey': this.apiKey
        }
      });
      
      const existingInstance = instancesResponse.data.find(inst => inst.name === this.instanceName);
      
      if (!existingInstance) {
        // Criar nova instância
        const createResponse = await axios.post(`${this.apiUrl}/instance/create`, {
          instanceName: this.instanceName,
          integration: "WHATSAPP-BAILEYS"
        }, {
          headers: {
            'apikey': this.apiKey,
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ Instância criada:', createResponse.data);
      } else {
        console.log('ℹ️ Instância já existe, usando existente');
        
        // Tentar restart para garantir que está limpo
        try {
          await axios.post(`${this.apiUrl}/instance/restart/${this.instanceName}`, {}, {
            headers: {
              'apikey': this.apiKey
            }
          });
          console.log('🔄 Instância reiniciada');
          await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar restart
        } catch (error) {
          console.log('⚠️ Não foi possível reiniciar, continuando...');
        }
      }

      // Conectar (gerar QR)
      console.log('🔗 Conectando instância...');
      const connectResponse = await axios.get(`${this.apiUrl}/instance/connect/${this.instanceName}`, {
        headers: {
          'apikey': this.apiKey
        }
      });
      
      console.log('📱 Aguardando QR Code...');
      
      // Aguardar QR code ser gerado
      let qrAttempts = 0;
      let qrCode = null;
      while (qrAttempts < 30) { // 30 segundos
        try {
          const qrResponse = await axios.get(`${this.apiUrl}/instance/connect/${this.instanceName}`, {
            headers: {
              'apikey': this.apiKey
            }
          });
          
          if (qrResponse.data && (qrResponse.data.base64 || qrResponse.data.code)) {
            qrCode = qrResponse.data.base64 || qrResponse.data.code;
            break;
          }
        } catch (error) {
          // Ignorar erros temporários
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        qrAttempts++;
      }
      
      if (!qrCode) {
        console.log('❌ QR Code não gerado. Verifique os logs do Evolution API.');
        throw new Error('QR Code não gerado');
      }
      
      console.log('📱 QR Code gerado. Escaneie com seu WhatsApp:');
      console.log(qrCode);

      // Aguardar conexão
      let attempts = 0;
      while (attempts < 60) { // 5 minutos
        try {
          const statusResponse = await axios.get(`${this.apiUrl}/instance/connectionState`, {
            headers: {
              'apikey': this.apiKey
            },
            params: {
              instanceName: this.instanceName
            }
          });

          if (statusResponse.data.instance.state === 'open') {
            console.log('✅ WhatsApp conectado!');
            this.ready = true;
            break;
          }
        } catch (error) {
          console.log('⏳ Aguardando conexão...');
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      }

      if (!this.ready) {
        throw new Error('Timeout aguardando conexão WhatsApp');
      }

      // Iniciar polling de mensagens
      this.startMessagePolling();

    } catch (error) {
      console.error('❌ Erro ao inicializar WhatsApp:', error.response?.data || error.message);
      throw error;
    }
  }

  async startMessagePolling() {
    console.log('🔍 Iniciando polling de mensagens...');

    setInterval(async () => {
      if (!this.ready) return;

      try {
        const messagesResponse = await axios.get(`${this.apiUrl}/chat/findMessages`, {
          headers: {
            'apikey': this.apiKey
          },
          params: {
            instanceName: this.instanceName,
            limit: 10
          }
        });

        const messages = messagesResponse.data.messages || [];

        for (const message of messages) {
          if (message.fromMe) continue; // Ignorar mensagens enviadas pelo bot

          await this.handleMessage(message);
        }

      } catch (error) {
        console.error('❌ Erro no polling:', error.message);
      }
    }, 5000); // Polling a cada 5 segundos
  }

  async handleMessage(msg) {
    console.log(`📩 Mensagem recebida: ${msg.body} de ${msg.from}`);

    const text = msg.body?.trim();
    if (!text) return;

    try {
      // Comando de ajuda
      if (text.toLowerCase() === '!help' || text.toLowerCase() === '!ajuda') {
        const helpText = `🍌 *Moltbot - Comandos Disponíveis*

📝 *Geração de Texto:*
!gerar <seu prompt>
Exemplo: !gerar explique inteligência artificial

📊 *Análise de Texto:*
!analisar <texto>
Exemplo: !analisar estou muito feliz hoje!

🔍 *Análise de Sentimento:*
!sentimento <texto>

📌 *Palavras-chave:*
!keywords <texto>

📋 *Listar Skills:*
!skills

📚 *Documentação (Context7):*
!docs <biblioteca> | <pergunta>
Exemplo: !docs react | como usar useEffect

Digite !help para ver esta mensagem novamente.`;

        await this.sendMessage(msg.from, helpText);
        return;
      }

      // Listar skills
      if (text.toLowerCase() === '!skills') {
        const result = await this.mcpClient.callTool({
          name: "list_skills",
          arguments: {},
        });
        await this.sendMessage(msg.from, `🛠️ ${result.content[0].text}`);
        return;
      }

      // Fallback automático Context7: detectar perguntas de código
      const codeKeywords = [
        'como usar', 'exemplo', 'function', 'método', 'classe', 'variável', 'parâmetro', 'assinatura', 'sintaxe', 'erro', 'bug', 'mensagem', 'stack', 'exception', 'throw', 'try', 'catch', 'async', 'await', 'promise', 'callback', 'import', 'export', 'require', 'const', 'let', 'var', 'node', 'npm', 'yarn', 'package', 'modulo', 'module', 'library', 'biblioteca', 'framework', 'hook', 'component', 'props', 'state', 'context', 'redux', 'express', 'koa', 'router', 'route', 'endpoint', 'controller', 'service', 'repository', 'model', 'schema', 'ORM', 'SQL', 'NoSQL', 'Mongo', 'Postgres', 'MySQL', 'SQLite', 'Redis', 'cache', 'token', 'auth', 'login', 'logout', 'register', 'signup', 'signin', 'hash', 'bcrypt', 'jwt', 'session', 'cookie', 'header', 'request', 'response', 'body', 'json', 'xml', 'yaml', 'env', 'dotenv', 'config', 'setup', 'install', 'start', 'run', 'build', 'test', 'lint', 'format', 'prettier', 'eslint', 'tslint', 'typescript', 'jsdoc', 'swagger', 'openapi', 'rest', 'graphql', 'api', 'endpoint', 'url', 'uri', 'path', 'param', 'query', 'header', 'status', 'code', 'error', 'exception', 'throw', 'try', 'catch', 'async', 'await', 'promise', 'callback'
      ];
      const isCodeQuestion = codeKeywords.some(k => text.toLowerCase().includes(k));

      // Documentação com Context7 (comando ou fallback)
      if (text.toLowerCase().startsWith('!docs ') || isCodeQuestion) {
        if (!this.context7Ready) {
          await this.sendMessage(msg.from, '❌ Context7 MCP não configurado. Defina CONTEXT7_API_KEY ou habilite CONTEXT7_USE_DOCKER.');
          return;
        }

        let libraryPart = '';
        let queryPart = '';
        if (text.toLowerCase().startsWith('!docs ')) {
          const raw = text.substring(6).trim();
          if (!raw) {
            await this.sendMessage(msg.from, '❌ Informe a biblioteca e a pergunta.\nExemplo: !docs react | como usar useEffect');
            return;
          }
          if (raw.includes('|')) {
            const [lib, ...rest] = raw.split('|');
            libraryPart = lib.trim();
            queryPart = rest.join('|').trim();
          } else {
            const parts = raw.split(' ');
            libraryPart = parts.shift()?.trim() || '';
            queryPart = parts.join(' ').trim();
          }
        } else {
          // Fallback: tenta detectar biblioteca pelo contexto, padrão javascript
          libraryPart = 'javascript';
          queryPart = text;
        }

        if (!libraryPart) {
          await this.sendMessage(msg.from, '❌ Biblioteca não informada. Exemplo: !docs react | useEffect');
          return;
        }
        if (!queryPart) {
          await this.sendMessage(msg.from, '❌ Pergunta não informada. Exemplo: !docs react | useEffect');
          return;
        }

        await this.sendMessage(msg.from, '📚 Buscando documentação...');

        let libraryId = libraryPart;
        if (!libraryPart.startsWith('/')) {
          const resolveResult = await this.context7Client.callTool({
            name: "resolve-library-id",
            arguments: {
              libraryName: libraryPart,
              query: queryPart,
            },
          });

          const resolveText = resolveResult.content[0]?.text || '';
          const match = resolveText.match(/\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)?/);
          if (!match) {
            await this.sendMessage(msg.from, '❌ Não consegui encontrar a biblioteca. Tente um nome mais específico.');
            return;
          }
          libraryId = match[0];
        }

        const docsResult = await this.context7Client.callTool({
          name: "query-docs",
          arguments: {
            libraryId: libraryId,
            query: queryPart,
          },
        });

        const docsText = docsResult.content[0]?.text || 'Sem resposta da documentação.';
        await this.sendMessage(msg.from, `📖 Docs (${libraryId}):\n${docsText}`);
        return;
      }

      // Gerar texto com IA
      if (text.toLowerCase().startsWith('!gerar ')) {
        const prompt = text.substring(7).trim();
        if (!prompt) {
          await this.sendMessage(msg.from, '❌ Por favor, forneça um prompt.\nExemplo: !gerar explique o universo');
          return;
        }

        await this.sendMessage(msg.from, '🍌 Gerando resposta...');

        const result = await this.mcpClient.callTool({
          name: "nano_banana_pro_generate",
          arguments: {
            prompt: prompt,
            temperature: 0.8,
            max_tokens: 500,
          },
        });

        await this.sendMessage(msg.from, `✨ ${result.content[0].text}`);
        return;
      }

      // Análise de sentimento
      if (text.toLowerCase().startsWith('!sentimento ') || text.toLowerCase().startsWith('!analisar ')) {
        const command = text.toLowerCase().startsWith('!sentimento ') ? '!sentimento ' : '!analisar ';
        const textToAnalyze = text.substring(command.length).trim();

        if (!textToAnalyze) {
          await this.sendMessage(msg.from, '❌ Por favor, forneça um texto para analisar.\nExemplo: !analisar estou muito feliz!');
          return;
        }

        await this.sendMessage(msg.from, '🍌 Analisando texto...');

        const result = await this.mcpClient.callTool({
          name: "nano_banana_pro_analyze",
          arguments: {
            text: textToAnalyze,
            analysis_type: "sentiment",
          },
        });

        await this.sendMessage(msg.from, `📊 ${result.content[0].text}`);
        return;
      }

      // Análise de keywords
      if (text.toLowerCase().startsWith('!keywords ')) {
        const textToAnalyze = text.substring(10).trim();

        if (!textToAnalyze) {
          await this.sendMessage(msg.from, '❌ Por favor, forneça um texto.\nExemplo: !keywords inteligência artificial');
          return;
        }

        await this.sendMessage(msg.from, '🍌 Extraindo palavras-chave...');

        const result = await this.mcpClient.callTool({
          name: "nano_banana_pro_analyze",
          arguments: {
            text: textToAnalyze,
            analysis_type: "keywords",
          },
        });

        await this.sendMessage(msg.from, `🔑 ${result.content[0].text}`);
        return;
      }

    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);
      await this.sendMessage(msg.from, '❌ Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.');
    }
  }

  async sendMessage(to, message) {
    try {
      await axios.post(`${this.apiUrl}/message/sendText`, {
        instanceName: this.instanceName,
        number: to.replace('@c.us', ''),
        text: message
      }, {
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error.response?.data || error.message);
    }
  }

  async start() {
    console.log('🚀 Iniciando WhatsApp Moltbot com Evolution API...\n');

    try {
      await this.initializeMCP();
      await this.initializeContext7MCP();
      await this.initializeWhatsApp();

      console.log('\n✅ Bot iniciado! Aguardando mensagens...');
      console.log('💡 Digite !help no WhatsApp para ver os comandos disponíveis.\n');

    } catch (error) {
      console.error('❌ Erro ao iniciar bot:', error);
      process.exit(1);
    }
  }
}

// Iniciar o bot
const bot = new WhatsAppMoltbot();
bot.start().catch(console.error);

// Tratamento de sinais para encerramento gracioso
process.on('SIGINT', async () => {
  console.log('\n⏹️  Encerrando bot...');
  process.exit(0);
});
