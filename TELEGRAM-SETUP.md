# 🤖 Como Criar seu Bot do Telegram

## Passo 1: Criar Bot no BotFather

1. Abra o Telegram no celular ou computador
2. Procure por: **@BotFather** (é o bot oficial do Telegram)
3. Inicie uma conversa e envie: `/newbot`
4. O BotFather vai pedir:
   - **Nome do bot** (ex: "Moltbot Assistant")
   - **Username do bot** (precisa terminar com 'bot', ex: "moltbot_assistant_bot")

5. Você vai receber uma mensagem assim:
```
Done! Congratulations on your new bot. You will find it at t.me/seu_bot_aqui

Use this token to access the HTTP API:
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz1234567
```

⚠️ **ESSE TOKEN É SECRETO! Não compartilhe!**

## Passo 2: Configurar o Token

1. Copie o token que o BotFather enviou
2. Abra o arquivo `telegram-bot.js`
3. Na linha 6, substitua:
```javascript
const TELEGRAM_TOKEN = '8269791183:AAEaZqnaZhmaZvviYPOYhuXmLDioJVwuCsE';
```
Por:
```javascript
const TELEGRAM_TOKEN = '1234567890:ABCdefGHIjklMNOpqrsTUVwxyz1234567';
```

## Passo 3: Iniciar o Bot

No terminal, execute:
```bash
npm run telegram
```

## Passo 4: Testar o Bot

1. No Telegram, procure pelo username do seu bot (ex: @moltbot_assistant_bot)
2. Clique em "Start" ou envie `/start`
3. Teste os comandos:
   - `/gerar Escreva uma história sobre um robô`
   - `/analisar Este texto precisa de análise`
   - `/keywords inteligência artificial machine learning`
   - `/skills` - Ver todas as 34 skills

## 📱 Comandos Disponíveis

### IA & Criatividade
- `/gerar <texto>` - Gerar conteúdo com IA
- `/analisar <texto>` - Analisar texto
- `/keywords <texto>` - Extrair palavras-chave
- `/chat <mensagem>` - Chat com memória de contexto

### Utilidades
- `/traduzir <idioma> <texto>` - Traduzir para idioma
- `/senha [tamanho]` - Gerar senha segura
- `/morse <texto>` - Converter para Morse
- `/noticias <assunto>` - Buscar notícias
- `/falar <texto>` - Converter texto em áudio
- `/ocr` - Extrair texto de foto
- `/email <dest|assunto|corpo>` - Enviar email
- `/lembrete <msg> <tempo>` - Agendar lembrete
- `/pdf <título>` - Gerar documento PDF

### Casa Inteligente (Home Assistant)
- `/casastatus` - Ver todos os dispositivos
- `/casa ligar <sala>` - Ligar luz
- `/casa desligar <sala>` - Desligar luz
- `/casa cena <nome>` - Ativar cena
- `/casa volume <speaker> <0-100>` - Ajustar som
- `/casaajuda` - Ver ajuda de casa inteligente

### Google Workspace (Novo!)
- `/agenda` - Ver próximos 5 eventos do calendário
- `/evento <título> <hora>` - Criar evento
- `/gchat <mensagem>` - Enviar para Google Chat
- `/workspace` - Ver status das integrações

### Sistema
- `/skills` - Listar todas as skills
- `/start` - Iniciar bot
- `/ajuda` - Mostrar ajuda completa

Você também pode enviar mensagens diretas sem comando!

## ✅ Vantagens do Telegram

- ✨ **Grátis** - Sem custos
- 🚀 **Confiável** - Funciona perfeitamente
- 📱 **Multiplataforma** - Celular, web, desktop
- 🔒 **Seguro** - Criptografia nativa
- ⚡ **Rápido** - Respostas instantâneas
- 🤖 **API Oficial** - Suporte completo

## 🆘 Problemas?

1. **"Error: ETELEGRAM: 404 Not Found"**
   - Token inválido. Verifique se copiou corretamente do BotFather

2. **"Error: Unauthorized"**
   - Token errado. Pegue um novo token com `/newbot` no BotFather

3. **Bot não responde**
   - Certifique-se que executou `npm run telegram`
   - Verifique se o index.js está rodando (servidor MCP)

## 🎉 Pronto!

Seu bot está funcionando! Agora você pode:
- Enviar mensagens do Telegram
- Receber respostas com IA (Groq Llama 3.3)
- Usar 20 comandos diferentes
- Compartilhar o bot com amigos (opcional)

## 🏠 Próximos: Casa Inteligente + Google Workspace

Quer mais integrações?

📖 [SMART-HOME-SETUP.md](SMART-HOME-SETUP.md) - Home Assistant para controlar dispositivos IoT

📖 [GOOGLE-WORKSPACE-SETUP.md](GOOGLE-WORKSPACE-SETUP.md) - Gmail, Calendar, Google Chat
