# 🚀 GUIA: Manter OlympIA Bot Rodando 24/7

## ✅ SOLUÇÃO ATUAL: PM2 (Recomendado)

### Comandos Essenciais:
```bash
# Iniciar bot
pm2 start ecosystem.config.json

# Ver status
pm2 list

# Ver logs
pm2 logs olympia-telegram

# Parar bot
pm2 stop olympia-telegram

# Reiniciar bot
pm2 restart olympia-telegram

# Salvar configuração (para sobreviver reinicializações)
pm2 save
```

### Scripts de Atalho (Windows):
- `start-bot.bat` - Inicia o bot
- `stop-bot.bat` - Para o bot

## 🌐 OPÇÕES DE DEPLOY PARA 24/7


### 1️⃣ **Serviços Cloud Gratuitos (Recomendado)**
- **Render** (https://render.com) - 750h/mês grátis
- **Fly.io** (https://fly.io) - 3 apps grátis
- **Heroku** (https://heroku.com) - 550h/mês grátis

> Railway não é mais suportado neste projeto.

### 2️⃣ **VPS Baratos**
- **DigitalOcean** - $6/mês
- **Linode** - $5/mês
- **Vultr** - $2.50/mês

### 3️⃣ **Configuração Docker**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["npm", "run", "telegram"]
```

## 🔧 RESOLUÇÃO DE ERROS

### Erro 409 Conflict (Polling)
**Sintomas:** "terminated by other getUpdates request"
**Solução:**
1. Pare todas as instâncias: `pm2 stop all && pm2 delete all`
2. Aguarde 30 segundos
3. Reinicie: `pm2 start ecosystem.config.json`

### TOKEN do Telegram
Certifique-se de ter o `.env` configurado:
```
TELEGRAM_TOKEN=seu_token_aqui
```

## 📊 MONITORAMENTO

### Comandos PM2:
```bash
# Monitor em tempo real
pm2 monit

# Status detalhado
pm2 show olympia-telegram

# Uso de recursos
pm2 list
```

## 🔄 AUTOMAÇÃO NO WINDOWS

### Agendador de Tarefas:
1. Win + R → `taskschd.msc`
2. Criar tarefa básica
3. Programa: `C:\Users\[SEU_USER]\Desktop\Moltbot\start-bot.bat`
4. Agendar para inicialização do sistema

## 📱 TESTANDO O BOT

Após iniciar, envie `/start` no seu bot do Telegram para testar os cards atualizados!

---
**Status:** ✅ Bot configurado com PM2 | ✅ Cards atualizados | ✅ Pronto para 24/7