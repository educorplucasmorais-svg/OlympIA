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
- Aguarde alguns minutos para a conclusão

### 6️⃣ **Verifique o Status**
- Vá para a aba **"Deployments"**
- Aguarde até aparecer **"SUCCESS"**
- Seu bot estará rodando 24/7!

---

## 🔧 CONFIGURAÇÕES ADICIONAIS

### **Health Check**
O bot inclui monitoramento automático:
- ✅ Verificação a cada 1 minuto
- 🚨 Alerta após 3 falhas
- 📊 Relatórios automáticos diários

### **Banco de Dados**
- SQLite local (não requer configuração adicional)
- Backup automático nos logs diários

### **Segurança**
- Sistema de admin com chat IDs autorizados
- Logs de auditoria completos
- Proteção contra conflitos de polling

---

## 📊 MONITORAMENTO

### **Logs em Tempo Real**
- Acesse **"Deployments"** > **"View Logs"**
- Veja todas as atividades do bot
- Monitore erros e conexões

### **Métricas**
- Número de usuários ativos
- Uptime do bot
- Status das conexões MCP

---

## 🛠️ TROUBLESHOOTING

### **Bot não responde?**
1. Verifique se o `TELEGRAM_TOKEN` está correto
2. Confirme se o bot não está rodando localmente
3. Reinicie o deployment no Railway

### **Erro 409 (Conflict)?**
- Só uma instância do bot pode rodar por vez
- Pare qualquer instância local antes do deploy

### **Deploy falhando?**
- Verifique os logs de build
- Confirme se todas as dependências estão no package.json

---

## 🎉 PRONTO!

Seu bot OlympIA estará rodando 24/7 no Railway com:
- 🤖 Interface Telegram moderna com inline keyboards
- 📚 Base de conhecimento integrada
- 👑 Painel administrativo completo
- 📊 Relatórios automáticos
- 🏥 Monitoramento de saúde

**Teste seu bot:** Envie `/start` no Telegram!</content>
<parameter name="filePath">c:\Users\Pichau\Desktop\Moltbot\README-RAILWAY.md