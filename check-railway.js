#!/usr/bin/env node

// Script de verificação específica para Railway
console.log('🚂 Verificação específica para Railway...\n');

// Verificar se estamos no Railway
const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID;
console.log('Ambiente Railway:', isRailway ? '✅ Sim' : '❌ Não (ambiente local)');

// Verificar variáveis críticas do Railway
console.log('\n🔧 Variáveis do Railway:');
const railwayVars = [
  'RAILWAY_ENVIRONMENT',
  'RAILWAY_PROJECT_ID',
  'RAILWAY_STATIC_URL'
];

railwayVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`${varName}: ${value ? '✅ Presente' : '❌ Ausente'}`);
});

// Verificar se o diretório de dados existe
console.log('\n💾 Verificação de armazenamento:');
const fs = await import('fs');
const dataDir = '/app/data';

try {
  if (fs.existsSync(dataDir)) {
    console.log('✅ Diretório /app/data existe');
    const stats = fs.statSync(dataDir);
    console.log('Permissões:', stats.mode);
  } else {
    console.log('❌ Diretório /app/data não existe');
    console.log('💡 Isso é normal no primeiro deploy');
  }
} catch (error) {
  console.log('❌ Erro ao verificar /app/data:', error.message);
}

// Verificar se podemos escrever no diretório atual
try {
  const testFile = 'railway-test.tmp';
  fs.writeFileSync(testFile, 'test');
  fs.unlinkSync(testFile);
  console.log('✅ Escrita no diretório atual: OK');
} catch (error) {
  console.log('❌ Erro de escrita no diretório atual:', error.message);
}

// Verificar uso de memória
console.log('\n🧠 Verificação de memória:');
const memUsage = process.memoryUsage();
console.log(`RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`);
console.log(`Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
console.log(`Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);

if (memUsage.heapUsed > 400 * 1024 * 1024) { // 400MB
  console.log('⚠️ Alto uso de memória - pode causar problemas no Railway Starter');
}

// Verificar tempo de inicialização
console.log('\n⏱️ Verificação de performance:');
const startTime = Date.now();
await new Promise(resolve => setTimeout(resolve, 100));
const initTime = Date.now() - startTime;
console.log(`Tempo de resposta: ${initTime}ms`);

console.log('\n🎯 Verificação concluída!');
console.log('💡 Problemas comuns no Railway:');
console.log('• Memória insuficiente (upgrade para Hobby se >400MB)');
console.log('• Arquivos grandes no repositório');
console.log('• Dependências não otimizadas');
console.log('• Timeouts de healthcheck');