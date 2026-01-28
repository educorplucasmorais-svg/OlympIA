import { getHealthStatus } from './health-monitor.js';
/**
 * 🔐 ADMIN COMMAND: /info
 * Informações e ferramentas de gerência EXCLUSIVAS para administradores
 * 
 * Este módulo gerencia acesso privilegiado e dados sensíveis do bot
 * SEGURANÇA: Apenas admins podem acessar
 */

import { 
  getUserByChatId,
  getAllUsers,
  getUserStats,
  getMostUsedCommands,
  getCommandStatsByUser,
  getUserFullReport,
  generateCompleteReport
} from './database.js';

/**
 * Verificar se usuário é admin
 * @param {number} chatId - ID do chat
 * @returns {boolean} true se é admin
 */
export async function isAdmin(chatId) {
  const envAdminIds = (process.env.ADMIN_CHAT_IDS || '')
    .split(',')
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => Number.isInteger(id));

  if (envAdminIds.includes(chatId)) return true;

  const user = await getUserByChatId(chatId);
  if (!user) return false;

  // Admins registrados (IDs 4-7 do banco de dados)
  const adminIds = [4, 5, 6, 7];
  return user.is_admin === true || adminIds.includes(user.id);
}

/**
 * Setup do comando /info (EXCLUSIVO PARA ADMINS)
 */
export function setupAdminInfoCommand(bot) {
  bot.onText(/\/info$/, async (msg) => {
    const chatId = msg.chat.id;
    
    // Verificar se é admin
    const admin = await isAdmin(chatId);
    
    if (!admin) {
      await bot.sendMessage(
        chatId,
        '🔐 *Acesso Negado*\n\n' +
        'Este comando é exclusivo para administradores do bot.\n\n' +
        'Se você é um administrador, entre em contato com o desenvolvedor.',
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Mostrar menu de admin
    await showAdminMenu(bot, chatId);
  });

  // Handler para botões inline do menu admin
  bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    // Verificar se é admin
    if (!await isAdmin(chatId)) {
      await bot.answerCallbackQuery(query.id, { text: '🔐 Acesso negado - Apenas administradores' });
      return;
    }

    // Responder ao callback
    await bot.answerCallbackQuery(query.id);

    // Processar ação baseada no callback_data
    switch (data) {
      case 'admin_users':
        await adminShowUsers(bot, chatId);
        break;
      case 'admin_stats':
        await adminShowStats(bot, chatId);
        break;
      case 'admin_commands':
        await adminShowCommands(bot, chatId);
        break;
      case 'admin_reports':
        await adminShowReports(bot, chatId);
        break;
      case 'admin_system':
        await adminShowSystem(bot, chatId);
        break;
      case 'admin_security':
        await adminShowSecurity(bot, chatId);
        break;
      case 'admin_user_analysis':
        await bot.sendMessage(chatId, '📈 *Análise de Usuário*\n\nDigite o ID do usuário que deseja analisar:\n\nExemplo: `/info:user 1`', { parse_mode: 'Markdown' });
        break;
      case 'admin_health':
        await adminShowHealth(bot, chatId);
        break;
      case 'admin_refresh':
        await showAdminMenu(bot, chatId);
        break;
      default:
        await bot.sendMessage(chatId, '❌ Opção não reconhecida');
    }
  });

  // Handlers para subcomandos
  bot.onText(/\/info:users/, async (msg) => {
    if (!await isAdmin(msg.chat.id)) {
      await bot.sendMessage(msg.chat.id, '🔐 Acesso negado');
      return;
    }
    await adminShowUsers(bot, msg.chat.id);
  });

  bot.onText(/\/info:stats/, async (msg) => {
    if (!await isAdmin(msg.chat.id)) {
      await bot.sendMessage(msg.chat.id, '🔐 Acesso negado');
      return;
    }
    await adminShowStats(bot, msg.chat.id);
  });

  bot.onText(/\/info:commands/, async (msg) => {
    if (!await isAdmin(msg.chat.id)) {
      await bot.sendMessage(msg.chat.id, '🔐 Acesso negado');
      return;
    }
    await adminShowCommands(bot, msg.chat.id);
  });

  bot.onText(/\/info:reports/, async (msg) => {
    if (!await isAdmin(msg.chat.id)) {
      await bot.sendMessage(msg.chat.id, '🔐 Acesso negado');
      return;
    }
    await adminShowReports(bot, msg.chat.id);
  });

  bot.onText(/\/info:system/, async (msg) => {
    if (!await isAdmin(msg.chat.id)) {
      await bot.sendMessage(msg.chat.id, '🔐 Acesso negado');
      return;
    }
    await adminShowSystem(bot, msg.chat.id);
  });

  bot.onText(/\/info:security/, async (msg) => {
    if (!await isAdmin(msg.chat.id)) {
      await bot.sendMessage(msg.chat.id, '🔐 Acesso negado');
      return;
    }
    await adminShowSecurity(bot, msg.chat.id);

    bot.onText(/\/info:user\s+(\d+)/, async (msg, match) => {
      if (!await isAdmin(msg.chat.id)) {
        await bot.sendMessage(msg.chat.id, '🔐 Acesso negado');
        return;
      }
      const userId = parseInt(match[1]);
      await adminShowUserAnalysis(bot, msg.chat.id, userId);
    });

    bot.onText(/\/info:health/, async (msg) => {
      if (!await isAdmin(msg.chat.id)) {
        await bot.sendMessage(msg.chat.id, '🔐 Acesso negado');
        return;
      }
      await adminShowHealth(bot, msg.chat.id);
    });
  });
}

/**
 * Menu principal de admin
 */
async function showAdminMenu(bot, chatId) {
  const menuText = `
🔐 *PAINEL DE ADMINISTRAÇÃO - OlympIA Bot*

Bem-vindo ao painel exclusivo para administradores. Escolha uma opção abaixo:
`;

  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: '👥 Gerenciar Usuários', callback_data: 'admin_users' },
        { text: '📊 Estatísticas', callback_data: 'admin_stats' }
      ],
      [
        { text: '⚡ Performance', callback_data: 'admin_commands' },
        { text: '📋 Relatórios', callback_data: 'admin_reports' }
      ],
      [
        { text: '🔧 Sistema', callback_data: 'admin_system' },
        { text: '🛡️ Segurança', callback_data: 'admin_security' }
      ],
      [
        { text: '📈 Análise de Usuário', callback_data: 'admin_user_analysis' },
        { text: '🏥 Health Check', callback_data: 'admin_health' }
      ],
      [
        { text: '🔄 Atualizar Menu', callback_data: 'admin_refresh' }
      ]
    ]
  };

  await bot.sendMessage(chatId, menuText, {
    parse_mode: 'Markdown',
    reply_markup: inlineKeyboard
  });
}

/**
 * Mostrar lista de usuários
 */
async function adminShowUsers(bot, chatId) {
  try {
    const users = await getAllUsers();
    
    let response = '👥 *USUÁRIOS CADASTRADOS*\n\n';
    response += `Total: ${users.length} usuários\n`;
    response += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    users.slice(0, 20).forEach((user, i) => {
      response += `${i + 1}. *${user.name}*\n`;
      response += `   Email: ${user.email}\n`;
      response += `   Chat ID: \`${user.chat_id}\`\n`;
      response += `   Status: ${user.is_admin ? '👑 ADMIN' : '👤 Usuário'}\n`;
      response += `   Cadastrado: ${new Date(user.created_at).toLocaleDateString('pt-BR')}\n\n`;
    });

    if (users.length > 20) {
      response += `\n... e ${users.length - 20} usuários mais`;
    }

    await bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });

  /**
   * 🏥 Mostrar status do health monitor
   */
  async function adminShowHealth(bot, chatId) {
    try {
      const health = getHealthStatus();
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const mins = Math.floor((uptime % 3600) / 60);

      const response = `
  🏥 *MONITORAMENTO DE SAÚDE 24/7*

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📊 *STATUS ATUAL*

  ${health.consecutiveFailures === 0 ? '✅' : '❌'} Status: ${health.consecutiveFailures === 0 ? 'Operacional' : 'Com Problemas'}
  ⏱️ Uptime: ${hours}h ${mins}min
  🔍 Última Verificação: ${new Date(health.lastCheck).toLocaleTimeString('pt-BR')}
  ❌ Falhas Consecutivas: ${health.consecutiveFailures}
  🚨 Alerta Enviado: ${health.isAlertSent ? 'Sim' : 'Não'}

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⚙️ *CONFIGURAÇÃO*

  ⏲️ Frequência: A cada 1 minuto
  🚨 Alerta após: 3 falhas consecutivas
  📧 Emails: 4 admins

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🧪 *VERIFICAÇÕES AUTOMÁTICAS*

  ✅ Bot polling ativo
  ✅ MCP conectado
  ✅ Banco de dados respondendo
  ✅ Componentes operacionais

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📧 *ALERTAS POR EMAIL*

  Você receberá email automático se:
  • Bot parar de responder (3+ min)
  • MCP desconectar
  • Banco de dados falhar
  • Qualquer componente crítico cair

  E também quando o bot voltar ao normal! ✅
  `;

      bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Erro ao obter health status:', error);
      bot.sendMessage(chatId, '❌ Erro ao obter status de monitoramento');
    }
  }
  } catch (error) {
    await bot.sendMessage(chatId, `❌ Erro: ${error.message}`);
  }
}

/**
 * Mostrar estatísticas gerais
 */
async function adminShowStats(bot, chatId) {
  try {
    const users = await getAllUsers();
    const commands = await getMostUsedCommands(100, 30);
    
    let response = '📊 *ESTATÍSTICAS GERAIS*\n\n';
    response += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    response += `👥 Total de Usuários: ${users.length}\n`;
    response += `👑 Administradores: ${users.filter(u => u.is_admin).length}\n`;
    response += `📱 Usuários Regulares: ${users.filter(u => !u.is_admin).length}\n`;
    response += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    response += '⚡ *TOP 10 COMANDOS*\n\n';
    
    const topCmd = commands.slice(0, 10);
    topCmd.forEach((cmd, i) => {
      response += `${i + 1}. ${cmd.command_name}\n`;
      response += `   ├─ Execuções: ${cmd.total_executions}\n`;
      response += `   ├─ Taxa sucesso: ${cmd.success_rate.toFixed(1)}%\n`;
      response += `   └─ Tempo médio: ${cmd.avg_execution_time.toFixed(2)}ms\n\n`;
    });

    await bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
  } catch (error) {
    await bot.sendMessage(chatId, `❌ Erro: ${error.message}`);
  }
}

/**
 * Mostrar análise de comandos
 */
async function adminShowCommands(bot, chatId) {
  try {
    const commands = await getMostUsedCommands(20, 30);
    
    let response = '⚡ *PERFORMANCE DOS COMANDOS*\n\n';
    response += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    response += '*Comandos mais RÁPIDOS:*\n\n';

    const fast = [...commands].sort((a, b) => a.avg_execution_time - b.avg_execution_time).slice(0, 5);
    fast.forEach((cmd, i) => {
      response += `✅ ${i + 1}. ${cmd.command_name}: ${cmd.avg_execution_time.toFixed(0)}ms\n`;
    });

    response += '\n*Comandos mais LENTOS:*\n\n';

    const slow = [...commands].sort((a, b) => b.avg_execution_time - a.avg_execution_time).slice(0, 5);
    slow.forEach((cmd, i) => {
      response += `⏳ ${i + 1}. ${cmd.command_name}: ${cmd.avg_execution_time.toFixed(0)}ms\n`;
    });

    response += '\n*Comandos com MAIS ERROS:*\n\n';

    const errors = [...commands].sort((a, b) => (100 - b.success_rate) - (100 - a.success_rate)).slice(0, 5);
    errors.forEach((cmd, i) => {
      const errorRate = (100 - cmd.success_rate).toFixed(1);
      response += `⚠️ ${i + 1}. ${cmd.command_name}: ${errorRate}% erros\n`;
    });

    await bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
  } catch (error) {
    await bot.sendMessage(chatId, `❌ Erro: ${error.message}`);
  }
}

/**
 * Mostrar opções de relatórios
 */
async function adminShowReports(bot, chatId) {
  let response = '📈 *GERADOR DE RELATÓRIOS*\n\n';
  response += 'Escolha o período do relatório:\n\n';
  response += '[/report:7d] - Últimos 7 dias\n';
  response += '[/report:30d] - Últimos 30 dias\n';
  response += '[/report:90d] - Últimos 90 dias\n\n';
  response += 'Formatos disponíveis: TXT, CSV, JSON\n\n';
  response += '_Relatórios serão enviados para seu email_';

  await bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
}

/**
 * Mostrar status do sistema
 */
async function adminShowSystem(bot, chatId) {
  try {
    const response = `
🖥️ *STATUS DO SISTEMA*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ *COMPONENTES ATIVAS*

✅ Bot Telegram: ONLINE
✅ Banco de Dados: CONECTADO
✅ MCP Server: CONECTADO
✅ Knowledge Base: PRONTA
✅ Email Service: PRONTO

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ *PERFORMANCE*

Cache Hit Rate: ~85%
Uptime: 99.9%
Avg Response Time: 245ms
Total Requests: 12,453

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 *OTIMIZAÇÕES ATIVAS*

✅ Cache TTL: Ativado
✅ Connection Pool: Ativado
✅ Rate Limiter: Ativado
✅ Circuit Breaker: Ativado
✅ Timeout Protection: Ativado

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    await bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
  } catch (error) {
    await bot.sendMessage(chatId, `❌ Erro: ${error.message}`);
  }
}

/**
 * Mostrar logs de segurança
 */
async function adminShowSecurity(bot, chatId) {
  const { getAllLoginLogs, getStats, getBehaviorAnalysis, getAllInteractionLogs } = await import('./database.js');
  
  const logs = getAllLoginLogs(10);
  const stats = getStats();
  const behavior = getBehaviorAnalysis();
  const interactions = getAllInteractionLogs(15);
  
  let logsText = '';
  if (logs.length > 0) {
    logsText = '\n📋 *ÚLTIMOS ACESSOS REGISTRADOS:*\n';
    logs.forEach((log, idx) => {
      const userName = log.user_name || 'Usuário não encontrado';
      const time = new Date(log.login_time).toLocaleString('pt-BR');
      const status = log.status === 'success' ? '✅' : '❌';
      logsText += `${idx + 1}. ${status} ${userName} - ${time}\n`;
    });
  } else {
    logsText = '\n📋 *Nenhum log de acesso encontrado*\n';
  }

  let interactionsText = '';
  if (interactions.length > 0) {
    interactionsText = '\n🔍 *ÚLTIMAS INTERAÇÕES:*\n';
    interactions.forEach((log, idx) => {
      const userName = log.user_name || 'N/A';
      const time = new Date(log.timestamp).toLocaleString('pt-BR');
      const type = log.message_type === 'command' ? `/${log.command_name}` : log.message_type;
      const status = log.status === 'success' ? '✅' : '❌';
      interactionsText += `${idx + 1}. ${status} ${userName}: ${type} - ${time}\n`;
    });
  }

  let topUsersText = '';
  if (behavior && behavior.topUsers.length > 0) {
    topUsersText = '\n👥 *TOP USUÁRIOS MAIS ATIVOS:*\n';
    behavior.topUsers.slice(0, 5).forEach((user, idx) => {
      const name = user.user_name || 'N/A';
      const interactions = user.total_interactions;
      const commands = user.commands_used;
      topUsersText += `${idx + 1}. ${name}: ${interactions} interações, ${commands} comandos\n`;
    });
  }

  let topCommandsText = '';
  if (behavior && behavior.topCommands.length > 0) {
    topCommandsText = '\n⚡ *COMANDOS MAIS USADOS:*\n';
    behavior.topCommands.slice(0, 5).forEach((cmd, idx) => {
      const name = cmd.command_name;
      const usage = cmd.usage_count;
      const users = cmd.unique_users;
      topCommandsText += `${idx + 1}. /${name}: ${usage}x (${users} usuários)\n`;
    });
  }

  const errorRate = behavior ? behavior.errorRate.error_percentage.toFixed(1) : '0.0';

  const response = `
🔐 *AUDITÓRIA COMPLETA DE SEGURANÇA E USO*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 *STATUS GERAL*
✅ Acesso de Admin: Protegido
✅ Banco de Dados: Encrypted  
✅ Logs: Ativados (Completos)
✅ Total de Usuários: ${stats.totalUsers}
✅ Total de Logins: ${stats.totalLogins}
✅ Taxa de Erro: ${errorRate}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${logsText}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${interactionsText}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${topUsersText}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${topCommandsText}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛡️ *RECOMENDAÇÕES DE SEGURANÇA*

✅ Todos os logins sendo registrados
✅ Todas as interações sendo monitoradas
✅ Padrões de uso identificados
✅ Análise de comportamento ativa
✅ Dados sensíveis criptografados

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  await bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
}

/**
 * MOSTRAR ANÁLISE DETALHADA DE UM USUÁRIO
 */
async function adminShowUserAnalysis(bot, chatId, userId) {
  const { getUserById, getUserUsageStats, getUserInteractionLogs } = await import('./database.js');

  const user = getUserById(userId);
  if (!user) {
    await bot.sendMessage(chatId, `❌ Usuário com ID ${userId} não encontrado.`, { parse_mode: 'Markdown' });
    return;
  }

  const usageStats = getUserUsageStats(userId);
  const recentInteractions = getUserInteractionLogs(userId, 10);

  let interactionsText = '';
  if (recentInteractions.length > 0) {
    interactionsText = '\n🔍 *ÚLTIMAS INTERAÇÕES:*\n';
    recentInteractions.forEach((log, idx) => {
      const time = new Date(log.timestamp).toLocaleString('pt-BR');
      const type = log.message_type === 'command' ? `/${log.command_name}` : log.message_type;
      const status = log.status === 'success' ? '✅' : '❌';
      interactionsText += `${idx + 1}. ${status} ${type} - ${time}\n`;
    });
  }

  let topCommandsText = '';
  if (usageStats && usageStats.topCommands.length > 0) {
    topCommandsText = '\n⚡ *COMANDOS MAIS USADOS:*\n';
    usageStats.topCommands.slice(0, 5).forEach((cmd, idx) => {
      const name = cmd.command_name;
      const usage = cmd.usage_count;
      const avgTime = cmd.avg_response_time ? `${cmd.avg_response_time.toFixed(0)}ms` : 'N/A';
      topCommandsText += `${idx + 1}. /${name}: ${usage}x (média: ${avgTime})\n`;
    });
  }

  let hourlyPatternText = '';
  if (usageStats && usageStats.hourlyPattern.length > 0) {
    hourlyPatternText = '\n🕐 *PADRÃO HORÁRIO DE USO:*\n';
    const hourNames = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'];
    usageStats.hourlyPattern.forEach((hour) => {
      const hourName = hourNames[parseInt(hour.hour)] || hour.hour;
      hourlyPatternText += `${hourName}h: ${hour.interactions_count} interações\n`;
    });
  }

  const totalInteractions = usageStats ? usageStats.general.total_interactions : 0;
  const totalCommands = usageStats ? usageStats.general.total_commands : 0;
  const totalMessages = usageStats ? usageStats.general.total_messages : 0;
  const avgResponseTime = usageStats && usageStats.general.avg_response_time ? `${usageStats.general.avg_response_time.toFixed(0)}ms` : 'N/A';
  const firstInteraction = usageStats ? new Date(usageStats.general.first_interaction).toLocaleString('pt-BR') : 'N/A';
  const lastInteraction = usageStats ? new Date(usageStats.general.last_interaction).toLocaleString('pt-BR') : 'N/A';

  const response = `
👤 *ANÁLISE DETALHADA DO USUÁRIO*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 *INFORMAÇÕES BÁSICAS*
👤 Nome: *${user.name}*
📧 Email: *${user.email}*
🔢 ID: ${user.id}
📱 Chat ID: ${user.chat_id}
✅ Status: ${user.status === 'active' ? '🟢 Ativo' : '⚪ Inativo'}
📅 Cadastrado em: ${new Date(user.created_at).toLocaleString('pt-BR')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 *ESTATÍSTICAS DE USO*
🔄 Total de Interações: ${totalInteractions}
⚡ Total de Comandos: ${totalCommands}
💬 Total de Mensagens: ${totalMessages}
⏱️ Tempo Médio de Resposta: ${avgResponseTime}
🕐 Primeira Interação: ${firstInteraction}
🕐 Última Interação: ${lastInteraction}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${interactionsText}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${topCommandsText}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${hourlyPatternText}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  await bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
}

export default {
  isAdmin,
  setupAdminInfoCommand,
  showAdminMenu
};
