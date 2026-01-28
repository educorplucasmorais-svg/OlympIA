#!/usr/bin/env node

/**
 * 🎛️ OPTIMIZATION CONTROL PANEL
 * 
 * Script interativo para gerenciar otimizações
 * Uso: node optimization-control.js
 */

import readline from 'readline';
import { 
  OPTIMIZATION_FLAGS,
  toggleOptimization,
  disableAllOptimizations,
  enableAllOptimizations,
  printStatus,
  kbCache,
  statsCache,
  translationCache,
  generationCache
} from './optimization-config.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question) {
  return new Promise(resolve => {
    rl.question(question, resolve);
  });
}

async function showMenu() {
  console.clear();
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║  🎛️  OPTIMIZATION CONTROL PANEL - OlympIA Bot      ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  console.log('📊 STATUS RÁPIDO:');
  console.log(`   Cache: ${OPTIMIZATION_FLAGS.enableKBCache ? '✅' : '❌'}`);
  console.log(`   Pool: ${OPTIMIZATION_FLAGS.enableMCPPool ? '✅' : '❌'}`);
  console.log(`   Timeouts: ${OPTIMIZATION_FLAGS.enableTimeouts ? '✅' : '❌'}`);
  console.log(`   Rate Limiter: ${OPTIMIZATION_FLAGS.enableRateLimiting ? '✅' : '❌'}`);
  console.log(`   Circuit Breaker: ${OPTIMIZATION_FLAGS.enableCircuitBreaker ? '✅' : '❌'}\n`);

  console.log('📋 OPÇÕES:');
  console.log('   [1] Ativar TODAS as otimizações');
  console.log('   [2] Desativar TODAS as otimizações');
  console.log('   [3] Configurar otimizações individualmente');
  console.log('   [4] Ver status detalhado');
  console.log('   [5] Limpar caches');
  console.log('   [6] Ver tamanho dos caches');
  console.log('   [0] Sair\n');

  const choice = await prompt('Escolha uma opção (0-6): ');
  
  switch(choice) {
    case '1':
      await enableAllOpts();
      break;
    case '2':
      await disableAllOpts();
      break;
    case '3':
      await configureIndividual();
      break;
    case '4':
      await viewDetailedStatus();
      break;
    case '5':
      await clearCaches();
      break;
    case '6':
      await viewCacheSizes();
      break;
    case '0':
      console.log('\n👋 Até logo!\n');
      rl.close();
      return false;
    default:
      console.log('\n❌ Opção inválida\n');
      await pause();
  }

  return true;
}

async function enableAllOpts() {
  console.log('\n⏳ Ativando TODAS as otimizações...');
  enableAllOptimizations();
  console.log('✅ TODAS as otimizações estão ATIVADAS!\n');
  await pause();
}

async function disableAllOpts() {
  console.log('\n⏳ Desativando TODAS as otimizações...');
  disableAllOptimizations();
  console.log('❌ TODAS as otimizações estão DESATIVADAS!\n');
  console.log('⚠️  Bot voltará ao comportamento original (sem otimizações)\n');
  await pause();
}

async function configureIndividual() {
  console.clear();
  console.log('\n🔧 CONFIGURAÇÃO INDIVIDUAL\n');

  const flags = [
    'enableKBCache',
    'enableStatsCache',
    'enableTranslationCache',
    'enableGenerationCache',
    'enableMCPPool',
    'enableTimeouts',
    'enableRateLimiting',
    'enableCircuitBreaker',
    'enablePerformanceLogging',
    'enableCacheStats'
  ];

  for (let i = 0; i < flags.length; i++) {
    const flag = flags[i];
    const status = OPTIMIZATION_FLAGS[flag] ? '✅' : '❌';
    console.log(`   [${i + 1}] ${status} ${flag}`);
  }

  console.log('   [0] Voltar ao menu\n');

  const choice = await prompt('Escolha uma opção (0-10): ');
  const index = parseInt(choice) - 1;

  if (choice === '0') {
    return;
  }

  if (index >= 0 && index < flags.length) {
    const flag = flags[index];
    const newValue = !OPTIMIZATION_FLAGS[flag];
    toggleOptimization(flag, newValue);
    console.log(`\n✅ ${flag}: ${newValue ? 'ATIVADO' : 'DESATIVADO'}\n`);
  } else {
    console.log('\n❌ Opção inválida\n');
  }

  await pause();
}

async function viewDetailedStatus() {
  console.log('\n📊 STATUS DETALHADO\n');
  printStatus();
  await pause();
}

async function clearCaches() {
  console.log('\n🧹 LIMPANDO CACHES...\n');

  kbCache.clear();
  console.log('✅ KB Cache limpo');

  statsCache.clear();
  console.log('✅ Stats Cache limpo');

  translationCache.clear();
  console.log('✅ Translation Cache limpo');

  generationCache.clear();
  console.log('✅ Generation Cache limpo\n');

  console.log('🎉 Todos os caches foram limpos!\n');
  await pause();
}

async function viewCacheSizes() {
  console.clear();
  console.log('\n💾 TAMANHO DOS CACHES\n');

  const caches = [
    ['KB Cache', kbCache],
    ['Stats Cache', statsCache],
    ['Translation Cache', translationCache],
    ['Generation Cache', generationCache]
  ];

  let totalSize = 0;
  for (const [name, cache] of caches) {
    const stats = cache.getStats();
    const size = stats.size;
    totalSize += size;
    
    console.log(`${name}:`);
    console.log(`   Entradas: ${size}`);
    console.log(`   Hits: ${stats.hits}`);
    console.log(`   Misses: ${stats.misses}`);
    console.log(`   Hit rate: ${stats.hitRate.toFixed(1)}%\n`);
  }

  console.log(`📊 TOTAL DE ENTRADAS: ${totalSize}\n`);
  await pause();
}

function pause() {
  return new Promise(resolve => {
    rl.question('Pressione ENTER para continuar...', resolve);
  });
}

async function main() {
  let running = true;
  
  while (running) {
    running = await showMenu();
  }
}

// Executar
main().catch(console.error);
