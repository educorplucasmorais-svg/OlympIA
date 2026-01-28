# 🧪 TESTES: SISTEMA DE DIÁLOGOS INTERATIVOS

## ✅ Checklist de Funcionalidades

### 1. Mensagens Normais Funcionam

**Teste:**
```
Você: Olá
Bot: (Deve responder com pensamento de 2-3 linhas)
```

**Esperado:** Bot responde naturalmente, sem error

**Status:** _____ (Teste quando o bot estiver rodando)

---

### 2. Comando `/relatorio` Inicia Diálogo

**Teste:**
```
Você: /relatorio
Bot: (Deve fazer 1ª pergunta sobre tipo de relatório)
```

**Esperado:** Bot pergunta tipo de relatório (1-4)

**Status:** _____ 

---

### 3. Diálogo `/relatorio` Completo

**Teste:**
```
/relatorio
→ Digite: 2
→ Digite: 1  
→ Digite: sim
```

**Esperado:** Bot executa ação e mostra resultado

**Status:** _____

---

### 4. Respostas Fora de Contexto Ignoradas

**Teste:**
```
Você: (conversa normal que não é resposta de diálogo)
Bot: (Deve tentar chamar IA, não processar como resposta)
```

**Esperado:** Bot não assume como diálogo

**Status:** _____

---

### 5. Diálogo Novo Substitui Anterior

**Teste:**
```
/relatorio (começa diálogo)
Digite: 1
/relatorio (começa novo diálogo)
```

**Esperado:** Novo diálogo substitui o anterior

**Status:** _____

---

### 6. Timeout Automático (600s)

**Teste:**
```
/relatorio
(Esperar 11 minutos)
Responder
```

**Esperado:** "Erro ao processar" ou nova pergunta

**Status:** _____ (Teste a longo prazo)

---

### 7. Dicas Aparecem Corretamente

**Teste:**
```
/relatorio
```

**Esperado:** Cada pergunta tem 💡 com dica

**Status:** _____

---

### 8. `/relatorios` Ainda Funciona

**Teste:**
```
/relatorios
```

**Esperado:** Lista relatórios salvos (antiga funcionalidade)

**Status:** _____

---

### 9. Admin Check Funciona

**Teste:**
```
Usuário não-admin: /relatorio
```

**Esperado:** "🔐 Acesso negado"

**Status:** _____

---

### 10. Conversa + Diálogo Coexistem

**Teste:**
```
Você: Oi
Bot: (Responde com IA)

Você: /relatorio  
Bot: (Inicia diálogo)

Você: 2
Bot: (Próxima pergunta)

Você: Me ajuda com um email?
Bot: (Responde como IA normal, não como diálogo)
```

**Esperado:** Ambos funcionam sem conflito

**Status:** _____

---

## 🚀 Como Testar

### Via Telegram (Recomendado)

1. **Iniciar bot:** `node telegram-bot.js`
2. **Abrir Telegram**
3. **Enviar para o bot:** `/relatorio`
4. **Responder as 3 perguntas**
5. **Ver resultado personalizado**

### Via Console (Debug)

Adicionar logs em `conversation-manager.js`:
```javascript
console.log(`[CONV] Iniciando: ${type}`);
console.log(`[CONV] Pergunta ${step}: ${text}`);
console.log(`[CONV] Resposta: ${userResponse}`);
```

---

## 📋 Protocolo de Teste Completo

### Fase 1: Funcionalidades Básicas
- [ ] `/start` abre menu
- [ ] Mensagem normal funciona
- [ ] Comando inexistente ignora
- [ ] `/relatorio` abre diálogo

### Fase 2: Diálogo `/relatorio`
- [ ] 1ª pergunta aparece
- [ ] Resposta processada
- [ ] 2ª pergunta aparece
- [ ] Resposta processada
- [ ] 3ª pergunta aparece
- [ ] Resposta processada
- [ ] Ação executada
- [ ] Resultado mostrado

### Fase 3: Erros e Edge Cases
- [ ] Novo `/relatorio` limpa anterior
- [ ] Resposta inválida tenta IA
- [ ] Timeout funciona
- [ ] Admin check funciona

### Fase 4: Conversação Contínua
- [ ] Chat normal depois de diálogo
- [ ] Diálogo depois de chat normal
- [ ] Múltiplos usuários simultâneos
- [ ] Mensagens com múltiplas linhas

---

## 🐛 Possíveis Problemas

### Problema: Diálogo não inicia
**Solução:** Verificar se `ConversationManager` foi importado corretamente

### Problema: Bot não responde mensagens normais
**Solução:** Verificar se `this.bot.on('message')` está antes do handler de conversas

### Problema: Timeout não aparece
**Solução:** Aumentar timeout em `conversation-manager.js` (está em 600000ms = 10min)

### Problema: Respostas muito longas cortadas
**Solução:** Código divide em múltiplas mensagens se > 4096 chars

---

## 📊 Métricas de Sucesso

- ✅ 100% das mensagens normais processadas
- ✅ 100% dos diálogos coletando dados
- ✅ 100% das ações executadas corretamente
- ✅ 0% de erros não tratados
- ✅ Tempo médio de resposta < 2s

---

## 🎯 Conclusão do Teste

Se todos os 10 testes passarem, o sistema está pronto para produção!

**Resultado Final:** _____ PASSOU / _____ FALHOU

---

**Data do Teste:** ___________  
**Testador:** ___________  
**Observações:** ___________________________________________________________
