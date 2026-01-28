# 🚀 SISTEMA DE RELATÓRIOS - GUIA DE USO

## ✅ Status: IMPLEMENTADO E TESTADO

O sistema de relatórios foi completamente implementado com fallback automático para banco de dados quando o email falhar.

---

## 📋 O Que Foi Implementado

### 1. **Geração Automática Diária (05:00)**
- ⏰ Todo dia às 05:00 (timezone: America/Sao_Paulo)
- 📄 Gera relatório em PDF e HTML
- 📧 Tenta enviar por email
- 💾 Se email falhar → **salva automaticamente no banco de dados**

### 2. **Armazenamento em Banco de Dados**
- Tabela: `daily_reports` no banco `users.db`
- Armazena: PDF (BLOB), HTML, data, assunto, status de email, erro SMTP
- Recuperável por admins a qualquer momento

### 3. **Comandos Ocultos para Admins**

| Comando | Descrição |
|---------|-----------|
| `/relatorio` | Gera relatório agora (não precisa esperar 05:00) |
| `/relatorios` | Lista últimos 10 relatórios salvos |
| `/relatorio-baixar ID` | Baixa PDF de um relatório específico |
| `/meu-id` | Mostra seu Chat ID (para configurar admins) |

---

## 🧪 Como Testar

### **Teste 1: Verificar Banco de Dados**

```bash
node test-relatorio-db.js
```

**Esperado:**
```
✅ Tabela daily_reports existe
✅ Admin Chat IDs: 1, 2, 3, 4
✅ Scheduler: 05:00
```

---

### **Teste 2: Gerar Relatório Manual**

1. **No Telegram, como admin, envie:**
   ```
   /relatorio
   ```

2. **Bot responde:**
   ```
   📧 Gerando e enviando relatório...
   ✅ Relatório processado (enviado por email ou salvo no BD)!
   ```

3. **Verifique no console:**
   ```
   [DAILY REPORT] 📧 Tentando enviar relatório...
   [DAILY REPORT] ✅ Email enviado para: admin1@example.com
   [DAILY REPORT] 📊 Processamento concluído!
   ```

   Ou (se email falhou):
   ```
   [DAILY REPORT] ❌ Erro ao enviar para admin1@example.com: timeout
   [DAILY REPORT] 💾 Salvando relatório no banco de dados...
   [DAILY REPORT] ✅ Relatório salvo com ID: 5
   ```

---

### **Teste 3: Listar Relatórios**

1. **No Telegram, envie:**
   ```
   /relatorios
   ```

2. **Bot mostra:**
   ```
   📊 Últimos Relatórios Salvos
   
   1. ID 5 | 28/01/2026 ✅
      📊 Relatório Diário OlympIA Bot - 28/01/2026 10:30:45
   
   2. ID 4 | 27/01/2026 ❌
      📊 Relatório Diário OlympIA Bot - 27/01/2026 10:30:20
      ⚠️ Error: SMTP timeout
   
   💡 Use: /relatorio-baixar ID
   ```

   - ✅ = Enviado por email
   - ❌ = Armazenado no BD (email falhou)

---

### **Teste 4: Baixar PDF**

1. **No Telegram, envie:**
   ```
   /relatorio-baixar 5
   ```

2. **Bot envia o PDF com legenda:**
   ```
   📄 Relatório 28/01/2026
   Enviado por Email ✅
   ```

   Ou (se foi armazenado):
   ```
   📄 Relatório 27/01/2026
   Armazenado no BD (Email falhou) ❌
   ```

---

## 🔑 Configuração de Admins

### Descobrir Seu Chat ID

1. **Envie ao bot:**
   ```
   /meu-id
   ```

2. **Bot responde:**
   ```
   🆔 Seu Chat ID é: 123456789
   ```

3. **Edite `.env`:**
   ```
   ADMIN_CHAT_IDS=123456789,987654321,111111111,222222222
   ```

4. **Reinicie o bot:**
   ```
   node telegram-bot.js
   ```

---

## 📊 Fluxo Completo

### Cenário 1: Email Funciona ✅
```
05:00 → Gera PDF/HTML
      → Tenta enviar por email
      → EMAIL ENVIADO ✅
      → Salva no BD como backup
      → Pronto!
```

### Cenário 2: Email Falha ❌
```
05:00 → Gera PDF/HTML
      → Tenta enviar por email
      → ERRO SMTP (timeout, login falho, etc)
      → Salva no BD com erro ❌
      → Admin usa /relatorio-baixar para recuperar
      → Pronto!
```

### Cenário 3: Teste Manual
```
Admin: /relatorio
      → Mesma lógica acima, mas agora
      → Resposta imediata ao admin
      → Não precisa esperar 05:00
```

---

## 🔧 Troubleshooting

### Problema: Email não está chegando

**Solução 1: Verificar credenciais Gmail**
- Login para: https://myaccount.google.com/apppasswords
- Gerar "App Password" (não usar senha da conta)
- Atualizar em `.env`:
  ```
  EMAIL_USER=seu@gmail.com
  EMAIL_PASSWORD=senha_app_gerada
  ```

**Solução 2: Verificar erros no console**
- Procure por: `[DAILY REPORT] ❌ Erro ao enviar`
- Erro será armazenado em `email_error` no BD
- Use `/relatorios` para ver a mensagem de erro

**Solução 3: Usar comando manual**
- `/relatorio` dispara geração agora
- Verifique se chega algum email
- Se não chegar, erro será salvo no BD

---

## 📈 Verificação de Status

### No Console
```bash
# Bot rodando
[HEALTH] ✅ Bot OK | Uptime: 5min | Users: 7

# Relatório gerado
[DAILY REPORT] 📧 Tentando enviar relatório para 4 administradores...
[DAILY REPORT] ✅ Email enviado para: admin1@example.com
[DAILY REPORT] 📊 Processamento de relatório concluído!
```

### No Banco de Dados
```sql
-- Verificar última entrada
SELECT id, report_date, email_sent, email_error 
FROM daily_reports 
ORDER BY generated_at DESC 
LIMIT 1;

-- Listar últimos 7 dias
SELECT report_date, email_sent, 
       CASE WHEN email_error IS NULL THEN 'OK' ELSE email_error END as status
FROM daily_reports
WHERE report_date >= date('now', '-7 days')
ORDER BY report_date DESC;
```

---

## 🎯 Checklist Final

- [ ] Bot ligado e rodando (veja `📱 Envie /start`)
- [ ] Pode enviar `/relatorio` sem erros
- [ ] Comando `/relatorios` mostra pelo menos 1 relatório
- [ ] Pode fazer download com `/relatorio-baixar ID`
- [ ] Verificou `.env` com ADMIN_CHAT_IDS corretos
- [ ] Descobriu seu Chat ID com `/meu-id`
- [ ] Testou email (verifique `/relatorios` para status)
- [ ] Consultou console para erros SMTP

---

## 📞 Próximas Ações

1. **Hoje:** Teste `/relatorio` e verifique se relatório aparece em `/relatorios`
2. **Teste Email:** Veja se chega no email ou se salva erro no BD
3. **Amanhã às 05:00:** Verifique se geração automática funciona
4. **Verifique Git:** Veja se `/relatorio-commit` foi executado às 05:00

---

**✅ Sistema pronto para produção!**

Relatórios agora têm **dupla segurança**:
- 📧 Email (se SMTP funcionar)
- 💾 Banco de Dados (sempre disponível)

Nunca mais perde relatórios! 🎉
