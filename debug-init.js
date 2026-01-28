import dotenv from 'dotenv';
dotenv.config();

console.log('🔍 Testando inicialização da classe...');

try {
  // Importar apenas o necessário para testar
  const { initializeDatabase } = await import('./database.js');
  console.log('✅ Database import OK');

  // Tentar inicializar database
  initializeDatabase();
  console.log('✅ Database inicializado');

  console.log('🎉 Inicialização básica OK!');

} catch (error) {
  console.error('❌ Erro na inicialização:', error.message);
  console.error('Stack:', error.stack);
}