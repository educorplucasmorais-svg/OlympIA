import TelegramBot from 'node-telegram-bot-api';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import https from 'https';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import translate from 'google-translate-api-x';
import gtts from 'gtts';
import { createWorker } from 'tesseract.js';
import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';
import PDFDocument from 'pdfkit';
import homeAutomation from './home-automation.js';
import knowledgeBase from './knowledge-base.js';

// Carregar variáveis de ambiente
dotenv.config();

// Carregar variáveis de ambiente
dotenv.config();

// ⚠️ CONFIGURAÇÃO VIA .env FILE (MAIS SEGURO)
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || 'YOUR_TELEGRAM_TOKEN_HERE';

// ⚠️ EMAIL CONFIG
const EMAIL_CONFIG = {
  user: process.env.EMAIL_USER || 'your-email@gmail.com',
  pass: process.env.EMAIL_PASSWORD || 'your-app-password-here'
};

// ⚠️ REPLICATE API KEY (Face Swap)
// Crie uma conta gratuita em https://replicate.com e pegue sua API key
const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY || 'YOUR_REPLICATE_KEY_HERE';

const AVAILABLE_SKILLS = [
  "nano-banana-pro", "seo-master-pro", "code-explainer-pro",
  "bug-hunter-pro", "api-doc-generator-pro", "test-case-generator-pro",
  "code-reviewer-pro", "security-analyzer-pro", "performance-optimizer-pro",
  "db-query-helper-pro", "git-commit-helper-pro", "regex-helper-pro",
  "json-validator-pro", "api-endpoint-tester-pro", "log-analyzer-pro",
  "error-fixer-pro", "refactor-helper-pro", "documentation-writer-pro",
  "unit-test-writer-pro", "integration-test-writer-pro", "e2e-test-writer-pro",
  "mock-data-generator-pro", "sql-query-builder-pro", "graphql-query-builder-pro",
  "rest-api-designer-pro", "microservice-architect-pro", "cloud-architect-pro",
  "devops-helper-pro", "ci-cd-helper-pro", "docker-helper-pro",
  "kubernetes-helper-pro", "terraform-helper-pro", "ansible-helper-pro",
  "monitoring-setup-pro"
];
// Configuração para skill de notícias
const NEWS_API_URL = 'https://newsapi.org/v2/everything';

// Armazenar conversas e lembretes
const conversations = {};
const reminders = {};

class TelegramOlympIA {
  constructor() {
    this.bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
    this.mcpClient = null;
    this.setupBot();
  }

  async connectMCP() {
    try {
      const transport = new StdioClientTransport({
        command: 'node',
        args: ['index.js']
      });

      this.mcpClient = new Client({
        name: 'telegram-olympia-client',
        version: '1.0.0'
      }, {
        capabilities: {}
      });

      await this.mcpClient.connect(transport);
      console.log('✅ Conectado ao OlympIA MCP Server');
      return true;
    } catch (error) {
      console.error('❌ Erro ao conectar com MCP:', error.message);
      return false;
    }
  }

  setupBot() {
    // Comando /start
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(chatId, 
        '🤖 *Olá! Eu sou a OlympIA!*\n' +
        'Bot de Automação IA para Telegram com 17 comandos\n\n' +
        
        '🧠 *IA & Criatividade* (5 comandos)\n' +
        '• `/gerar` - Gerar textos, analisar, chat com memória\n' +
        '• `/analisar` - Análise profunda com IA\n' +
        '• `/keywords` - Extrai palavras-chave SEO\n' +
        '• `/imagem` - Gera imagem 1024x1024px\n' +
        '• `/chat` - Chat com memoria de contexto\n\n' +
        
        '🛠️ *Utilidades* - Ferramentas (10 comandos)\n' +
        '• `/traduzir` - Traduz para qualquer idioma\n' +
        '• `/senha` - Gera senha segura (8-128 chars)\n' +
        '• `/morse` - Converte para codigo Morse\n' +
        '• `/noticias` - Busca noticias em tempo real\n' +
        '• `/falar` - Converte texto em audio MP3\n' +
        '• `/ocr` - Extrai texto de imagens (foto)\n' +
        '• `/email` - Envia email via Gmail\n' +
        '• `/lembrete` - Agenda lembretes (m/h/d)\n' +
        '• `/pdf` - Gera PDF com conteúdo\n' +
        '• `/google` - Pesquisa no Google\n\n' +
        
        '🏠 */casa* - Casa Inteligente (5 comandos)\n' +
        '• Controlar luzes, sons, automações\n\n' +
        
        '📱 *Pesquisa & Comunicacao* (3 comandos)\n' +
        '• `/google` - Pesquisa no Google, retorna links\n' +
        '• `/start` - Inicia o bot e mostra menu\n' +
        '• `/ajuda` - Mostra guia completo de uso\n\n' +
        
        '🧠 *Base de Conhecimento*\n' +
        '• `/conhecimento` - Busca na base de conhecimento\n' +
        '• `/kb:stats` - Mostra estatísticas da base\n\n' +
        
        '📊 *Info & Sistema* (2 comandos)\n' +
        '• `/skills` - Lista as 34 skills de IA disponíveis\n' +
        '• **Mensagem comum** - Qualquer texto é processado por IA\n\n' +
        
        '💡 *Ou envie qualquer texto para IA responder!*',
        { parse_mode: 'Markdown' }
      );
    });

    // Comando /ia - Mostrar comandos de IA
    this.bot.onText(/\/ia/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(chatId,
        '🧠 *IA & Criatividade*\n\n' +
        '`/gerar <texto>` - Criar conteúdo com IA\n' +
        '`/analisar <texto>` - Análise profunda\n' +
        '`/keywords <texto>` - Palavras-chave SEO\n' +
        '`/imagem <descrição>` - Gerar imagem\n' +
        '`/chat <mensagem>` - Chat com memória\n\n' +
        '💡 Exemplo: `/gerar uma receita de bolo`',
        { parse_mode: 'Markdown' }
      );
    });

    // Comando /utilidades - Mostrar ferramentas
    this.bot.onText(/\/utilidades/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(chatId,
        '🛠️ *Utilidades & Ferramentas*\n\n' +
        '`/traduzir <idioma> <texto>` - Traduzir\n' +
        '`/senha [tamanho]` - Gerar senha segura\n' +
        '`/morse <texto>` - Código Morse\n' +
        '`/noticias <assunto>` - Buscar notícias\n' +
        '`/falar <texto>` - Text-to-Speech\n' +
        '`/ocr` - Extrair texto de foto\n' +
        '`/email <dest|assunto|corpo>` - Enviar email\n' +
        '`/lembrete <msg> <tempo>` - Agendar\n' +
        '`/pdf <título>` - Gerar PDF\n' +
        '`/google <busca>` - Pesquisar\n\n' +
        '💡 Exemplo: `/traduzir en Hello world`',
        { parse_mode: 'Markdown' }
      );
    });

    // Comando /info - Sistema
    this.bot.onText(/\/info/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(chatId,
        '📊 *Sistema & Info*\n\n' +
        '`/skills` - Ver 34 skills de IA\n' +
        '`/conhecimento` - Buscar na base de conhecimento 🧠\n' +
        '`/ajuda` - Guia completo\n' +
        '`/start` - Voltar ao menu\n\n' +
        '💡 Exemplo: `/skills`',
        { parse_mode: 'Markdown' }
      );
    });

    // 🧠 Comando /conhecimento - Buscar na base de conhecimento
    this.bot.onText(/\/conhecimento (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const query = match[1];
      
      await this.bot.sendMessage(chatId, '🔍 Buscando na base de conhecimento...');
      
      try {
        const result = await knowledgeBase.answerQuestion(query);
        
        if (result.hasContext) {
          let response = `🧠 *Resposta da Base de Conhecimento:*\n\n${result.answer}`;
          
          if (result.sources && result.sources.length > 0) {
            response += `\n\n📚 *Fontes consultadas:* ${result.sources.length} documento(s)`;
          }
          
          await this.bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
        } else {
          await this.bot.sendMessage(chatId, 
            '❌ ' + result.answer + '\n\n' +
            '💡 *Dica:* Adicione documentos com `/knowledge:load`'
          );
        }
      } catch (error) {
        await this.bot.sendMessage(chatId, `❌ Erro: ${error.message}`);
      }
    });

    // 📊 Comando /kb:stats - Estatísticas da base
    this.bot.onText(/\/kb:stats/, async (msg) => {
      const chatId = msg.chat.id;
      
      try {
        const stats = await knowledgeBase.getStats();
        
        if (stats && !stats.error) {
          await this.bot.sendMessage(chatId,
            `📊 *Estatísticas da Base de Conhecimento:*\n\n` +
            `📚 Total de documentos: ${stats.totalDocuments}\n` +
            `🗃️ Coleção: ${stats.collectionName}\n` +
            `✅ Status: ${stats.initialized ? 'Inicializada' : 'Não inicializada'}`,
            { parse_mode: 'Markdown' }
          );
        } else {
          await this.bot.sendMessage(chatId, '❌ Base ainda não inicializada. Use `/conhecimento <pergunta>` primeiro.');
        }
      } catch (error) {
        await this.bot.sendMessage(chatId, `❌ Erro: ${error.message}`);
      }
    });

    // Comando /ajuda
    this.bot.onText(/\/ajuda/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(chatId,
        '📚 *Guia de Uso do Moltbot*\n\n' +
        '*Geração de Conteúdo:*\n' +
        '/gerar <seu texto> - Cria conteúdo criativo\n' +
        '/imagem <descrição> - Gera imagem com IA 🎨\n\n' +
        '*Análise:*\n' +
        '/analisar <texto> - Análise profunda\n' +
        '/keywords <texto> - Palavras-chave SEO\n\n' +
        '*Sistema:*\n' +
        '/skills - Ver todas as 34 skills\n' +
        '/start - Reiniciar bot\n\n' +
        '💡 Você também pode apenas enviar texto diretamente!',
        { parse_mode: 'Markdown' }
      );
    });

    // Comando /gerar
    this.bot.onText(/\/gerar (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const text = match[1];
      
      await this.bot.sendMessage(chatId, '⚡ Gerando conteúdo...');
      
      try {
        if (!this.mcpClient) {
          await this.connectMCP();
        }

        const result = await this.mcpClient.callTool({
          name: 'olympia_reasoning',
          arguments: { prompt: `Crie um conteúdo de qualidade sobre: ${text}\n\nSeja criativo, preciso e útil.` }
        });

        const response = result.content[0].text;
        await this.bot.sendMessage(chatId, response);
      } catch (error) {
        await this.bot.sendMessage(chatId, `❌ Erro: ${error.message}`);
      }
    });

    // Comando /analisar
    this.bot.onText(/\/analisar (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const text = match[1];
      
      await this.bot.sendMessage(chatId, '🔍 Analisando...');
      
      try {
        if (!this.mcpClient) {
          await this.connectMCP();
        }

        const result = await this.mcpClient.callTool({
          name: 'olympia_reasoning',
          arguments: { prompt: `Faça uma análise LÓGICA e PRECISA do seguinte:\n\n${text}\n\nSeja objetivo, cite fatos e evite especulações.` }
        });

        const response = result.content[0].text;
        await this.bot.sendMessage(chatId, response);
      } catch (error) {
        await this.bot.sendMessage(chatId, `❌ Erro: ${error.message}`);
      }
    });

    // Comando /keywords
    this.bot.onText(/\/keywords (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const text = match[1];
      
      await this.bot.sendMessage(chatId, '🔑 Extraindo keywords SEO...');
      
      try {
        if (!this.mcpClient) {
          await this.connectMCP();
        }

        const result = await this.mcpClient.callTool({
          name: 'olympia_reasoning',
          arguments: { prompt: `Extraia APENAS as palavras-chave SEO mais importantes deste texto. Liste em ordem de relevância:\n\n${text}\n\nFormato: "palavra-chave (relevância: alta/média/baixa)"` }
        });

        const response = result.content[0].text;
        await this.bot.sendMessage(chatId, `🎯 *Keywords SEO:*\n\n${response}`, { parse_mode: 'Markdown' });
      } catch (error) {
        await this.bot.sendMessage(chatId, `❌ Erro: ${error.message}`);
      }
    });

    // Comando /skills
    this.bot.onText(/\/skills/, (msg) => {
      const chatId = msg.chat.id;
      const skillsList = AVAILABLE_SKILLS.map((skill, i) => `${i + 1}. ${skill}`).join('\n');
      this.bot.sendMessage(chatId, 
        `🎯 *Skills Disponíveis (${AVAILABLE_SKILLS.length}):*\n\n${skillsList}\n\n💡 Use /gerar para testar!`,
        { parse_mode: 'Markdown' }
      );
    });

    // Comando /imagem - Gerar imagem com Stable Diffusion
    this.bot.onText(/\/imagem (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const prompt = match[1];
      
      await this.bot.sendMessage(chatId, '🎨 Gerando imagem... Isso pode levar 30-60 segundos.');
      
      try {
        // Usando Pollinations.ai (API gratuita e estável)
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`;
        
        // Baixar a imagem
        const response = await fetch(imageUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const imageBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(imageBuffer);

        // Enviar imagem
        await this.bot.sendPhoto(chatId, buffer, {
          caption: `🎨 Imagem gerada: "${prompt}"\n\n⚡ Powered by Pollinations.ai`
        });
      } catch (error) {
        console.error('Erro ao gerar imagem:', error);
        await this.bot.sendMessage(chatId, 
          `❌ Erro ao gerar imagem: ${error.message}\n\n` +
          `💡 Tente novamente ou use uma descrição diferente!`
        );
      }
    });

    // Comando /google - Pesquisar no Google
    this.bot.onText(/\/google (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const query = match[1];
      
      await this.bot.sendMessage(chatId, `🔍 Pesquisando no Google: "${query}"...`);
      
      try {
        // Usar API do Google Custom Search (ou DuckDuckGo como alternativa gratuita)
        const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        
        // Retornar link direto
        await this.bot.sendMessage(chatId, 
          `🔎 Resultados da pesquisa:\n\n` +
          `🌐 Google: ${googleUrl}\n\n` +
          `Clique no link acima para ver os resultados!`
        );
      } catch (error) {
        await this.bot.sendMessage(chatId, `❌ Erro ao pesquisar: ${error.message}`);
      }
    });

    // Comando /email - Enviar email (não bloqueante)
    this.bot.onText(/\/email (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const params = match[1];
      
      // Formato: /email destinatario@email.com | Assunto | Mensagem
      const parts = params.split('|').map(p => p.trim());
      
      if (parts.length < 3) {
        await this.bot.sendMessage(chatId, 
          '❌ Formato incorreto!\n\n' +
          'Use: /email destinatario@email.com | Assunto | Mensagem\n\n' +
          'Exemplo:\n' +
          '/email joao@exemplo.com | Reunião | Olá, confirmo presença na reunião.'
        );
        return;
      }

      const [to, subject, text] = parts;
      
      await this.bot.sendMessage(chatId, `📧 Enviando email para ${to}...`);
      
      // Enviar de forma não bloqueante com timeout
      this.sendEmailAsync(chatId, to, subject, text);
    });
    
  }

  // Helper para enviar email sem travar o bot
  async sendEmailAsync(chatId, to, subject, text) {
    try {
      // Criar transporter com timeout
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: EMAIL_CONFIG.user,
          pass: EMAIL_CONFIG.pass
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
      });

      // Timeout de 15 segundos
      const sendWithTimeout = Promise.race([
        transporter.sendMail({
          from: `"Moltbot" <${EMAIL_CONFIG.user}>`,
          to: to,
          subject: subject,
          text: text,
          html: `<p>${text.replace(/\n/g, '<br>')}</p>`
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: Email demorou mais de 15s')), 15000)
        )
      ]);

      const info = await sendWithTimeout;

      await this.bot.sendMessage(chatId, 
        `✅ Email enviado!\n\n` +
        `📬 Para: ${to}\n` +
        `📋 Assunto: ${subject}\n` +
        `📝 ID: ${info.messageId}`
      );
    } catch (error) {
      await this.bot.sendMessage(chatId, 
        `❌ Erro: ${error.message}\n\n` +
        `💡 Verifique:\n` +
        `- Conexão com internet\n` +
        `- EMAIL_USER e EMAIL_PASSWORD no .env\n` +
        `- Use senha de app do Gmail`
      );
    }

    // Comando /faceswap - Desabilitado temporariamente (requer model válido no Replicate)
    this.bot.onText(/\/faceswap/, async (msg) => {
      const chatId = msg.chat.id;
      
      await this.bot.sendMessage(chatId,
        `🔄 *Face Swap - Em Desenvolvimento*\n\n` +
        `Este comando está temporariamente desabilitado.\n\n` +
        `Alternativa: Use os comandos funcionando:\n` +
        `/imagem - Gerar imagens\n` +
        `/gerar - Gerar textos com IA\n\n` +
        `Status: Aguardando validação de model do Replicate 🔧`,
        { parse_mode: 'Markdown' }
      );
    });

    // 1️⃣ Comando /traduzir - Tradução de Textos
    this.bot.onText(/\/traduzir (\w+) (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const idioma = match[1];
      const texto = match[2];

      try {
        const res = await translate({ text: texto, to: idioma });
        await this.bot.sendMessage(chatId, `🌍 Tradução para ${idioma.toUpperCase()}:\n\n${res.text}`);
      } catch (error) {
        await this.bot.sendMessage(chatId, `❌ Erro: ${error.message}\n\nUse: /traduzir pt Hello world`);
      }
    });

    // 6️⃣ Comando /senha - Gerador de Senhas Seguras
    this.bot.onText(/\/senha(\s(\d+))?/, async (msg, match) => {
      const chatId = msg.chat.id;
      const comprimento = match[2] ? parseInt(match[2]) : 16;

      if (comprimento < 8 || comprimento > 128) {
        await this.bot.sendMessage(chatId, '❌ Comprimento deve estar entre 8 e 128');
        return;
      }

      const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let senha = '';
      for (let i = 0; i < comprimento; i++) {
        senha += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
      }

      await this.bot.sendMessage(chatId, `🔐 Senha Gerada (${comprimento} caracteres):\n\n\`\`\`\n${senha}\n\`\`\``);
    });

    // 7️⃣ Comando /morse - Conversor de Texto
    this.bot.onText(/\/morse (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const texto = match[1].toUpperCase();

      const morseCode = {
        'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
        'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
        'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
        'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
        'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
        '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
        '8': '---..', '9': '----.', '.': '.-.-.-', ',': '--..--', ' ': '/'
      };

      let resultado = '';
      for (let char of texto) {
        resultado += (morseCode[char] || char) + ' ';
      }

      await this.bot.sendMessage(chatId, `🔤 Código Morse:\n\n\`\`\`\n${resultado.trim()}\n\`\`\``);
    });

    // 13️⃣ Comando /noticias - Notícias
    this.bot.onText(/\/noticias (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const assunto = match[1];

      await this.bot.sendMessage(chatId, '📰 Buscando notícias...');

      try {
        const response = await axios.get(NEWS_API_URL, {
          params: {
            q: assunto,
            sortBy: 'publishedAt',
            pageSize: 5,
            language: 'pt'
          },
          timeout: 5000
        });

        if (response.data.articles.length === 0) {
          await this.bot.sendMessage(chatId, '❌ Nenhuma notícia encontrada');
          return;
        }

        let noticias = `📰 Notícias sobre "${assunto}":\n\n`;
        response.data.articles.slice(0, 3).forEach((article, i) => {
          noticias += `${i + 1}. ${article.title}\n📌 ${article.url}\n\n`;
        });

        await this.bot.sendMessage(chatId, noticias);
      } catch (error) {
        await this.bot.sendMessage(chatId, `❌ Erro: API de notícias indisponível\n\nUse: /noticias tecnologia`);
      }
    });

    // 15️⃣ Comando /falar - Text-to-Speech
    this.bot.onText(/\/falar (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const texto = match[1];

      await this.bot.sendMessage(chatId, '🔊 Gerando áudio...');

      try {
        const filename = `/tmp/tts_${Date.now()}.mp3`;
        const tts = new gtts.gTTS(texto, 'pt');
        
        tts.save(filename, async () => {
          const audioBuffer = fs.readFileSync(filename);
          await this.bot.sendAudio(chatId, audioBuffer, {}, { filename: 'audio.mp3' });
          fs.unlinkSync(filename);
        });
      } catch (error) {
        await this.bot.sendMessage(chatId, `❌ Erro: ${error.message}`);
      }
    });

    // 16️⃣ Comando /ocr - Extrair Texto de Imagens
    this.bot.onText(/\/ocr/, async (msg) => {
      const chatId = msg.chat.id;
      
      await this.bot.sendMessage(chatId, 
        '📸 *OCR - Extração de Texto de Imagens*\n\n' +
        'Para extrair texto de uma imagem, simplesmente *envie a foto*.\n\n' +
        'O bot irá extrair todo o texto visível na imagem automaticamente.\n\n' +
        '💡 Dica: Funciona melhor com imagens claras e texto legível.',
        { parse_mode: 'Markdown' }
      );
    });

    // Processamento automático de fotos para OCR
    this.bot.on('photo', async (msg) => {
      const chatId = msg.chat.id;
      const photoId = msg.photo[msg.photo.length - 1].file_id;

      // Ignorar se já é processamento de face swap
      if (conversations[chatId]?.waitingForFaceswapPhoto) return;

      await this.bot.sendMessage(chatId, '📸 Processando imagem para OCR...');

      try {
        const fileInfo = await this.bot.getFile(photoId);
        const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${fileInfo.file_path}`;
        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        
        // Usar caminho correto para o SO
        const tmpDir = process.platform === 'win32' ? process.env.TEMP || '.\\temp' : '/tmp';
        const imagePath = path.join(tmpDir, `ocr_${Date.now()}.jpg`);
        
        fs.writeFileSync(imagePath, response.data);

        const worker = await createWorker('por');
        const { data: { text } } = await worker.recognize(imagePath);
        await worker.terminate();

        await this.bot.sendMessage(chatId, `📖 *Texto extraído:*\n\n${text || 'Nenhum texto encontrado'}`, { parse_mode: 'Markdown' });
        
        try {
          fs.unlinkSync(imagePath);
        } catch (e) {}
      } catch (error) {
        await this.bot.sendMessage(chatId, `❌ Erro OCR: ${error.message}`);
      }
    });

    // 17️⃣ Comando /grafico - Gráficos
    this.bot.onText(/\/grafico (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;

      await this.bot.sendMessage(chatId, 
        `📊 Gerador de Gráficos\n\n` +
        `Formato: /grafico valores,valores valores,valores (separar series por |)\n\n` +
        `Exemplo:\n` +
        `/grafico 10,20,30 Janeiro,Fevereiro,Março`
      );
    });

    // 18️⃣ Comando /chat - Chatbot com Memória e Contexto
    this.bot.onText(/\/chat (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const mensagem = match[1];

      if (!conversations[chatId]) {
        conversations[chatId] = [];
      }

      conversations[chatId].push({ role: 'user', content: mensagem });

      try {
        if (!this.mcpClient) {
          await this.connectMCP();
        }

        // Construir histórico com melhor formato
        const historicoTexto = conversations[chatId]
          .slice(-10) // Últimas 10 mensagens
          .map(m => `${m.role === 'user' ? 'Você' : 'OlympIA'}: ${m.content}`)
          .join('\n');
          
        const prompt = `Você é OlympIA ⚡, um assistente inteligente e preciso.\n\nHistórico da conversa:\n${historicoTexto}\n\nResponda de forma natural, lógica e sem alucinar.`;
        
        const result = await this.mcpClient.callTool({
          name: 'olympia_reasoning',
          arguments: { prompt: prompt }
        });

        const resposta = result.content[0].text;
        conversations[chatId].push({ role: 'assistant', content: resposta });

        // Manter apenas últimas 20 mensagens
        if (conversations[chatId].length > 20) {
          conversations[chatId] = conversations[chatId].slice(-20);
        }

        await this.bot.sendMessage(chatId, resposta);
      } catch (error) {
        await this.bot.sendMessage(chatId, `❌ Erro: ${error.message}`);
      }
    });

    // 19️⃣ Comando /lembrete - Agendador (não trava mais)
    this.bot.onText(/\/lembrete (.+) (\d+)([mhd])/, async (msg, match) => {
      const chatId = msg.chat.id;
      const mensagem = match[1];
      const valor = parseInt(match[2]);
      const unidade = match[3];

      // Calcular tempo
      let ms = 0;
      let nome = '';
      if (unidade === 'm') {
        ms = valor * 60 * 1000;
        nome = valor === 1 ? 'minuto' : 'minutos';
      } else if (unidade === 'h') {
        ms = valor * 60 * 60 * 1000;
        nome = valor === 1 ? 'hora' : 'horas';
      } else if (unidade === 'd') {
        ms = valor * 24 * 60 * 60 * 1000;
        nome = valor === 1 ? 'dia' : 'dias';
      }

      // Máximo 7 dias
      if (ms > 7 * 24 * 60 * 60 * 1000) {
        await this.bot.sendMessage(chatId, '❌ Máximo: 7 dias!\n\nExemplo: /lembrete estudar 3h');
        return;
      }

      // Agendar (não bloqueante)
      const lembreteId = `${chatId}_${Date.now()}`;
      const timeoutId = setTimeout(() => {
        this.bot.sendMessage(chatId, 
          `⏰ *LEMBRETE*\n\n📝 ${mensagem}`,
          { parse_mode: 'Markdown' }
        ).catch(err => console.error('Erro lembrete:', err));
        delete reminders[lembreteId];
      }, ms);

      reminders[lembreteId] = { timeoutId, mensagem, tempo: `${valor}${unidade}` };

      const quando = new Date(Date.now() + ms);
      await this.bot.sendMessage(chatId, 
        `✅ *Lembrete agendado!*\n\n` +
        `📝 ${mensagem}\n` +
        `⏱️ ${valor} ${nome}\n` +
        `🕐 ${quando.toLocaleString('pt-BR')}`,
        { parse_mode: 'Markdown' }
      );
    });

    // Mensagens gerais (sem comando)
    this.bot.on('message', async (msg) => {
      // Ignora se for um comando
      if (msg.text && msg.text.startsWith('/')) {
        return;
      }

      const chatId = msg.chat.id;
      const text = msg.text;

      if (!text) return;

      await this.bot.sendMessage(chatId, '⚡ Processando sua mensagem...');

      try {
        if (!this.mcpClient) {
          await this.connectMCP();
        }

        // Sistema de detecção de contexto para sugerir comandos
        let prompt = text;
        let sugestao = '';
        
        if (text.toLowerCase().includes('gerar') || text.toLowerCase().includes('criar')) {
          sugestao = '\n\n💡 *Dica:* Use `/gerar` para criar conteúdo específico!';
        } else if (text.toLowerCase().includes('pesquisa') || text.toLowerCase().includes('buscar')) {
          sugestao = '\n\n💡 *Dica:* Use `/google <busca>` para pesquisar na internet!';
        } else if (text.toLowerCase().includes('traduzir')) {
          sugestao = '\n\n💡 *Dica:* Use `/traduzir <idioma> <texto>` para traduzir!';
        } else if (text.toLowerCase().includes('imagem') || text.toLowerCase().includes('desenho')) {
          sugestao = '\n\n💡 *Dica:* Use `/imagem <descrição>` para gerar imagens!';
        } else if (text.toLowerCase().includes('análise')) {
          sugestao = '\n\n💡 *Dica:* Use `/analisar <texto>` para análise profunda!';
        }
        
        const result = await this.mcpClient.callTool({
          name: 'olympia_reasoning',
          arguments: { prompt: prompt }
        });

        const response = result.content[0].text;
        await this.bot.sendMessage(chatId, response + sugestao);
      } catch (error) {
        await this.bot.sendMessage(chatId, `❌ Erro: ${error.message}`);
      }
    });

    // ============================================
    // NOVOS COMANDOS: CASA INTELIGENTE & PDF
    // ============================================

    // Comando /casa - Controlar dispositivos IoT via Home Assistant
    this.bot.onText(/\/casa (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const comando = match[1];

      if (!homeAutomation.isConfigured()) {
        await this.bot.sendMessage(chatId, 
          '⚠️ Casa inteligente não configurada!\n\n' +
          'Configure em .env:\n' +
          '- HOME_ASSISTANT_URL\n' +
          '- HOME_ASSISTANT_TOKEN\n\n' +
          'Use /casastatus para listar dispositivos'
        );
        return;
      }

      // Interpretar comando
      const parsed = homeAutomation.parseCommand(comando);
      const resultado = await homeAutomation.executeCommand(parsed);

      if (resultado.error) {
        await this.bot.sendMessage(chatId, resultado.error);
      } else if (resultado.success) {
        let mensagem = resultado.message;
        if (resultado.unit) {
          mensagem += ` ${resultado.value} ${resultado.unit}`;
        }
        await this.bot.sendMessage(chatId, mensagem);
      }
    });

    // Comando /casastatus - Listar todos os dispositivos
    this.bot.onText(/\/casastatus/, async (msg) => {
      const chatId = msg.chat.id;

      if (!homeAutomation.isConfigured()) {
        await this.bot.sendMessage(chatId, '⚠️ Home Assistant não configurado');
        return;
      }

      await this.bot.sendMessage(chatId, '🏠 Buscando dispositivos...');

      try {
        const devices = await homeAutomation.listDevices();
        
        if (devices.error) {
          await this.bot.sendMessage(chatId, devices.error);
          return;
        }

        let msg = `🏠 *Dispositivos Home Assistant* (${devices.total} total)\n\n`;
        
        if (devices.devices.lights.length > 0) {
          msg += `💡 *Luzes* (${devices.devices.lights.length}):\n`;
          devices.devices.lights.slice(0, 5).forEach(light => {
            msg += `  • ${light.name}: ${light.state}\n`;
          });
          msg += '\n';
        }

        if (devices.devices.media_players.length > 0) {
          msg += `🔊 *Speakers/Sonos* (${devices.devices.media_players.length}):\n`;
          devices.devices.media_players.forEach(player => {
            msg += `  • ${player.name}: ${player.state}\n`;
          });
          msg += '\n';
        }

        if (devices.devices.sensors.length > 0) {
          msg += `📊 *Sensores* (${devices.devices.sensors.length}):\n`;
          devices.devices.sensors.slice(0, 5).forEach(sensor => {
            msg += `  • ${sensor.name}: ${sensor.state}\n`;
          });
        }

        msg += '\n📝 Use: /casa ligar <nome>\n/casa desligar <nome>\n/casa cena <nome>';
        
        await this.bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
      } catch (error) {
        await this.bot.sendMessage(chatId, `❌ Erro: ${error.message}`);
      }
    });

    // Comando /pdf - Gerar PDF
    this.bot.onText(/\/pdf (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const titulo = match[1];

      try {
        // Usar caminho do sistema operacional (Windows ou Linux)
        const tmpDir = process.platform === 'win32' ? process.env.TEMP || '.\\temp' : '/tmp';
        const pdfPath = path.join(tmpDir, `documento_${Date.now()}.pdf`);
        
        // Garantir que o diretório existe
        const dir = path.dirname(pdfPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        const doc = new PDFDocument({
          size: 'A4',
          margin: 50
        });

        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);

        // Conteúdo do PDF
        doc.fontSize(24).text(titulo, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Gerado por OlympIA Bot`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Data: ${new Date().toLocaleString('pt-BR')}`);
        doc.moveDown();

        doc.fontSize(14).text('Informações do Documento:', { underline: true });
        doc.moveDown();
        doc.fontSize(10);
        doc.text(`• Título: ${titulo}`);
        doc.text(`• Gerado automaticamente via Telegram Bot`);
        doc.text(`• Formato: PDF A4`);
        doc.text(`• Encoding: UTF-8`);

        doc.end();

        await new Promise((resolve, reject) => {
          stream.on('finish', resolve);
          stream.on('error', reject);
        });

        // Enviar arquivo
        await this.bot.sendDocument(chatId, pdfPath);

        // Limpar arquivo
        try {
          fs.unlinkSync(pdfPath);
        } catch (e) {
          // Ignorar erro ao deletar
        }

        await this.bot.sendMessage(chatId, '✅ PDF gerado com sucesso!');
      } catch (error) {
        await this.bot.sendMessage(chatId, `❌ Erro ao gerar PDF: ${error.message}`);
      }
    });

    // Comando /casaajuda - Mostrar ajuda de casa inteligente
    this.bot.onText(/\/casaajuda/, async (msg) => {
      const chatId = msg.chat.id;
      await this.bot.sendMessage(chatId,
        '🏠 *Casa Inteligente (Home Assistant)*\n\n' +
        '*Comandos disponíveis:*\n' +
        '`/casa ligar sala` - Liga luz da sala\n' +
        '`/casa desligar quarto` - Desliga luz do quarto\n' +
        '`/casa alternar cozinha` - Alterna luz da cozinha\n' +
        '`/casa cena cinema` - Ativa cena cinema\n' +
        '`/casa volume sonos 50` - Seta volume do Sonos\n' +
        '`/casa sensor temperatura_sala` - Lê sensor\n' +
        '`/casastatus` - Lista todos os dispositivos\n\n' +
        '*Exemplos reais:*\n' +
        '`/casa ligar lampada_mesa`\n' +
        '`/casa desligar ar_condicionado`\n' +
        '`/casa cena dormir`\n' +
        '`/casa volume speaker_quarto 30`',
        { parse_mode: 'Markdown' }
      );
    });

    console.log('🤖 Bot do Telegram iniciado!');
    console.log('⚠️  Certifique-se de ter configurado o TELEGRAM_TOKEN');
  }

  async start() {
    await this.connectMCP();
    console.log('✅ ⚡ OlympIA está rodando!');
    console.log('📱 Envie /start no seu bot do Telegram para começar');
  }
}

// Iniciar bot
const bot = new TelegramOlympIA();
bot.start().catch(console.error);
