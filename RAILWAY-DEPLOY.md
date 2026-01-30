# 🚂 DEPLOY NO RAILWAY - GUIA COMPLETO

## 📋 PRÉ-REQUISITOS

1. **Conta no Railway:** https://railway.app
2. **Repositório no GitHub:** https://github.com/educorplucasmorais-svg/OlympIA
3. **Token do Telegram Bot** (obtenha em @BotFather)


## 🚀 PASSO A PASSO DO DEPLOY

### 1️⃣ **Acesse o Railway**

### 2️⃣ **Crie um Novo Projeto**

### 3️⃣ **Conecte seu Repositório**

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


## 📊 MONITORAMENTO

### **Logs em Tempo Real**

### **Status do Bot**


## 🛠️ RESOLUÇÃO DE PROBLEMAS

### **Erro: Build Falhando**

### **Erro: Bot não responde**

### **Erro: Variáveis não carregam**


## 💰 PLANOS E CUSTOS

### **Railway Starter (Grátis)**

### **Upgrade se necessário:**


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


## 🔗 LINKS ÚTEIS



**🎉 Após seguir estes passos, seu bot estará rodando 24/7 na nuvem!**