#!/usr/bin/env node
// 🚀 Script de setup da base de conhecimento
import DocScraper from './doc-scraper.js';
import knowledgeBase from './knowledge-base.js';

const scraper = new DocScraper();

async function main() {
  console.log('🧠 OlympIA - Setup da Base de Conhecimento\n');

  // URLs fornecidas pelo usuário
  const urls = [
    'https://docs.google.com/document/d/1Ohejh00uIBrjxRmAOX7hiyKd7JEHj6rfuPioqYvaVhw/edit?tab=t.0',
    'https://notebooklm.google.com/notebook/3273950e-ecf0-4147-873b-abea72bc0acf'
  ];

  console.log('📥 Passo 1: Baixando documentos...\n');
  const results = await scraper.processUrls(urls);

  for (const result of results) {
    if (result.success) {
      console.log(`✅ Sucesso: ${result.filePath}`);
    } else {
      console.log(`❌ Erro: ${result.error}`);
      if (result.instructions) {
        console.log(result.instructions);
      }
    }
  }

  console.log('\n📚 Passo 2: Listar documentos disponíveis...\n');
  const docs = await scraper.listDocuments();

  if (docs.length === 0) {
    console.log('\n⚠️  Nenhum documento encontrado!');
    console.log('Adicione arquivos .txt ou .md na pasta ./docs/');
    return;
  }

  console.log('\n🔄 Passo 3: Carregando na base de conhecimento...\n');
  await knowledgeBase.initialize();
  const loaded = await knowledgeBase.loadFromDirectory('./docs');

  console.log(`\n✅ Setup concluído! ${loaded} chunks carregados.\n`);
  
  const stats = await knowledgeBase.getStats();
  console.log('📊 Estatísticas:');
  console.log(`  - Documentos: ${stats.totalDocuments}`);
  console.log(`  - Coleção: ${stats.collectionName}`);
  
  console.log('\n💡 Teste no Telegram:');
  console.log('  /conhecimento O que é IA?');
  console.log('  /kb:stats');
}

main().catch(console.error);
