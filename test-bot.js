import TelegramBot from 'node-telegram-bot-api';

const token = '8426049953:AAEuswuXhwEp-JUJNNYNwos8qd69Df4egeI';
const bot = new TelegramBot(token, { polling: true });

console.log('🤖 Bot de teste iniciado!');

bot.on('polling_error', (error) => {
  console.log('❌ ERRO DE POLLING:', error.message);
});

bot.on('message', (msg) => {
  console.log('📨 MENSAGEM RECEBIDA:', msg.text);
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Recebi sua mensagem: ' + msg.text);
});

console.log('✅ Aguardando mensagens...');
