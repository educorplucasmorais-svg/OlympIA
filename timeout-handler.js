/**
 * TIMEOUT E RETRY HANDLER
 * Proteção contra operações travadas e falhas temporárias
 */

/**
 * Executar promessa com timeout
 * @param {Promise} promise - Promessa a executar
 * @param {number} timeoutMs - Tempo máximo (ms)
 * @param {string} operationName - Nome da operação (para log)
 * @returns {Promise}
 */
export function withTimeout(promise, timeoutMs = 10000, operationName = 'Operation') {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        const error = new Error(`${operationName} timeout after ${timeoutMs}ms`);
        error.code = 'TIMEOUT';
        reject(error);
      }, timeoutMs);
    })
  ]);
}

/**
 * Retry com backoff exponencial
 * @param {Function} fn - Função a executar
 * @param {number} maxRetries - Máximo de tentativas
 * @param {number} baseDelay - Delay inicial (ms)
 * @param {string} operationName - Nome da operação
 * @returns {Promise}
 */
export async function retryWithBackoff(
  fn,
  maxRetries = 3,
  baseDelay = 1000,
  operationName = 'Operation'
) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`[RETRY] ${operationName} - Tentativa ${attempt + 1}/${maxRetries}`);
      return await fn();
      
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries - 1) {
        // Backoff exponencial: 1s, 2s, 4s, 8s...
        const delay = baseDelay * Math.pow(2, attempt);
        
        console.log(
          `[RETRY] ${operationName} falhou: ${error.message}. ` +
          `Aguardando ${delay}ms antes de retry...`
        );
        
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.log(`[RETRY] ${operationName} falhou após ${maxRetries} tentativas`);
      }
    }
  }
  
  throw lastError || new Error(`${operationName} failed after ${maxRetries} retries`);
}

/**
 * Retry com timeout combinado
 * Combina retry com timeout para proteção máxima
 */
export async function retryWithTimeoutAndBackoff(
  fn,
  options = {}
) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    timeout = 10000,
    operationName = 'Operation'
  } = options;

  return retryWithBackoff(
    () => withTimeout(fn(), timeout, operationName),
    maxRetries,
    baseDelay,
    operationName
  );
}

/**
 * Circuit breaker - previne cascata de erros
 */
export class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 min
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
  }

  async call(fn) {
    // Se circuito está aberto, rejeita
    if (this.state === 'OPEN') {
      // Tenta resetar após timeout
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        console.log('[Circuit Breaker] Tentando HALF_OPEN');
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN - retrying in ' + 
          (this.resetTimeout - (Date.now() - this.lastFailureTime)) + 'ms');
      }
    }

    try {
      const result = await fn();
      
      // Sucesso
      if (this.state === 'HALF_OPEN') {
        this.successCount++;
        
        // Se tiver sucesso em HALF_OPEN, fecha
        if (this.successCount >= 2) {
          console.log('[Circuit Breaker] Circuito FECHADO (recuperado)');
          this.state = 'CLOSED';
          this.failureCount = 0;
          this.successCount = 0;
        }
      } else if (this.state === 'CLOSED') {
        // Reseta falhas se está CLOSED e funciona
        this.failureCount = 0;
      }
      
      return result;
      
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();
      
      console.log(`[Circuit Breaker] Falha ${this.failureCount}/${this.failureThreshold}: ${error.message}`);
      
      if (this.failureCount >= this.failureThreshold) {
        console.log('[Circuit Breaker] Circuito ABERTO - isolando');
        this.state = 'OPEN';
      }
      
      throw error;
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      threshold: this.failureThreshold
    };
  }
}

/**
 * Rate limiter - previne sobre-carga
 */
export class RateLimiter {
  constructor(maxRequests = 10, windowMs = 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  async call(fn) {
    const now = Date.now();
    
    // Limpar requests antigos
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      
      console.log(`[Rate Limit] Aguardando ${waitTime}ms`);
      await new Promise(r => setTimeout(r, waitTime));
      
      return this.call(fn); // Tenta novamente
    }
    
    this.requests.push(now);
    return await fn();
  }
}

/**
 * Combinado: Timeout + Retry + Circuit Breaker
 */
export async function safeCall(
  fn,
  options = {}
) {
  const {
    timeout = 10000,
    maxRetries = 3,
    baseDelay = 1000,
    operationName = 'SafeCall',
    circuitBreaker = null,
    rateLimiter = null
  } = options;

  const wrappedFn = async () => {
    if (circuitBreaker) {
      return circuitBreaker.call(() => 
        withTimeout(fn(), timeout, operationName)
      );
    }
    
    return withTimeout(fn(), timeout, operationName);
  };

  if (rateLimiter) {
    return rateLimiter.call(() => 
      retryWithBackoff(wrappedFn, maxRetries, baseDelay, operationName)
    );
  }

  return retryWithBackoff(wrappedFn, maxRetries, baseDelay, operationName);
}

export default {
  withTimeout,
  retryWithBackoff,
  retryWithTimeoutAndBackoff,
  CircuitBreaker,
  RateLimiter,
  safeCall
};
