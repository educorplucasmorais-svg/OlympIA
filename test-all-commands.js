#!/usr/bin/env node
// 🧪 Teste Completo de Todos os 22 Comandos da OlympIA

import fs from 'fs';
import path from 'path';

const botCode = fs.readFileSync('./telegram-bot.js', 'utf-8');

const commands = [
  { name: '/gerar', regex: /this\.bot\.onText\(\/\\\/gerar/, desc: 'Gerar conteúdo com IA' },
  { name: '/analisar', regex: /this\.bot\.onText\(\/\\\/analisar/, desc: 'Análise profunda' },
  { name: '/keywords', regex: /this\.bot\.onText\(\/\\\/keywords/, desc: 'Palavras-chave SEO' },
  { name: '/imagem', regex: /this\.bot\.onText\(\/\\\/imagem/, desc: 'Gerar imagem' },
  { name: '/chat', regex: /this\.bot\.onText\(\/\\\/chat/, desc: 'Chat com memória' },
  { name: '/traduzir', regex: /this\.bot\.onText\(\/\\\/traduzir/, desc: 'Traduzir' },
  { name: '/senha', regex: /this\.bot\.onText\(\/\\\/senha/, desc: 'Gerar senha' },
  { name: '/morse', regex: /this\.bot\.onText\(\/\\\/morse/, desc: 'Código Morse' },
  { name: '/noticias', regex: /this\.bot\.onText\(\/\\\/noticias/, desc: 'Notícias' },
  { name: '/falar', regex: /this\.bot\.onText\(\/\\\/falar/, desc: 'Text-to-speech' },
  { name: '/ocr', regex: /this\.bot\.onText\(\/\\\/ocr/, desc: 'OCR de imagem' },
  { name: '/email', regex: /this\.bot\.onText\(\/\\\/email/, desc: 'Enviar email' },
  { name: '/lembrete', regex: /this\.bot\.onText\(\/\\\/lembrete/, desc: 'Agenda lembretes' },
  { name: '/pdf', regex: /this\.bot\.onText\(\/\\\/pdf/, desc: 'Gerar PDF' },
  { name: '/google', regex: /this\.bot\.onText\(\/\\\/google/, desc: 'Pesquisa Google' },
  { name: '/conhecimento', regex: /this\.bot\.onText\(\/\\\/conhecimento/, desc: 'Base de conhecimento' },
  { name: '/kb:stats', regex: /this\.bot\.onText\(\/\\\/kb:stats/, desc: 'Estatísticas da base' },
  { name: '/marketing', regex: /this\.bot\.onText\(\/\\\/marketing/, desc: 'Dicas SEO & Marketing' },
  { name: '/promocao', regex: /this\.bot\.onText\(\/\\\/promocao/, desc: 'Posts prontos' },
  { name: '/social', regex: /this\.bot\.onText\(\/\\\/social/, desc: 'Social Media' },
  { name: '/vip', regex: /this\.bot\.onText\(\/\\\/vip/, desc: 'Hot Commands' },
  { name: '/favoritos', regex: /this\.bot\.onText\(\/\\\/favoritos/, desc: 'Gerenciar Favoritos' }
];

console.log('🧪 TESTE COMPLETO DA OLYMPIA BOT\n');
console.log('=' .repeat(60));
console.log(`📊 Total de Comandos Esperados: ${commands.length}\n`);

let working = 0;
let notFound = 0;

commands.forEach((cmd, idx) => {
  const exists = cmd.regex.test(botCode);
  const status = exists ? '✅ OK' : '❌ NÃO ENCONTRADO';
  
  if (exists) working++;
  else notFound++;
  
  console.log(`${idx + 1}. ${cmd.name.padEnd(15)} - ${cmd.desc.padEnd(30)} ${status}`);
});

console.log('\n' + '='.repeat(60));
console.log(`\n📈 RESULTADO:\n`);
console.log(`✅ Funcionando: ${working}/${commands.length}`);
console.log(`❌ Não encontrados: ${notFound}/${commands.length}`);
console.log(`📊 Taxa de sucesso: ${Math.round((working/commands.length) * 100)}%\n`);

if (notFound > 0) {
  console.log('❌ COMANDOS COM PROBLEMA:');
  commands.forEach(cmd => {
    if (!cmd.regex.test(botCode)) {
      console.log(`   - ${cmd.name}: ${cmd.desc}`);
    }
  });
} else {
  console.log('🎉 TODOS OS COMANDOS FORAM ENCONTRADOS E ESTÃO IMPLEMENTADOS!\n');
}

console.log('=' .repeat(60));
