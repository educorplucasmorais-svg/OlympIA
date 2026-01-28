import {
  initializeDatabase,
  registerUser,
  registerCommand,
  getCommandStatsByUser,
  getUserFullReport,
  generateCompleteReport,
  getMostUsedCommands
} from './database.js';
import reportGenerator from './report-generator.js';

console.log('🚀 TESTE DO SISTEMA DE RASTREAMENTO DE COMANDOS\n');

// Inicializar banco de dados
console.log('1️⃣  Inicializando banco de dados...');
initializeDatabase();

// Registrar usuários de teste
console.log('2️⃣  Registrando usuários de teste...\n');

const user1 = registerUser(123456, 'João Silva', 'joao@example.com');
const user2 = registerUser(789012, 'Maria Santos', 'maria@example.com');
const user3 = registerUser(345678, 'Pedro Oliveira', 'pedro@example.com');

if (user1.success && user2.success && user3.success) {
  console.log('✅ Usuários registrados com sucesso!\n');

  // Registrar alguns comandos
  console.log('3️⃣  Simulando execução de comandos...\n');

  const commands = [
    { userId: user1.userId, command: '/gerar', desc: 'Gerar conteúdo com IA', time: 1250 },
    { userId: user1.userId, command: '/imagem', desc: 'Gerar imagem', time: 3450 },
    { userId: user1.userId, command: '/gerar', desc: 'Gerar conteúdo com IA', time: 1180 },
    { userId: user1.userId, command: '/marketing', desc: 'Estratégia SEO', time: 2100 },
    { userId: user1.userId, command: '/pdf', desc: 'Gerar PDF', time: 890 },
    
    { userId: user2.userId, command: '/conhecimento', desc: 'Busca RAG', time: 2300 },
    { userId: user2.userId, command: '/chat', desc: 'Chat com memória', time: 450 },
    { userId: user2.userId, command: '/gerar', desc: 'Gerar conteúdo com IA', time: 1340 },
    { userId: user2.userId, command: '/email', desc: 'Enviar email', time: 1800 },
    { userId: user2.userId, command: '/conhecimento', desc: 'Busca RAG', time: 2150 },
    
    { userId: user3.userId, command: '/promocao', desc: 'Posts para redes sociais', time: 2700 },
    { userId: user3.userId, command: '/gerar', desc: 'Gerar conteúdo com IA', time: 1200 },
    { userId: user3.userId, command: '/marketing', desc: 'Estratégia SEO', time: 2050 },
  ];

  let commandCount = 0;
  commands.forEach(cmd => {
    registerCommand(
      cmd.userId,
      cmd.userId * 1000 + Math.random() * 100, // chat_id fictício
      cmd.command,
      cmd.desc,
      cmd.time,
      Math.random() > 0.95 ? 'error' : 'success' // 5% de chance de erro
    );
    commandCount++;
  });

  console.log(`✅ ${commandCount} comandos registrados!\n`);

  // Mostrar estatísticas
  console.log('4️⃣  ESTATÍSTICAS DOS USUÁRIOS:\n');
  console.log(reportGenerator.getQuickStats());

  // Relatório completo
  console.log('5️⃣  RELATÓRIO COMPLETO:\n');
  console.log(reportGenerator.generateTextReport(30));

  // Relatório por usuário
  console.log('6️⃣  RELATÓRIO DO PRIMEIRO USUÁRIO:\n');
  console.log(reportGenerator.generateUserReport(user1.userId));

  // Comandos mais utilizados
  console.log('7️⃣  COMANDOS MAIS UTILIZADOS:\n');
  const topCommands = getMostUsedCommands(10, 30);
  topCommands.forEach((cmd, index) => {
    console.log(`${index + 1}. ${cmd.command_name}`);
    console.log(`   └─ Usos: ${cmd.total_uses} | Sucesso: ${cmd.success_count} | Erros: ${cmd.error_count} | Tempo médio: ${cmd.avg_execution_time?.toFixed(2) || 0}ms\n`);
  });

  // Gerar todos os relatórios
  console.log('8️⃣  GERANDO TODOS OS RELATÓRIOS...\n');
  reportGenerator.generateAllReports(30);

} else {
  console.log('❌ Erro ao registrar usuários');
}

console.log('\n✅ TESTE COMPLETADO!\n');
console.log('📁 Os relatórios foram salvos na pasta "/reports"\n');
