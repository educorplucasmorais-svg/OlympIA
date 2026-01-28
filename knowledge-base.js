// 🧠 Sistema de Base de Conhecimento com RAG (Retrieval Augmented Generation)
// Usa ChromaDB para busca vetorial e Groq para embeddings

import { ChromaClient } from 'chromadb';
import Groq from 'groq-sdk';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

class KnowledgeBase {
  constructor() {
    this.client = null;
    this.collection = null;
    this.initialized = false;
  }

  // Inicializar ChromaDB
  async initialize() {
    try {
      this.client = new ChromaClient();
      
      // Criar ou obter coleção
      try {
        this.collection = await this.client.getOrCreateCollection({
          name: 'olympia_knowledge',
          metadata: { description: 'Base de conhecimento OlympIA Bot' }
        });
      } catch {
        this.collection = await this.client.createCollection({
          name: 'olympia_knowledge'
        });
      }

      this.initialized = true;
      console.log('✅ Base de conhecimento inicializada!');
      return true;
    } catch (error) {
      console.error('❌ Erro ao inicializar ChromaDB:', error.message);
      console.log('💡 Instale: npm install chromadb');
      return false;
    }
  }

  // Gerar embeddings usando Groq (alternativa gratuita)
  async generateEmbedding(text) {
    try {
      // Usar Groq para gerar representação do texto
      const response = await groq.chat.completions.create({
        messages: [{
          role: 'system',
          content: 'Resuma este texto em 3-5 palavras-chave essenciais, separadas por vírgula:'
        }, {
          role: 'user',
          content: text
        }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 50
      });

      const keywords = response.choices[0]?.message?.content || text;
      
      // Criar embedding simples baseado em frequência de palavras
      const embedding = this.simpleEmbedding(text + ' ' + keywords);
      return embedding;
    } catch (error) {
      console.error('Erro ao gerar embedding:', error.message);
      return this.simpleEmbedding(text);
    }
  }

  // Embedding simples usando TF-IDF simplificado (384 dimensões)
  simpleEmbedding(text) {
    const normalized = text.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    
    const words = normalized.split(/\s+/);
    const embedding = new Array(384).fill(0);
    
    words.forEach((word, idx) => {
      for (let i = 0; i < word.length; i++) {
        const charCode = word.charCodeAt(i);
        const position = (charCode + i + idx) % 384;
        embedding[position] += 1 / (idx + 1);
      }
    });

    // Normalizar
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / (magnitude || 1));
  }

  // Adicionar documento à base de conhecimento
  async addDocument(content, metadata = {}) {
    if (!this.initialized) await this.initialize();
    if (!this.initialized) return false;

    try {
      const id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const embedding = await this.generateEmbedding(content);

      await this.collection.add({
        ids: [id],
        embeddings: [embedding],
        documents: [content],
        metadatas: [{ ...metadata, addedAt: new Date().toISOString() }]
      });

      console.log(`✅ Documento adicionado: ${id}`);
      return id;
    } catch (error) {
      console.error('❌ Erro ao adicionar documento:', error.message);
      return false;
    }
  }

  // Buscar documentos relevantes
  async search(query, topK = 3) {
    if (!this.initialized) await this.initialize();
    if (!this.initialized) return [];

    try {
      const queryEmbedding = await this.generateEmbedding(query);

      const results = await this.collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: topK
      });

      return results.documents[0] || [];
    } catch (error) {
      console.error('❌ Erro ao buscar:', error.message);
      return [];
    }
  }

  // Carregar documentos de uma pasta
  async loadFromDirectory(dirPath) {
    try {
      const files = await fs.readdir(dirPath);
      let loaded = 0;

      for (const file of files) {
        if (file.endsWith('.txt') || file.endsWith('.md')) {
          const filePath = path.join(dirPath, file);
          const content = await fs.readFile(filePath, 'utf-8');
          
          // Dividir em chunks de ~1000 caracteres
          const chunks = this.chunkText(content, 1000);
          
          for (const chunk of chunks) {
            await this.addDocument(chunk, { source: file });
            loaded++;
          }
        }
      }

      console.log(`✅ ${loaded} documentos carregados de ${dirPath}`);
      return loaded;
    } catch (error) {
      console.error('❌ Erro ao carregar documentos:', error.message);
      return 0;
    }
  }

  // Dividir texto em chunks
  chunkText(text, maxLength = 1000) {
    const sentences = text.split(/[.!?]\s+/);
    const chunks = [];
    let current = '';

    for (const sentence of sentences) {
      if ((current + sentence).length > maxLength && current) {
        chunks.push(current.trim());
        current = sentence;
      } else {
        current += (current ? '. ' : '') + sentence;
      }
    }

    if (current) chunks.push(current.trim());
    return chunks;
  }

  // Responder pergunta usando RAG
  async answerQuestion(question) {
    try {
      // 1. Buscar contexto relevante
      const relevantDocs = await this.search(question, 3);
      
      if (relevantDocs.length === 0) {
        return {
          answer: 'Não encontrei informações relevantes na base de conhecimento.',
          sources: []
        };
      }

      // 2. Criar prompt com contexto
      const context = relevantDocs.join('\n\n---\n\n');
      
      const response = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `Você é OlympIA, um assistente especializado. Use APENAS as informações fornecidas no contexto para responder. Se não houver informação suficiente, diga claramente.\n\nCONTEXTO:\n${context}`
          },
          {
            role: 'user',
            content: question
          }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.5,
        max_tokens: 500
      });

      const answer = response.choices[0]?.message?.content || 'Erro ao gerar resposta';

      return {
        answer,
        sources: relevantDocs,
        hasContext: true
      };
    } catch (error) {
      console.error('❌ Erro ao responder:', error.message);
      return {
        answer: `Erro: ${error.message}`,
        sources: [],
        hasContext: false
      };
    }
  }

  // Estatísticas da base
  async getStats() {
    if (!this.initialized) await this.initialize();
    if (!this.initialized) return null;

    try {
      const count = await this.collection.count();
      return {
        totalDocuments: count,
        collectionName: 'olympia_knowledge',
        initialized: this.initialized
      };
    } catch (error) {
      return { error: error.message };
    }
  }
}

// Exportar instância única
const knowledgeBase = new KnowledgeBase();

export default knowledgeBase;
export { KnowledgeBase };
