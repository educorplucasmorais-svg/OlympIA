#!/usr/bin/env node

// Script de diagnóstico para deploy no Railway
console.log('🚀 Iniciando diagnóstico do OlympIA Bot...\n');

// Teste 1: Verificar Node.js
console.log('📋 Teste 1: Ambiente Node.js');
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);

// Teste 2: Verificar dependências críticas
console.log('\n📦 Teste 2: Dependências críticas');
const deps = [
  'dotenv',
  'node-telegram-bot-api',
  'better-sqlite3',
  'axios'
];

for (const dep of deps) {
  try {
    await import(dep);
    console.log(`✅ ${dep}: OK`);
  } catch (e) {
    console.log(`❌ ${dep}: FALHA - ${e.message}`);
  }
}

// Teste 3: Verificar variáveis de ambiente
console.log('\n🔐 Teste 3: Variáveis de ambiente');
const dotenv = await import('dotenv');
dotenv.config();

const requiredEnvVars = [
  'TELEGRAM_TOKEN',
  'REPLICATE_API_KEY'
];

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value && value.length > 10) {
    console.log(`✅ ${envVar}: Presente (${value.length} chars)`);
  } else {
    console.log(`❌ ${envVar}: Ausente ou muito curto`);
  }
});

// Teste 4: Verificar inicialização do bot (simulação)
console.log('\n🤖 Teste 4: Inicialização do bot (simulação)');
try {
  const { default: TelegramBot } = await import('node-telegram-bot-api');

  // Simular criação do bot (sem conectar)
  const token = process.env.TELEGRAM_TOKEN;
  if (token) {
    const bot = new TelegramBot(token, { polling: false });
    console.log('✅ Bot instance criado com sucesso');
  } else {
    console.log('❌ TOKEN do Telegram não encontrado');
  }
} catch (error) {
  console.log('❌ Erro na criação do bot:', error.message);
}

// Teste 5: Verificar banco de dados
console.log('\n💾 Teste 5: Banco de dados');
try {
  const { default: Database } = await import('better-sqlite3');
  const db = new Database(':memory:'); // Teste em memória
  db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');
  db.exec('INSERT INTO test (name) VALUES (?)', ['test']);
  const result = db.prepare('SELECT * FROM test').get();
  db.close();

  if (result && result.name === 'test') {
    console.log('✅ SQLite funcionando corretamente');
  } else {
    console.log('❌ SQLite com problemas');
  }
} catch (error) {
  console.log('❌ Erro no SQLite:', error.message);
}

console.log('\n🎯 Diagnóstico concluído!');
console.log('💡 Se todos os testes passaram, o deploy deve funcionar.');
console.log('🔍 Caso contrário, verifique os erros acima.');