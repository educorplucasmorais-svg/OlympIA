import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import { Client as MCPClient } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

class WhatsAppMoltbot {
  constructor() {
    this.whatsapp = null;
    this.mcpClient = null;
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

  async initializeWhatsApp() {
    console.log('🔧 Inicializando WhatsApp...');
    
    this.whatsapp = new Client({
      authStrategy: new LocalAuth({ clientId: 'moltbot' }),
      puppeteer: {
        headless: false,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      }
    });

    this.whatsapp.on('qr', (qr) => {
      console.log('\n📱 ============================================');
      console.log('📱 ESCANEIE O QR CODE COM SEU WHATSAPP:');
      console.log('📱 ============================================\n');
      qrcode.generate(qr, { small: true });
      console.log('\n📱 ============================================\n');
    });

    this.whatsapp.on('authenticated', () => {
      console.log('🔐 WhatsApp autenticado com sucesso!');
      // Forçar ready após autenticação se não disparar automaticamente
      setTimeout(() => {
        if (!this.ready) {
          console.log('⚠️ Evento ready não disparou, forçando ready manualmente...');
          this.ready = true;
          console.log('✅ Bot agora está PRONTO para receber comandos!');
        }
      }, 5000);
    });

    this.whatsapp.on('auth_failure', (msg) => {
      console.error('❌ Falha na autenticação:', msg);
    });

    this.whatsapp.on('ready', () => {
      console.log('✅ WhatsApp conectado e pronto!');
      console.log('📱 Agora você pode receber comandos!');
      console.log('🔍 Aguardando mensagens...\n');
      this.ready = true;
    });

    // TODOS os eventos possíveis para debug
    this.whatsapp.on('message', async (msg) => {
      console.log(`🔔 [EVENT MESSAGE] From: ${msg.from}, Body: "${msg.body}", Ready: ${this.ready}`);
      await this.handleMessage(msg);
    });

    this.whatsapp.on('message_create', async (msg) => {
      console.log(`📤 [EVENT MESSAGE_CREATE] From: ${msg.from}, Body: "${msg.body}", FromMe: ${msg.fromMe}`);
      if (msg.fromMe) {
        console.log('⚠️ Mensagem enviada por mim, ignorando...');
        return;
      }
      await this.handleMessage(msg);
    });

    this.whatsapp.on('message_revoke_everyone', () => {
      console.log('🗑️ [EVENT] Mensagem apagada para todos');
    });

    this.whatsapp.on('change_state', (state) => {
      console.log('🔄 [EVENT] Estado mudou:', state);
    });

    this.whatsapp.on('group_join', (notification) => {
      console.log('👥 [EVENT] Alguém entrou no grupo');
    });

    this.whatsapp.on('disconnected', (reason) => {
      console.log('❌ WhatsApp desconectado:', reason);
    });

    this.whatsapp.on('loading_screen', (percent, message) => {
      console.log(`⏳ [LOADING] ${percent}% - ${message}`);
    });

    console.log('⏳ Inicializando cliente WhatsApp...');
    await this.whatsapp.initialize();
    console.log('✓ Initialize concluído');
  }

  async handleMessage(msg) {
    console.log(`🔍 HandleMessage - Ready: ${this.ready}, From: ${msg.from}, Body: ${msg.body}`);
    
    if (msg.from === 'status@broadcast') {
      console.log('⚠️ Status broadcast, ignorando...');
      return;
    }
    
    if (!this.ready) {
      console.log('⚠️ Bot não está ready ainda!');
      return;
    }

    const text = msg.body.trim();
    const contact = await msg.getContact();
    
    console.log(`📩 Processando mensagem de ${contact.pushname || contact.number}: ${text}`);

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

Digite !help para ver esta mensagem novamente.`;
        
        await msg.reply(helpText);
        return;
      }

      // Listar skills
      if (text.toLowerCase() === '!skills') {
        const result = await this.mcpClient.callTool({
          name: "list_skills",
          arguments: {},
        });
        await msg.reply(`🛠️ ${result.content[0].text}`);
        return;
      }

      // Gerar texto com IA
      if (text.toLowerCase().startsWith('!gerar ')) {
        const prompt = text.substring(7).trim();
        if (!prompt) {
          await msg.reply('❌ Por favor, forneça um prompt.\nExemplo: !gerar explique o universo');
          return;
        }

        await msg.reply('🍌 Gerando resposta...');
        
        const result = await this.mcpClient.callTool({
          name: "nano_banana_pro_generate",
          arguments: {
            prompt: prompt,
            temperature: 0.8,
            max_tokens: 500,
          },
        });
        
        await msg.reply(`✨ ${result.content[0].text}`);
        return;
      }

      // Análise de sentimento
      if (text.toLowerCase().startsWith('!sentimento ') || text.toLowerCase().startsWith('!analisar ')) {
        const command = text.toLowerCase().startsWith('!sentimento ') ? '!sentimento ' : '!analisar ';
        const textToAnalyze = text.substring(command.length).trim();
        
        if (!textToAnalyze) {
          await msg.reply('❌ Por favor, forneça um texto para analisar.\nExemplo: !analisar estou muito feliz!');
          return;
        }

        await msg.reply('🍌 Analisando texto...');
        
        const result = await this.mcpClient.callTool({
          name: "nano_banana_pro_analyze",
          arguments: {
            text: textToAnalyze,
            analysis_type: "sentiment",
          },
        });
        
        await msg.reply(`📊 ${result.content[0].text}`);
        return;
      }

      // Análise de keywords
      if (text.toLowerCase().startsWith('!keywords ')) {
        const textToAnalyze = text.substring(10).trim();
        
        if (!textToAnalyze) {
          await msg.reply('❌ Por favor, forneça um texto.\nExemplo: !keywords inteligência artificial');
          return;
        }

        await msg.reply('🍌 Extraindo palavras-chave...');
        
        const result = await this.mcpClient.callTool({
          name: "nano_banana_pro_analyze",
          arguments: {
            text: textToAnalyze,
            analysis_type: "keywords",
          },
        });
        
        await msg.reply(`🔑 ${result.content[0].text}`);
        return;
      }

    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);
      await msg.reply('❌ Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.');
    }
  }

  async start() {
    console.log('🚀 Iniciando WhatsApp Moltbot...\n');
    
    try {
      await this.initializeMCP();
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
