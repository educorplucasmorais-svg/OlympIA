# 🤖 OlympIA Bot - Assistente IA para Telegram

Bot inteligente com **19 comandos**, IA conversacional, relatórios automatizados e base de conhecimento personalizada.

---

## 🚀 Início Rápido (3 minutos)

```bash
# 1. Instalar dependências
npm install

# 2. Configurar (ver seção Configuração)
# Editar .env com suas chaves

# 3. Iniciar bot
npm run telegram
```

**Pronto!** Envie `/start` no Telegram para começar.

---

## 📚 Documentação Principal

### 🎯 Para Começar
- **[COMO-USAR.md](docs/COMO-USAR.md)** - Guia completo de uso (todos os comandos)
- **[INSTALACAO.md](docs/INSTALACAO.md)** - Instalação detalhada passo a passo
- **[CONFIGURACAO.md](docs/CONFIGURACAO.md)** - Configurar variáveis de ambiente

### 👨‍💼 Para Administradores
- **[ADMIN-GUIA.md](docs/ADMIN-GUIA.md)** - Gerenciar admins e permissões
- **[RELATORIOS.md](docs/RELATORIOS.md)** - Sistema de relatórios PDF/Email/Banco
- **[CONHECIMENTO.md](docs/CONHECIMENTO.md)** - Base de conhecimento (RAG)

### 🛠️ Para Desenvolvedores
- **[ARQUITETURA.md](docs/ARQUITETURA.md)** - Estrutura do código
- **[API.md](docs/API.md)** - APIs e integrações
- **[TESTES.md](docs/TESTES.md)** - Como testar o bot

---

## ✨ Principais Funcionalidades

### 🤖 **Conversas Inteligentes**
Bot responde mensagens normais (não precisa usar `/comando`). Funciona como ChatGPT/Gemini:
```
Você: Olá, me ajuda com um email?
Bot: Claro! Qual é o assunto do email?
Você: Proposta comercial
Bot: [Gera email profissional]
```

### 📊 **Relatórios Automatizados**
Gera relatórios diários em PDF, envia por email ou salva no banco:
```
/relatorio → Bot faz 3 perguntas → Gera PDF personalizado
/relatorios → Lista últimos 10 relatórios
/relatorio-baixar 1 → Baixa PDF do banco
```

### 🧠 **Base de Conhecimento (RAG)**
Carregue seus documentos e bot responde com contexto:
```
/conhecimento Como usar IA em negócios?
→ Bot busca em seus documentos e responde
```

### 📱 **Marketing & Redes Sociais**
Estratégias de SEO e posts prontos:
```
/marketing → Dicas de SEO
/promocao → 5 posts para Instagram/Facebook
```

---

## 📋 Comandos Disponíveis (19 Total)

| Categoria | Comando | Descrição |
|-----------|---------|-----------|
| **🤖 IA & Criatividade** | `/gerar <texto>` | Geração criativa com IA |
| | `/analisar <texto>` | Análise profunda |
| | `/imagem <descrição>` | Gera imagens (DALL-E) |
| | `/traduzir <texto>` | Traduz para qualquer idioma |
| | `/conhecimento <pergunta>` | Busca na base |
| **📊 Relatórios** | `/relatorio` | Gera relatório (diálogo) |
| | `/relatorios` | Lista histórico |
| | `/relatorio-baixar <id>` | Baixa PDF |
| **📱 Marketing** | `/marketing` | Estratégia SEO |
| | `/promocao` | Posts prontos |
| **👨‍💼 Admin** | `/admin` | Painel administrativo |
| | `/meu-id` | Descobre seu Chat ID |
| | `/info` | Status do bot |
| **🏠 Automação** | `/casa` | Controle smart home |
| | `/clima` | Previsão do tempo |
| **📧 Comunicação** | `/email <texto>` | Escreve emails |
| | `/whatsapp <texto>` | Mensagens WhatsApp |
| **🔧 Utilidades** | `/ajuda` | Lista comandos |
| | `/start` | Menu inicial |

---

## ⚙️ Configuração

### 1. Criar Bot no Telegram
1. Fale com [@BotFather](https://t.me/BotFather)
2. Use `/newbot` e siga instruções
3. Copie o **token** recebido

### 2. Configurar `.env`
```env
# Bot do Telegram
TELEGRAM_TOKEN=seu_token_aqui

# Admins (IDs separados por vírgula)
ADMIN_CHAT_IDS=123456789,987654321

# IA (Groq - grátis)
GROQ_API_KEY=sua_chave_groq

# Email (opcional - para enviar relatórios)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu@email.com
SMTP_PASS=sua_senha
ADMIN_EMAIL=admin@email.com
```

### 3. Descobrir seu Chat ID
```bash
# Inicie o bot
npm run telegram

# No Telegram, envie:
/meu-id

# Bot responde: "Seu Chat ID é: 123456789"
# Adicione no .env em ADMIN_CHAT_IDS
```

---

## 🗂️ Estrutura do Projeto

```
Moltbot/
├── index.js                    # Bot principal
├── telegram-bot.js             # Lógica do Telegram
├── conversation-manager.js     # Sistema de diálogos
├── database.js                 # Banco SQLite
├── daily-report.js             # Geração de relatórios
├── knowledge-base.js           # Sistema RAG
├── home-automation.js          # Automação residencial
├── package.json                # Dependências
├── .env                        # Configuração (criar)
├── users.db                    # Banco de dados (auto-criado)
├── docs/                       # Documentação organizada
│   ├── COMO-USAR.md
│   ├── INSTALACAO.md
│   ├── CONFIGURACAO.md
│   ├── ADMIN-GUIA.md
│   ├── RELATORIOS.md
│   ├── CONHECIMENTO.md
│   ├── ARQUITETURA.md
│   ├── API.md
│   └── TESTES.md
└── knowledge/                  # Base de conhecimento (seus docs)
    └── (adicione seus .txt aqui)
```

---

## 🧪 Testar o Bot

### Teste Rápido (1 minuto)
```bash
# No Telegram
/start        # Menu inicial
Olá           # Mensagem normal (testa IA)
/relatorio    # Inicia diálogo
```

### Teste Completo
Ver documentação: [TESTES.md](docs/TESTES.md)

---

## 🔧 Troubleshooting

### Bot não responde
```bash
# Verificar se está rodando
ps aux | grep node

# Ver logs
node telegram-bot.js
```

### Erro de token
- Verifique se `.env` existe
- Confirme TELEGRAM_TOKEN correto
- Token deve começar com número (ex: `1234567890:ABC...`)

### Comandos de admin não funcionam
- Use `/meu-id` para descobrir seu Chat ID
- Adicione no `.env`: `ADMIN_CHAT_IDS=seu_id_aqui`
- Reinicie o bot

### Base de conhecimento não funciona
```bash
# Instalar dependência
npm install cheerio

# Setup inicial
npm run knowledge:setup
```

---

## 📊 Recursos do Sistema

### Performance
- ⚡ **Cache inteligente** - Respostas 100x mais rápidas
- 🔄 **Connection pool** - Reutiliza conexões MCP
- 🛡️ **Circuit breaker** - Proteção contra falhas
- ⏱️ **Timeouts** - Evita travamentos

### Segurança
- 🔐 **Controle de admin** - Apenas IDs autorizados
- 💾 **Backup automático** - Banco salvo periodicamente
- 🏥 **Health monitor** - Monitora saúde do bot 24/7
- 📝 **Logs** - Rastreamento de comandos

### Integrações
- 🤖 **Groq AI** - IA gratuita e rápida
- 📧 **SMTP** - Envio de emails
- 🏠 **Home Assistant** - Automação residencial
- 📱 **WhatsApp** - Integração planejada

---

## 🆘 Suporte

### Documentação Detalhada
- [Como Usar](docs/COMO-USAR.md) - Guia completo
- [Instalação](docs/INSTALACAO.md) - Setup detalhado
- [Admin](docs/ADMIN-GUIA.md) - Gerenciar bot
- [Relatórios](docs/RELATORIOS.md) - Sistema de relatórios
- [Conhecimento](docs/CONHECIMENTO.md) - Base RAG
- [Testes](docs/TESTES.md) - Testar funcionalidades

### Issues
- Abra uma issue no GitHub (se aplicável)
- Descreva o erro e inclua logs

---

## 📝 Licença

MIT License - Livre para uso pessoal e comercial

---

## 🎯 Próximos Passos

Após instalação:
1. ✅ Envie `/start` no Telegram
2. ✅ Teste mensagem normal: "Olá"
3. ✅ Teste comando: `/relatorio`
4. ✅ Configure admins (ver [ADMIN-GUIA.md](docs/ADMIN-GUIA.md))
5. ✅ Adicione documentos em `knowledge/` (ver [CONHECIMENTO.md](docs/CONHECIMENTO.md))

**Dúvidas?** Consulte [COMO-USAR.md](docs/COMO-USAR.md) para guia completo.

---

**Status:** 🟢 Sistema 100% funcional e testado

**Versão:** 3.0 (Janeiro 2026)

**Última atualização:** 28/01/2026
