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
  registerUser, 
  loginUser, 
  getUserByChatId, 
  getAllUsers, 
  getUserStats,
  exportDatabaseAsJSON,
  getUserLoginHistory
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
import { setupAdminInfoCommand } from './admin-commands.js';
import { initializeDailyReportSchedule, generateReportOnDemand } from './daily-report.js';
import adminSecurity from './admin-security.js';

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
    
    // Inicializar banco de dados
    initializeDatabase();
    
    // Sistema de login (armazena estado de registro)
    this.userRegistration = {}; // { chatId: { step: 'name'|'email', data: {...} } }
    
    this.setupBot();
  }

  async connectMCP() {
    // Se já temos pool, reusar
    if (this.mcpPool && OPTIMIZATION_FLAGS.enableMCPPool) {
      return true;
    }

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
      return true;
    } catch (error) {
      console.error('❌ Erro ao conectar com MCP:', error.message);
      return false;
    }
  }

  // Variável para armazenar comandos hot (atualizada às 05:00)
  hotCommands = [];

  setupBot() {
    // Comando /start - Sistema de Login Obrigatório
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      
      // Verificar se usuário já está registrado
      try {
        const user = await getUserByChatId(chatId);
        
        if (user) {
          // Usuário já existe - fazer login
          await loginUser(chatId);
          
          // Verificar se é admin
          const isAdmin = user.is_admin || [4, 5, 6, 7].includes(chatId);
          
          if (isAdmin) {
            await this.showAdminMenu(chatId, user.name);
          } else {
            await this.showUserMenu(chatId, user.name);
          }
        } else {
          // Novo usuário - iniciar registro
          this.userRegistration[chatId] = { step: 'name' };
          this.bot.sendMessage(chatId, 
            '👋 *Bem-vindo à OlympIA!*\n\n' +
            'Para começar, preciso de algumas informações:\n\n' +
            '📝 *Qual é o seu nome?*',
            { parse_mode: 'Markdown' }
          );
        }
      } catch (error) {
        console.error('Erro no /start:', error);
        this.bot.sendMessage(chatId, '❌ Erro ao processar. Tente novamente.');
      }
    });

    // Método para mostrar menu ADMIN
    this.showAdminMenu = async (chatId, userName) => {
      const hot = (cmd) => this.hotCommands.includes(cmd) ? '🔥 ' : '';
      
      await this.bot.sendMessage(chatId,
        `👑 *Olá ${userName}! Acesso Admin*\n\n` +
        '*Painel Administrativo:*\n' +
        '📊 `/info` - Painel completo de gerência\n\n' +
        '*Comandos Disponíveis:*\n\n' +
        '✨ *Criatividade com IA*\n' +
        `• ${hot('/gerar')}💡 \`/gerar\` - Criar ideias geniais\n` +
        `• ${hot('/analisar')}🔍 \`/analisar\` - Análise profunda\n` +
        `• ${hot('/keywords')}🎯 \`/keywords\` - Palavras-chave\n` +
        `• ${hot('/imagem')}🎭 \`/imagem\` - Gerar imagens\n` +
        `• ${hot('/chat')}💭 \`/chat\` - Conversa inteligente\n\n` +
        '🛠️ *Ferramentas*\n' +
        `• ${hot('/traduzir')}🌍 \`/traduzir\` - Tradução\n` +
        `• ${hot('/senha')}🔐 \`/senha\` - Gerar senha\n` +
        `• ${hot('/morse')}📡 \`/morse\` - Código Morse\n` +
        `• ${hot('/noticias')}📰 \`/noticias\` - Notícias\n` +
        `• ${hot('/falar')}🎙️ \`/falar\` - Text-to-Speech\n` +
        `• ${hot('/ocr')}📸 \`/ocr\` - Extrair texto\n` +
        `• ${hot('/email')}✉️ \`/email\` - Enviar email\n` +
        `• ${hot('/lembrete')}⏰ \`/lembrete\` - Lembretes\n` +
        `• ${hot('/pdf')}📋 \`/pdf\` - Gerar PDF\n` +
        `• ${hot('/google')}🔎 \`/google\` - Pesquisar\n\n` +
        '📚 *Conhecimento*\n' +
        `• ${hot('/conhecimento')}📚 \`/conhecimento\` - Base de dados IA\n` +
        `• ${hot('/kb:stats')}📈 \`/kb:stats\` - Estatísticas\n\n` +
        '🎯 *Marketing*\n' +
        `• ${hot('/marketing')}📊 \`/marketing\` - Estratégias\n` +
        `• ${hot('/promocao')}🎉 \`/promocao\` - Posts virais\n\n` +
        '💡 *Ou escreva qualquer coisa para conversar!*',
        { parse_mode: 'Markdown' }
      );
    };

    // Método para mostrar menu USUÁRIO
    this.showUserMenu = async (chatId, userName) => {
      const hot = (cmd) => this.hotCommands.includes(cmd) ? '🔥 ' : '';
      
      await this.bot.sendMessage(chatId,
        `🤖 *Olá ${userName}! Bem-vindo à OlympIA*\n` +
        'Sua IA inteligente com superpoderes\n\n' +
        '✨ *Criatividade com IA*\n' +
        `• ${hot('/gerar')}💡 \`/gerar\` - Criar ideias geniais\n` +
        `• ${hot('/analisar')}🔍 \`/analisar\` - Análise profunda\n` +
        `• ${hot('/keywords')}🎯 \`/keywords\` - Palavras-chave\n` +
        `• ${hot('/imagem')}🎭 \`/imagem\` - Gerar imagens\n` +
        `• ${hot('/chat')}💭 \`/chat\` - Conversa inteligente\n\n` +
        '🛠️ *Ferramentas*\n' +
        `• ${hot('/traduzir')}🌍 \`/traduzir\` - Tradução\n` +
        `• ${hot('/senha')}🔐 \`/senha\` - Gerar senha\n` +
        `• ${hot('/morse')}📡 \`/morse\` - Código Morse\n` +
        `• ${hot('/noticias')}📰 \`/noticias\` - Notícias\n` +
        `• ${hot('/falar')}🎙️ \`/falar\` - Text-to-Speech\n` +
        `• ${hot('/ocr')}📸 \`/ocr\` - Extrair texto\n` +
        `• ${hot('/email')}✉️ \`/email\` - Enviar email\n` +
        `• ${hot('/lembrete')}⏰ \`/lembrete\` - Lembretes\n` +
        `• ${hot('/pdf')}📋 \`/pdf\` - Gerar PDF\n` +
        `• ${hot('/google')}🔎 \`/google\` - Pesquisar\n\n` +
        '📚 *Conhecimento*\n' +
        `• ${hot('/conhecimento')}📚 \`/conhecimento\` - Base de dados IA\n` +
        `• ${hot('/kb:stats')}📈 \`/kb:stats\` - Estatísticas\n\n` +
        '🎯 *Marketing*\n' +
        `• ${hot('/marketing')}📊 \`/marketing\` - Estratégias\n` +
        `• ${hot('/promocao')}🎉 \`/promocao\` - Posts virais\n\n` +
        '💡 *Ou escreva qualquer coisa para conversar!*',
        { parse_mode: 'Markdown' }
      );
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
    this.bot.onText(/\/conhecimento (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const query = match[1];
      const emoji = COMMAND_ICONS['/conhecimento'];
      
      // 🚦 Rate limiting
      if (OPTIMIZATION_FLAGS.enableRateLimiting) {
        try {
          await kbRateLimiter.call(async () => {});
        } catch (error) {
          await this.bot.sendMessage(chatId, 
            `${emoji} *Calma lá!* 🛑\n\nEstou processando muitas perguntas. Tenta novamente em alguns segundos!`
          );
          return;
        }
      }
      
      const startTime = Date.now();
      await this.bot.sendMessage(chatId, `${emoji} *Deixa eu mergulhar na minha base de conhecimento...*`);
      
      try {
        // ✨ Com cache + timeout + retry
        let result;
        
        if (OPTIMIZATION_FLAGS.enableKBCache) {
          const cacheKey = `kb:${query.toLowerCase()}`;
          result = await cachedWithProtection(
            kbCache,
            cacheKey,
            () => knowledgeBase.answerQuestion(query),
            {
              operationName: `/conhecimento:${query.substring(0, 20)}`,
              timeout: OPTIMIZATION_FLAGS.kbTimeout,
              maxRetries: 2,
              ttlMs: 5 * 60 * 1000, // 5 minutos
              enableCache: true
            }
          );
        } else {
          result = await knowledgeBase.answerQuestion(query);
        }
        
        const timeMs = Date.now() - startTime;
        logPerformance(`/conhecimento`, timeMs, kbCache.get(`kb:${query.toLowerCase()}`) !== undefined);
        
        if (result.hasContext) {
          let response = `${emoji} *Encontrei essa resposta:*\n\n━━━━━━━━━━━━━━━━━━━━━━\n${result.answer}\n━━━━━━━━━━━━━━━━━━━━━━`;
          
          if (result.sources && result.sources.length > 0) {
            response += `\n\n📚 *${result.sources.length} documento(s) consultado(s)*`;
          }
          
          response += `\n⏱️ *Tempo: ${timeMs}ms*`;
          
          await this.bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
        } else {
          await this.bot.sendMessage(chatId, 
            `${emoji} *Ops! Não encontrei nada sobre isso na minha base.*\n\n` +
            '💡 *Que tal:*\n' +
            '• Tentar uma pergunta diferente?\n' +
            '• Adicionar documentos com `/knowledge:load`?\n' +
            '• Usar `/chat` para conversa livre?',
            { parse_mode: 'Markdown' }
          );
        }
      } catch (error) {
        const timeMs = Date.now() - startTime;
        await this.bot.sendMessage(chatId, 
          `${emoji} *Deu ruim aqui...*\n\n❌ ${error.message}\n\n⏱️ Tempo: ${timeMs}ms\n\nTenta de novo? 🤔`,
          { parse_mode: 'Markdown' }
        );
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
    this.bot.onText(/\/gerar (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const text = match[1];
      
      // Mensagem humanizada com emoji customizado
      const emoji = COMMAND_ICONS['/gerar'];
      await this.bot.sendMessage(chatId, `${emoji} Deixa eu trabalhar minha mágica aqui... ✨`);
      
      try {
        if (!this.mcpClient) {
          await this.connectMCP();
        }

        const result = await this.mcpClient.callTool({
          name: 'olympia_reasoning',
          arguments: { prompt: `Crie um conteúdo de qualidade sobre: ${text}\n\nSeja criativo, preciso e útil.` }
        });

        const response = result.content[0].text;
        await this.bot.sendMessage(chatId, `${emoji} *Pronto! Aqui está seu conteúdo:*\n\n${response}`);
      } catch (error) {
        await this.bot.sendMessage(chatId, `❌ Ops! Algo deu errado: ${error.message}\n\nTenta de novo? 🤔`);
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
    // 💭 Comando /chat - Chat com memória
    this.bot.onText(/\/chat (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const mensagem = match[1];
      const emoji = COMMAND_ICONS['/chat'];

      if (!conversations[chatId]) {
        conversations[chatId] = [];
      }

      conversations[chatId].push({ role: 'user', content: mensagem });

      try {
        if (!this.mcpClient) {
          await this.connectMCP();
        }

        await this.bot.sendMessage(chatId, `${emoji} *Deixa eu pensar um pouco...*`);

        // Construir histórico com melhor formato
        const historicoTexto = conversations[chatId]
          .slice(-10) // Últimas 10 mensagens
          .map(m => `${m.role === 'user' ? 'Você' : 'OlympIA'}: ${m.content}`)
          .join('\n');
          
        const prompt = `Você é OlympIA ⚡, um assistente inteligente, divertido e preciso que SEMPRE é autêntica e personável.\n\nHistórico da conversa:\n${historicoTexto}\n\nResponda de forma natural, conversacional, e sem alucinar. Use emojis quando apropriado para parecer mais humana.`;
        
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

        await this.bot.sendMessage(chatId, `${emoji} ${resposta}`);
      } catch (error) {
        await this.bot.sendMessage(chatId, 
          `${emoji} *Opa! Meu cérebro travou um segundo...*\n\n❌ ${error.message}\n\nTenta de novo? 🤔`,
          { parse_mode: 'Markdown' }
        );
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

    // Mensagens gerais (sem comando) - Chat Humanizado
    this.bot.on('message', async (msg) => {
      // Ignora se for um comando
      if (msg.text && msg.text.startsWith('/')) {
        return;
      }

      const chatId = msg.chat.id;
      const text = msg.text;

      if (!text) return;

      // Verificar se é processo de registro
      if (this.userRegistration[chatId]) {
        const regData = this.userRegistration[chatId];
        
        if (regData.step === 'name') {
          // Salvar nome e pedir email
          regData.name = text;
          regData.step = 'email';
          return this.bot.sendMessage(chatId, 
            `Prazer, *${text}*! 😊\n\n` +
            '📧 *Qual é o seu email?*\n' +
            '_Usaremos para relatórios e recuperação de conta_',
            { parse_mode: 'Markdown' }
          );
        } else if (regData.step === 'email') {
          // Validar email e registrar
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(text)) {
            return this.bot.sendMessage(chatId, 
              '❌ Email inválido.\n\n' +
              'Por favor, digite um email válido:',
              { parse_mode: 'Markdown' }
            );
          }
          
          try {
            // Registrar usuário
            await registerUser(regData.name, text, chatId);
            await loginUser(chatId);
            
            delete this.userRegistration[chatId];
            
            await this.bot.sendMessage(chatId, 
              '✅ *Cadastro concluído com sucesso!*\n\n' +
              `Bem-vindo, ${regData.name}! 🎉`,
              { parse_mode: 'Markdown' }
            );
            
            // Mostrar menu de usuário
            await this.showUserMenu(chatId, regData.name);
          } catch (error) {
            console.error('Erro ao registrar:', error);
            delete this.userRegistration[chatId];
            return this.bot.sendMessage(chatId, '❌ Erro ao registrar. Use /start para tentar novamente.');
          }
          return;
        }
      }

      // Chat humanizado padrão
      const thinkingMsg = await this.bot.sendMessage(chatId, '💭 Pensando...');

      try {
        if (!this.mcpClient) {
          await this.connectMCP();
        }

        // Timeout de 30 segundos para respostas
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout: Resposta demorou mais de 30s')), 30000);
        });

        // Prompt para respostas curtas e humanizadas
        let prompt = `Você é OlympIA, uma assistente virtual amigável e prestativa. ` +
          `Responda de forma CURTA (máximo 3 linhas), humanizada e natural. ` +
          `Se identificar que o usuário precisa de um comando específico, sugira de forma sutil. ` +
          `\n\nUsuário: ${text}`;
        
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
            '⏱️ *Ops! Demorei demais...*\n\n' +
            'A resposta está demorando mais que o esperado. Tente novamente ou use um comando específico! 😊',
            { parse_mode: 'Markdown' }
          );
        } else {
          await this.bot.sendMessage(chatId, `❌ Erro: ${error.message}`);
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

    // ============================================
    // SISTEMA DE LOGIN & BANCO DE DADOS
    // ============================================

    // 🔐 Comando /login - Sistema de autenticação
    this.bot.onText(/\/login/, (msg) => {
      const chatId = msg.chat.id;
      const emoji = COMMAND_ICONS['/inicio'] || '🔐';
      
      // Verificar se usuário já está cadastrado
      const existingUser = getUserByChatId(chatId);
      
      if (existingUser) {
        this.bot.sendMessage(chatId, 
          `${emoji} *Você já tem cadastro!*\n\n` +
          `👤 Nome: ${existingUser.name}\n` +
          `📧 Email: ${existingUser.email}\n` +
          `✅ Status: Ativo\n` +
          `📊 Logins: ${existingUser.login_count}\n` +
          `🕐 Último login: ${new Date(existingUser.last_login).toLocaleString('pt-BR')}\n\n` +
          `💡 Use /meus-dados para ver informações completas`,
          { parse_mode: 'Markdown' }
        );
        return;
      }

      // Iniciar processo de registro
      this.userRegistration[chatId] = { step: 'name', data: {} };
      
      this.bot.sendMessage(chatId, 
        `${emoji} *Bem-vindo ao Sistema de Login da OlympIA!* 👋\n\n` +
        `Vou fazer umas perguntas rápidas para registrar você.\n\n` +
        `❓ *Qual é seu nome completo?*`
      );
    });

    // 📝 Handler para receber nome (primeira etapa do registro)
    this.bot.on('message', (msg) => {
      const chatId = msg.chat.id;
      const text = msg.text;

      // Ignorar se for comando
      if (text && text.startsWith('/')) return;

      // Se está no processo de registro
      if (this.userRegistration[chatId]) {
        const registration = this.userRegistration[chatId];

        if (registration.step === 'name') {
          registration.data.name = text;
          registration.step = 'email';
          
          this.bot.sendMessage(chatId, 
            `✅ Anotado! Seu nome é *${text}*\n\n` +
            `❓ Agora, qual é seu email?`
          );
        } 
        else if (registration.step === 'email') {
          const email = text.trim();
          
          // Validar email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            this.bot.sendMessage(chatId, 
              `❌ Email inválido!\n\n` +
              `Use um email válido: seu.email@dominio.com`
            );
            return;
          }

          // Registrar usuário no banco
          registration.data.email = email;
          const result = registerUser(chatId, registration.data.name, email);

          if (result.success) {
            this.bot.sendMessage(chatId, 
              `${COMMAND_ICONS['/inicio'] || '🔐'} *Cadastro Realizado com Sucesso!* 🎉\n\n` +
              `✅ Bem-vindo, *${registration.data.name}*!\n\n` +
              `📧 Email registrado: ${email}\n` +
              `🔐 ID Único: #${result.userId}\n\n` +
              `🚀 Agora você tem acesso a todos os comandos da OlympIA!\n\n` +
              `Use /meus-dados para ver seu perfil`,
              { parse_mode: 'Markdown' }
            );
          } else {
            this.bot.sendMessage(chatId, 
              `⚠️ ${result.message}`
            );
          }

          // Limpar processo de registro
          delete this.userRegistration[chatId];
        }
      }
    });

    // 👤 Comando /meus-dados - Ver dados do usuário
    this.bot.onText(/\/meus-dados/, (msg) => {
      const chatId = msg.chat.id;
      const emoji = COMMAND_ICONS['/info'] || '👤';
      
      const user = getUserByChatId(chatId);

      if (!user) {
        this.bot.sendMessage(chatId, 
          `${emoji} *Você ainda não fez login!*\n\n` +
          `Use /login para registrar-se`,
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
    await this.connectMCP();
    console.log('✅ ⚡ OlympIA está rodando!');
    console.log('📱 Envie /start no seu bot do Telegram para começar');
  }
}

// Iniciar bot
const bot = new TelegramOlympIA();
bot.start().catch(console.error);
