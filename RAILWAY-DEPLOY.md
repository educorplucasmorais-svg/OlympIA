# 🚂 DEPLOY NO RAILWAY - GUIA COMPLETO

## 📋 PRÉ-REQUISITOS

1. **Conta no Railway:** https://railway.app
2. **Repositório no GitHub:** https://github.com/educorplucasmorais-svg/OlympIA
3. **Token do Telegram Bot** (obtenha em @BotFather)

---

## 🚀 PASSO A PASSO DO DEPLOY

### 1️⃣ **Acesse o Railway**
- Vá para https://railway.app
- Faça login com sua conta (GitHub, Google, etc.)

### 2️⃣ **Crie um Novo Projeto**
- Clique em **"New Project"**
- Selecione **"Deploy from GitHub repo"**

### 3️⃣ **Conecte seu Repositório**
- Procure por: `OlympIA`
- Selecione o repositório: `educorplucasmorais-svg/OlympIA`
- Clique em **"Connect"**

### 4️⃣ **Configure as Variáveis de Ambiente**
Após o deploy inicial, vá para **"Variables"** no painel do projeto e adicione:

```
TELEGRAM_TOKEN=SEU_TOKEN_DO_BOTFATHER
ADMIN_CHAT_IDS=SEU_CHAT_ID_TELEGRAM
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=sua-senha-app-gmail
NODE_ENV=production
```

**Como obter o TELEGRAM_TOKEN:**
1. Abra o Telegram
2. Procure por @BotFather
3. Digite `/newbot`
4. Siga as instruções
5. Copie o token gerado

**Como obter seu CHAT_ID:**
1. Inicie uma conversa com @userinfobot
2. Ele responderá com seu Chat ID
3. Use esse ID nos ADMIN_CHAT_IDS

### 5️⃣ **Deploy Automático**
- O Railway fará o deploy automaticamente
- Aguarde a conclusão (pode levar 5-10 minutos)
- Verifique os logs em **"Deployments"**

---

## 🔧 CONFIGURAÇÕES TÉCNICAS

### **Arquivo `railway.json`** (já criado)
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run telegram",
    "healthcheckPath": "/",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### **Package.json Scripts** (já configurado)
- `npm run telegram` - Inicia o bot do Telegram
- Todas as dependências estão listadas

---

## 📊 MONITORAMENTO

### **Logs em Tempo Real**
- No painel do Railway, vá para **"Deployments"**
- Clique no deployment ativo
- Veja **"Logs"** para acompanhar o funcionamento

### **Status do Bot**
- Procure por: `🤖 Bot do Telegram iniciado!`
- Se aparecer: `✅ OlympIA está rodando!`
- Significa que está funcionando!

---

## 🛠️ RESOLUÇÃO DE PROBLEMAS

### **Erro: Build Falhando**
- Verifique se todas as dependências estão no `package.json`
- Certifique-se de que o Node.js é compatível (usa 18+)

### **Erro: Bot não responde**
- Verifique se o `TELEGRAM_TOKEN` está correto
- Teste o token localmente primeiro: `npm run telegram`

### **Erro: Variáveis não carregam**
- Reinicie o deployment após adicionar variáveis
- Vá em **"Settings"** > **"Restart Service"**

---

## 💰 PLANOS E CUSTOS

### **Railway Starter (Grátis)**
- 512MB RAM
- 1GB Storage
- 100h/mês
- Perfeito para bots pequenos

### **Upgrade se necessário:**
- Hobby: $5/mês (mais recursos)
- Pro: $10/mês (ainda mais recursos)

---

## 🎯 PRÓXIMOS PASSOS APÓS DEPLOY

1. **Teste o Bot:**
   - Envie `/start` no Telegram
   - Verifique se os cards aparecem corretamente

2. **Configure Webhooks (Opcional):**
   - Para melhor performance, configure webhooks
   - Railway fornece URL pública automática

3. **Monitoramento Contínuo:**
   - Configure alertas no Railway
   - Monitore logs regularmente

---

## 🔗 LINKS ÚTEIS

- **Railway Docs:** https://docs.railway.app/
- **Telegram Bot API:** https://core.telegram.org/bots/api
- **BotFather:** https://t.me/botfather

---

**🎉 Após seguir estes passos, seu bot estará rodando 24/7 na nuvem!**