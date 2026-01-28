#!/usr/bin/env node
// 🧪 Teste rápido da base de conhecimento
import knowledgeBase from './knowledge-base.js';

async function test() {
  console.log('🧪 Testando Base de Conhecimento\n');

  // 1. Inicializar
  console.log('1️⃣ Inicializando...');
  await knowledgeBase.initialize();

  // 2. Carregar documentos
  console.log('2️⃣ Carregando documentos de ./docs/...');
  const loaded = await knowledgeBase.loadFromDirectory('./docs');
  console.log(`   ✅ ${loaded} chunks carregados\n`);

  // 3. Testar buscas
  const queries = [
    'O que é RAG?',
    'Como funcionam embeddings?',
    'Quais são os principais LLMs?'
  ];

  for (const query of queries) {
    console.log(`❓ Pergunta: ${query}`);
    const result = await knowledgeBase.answerQuestion(query);
    console.log(`✅ Resposta: ${result.answer.substring(0, 150)}...`);
    console.log(`📚 Fontes: ${result.sources?.length || 0} documento(s)\n`);
  }

  // 4. Estatísticas
  const stats = await knowledgeBase.getStats();
  console.log('📊 Estatísticas finais:');
  console.log(`   - Total de documentos: ${stats.totalDocuments}`);
  console.log(`   - Coleção: ${stats.collectionName}`);
  console.log(`   - Status: ${stats.initialized ? '✅ Inicializada' : '❌ Erro'}`);
}

test().catch(console.error);
