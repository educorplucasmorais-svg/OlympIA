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
import { 
  initializeDatabase, 
  getUserByChatId, 
  getAllUsers, 
  getUserStats,
  exportDatabaseAsJSON,
  getUserLoginHistory,
  registerInteractionLog,
  getUserInteractionLogs,
  getAllInteractionLogs,
  getUserUsageStats,
  getBehaviorAnalysis
} from './database.js';

// 🚀 OTIMIZAÇÕES - Performance e Proteção
import {
  kbCache,
  statsCache,
  translationCache,
  initMCPPool,
  kbRateLimiter,
  OPTIMIZATION_FLAGS,
  logPerformance,
  cachedWithProtection,
  safeMCPCall,
  printStatus
} from './optimization-config.js';

// 👑 ADMINISTRAÇÃO - Painel Exclusivo para Admins
import { setupAdminInfoCommand, isAdmin } from './admin-commands.js';
import { initializeDailyReportSchedule, generateReportOnDemand } from './daily-report.js';
import adminSecurity from './admin-security.js';

// 🏥 MONITORAMENTO - Health Check 24/7
import { startHealthMonitoring, getHealthStatus } from './health-monitor.js';

// 💬 CONVERSAS INTERATIVAS - Diálogos humanizados
import ConversationManager from './conversation-manager.js';

// Carregar variáveis de ambiente
dotenv.config();

// ⚠️ CONFIGURAÇÃO VIA .env FILE (MAIS SEGURO)
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '8426049953:AAEuswuXhwEp-JUJNNYNwos8qd69Df4egeI';
const ADMIN_CHAT_IDS = (process.env.ADMIN_CHAT_IDS || '')
  .split(',')
  .map((id) => parseInt(id.trim(), 10))
  .filter((id) => Number.isInteger(id));

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
const chatModes = {}; // Configuração de chat contextual por usuário
const reminders = {};
const userFavorites = {}; // Favoritos dos usuários

// 🔥 HOT COMMANDS - Mais Utilizados
const HOT_COMMANDS = [
  { name: '/gerar', emoji: '🔥✨', desc: 'Gerar conteúdo criativo com IA', category: 'IA' },
  { name: '/imagem', emoji: '🔥🎨', desc: 'Gerar imagem 1024x1024px', category: 'IA' },
  { name: '/pdf', emoji: '🔥📄', desc: 'Gerar PDF com conteúdo', category: 'Utilidades' },
  { name: '/promocao', emoji: '🔥📢', desc: '5 posts prontos para redes sociais', category: 'Marketing' },
  { name: '/email', emoji: '🔥📧', desc: 'Enviar email via Gmail', category: 'Utilidades' },
  { name: '/marketing', emoji: '🔥📊', desc: 'Estratégia SEO e Marketing', category: 'Marketing' },
  { name: '/conhecimento', emoji: '🔥🧠', desc: 'Busca na base de conhecimento com RAG', category: 'IA' },
  { name: '/chat', emoji: '🔥💬', desc: 'Chat com memória de contexto', category: 'IA' }
];

// 🎨 ÍCONES CUSTOMIZADOS - Humanizados para cada comando
const COMMAND_ICONS = {
  '/gerar': '⚡️✍️',      // Relâmpago + Escrita (Criação rápida)
  '/analisar': '🔍📊',    // Lupa + Gráfico (Análise profunda)
  '/keywords': '🎯🔑',    // Alvo + Chave (Keywords estratégicas)
  '/imagem': '🎭🖼️',      // Máscara + Quadro (Criatividade visual)
  '/chat': '💭🤖',        // Pensamento + IA (Conversação inteligente)
  '/traduzir': '🌍🗣️',    // Mundo + Fala (Tradução global)
  '/senha': '🔐🛡️',       // Cadeado + Escudo (Segurança)
  '/morse': '📡⚙️',       // Antena + Engrenagem (Código técnico)
  '/noticias': '📰🌟',    // Jornal + Estrela (Notícias fresquinhas)
  '/falar': '🎙️🔊',      // Microfone + Som (Áudio)
  '/ocr': '📸👁️',        // Câmera + Olho (Visão)
  '/email': '✉️💌',       // Carta + Amor (Mensagem pessoal)
  '/lembrete': '⏰🔔',    // Relógio + Sino (Alerta)
  '/pdf': '📋✔️',         // Documento + OK (Profissional)
  '/google': '🔎🌐',      // Busca + Internet (Pesquisa)
  '/conhecimento': '📚💡', // Livro + Ideia (Conhecimento)
  '/kb:stats': '📈🎲',    // Gráfico + Dados (Estatísticas)
  '/marketing': '🎯💰',   // Alvo + Dinheiro (Estratégia)
  '/promocao': '🎉🎁',    // Festa + Presente (Promoção)
  '/social': '👥🌐',      // Povo + Rede (Social)
  '/vip': '👑⭐',         // Coroa + Estrela (VIP Premium)
  '/favoritos': '💖🌹',   // Coração + Rosa (Favoritos)
  '/skills': '🧩🎓',      // Quebra-cabeça + Diploma (Skills)
  '/start': '🚀🎯',       // Foguete + Alvo (Início)
  '/ajuda': '🤝📖',       // Mãos + Manual (Ajuda)
  '/ia': '🤖💭',          // IA + Pensamento
  '/utilidades': '🛠️⚙️',  // Ferramentas + Engrenagem
  '/info': '📱ℹ️',        // Telefone + Info
  '/casa': '🏠💡'         // Casa + Lâmpada (Smart Home)
};

class TelegramOlympIA {
  constructor() {
    this.bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
    this.mcpClient = null;
    this.mcpPool = null; // Pool para reusar conexões
    this.conversations = new ConversationManager(); // Gerenciador de conversas
    this.userFavorites = {}; // Favoritos dos usuários
    
    // Inicializar banco de dados
    initializeDatabase();
    
    this.setupBot();
    this.setupInteractionLogging();
    this.setupConnectionRecovery();
  }

  /**
   * CONFIGURAR RECUPERAÇÃO DE CONEXÃO PARA EVITAR ERROS 409
   */
  setupConnectionRecovery() {
    // Handler para erros de polling
    this.bot.on('polling_error', (error) => {
      console.log('🔄 Polling error detectado:', error.code, error.message);

      if (error.code === 'ETELEGRAM' && error.message.includes('409')) {
        console.log('⚠️ Conflito de polling detectado. Tentando reconectar...');

        // Parar polling atual
        this.bot.stopPolling();

        // Aguardar um pouco e reconectar
        setTimeout(() => {
          console.log('🔄 Tentando reconectar...');
          this.bot.startPolling();
        }, 5000);
      }
    });

    // Handler para desconexões
    this.bot.on('webhook_error', (error) => {
      console.log('🔄 Webhook error:', error.message);
    });

    // Ping periódico para manter conexão ativa
    setInterval(() => {
      try {
        // Pequeno teste de conectividade
        this.bot.getMe().catch(err => {
          console.log('⚠️ Erro no teste de conectividade:', err.message);
        });
      } catch (error) {
        console.log('⚠️ Erro no ping de conectividade');
      }
    }, 300000); // A cada 5 minutos
  }

  /**
   * CONFIGURAR LOGGING DE INTERAÇÕES COMPLETAS
   */
  setupInteractionLogging() {
    // Middleware para interceptar TODAS as mensagens
    this.bot.on('message', async (msg) => {
      const startTime = Date.now();
      const chatId = msg.chat.id;
      const user = getUserByChatId(chatId);

      if (!user) return; // Usuário não cadastrado, não logar

      try {
        // Determinar tipo de mensagem
        let messageType = 'text';
        let content = msg.text || '';
        let commandName = null;
        let hasMedia = false;
        let mediaType = null;

        if (msg.photo) {
          messageType = 'photo';
          hasMedia = true;
          mediaType = 'photo';
          content = '[Foto enviada]';
        } else if (msg.document) {
          messageType = 'document';
          hasMedia = true;
          mediaType = msg.document.mime_type || 'document';
          content = `[Documento: ${msg.document.file_name}]`;
        } else if (msg.sticker) {
          messageType = 'sticker';
          hasMedia = true;
          mediaType = 'sticker';
          content = '[Sticker]';
        } else if (msg.voice) {
          messageType = 'voice';
          hasMedia = true;
          mediaType = 'voice';
          content = '[Mensagem de voz]';
        } else if (msg.video) {
          messageType = 'video';
          hasMedia = true;
          mediaType = 'video';
          content = '[Vídeo]';
        } else if (msg.audio) {
          messageType = 'audio';
          hasMedia = true;
          mediaType = 'audio';
          content = `[Áudio: ${msg.audio.title || 'Sem título'}]`;
        } else if (content.startsWith('/')) {
          messageType = 'command';
          commandName = content.split(' ')[0].substring(1); // Extrair nome do comando
        }

        // Verificar se está em conversa
        const inConversation = this.conversations.isInConversation(chatId);
        let conversationContext = null;
        if (inConversation) {
          const conv = this.conversations.getConversation(chatId);
          conversationContext = conv ? conv.currentStep : null;
        }

        // Registrar a interação
        const interactionData = {
          userId: user.id,
          chatId: chatId,
          messageType: messageType,
          content: content,
          commandName: commandName,
          inConversation: inConversation,
          conversationContext: conversationContext,
          messageLength: content.length,
          hasMedia: hasMedia,
          mediaType: mediaType,
          userAgent: msg.from ? `Telegram User ${msg.from.id}` : null
        };

        // Registrar log (faremos update do response_time depois)
        registerInteractionLog(interactionData);

      } catch (error) {
        console.error('Erro ao registrar log de interação:', error);
      }
    });

    // Middleware para atualizar tempo de resposta após envio de mensagens
    const originalSendMessage = this.bot.sendMessage;
    this.bot.sendMessage = async function(chatId, text, options) {
      const responseStart = Date.now();
      try {
        const result = await originalSendMessage.call(this, chatId, text, options);
        const responseTime = Date.now() - responseStart;

        // Atualizar o último log de interação com o tempo de resposta
        // (Isso é uma simplificação - em produção seria melhor ter um ID de transação)
        return result;
      } catch (error) {
        // Registrar erro na interação
        const user = getUserByChatId(chatId);
        if (user) {
          registerInteractionLog({
            userId: user.id,
            chatId: chatId,
            messageType: 'system_response',
            content: '[Erro na resposta]',
            status: 'error',
            errorDetails: error.message
          });
        }
        throw error;
      }
    };
  }

  async connectMCP() {
    // Se já temos pool, reusar
    if (this.mcpPool && OPTIMIZATION_FLAGS.enableMCPPool) {
      return true;
    }

    try {
      console.log('🔄 Tentando conectar ao MCP Server...');

      // Timeout de 10 segundos para evitar travamento
      const connectionPromise = new Promise(async (resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('MCP connection timeout after 10s'));
        }, 10000);

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
          clearTimeout(timeout);

          // ✨ Inicializar connection pool para reusar
          if (OPTIMIZATION_FLAGS.enableMCPPool) {
            this.mcpPool = initMCPPool(async () => {
              const newTransport = new StdioClientTransport({
                command: 'node',
                args: ['index.js']
              });

              const client = new Client({
                name: 'telegram-olympia-client',
                version: '1.0.0'
              }, {
                capabilities: {}
              });

              await client.connect(newTransport);
              return client;
            });
          }

          console.log('✅ Conectado ao OlympIA MCP Server');
          if (OPTIMIZATION_FLAGS.enableMCPPool) {
            console.log('✅ Connection Pool MCP inicializado - conexões serão reutilizadas');
          }
          resolve(true);
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
        }
      });

      await connectionPromise;
      return true;

    } catch (error) {
      console.log('⚠️ MCP Server não disponível:', error.message);
      console.log('🔄 Continuando sem MCP - funcionalidades limitadas');

      // Bot continua funcionando mesmo sem MCP
      this.mcpClient = null;
      this.mcpPool = null;

      return false;
    }
  }

  // Variável para armazenar comandos hot (atualizada às 05:00)
  hotCommands = HOT_COMMANDS.map(cmd => cmd.name);

  async setupBot() {
    // Comando /start - Sem sistema de login
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const displayName = msg.from?.first_name || 'amigo';
      const admin = await isAdmin(chatId);
      if (admin) {
        return this.showAdminMenu(chatId, displayName);
      }
      return this.showUserMenu(chatId, displayName);
    });

    // Comando oculto /meu-id - Mostra seu chat ID
    this.bot.onText(/\/meu-id/, async (msg) => {
      const chatId = msg.chat.id;
      return this.bot.sendMessage(chatId, `🆔 Seu Chat ID é: \`${chatId}\``, { parse_mode: 'Markdown' });
    });

    // Comando oculto /admin (não aparece nos menus)
    this.bot.onText(/\/admin$/, async (msg) => {
      const chatId = msg.chat.id;
      const displayName = msg.from?.first_name || 'admin';
      const admin = await isAdmin(chatId);
      if (!admin) {
        return this.bot.sendMessage(chatId, '🔐 Acesso negado.');
      }
      return this.showAdminMenu(chatId, displayName);
    });

    // Comando /relatorio - Inicia diálogo interativo
    this.bot.onText(/\/relatorio/, async (msg) => {
      const chatId = msg.chat.id;
      const admin = await isAdmin(chatId);
      if (!admin) {
        return this.bot.sendMessage(chatId, '🔐 Acesso negado.');
      }

      // Verificar se usuário já está em conversas
      if (this.conversations.isInConversation(chatId)) {
        return this.bot.sendMessage(chatId, '⏳ Você já tem um diálogo em andamento. Responda primeiro!');
      }

      // Inicia novo diálogo
      const firstQuestion = this.conversations.startConversation(chatId, 'relatorio');
      if (firstQuestion) {
        const tip = firstQuestion.tip ? `\n\n💡 ${firstQuestion.tip}` : '';
        await this.bot.sendMessage(chatId, firstQuestion.text + tip);
      }
    });

    // Comando oculto /relatorios - Lista relatórios salvos
    this.bot.onText(/\/relatorios/, async (msg) => {
      const chatId = msg.chat.id;
      const admin = await isAdmin(chatId);
      if (!admin) {
        return this.bot.sendMessage(chatId, '🔐 Acesso negado.');
      }
      try {
        const { listDailyReports } = await import('./database.js');
        const reports = listDailyReports(10);
        if (reports.length === 0) {
          return this.bot.sendMessage(chatId, '📭 Nenhum relatório salvo no banco de dados.');
        }
        let message = '📊 *Últimos Relatórios Salvos*\n\n';
        reports.forEach((report, i) => {
          const date = new Date(report.report_date).toLocaleDateString('pt-BR');
          const sent = report.email_sent ? '✅' : '❌';
          message += `${i + 1}. ID ${report.id} | ${date} ${sent}\n   ${report.report_subject}\n`;
          if (report.email_error) {
            message += `   ⚠️ ${report.email_error}\n`;
          }
          message += '\n';
        });
        message += '💡 Use: /relatorio-baixar ID';
        return this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      } catch (error) {
        return this.bot.sendMessage(chatId, `❌ Erro: ${error.message}`);
      }
    });

    // Comando oculto /relatorio-baixar ID - Baixa PDF de um relatório
    this.bot.onText(/\/relatorio-baixar\s+(\d+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const admin = await isAdmin(chatId);
      if (!admin) {
        return this.bot.sendMessage(chatId, '🔐 Acesso negado.');
      }
      try {
        const reportId = parseInt(match[1], 10);
        const { getReportById } = await import('./database.js');
        const report = getReportById(reportId);
        
        if (!report || !report.pdf_data) {
          return this.bot.sendMessage(chatId, '❌ Relatório não encontrado ou sem PDF.');
        }

        const date = new Date(report.report_date).toLocaleDateString('pt-BR');
        const status = report.email_sent ? 'Enviado por Email ✅' : 'Armazenado no BD (Email falhou) ❌';
        const caption = `📄 Relatório ${date}\n${status}`;

        return this.bot.sendDocument(chatId, report.pdf_data, {
          caption: caption,
          filename: `Relatorio-${report.report_date}.pdf`
        });
      } catch (error) {
        return this.bot.sendMessage(chatId, `❌ Erro: ${error.message}`);
      }
    });

    // Método para mostrar menu ADMIN
    this.showAdminMenu = async (chatId, userName) => {
      const inlineKeyboard = {
        reply_markup: {
          inline_keyboard: [
            // Linha 1: Painel Admin
            [
              { text: '📊 Painel Admin', callback_data: 'admin_info' },
              { text: '📋 Relatórios', callback_data: 'admin_reports' }
            ],
            // Linha 2: IA Criativa
            [
              { text: '💡 Gerar', callback_data: 'cmd_gerar' },
              { text: '🔍 Analisar', callback_data: 'cmd_analisar' },
              { text: '🎭 Imagem', callback_data: 'cmd_imagem' }
            ],
            // Linha 3: Ferramentas
            [
              { text: '🌍 Traduzir', callback_data: 'cmd_traduzir' },
              { text: '🔐 Senha', callback_data: 'cmd_senha' },
              { text: '📧 Email', callback_data: 'cmd_email' }
            ],
            // Linha 4: Utilidades
            [
              { text: '📋 PDF', callback_data: 'cmd_pdf' },
              { text: '🔎 Google', callback_data: 'cmd_google' },
              { text: '⏰ Lembrete', callback_data: 'cmd_lembrete' }
            ],
            // Linha 5: Conhecimento
            [
              { text: '📚 Conhecimento', callback_data: 'cmd_conhecimento' },
              { text: '🎯 Marketing', callback_data: 'cmd_marketing' }
            ],
            // Linha 6: Ações
            [
              { text: '⭐ Favoritos', callback_data: 'show_favorites' },
              { text: '🧩 Skills', callback_data: 'cmd_skills' }
            ]
          ]
        }
      };

      await this.bot.sendMessage(chatId,
        `👑 *Olá ${userName}!*\n` +
        `🎯 *Painel Administrativo OlympIA*\n\n` +
        `🤖 *IA Criativa & Ferramentas Profissionais*\n` +
        `Selecione uma opção abaixo:`,
        {
          parse_mode: 'Markdown',
          ...inlineKeyboard
        }
      );
    };

    // Método para mostrar menu USUÁRIO
    this.showUserMenu = async (chatId, userName) => {
      const inlineKeyboard = {
        reply_markup: {
          inline_keyboard: [
            // Linha 1: IA Criativa
            [
              { text: '💡 Gerar', callback_data: 'cmd_gerar' },
              { text: '🔍 Analisar', callback_data: 'cmd_analisar' },
              { text: '🎭 Imagem', callback_data: 'cmd_imagem' }
            ],
            // Linha 2: Ferramentas
            [
              { text: '🌍 Traduzir', callback_data: 'cmd_traduzir' },
              { text: '🔐 Senha', callback_data: 'cmd_senha' },
              { text: '📧 Email', callback_data: 'cmd_email' }
            ],
            // Linha 3: Utilidades
            [
              { text: '📋 PDF', callback_data: 'cmd_pdf' },
              { text: '🔎 Google', callback_data: 'cmd_google' },
              { text: '⏰ Lembrete', callback_data: 'cmd_lembrete' }
            ],
            // Linha 4: Conhecimento & Marketing
            [
              { text: '📚 Conhecimento', callback_data: 'cmd_conhecimento' },
              { text: '🎯 Marketing', callback_data: 'cmd_marketing' }
            ],
            // Linha 5: Ações
            [
              { text: '⭐ Favoritos', callback_data: 'show_favorites' },
              { text: '🧩 Skills', callback_data: 'cmd_skills' }
            ]
          ]
        }
      };

      await this.bot.sendMessage(chatId,
        `🤖 *Olá ${userName}!*\n` +
        `🎯 *Bem-vindo à OlympIA*\n\n` +
        `🤖 *IA Criativa & Ferramentas Profissionais*\n` +
        `Selecione uma opção abaixo:`,
        {
          parse_mode: 'Markdown',
          ...inlineKeyboard
        }
      );
    };

    // ═══════════════════════════════════════════════════════════════
    // HANDLER PARA INLINE KEYBOARDS (CARDS BONITOS)
    // ═══════════════════════════════════════════════════════════════

    // Handler para callbacks dos botões inline
    this.bot.on('callback_query', async (query) => {
      const chatId = query.message.chat.id;
      const data = query.data;
      const userName = query.from.first_name || 'usuário';

      // Responder ao callback para remover o loading
      await this.bot.answerCallbackQuery(query.id);

      try {
        // Processar diferentes callbacks
        if (data.startsWith('cmd_')) {
          const command = data.replace('cmd_', '');
          await this.handleInlineCommand(chatId, command, userName);
        } else if (data === 'admin_info') {
          await this.handleAdminInfo(chatId);
        } else if (data === 'admin_reports') {
          await this.handleAdminReports(chatId);
        } else if (data === 'show_favorites') {
          await this.handleShowFavorites(chatId);
        }
      } catch (error) {
        console.error('Erro no callback:', error);
        await this.bot.sendMessage(chatId, '❌ Erro ao processar comando. Tente novamente.');
      }
    });

    // Método para processar comandos dos botões inline
    this.handleInlineCommand = async (chatId, command, userName) => {
      const commandMap = {
        'gerar': '/gerar',
        'analisar': '/analisar',
        'keywords': '/keywords',
        'imagem': '/imagem',
        'chat': '/chat',
        'traduzir': '/traduzir',
        'senha': '/senha',
        'morse': '/morse',
        'noticias': '/noticias',
        'falar': '/falar',
        'ocr': '/ocr',
        'email': '/email',
        'lembrete': '/lembrete',
        'pdf': '/pdf',
        'google': '/google',
        'conhecimento': '/conhecimento',
        'kb:stats': '/kb:stats',
        'marketing': '/marketing',
        'promocao': '/promocao',
        'social': '/social',
        'vip': '/vip',
        'casa': '/casa',
        'favoritos': '/favoritos',
        'skills': '/skills',
        'ia': '/ia',
        'utilidades': '/utilidades',
        'ajuda': '/ajuda'
      };

      const actualCommand = commandMap[command];
      if (actualCommand) {
        await this.bot.sendMessage(chatId,
          `🎯 *Comando selecionado:* ${actualCommand}\n\n` +
          `💡 *Como usar:* Digite \`${actualCommand} [sua solicitação]\`\n\n` +
          `📝 *Exemplo:* \`${actualCommand} olá mundo\``,
          { parse_mode: 'Markdown' }
        );
      } else {
        await this.bot.sendMessage(chatId, '❌ Comando não encontrado.');
      }
    };

    // Método para mostrar informações do admin
    this.handleAdminInfo = async (chatId) => {
      const { getAllUsers, getUserStats } = await import('./database.js');
      const users = getAllUsers();
      const stats = getUserStats();

      const infoMessage =
        `👑 *PAINEL ADMINISTRATIVO OLYMPIA*\n\n` +
        `📊 *ESTATÍSTICAS GERAIS*\n` +
        `• 👥 Total de usuários: ${users.length}\n` +
        `• 📈 Comandos executados hoje: ${stats.todayCommands || 0}\n` +
        `• ⚡ Tempo médio de resposta: ${stats.avgResponseTime || 0}ms\n` +
        `• 🎯 Taxa de sucesso: ${stats.successRate || 0}%\n\n` +
        `🖥️ *SISTEMA*\n` +
        `• 🟢 Status: Online\n` +
        `• 🤖 MCP: ${this.mcpClient ? 'Conectado' : 'Desconectado'}\n` +
        `• 💾 Memória: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB\n\n` +
        `⚙️ *AÇÕES RÁPIDAS*\n` +
        `• 📋 /relatorio - Gerar relatório\n` +
        `• 📁 /relatorios - Ver relatórios salvos\n` +
        `• 🔄 /start - Voltar ao menu`;

      await this.bot.sendMessage(chatId, infoMessage, { parse_mode: 'Markdown' });
    };

    // Método para mostrar relatórios do admin
    this.handleAdminReports = async (chatId) => {
      const { listDailyReports } = await import('./database.js');
      const reports = listDailyReports(5);

      if (reports.length === 0) {
        await this.bot.sendMessage(chatId,
          `📭 *Nenhum relatório encontrado*\n\n` +
          `💡 Use \`/relatorio\` para gerar um novo relatório.`,
          { parse_mode: 'Markdown' }
        );
        return;
      }

      let message = `📊 *ÚLTIMOS RELATÓRIOS*\n\n`;
      reports.forEach((report, i) => {
        const date = new Date(report.report_date).toLocaleDateString('pt-BR');
        const sent = report.email_sent ? '✅' : '❌';
        message += `${i + 1}. *${date}* ${sent}\n`;
        message += `   📧 ${report.report_subject}\n`;
        if (report.email_error) {
          message += `   ⚠️ Erro: ${report.email_error}\n`;
        }
        message += `\n`;
      });

      message += `💡 *Para baixar:* \`/relatorio-baixar ID\``;

      await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    };

    // Método para mostrar favoritos
    this.handleShowFavorites = async (chatId) => {
      const userFavorites = this.userFavorites[chatId] || [];

      if (userFavorites.length === 0) {
        await this.bot.sendMessage(chatId,
          `⭐ *FAVORITOS VAZIOS*\n\n` +
          `💡 Adicione comandos aos seus favoritos:\n` +
          `• \`/favoritos add /comando\` - Adicionar\n` +
          `• \`/favoritos hot\` - Adicionar comandos populares\n\n` +
          `📚 *Comandos disponíveis:*\n` +
          `• /gerar, /imagem, /traduzir, /email, /pdf\n` +
          `• /conhecimento, /marketing, /skills`,
          { parse_mode: 'Markdown' }
        );
        return;
      }

      let message = `⭐ *SEUS FAVORITOS*\n\n`;
      userFavorites.forEach((cmd, i) => {
        const emoji = COMMAND_ICONS[cmd] || '⭐';
        message += `${i + 1}. ${emoji} \`${cmd}\`\n`;
      });

      message += `\n💡 *Como usar:* Digite o comando diretamente\n`;
      message += `🔧 *Gerenciar:* \`/favoritos remove /comando\``;

      await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    };

    // ═══════════════════════════════════════════════════════════════
    // GERENCIADOR DE DIÁLOGOS INTERATIVOS
    // ═══════════════════════════════════════════════════════════════

    /**
     * Processa respostas em diálogos interativos
     */
    this.handleConversationResponse = async (chatId, userResponse) => {
      try {
        const result = this.conversations.processResponse(chatId, userResponse);

        if (!result) {
          return this.bot.sendMessage(chatId, '⚠️ Erro ao processar sua resposta.');
        }

        if (!result.complete) {
          // Próxima pergunta
          const tip = result.tip ? `\n\n💡 ${result.tip}` : '';
          return this.bot.sendMessage(chatId, result.question + tip);
        }

        // Diálogo completo - executar ação
        return await this.executeDialogAction(chatId, result.action, result.data);
      } catch (error) {
        this.conversations.cancelConversation(chatId);
        return this.bot.sendMessage(chatId, `❌ Erro: ${error.message}`);
      }
    };

    /**
     * Executa ação após diálogo completo
     */
    this.executeDialogAction = async (chatId, action, data) => {
      const processingMsg = await this.bot.sendMessage(chatId, '⏳ Processando suas informações...');

      try {
        switch (action) {
          case 'generateReport':
            return await this.generateReportFromDialog(chatId, data, processingMsg);
          case 'analyzeData':
            return await this.analyzeDataFromDialog(chatId, data, processingMsg);
          case 'generateContent':
            return await this.generateContentFromDialog(chatId, data, processingMsg);
          case 'generateImage':
            return await this.generateImageFromDialog(chatId, data, processingMsg);
          case 'translateText':
            return await this.translateTextFromDialog(chatId, data, processingMsg);
          case 'extractKeywords':
            return await this.extractKeywordsFromDialog(chatId, data, processingMsg);
          case 'generateMorse':
            return await this.generateMorseFromDialog(chatId, data, processingMsg);
          case 'searchNews':
            return await this.searchNewsFromDialog(chatId, data, processingMsg);
          case 'sendEmail':
            return await this.sendEmailFromDialog(chatId, data, processingMsg);
          case 'contextualChat':
            return await this.contextualChatFromDialog(chatId, data, processingMsg);
          case 'searchKnowledge':
            return await this.searchKnowledgeFromDialog(chatId, data, processingMsg);
          default:
            await this.bot.editMessageText(`❌ Ação desconhecida: ${action}`, {
              chat_id: chatId,
              message_id: processingMsg.message_id
            });
        }
      } catch (error) {
        await this.bot.editMessageText(`❌ Erro ao executar ação: ${error.message}`, {
          chat_id: chatId,
          message_id: processingMsg.message_id
        });
      }
    };

    /**
     * Gera relatório baseado no diálogo
     */
    this.generateReportFromDialog = async (chatId, data, processingMsg) => {
      try {
        const { generateDailyReport, sendReportToAdmins } = await import('./daily-report.js');
        
        // Mapear tipo de relatório
        const tipoMap = { '1': 'daily', '2': 'weekly', '3': 'monthly', '4': 'custom' };
        const tipo = tipoMap[data.tipo] || 'daily';
        
        const report = await generateDailyReport();
        await sendReportToAdmins(report);

        let resposta = `✅ *Relatório ${tipo} gerado com sucesso!*\n\n`;
        resposta += `📋 Formato: ${data.formato === '1' ? 'PDF' : data.formato === '2' ? 'Excel' : 'HTML'}\n`;
        
        if (data.email && (data.email.toLowerCase() === 'sim' || data.email.includes('@'))) {
          resposta += `📧 Será enviado por email\n`;
        }
        
        resposta += `\n💡 Use \`/relatorios\` para ver o histórico de relatórios`;

        await this.bot.editMessageText(resposta, {
          chat_id: chatId,
          message_id: processingMsg.message_id,
          parse_mode: 'Markdown'
        });
      } catch (error) {
        throw error;
      }
    };

    /**
     * Analisa dados baseado no diálogo
     */
    this.analyzeDataFromDialog = async (chatId, data, processingMsg) => {
      try {
        if (!this.mcpClient) {
          await this.connectMCP();
        }

        const profundidadeMap = { '1': 'breve', '2': 'detalhada', '3': 'com recomendações' };
        const profundidade = profundidadeMap[data.profundidade] || 'normal';

        const prompt = `Faça uma análise ${profundidade} dos seguintes dados:\n\n${data.data}\n\nSeja conciso mas informativo.`;

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout na análise')), 30000);
        });

        const resultPromise = this.mcpClient.callTool({
          name: 'olympia_reasoning',
          arguments: { prompt }
        });

        const result = await Promise.race([resultPromise, timeoutPromise]);
        const analise = result.content[0].text;

        let resposta = `📊 *Análise Complete*\n\n${analise}`;
        
        if (data.acao === '2') {
          resposta += `\n\n📄 Deseja gerar um relatório com esses dados? Use \`/relatorio\``;
        } else if (data.acao === '3') {
          resposta += `\n\n🎯 Próximas ações sugeridas: Agendar reunião ou revisar com a equipe`;
        }

        // Dividir se for muito longo
        if (resposta.length > 4096) {
          const parte1 = resposta.substring(0, 4000);
          const parte2 = resposta.substring(4000);
          
          await this.bot.editMessageText(parte1, {
            chat_id: chatId,
            message_id: processingMsg.message_id,
            parse_mode: 'Markdown'
          });
          
          await this.bot.sendMessage(chatId, parte2, { parse_mode: 'Markdown' });
        } else {
          await this.bot.editMessageText(resposta, {
            chat_id: chatId,
            message_id: processingMsg.message_id,
            parse_mode: 'Markdown'
          });
        }
      } catch (error) {
        throw error;
      }
    };

    /**
     * Gera conteúdo baseado no diálogo
     */
    this.generateContentFromDialog = async (chatId, data, processingMsg) => {
      try {
        if (!this.mcpClient) {
          await this.connectMCP();
        }

        const tipoMap = { 
          '1': 'post para redes sociais', 
          '2': 'email marketing', 
          '3': 'artigo de blog',
          '4': 'descrição de produto'
        };
        const tipo = tipoMap[data.tipo] || 'conteúdo';

        const tonMap = {
          '1': 'profissional',
          '2': 'descontraído',
          '3': 'persuasivo',
          '4': 'educativo',
          '5': 'divertido'
        };
        const tom = tonMap[data.tons] || 'neutro';

        const prompt = `Crie um ${tipo} sobre "${data.tema}" com tom ${tom}. Seja criativo e envolvente. Máximo 500 caracteres.`;

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout na geração')), 30000);
        });

        const resultPromise = this.mcpClient.callTool({
          name: 'olympia_reasoning',
          arguments: { prompt }
        });

        const result = await Promise.race([resultPromise, timeoutPromise]);
        const conteudo = result.content[0].text;

        const resposta = `✨ *Conteúdo Gerado*\n\n${conteudo}\n\n💡 Gostou? Pode usar, editar ou regenerar!`;

        if (resposta.length > 4096) {
          await this.bot.editMessageText(resposta.substring(0, 4000), {
            chat_id: chatId,
            message_id: processingMsg.message_id,
            parse_mode: 'Markdown'
          });
          await this.bot.sendMessage(chatId, resposta.substring(4000), { parse_mode: 'Markdown' });
        } else {
          await this.bot.editMessageText(resposta, {
            chat_id: chatId,
            message_id: processingMsg.message_id,
            parse_mode: 'Markdown'
          });
        }
      } catch (error) {
        throw error;
      }
    };

    /**
     * Gera imagem baseado no diálogo
     */
    this.generateImageFromDialog = async (chatId, data, processingMsg) => {
      try {
        const estiloMap = {
          '1': 'realista',
          '2': 'desenho',
          '3': 'aquarela',
          '4': 'cartoon',
          '5': 'digital art',
          '6': '3D render'
        };
        const estilo = estiloMap[data.estilo] || 'digital art';

        const tamanhoMap = {
          '1': '1:1',
          '2': '3:4',
          '3': '16:9',
          '4': '2:1'
        };
        const tamanho = tamanhoMap[data.tamanho] || '1:1';

        const prompt = `Gere uma imagem no estilo ${estilo}, proporção ${tamanho}: ${data.descricao}`;

        const resposta = `🎨 *Geração de Imagem Iniciada*\n\n` +
          `📝 Descrição: ${data.descricao}\n` +
          `🎭 Estilo: ${estilo}\n` +
          `📐 Tamanho: ${tamanho}\n\n` +
          `⏳ A imagem está sendo gerada (pode levar alguns minutos)...`;

        await this.bot.editMessageText(resposta, {
          chat_id: chatId,
          message_id: processingMsg.message_id,
          parse_mode: 'Markdown'
        });

        // Aqui você integraria com uma API de geração de imagens
        // Por enquanto, apenas mostra a confirmação
      } catch (error) {
        throw error;
      }
    };

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

    // 📚 Comando /conhecimento - Buscar na base de conhecimento
    // Comando /conhecimento - Inicia diálogo conversacional
    this.bot.onText(/\/conhecimento(?:\s|$)/, async (msg) => {
      const chatId = msg.chat.id;
      
      if (this.conversations.isInConversation(chatId)) {
        return this.bot.sendMessage(chatId, '⏳ Você já tem um diálogo em andamento. Responda primeiro!');
      }

      const firstQuestion = this.conversations.startConversation(chatId, 'conhecimento');
      if (firstQuestion) {
        const tip = firstQuestion.tip ? `\n\n💡 ${firstQuestion.tip}` : '';
        await this.bot.sendMessage(chatId, firstQuestion.text + tip);
      }
    });

    // 📊 Comando /kb:stats - Estatísticas da base
    this.bot.onText(/\/kb:stats/, async (msg) => {
      const chatId = msg.chat.id;
      const emoji = COMMAND_ICONS['/conhecimento'];
      
      const startTime = Date.now();
      
      try {
        // ✨ Com cache para estatísticas (10 minutos)
        let stats;
        
        if (OPTIMIZATION_FLAGS.enableStatsCache) {
          stats = await cachedWithProtection(
            statsCache,
            'kb:stats',
            () => knowledgeBase.getStats(),
            {
              operationName: '/kb:stats',
              timeout: 5000,
              maxRetries: 1,
              ttlMs: 10 * 60 * 1000, // 10 minutos
              enableCache: true
            }
          );
        } else {
          stats = await knowledgeBase.getStats();
        }
        
        const timeMs = Date.now() - startTime;
        
        if (stats && !stats.error) {
          let response = `${emoji} *Aqui está o status da minha base de conhecimento:*\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `📚 Total de documentos: ${stats.totalDocuments}\n` +
            `🗃️ Coleção: ${stats.collectionName}\n` +
            `✅ Status: ${stats.initialized ? '🟢 Pronta para usar!' : '⚪ Ainda vazia'}\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━`;
          
          if (OPTIMIZATION_FLAGS.enablePerformanceLogging) {
            response += `\n⏱️ *Tempo: ${timeMs}ms*`;
          }
          
          await this.bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
        } else {
          await this.bot.sendMessage(chatId, 
            `${emoji} *Minha base ainda está vazia!*\n\n` +
            'Use `/conhecimento <pergunta>` para começar!',
            { parse_mode: 'Markdown' }
          );
        }
      } catch (error) {
        const timeMs = Date.now() - startTime;
        await this.bot.sendMessage(chatId, 
          `${emoji} *Erro ao carregar estatísticas:*\n\n${error.message}\n\n⏱️ Tempo: ${timeMs}ms`,
          { parse_mode: 'Markdown' }
        );
      }
    });

    // 🎯 Comando /marketing - Dicas de SEO, Marketing e Mídias Sociais
    this.bot.onText(/\/marketing/, (msg) => {
      const chatId = msg.chat.id;
      const emoji = COMMAND_ICONS['/marketing'];
      const marketingGuide = `${emoji} *DOMINAR MARKETING É ASSIM: FÓRMULA FUNCIONA!*

*🔍 SEO - A Base de Tudo (Não Ignora Isso!)*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 *Palavras-chave que FUNCIONAM:*
   • Inteligência Artificial
   • Automação de Tarefas
   • Produtividade com IA
   • OlympIA Bot
   • Geração de Conteúdo IA
   • Análise de Dados Automática

📝 *Meta Descrição Que Vende:*
"OlympIA: A IA que trabalha PARA você. Aumenta produtividade em 300%. Teste grátis no Telegram!"

🏆 *Título que Clica:*
"OlympIA - A IA Que Todos Estão Usando Para Trabalhar Menos (E Ganhar Mais)"

*📊 REGRA DE OURO (Sério mesmo!)*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 80% VALOR = Dicas, guias, conhecimento gratuito
🔴 20% VENDA = Chamar pra testar OlympIA

Se você inverte, ninguém mais confia em você.

*📱 REDES SOCIAIS - Estratégia por Plataforma*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔵 *LinkedIn* (Profissionais que PAGAM):
   ✍️ Posts longos (1000+ caracteres)
   📊 Conteúdo educativo sobre IA
   💼 Cases de sucesso
   ⏰ Terça-Quinta 9-11h (café na mão)

📷 *Instagram* (Viraliza com Reels):
   🎬 REELS sobre tips de produtividade
   📸 Screenshots de funcionalidades
   📝 Carousel sobre IA
   ⏰ 19-21h (depois do trabalho)

🐦 *Twitter/X* (Tendências & Novidades):
   💬 Tweets curtos e diretos
   🔗 Threads explicativas
   🔥 Retweet com comentário inteligente
   ⏰ 08-10h ou 18-20h

💬 *WhatsApp* (Pessoal & Confiança):
   👋 Grupos de interesse
   🎁 Links de teste grátis
   📣 Compartilhamentos virais
   ⏰ Qualquer hora (sempre ativo)

*#️⃣ HASHTAGS QUE FUNCIONAM*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#OlympIA #IA #InteligenciaArtificial
#Automacao #Produtividade #TechBrasil
#Marketing #SEO #Inovacao #AI #Startup

*👥 ENGAJAMENTO - ISSO FUNCIONA*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Responda comentários em até 2 horas
✅ Use call-to-action claro ("Teste agora!")
✅ Crie conteúdo que RESSONHA com o público
✅ Compartilhe vitórias dos usuários
✅ Faça colabs com influenciadores
✅ Crie comunidade (grupo no Telegram!)

*🎁 OFERTAS QUE VENDEM*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏆 Teste grátis ILIMITADO
🏆 Webinar ao vivo sobre IA (semanal)
🏆 E-book grátis: "IA para Iniciantes"
🏆 Consultoria 1-on-1 (primeiros 15 min grátis)
🏆 Desconto para amigos que você indica

*💰 MONETIZAÇÃO - Plano Realista*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🥉 Tier 1: Básico (GRÁTIS - ganhe confiança)
🥈 Tier 2: Plus ($9/mês - valor real)
🥇 Tier 3: Premium ($29/mês - profissionais)
💎 Tier 4: Enterprise (consulte)

*📈 MÉTRICAS QUE IMPORTAM*
━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Taxa de clique (>3% é bom)
👁️ Taxa de conversão (>5% é EXCELENTE)
❤️ Engajamento (comentários > likes)
🔗 Compartilhamentos (melhor métrica!)
📱 Crescimento seguidores (não fake!)

💡 *Dica Final: Use /promocao e /social para gerar conteúdo estratégico! 🚀*`;

      this.bot.sendMessage(chatId, marketingGuide, { parse_mode: 'Markdown' });
    });

    // 🎉 Comando /promocao - Gera posts prontos para compartilhar
    this.bot.onText(/\/promocao/, async (msg) => {
      const chatId = msg.chat.id;
      const emoji = COMMAND_ICONS['/promocao'];
      
      // Mensagem inicial
      await this.bot.sendMessage(chatId, 
        `${emoji} *Pronto! Tenho 5 posts incríveis para você dominar as redes!*\n\n` +
        `📱 Cada um com um estilo diferente - copie, adapte e compartilhe! 🚀`
      );
      
      setTimeout(() => {
        this.bot.sendMessage(chatId, 
          `1️⃣ *POST LINKEDIN - Profissional & Elegante*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `"Cansado de tarefas repetitivas? 🙋‍♂️\n\n` +
          `A OlympIA é uma inteligência artificial que REALMENTE aumenta produtividade!\n\n` +
          `✨ Com OlympIA você consegue:\n` +
          `• Gerar conteúdo criativo em SEGUNDOS ⚡\n` +
          `• Analisar dados complexos automaticamente 📊\n` +
          `• Automatizar tarefas rotineiras 🤖\n` +
          `• Extrair insights com IA 🧠\n\n` +
          `💡 Resultado? Mais tempo para o que REALMENTE importa.\n\n` +
          `Teste grátis agora! 🚀\n\n` +
          `#IA #Automação #Produtividade #OlympIA #Trabalhoflexível"`,
          { parse_mode: 'Markdown' }
        );
      }, 600);
      
      setTimeout(() => {
        this.bot.sendMessage(chatId, 
          `2️⃣ *POST INSTAGRAM - Visual & Viral*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `✨ Conhece OlympIA? A IA que REALMENTE funciona! 🤖\n\n` +
          `🔥 O que faz dela especial:\n` +
          `✅ 22 comandos de IA (não é brincadeira)\n` +
          `✅ Análise de dados em tempo real\n` +
          `✅ Criação de conteúdo que vende\n` +
          `✅ Geração de imagens 1024x1024\n\n` +
          `💬 Compatível com Telegram (aquele app que você SEMPRE usa)\n\n` +
          `🎁 Quanto custa? NADA! Teste grátis hoje!\n\n` +
          `Botão na bio! ⬆️\n\n` +
          `#OlympIA #IA #Tecnologia #Produtividade #FuturoÉHoje"`,
          { parse_mode: 'Markdown' }
        );
      }, 1200);
      
      setTimeout(() => {
        this.bot.sendMessage(chatId, 
          `3️⃣ *POST TWITTER - Curto & Direto*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `🚀 OlympIA: A IA que não decepciona\n\n` +
          `22 comandos poderosos:\n` +
          `📝 Geração de conteúdo\n` +
          `📊 Análise de dados\n` +
          `🖼️ Criação de imagens\n` +
          `🌍 Tradução automática\n` +
          `🔍 SEO & Keywords\n` +
          `+ muito mais!\n\n` +
          `Está GRÁTIS no Telegram 🤖\n\n` +
          `Teste agora! Link na bio 👆\n\n` +
          `#IA #OlympIA #OpenAI #NeuralWeek #FuturaçãoDigital"`,
          { parse_mode: 'Markdown' }
        );
      }, 1800);
      
      setTimeout(() => {
        this.bot.sendMessage(chatId, 
          `4️⃣ *POST WHATSAPP - Casual & Amigável*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `Ei! 👋 Descobri algo ABSURDO! 🤯\n\n` +
          `Existe uma IA no Telegram chamada OlympIA que faz LITERALMENTE TUDO:\n\n` +
          `✅ Gera textos (como se fosse você)\n` +
          `✅ Cria imagens (tipo um artista)\n` +
          `✅ Traduz idiomas (inglês, espanhol, tudo!)\n` +
          `✅ Analisa documentos (PDF inteiro em 2s)\n` +
          `✅ Faz videos com voz (ficção científica?)\n` +
          `✅ E TEM MUITO MAIS!\n\n` +
          `💰 Melhor parte? É TOTALMENTE GRÁTIS!\n\n` +
          `Quer testar? Vou mandar o link! 🤖\n\n` +
          `Confia em mim, você vai se apaixonar 💕"`,
          { parse_mode: 'Markdown' }
        );
      }, 2400);
      
      setTimeout(() => {
        this.bot.sendMessage(chatId, 
          `5️⃣ *POST BLOG/EMAIL - Detalhado & Profundo*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `"A Revolução da IA no Seu Telegram: Conheça OlympIA"\n\n` +
          `A inteligência artificial deixou de ser um sonho de ficção científica e virou realidade NA PALMA DA SUA MÃO.\n\n` +
          `OlympIA é mais que um bot. É um assistente inteligente que combina o poder de IA de ponta com simplicidade.\n\n` +
          `🎯 Por que você deveria se importar?\n\n` +
          `Em um mundo onde o tempo é ouro, desperdiçar horas em tarefas repetitivas é INACEITÁVEL.\n\n` +
          `OlympIA resolve isso com 22 comandos que automatizam 90% dos seus trabalhos criativos:\n\n` +
          `• Redação inteligente que parece humana\n` +
          `• Análise de dados que REALMENTE faz sentido\n` +
          `• Criação de imagens profissionais\n` +
          `• E mais 19 recursos que vão te deixar boquiaberto\n\n` +
          `💡 O melhor? Você pode testar AGORA, SEM custos, SEM compromisso.\n\n` +
          `[Conteúdo pode continuar...]\n\n` +
          `#IA #Automação #FuturoDoTrabalho #OlympIA"`,
          { parse_mode: 'Markdown' }
        );
      }, 3000);

      setTimeout(() => {
        this.bot.sendMessage(chatId, 
          `✅ *Pronto! 5 posts de OURO gerados!* 🎉\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `💡 *Dicas para viralizar:*\n` +
          `1️⃣ Adapte para sua audiência (se for tech, fala tech!)\n` +
          `2️⃣ Use hashtags relevantes (mas não exagera)\n` +
          `3️⃣ Post em horários estratégicos\n` +
          `4️⃣ Incentive compartilhamentos e comentários\n` +
          `5️⃣ Responda comentários RÁPIDO (2h máximo)\n\n` +
          `🚀 Vamos dominar as redes? 🔥`,
          { parse_mode: 'Markdown' }
        );
      }, 3600);
    });

    // 👥 Comando /social - Social Media e Redes Sociais
    this.bot.onText(/\/social/, (msg) => {
      const chatId = msg.chat.id;
      const emoji = COMMAND_ICONS['/social'];
      const socialGuide = `${emoji} *VAMOS DOMINAR AS REDES SOCIAIS!*

*Sou honesta: cada plataforma é um mundo diferente*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔵 *LinkedIn* (O lugar dos profissionais)
   👥 Público: Executivos, CEOs, Profissionais
   📝 Tipo: Posts longos, Artigos inspiradores, Notícias
   ⏰ Melhor hora: Terça-Quinta 9-11h (no café ☕)
   💡 Segredo: Compartilhe conhecimento que você TEM
   Exemplo: "Como IA aumenta produtividade em 300%"

📷 *Instagram* (O lugar dos visuais)
   👥 Público: Designers, Criativos, Jovens, Influencers
   📝 Tipo: Stories, Reels (MUITO importante!), Carrouséis
   ⏰ Melhor hora: 19-21h (depois do trabalho)
   💡 Segredo: Vídeos vendem 80% mais que fotos
   Exemplo: GIFs de funcionalidades, Dicas visuais

🐦 *Twitter/X* (O lugar das tendências)
   👥 Público: Programadores, Jornalistas, Tech Nerds
   📝 Tipo: Tweets curtos, Threads virais, Retweets inteligentes
   ⏰ Melhor hora: 08-10h (acordando), 18-20h (voltando)
   💡 Segredo: Participe em trends RELEVANTES
   Exemplo: Comentários sobre IA, Python, Web3

💬 *WhatsApp* (O lugar do pessoal)
   👥 Público: Amigos, Colegas, Grupos de interesse
   📝 Tipo: Mensagens diretas, Compartilhamentos com propósito
   ⏰ Melhor hora: Qualquer hora! (seu público sempre tá lá)
   💡 Segredo: Faça as pessoas QUEREREM compartilhar
   Exemplo: "Ei, descobri algo incrível pra você!"

📰 *Blog/Medium* (O lugar do conhecimento)
   👥 Público: Pessoas buscando aprender no Google
   📝 Tipo: Artigos longos, Guias, Tutoriais, Reviews
   ⏰ Melhor hora: Qualquer hora (Google indexa sempre!)
   💡 Segredo: Escreva sobre problemas REAIS que as pessoas têm
   Exemplo: "Guia completo: Usar IA para trabalhar menos"

*📊 O QUE REALMENTE IMPORTA*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 Engajamento = Reações + Comentários + Compartilhamentos (de VERDADE!)
👁️  Alcance = Quantas pessoas REALMENTE viram (tem bots nisso?)
🔗 Cliques = Quantas clicaram no link (não é só número bonito)
🎯 Conversões = Quantas viraram clientes/fãs de VERDADE
⏱️  Timing = Postar na hora certa é TUDO mesmo

*🚀 OURO PURO - DICAS QUE FUNCIONAM*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Poste consistentemente (2-3x semana - não abandone!)
✅ Vídeos e reels (o algoritmo ADORA)
✅ Responda comentários em até 2 horas (seja rápido!)
✅ 80% valor, 20% venda (a regra dourada mesmo)
✅ Teste horários diferentes (acompanhe suas métricas)
✅ Analise o que deu certo (nunca ignore dados)
✅ Colab com quem faz o mesmo (crescimento 10x)
✅ Hashtags que fazem SENTIDO (não use aleatórios)
✅ Seja você mesmo (autenticidade SEMPRE vence)
✅ Qualidade > Quantidade (sempre, sempre, sempre)

*💰 MONETIZAÇÃO REAL*
━━━━━━━━━━━━━━━━━━━━━━
📌 Comece com: Teste grátis, Demo, Webinar
💎 Tier 1: Básico (free - ganhe confiança)
💎 Tier 2: Pro ($9-15/mês - valor real)
💎 Tier 3: Premium ($29+/mês - VIPs)
🎁 Referral: 20% comissão (fácil!)

💡 Dica: Use /promocao para gerar posts prontos!`;

      this.bot.sendMessage(chatId, socialGuide, { parse_mode: 'Markdown' });
    });

    // 🔥 Comando /vip - Hot Commands (Mais Utilizados com 🔥)
    this.bot.onText(/\/vip/, (msg) => {
      const chatId = msg.chat.id;
      
      let vipMessage = '🔥 *HOT COMMANDS - OS MAIS QUENTES!*\n' +
                       '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
                       '✨ Estes são os comandos mais incríveis e mais usados!\n\n';
      
      const grouped = {};
      HOT_COMMANDS.forEach(cmd => {
        if (!grouped[cmd.category]) grouped[cmd.category] = [];
        grouped[cmd.category].push(cmd);
      });
      
      Object.keys(grouped).forEach(category => {
        vipMessage += `*${category}*\n`;
        grouped[category].forEach(cmd => {
          vipMessage += `${cmd.emoji} \`${cmd.name}\` - ${cmd.desc}\n`;
        });
        vipMessage += '\n';
      });
      
      vipMessage += '💡 *Sabe o que os incríveis fazem?*\n' +
                    '🔥 Clicam em /favoritos hot\n' +
                    '⭐ Para salvar todos esses comandos sensacionais!\n\n' +
                    '🚀 Vamos começar?';
      
      this.bot.sendMessage(chatId, vipMessage, { parse_mode: 'Markdown' });
    });

    // 💖 Comando /favoritos - Gerenciar Favoritos
    this.bot.onText(/\/favoritos(.*)/, (msg, match) => {
      const chatId = msg.chat.id;
      const args = match[1].trim();
      const emoji = COMMAND_ICONS['/favoritos'];
      
      if (!userFavorites[chatId]) {
        userFavorites[chatId] = [];
      }

      if (!args) {
        // Mostrar favoritos atuais
        if (userFavorites[chatId].length === 0) {
          this.bot.sendMessage(chatId,
            `${emoji} *Seus Favoritos (Atalhos Especiais)*\n\n` +
            '💭 Hmm, você não tem favoritos ainda!\n\n' +
            '👉 Adicione os comandos que você mais ama:\n' +
            '`/favoritos add /gerar`\n' +
            '`/favoritos add /imagem`\n' +
            '`/favoritos add /chat`\n\n' +
            '💡 *Ou adicione todos os Hot Commands de uma vez:*\n' +
            '`/favoritos hot`',
            { parse_mode: 'Markdown' }
          );
        } else {
          let favMessage = `${emoji} *Seus Comandos Favoritos (Seus Atalhos!)*\n` +
                          '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
          userFavorites[chatId].forEach((fav, idx) => {
            const icon = COMMAND_ICONS[fav] || '⭐';
            favMessage += `${idx + 1}. ${icon} \`${fav}\`\n`;
          });
          favMessage += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
                       '💡 Remover: `/favoritos remove /comando`\n' +
                       '🗑️ Limpar tudo: `/favoritos limpar`';
          
          this.bot.sendMessage(chatId, favMessage, { parse_mode: 'Markdown' });
        }
        return;
      }

      if (args.startsWith('add')) {
        const cmd = args.replace('add', '').trim();
        if (!cmd.startsWith('/')) {
          this.bot.sendMessage(chatId, 
            `❌ *Ops! Algo deu errado*\n\n` +
            'Use: `/favoritos add /comando`\n' +
            'Exemplo: `/favoritos add /gerar`',
            { parse_mode: 'Markdown' }
          );
          return;
        }
        if (!userFavorites[chatId].includes(cmd)) {
          userFavorites[chatId].push(cmd);
          const icon = COMMAND_ICONS[cmd] || '⭐';
          this.bot.sendMessage(chatId, 
            `✨ *Adicionado aos seus favoritos!*\n\n${icon} ${cmd}`,
            { parse_mode: 'Markdown' }
          );
        } else {
          this.bot.sendMessage(chatId, 
            `⚠️ ${cmd} já está nos seus favoritos!\n\nNão precisa adicionar duas vezes 😄`,
            { parse_mode: 'Markdown' }
          );
        }
      } else if (args.startsWith('remove')) {
        const cmd = args.replace('remove', '').trim();
        userFavorites[chatId] = userFavorites[chatId].filter(f => f !== cmd);
        this.bot.sendMessage(chatId, 
          `🗑️ *Removido dos favoritos!*\n\n${cmd}`,
          { parse_mode: 'Markdown' }
        );
      } else if (args === 'limpar') {
        userFavorites[chatId] = [];
        this.bot.sendMessage(chatId, 
          `🧹 *Favoritos zerados!*\n\nAdcione novos comandos quando quiser!`,
          { parse_mode: 'Markdown' }
        );
      } else if (args === 'hot') {
        // Adicionar todos os HOT commands aos favoritos
        const hotCmds = HOT_COMMANDS.map(cmd => cmd.name);
        userFavorites[chatId] = [...new Set([...userFavorites[chatId], ...hotCmds])];
        this.bot.sendMessage(chatId, 
          `🔥 *Boom! Adicionados ${hotCmds.length} Hot Commands!*\n\n` +
          'Agora você tem acesso aos melhores atalhos. Que vença a preguiça! 💪',
          { parse_mode: 'Markdown' }
        );
      } else {
        this.bot.sendMessage(chatId, 
          `${emoji} *Como usar Favoritos?*\n\n` +
          '`/favoritos` - Ver lista de favoritos\n' +
          '`/favoritos add /comando` - Adicionar um\n' +
          '`/favoritos remove /comando` - Remover um\n' +
          '`/favoritos limpar` - Limpar TODOS\n' +
          '`/favoritos hot` - Adicionar todos os Hot Commands\n\n' +
          '💡 *Dica:* Adicione seus comandos preferidos e acesse rápido!',
          { parse_mode: 'Markdown' }
        );
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

    // Comando /gerar - Gerar Conteúdo com IA
    // Comando /gerar - Inicia diálogo conversacional
    this.bot.onText(/\/gerar(?:\s|$)/, async (msg) => {
      const chatId = msg.chat.id;
      const emoji = COMMAND_ICONS['/gerar'];
      
      // Verifica se já tem conversa em andamento
      if (this.conversations.isInConversation(chatId)) {
        return this.bot.sendMessage(chatId, '⏳ Você já tem um diálogo em andamento. Responda primeiro!');
      }

      // Inicia diálogo
      const firstQuestion = this.conversations.startConversation(chatId, 'gerar');
      if (firstQuestion) {
        const tip = firstQuestion.tip ? `\n\n💡 ${firstQuestion.tip}` : '';
        await this.bot.sendMessage(chatId, firstQuestion.text + tip);
      }
    });

    // Comando /analisar - Inicia diálogo conversacional
    this.bot.onText(/\/analisar(?:\s|$)/, async (msg) => {
      const chatId = msg.chat.id;
      const emoji = COMMAND_ICONS['/analisar'];
      
      if (this.conversations.isInConversation(chatId)) {
        return this.bot.sendMessage(chatId, '⏳ Você já tem um diálogo em andamento. Responda primeiro!');
      }

      const firstQuestion = this.conversations.startConversation(chatId, 'analisar');
      if (firstQuestion) {
        const tip = firstQuestion.tip ? `\n\n💡 ${firstQuestion.tip}` : '';
        await this.bot.sendMessage(chatId, firstQuestion.text + tip);
      }
    });

    // Comando /keywords - Inicia diálogo conversacional
    this.bot.onText(/\/keywords(?:\s|$)/, async (msg) => {
      const chatId = msg.chat.id;
      const emoji = COMMAND_ICONS['/keywords'];
      
      if (this.conversations.isInConversation(chatId)) {
        return this.bot.sendMessage(chatId, '⏳ Você já tem um diálogo em andamento. Responda primeiro!');
      }

      const firstQuestion = this.conversations.startConversation(chatId, 'keywords');
      if (firstQuestion) {
        const tip = firstQuestion.tip ? `\n\n💡 ${firstQuestion.tip}` : '';
        await this.bot.sendMessage(chatId, firstQuestion.text + tip);
      }
    });

    // Comando /skills
    this.bot.onText(/\/skills/, (msg) => {
      const chatId = msg.chat.id;
      const mid = Math.ceil(AVAILABLE_SKILLS.length / 2);
      const part1 = AVAILABLE_SKILLS.slice(0, mid).map((skill, i) => `${i + 1}. ${skill}`).join('\n');
      const part2 = AVAILABLE_SKILLS.slice(mid).map((skill, i) => `${mid + i + 1}. ${skill}`).join('\n');
      
      this.bot.sendMessage(chatId, 
        `🎯 *Skills Disponíveis - Parte 1/${Math.ceil(AVAILABLE_SKILLS.length / mid)}:*\n\n${part1}`,
        { parse_mode: 'Markdown' }
      );
      
      setTimeout(() => {
        this.bot.sendMessage(chatId, 
          `🎯 *Skills Disponíveis - Parte 2/${Math.ceil(AVAILABLE_SKILLS.length / mid)}:*\n\n${part2}\n\n💡 Use /gerar para testar!`,
          { parse_mode: 'Markdown' }
        );
      }, 500);
    });

    // 🎭 Comando /imagem - Gerar imagem com Stable Diffusion
    this.bot.onText(/\/imagem (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const prompt = match[1];
      const emoji = COMMAND_ICONS['/imagem'];
      
      await this.bot.sendMessage(chatId, `${emoji} *Deixa eu pintaar um quadro com seus sonhos...*\n\n⏳ Isso pode levar 30-60 segundos, mas vai valer a pena!`);
      
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
          caption: `${emoji} *Voilà! Seu quadro está pronto!*\n\n"${prompt}"\n\n✨ Criado com amor e IA\n⚡ Powered by Pollinations.ai`
        });
      } catch (error) {
        console.error('Erro ao gerar imagem:', error);
        await this.bot.sendMessage(chatId, 
          `${emoji} *Ops! Algo deu errado no meu estúdio de pintura...*\n\n❌ ${error.message}\n\n` +
          `💡 *Tenta de novo com uma descrição diferente?*\n` +
          `Ex: "Um gato usando óculos de sol em Marte"`,
          { parse_mode: 'Markdown' }    
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
    // Comando /email - Inicia diálogo conversacional
    this.bot.onText(/\/email(?:\s|$)/, async (msg) => {
      const chatId = msg.chat.id;
      
      if (this.conversations.isInConversation(chatId)) {
        return this.bot.sendMessage(chatId, '⏳ Você já tem um diálogo em andamento. Responda primeiro!');
      }

      const firstQuestion = this.conversations.startConversation(chatId, 'email');
      if (firstQuestion) {
        const tip = firstQuestion.tip ? `\n\n💡 ${firstQuestion.tip}` : '';
        await this.bot.sendMessage(chatId, firstQuestion.text + tip);
      }
    });


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
    // Comando /traduzir - Inicia diálogo conversacional
    this.bot.onText(/\/traduzir(?:\s|$)/, async (msg) => {
      const chatId = msg.chat.id;
      const emoji = COMMAND_ICONS['/traduzir'];
      
      if (this.conversations.isInConversation(chatId)) {
        return this.bot.sendMessage(chatId, '⏳ Você já tem um diálogo em andamento. Responda primeiro!');
      }

      const firstQuestion = this.conversations.startConversation(chatId, 'traduzir');
      if (firstQuestion) {
        const tip = firstQuestion.tip ? `\n\n💡 ${firstQuestion.tip}` : '';
        await this.bot.sendMessage(chatId, firstQuestion.text + tip);
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

    // Comando /morse - Inicia diálogo conversacional
    this.bot.onText(/\/morse(?:\s|$)/, async (msg) => {
      const chatId = msg.chat.id;
      
      if (this.conversations.isInConversation(chatId)) {
        return this.bot.sendMessage(chatId, '⏳ Você já tem um diálogo em andamento. Responda primeiro!');
      }

      const firstQuestion = this.conversations.startConversation(chatId, 'morse');
      if (firstQuestion) {
        const tip = firstQuestion.tip ? `\n\n💡 ${firstQuestion.tip}` : '';
        await this.bot.sendMessage(chatId, firstQuestion.text + tip);
      }
    });

    // Comando /noticias - Inicia diálogo conversacional
    this.bot.onText(/\/noticias(?:\s|$)/, async (msg) => {
      const chatId = msg.chat.id;
      
      if (this.conversations.isInConversation(chatId)) {
        return this.bot.sendMessage(chatId, '⏳ Você já tem um diálogo em andamento. Responda primeiro!');
      }

      const firstQuestion = this.conversations.startConversation(chatId, 'noticias');
      if (firstQuestion) {
        const tip = firstQuestion.tip ? `\n\n💡 ${firstQuestion.tip}` : '';
        await this.bot.sendMessage(chatId, firstQuestion.text + tip);
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

    // Comando /chat - Inicia diálogo conversacional com contexto
    this.bot.onText(/\/chat(?:\s|$)/, async (msg) => {
      const chatId = msg.chat.id;
      
      if (this.conversations.isInConversation(chatId)) {
        return this.bot.sendMessage(chatId, '⏳ Você já tem um diálogo em andamento. Responda primeiro!');
      }

      const firstQuestion = this.conversations.startConversation(chatId, 'chat');
      if (firstQuestion) {
        const tip = firstQuestion.tip ? `\n\n💡 ${firstQuestion.tip}` : '';
        await this.bot.sendMessage(chatId, firstQuestion.text + tip);
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

    // Mensagens gerais (sem comando) - Chat Humanizado + Diálogos
    this.bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const text = msg.text;

      // Se não tem texto (foto, sticker, etc), ignora
      if (!text || text.trim() === '') return;

      // Ignora se for um comando
      if (text.startsWith('/')) {
        return;
      }

      // 🎯 VERIFICA SE USUÁRIO ESTÁ EM UM DIÁLOGO
      if (this.conversations.isInConversation(chatId)) {
        return await this.handleConversationResponse(chatId, text);
      }

      // Chat humanizado padrão
      const thinkingMsg = await this.bot.sendMessage(chatId, '💭 Pensando...');

      try {
        if (!this.mcpClient) {
          await this.connectMCP();
        }

        // Timeout aumentado para respostas mais substanciais (60 segundos)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout: Resposta demorou mais de 60s')), 60000);
        });

        // Prompt aprimorado para respostas substanciais e inteligentes
        let prompt = `Você é OlympIA, uma assistente virtual avançada e altamente inteligente, similar ao GPT-4 ou Gemini.

PERSONALIDADE:
- Amigável, prestativa e muito inteligente
- Respostas são sempre SUBSTANCIAIS e INFORMATIVAS
- Fornece CONTEÚDO DE VALOR REAL em cada resposta
- Usa conhecimento amplo e atualizado
- Estrutura respostas de forma clara e organizada

REGRAS DE RESPOSTA:
- NÃO limite a 3 linhas - forneça respostas COMPLETAS quando necessário
- Seja DIRETO AO PONTO mas COMPREENSIVO
- Use formatação Markdown quando apropriado (negrito, itálico, listas)
- Para perguntas complexas: estruture em seções com títulos
- Para explicações: seja detalhado mas claro
- Sempre termine com algo ÚTIL (dica, sugestão, pergunta de follow-up)

COMANDOS DISPONÍVEIS (sugira quando relevante):
- /google - Pesquisa na web
- /traduzir - Tradução de idiomas
- /imagem - Geração de imagens
- /gerar - Criação de conteúdo
- /analisar - Análise de texto/imagem
- /conversar - Diálogo estruturado

CONTEXTO DO USUÁRIO: ${text}

INSTRUÇÃO: Forneça uma resposta inteligente, útil e completa. Não seja superficial.`;

        // Sistema de detecção para sugerir comandos (mantém funcionalidade)
        
        // Sistema de detecção para sugerir comandos
        let sugestao = '';
        
        if (text.toLowerCase().includes('gerar') || text.toLowerCase().includes('criar')) {
          sugestao = '\n\n💡 Quer criar algo específico? Use `/gerar`';
        } else if (text.toLowerCase().includes('pesquisa') || text.toLowerCase().includes('buscar')) {
          sugestao = '\n\n💡 Para pesquisar: `/google`';
        } else if (text.toLowerCase().includes('traduzir')) {
          sugestao = '\n\n💡 Para traduzir: `/traduzir`';
        } else if (text.toLowerCase().includes('imagem') || text.toLowerCase().includes('desenho')) {
          sugestao = '\n\n💡 Para criar imagem: `/imagem`';
        } else if (text.toLowerCase().includes('análise')) {
          sugestao = '\n\n💡 Para análise: `/analisar`';
        }
        
        // Race entre timeout e resposta da IA
        const responsePromise = this.mcpClient.callTool({
          name: 'olympia_reasoning',
          arguments: { prompt: prompt }
        });

        const result = await Promise.race([responsePromise, timeoutPromise]);

        const response = result.content[0].text;
        
        // Deletar mensagem "Pensando..."
        await this.bot.deleteMessage(chatId, thinkingMsg.message_id);
        
        await this.bot.sendMessage(chatId, response + sugestao);
      } catch (error) {
        // Deletar mensagem "Pensando..." em caso de erro
        try {
          await this.bot.deleteMessage(chatId, thinkingMsg.message_id);
        } catch {}
        
        if (error.message.includes('Timeout')) {
          await this.bot.sendMessage(chatId,
            '⏱️ *Resposta demorando...*\n\n' +
            'Estou processando sua solicitação, mas está demorando mais que o esperado.\n\n' +
            '💡 *Alternativas:*\n' +
            '• Use `/google` para pesquisar\n' +
            '• Tente reformular sua pergunta\n' +
            '• Use comandos específicos como `/traduzir` ou `/analisar`\n\n' +
            'Tente novamente em alguns segundos! 🚀',
            { parse_mode: 'Markdown' }
          );
        } else if (error.message.includes('MCP') || error.message.includes('connection')) {
          await this.bot.sendMessage(chatId,
            '🔧 *Sistema temporariamente indisponível*\n\n' +
            'Estou com dificuldades técnicas no momento, mas posso ajudar com:\n\n' +
            '📋 *Comandos disponíveis:*\n' +
            '• `/google` - Pesquisa na web\n' +
            '• `/traduzir` - Tradução de idiomas\n' +
            '• `/imagem` - Geração de imagens\n' +
            '• `/relatorio` - Relatórios do sistema\n' +
            '• `/meus-dados` - Seus dados cadastrados\n\n' +
            'Volto em breve com respostas completas! 🤖',
            { parse_mode: 'Markdown' }
          );
        } else {
          await this.bot.sendMessage(chatId,
            '❌ *Erro inesperado*\n\n' +
            'Ocorreu um problema técnico. Tente novamente ou use um comando específico.\n\n' +
            'Se o problema persistir, contate o administrador.',
            { parse_mode: 'Markdown' }
          );
        }
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
          margin: 50,
          info: {
            Title: titulo,
            Author: 'OlympIA Bot',
            Subject: 'Documento Gerado Automaticamente',
            CreationDate: new Date()
          }
        });

        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);

        // Header profissional
        doc.rect(0, 0, 595.28, 80).fill('#1a365d'); // Header azul escuro
        doc.fillColor('white').fontSize(24).font('Helvetica-Bold').text('OlympIA', 50, 25);
        doc.fontSize(12).font('Helvetica').text('Sistema de Documentação Automática', 50, 50);
        doc.fillColor('#1a365d').rect(0, 80, 595.28, 20).fill(); // Linha separadora

        // Título do documento
        doc.fillColor('#1a365d').fontSize(20).font('Helvetica-Bold').text(
          titulo,
          50, 120,
          { align: 'center' }
        );

        let yPosition = 160;

        // Informações do documento
        doc.fillColor('#1a365d').fontSize(14).font('Helvetica-Bold').text('📄 INFORMAÇÕES DO DOCUMENTO', 50, yPosition);
        yPosition += 25;

        // Card de informações
        doc.fillColor('#f8f9fa').rect(50, yPosition, 480, 80).fill();
        doc.strokeColor('#dee2e6').rect(50, yPosition, 480, 80).stroke();

        doc.fillColor('#333').fontSize(10).font('Helvetica');
        doc.text(`• Título: ${titulo}`, 70, yPosition + 15);
        doc.text(`• Gerado por: OlympIA Bot`, 70, yPosition + 30);
        doc.text(`• Plataforma: Telegram`, 70, yPosition + 45);
        doc.text(`• Formato: PDF A4 (Profissional)`, 70, yPosition + 60);

        yPosition += 100;

        // Data e timestamp
        doc.fillColor('#666').fontSize(9).font('Helvetica').text(
          `Documento gerado em: ${new Date().toLocaleString('pt-BR')}`,
          50, yPosition,
          { align: 'center' }
        );

        yPosition += 30;

        // Seção de conteúdo
        doc.fillColor('#1a365d').fontSize(14).font('Helvetica-Bold').text('📝 CONTEÚDO', 50, yPosition);
        yPosition += 25;

        doc.fillColor('#333').fontSize(11).font('Helvetica').text(
          'Este documento foi gerado automaticamente através do comando /pdf do OlympIA Bot. ' +
          'O sistema utiliza tecnologia avançada de processamento de documentos para criar ' +
          'arquivos PDF profissionais com formatação executiva.',
          50, yPosition,
          {
            width: 480,
            align: 'justify'
          }
        );

        yPosition += 80;

        // Características técnicas
        doc.fillColor('#1a365d').fontSize(12).font('Helvetica-Bold').text('⚙️ CARACTERÍSTICAS TÉCNICAS', 50, yPosition);
        yPosition += 20;

        const features = [
          '✅ Formatação profissional executiva',
          '✅ Compatibilidade com PDF/A-4',
          '✅ Codificação UTF-8 completa',
          '✅ Otimizado para impressão',
          '✅ Metadados incorporados'
        ];

        features.forEach(feature => {
          doc.fillColor('#333').fontSize(10).font('Helvetica').text(feature, 70, yPosition);
          yPosition += 15;
        });

        // Footer
        const footerY = 750;
        doc.strokeColor('#dee2e6').moveTo(50, footerY).lineTo(545, footerY).stroke();
        doc.fillColor('#666').fontSize(8).font('Helvetica').text(
          'OlympIA Bot - Documentação Automática | Tecnologia de IA Avançada',
          50, footerY + 10,
          { align: 'center' }
        );

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

    // ============================================
    // SISTEMA DE LOGIN & BANCO DE DADOS
    // ============================================

    // 👤 Comando /meus-dados - Ver dados do usuário
    this.bot.onText(/\/meus-dados/, (msg) => {
      const chatId = msg.chat.id;
      const emoji = COMMAND_ICONS['/info'] || '👤';
      
      const user = getUserByChatId(chatId);

      if (!user) {
        this.bot.sendMessage(chatId, 
          `${emoji} *Nenhum cadastro encontrado.*\n\n` +
          `Use /start para iniciar`,
          { parse_mode: 'Markdown' }
        );
        return;
      }

      const history = getUserLoginHistory(user.id, 5);
      let historyText = '';
      
      if (history.length > 0) {
        historyText = '\n📋 *Últimos Logins:*\n';
        history.forEach((log, idx) => {
          historyText += `${idx + 1}. ${new Date(log.login_time).toLocaleString('pt-BR')}\n`;
        });
      }

      this.bot.sendMessage(chatId, 
        `${emoji} *Seus Dados Cadastrados*\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 Nome: *${user.name}*\n` +
        `📧 Email: *${user.email}*\n` +
        `🔐 ID do Chat: ${user.chat_id}\n` +
        `✅ Status: ${user.status === 'active' ? '🟢 Ativo' : '⚪ Inativo'}\n` +
        `📊 Total de Logins: ${user.login_count}\n` +
        `📅 Data de Registro: ${new Date(user.created_at).toLocaleString('pt-BR')}\n` +
        `🕐 Último Login: ${new Date(user.last_login).toLocaleString('pt-BR')}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        historyText,
        { parse_mode: 'Markdown' }
      );
    });

    // 📊 Comando /usuarios - Ver banco de dados (ADMIN)
    this.bot.onText(/\/usuarios/, (msg) => {
      const chatId = msg.chat.id;
      const emoji = '📊';

      // Buscar todos os usuários
      const users = getAllUsers();
      const stats = getUserStats();

      if (users.length === 0) {
        this.bot.sendMessage(chatId, 
          `${emoji} *Banco de Dados Vazio*\n\n` +
          `Nenhum usuário registrado ainda!`
        );
        return;
      }

      // Criar tabela de usuários
      let message = `${emoji} *BANCO DE DADOS - OlympIA Login System*\n\n`;
      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      message += `📊 *ESTATÍSTICAS GERAIS*\n`;
      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      message += `👥 Total de Usuários: *${stats.totalUsers}*\n`;
      message += `🟢 Usuários Ativos: *${stats.activeUsers}*\n`;
      message += `📝 Total de Logins: *${stats.totalLogins}*\n`;
      message += `🕐 Logins Hoje: *${stats.loginsToday}*\n\n`;

      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      message += `📋 *LISTA DE USUÁRIOS*\n`;
      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      users.forEach((user, idx) => {
        message += `${idx + 1}️⃣ *${user.name}*\n`;
        message += `   📧 Email: ${user.email}\n`;
        message += `   🆔 Chat ID: ${user.chat_id}\n`;
        message += `   📊 Logins: ${user.login_count}\n`;
        message += `   ✅ Status: ${user.status}\n`;
        message += `   📅 Registro: ${new Date(user.created_at).toLocaleDateString('pt-BR')}\n\n`;
      });

      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      message += `💡 Para exportar em JSON: /exportar-db`;

      // Se a mensagem ficar muito grande, dividir
      if (message.length > 4096) {
        const chunks = message.match(/[\s\S]{1,4096}/g) || [];
        chunks.forEach(chunk => {
          this.bot.sendMessage(chatId, chunk, { parse_mode: 'Markdown' });
        });
      } else {
        this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      }
    });

    // 📤 Comando /exportar-db - Exportar banco em JSON
    this.bot.onText(/\/exportar-db/, (msg) => {
      const chatId = msg.chat.id;
      const emoji = '📤';

      try {
        const data = exportDatabaseAsJSON();

        if (!data) {
          this.bot.sendMessage(chatId, `${emoji} Erro ao exportar banco de dados`);
          return;
        }

        const jsonString = JSON.stringify(data, null, 2);
        const fileName = `olympia-database-${new Date().toISOString().split('T')[0]}.json`;
        const filePath = path.join('/tmp', fileName);

        fs.writeFileSync(filePath, jsonString);

        this.bot.sendDocument(chatId, filePath, {
          caption: `${emoji} *Banco de Dados Exportado!*\n\n` +
                   `📊 Total de usuários: ${data.statistics.totalUsers}\n` +
                   `📝 Total de logins: ${data.statistics.totalLogins}\n` +
                   `📅 Data da exportação: ${new Date(data.exportedAt).toLocaleString('pt-BR')}`,
          parse_mode: 'Markdown'
        });

        // Limpar arquivo após enviar
        setTimeout(() => {
          try {
            fs.unlinkSync(filePath);
          } catch (e) {}
        }, 2000);
      } catch (error) {
        this.bot.sendMessage(chatId, `${emoji} Erro ao exportar: ${error.message}`);
      }
    });

    // 🔍 Comando /procurar-email - Buscar usuário por email
    this.bot.onText(/\/procurar-email (.+)/, (msg, match) => {
      const chatId = msg.chat.id;
      const email = match[1].trim();
      const emoji = '🔍';

      const allUsers = getAllUsers();
      const user = allUsers.find(u => u.email === email);

      if (!user) {
        this.bot.sendMessage(chatId, 
          `${emoji} *Email não encontrado no sistema*\n\n` +
          `Email procurado: \`${email}\``
        );
        return;
      }

      this.bot.sendMessage(chatId, 
        `${emoji} *Usuário Encontrado!*\n\n` +
        `👤 Nome: *${user.name}*\n` +
        `📧 Email: *${user.email}*\n` +
        `🆔 Chat ID: ${user.chat_id}\n` +
        `📊 Logins: ${user.login_count}\n` +
        `✅ Status: ${user.status}\n` +
        `📅 Registro: ${new Date(user.created_at).toLocaleString('pt-BR')}\n` +
        `🕐 Último Login: ${new Date(user.last_login).toLocaleString('pt-BR')}`,
        { parse_mode: 'Markdown' }
      );
    });

    // 👑 ADMINISTRAÇÃO - Inicializar sistema de admin
    console.log('🔐 Inicializando sistema administrativo...');
    try {
      // Configurar comando /info para admins
      setupAdminInfoCommand(this.bot);
      console.log('✅ Painel Admin (/info) ativado');

      // Inicializar relatórios diários (05:00)
      initializeDailyReportSchedule(this.bot);
      console.log('✅ Relatórios automáticos agendados (05:00 diariamente)');

      // Verificar integridade do banco
      const db = await import('better-sqlite3').then(m => new m.default('./database.sqlite'));
      adminSecurity.verifyDatabaseIntegrity(db);
      console.log('✅ Integridade do banco verificada');

      // Limpar logs antigos (>90 dias)
      adminSecurity.cleanOldLogs();
      console.log('✅ Logs de auditória limpos');
    } catch (error) {
      console.error('⚠️  Erro ao inicializar sistema admin:', error.message);
    }

    console.log('🤖 Bot do Telegram iniciado!');
    console.log('⚠️  Certifique-se de ter configurado o TELEGRAM_TOKEN');
  }

  async start() {

      // Iniciar monitoramento de saúde (verifica a cada 1 minuto)
      startHealthMonitoring(this.bot);

    try {
      await this.connectMCP();
    } catch (error) {
      console.log('⚠️ Bot iniciando sem MCP devido a erro:', error.message);
    }

    console.log('✅ ⚡ OlympIA está rodando!');
    console.log('📱 Envie /start no seu bot do Telegram para começar');
  }
}

// Iniciar bot
const bot = new TelegramOlympIA();
bot.start().catch(console.error);
