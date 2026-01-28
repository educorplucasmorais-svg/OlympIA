# 🧠 Base de Conhecimento com IA - OlympIA Bot

Sistema RAG (Retrieval Augmented Generation) para tornar o bot **ultra-responsivo** com contexto personalizado.

## 🎯 O que é?

Transforma seu bot em um **especialista** usando seus próprios documentos:
- 📚 Carrega documentos do Google Docs/NotebookLM
- 🔍 Busca semântica usando embeddings
- 🧠 Responde perguntas com **contexto real**
- ⚡ ChromaDB para busca vetorial ultra-rápida

## 🚀 Setup Rápido

### 1. Instalar Dependências

```bash
npm install chromadb cheerio
```

### 2. Configurar Base

```bash
# Baixar e processar seus documentos
node setup-knowledge.js
```

### 3. Usar no Telegram

```
/conhecimento Como usar IA em negócios?
/conhecimento Explique RAG
/kb:stats
```

## 📂 Estrutura

```
Moltbot/
├── knowledge-base.js      # Motor RAG com ChromaDB
├── doc-scraper.js         # Scraper Google Docs
├── setup-knowledge.js     # Script de setup
├── docs/                  # Seus documentos (.txt, .md)
│   ├── google_doc_XXX.txt
│   └── notebooklm.txt
├── embeddings/            # Cache de embeddings
└── knowledge/             # Dados da base vetorial
```

## 🔧 Como Funciona

### 1. **Extração de Documentos**
```javascript
import DocScraper from './doc-scraper.js';
const scraper = new DocScraper();

// Baixa do Google Docs
await scraper.downloadGoogleDoc('URL_AQUI');
```

### 2. **Carregar na Base**
```javascript
import knowledgeBase from './knowledge-base.js';

// Inicializa ChromaDB
await knowledgeBase.initialize();

// Carrega documentos
await knowledgeBase.loadFromDirectory('./docs');
```

### 3. **Buscar & Responder**
```javascript
// Busca com RAG
const result = await knowledgeBase.answerQuestion('O que é IA?');
console.log(result.answer);
console.log(result.sources); // Documentos usados
```

## 📥 Adicionar Documentos

### Via Google Docs (Automático)

```javascript
const urls = [
  'https://docs.google.com/document/d/SEU_ID/edit'
];

const results = await scraper.processUrls(urls);
```

### Manual

1. Crie arquivo em `./docs/meu-doc.txt`
2. Execute: `node setup-knowledge.js`
3. Pronto! 🎉

### NotebookLM (Requer Login)

Como NotebookLM precisa de autenticação Google:

1. Acesse: https://notebooklm.google.com/notebook/SEU_ID
2. Faça login
3. Copie todo o conteúdo
4. Cole em `./docs/notebooklm.txt`
5. Execute: `node setup-knowledge.js`

## 🧪 Testar Localmente

```javascript
// Testar busca
import knowledgeBase from './knowledge-base.js';

await knowledgeBase.initialize();
const docs = await knowledgeBase.search('inteligência artificial', 3);
console.log(docs);

// Testar RAG completo
const result = await knowledgeBase.answerQuestion('Como usar IA?');
console.log(result.answer);
console.log(result.sources);
```

## 🎨 Comandos do Bot

| Comando | Descrição |
|---------|-----------|
| `/conhecimento <pergunta>` | Busca na base de conhecimento |
| `/kb:stats` | Mostra estatísticas da base |

## 🔥 Casos de Uso

### 1. **Suporte Técnico**
```
Documentos: Manuais, FAQs, troubleshooting
Pergunta: "Como resolver erro X?"
Bot: Responde baseado nos manuais
```

### 2. **Treinamento**
```
Documentos: Cursos, tutoriais, apostilas
Pergunta: "Explique conceito Y"
Bot: Ensina baseado no material
```

### 3. **Pesquisa**
```
Documentos: Papers, artigos, estudos
Pergunta: "O que dizem sobre Z?"
Bot: Sintetiza informações dos papers
```

## ⚙️ Configuração Avançada

### Ajustar Chunk Size
```javascript
// Em knowledge-base.js, linha ~170
const chunks = this.chunkText(content, 1500); // Aumentar para 1500
```

### Mais Resultados
```javascript
// Em knowledge-base.js, linha ~134
const relevantDocs = await this.search(question, 5); // Buscar 5
```

### Temperatura IA
```javascript
// Em knowledge-base.js, linha ~208
temperature: 0.3, // Mais criativo: 0.7, Mais preciso: 0.2
```

## 📊 Monitoramento

```bash
# Ver estatísticas
node -e "import('./knowledge-base.js').then(async kb => {
  await kb.default.initialize();
  const stats = await kb.default.getStats();
  console.log(stats);
})"
```

## 🐛 Troubleshooting

### Erro: ChromaDB não instalado
```bash
npm install chromadb
```

### Erro: Google Docs bloqueado
- Use método manual (exportar como .txt)
- Ou configure permissões do documento como "público"

### Erro: Nenhum documento encontrado
```bash
# Verificar pasta
ls docs/

# Adicionar manualmente
echo "Seu conteúdo aqui" > docs/manual.txt
node setup-knowledge.js
```

## 🚀 Próximos Passos

1. ✅ Adicione mais documentos em `./docs/`
2. ✅ Teste perguntas com `/conhecimento`
3. ✅ Ajuste parâmetros conforme necessário
4. ✅ Integre com outros comandos do bot

## 💡 Dicas

- **Documentos maiores** = Respostas mais ricas
- **Divida por tópicos** = Busca mais precisa
- **Atualize regularmente** = Bot sempre atual
- **Use Markdown** = Formatação melhor

## 🔗 Links Úteis

- [ChromaDB Docs](https://docs.trychroma.com/)
- [Groq AI](https://console.groq.com/)
- [RAG Explained](https://www.pinecone.io/learn/retrieval-augmented-generation/)

## 📝 Exemplo Completo

```javascript
// 1. Setup inicial
import knowledgeBase from './knowledge-base.js';
import DocScraper from './doc-scraper.js';

// 2. Baixar docs
const scraper = new DocScraper();
await scraper.downloadGoogleDoc('URL');

// 3. Carregar
await knowledgeBase.initialize();
await knowledgeBase.loadFromDirectory('./docs');

// 4. Usar
const result = await knowledgeBase.answerQuestion('Sua pergunta');
console.log(result.answer);
```

---

**Agora seu bot é um especialista! 🎓**
