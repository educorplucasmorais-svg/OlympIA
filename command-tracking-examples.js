/**
 * EXEMPLO DE INTEGRAÇÃO DO COMMAND TRACKER NO TELEGRAM BOT
 * 
 * Este arquivo mostra como integrar o sistema de rastreamento de comandos
 * no seu telegram-bot.js de forma simples e eficiente
 */

import commandTracker from './command-tracker.js';
import reportGenerator from './report-generator.js';

/**
 * EXEMPLO 1: Rastreamento Manual (Controle Total)
 * Use quando precisa de mais controle sobre o processo
 */
export async function exemplo1_rastreamentoManual(bot, msg, comando) {
  // Iniciar rastreamento
  const tracker = await commandTracker.logCommand(
    msg.chat.id,
    '/meu-comando',
    'Descrição do meu comando'
  );

  try {
    // Executar lógica do comando
    const resultado = await executarMeuComando(msg);
    
    // Finalizar com sucesso
    tracker.complete('success', null, resultado.length);
    
    return resultado;
  } catch (error) {
    // Finalizar com erro
    tracker.complete('error', error.message);
    return null;
  }
}

/**
 * EXEMPLO 2: Rastreamento Automático (Simples e Rápido)
 * Use para a maioria dos casos - rastreamento automático
 */
export async function exemplo2_rastreamentoAutomatico(msg) {
  const resultado = await commandTracker.executeWithTracking(
    msg.chat.id,
    '/gerar',
    'Gerar conteúdo com IA',
    async () => {
      // Sua lógica aqui
      const resposta = 'Conteúdo gerado com sucesso!';
      return resposta;
    },
    { tema: 'marketing', tom: 'criativo' } // Parâmetros opcionais
  );

  return resultado;
}

/**
 * EXEMPLO 3: Rastreamento com Parâmetros Complexos
 * Use quando precisa rastrear mais detalhes
 */
export async function exemplo3_rastreamentoCompleto(msg, params) {
  const tracker = await commandTracker.logCommand(
    msg.chat.id,
    '/imagem',
    'Gerar imagem com IA',
    {
      promptLength: params.prompt.length,
      imageSize: '1024x1024',
      model: 'dall-e-3'
    }
  );

  try {
    // Gerar imagem
    const inicio = Date.now();
    const imagemUrl = await gerarImagem(params.prompt);
    const tempoExecucao = Date.now() - inicio;

    // Enviar feedback visual
    tracker.complete('success', null, imagemUrl.length);
    
    return imagemUrl;
  } catch (error) {
    tracker.complete('error', error.message);
    throw error;
  }
}

/**
 * EXEMPLO 4: Integração com Handlers de Comando
 * Padrão recomendado para vários comandos
 */
class TelegramBotWithTracking {
  constructor(bot) {
    this.bot = bot;
  }

  /**
   * Registra um handler com rastreamento automático
   */
  registerCommandWithTracking(comandoRegex, descricao, handler) {
    this.bot.onText(comandoRegex, async (msg) => {
      const comandoNome = msg.text.split(' ')[0]; // Ex: /gerar
      
      const resultado = await commandTracker.executeWithTracking(
        msg.chat.id,
        comandoNome,
        descricao,
        async () => {
          return await handler(msg);
        }
      );

      if (resultado) {
        await this.bot.sendMessage(msg.chat.id, resultado);
      }
    });
  }

  /**
   * Exemplo de uso
   */
  setupCommands() {
    // Comando /gerar
    this.registerCommandWithTracking(
      /\/gerar(?:\s+(.+))?/,
      'Gerar conteúdo com IA',
      async (msg) => {
        const tema = msg.match[1] || 'geral';
        // Sua lógica aqui
        return `Conteúdo gerado sobre: ${tema}`;
      }
    );

    // Comando /imagem
    this.registerCommandWithTracking(
      /\/imagem(?:\s+(.+))?/,
      'Gerar imagem com IA',
      async (msg) => {
        const prompt = msg.match[1] || 'uma imagem aleatória';
        // Sua lógica aqui
        return `🖼️ Imagem gerada para: ${prompt}`;
      }
    );

    // Comando /relatorio
    this.registerCommandWithTracking(
      /\/relatorio/,
      'Gerar relatório de uso',
      async (msg) => {
        const report = reportGenerator.generateTextReport(7);
        return report;
      }
    );
  }
}

/**
 * EXEMPLO 5: Comando de Relatórios
 */
export function setupRelatorioCommands(bot) {
  // Relatório de hoje
  bot.onText(/\/relatorio_hoje/, async (msg) => {
    const tracker = await commandTracker.logCommand(
      msg.chat.id,
      '/relatorio_hoje',
      'Relatório de uso de hoje'
    );

    try {
      const stats = reportGenerator.getQuickStats();
      await bot.sendMessage(msg.chat.id, stats);
      tracker.complete('success', null, stats.length);
    } catch (error) {
      tracker.complete('error', error.message);
      await bot.sendMessage(msg.chat.id, '❌ Erro ao gerar relatório');
    }
  });

  // Relatório completo (últimos 30 dias)
  bot.onText(/\/relatorio_mes/, async (msg) => {
    const tracker = await commandTracker.logCommand(
      msg.chat.id,
      '/relatorio_mes',
      'Relatório mensal de uso'
    );

    try {
      const report = reportGenerator.generateTextReport(30);
      await bot.sendMessage(msg.chat.id, report);
      tracker.complete('success', null, report.length);
    } catch (error) {
      tracker.complete('error', error.message);
    }
  });

  // Exportar relatório em JSON
  bot.onText(/\/relatorio_json/, async (msg) => {
    const tracker = await commandTracker.logCommand(
      msg.chat.id,
      '/relatorio_json',
      'Exportar relatório em JSON'
    );

    try {
      const report = reportGenerator.generateAllReports(30);
      const json = JSON.stringify(report, null, 2);
      
      await bot.sendMessage(
        msg.chat.id,
        'Relatórios salvos em:\n' + 
        report.reports.map(r => r.path).join('\n')
      );
      
      tracker.complete('success', null, json.length);
    } catch (error) {
      tracker.complete('error', error.message);
    }
  });
}

/**
 * EXEMPLO 6: Integração Completa no Bot
 */
export function integrateTrackingNoBotCompleto(bot) {
  // Setup de comandos com rastreamento
  const botComTracking = new TelegramBotWithTracking(bot);
  botComTracking.setupCommands();

  // Setup de comandos de relatório
  setupRelatorioCommands(bot);

  // Middleware para rastrear ALL mensagens (opcional)
  bot.on('message', async (msg) => {
    if (msg.text && msg.text.startsWith('/')) {
      // Rastrear comando (será sobrescrito pelos handlers específicos)
      console.log(`📝 Comando detectado: ${msg.text.split(' ')[0]}`);
    }
  });
}

/**
 * EXEMPLO 7: Análise de Performance
 */
export function setupPerformanceTracking(bot) {
  bot.onText(/\/performance/, async (msg) => {
    const tracker = await commandTracker.logCommand(
      msg.chat.id,
      '/performance',
      'Análise de performance'
    );

    try {
      // Obter dados
      import { getMostUsedCommands } from './database.js';
      const topCommands = getMostUsedCommands(10, 30);

      // Gerar análise
      let analise = '⚡ ANÁLISE DE PERFORMANCE\n\n';
      analise += 'Comandos mais RÁPIDOS:\n';
      
      const cmdsPorTempo = [...topCommands].sort((a, b) => 
        a.avg_execution_time - b.avg_execution_time
      );

      cmdsPorTempo.slice(0, 5).forEach((cmd, i) => {
        analise += `${i + 1}. ${cmd.command_name}: ${cmd.avg_execution_time.toFixed(2)}ms\n`;
      });

      analise += '\nComandos mais LENTOS:\n';
      const lentos = [...topCommands].sort((a, b) => 
        b.avg_execution_time - a.avg_execution_time
      );

      lentos.slice(0, 5).forEach((cmd, i) => {
        analise += `${i + 1}. ${cmd.command_name}: ${cmd.avg_execution_time.toFixed(2)}ms\n`;
      });

      await bot.sendMessage(msg.chat.id, analise);
      tracker.complete('success', null, analise.length);
    } catch (error) {
      tracker.complete('error', error.message);
    }
  });
}

/**
 * EXEMPLO 8: Export de dados para Dashboard
 */
export function setupDashboardEndpoints(bot) {
  bot.onText(/\/dashboard/, async (msg) => {
    const tracker = await commandTracker.logCommand(
      msg.chat.id,
      '/dashboard',
      'Obter dados para dashboard'
    );

    try {
      import { generateCompleteReport } from './database.js';
      const report = generateCompleteReport(30);
      
      // Aqui você pode:
      // 1. Salvar em arquivo
      // 2. Enviar para API externa
      // 3. Gerar visualização HTML
      
      const resumo = `
📊 DASHBOARD - ÚLTIMOS 30 DIAS

👥 Usuários Ativos: ${report.overview.totalUsers}
⚡ Total de Comandos: ${report.overview.totalCommands}
✅ Taxa de Sucesso: ${report.overview.successRate}
📈 Média: ${report.overview.averageCommandsPerUser} cmd/usuário

🔥 Comando Mais Usado: ${report.topCommands[0]?.command_name}
      `;

      await bot.sendMessage(msg.chat.id, resumo);
      tracker.complete('success', null, resumo.length);
    } catch (error) {
      tracker.complete('error', error.message);
    }
  });
}

/**
 * COMO USAR ESTES EXEMPLOS NO SEU TELEGRAM-BOT.JS
 * 
 * 1. No início do seu arquivo, importe:
 *    import { integrateTrackingNoBotCompleto } from './command-tracking-examples.js';
 * 
 * 2. Após criar a instância do bot:
 *    integrateTrackingNoBotCompleto(bot);
 * 
 * 3. Pronto! Todos os seus comandos serão rastreados automaticamente
 * 
 * 4. Para análises customizadas, use as funções de exemplo como template
 */

export default {
  exemplo1_rastreamentoManual,
  exemplo2_rastreamentoAutomatico,
  exemplo3_rastreamentoCompleto,
  TelegramBotWithTracking,
  setupRelatorioCommands,
  integrateTrackingNoBotCompleto,
  setupPerformanceTracking,
  setupDashboardEndpoints
};
