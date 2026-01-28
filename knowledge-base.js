// 🧠 Sistema de Base de Conhecimento com RAG (Retrieval Augmented Generation)
// Versão simplificada SEM ChromaDB - usa busca em memória

import Groq from 'groq-sdk';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

class KnowledgeBase {
  constructor() {
    this.documents = []; // Array de { id, content, embedding, metadata }
    this.initialized = false;
  }

  // Inicializar base em memória
  async initialize() {
    try {
      this.initialized = true;
      console.log('✅ Base de conhecimento inicializada (modo in-memory)!');
      return true;
    } catch (error) {
      console.error('❌ Erro ao inicializar:', error.message);
      return false;
    }
  }

  // Gerar embeddings usando método simplificado (sem Groq para evitar limites)
  async generateEmbedding(text) {
    // Usar embedding simples sem chamar API (mais rápido e sem limites)
    return this.simpleEmbedding(text);
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

      this.documents.push({
        id,
        content,
        embedding,
        metadata: { ...metadata, addedAt: new Date().toISOString() }
      });

      return id;
    } catch (error) {
      console.error('❌ Erro ao adicionar documento:', error.message);
      return false;
    }
  }

  // Buscar documentos relevantes (busca por similaridade de cosseno)
  async search(query, topK = 3) {
    if (!this.initialized) await this.initialize();
    if (!this.initialized || this.documents.length === 0) return [];

    try {
      const queryEmbedding = await this.generateEmbedding(query);

      // Calcular similaridade de cosseno com todos os documentos
      const similarities = this.documents.map(doc => ({
        content: doc.content,
        similarity: this.cosineSimilarity(queryEmbedding, doc.embedding),
        metadata: doc.metadata
      }));

      // Ordenar por similaridade (maior primeiro)
      similarities.sort((a, b) => b.similarity - a.similarity);

      // Retornar top K
      return similarities.slice(0, topK).map(s => s.content);
    } catch (error) {
      console.error('❌ Erro ao buscar:', error.message);
      return [];
    }
  }

  // Calcular similaridade de cosseno entre dois vetores
  cosineSimilarity(vec1, vec2) {
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }

    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);

    if (mag1 === 0 || mag2 === 0) return 0;
    return dotProduct / (mag1 * mag2);
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
          
          // Dividir em chunks de ~500 caracteres (menor para evitar limite de tokens)
          const chunks = this.chunkText(content, 500);
          
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
  chunkText(text, maxLength = 500) {
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
    return chunks.filter(c => c.length > 50); // Ignorar chunks muito pequenos
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

    return {
      totalDocuments: this.documents.length,
      collectionName: 'olympia_knowledge_memory',
      initialized: this.initialized,
      storageType: 'In-Memory (No ChromaDB needed)'
    };
  }
}

// Exportar instância única
const knowledgeBase = new KnowledgeBase();

export default knowledgeBase;
export { KnowledgeBase };
