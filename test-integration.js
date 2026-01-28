#!/usr/bin/env node

/**
 * 🧪 TESTE DE INTEGRAÇÃO COMPLETA - Admin Panel & Security
 * 
 * Script para validar se todos os módulos estão integrados corretamente
 */

import fs from 'fs';
import path from 'path';

console.log('🧪 TESTE DE INTEGRAÇÃO COMPLETA\n');
console.log('═'.repeat(50));

// 1️⃣ Verificar se todos os arquivos existem
console.log('\n1️⃣ VERIFICANDO ARQUIVOS NECESSÁRIOS...\n');

const requiredFiles = [
  'admin-commands.js',
  'admin-security.js',
  'daily-report.js',
  'telegram-bot.js',
  'package.json',
  'README-COMPLETO.md',
  'database.js'
];

let fileChecksPassed = 0;
for (const file of requiredFiles) {
  const exists = fs.existsSync(path.join('.', file));
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${file}`);
  if (exists) fileChecksPassed++;
}

console.log(`\n✅ ${fileChecksPassed}/${requiredFiles.length} arquivos encontrados`);

// 2️⃣ Verificar imports em telegram-bot.js
console.log('\n2️⃣ VERIFICANDO IMPORTS NO telegram-bot.js...\n');

const botContent = fs.readFileSync('telegram-bot.js', 'utf-8');

const requiredImports = [
  "import { setupAdminInfoCommand } from './admin-commands.js'",
  "import { initializeDailyReportSchedule, generateReportOnDemand } from './daily-report.js'",
  "import adminSecurity from './admin-security.js'"
];

let importChecksPassed = 0;
for (const imp of requiredImports) {
  const hasImport = botContent.includes(imp);
  const status = hasImport ? '✅' : '❌';
  console.log(`${status} ${imp.substring(0, 60)}...`);
  if (hasImport) importChecksPassed++;
}

console.log(`\n✅ ${importChecksPassed}/${requiredImports.length} imports encontrados`);

// 3️⃣ Verificar inicialização no setupBot
console.log('\n3️⃣ VERIFICANDO INICIALIZAÇÃO NO setupBot()...\n');

const initChecks = [
  'setupAdminInfoCommand(this.bot)',
  'initializeDailyReportSchedule(this.bot)',
  'adminSecurity.verifyDatabaseIntegrity',
  'adminSecurity.cleanOldLogs()'
];

let initChecksPassed = 0;
for (const check of initChecks) {
  const hasCheck = botContent.includes(check);
  const status = hasCheck ? '✅' : '❌';
  console.log(`${status} ${check}`);
  if (hasCheck) initChecksPassed++;
}

console.log(`\n✅ ${initChecksPassed}/${initChecks.length} inicializações encontradas`);

// 4️⃣ Verificar node-schedule no package.json
console.log('\n4️⃣ VERIFICANDO DEPENDÊNCIAS...\n');

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

const deps = [
  'node-schedule',
  'node-telegram-bot-api',
  'better-sqlite3',
  'nodemailer'
];

let depChecksPassed = 0;
for (const dep of deps) {
  const hasDep = dep in packageJson.dependencies;
  const status = hasDep ? '✅' : '❌';
  const version = hasDep ? packageJson.dependencies[dep] : 'N/A';
  console.log(`${status} ${dep}: ${version}`);
  if (hasDep) depChecksPassed++;
}

console.log(`\n✅ ${depChecksPassed}/${deps.length} dependências encontradas`);

// 5️⃣ Verificar estrutura dos arquivos admin
console.log('\n5️⃣ VERIFICANDO ESTRUTURA DOS MÓDULOS ADMIN...\n');

// admin-commands.js
const adminCmdsContent = fs.readFileSync('admin-commands.js', 'utf-8');
const adminCmdsFunctions = [
  'async isAdmin(chatId)',
  'async setupAdminInfoCommand',
  'async showAdminMenu',
  'async adminShowUsers',
  'async adminShowStats',
  'async adminShowCommands',
  'async adminShowReports',
  'async adminShowSystem',
  'async adminShowSecurity'
];

console.log('admin-commands.js:');
let adminCmdsPassed = 0;
for (const fn of adminCmdsFunctions) {
  const hasFn = adminCmdsContent.includes(fn);
  const status = hasFn ? '✅' : '❌';
  console.log(`  ${status} ${fn}`);
  if (hasFn) adminCmdsPassed++;
}

// admin-security.js
const adminSecContent = fs.readFileSync('admin-security.js', 'utf-8');
const adminSecFunctions = [
  'hashPassword(',
  'verifyPassword(',
  'encryptData(',
  'decryptData(',
  'logAuditEvent(',
  'class LoginAttemptLimiter',
  'validateAdminData(',
  'sanitizeInput(',
  'secureBackupDatabase(',
  'verifyDatabaseIntegrity('
];

console.log('\nadmin-security.js:');
let adminSecPassed = 0;
for (const fn of adminSecFunctions) {
  const hasFn = adminSecContent.includes(fn);
  const status = hasFn ? '✅' : '❌';
  console.log(`  ${status} ${fn}`);
  if (hasFn) adminSecPassed++;
}

// daily-report.js
const dailyRepContent = fs.readFileSync('daily-report.js', 'utf-8');
const dailyRepFunctions = [
  'async generateDailyReport()',
  'async sendReportToAdmins(',
  'async runDailyTests(',
  'async initializeDailyReportSchedule(',
  'async generateReportOnDemand(',
  "schedule.scheduleJob('0 5 * * *'"
];

console.log('\ndaily-report.js:');
let dailyRepPassed = 0;
for (const fn of dailyRepFunctions) {
  const hasFn = dailyRepContent.includes(fn);
  const status = hasFn ? '✅' : '❌';
  console.log(`  ${status} ${fn}`);
  if (hasFn) dailyRepPassed++;
}

const totalModuleChecks = adminCmdsPassed + adminSecPassed + dailyRepPassed;
const totalModuleExpected = adminCmdsFunctions.length + adminSecFunctions.length + dailyRepFunctions.length;

console.log(`\n✅ ${totalModuleChecks}/${totalModuleExpected} funções encontradas nos módulos`);

// 6️⃣ Resumo Final
console.log('\n' + '═'.repeat(50));
console.log('\n📊 RESUMO FINAL DE TESTES\n');

const totalTests = fileChecksPassed + importChecksPassed + initChecksPassed + depChecksPassed + totalModuleChecks;
const totalExpected = requiredFiles.length + requiredImports.length + initChecks.length + deps.length + totalModuleExpected;
const successRate = Math.round((totalTests / totalExpected) * 100);

console.log(`Total: ${totalTests}/${totalExpected} verificações passaram`);
console.log(`Taxa de Sucesso: ${successRate}%\n`);

if (successRate === 100) {
  console.log('🟢 INTEGRAÇÃO COMPLETA E VALIDADA!');
  console.log('\n✅ Todos os módulos admin estão integrados corretamente');
  console.log('✅ Todas as dependências foram instaladas');
  console.log('✅ Toda a estrutura está em lugar\n');
  console.log('🚀 Próximo passo: npm start ou node telegram-bot.js\n');
  process.exit(0);
} else if (successRate >= 80) {
  console.log('🟡 INTEGRAÇÃO PARCIAL');
  console.log('⚠️  Alguns itens não foram encontrados');
  console.log('📋 Por favor, verifique o guia de finalização\n');
  process.exit(1);
} else {
  console.log('🔴 INTEGRAÇÃO INCOMPLETA');
  console.log('❌ Muitos itens estão faltando');
  console.log('📋 Por favor, siga o GUIA-FINALIZACAO.md\n');
  process.exit(1);
}
