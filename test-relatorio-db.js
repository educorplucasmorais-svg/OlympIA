#!/usr/bin/env node

/**
 * 🧪 TESTE DO SISTEMA DE RELATÓRIOS (SIMPLIFICADO)
 */

import sqlite3 from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'users.db');

const db = new sqlite3(DB_PATH);

console.log('\n🧪 TESTE DO SISTEMA DE RELATÓRIOS\n');

// Teste 1: Verificar tabela
console.log('📋 TESTE 1: Verificar Estrutura do Banco');
try {
  const result = db.prepare(`
    SELECT sql FROM sqlite_master 
    WHERE type='table' AND name='daily_reports'
  `).get();
  
  if (result) {
    console.log('✅ Tabela daily_reports existe');
  } else {
    console.log('❌ Tabela daily_reports NÃO encontrada');
  }
} catch (error) {
  console.log('❌ Erro:', error.message);
}

// Teste 2: Listar relatórios
console.log('\n📊 TESTE 2: Listar Relatórios Salvos');
try {
  const reports = db.prepare(`
    SELECT id, report_date, report_subject, email_sent, email_error
    FROM daily_reports
    ORDER BY report_date DESC
    LIMIT 5
  `).all();
  
  if (reports.length > 0) {
    console.log(`✅ ${reports.length} relatório(s) encontrado(s):`);
    reports.forEach((report, i) => {
      const status = report.email_sent ? '✅ Email' : '❌ BD';
      console.log(`   ${i + 1}. ID ${report.id} | ${report.report_date} | ${status}`);
      if (report.email_error) {
        console.log(`      Erro: ${report.email_error}`);
      }
    });
  } else {
    console.log('ℹ️  Nenhum relatório ainda - use /relatorio no bot');
  }
} catch (error) {
  console.log('❌ Erro:', error.message);
}

// Teste 3: Verificar PDF
console.log('\n📄 TESTE 3: Verificar Armazenamento de PDF');
try {
  const report = db.prepare(`
    SELECT id, report_date, report_subject,
           CASE WHEN pdf_data IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as tem_pdf,
           LENGTH(pdf_data) as tamanho_pdf,
           email_sent, email_error
    FROM daily_reports
    ORDER BY generated_at DESC
    LIMIT 1
  `).get();
  
  if (report) {
    console.log(`✅ Relatório mais recente (ID ${report.id}):`);
    console.log(`   Data: ${report.report_date}`);
    console.log(`   PDF: ${report.tem_pdf} (${report.tamanho_pdf > 0 ? (report.tamanho_pdf / 1024).toFixed(2) + ' KB' : '0 bytes'})`);
    console.log(`   Email: ${report.email_sent ? 'Enviado ✅' : 'Armazenado no BD ❌'}`);
    if (report.email_error) {
      console.log(`   Erro: ${report.email_error}`);
    }
  } else {
    console.log('ℹ️  Nenhum relatório - use /relatorio no bot para gerar');
  }
} catch (error) {
  console.log('❌ Erro:', error.message);
}

// Teste 4: Admin IDs
console.log('\n🔐 TESTE 4: Configuração de Admins');
const adminIds = (process.env.ADMIN_CHAT_IDS || '1,2,3,4')
  .split(',')
  .map((id) => parseInt(id.trim(), 10));

console.log(`✅ Admin Chat IDs: ${adminIds.join(', ')}`);

// Teste 5: Scheduler
console.log('\n⏰ TESTE 5: Configuração do Scheduler');
const tz = process.env.REPORT_TIMEZONE || 'America/Sao_Paulo';
console.log(`✅ Scheduler: 05:00 (${tz})`);

console.log('\n' + '='.repeat(50));
console.log('✅ TESTES CONCLUÍDOS\n');

db.close();
process.exit(0);
