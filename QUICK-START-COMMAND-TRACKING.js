#!/usr/bin/env node

/**
 * QUICK START - REFERÊNCIA RÁPIDA
 * 
 * Copie e cole estas linhas diretamente no seu código
 */

// ═══════════════════════════════════════════════════════════════════════════
// 1️⃣  SETUP INICIAL
// ═══════════════════════════════════════════════════════════════════════════

import { initializeDatabase } from './database.js';
import commandTracker from './command-tracker.js';
import reportGenerator from './report-generator.js';

// Inicializar DB uma vez ao startar o bot
initializeDatabase();


// ═══════════════════════════════════════════════════════════════════════════
// 2️⃣  RASTREAMENTO AUTOMÁTICO (Fácil - Copie e Cole)
// ═══════════════════════════════════════════════════════════════════════════

// Para CADA comando do seu bot, use:

bot.onText(/\/gerar/, async (msg) => {
  const result = await commandTracker.executeWithTracking(
    msg.chat.id,
    '/gerar',
    'Gerar conteúdo com IA',
    async () => {
      // 👇 AQUI VAI SUA LÓGICA DO COMANDO
      const conteudo = await gerarConteudo();
      return conteudo;
      // 👆
    }
  );

  if (result) {
    bot.sendMessage(msg.chat.id, result);
  }
});


// ═══════════════════════════════════════════════════════════════════════════
// 3️⃣  RELATÓRIOS (Copie e Cole)
// ═══════════════════════════════════════════════════════════════════════════

bot.onText(/\/relatorio/, async (msg) => {
  const relatorio = reportGenerator.generateTextReport(30);
  bot.sendMessage(msg.chat.id, relatorio);
});

bot.onText(/\/stats/, async (msg) => {
  const stats = reportGenerator.getQuickStats();
  bot.sendMessage(msg.chat.id, stats);
});

bot.onText(/\/gerar_relatorios/, async (msg) => {
  reportGenerator.generateAllReports(30);
  bot.sendMessage(msg.chat.id, '✅ Relatórios gerados em /reports');
});


// ═══════════════════════════════════════════════════════════════════════════
// 4️⃣  CONSULTAS AO BANCO (Referência)
// ═══════════════════════════════════════════════════════════════════════════

import {
  getUserCommandHistory,
  getMostUsedCommands,
  getCommandStatsByUser,
  generateCompleteReport
} from './database.js';

// Histórico de um usuário
const historico = getUserCommandHistory(userId, 50);

// Top 10 comandos dos últimos 30 dias
const topCmds = getMostUsedCommands(10, 30);

// Estatísticas por usuário
const stats = getCommandStatsByUser(20);

// Relatório completo
const report = generateCompleteReport(30);
console.log(report);


// ═══════════════════════════════════════════════════════════════════════════
// 5️⃣  REGISTRAR MANUALMENTE (Se necessário)
// ═══════════════════════════════════════════════════════════════════════════

import { registerCommand } from './database.js';

registerCommand(
  userId,                    // ID do usuário
  chatId,                    // ID do Telegram
  '/comando',                // Nome do comando
  'Descrição do comando',    // Descrição
  1250,                      // Tempo em ms
  'success',                 // 'success' ou 'error'
  { param: 'valor' },        // Parâmetros (opcional)
  2500,                      // Tamanho resposta (opcional)
  null                       // Mensagem de erro (opcional)
);


// ═══════════════════════════════════════════════════════════════════════════
// 6️⃣  CASOS DE USO COMUNS
// ═══════════════════════════════════════════════════════════════════════════

// USE 1: Comando simples
bot.onText(/\/hello/, async (msg) => {
  const result = await commandTracker.executeWithTracking(
    msg.chat.id, '/hello', 'Saudação',
    async () => 'Olá! 👋'
  );
  if (result) bot.sendMessage(msg.chat.id, result);
});

// USE 2: Comando com parâmetro
bot.onText(/\/buscar (.+)/, async (msg) => {
  const termo = msg.match[1];
  const result = await commandTracker.executeWithTracking(
    msg.chat.id, '/buscar', 'Buscar conteúdo',
    async () => {
      return await buscarConteudo(termo);
    },
    { termo: termo }
  );
  if (result) bot.sendMessage(msg.chat.id, result);
});

// USE 3: Comando com tratamento de erro
bot.onText(/\/processar/, async (msg) => {
  const tracker = await commandTracker.logCommand(
    msg.chat.id, '/processar', 'Processar dados'
  );

  try {
    const resultado = await processarDados();
    tracker.complete('success', null, resultado.length);
    bot.sendMessage(msg.chat.id, resultado);
  } catch (erro) {
    tracker.complete('error', erro.message);
    bot.sendMessage(msg.chat.id, '❌ Erro ao processar');
  }
});


// ═══════════════════════════════════════════════════════════════════════════
// 7️⃣  ANÁLISES E GRÁFICOS
// ═══════════════════════════════════════════════════════════════════════════

// Comandos mais usados (texto formatado)
function cmdsMaisUsados() {
  const top = getMostUsedCommands(10, 30);
  let text = '🔥 TOP 10 COMANDOS\n\n';
  top.forEach((cmd, i) => {
    text += `${i+1}. ${cmd.command_name}\n`;
    text += `   └─ ${cmd.uses} usos | ${cmd.avg_time?.toFixed(0) || 0}ms\n`;
  });
  return text;
}

// Usuários mais ativos (texto formatado)
function usuariosMaisAtivos() {
  const stats = getCommandStatsByUser(10);
  let text = '👥 USUÁRIOS MAIS ATIVOS\n\n';
  stats.forEach((user, i) => {
    text += `${i+1}. ${user.name || 'Anônimo'}\n`;
    text += `   └─ ${user.total_commands} comandos\n`;
  });
  return text;
}


// ═══════════════════════════════════════════════════════════════════════════
// 8️⃣  EXEMPLO COMPLETO
// ═══════════════════════════════════════════════════════════════════════════

/*

import TelegramBot from 'node-telegram-bot-api';
import { initializeDatabase } from './database.js';
import commandTracker from './command-tracker.js';
import reportGenerator from './report-generator.js';

const bot = new TelegramBot('YOUR_TOKEN', { polling: true });

// Inicializar DB
initializeDatabase();

// Comando /start
bot.onText(/\/start/, async (msg) => {
  const result = await commandTracker.executeWithTracking(
    msg.chat.id, '/start', 'Iniciar bot',
    async () => 'Bem-vindo ao bot! 🤖'
  );
  if (result) bot.sendMessage(msg.chat.id, result);
});

// Comando /relatorio
bot.onText(/\/relatorio/, async (msg) => {
  const relatorio = reportGenerator.generateTextReport(30);
  bot.sendMessage(msg.chat.id, relatorio);
});

// Comando /gerar
bot.onText(/\/gerar (.+)/, async (msg) => {
  const tema = msg.match[1];
  const result = await commandTracker.executeWithTracking(
    msg.chat.id, '/gerar', 'Gerar conteúdo',
    async () => {
      // Sua IA aqui
      return `Conteúdo sobre: ${tema}`;
    },
    { tema: tema }
  );
  if (result) bot.sendMessage(msg.chat.id, result);
});

console.log('✅ Bot iniciado com rastreamento de comandos!');

*/


// ═══════════════════════════════════════════════════════════════════════════
// 9️⃣  TROUBLESHOOTING
// ═══════════════════════════════════════════════════════════════════════════

/*

❌ Problema: "Usuário não registrado"
✅ Solução: Certifique-se que o usuário foi registrado com registerUser()

❌ Problema: Relatório vazio
✅ Solução: Certifique-se que há comandos registrados no período especificado

❌ Problema: Tempo de execução sempre 0
✅ Solução: O tempo é calculado automaticamente pelo tracker

❌ Problema: Banco de dados corrompido
✅ Solução: Delete users.db e reinicie - DB será recriado

*/


// ═════════════════════════════════════════════════════════════════════════════
// 🔟 DICAS DE PERFORMANCE
// ═════════════════════════════════════════════════════════════════════════════

/*

1. Use executeWithTracking para 95% dos casos
2. Registre manualmente apenas em operações complexas
3. Chame generateAllReports() periodicamente (ex: daily job)
4. Limpe dados antigos regularmente:

   // Deletar comandos com mais de 6 meses
   db.prepare(
     "DELETE FROM user_commands WHERE executed_at < datetime('now', '-6 months')"
   ).run();

5. Indexe colunas frequentemente consultadas (já feito)

*/


// ═════════════════════════════════════════════════════════════════════════════
// ⚠️  IMPORTANTE
// ═════════════════════════════════════════════════════════════════════════════

/*

1. Sempre chame initializeDatabase() ao iniciar o bot
2. Registre usuários antes de rastrear comandos
3. Use await quando chamar executeWithTracking
4. Mantenha backup do users.db
5. Revise relatórios regularmente

*/


// ═════════════════════════════════════════════════════════════════════════════
// 📊 ARQUIVOS GERADOS
// ═════════════════════════════════════════════════════════════════════════════

/*

Após executar generateAllReports(30), você terá em /reports/:

relatorio-completo-[timestamp].txt
├─ Relatório legível
├─ Visão geral
├─ Top 10 comandos
├─ Top 10 usuários
└─ Distribuição por hora

relatorio-completo-[timestamp].csv
├─ Formato Excel
├─ Facilita análise em planilhas
└─ Importável em BI tools

relatorio-completo-[timestamp].json
├─ Dados estruturados
├─ Importável em APIs
└─ Ideal para dashboards

*/

export default {
  commandTracker,
  reportGenerator
};
