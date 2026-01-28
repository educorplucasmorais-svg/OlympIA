/**
 * PERFORMANCE CACHE
 * Cache em memória com TTL para respostas rápidas
 * Sem risco - pode ser removido sem afetar bot
 */

export class PerformanceCache {
  constructor(ttlMs = 300000) {
    this.cache = new Map();
    this.ttl = ttlMs;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Definir valor no cache
   * @param {string} key - Chave única
   * @param {any} value - Valor a cachear
   * @param {number} customTtl - TTL customizado (ms)
   */
  set(key, value, customTtl) {
    const expiresAt = Date.now() + (customTtl || this.ttl);
    this.cache.set(key, { 
      value, 
      expiresAt,
      createdAt: Date.now()
    });
  }

  /**
   * Obter valor do cache
   * @param {string} key - Chave única
   * @returns {any} Valor ou null se expirado
   */
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      this.misses++;
      return null;
    }
    
    // Verificar se expirou
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }
    
    this.hits++;
    return item.value;
  }

  /**
   * Obter ou calcular valor
   * Útil para operações custosas
   */
  async getOrSet(key, computeFn, customTtl) {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    const value = await computeFn();
    this.set(key, value, customTtl);
    return value;
  }

  /**
   * Verificar se chave existe e não expirou
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Limpar cache específico
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Limpar todo o cache
   */
  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Obter estatísticas de performance
   */
  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;
    
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      total: total,
      hitRate: parseFloat(hitRate.toFixed(2))
    };
  }

  /**
   * Limpar entradas expiradas
   */
  cleanup() {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }
    
    return removed;
  }
}

// Singleton para uso global
export const globalCache = new PerformanceCache(300000); // 5 min padrão

export default PerformanceCache;
