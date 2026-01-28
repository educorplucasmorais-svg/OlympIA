// 📥 Scraper para Google Docs e extração de conhecimento
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';

class DocScraper {
  constructor() {
    this.baseDir = './docs';
  }

  // Extrair ID do documento do Google Docs
  extractDocId(url) {
    const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }

  // Baixar Google Doc como texto
  async downloadGoogleDoc(url) {
    try {
      const docId = this.extractDocId(url);
      if (!docId) throw new Error('URL do Google Docs inválida');

      // Usar API pública de exportação do Google Docs
      const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
      
      console.log(`📥 Baixando documento: ${docId}...`);
      
      const response = await axios.get(exportUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 30000
      });

      const content = response.data;
      
      // Salvar localmente
      const fileName = `google_doc_${docId}.txt`;
      const filePath = path.join(this.baseDir, fileName);
      
      await fs.mkdir(this.baseDir, { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');

      console.log(`✅ Documento salvo: ${filePath}`);
      console.log(`📊 Tamanho: ${content.length} caracteres`);

      return {
        success: true,
        content,
        filePath,
        docId
      };
    } catch (error) {
      console.error('❌ Erro ao baixar:', error.message);
      
      // Fallback: instruções manuais
      return {
        success: false,
        error: error.message,
        instructions: `
❌ Não foi possível baixar automaticamente.

🔧 SOLUÇÃO MANUAL:
1. Abra: ${url}
2. Clique em: Arquivo → Fazer download → Texto sem formatação (.txt)
3. Salve em: ${path.join(this.baseDir, 'manual.txt')}
4. Execute: npm run knowledge:load
        `
      };
    }
  }

  // Extrair informações do NotebookLM (via scraping)
  async scrapeNotebookLM(url) {
    try {
      console.log('📚 Tentando acessar NotebookLM...');
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Tentar extrair título e conteúdo
      const title = $('title').text();
      const content = $('body').text().trim();

      if (content.length > 100) {
        const fileName = 'notebooklm_content.txt';
        const filePath = path.join(this.baseDir, fileName);
        
        await fs.writeFile(filePath, content, 'utf-8');
        
        console.log(`✅ NotebookLM salvo: ${filePath}`);
        
        return {
          success: true,
          content,
          filePath,
          title
        };
      }

      throw new Error('Conteúdo não encontrado');
    } catch (error) {
      console.error('❌ NotebookLM requer autenticação');
      
      return {
        success: false,
        error: error.message,
        instructions: `
❌ NotebookLM requer login do Google.

🔧 SOLUÇÃO MANUAL:
1. Acesse: ${url}
2. Faça login na sua conta Google
3. Copie todo o texto do notebook
4. Cole em: ${path.join(this.baseDir, 'notebooklm.txt')}
5. Execute: npm run knowledge:load
        `
      };
    }
  }

  // Processar múltiplas URLs
  async processUrls(urls) {
    const results = [];

    for (const url of urls) {
      if (url.includes('docs.google.com/document')) {
        results.push(await this.downloadGoogleDoc(url));
      } else if (url.includes('notebooklm.google.com')) {
        results.push(await this.scrapeNotebookLM(url));
      } else {
        results.push({
          success: false,
          error: 'URL não suportada',
          url
        });
      }
    }

    return results;
  }

  // Listar documentos baixados
  async listDocuments() {
    try {
      const files = await fs.readdir(this.baseDir);
      const txtFiles = files.filter(f => f.endsWith('.txt') || f.endsWith('.md'));
      
      console.log(`\n📚 Documentos disponíveis (${txtFiles.length}):`);
      
      for (const file of txtFiles) {
        const filePath = path.join(this.baseDir, file);
        const stats = await fs.stat(filePath);
        const content = await fs.readFile(filePath, 'utf-8');
        
        console.log(`  - ${file}`);
        console.log(`    Tamanho: ${stats.size} bytes`);
        console.log(`    Caracteres: ${content.length}`);
        console.log(`    Modificado: ${stats.mtime.toLocaleString('pt-BR')}`);
      }

      return txtFiles;
    } catch (error) {
      console.error('Erro ao listar:', error.message);
      return [];
    }
  }
}

export default DocScraper;
