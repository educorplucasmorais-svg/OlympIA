import { registerCommand, getUserByChatId } from './database.js';

/**
 * TRACKER DE COMANDOS
 * Registra todos os comandos executados pelos usuários
 */

class CommandTracker {
  constructor() {
    this.commandMetrics = {};
  }

  /**
   * Registra um comando executado
   * @param {number} chatId - ID do chat do Telegram
   * @param {string} commandName - Nome do comando (ex: /gerar, /imagem)
   * @param {string} commandDescription - Descrição do comando
   * @param {object} options - Opções adicionais
   */
  async logCommand(chatId, commandName, commandDescription = '', options = {}) {
    try {
      const user = getUserByChatId(chatId);
      
      if (!user) {
        console.warn(`⚠️ Usuário não registrado para chat_id: ${chatId}`);
        return false;
      }

      const startTime = Date.now();
      
      // Retorna um objeto que pode ser completado depois
      return {
        userId: user.id,
        chatId: chatId,
        commandName: commandName,
        commandDescription: commandDescription,
        startTime: startTime,
        
        // Método para finalizar o registro
        complete: (status = 'success', errorMessage = null, responseLength = 0) => {
          const executionTimeMs = Date.now() - startTime;
          
          const result = registerCommand(
            user.id,
            chatId,
            commandName,
            commandDescription,
            executionTimeMs,
            status,
            options,
            responseLength,
            errorMessage
          );

          if (result.success) {
            console.log(`✅ Comando registrado: ${commandName} (${executionTimeMs}ms) - ${status}`);
          } else {
            console.error(`❌ Erro ao registrar comando: ${result.error}`);
          }

          return result;
        }
      };
    } catch (error) {
      console.error('Erro ao fazer log do comando:', error);
      return false;
    }
  }

  /**
   * Envoltório para executar um comando com tracking automático
   * @param {number} chatId - ID do chat
   * @param {string} commandName - Nome do comando
   * @param {string} description - Descrição
   * @param {function} commandFunction - Função a executar
   */
  async executeWithTracking(chatId, commandName, description, commandFunction, options = {}) {
    const tracker = await this.logCommand(chatId, commandName, description, options);
    
    if (!tracker || typeof tracker.complete !== 'function') {
      console.error('Erro: Não foi possível inicializar tracker');
      return null;
    }

    try {
      const result = await commandFunction();
      
      const responseLength = result ? 
        (typeof result === 'string' ? result.length : JSON.stringify(result).length) 
        : 0;
      
      tracker.complete('success', null, responseLength);
      return result;
    } catch (error) {
      console.error(`❌ Erro ao executar ${commandName}:`, error);
      tracker.complete('error', error.message);
      return null;
    }
  }

  /**
   * Rastreia tempo de execução de qualquer operação
   */
  startTimer() {
    return {
      startTime: Date.now(),
      getElapsed: () => Date.now() - this.startTime
    };
  }
}

export default new CommandTracker();
