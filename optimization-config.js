/**
 * CONFIGURAÇÃO CENTRAL DE OTIMIZAÇÕES
 * Todos os módulos de performance em um lugar
 * Fácil de ativar/desativar para testes seguros
 */

import { PerformanceCache } from './performance-cache.js';
import { MCPConnectionPool } from './connection-pool.js';
import {
  withTimeout,
  retryWithBackoff,
  CircuitBreaker,
  RateLimiter,
  safeCall
} from './timeout-handler.js';

// ═══════════════════════════════════════════════════════════════
// 🎯 CACHE GLOBAL - Compartilhado entre todos os comandos
// ═══════════════════════════════════════════════════════════════

// Cache para respostas de conhecimento (5 minutos)
export const kbCache = new PerformanceCache(5 * 60 * 1000);

// Cache para estatísticas (10 minutos)
export const statsCache = new PerformanceCache(10 * 60 * 1000);

// Cache para traduções (1 hora)
export const translationCache = new PerformanceCache(60 * 60 * 1000);

// Cache para imagens/geradores (30 minutos)
export const generationCache = new PerformanceCache(30 * 60 * 1000);

// ═══════════════════════════════════════════════════════════════
// 🔄 CONNECTION POOL - Para MCP
// ═══════════════════════════════════════════════════════════════

let mcpPool = null;

export function initMCPPool(connectFn) {
  mcpPool = new MCPConnectionPool(connectFn, 3);
  console.log('[OPT] ✅ MCP Connection Pool inicializado');
  return mcpPool;
}

export function getMCPPool() {
  if (!mcpPool) {
    throw new Error('MCP Pool não inicializado. Chame initMCPPool() primeiro');
  }
  return mcpPool;
}

// ═══════════════════════════════════════════════════════════════
// 🛡️ CIRCUIT BREAKERS - Proteção contra falhas
// ═══════════════════════════════════════════════════════════════

export const kbCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000 // 1 minuto
});

export const mcpCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 30000 // 30 segundos
});

// ═══════════════════════════════════════════════════════════════
// 🚦 RATE LIMITERS - Proteção contra sobre-carga
// ═══════════════════════════════════════════════════════════════

// /conhecimento: max 10 requests por 60 segundos
export const kbRateLimiter = new RateLimiter(10, 60000);

// /gerar: max 5 requests por 60 segundos
export const generatorRateLimiter = new RateLimiter(5, 60000);

// /imagem: max 3 requests por 60 segundos
export const imageRateLimiter = new RateLimiter(3, 60000);

// ═══════════════════════════════════════════════════════════════
// 📊 FEATURE FLAGS - Ativar/Desativar otimizações facilmente
// ═══════════════════════════════════════════════════════════════

export const OPTIMIZATION_FLAGS = {
  // Cache
  enableKBCache: true,           // Cache de respostas de conhecimento
  enableStatsCache: true,         // Cache de estatísticas
  enableTranslationCache: true,   // Cache de traduções
  enableGenerationCache: true,    // Cache de gerações
  
  // Connection Pool
  enableMCPPool: true,            // Reusar conexões MCP
  
  // Timeouts
  enableTimeouts: true,           // Timeout protection
  kbTimeout: 15000,               // 15s para /conhecimento
  generatorTimeout: 30000,        // 30s para /gerar
  mcpTimeout: 10000,              // 10s para MCP calls
  
  // Rate Limiting
  enableRateLimiting: true,       // Rate limiter
  
  // Circuit Breaker
  enableCircuitBreaker: true,     // Circuit breaker protection
  
  // Logging
  enablePerformanceLogging: true, // Log de performance
  enableCacheStats: true          // Log de cache hits/misses
};

// ═══════════════════════════════════════════════════════════════
// 📈 LOGGING DE PERFORMANCE
// ═══════════════════════════════════════════════════════════════

export function logPerformance(operationName, timeMs, cacheHit = false) {
  if (!OPTIMIZATION_FLAGS.enablePerformanceLogging) return;
  
  const status = cacheHit ? '💾 CACHE' : '🌐 LIVE';
  const icon = timeMs > 5000 ? '⚠️' : '✅';
  
  console.log(`[PERF] ${icon} ${operationName} - ${timeMs}ms ${status}`);
}

export function logCacheStats() {
  if (!OPTIMIZATION_FLAGS.enableCacheStats) return;
  
  console.log('\n📊 CACHE STATISTICS:');
  console.log('KB Cache:', kbCache.getStats());
  console.log('Stats Cache:', statsCache.getStats());
  console.log('Translation Cache:', translationCache.getStats());
  console.log('Generation Cache:', generationCache.getStats());
  console.log('');
}

// ═══════════════════════════════════════════════════════════════
// 🚀 HELPERS - Funções para usar otimizações facilmente
// ═══════════════════════════════════════════════════════════════

/**
 * Executar com cache e proteções
 */
export async function cachedWithProtection(
  cacheObj,
  cacheKey,
  executeFn,
  options = {}
) {
  const {
    timeout = 15000,
    maxRetries = 2,
    operationName = 'Operation',
    enableCache = true,
    enableTimeout = true,
    enableRetry = true,
    ttlMs = 5 * 60 * 1000
  } = options;

  try {
    // Tentar cache primeiro
    if (enableCache) {
      const cached = cacheObj.get(cacheKey);
      if (cached) {
        logPerformance(operationName, 0, true);
        return cached;
      }
    }

    // Executar com proteções
    let result;
    
    if (enableRetry && enableTimeout) {
      result = await retryWithBackoff(
        () => withTimeout(executeFn(), timeout, operationName),
        maxRetries,
        500,
        operationName
      );
    } else if (enableTimeout) {
      result = await withTimeout(executeFn(), timeout, operationName);
    } else if (enableRetry) {
      result = await retryWithBackoff(executeFn, maxRetries, 500, operationName);
    } else {
      result = await executeFn();
    }

    // Cachear resultado
    if (enableCache && result) {
      cacheObj.set(cacheKey, result, ttlMs);
    }

    logPerformance(operationName, 0, false);
    return result;

  } catch (error) {
    console.error(`[ERROR] ${operationName}: ${error.message}`);
    throw error;
  }
}

/**
 * Chamar MCP com pool e proteções
 */
export async function safeMCPCall(toolName, params, options = {}) {
  const {
    timeout = OPTIMIZATION_FLAGS.mcpTimeout,
    maxRetries = 2,
    operationName = `MCP:${toolName}`
  } = options;

  if (!OPTIMIZATION_FLAGS.enableMCPPool) {
    // Fallback sem pool
    return safeCall(
      () => getMCPPool().call(toolName, params, timeout),
      { timeout, maxRetries, operationName }
    );
  }

  const pool = getMCPPool();
  return safeCall(
    () => pool.call(toolName, params, timeout),
    { timeout, maxRetries, operationName }
  );
}

// ═══════════════════════════════════════════════════════════════
// 🎛️ CONTROLE - Ligar/Desligar otimizações
// ═══════════════════════════════════════════════════════════════

export function toggleOptimization(flag, enabled) {
  if (!(flag in OPTIMIZATION_FLAGS)) {
    console.warn(`[OPT] Flag desconhecida: ${flag}`);
    return false;
  }
  
  OPTIMIZATION_FLAGS[flag] = enabled;
  console.log(`[OPT] ${flag}: ${enabled ? '✅ ATIVADO' : '❌ DESATIVADO'}`);
  return true;
}

export function disableAllOptimizations() {
  Object.keys(OPTIMIZATION_FLAGS).forEach(key => {
    if (key !== 'enablePerformanceLogging' && key !== 'enableCacheStats') {
      OPTIMIZATION_FLAGS[key] = false;
    }
  });
  console.log('[OPT] ⚠️ Todas otimizações DESATIVADAS (modo seguro)');
}

export function enableAllOptimizations() {
  Object.keys(OPTIMIZATION_FLAGS).forEach(key => {
    if (!key.startsWith('enablePerformanceLogging')) {
      OPTIMIZATION_FLAGS[key] = true;
    }
  });
  console.log('[OPT] ✅ Todas otimizações ATIVADAS');
}

export function printStatus() {
  console.log('\n═══════════════════════════════════════════');
  console.log('🎛️  OPTIMIZATION STATUS');
  console.log('═══════════════════════════════════════════');
  
  Object.entries(OPTIMIZATION_FLAGS).forEach(([key, value]) => {
    const status = value ? '✅' : '❌';
    console.log(`${status} ${key}: ${value}`);
  });
  
  console.log('\n📊 CACHE SIZES:');
  console.log(`KB Cache: ${kbCache.getStats().size} entries`);
  console.log(`Stats Cache: ${statsCache.getStats().size} entries`);
  console.log(`Translation Cache: ${translationCache.getStats().size} entries`);
  console.log(`Generation Cache: ${generationCache.getStats().size} entries`);
  
  if (mcpPool) {
    console.log('\n🔄 MCP POOL:');
    const poolStats = mcpPool.getStats();
    console.log(`Conexões: ${poolStats.connected ? 'Ativa' : 'Inativa'}`);
    console.log(`Uptime: ${(poolStats.uptime / 1000).toFixed(1)}s`);
    console.log(`Chamadas: ${poolStats.calls}`);
    console.log(`Erros: ${poolStats.errors} (${poolStats.errorRate.toFixed(1)}%)`);
  }
  
  console.log('═══════════════════════════════════════════\n');
}

export default {
  kbCache,
  statsCache,
  translationCache,
  generationCache,
  kbCircuitBreaker,
  mcpCircuitBreaker,
  kbRateLimiter,
  generatorRateLimiter,
  imageRateLimiter,
  OPTIMIZATION_FLAGS,
  initMCPPool,
  getMCPPool,
  logPerformance,
  logCacheStats,
  cachedWithProtection,
  safeMCPCall,
  toggleOptimization,
  disableAllOptimizations,
  enableAllOptimizations,
  printStatus
};
