import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';

console.log('🔍 DEBUG: Iniciando bot...');

// Carregar variáveis de ambiente
dotenv.config();
console.log('✅ Dotenv carregado');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
console.log('🔑 Token presente:', !!TELEGRAM_TOKEN);

if (!TELEGRAM_TOKEN) {
  console.error('❌ ERRO: TELEGRAM_TOKEN não encontrado!');
  process.exit(1);
}

console.log('🤖 Criando instância do bot...');
try {
  const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
  console.log('✅ Bot criado com sucesso!');

  // Testar conexão
  bot.on('polling_error', (error) => {
    console.error('❌ Erro de polling:', error.message);
  });

  bot.on('message', (msg) => {
    console.log('📨 Mensagem recebida:', msg.text);
  });

  console.log('🎉 Bot iniciado! Aguardando mensagens...');

} catch (error) {
  console.error('❌ Erro ao criar bot:', error.message);
  process.exit(1);
}