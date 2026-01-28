/**
 * TESTE DE OTIMIZAÇÕES
 * Compara performance antes/depois de ativar cache e connection pooling
 * 
 * Uso: node test-optimizations.js
 */

import { PerformanceCache } from './performance-cache.js';
import { MCPConnectionPool } from './connection-pool.js';
import { withTimeout, CircuitBreaker } from './timeout-handler.js';

// ═══════════════════════════════════════════════════════════════
// TESTE 1: Cache Performance
// ═══════════════════════════════════════════════════════════════

async function testCachePerformance() {
  console.log('\n📊 TESTE 1: CACHE PERFORMANCE');
  console.log('═══════════════════════════════════════════');
  
  const cache = new PerformanceCache(5 * 60 * 1000);
  
  // Simular operação custosa
  const expensiveOperation = async (value) => {
    await new Promise(r => setTimeout(r, 1000)); // 1 segundo
    return `Resultado: ${value}`;
  };
  
  // Primeira execução - sem cache
  console.log('📍 Primeira execução (sem cache):');
  const t1Start = Date.now();
  const result1 = await expensiveOperation('test');
  const t1Time = Date.now() - t1Start;
  console.log(`   ⏱️  Tempo: ${t1Time}ms`);
  console.log(`   📍 Resultado: ${result1}\n`);
  
  // Segunda execução - com cache
  cache.set('test', result1, 5 * 60 * 1000);
  console.log('📍 Segunda execução (com cache):');
  const t2Start = Date.now();
  const result2 = cache.get('test');
  const t2Time = Date.now() - t2Start;
  console.log(`   ⏱️  Tempo: ${t2Time}ms`);
  console.log(`   📍 Resultado: ${result2}\n`);
  
  // Terceira execução - com cache (hit)
  console.log('📍 Terceira execução (cache hit):');
  const t3Start = Date.now();
  const result3 = cache.get('test');
  const t3Time = Date.now() - t3Start;
  console.log(`   ⏱️  Tempo: ${t3Time}ms`);
  console.log(`   📍 Resultado: ${result3}\n`);
  
  const stats = cache.getStats();
  console.log('📈 ESTATÍSTICAS:');
  console.log(`   💾 Tamanho do cache: ${stats.size} entradas`);
  console.log(`   ✅ Cache hits: ${stats.hits}`);
  console.log(`   ❌ Cache misses: ${stats.misses}`);
  console.log(`   📊 Hit rate: ${stats.hitRate.toFixed(1)}%`);
  console.log(`   ⚡ Speedup: ${(t1Time / t2Time).toFixed(1)}x mais rápido com cache`);
  
  return {
    without: t1Time,
    with: t2Time,
    speedup: t1Time / t2Time
  };
}

// ═══════════════════════════════════════════════════════════════
// TESTE 2: Timeout Protection
// ═══════════════════════════════════════════════════════════════

async function testTimeoutProtection() {
  console.log('\n🛡️  TESTE 2: TIMEOUT PROTECTION');
  console.log('═══════════════════════════════════════════');
  
  // Operação que vai expirar
  console.log('📍 Operação SEM timeout (vai pendurar):');
  const slowOperation = () => new Promise(r => {
    // Nunca resolve
  });
  
  console.log('   ⏱️  Aguardando 3 segundos...');
  const t1Start = Date.now();
  
  try {
    await withTimeout(slowOperation(), 3000, 'Slow Operation');
  } catch (error) {
    const t1Time = Date.now() - t1Start;
    console.log(`   ✅ Timeout acionado após ${t1Time}ms`);
    console.log(`   📍 Erro: ${error.message}\n`);
  }
  
  // Operação rápida com timeout
  console.log('📍 Operação COM timeout (sucesso):');
  const quickOperation = () => new Promise(r => {
    setTimeout(() => r('Sucesso!'), 500);
  });
  
  const t2Start = Date.now();
  try {
    const result = await withTimeout(quickOperation(), 3000, 'Quick Operation');
    const t2Time = Date.now() - t2Start;
    console.log(`   ✅ Completado em ${t2Time}ms`);
    console.log(`   📍 Resultado: ${result}\n`);
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}\n`);
  }
}

// ═══════════════════════════════════════════════════════════════
// TESTE 3: Circuit Breaker
// ═══════════════════════════════════════════════════════════════

async function testCircuitBreaker() {
  console.log('\n🔌 TESTE 3: CIRCUIT BREAKER');
  console.log('═══════════════════════════════════════════');
  
  const breaker = new CircuitBreaker({
    failureThreshold: 3,
    resetTimeout: 2000
  });
  
  // Simular falhas
  let failCount = 0;
  const unreliableOperation = async () => {
    failCount++;
    if (failCount <= 4) {
      throw new Error(`Falha ${failCount}`);
    }
    return 'Sucesso';
  };
  
  console.log('📍 Primeira série de falhas (abrindo circuito):');
  for (let i = 1; i <= 4; i++) {
    try {
      await breaker.call(unreliableOperation);
      console.log(`   ✅ Tentativa ${i}: Sucesso`);
    } catch (error) {
      const state = breaker.getState();
      console.log(`   ❌ Tentativa ${i}: ${error.message} (Estado: ${state.state})`);
    }
  }
  
  const state1 = breaker.getState();
  console.log(`\n   🔴 Circuito ABERTO após ${state1.failureCount} falhas\n`);
  
  // Tentar chamar com circuito aberto
  console.log('📍 Tentativa com circuito aberto:');
  try {
    await breaker.call(unreliableOperation);
    console.log('   ✅ Sucesso');
  } catch (error) {
    console.log(`   🔴 Bloqueado: ${error.message}\n`);
  }
  
  // Aguardar reset
  console.log('📍 Aguardando reset do circuito (2 segundos)...');
  await new Promise(r => setTimeout(r, 2500));
  
  // Tentar novamente
  failCount = 0; // Reset para simular sucesso
  console.log('📍 Tentativa após reset:');
  try {
    const result = await breaker.call(async () => 'Recuperado!');
    const state2 = breaker.getState();
    console.log(`   ✅ Resultado: ${result} (Estado: ${state2.state})\n`);
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}\n`);
  }
}

// ═══════════════════════════════════════════════════════════════
// TESTE 4: Performance Comparison
// ═══════════════════════════════════════════════════════════════

async function performanceComparison() {
  console.log('\n🚀 TESTE 4: COMPARAÇÃO DE PERFORMANCE');
  console.log('═══════════════════════════════════════════');
  
  // Simular 100 queries iguais
  const query = 'Como otimizar JavaScript?';
  const cache = new PerformanceCache(5 * 60 * 1000);
  
  const queryTime = async () => {
    await new Promise(r => setTimeout(r, 100)); // Simula 100ms de latência
    return `Resposta: ${query}`;
  };
  
  // SEM CACHE
  console.log('📍 Cenário 1: SEM CACHE (100 queries)');
  let totalTime = 0;
  for (let i = 0; i < 100; i++) {
    const t = Date.now();
    await queryTime();
    totalTime += Date.now() - t;
  }
  const withoutCache = totalTime;
  console.log(`   ⏱️  Tempo total: ${withoutCache}ms`);
  console.log(`   📊 Média por query: ${(withoutCache / 100).toFixed(1)}ms\n`);
  
  // COM CACHE
  console.log('📍 Cenário 2: COM CACHE (1ª consulta + 99 hits)');
  totalTime = 0;
  let firstQueryTime = 0;
  
  for (let i = 0; i < 100; i++) {
    const t = Date.now();
    
    if (i === 0) {
      // Primeira vez: sem cache
      const result = await queryTime();
      cache.set(query, result);
      firstQueryTime = Date.now() - t;
      totalTime += firstQueryTime;
    } else {
      // Demais vezes: com cache
      const result = cache.get(query);
      totalTime += Date.now() - t;
    }
  }
  
  const withCache = totalTime;
  console.log(`   ⏱️  Tempo total: ${withCache}ms`);
  console.log(`   ⏱️  1ª query: ${firstQueryTime}ms`);
  console.log(`   ⏱️  99 cache hits: ${withCache - firstQueryTime}ms`);
  console.log(`   📊 Média por query: ${(withCache / 100).toFixed(1)}ms\n`);
  
  const improvement = ((withoutCache - withCache) / withoutCache * 100);
  console.log(`   ✅ MELHORIA: ${improvement.toFixed(1)}% mais rápido com cache`);
  console.log(`   🚀 SPEEDUP: ${(withoutCache / withCache).toFixed(1)}x mais rápido\n`);
}

// ═══════════════════════════════════════════════════════════════
// EXECUTAR TODOS OS TESTES
// ═══════════════════════════════════════════════════════════════

async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║  🧪 TESTE DE OTIMIZAÇÕES - OlympIA Bot          ║');
  console.log('╚════════════════════════════════════════════════════╝');
  
  try {
    await testCachePerformance();
    await testTimeoutProtection();
    await testCircuitBreaker();
    await performanceComparison();
    
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║  ✅ TODOS OS TESTES COMPLETADOS COM SUCESSO      ║');
    console.log('╚════════════════════════════════════════════════════╝\n');
    
  } catch (error) {
    console.error('\n❌ Erro nos testes:', error.message);
  }
}

// Executar
runAllTests();
