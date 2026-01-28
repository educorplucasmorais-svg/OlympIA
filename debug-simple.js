import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';

console.log('🔍 DEBUG SIMPLES: Testando apenas o bot...');

// Carregar .env
dotenv.config();

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;

if (!TELEGRAM_TOKEN) {
  console.error('❌ TOKEN AUSENTE!');
  process.exit(1);
}

console.log('✅ Token OK');

try {
  console.log('🤖 Criando bot...');
  const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false }); // Sem polling por enquanto
  console.log('✅ Bot criado!');

  // Testar getMe
  console.log('🔍 Testando getMe...');
  bot.getMe().then((me) => {
    console.log('✅ Bot conectado! Nome:', me.first_name);
    console.log('🎉 Tudo funcionando!');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Erro no getMe:', error.message);
    process.exit(1);
  });

} catch (error) {
  console.error('❌ Erro na criação:', error.message);
  process.exit(1);
}