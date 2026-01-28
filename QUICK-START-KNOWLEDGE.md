# 🚀 Setup da Base de Conhecimento - Guia Rápido

## Passo 1: Instalar Dependências

```bash
npm install chromadb cheerio
```

## Passo 2: Adicionar Seus Documentos

### Opção A: Baixar do Google Docs (Automático)

```bash
node setup-knowledge.js
```

O script tentará baixar automaticamente de:
- https://docs.google.com/document/d/1Ohejh00uIBrjxRmAOX7hiyKd7JEHj6rfuPioqYvaVhw/edit?tab=t.0
- https://notebooklm.google.com/notebook/3273950e-ecf0-4147-873b-abea72bc0acf

### Opção B: Adicionar Manualmente

1. **Google Docs**:
   - Abra seu documento
   - Arquivo → Fazer download → Texto sem formatação (.txt)
   - Salve em `./docs/meu-documento.txt`

2. **NotebookLM** (requer login):
   - Acesse o notebook
   - Copie todo o conteúdo
   - Cole em `./docs/notebooklm.txt`

3. **Seus próprios arquivos**:
   - Crie arquivo `.txt` ou `.md`
   - Salve em `./docs/`

## Passo 3: Carregar na Base

```bash
npm run knowledge:load
```

Ou execute o setup completo:

```bash
npm run knowledge:setup
```

## Passo 4: Testar

```bash
# Testar localmente
node test-knowledge.js

# Ver estatísticas
npm run knowledge:stats

# Iniciar bot
npm run telegram
```

## Passo 5: Usar no Telegram

```
/conhecimento O que é IA?
/conhecimento Como usar RAG?
/kb:stats
```

## ✅ Verificação

Se tudo funcionou, você verá:

```
✅ Base de conhecimento inicializada!
✅ X documentos carregados de ./docs
📊 Stats: { totalDocuments: X, ... }
```

## 🐛 Problemas Comuns

### Erro: chromadb não encontrado
```bash
npm install chromadb
```

### Erro: Permissão negada no Google Docs
Use o método manual (download → .txt)

### Erro: Nenhum documento encontrado
```bash
# Verificar pasta
ls docs/

# Criar exemplo
echo "Meu conhecimento aqui" > docs/teste.txt
npm run knowledge:load
```

## 📚 Próximos Passos

1. Adicione mais documentos em `./docs/`
2. Teste perguntas específicas
3. Ajuste parâmetros em `knowledge-base.js`
4. Integre com outros comandos do bot

## 💡 Dicas

- **Documentos menores** = Busca mais precisa
- **Use Markdown** para formatação
- **Divida por tópicos** para melhor organização
- **Atualize regularmente** para manter bot atual

---

**Pronto! Seu bot agora tem memória inteligente! 🧠**
