# 👨‍💼 GUIA DO ADMINISTRADOR

Como gerenciar admins, permissões e configurações do bot.

---

## 🎯 O Que Admins Podem Fazer

| Funcionalidade | Admin | Usuário Normal |
|---|---|---|
| Conversar com bot | ✅ | ✅ |
| Usar `/gerar`, `/traduzir` | ✅ | ✅ |
| Gerar relatórios (`/relatorio`) | ✅ | ❌ |
| Ver histórico (`/relatorios`) | ✅ | ❌ |
| Baixar PDF (`/relatorio-baixar`) | ✅ | ❌ |
| Ver painel (`/admin`) | ✅ | ❌ |
| Ver status (`/info`) | ✅ | ❌ |

---

## 🔐 Como Adicionar Admins

### Passo 1: Descobrir Chat ID

**Pessoa que será admin:**
```
1. Enviar mensagem para bot no Telegram
2. Usar comando: /meu-id
3. Bot responde: "Seu Chat ID é: 123456789"
4. Copiar esse número
```

### Passo 2: Adicionar no `.env`

Abrir arquivo `.env` no editor:

```env
# Antes (1 admin apenas)
ADMIN_CHAT_IDS=987654321

# Depois (múltiplos admins)
ADMIN_CHAT_IDS=987654321,123456789,555666777
```

**Formato:** IDs separados por vírgula (sem espaços)

### Passo 3: Reiniciar Bot

```bash
# Windows PowerShell
taskkill /F /IM node.exe
node telegram-bot.js

# Linux/Mac
pkill node
node telegram-bot.js
```

### Passo 4: Testar

Novo admin envia:
```
/admin
```

Se aparecer painel administrativo = ✅ Sucesso!

Se aparecer "🔐 Acesso negado" = ❌ Verificar ID no .env

---

## 📊 Comandos Exclusivos de Admin

### `/admin`
Painel com estatísticas e ações rápidas.

**Exemplo de resposta:**
```
👨‍💼 PAINEL ADMINISTRATIVO

📊 Estatísticas:
- Usuários: 150
- Comandos hoje: 432
- Uptime: 72h

🔧 Ações Rápidas:
- /relatorio - Gerar relatório
- /relatorios - Ver histórico
- /info - Status detalhado

📧 Email SMTP: ✅ Configurado
💾 Banco: 5.2MB (28 relatórios)
```

---

### `/info`
Status técnico detalhado do sistema.

**Resposta completa:**
```
📊 STATUS DO BOT

🤖 Sistema:
- Status: 🟢 Online
- Uptime: 3d 12h 45m
- Memória: 145MB / 512MB
- CPU: 12%

👥 Usuários:
- Total: 150
- Ativos hoje: 45
- Ativos (7d): 89
- Novos (7d): 12
- Novos (30d): 34

📈 Comandos:
- Total: 1.234
- Hoje: 89
- Semana: 543
- Mais usado: /gerar (234x)

💾 Banco de Dados:
- Tamanho: 5.2MB
- Usuários: 150
- Relatórios: 28
- Último backup: há 2h

📧 Email:
- Status: ✅ Configurado
- Último envio: há 30min
- Taxa de sucesso: 98%

🔗 Integrações:
- MCP Server: ✅ Conectado
- Groq AI: ✅ Ativo
- Home Assistant: ❌ Não configurado
```

---

### `/relatorio`
Gera relatório personalizado (diálogo interativo).

**Fluxo completo:**
```
Admin: /relatorio

Bot: 📊 Que tipo de relatório você quer gerar?

     1. Diário (últimas 24h)
     2. Semanal (últimos 7 dias)
     3. Mensal (últimos 30 dias)
     4. Personalizado (escolher datas)

     💡 Digite o número (1, 2, 3 ou 4)

Admin: 2

Bot: 📄 Em qual formato você prefere?

     1. PDF (para impressão)
     2. Excel (para análise)
     3. HTML (para web)

     💡 Digite o número (1, 2 ou 3)

Admin: 1

Bot: 📧 Enviar por email ao término?

     (Digite sim/não ou apelido do destinatário)

     💡 Exemplo: "sim", "não", ou "joao@empresa.com"

Admin: sim

Bot: ⏳ Processando suas informações...
     ✅ Relatório semanal gerado com sucesso!
     
     📋 Formato: PDF
     📧 Será enviado por email
     💾 Salvo no banco: ID 29
     
     💡 Use `/relatorios` para ver o histórico
     💡 Use `/relatorio-baixar 29` para baixar
```

**O que o relatório contém:**
- Estatísticas de uso
- Comandos mais usados
- Usuários ativos
- Gráficos (em PDF)
- Métricas de performance

---

### `/relatorios`
Lista últimos 10 relatórios salvos no banco.

**Exemplo:**
```
📊 Últimos Relatórios Salvos

1. ID 29 | 28/01/2026 10:30 ✅
   📊 Relatório Semanal - PDF
   👤 Gerado por: @admin
   📧 Email: Enviado com sucesso
   
2. ID 28 | 27/01/2026 18:45 ✅
   📊 Relatório Diário - Excel
   👤 Gerado por: @manager
   📧 Email: Enviado com sucesso
   
3. ID 27 | 27/01/2026 09:15 ❌
   📊 Relatório Mensal - PDF
   👤 Gerado por: @admin
   ⚠️ Email: Falhou (SMTP timeout)
   💾 Salvo no banco
   
💡 Use: /relatorio-baixar 29
```

**Símbolos:**
- ✅ = Email enviado com sucesso
- ❌ = Email falhou (relatório salvo no banco)

---

### `/relatorio-baixar <id>`
Baixa PDF do relatório diretamente do banco.

**Exemplo:**
```
Admin: /relatorio-baixar 29

Bot: 📄 Relatório ID 29
     📊 Tipo: Semanal
     📅 Gerado em: 28/01/2026 10:30
     👤 Por: @admin
     
     [Envia arquivo PDF]
```

**Nota:** ID vem do comando `/relatorios`

---

## 🛡️ Segurança e Boas Práticas

### ✅ Recomendações

1. **Limite o número de admins:**
   - Apenas pessoas de confiança
   - Revise lista periodicamente

2. **Use IDs corretos:**
   - Sempre confirme com `/meu-id`
   - IDs são números únicos (ex: 123456789)
   - Não compartilhe IDs publicamente

3. **Proteja o `.env`:**
   - Nunca commite no Git
   - Adicione ao `.gitignore`
   - Faça backup seguro

4. **Monitore uso:**
   - Use `/info` diariamente
   - Verifique comandos suspeitos
   - Acompanhe novos usuários

### 🚫 Evite

1. ❌ Adicionar usuários desconhecidos como admin
2. ❌ Compartilhar token do bot publicamente
3. ❌ Deixar `.env` com permissões abertas
4. ❌ Ignorar alertas de falha de email

---

## 📧 Configurar Email SMTP

### Por que configurar?
- Enviar relatórios automaticamente
- Notificações de eventos críticos
- Backup de dados importantes

### Como configurar

**1. Gmail (recomendado):**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu.email@gmail.com
SMTP_PASS=sua_senha_app
ADMIN_EMAIL=destinatario@gmail.com
```

**Obter senha de app Gmail:**
1. Acesse: https://myaccount.google.com/security
2. Ative "Verificação em duas etapas"
3. Vá em "Senhas de app"
4. Gere senha para "Correio"
5. Use essa senha no `SMTP_PASS`

**2. Outlook:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=seu.email@outlook.com
SMTP_PASS=sua_senha
ADMIN_EMAIL=destinatario@outlook.com
```

**3. Servidor customizado:**
```env
SMTP_HOST=mail.seudominio.com
SMTP_PORT=587
SMTP_USER=contato@seudominio.com
SMTP_PASS=senha_segura
ADMIN_EMAIL=admin@seudominio.com
```

### Testar configuração
```bash
# Gerar relatório e enviar por email
/relatorio
→ Escolher opções
→ Email: sim
→ Verificar inbox
```

Se não chegar:
1. Verificar configurações SMTP
2. Ver logs do bot (`console`)
3. Usar `/relatorios` para ver mensagem de erro
4. Baixar do banco com `/relatorio-baixar`

---

## 💾 Gerenciar Banco de Dados

### Localização
Arquivo: `users.db` (raiz do projeto)

### Tabelas principais

**1. users** - Dados de usuários
```sql
- user_id (Chat ID)
- first_name
- username
- registered_at
- last_active
```

**2. daily_reports** - Relatórios salvos
```sql
- id (auto-increment)
- subject (assunto)
- html_content (HTML completo)
- pdf_data (BLOB - arquivo PDF)
- created_at (data/hora)
- email_sent (1=enviado, 0=falhou)
- smtp_error (mensagem de erro)
```

### Backup manual
```bash
# Windows
copy users.db users_backup_28-01-2026.db

# Linux/Mac
cp users.db users_backup_28-01-2026.db
```

### Ver tamanho do banco
```bash
# Windows
dir users.db

# Linux/Mac
ls -lh users.db
```

### Limpar relatórios antigos (opcional)
```bash
node
> const db = require('./database.js');
> db.run("DELETE FROM daily_reports WHERE created_at < datetime('now', '-90 days')");
> .exit
```

**Cuidado:** Isso deleta relatórios com mais de 90 dias.

---

## 🔧 Troubleshooting Admin

### Problema: "Acesso negado" mas ID está no .env

**Verificar:**
1. ID está correto? Use `/meu-id` para confirmar
2. Sem espaços no `.env`? Correto: `123,456` / Errado: `123, 456`
3. Bot foi reiniciado após alterar `.env`?
4. Arquivo `.env` está na raiz do projeto?

**Teste rápido:**
```javascript
// No console do bot
console.log(process.env.ADMIN_CHAT_IDS);
// Deve mostrar: "123456789,987654321"
```

---

### Problema: Relatório não chega no email

**Checklist:**
- [ ] SMTP configurado no `.env`?
- [ ] Senha de app (não senha normal)?
- [ ] Porta 587 aberta no firewall?
- [ ] Email destinatário correto?

**Ver erro específico:**
```
/relatorios
→ Procure relatório com ❌
→ Veja mensagem "⚠️ Email: [erro]"
```

**Solução temporária:**
```
/relatorio-baixar <id>
→ Baixa do banco mesmo se email falhou
```

---

### Problema: Bot não inicia

**Verificar:**
```bash
# Ver erros
node telegram-bot.js

# Erros comuns:
- "TELEGRAM_TOKEN não definido" → Falta no .env
- "Cannot find module" → npm install
- "Port already in use" → Outro bot rodando
```

**Resolver:**
```bash
# Matar processos Node
taskkill /F /IM node.exe    # Windows
pkill node                   # Linux/Mac

# Reinstalar dependências
rm -rf node_modules
npm install

# Verificar .env
cat .env    # Linux/Mac
type .env   # Windows
```

---

## 📊 Monitoramento e Logs

### Ver logs em tempo real
```bash
node telegram-bot.js
# Console mostra:
# - Comandos recebidos
# - Erros
# - Status de conexões
```

### Principais mensagens

**✅ Normal:**
```
[HEALTH] ✅ Bot OK | Uptime: 1h | Users: 50
✅ Conectado ao OlympIA MCP Server
[OPT] Cache hit para query: ...
```

**⚠️ Atenção:**
```
[HEALTH] ⚠️ Alta latência: 5000ms
⚠️ Tentando reconectar ao MCP...
⚠️ Email falhou: SMTP timeout
```

**❌ Erro:**
```
❌ Erro ao gerar relatório: [detalhes]
❌ MCP desconectado
❌ Banco de dados: SQLITE_BUSY
```

---

## 📚 Mais Recursos

- [Como Usar](COMO-USAR.md) - Todos os comandos
- [Relatórios](RELATORIOS.md) - Sistema de relatórios detalhado
- [Configuração](CONFIGURACAO.md) - Todas as variáveis .env
- [Testes](TESTES.md) - Testar funcionalidades

---

**Dúvidas sobre administração?** Use `/admin` para painel rápido ou `/info` para detalhes técnicos.

**Status:** 🟢 Sistema de admin 100% funcional
