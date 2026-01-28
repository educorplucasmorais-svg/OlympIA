# 🧪 GUIA DE TESTE RÁPIDO - Novas Funcionalidades

## 📋 Checklist de Testes

### 1️⃣ Teste de Login (Novo Usuário)

```bash
# Terminal
node telegram-bot.js

# Telegram
/start
```

**Esperado:**
```
👋 Bem-vindo à OlympIA!

Para começar, preciso de algumas informações:

📝 Qual é o seu nome?
```

**Digite seu nome:**
```
Maria Silva
```

**Esperado:**
```
Prazer, Maria Silva! 😊

📧 Qual é o seu email?
Usaremos para relatórios e recuperação de conta
```

**Digite email válido:**
```
maria@email.com
```

**Esperado:**
```
✅ Cadastro concluído com sucesso!

Bem-vindo, Maria Silva! 🎉

🤖 Olá Maria Silva! Bem-vindo à OlympIA
Sua IA inteligente com superpoderes

✨ Criatividade com IA
• 💡 /gerar - Criar ideias geniais
• 🔍 /analisar - Análise profunda
...
```

✅ **PASSOU** se mostrou menu completo

---

### 2️⃣ Teste de Login (Usuário Existente)

```bash
# Telegram (mesmo usuário)
/start
```

**Esperado:**
```
🤖 Olá Maria Silva! Bem-vindo à OlympIA
Sua IA inteligente com superpoderes

[Menu completo sem pedir dados novamente]
```

✅ **PASSOU** se reconheceu usuário e mostrou menu direto

---

### 3️⃣ Teste de Menu Admin

**Pré-requisito:** Ter chat_id 4, 5, 6 ou 7, OU is_admin=true no banco

```sql
-- Se necessário, tornar usuário admin:
UPDATE users SET is_admin = 1 WHERE chat_id = SEU_CHAT_ID;
```

```bash
# Telegram (como admin)
/start
```

**Esperado:**
```
👑 Olá [Nome]! Acesso Admin

Painel Administrativo:
📊 /info - Painel completo de gerência

Comandos Disponíveis:
...
```

✅ **PASSOU** se mostrou badge 👑 e menu admin

---

### 4️⃣ Teste de Emojis (1 por comando)

**Verificar no menu:**
```
ANTES:
• 🔥🎭 /imagem

DEPOIS:
• 🎭 /imagem
ou
• 🔥 🎭 /imagem (se estiver em hot commands)
```

✅ **PASSOU** se cada comando tem apenas 1 emoji base

---

### 5️⃣ Teste de Foguinhos Dinâmicos

**Como testar:**

1. **Usar vários comandos:**
```
/gerar 5 ideias de produto
/gerar 3 nomes de empresa
/gerar slogan
/conhecimento o que é IA?
/conhecimento como programar?
```

2. **Simular atualização às 05:00:**
```javascript
// No terminal Node.js
node -e "
import('./daily-report.js').then(async m => {
  // Simular bot com hotCommands
  const bot = { hotCommands: [] };
  
  // Importar função de atualização
  const { getMostUsedCommands } = await import('./database.js');
  const topCommands = await getMostUsedCommands(5, 1);
  bot.hotCommands = topCommands.map(c => c.command_name);
  
  console.log('🔥 Hot Commands:', bot.hotCommands);
})
"
```

3. **Verificar menu após /start:**
```
Se /gerar está no top 5:
• 🔥 💡 /gerar

Se /gerar NÃO está no top 5:
• 💡 /gerar
```

✅ **PASSOU** se foguinhos aparecem nos comandos mais usados

---

### 6️⃣ Teste de Chat Humanizado

**Enviar mensagem SEM comando:**
```
Telegram:
me ajuda a criar posts para instagram
```

**Esperado:**
```
💭 Pensando...

[Resposta curta - máx 3 linhas]
Exemplo:
"Claro! Posso criar posts incríveis para você.
Quer algo para qual rede social? 😊
💡 Para estratégia completa: /marketing"
```

**Verificar:**
- ✅ Resposta curta (não um textão)
- ✅ Tom humanizado e amigável
- ✅ Sugere comando relacionado
- ✅ Usa emoji sutilmente

---

### 7️⃣ Teste de Validação de Email

**Tentar email inválido:**
```
/start (novo usuário)
> Digite nome: "João"
> Digite email: "emailinvalido"
```

**Esperado:**
```
❌ Email inválido.

Por favor, digite um email válido:
```

**Tentar email válido:**
```
joao@teste.com
```

**Esperado:**
```
✅ Cadastro concluído com sucesso!
```

✅ **PASSOU** se validou email corretamente

---

### 8️⃣ Teste de Detecção de Intenções

**Testar palavras-chave:**

| Mensagem | Sugestão Esperada |
|----------|-------------------|
| "criar um texto" | 💡 Quer criar algo específico? Use `/gerar` |
| "pesquisar notícias" | 💡 Para pesquisar: `/google` |
| "traduzir para inglês" | 💡 Para traduzir: `/traduzir` |
| "fazer uma imagem" | 💡 Para criar imagem: `/imagem` |
| "analisar dados" | 💡 Para análise: `/analisar` |

✅ **PASSOU** se detectou intenção e sugeriu comando correto

---

### 9️⃣ Teste de Banco de Dados

**Verificar registro:**
```bash
# No terminal
node -e "
import('./database.js').then(async m => {
  const users = await m.getAllUsers();
  console.log('Usuários cadastrados:', users.length);
  users.forEach(u => {
    console.log(\`- \${u.name} (\${u.email})\`);
  });
})
"
```

**Esperado:**
```
Usuários cadastrados: 1
- Maria Silva (maria@email.com)
```

✅ **PASSOU** se usuário foi registrado com nome e email

---

### 🔟 Teste de Atualização Diária (05:00)

**Simular rotina completa:**
```javascript
// No terminal
node -e "
import('./daily-report.js').then(async m => {
  const bot = { hotCommands: [] };
  await m.initializeDailyReportSchedule(bot);
  console.log('Schedule ativado! Aguardando 05:00...');
})
"
```

**Ou testar manualmente:**
```javascript
node -e "
import('./daily-report.js').then(async m => {
  import('./database.js').then(async db => {
    const top5 = await db.getMostUsedCommands(5, 1);
    console.log('🔥 Top 5 Hot Commands:');
    top5.forEach((cmd, i) => {
      console.log(\`  \${i+1}. \${cmd.command_name} (\${cmd.count} usos)\`);
    });
  });
})
"
```

✅ **PASSOU** se identificou top 5 e atualizaria foguinhos

---

## 📊 Resumo de Testes

| # | Teste | Status |
|---|-------|--------|
| 1 | Login novo usuário | ⬜ |
| 2 | Login usuário existente | ⬜ |
| 3 | Menu admin | ⬜ |
| 4 | Emojis reduzidos | ⬜ |
| 5 | Foguinhos dinâmicos | ⬜ |
| 6 | Chat humanizado | ⬜ |
| 7 | Validação email | ⬜ |
| 8 | Detecção intenções | ⬜ |
| 9 | Banco de dados | ⬜ |
| 10 | Atualização diária | ⬜ |

**Meta:** 10/10 ✅

---

## 🐛 Troubleshooting

### Problema: Menu não aparece após login
**Solução:** Verificar se `showUserMenu()` ou `showAdminMenu()` está sendo chamado

### Problema: Email não valida
**Solução:** Verificar regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

### Problema: Foguinhos não aparecem
**Solução:** 
1. Executar comandos para popular banco
2. Verificar `bot.hotCommands` está preenchido
3. Aguardar 05:00 ou rodar manualmente

### Problema: Chat não responde humanizado
**Solução:** Verificar se MCP está conectado e modelo está funcionando

---

## ✅ Aprovação Final

**Após todos os testes:**
- [ ] Login funciona para novos usuários
- [ ] Login reconhece usuários existentes
- [ ] Menus diferenciados (Admin/User)
- [ ] Emojis reduzidos (1 por comando)
- [ ] Foguinhos aparecem em top 5
- [ ] Chat humanizado com respostas curtas
- [ ] Validação de email funciona
- [ ] Detecção de intenções sugere comandos
- [ ] Banco registra usuários corretamente
- [ ] Sistema pronto para produção

**Se TODOS ✅ → APROVADO PARA PRODUÇÃO! 🚀**

---

**Data:** 28 de janeiro de 2024  
**Versão:** 2.1.0  
**Tester:** _____________
