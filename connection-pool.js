/**
 * CONNECTION POOL
 * Reutiliza conexões MCP para evitar overhead de conexão
 * Implementa retry automático e reconexão
 */

export class MCPConnectionPool {
  constructor(connectFn, maxRetries = 3) {
    this.connectFn = connectFn;
    this.connection = null;
    this.connecting = false;
    this.lastError = null;
    this.maxRetries = maxRetries;
    this.connectionTime = null;
    this.callCount = 0;
    this.errorCount = 0;
  }

  /**
   * Obter conexão (reutiliza se existir)
   */
  async getConnection() {
    // Se já tem conexão válida, retorna
    if (this.connection) {
      return this.connection;
    }
    
    // Se está conectando, aguarda
    if (this.connecting) {
      return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
          if (this.connection) {
            clearInterval(interval);
            resolve(this.connection);
          } else if (this.lastError) {
            clearInterval(interval);
            reject(this.lastError);
          }
        }, 100);

        // Timeout de 30 segundos
        setTimeout(() => {
          clearInterval(interval);
          reject(new Error('Connection pool timeout'));
        }, 30000);
      });
    }

    try {
      this.connecting = true;
      
      console.log('[MCP Pool] Estabelecendo conexão...');
      this.connection = await this.connectFn();
      this.lastError = null;
      this.connectionTime = Date.now();
      
      console.log('[MCP Pool] ✅ Conexão estabelecida');
      return this.connection;
      
    } catch (error) {
      console.error('[MCP Pool] ❌ Erro ao conectar:', error.message);
      this.lastError = error;
      this.connection = null;
      throw error;
    } finally {
      this.connecting = false;
    }
  }

  /**
   * Chamar ferramenta com retry e timeout
   */
  async call(toolName, params, timeout = 30000) {
    this.callCount++;
    
    let lastError;
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const conn = await this.getConnection();
        
        // Executar com timeout
        const result = await Promise.race([
          conn.callTool({
            name: toolName,
            arguments: params
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Tool timeout')), timeout)
          )
        ]);
        
        return result;
        
      } catch (error) {
        lastError = error;
        this.errorCount++;
        
        console.log(`[MCP Pool] Tentativa ${attempt + 1}/${this.maxRetries} falhou: ${error.message}`);
        
        // Invalida conexão se falhar
        if (error.message.includes('timeout') || error.message.includes('disconnect')) {
          this.invalidate();
        }
        
        // Aguarda antes de retry (backoff exponencial)
        if (attempt < this.maxRetries - 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }
    
    throw lastError || new Error('Pool call failed');
  }

  /**
   * Invalidar conexão (reconectar)
   */
  invalidate() {
    console.log('[MCP Pool] Invalidando conexão - será reconectada');
    this.connection = null;
  }

  /**
   * Obter estatísticas
   */
  getStats() {
    const uptime = this.connectionTime 
      ? Math.round((Date.now() - this.connectionTime) / 1000)
      : 0;
    
    const errorRate = this.callCount > 0 
      ? ((this.errorCount / this.callCount) * 100).toFixed(2)
      : '0.00';

    return {
      connected: !!this.connection,
      uptime: `${uptime}s`,
      calls: this.callCount,
      errors: this.errorCount,
      errorRate: `${errorRate}%`,
      connectionTime: this.connectionTime
    };
  }

  /**
   * Fechar conexão
   */
  close() {
    if (this.connection) {
      this.connection = null;
      console.log('[MCP Pool] Conexão fechada');
    }
  }
}

export default MCPConnectionPool;
