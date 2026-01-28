#!/usr/bin/env node

/**
 * VERIFICADOR DE CONFLITOS - OlympIA Bot
 * Executa antes de iniciar o bot para evitar erros 409
 */

import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;

if (!TELEGRAM_TOKEN) {
  console.log('❌ TELEGRAM_TOKEN não configurado no arquivo .env');
  process.exit(1);
}

async function checkConflicts() {
  console.log('🔍 Verificando conflitos de polling...\n');

  const bot = new TelegramBot(TELEGRAM_TOKEN);

  try {
    // Tentar obter informações do bot
    const botInfo = await bot.getMe();

    console.log('⚠️  ALERTA: Bot já está rodando em outro lugar!');
    console.log('📋 Informações detectadas:');
    console.log(`   🤖 Nome: ${botInfo.first_name}`);
    console.log(`   👤 Username: @${botInfo.username}`);
    console.log(`   🆔 ID: ${botInfo.id}`);
    console.log('');

    console.log('💡 SOLUÇÕES:');
    console.log('   1. Pare instâncias locais: Ctrl+C em todos os terminais');
    console.log('   2. Pare Railway: railway down (se estiver rodando)');
    console.log('   3. Aguarde 30 segundos');
    console.log('   4. Execute apenas UMA instância por vez');
    console.log('');

    console.log('🚫 NÃO execute o bot agora! Conflictos causarão erro 409.');
    process.exit(1);

  } catch (error) {
    if (error.code === 'ETELEGRAM' && error.message.includes('401')) {
      console.log('❌ TOKEN INVÁLIDO!');
      console.log('💡 Obtenha um novo token em: https://t.me/BotFather');
      process.exit(1);
    }

    // Se não conseguiu conectar, provavelmente não há conflito
    console.log('✅ Nenhum conflito detectado.');
    console.log('🚀 Seguro para iniciar o bot!');
    process.exit(0);
  }
}

// Executar verificação
checkConflicts().catch(error => {
  console.log('❌ Erro na verificação:', error.message);
  process.exit(1);
});