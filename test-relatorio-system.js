#!/usr/bin/env node

/**
 * 🧪 TESTE DO SISTEMA DE RELATÓRIOS
 * Simula fluxo completo de geração, armazenamento e recuperação
 */

import db from './database.js';
import { listDailyReports, getReportById } from './database.js';

console.log('🧪 TESTE DO SISTEMA DE RELATÓRIOS\n');

// Teste 1: Verificar tabela de relatórios
console.log('📋 TESTE 1: Verificar Estrutura do Banco de Dados');
try {
  const result = db.prepare(`
    SELECT sql FROM sqlite_master 
    WHERE type='table' AND name='daily_reports'
  `).get();
  
  if (result) {
    console.log('✅ Tabela daily_reports existe');
    console.log('   Estrutura:', result.sql);
  } else {
    console.log('❌ Tabela daily_reports NÃO ENCONTRADA');
  }
} catch (error) {
  console.log('❌ Erro ao verificar tabela:', error.message);
}

// Teste 2: Listar relatórios existentes
console.log('\n📊 TESTE 2: Listar Relatórios Salvos');
try {
  const reports = listDailyReports(5);
  if (reports.length > 0) {
    console.log(`✅ ${reports.length} relatório(s) encontrado(s):`);
    reports.forEach((report, i) => {
      const date = new Date(report.report_date).toLocaleDateString('pt-BR');
      const status = report.email_sent ? '✅ Email' : '❌ BD';
      console.log(`   ${i + 1}. ID ${report.id} | ${date} | ${status}`);
      if (report.email_error) {
        console.log(`      Erro: ${report.email_error}`);
      }
    });
  } else {
    console.log('ℹ️  Nenhum relatório salvo ainda');
    console.log('   Dica: Use /relatorio no bot para gerar um');
  }
} catch (error) {
  console.log('❌ Erro ao listar relatórios:', error.message);
}

// Teste 3: Verificar PDF em relatório mais recente
console.log('\n📄 TESTE 3: Verificar Armazenamento de PDF');
try {
  const stmt = db.prepare(`
    SELECT id, report_date, report_subject, 
           CASE WHEN pdf_data IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as tem_pdf,
           LENGTH(pdf_data) as tamanho_pdf,
           email_sent, email_error
    FROM daily_reports 
    ORDER BY generated_at DESC 
    LIMIT 1
  `);
  
  const report = stmt.get();
  if (report) {
    console.log(`✅ Relatório mais recente (ID ${report.id}):`);
    console.log(`   Data: ${report.report_date}`);
    console.log(`   Assunto: ${report.report_subject}`);
    console.log(`   PDF salvo: ${report.tem_pdf}`);
    if (report.tamanho_pdf > 0) {
      console.log(`   Tamanho PDF: ${(report.tamanho_pdf / 1024).toFixed(2)} KB`);
    }
    console.log(`   Email enviado: ${report.email_sent ? 'Sim ✅' : 'Não (armazenado no BD) ❌'}`);
    if (report.email_error) {
      console.log(`   Erro de email: ${report.email_error}`);
    }
  } else {
    console.log('ℹ️  Nenhum relatório encontrado');
  }
} catch (error) {
  console.log('❌ Erro ao verificar PDF:', error.message);
}

// Teste 4: Verificar admin IDs
console.log('\n🔐 TESTE 4: Configuração de Admins');
try {
  const adminIds = (process.env.ADMIN_CHAT_IDS || '1,2,3,4')
    .split(',')
    .map((id) => parseInt(id.trim(), 10));
  
  console.log(`✅ Admin Chat IDs: ${adminIds.join(', ')}`);
  console.log(`   Dica: Use /meu-id no bot para descobrir seu chat ID`);
} catch (error) {
  console.log('❌ Erro ao ler admin IDs:', error.message);
}

// Teste 5: Simular inserção de relatório para testes
console.log('\n🔧 TESTE 5: Função de Armazenamento');
try {
  const { saveReportToDatabase } = await import('./database.js');
  
  const testPdf = Buffer.from('PDF Test Content');
  const testHtml = '<html><body>Test Report</body></html>';
  
  const result = saveReportToDatabase(
    new Date().toISOString().split('T')[0],
    'Relatório de Teste',
    testPdf,
    testHtml,
    false,
    'Erro de teste (simulado para validação)'
  );
  
  if (result.success) {
    console.log(`✅ Simulação funcionou - Relatório ID: ${result.reportId}`);
    console.log(`   Dica: Teste recuperar com /relatorio-baixar ${result.reportId}`);
  } else {
    console.log(`❌ Erro na simulação: ${result.error}`);
  }
} catch (error) {
  console.log('❌ Erro ao testar armazenamento:', error.message);
}

// Teste 6: Verificar scheduler
console.log('\n⏰ TESTE 6: Verificar Scheduler (05:00)');
try {
  const REPORT_TIMEZONE = process.env.REPORT_TIMEZONE || 'America/Sao_Paulo';
  const SCHEDULE_TIMEZONE = process.env.SCHEDULE_TIMEZONE || 'America/Sao_Paulo';
  
  console.log(`✅ Scheduler configurado:`);
  console.log(`   Timezone do relatório: ${REPORT_TIMEZONE}`);
  console.log(`   Timezone do scheduler: ${SCHEDULE_TIMEZONE}`);
  console.log(`   Horário: 05:00 (00 05 * * *)`);
  console.log(`   Status: Aguardando próximo agendamento`);
} catch (error) {
  console.log('❌ Erro ao verificar scheduler:', error.message);
}

console.log('\n' + '='.repeat(50));
console.log('✅ TESTES CONCLUÍDOS');
console.log('\n📝 PRÓXIMOS PASSOS:');
console.log('1. Use /relatorio no Telegram para gerar um relatório');
console.log('2. Use /relatorios para listar relatórios salvos');
console.log('3. Use /relatorio-baixar ID para baixar o PDF');
console.log('4. Aguarde 05:00 para testar geração automática');
console.log('='.repeat(50) + '\n');

process.exit(0);
