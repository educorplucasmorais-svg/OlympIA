# 📊 Sistema de Relatórios - Documentação Completa

## ✅ Funcionalidades Implementadas

### 1. **Geração Automática de Relatórios (05:00)**
- ⏰ Triggers diariamente às 05:00 (timezone: America/Sao_Paulo)
- 📄 Gera PDF e HTML automaticamente
- 📧 Tenta enviar por email para 4 administradores
- 💾 Se email falhar, **salva automaticamente no banco de dados SQL**

### 2. **Banco de Dados de Relatórios**
Tabela `daily_reports` armazena:
```sql
- id (ID único)
- generated_at (timestamp de criação)
- report_date (data do relatório)
- report_subject (assunto/título)
- pdf_data (PDF binário em BLOB)
- html_data (versão HTML do relatório)
- email_sent (1=enviado, 0=armazenado no BD)
- email_error (mensagem de erro, se houver)
```

### 3. **Comandos Ocultos para Admins**

#### `/relatorio` - Gera Relatório Manualmente
```
- Verifica se é admin via ADMIN_CHAT_IDS
- Gera PDF e HTML agora
- Tenta enviar por email
- Se falhar, salva no BD
- Responde: "✅ Relatório processado (enviado por email ou salvo no BD)!"
```

#### `/relatorios` - Lista Últimos Relatórios Salvos
```
- Mostra últimos 10 relatórios do banco de dados
- Formato: Data | Status (✅ email ou ❌ BD)
- Mostra ID para download
- Exibe erro do email, se houver
```

#### `/relatorio-baixar ID` - Baixa PDF de um Relatório
```
Exemplo: /relatorio-baixar 5
- Recupera PDF do banco de dados
- Envia para o chat do Telegram
- Mostra status: "Enviado por Email ✅" ou "Armazenado no BD ❌"
```

#### `/meu-id` - Mostra Seu Chat ID
```
- Útil para configurar novos admins
- Mostra: "🆔 Seu Chat ID é: 123456789"
```

## 🔐 Sistema de Admins

### Configuração em `.env`
```
ADMIN_CHAT_IDS=1,2,3,4
```
- **001** = Chat ID 1 (Lucas - exemplo)
- **002** = Chat ID 2
- **003** = Chat ID 3
- **004** = Chat ID 4

### Como Descobrir seu Chat ID
1. Envie `/meu-id` ao bot
2. Bot responde com seu Chat ID
3. Adicione o número no `.env` em `ADMIN_CHAT_IDS`

## 📧 Sistema de Email com Fallback

### Fluxo de Envio:
```
1. Gera relatório em PDF e HTML
2. Tenta enviar por email para 4 admins
   ✅ Se sucesso → email_sent = 1, email_error = null
   ❌ Se falha → Captura erro e continua
3. Se qualquer email falhou:
   💾 Salva PDF, HTML e mensagem de erro no BD
   📊 email_sent = 0, email_error = "mensagem de erro SMTP"
4. Relatório SEMPRE fica acessível no banco de dados!
```

### Configuração de Email (`.env`)
```
EMAIL_USER=educorp.lucasmorais@gmail.com
EMAIL_PASSWORD=vfsrixzqwkdpmxxp
```

**Nota:** Se Gmail está bloqueando, gerar "App Password" em:
https://myaccount.google.com/apppasswords

## 💾 Recuperação de Relatórios

### Cenário 1: Email Funcionando
- Admin recebe PDF por email ✅
- Relatório também armazenado no BD como backup

### Cenário 2: Email Falhou
- Relatório **salvo automaticamente no BD** ❌
- Admin usa `/relatorios` para listar
- Admin usa `/relatorio-baixar ID` para baixar PDF
- Email error salvo para debug

### Cenário 3: Backup Manual
- Use `/relatorio` para disparo manual
- Ideal para testar antes do 05:00
- Verifica se email está funcionando

## 🛠️ Funções Internas

### Em `daily-report.js`
```javascript
generateDailyReport()        // Cria PDF e HTML
sendReportToAdmins(report)   // Envia email OU salva BD
initializeDailyReportSchedule(bot)  // Inicia scheduler 05:00
```

### Em `database.js`
```javascript
saveReportToDatabase(date, subject, pdf, html, sent, error)
listDailyReports(limit)      // Retorna últimos N relatórios
getReportById(id)            // Retorna relatório com PDF
```

## 📋 Exemplo de Uso

### Teste 1: Gerar Relatório Manualmente
```
Admin: /relatorio
Bot: 📧 Gerando e enviando relatório...
Bot: ✅ Relatório processado (enviado por email ou salvo no BD)!
```

### Teste 2: Listar Relatórios Salvos
```
Admin: /relatorios
Bot: 📊 Últimos Relatórios Salvos
     1. ID 5 | 15/12/2024 ❌
        📊 Relatório Diário OlympIA Bot - ...
        ⚠️ Error: SMTP connection timeout
     
     💡 Use: /relatorio-baixar 5
```

### Teste 3: Baixar PDF
```
Admin: /relatorio-baixar 5
Bot: [Envia arquivo PDF]
     📄 Relatório 15/12/2024
     Armazenado no BD (Email falhou) ❌
```

## 🔍 Verificação de Status

### Logs no Console
```
[DAILY REPORT] 📧 Tentando enviar relatório...
[DAILY REPORT] ✅ Email enviado para: admin1@example.com
[DAILY REPORT] ❌ Erro ao enviar para admin2@example.com: SMTP error
[DAILY REPORT] 💾 Salvando relatório no banco de dados...
[DAILY REPORT] ✅ Relatório salvo no BD com ID: 5
[DAILY REPORT] 📊 Processamento de relatório concluído!
```

### No Banco de Dados
```sql
SELECT * FROM daily_reports ORDER BY report_date DESC LIMIT 5;
```

## 🎯 Resumo de Objetivos Atingidos

✅ **"E o relatório no email tem que ser enviado .pdf"**
- Relatórios em PDF via pdfkit
- Anexados aos emails
- Armazenados em BLOB no BD

✅ **"se não pode ser enviado, você pode registrar no SQL o relatório do dia xx e ai eu peço aqui e vejo?"**
- Fallback automático para BD quando email falha
- Recuperação via `/relatorios` e `/relatorio-baixar`
- Email error armazenado para debug

✅ **"E ainda ta perguntando nome?"**
- Sistema de login/registro removido
- `/start` abre menu diretamente
- Acesso ao `/admin` via ADMIN_CHAT_IDS

✅ **"Ponha o ID do Lucas como 001. E os demais em seguiguda002,003 etc."**
- ADMIN_CHAT_IDS=1,2,3,4 configurável
- Comando `/meu-id` para descobrir IDs
- Prioriza .env sobre banco de dados

## 📅 Próximas Verificações

1. **Testar Email Real:**
   - Execute `/relatorio` e verifique se email chega
   - Verifique App Password do Gmail se não chegar

2. **Verificar Armazenamento:**
   - Execute `/relatorios` para ver se BD está salvando
   - Use `/relatorio-baixar ID` para validar PDF

3. **Teste Automático (05:00):**
   - Deixe bot rodando até 05:00
   - Verifique logs para "[SCHEDULE] ⏰"
   - Confirme que relatório foi criado/enviado

4. **Git Commit Automático:**
   - Verificar se auto-commit acontece às 05:00
   - Revisar histórico do git

## 📞 Suporte

Se algo não funcionar:
1. Verifique logs no console
2. Use `/relatorios` para ver estado dos relatórios
3. Verifique email_error na BD para detalhes
4. Teste manual com `/relatorio`
5. Confirme ADMIN_CHAT_IDS correto com `/meu-id`
