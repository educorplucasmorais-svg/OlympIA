import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import { initializeDatabase } from './database.js';
import adminCommands from './admin-commands.js';

console.log('🚀 Iniciando OlympIA Bot - Versão Simplificada...');

// Carregar variáveis de ambiente
dotenv.config();

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const ADMIN_CHAT_IDS = (process.env.ADMIN_CHAT_IDS || '').split(',').map(id => id.trim());

if (!TELEGRAM_TOKEN) {
  console.error('❌ ERRO: TELEGRAM_TOKEN não configurado!');
  process.exit(1);
}

console.log('✅ Configurações carregadas');

// Inicializar banco de dados
initializeDatabase();
console.log('✅ Banco de dados inicializado');

// Criar instância do bot
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
console.log('🤖 Bot do Telegram criado');

// Configurar handlers básicos
bot.on('polling_error', (error) => {
  console.log('🔄 Erro de polling:', error.code, error.message);
});

bot.on('message', (msg) => {
  console.log(`📨 Mensagem de ${msg.from.first_name}: ${msg.text}`);
});

// Configurar comandos admin
adminCommands.setupAdminInfoCommand(bot);
console.log('🔐 Sistema admin configurado');

// Comando de teste
bot.onText(/\/teste/, (msg) => {
  bot.sendMessage(msg.chat.id, '✅ Bot funcionando! Use /admin para ver o menu interativo.');
});

console.log('🎉 Bot iniciado com sucesso!');
console.log('📱 Envie /teste no Telegram para verificar');
console.log('🔐 Envie /admin para testar os cards interativos');