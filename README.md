# 🤖 OlympIA - Bot de Automacao IA para Telegram

Bot de Telegram com **15 comandos** de IA e automacao, **100% gratuito** usando APIs livres e open-source.

## 🚀 Instalacao Rapida

```bash
npm install
npm run telegram
```

## 📋 Comandos Disponiveis (15 Total)

### 🧠 **Inteligencia Artificial & Criatividade** (5 comandos)
| Comando | Descricao | Exemplo |
|---------|-----------|---------|
| `/gerar <texto>` | Geracao criativa com Groq AI | `/gerar um poema sobre tecnologia` |
| `/analisar <texto>` | Analise profunda com IA | `/analisar Este texto e importante` |
| `/keywords <texto>` | Extrai palavras-chave SEO | `/keywords marketing digital online` |
| `/imagem <descricao>` | Gera imagem 1024x1024px | `/imagem uma montanha ao por do sol` |
| `/chat <mensagem>` | Chat com memoria de contexto | `/chat Como voce esta?` |

### 🛠️ **Utilidades & Ferramentas** (9 comandos)
| Comando | Descricao | Exemplo |
|---------|-----------|---------|
| `/traduzir <idioma> <texto>` | Traduz para qualquer idioma | `/traduzir en Ola mundo` |
| `/senha [tamanho]` | Gera senha segura (8-128 chars) | `/senha 20` |
| `/morse <texto>` | Converte para codigo Morse | `/morse SOS` |
| `/noticias <assunto>` | Busca noticias em tempo real | `/noticias tecnologia` |
| `/falar <texto>` | Converte texto em audio MP3 | `/falar Bem-vindo ao bot` |
| `/ocr` | Extrai texto de imagens (foto) | `/ocr [enviar foto]` |
| `/email <dest\|assunto\|corpo>` | Envia email via Gmail | `/email user@gmail.com\|Oi\|Teste` |
| `/lembrete <msg> <tempo>` | Agenda lembretes (m/h/d) | `/lembrete estudar 2h` |
| `/grafico` | Framework para graficos | [Em desenvolvimento] |

### 📱 **Pesquisa & Comunicacao** (3 comandos)
| Comando | Descricao |
|---------|-----------|
| `/google <busca>` | Pesquisa no Google, retorna links |
| `/start` | Inicia o bot e mostra menu |
| `/ajuda` | Mostra guia completo de uso |

### 📊 **Info & Sistema** (2 comandos)
| Comando | Descricao |
|---------|-----------|
| `/skills` | Lista as 34 skills de IA disponiveis |
| **Mensagem comum** | Qualquer texto e processado por IA |

---

## 🎯 Exemplos de Uso

### Gerar conteudo criativo
```
Você: /gerar Uma receita de bolo de chocolate
Bot: ✨ Resultado: [recebe receita completa]
```

### Traduzir texto
```
Você: /traduzir es Hello world
Bot: 🌍 Traducao: Hola mundo
```

### Gerar senha segura
```
Você: /senha 25
Bot: [Gera 25 caracteres aleatorios com simbolos]
```

### Chat com memoria
```
Você: /chat Meu nome e Joao
Bot: [Armazena em memoria]
Você: /chat Como se chama o meu amigo?
Bot: [Responde baseado na conversa anterior]
```

### Converter para Morse
```
Você: /morse HELP
Bot: .... . .-.. .--.
```

### Agendar lembretes
```
Você: /lembrete estudar fisica 3h
Bot: Lembrete agendado para 3 horas
[Apos 3h: "Lembrete: estudar fisica"]
```

---

## 🔧 Configuracao

### Bot do Telegram
Edite `TELEGRAM_TOKEN` em telegram-bot.js:
```javascript
const TELEGRAM_TOKEN = '8426049953:AAEuswuXhwEp-JUJNNYNwos8qd69Df4egeI';
```

### Email (Gmail)
Edite `EMAIL_CONFIG` em telegram-bot.js:
```javascript
const EMAIL_CONFIG = {
  user: 'seu-email@gmail.com',
  pass: 'sua-senha-de-app-gmail'  // Nao e a senha normal!
};
```

**Como gerar senha de app no Gmail:**
1. Acesse: https://myaccount.google.com/security
2. Ative autenticacao em 2 fatores
3. Va em "Senhas de app" e crie uma para "Mail"
4. Use essa senha no config acima

### MCP Server (Claude Desktop - Opcional)
Adicione ao `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "olympia": {
      "command": "node",
      "args": ["C:\\Users\\Pichau\\Desktop\\Moltbot\\index.js"]
    }
  }
}
```

---

## 🌐 APIs Utilizadas (Todas Gratuitas)

| Servico | Uso | Link |
|---------|-----|------|
| **Groq AI** | LLM Llama 3.3 70B | https://groq.com |
| **Pollinations.ai** | Geracao de imagens | https://pollinations.ai |
| **google-translate-api-x** | Traducao multilingue | npm package |
| **gTTS** | Sintese de voz | npm package |
| **Tesseract.js** | OCR de imagens | npm package |
| **NewsAPI** | Busca de noticias | https://newsapi.org |
| **Google Search** | Pesquisa web | Links diretos |
| **Gmail/Nodemailer** | Envio de emails | Via SMTP |

---

## 📚 Documentacao Adicional

- TELEGRAM-SETUP.md - Criar um novo bot do Telegram
- EMAIL-SETUP.md - Configurar Gmail para envios
- FACESWAP-SETUP.md - Configurar face swap (opcional)

---

## 📦 Dependencias Principais

```json
{
  "@modelcontextprotocol/sdk": "v1.25.3",
  "node-telegram-bot-api": "v0.67.0",
  "groq-sdk": "latest",
  "nodemailer": "latest",
  "google-translate-api-x": "latest",
  "gtts": "latest",
  "tesseract.js": "latest",
  "axios": "latest",
  "chart.js": "latest"
}
```

---

## 💡 Recursos Destacados

✅ **15 comandos prontos para usar**
✅ **Chat com memoria de conversas**
✅ **Geracao de imagens IA**
✅ **Traducao em 100+ idiomas**
✅ **Sintese de voz (TTS)**
✅ **OCR para extrair texto de fotos**
✅ **Envio automatico de emails**
✅ **Lembretes agendados**
✅ **100% gratuito e sem limites**
✅ **Codigo aberto e customizavel**

---

## ⚡ Inicio Rapido

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar token do Telegram (BotFather)
# Editar TELEGRAM_TOKEN em telegram-bot.js

# 3. Iniciar o bot
npm run telegram

# 4. Abrir seu bot no Telegram
# Procure por @SEU_BOT_NAME e envie /start
```

---

## 📞 Suporte

Para problemas ou duvidas:
- Verifique os logs no terminal (npm run telegram)
- Revise a configuracao em telegram-bot.js
- Consulte TELEGRAM-SETUP.md

---

**Made with ❤️ - OlympIA Bot v1.0**
