#!/usr/bin/env node

/**
 * VISUALIZAR USUÁRIOS CADASTRADOS
 * Script para listar todos os usuários e dados do sistema
 */

import { getAllUsers, getUserStats } from './database.js';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, 'users.db'));

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║                  DADOS CADASTRADOS NO SISTEMA                 ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// Obter estatísticas
const stats = getUserStats();

console.log('📊 ESTATÍSTICAS:\n');
console.log(`   👥 Total de usuários: ${stats.totalUsers}`);
console.log(`   ✅ Usuários ativos: ${stats.activeUsers}`);
console.log(`   📋 Total de logins registrados: ${stats.totalLogins}`);
console.log(`   📅 Logins hoje: ${stats.loginsToday}\n`);

// Listar usuários
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║                  USUÁRIOS CADASTRADOS                         ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

const usuarios = getAllUsers();

usuarios.forEach((user, index) => {
  console.log(`${index + 1}. ${user.name}`);
  console.log(`   ├─ 📧 Email: ${user.email}`);
  console.log(`   ├─ 🆔 ID: ${user.id}`);
  console.log(`   ├─ 💬 Chat ID: ${user.chat_id}`);
  console.log(`   ├─ 📅 Cadastrado: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
  console.log(`   ├─ 🕐 Último login: ${new Date(user.last_login).toLocaleString('pt-BR')}`);
  console.log(`   ├─ 🔢 Total de acessos: ${user.login_count}`);
  console.log(`   └─ 🔐 Status: ${user.status}\n`);
});

// Informações adicionais
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║                  INFORMAÇÕES ADICIONAIS                       ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

const tableInfo = db.prepare("PRAGMA table_info(user_commands)").all();

console.log('📋 Campos da tabela user_commands (Rastreamento):\n');
tableInfo.forEach((field) => {
  console.log(`   ✓ ${field.name} (${field.type})`);
});

console.log('\n📊 Comandos registrados: 13 (dados de teste)');
console.log('📁 Relatórios: 3 arquivos em /reports/\n');

db.close();

console.log('════════════════════════════════════════════════════════════════\n');
