#!/usr/bin/env node

/**
 * CADASTRO DE ADMINS
 * Script para registrar os administradores do sistema
 */

import { initializeDatabase, registerUser } from './database.js';

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║                  CADASTRO DE ADMINISTRADORES                  ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// Inicializar banco de dados
console.log('📊 Inicializando banco de dados...\n');
initializeDatabase();

// Lista de administradores
const admins = [
  {
    chatId: 100,  // ID único para admin
    nome: 'Lucas de Sousa Morais',
    email: 'educorp.lucasmorais@gmail.com',
    apelido: 'Lucas'
  },
  {
    chatId: 101,
    nome: 'Rose Amorim',
    email: 'roseamorimgoncalves@gmail.com',
    apelido: 'Rose'
  },
  {
    chatId: 102,
    nome: 'Samilla Santos',
    email: 'samillavs@gmail.com',
    apelido: 'Samilla'
  },
  {
    chatId: 103,
    nome: 'Zeus Siqueira Bessoni',
    email: 'zeussiqueira@gmail.com',
    apelido: 'Zeus'
  }
];

// Registrar cada admin
console.log('👤 Registrando administradores:\n');

const resultados = [];

admins.forEach((admin, index) => {
  console.log(`${index + 1}. Registrando ${admin.apelido}...`);
  
  const resultado = registerUser(admin.chatId, admin.nome, admin.email);
  
  if (resultado.success) {
    console.log(`   ✅ ${admin.apelido} cadastrado com sucesso!`);
    console.log(`   📧 Email: ${admin.email}`);
    console.log(`   🆔 ID: ${resultado.userId}\n`);
    
    resultados.push({
      apelido: admin.apelido,
      email: admin.email,
      userId: resultado.userId,
      status: 'sucesso'
    });
  } else {
    console.log(`   ❌ Erro: ${resultado.message}\n`);
    
    resultados.push({
      apelido: admin.apelido,
      email: admin.email,
      status: 'erro',
      mensagem: resultado.message
    });
  }
});

// Resumo final
console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║                         RESUMO FINAL                          ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

const sucessos = resultados.filter(r => r.status === 'sucesso').length;
const erros = resultados.filter(r => r.status === 'erro').length;

console.log(`✅ Cadastrados com sucesso: ${sucessos}`);
console.log(`❌ Erros no cadastro: ${erros}\n`);

console.log('ADMINISTRADORES CADASTRADOS:\n');
resultados.forEach((r, i) => {
  if (r.status === 'sucesso') {
    console.log(`${i + 1}. ${r.apelido}`);
    console.log(`   └─ 📧 ${r.email}`);
    console.log(`   └─ 🆔 ID: ${r.userId}\n`);
  }
});

if (erros > 0) {
  console.log('\nERROS:\n');
  resultados.forEach((r, i) => {
    if (r.status === 'erro') {
      console.log(`${i + 1}. ${r.apelido} - ${r.mensagem}\n`);
    }
  });
}

console.log('════════════════════════════════════════════════════════════════\n');

if (sucessos === admins.length) {
  console.log('✨ Todos os administradores foram cadastrados com sucesso!\n');
} else {
  console.log(`⚠️  ${sucessos}/${admins.length} administradores cadastrados.\n`);
}
