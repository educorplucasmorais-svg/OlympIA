# 📖 COMO USAR O OLYMPIA BOT

Guia completo de todos os comandos e funcionalidades.

---

## 🎯 3 Formas de Usar o Bot

### 1️⃣ **Mensagens Normais** (Como ChatGPT)
Envie mensagens sem `/comando` e bot responde naturalmente:

```
Você: Olá
Bot: Oi! Sou OlympIA. Como posso ajudar? 😊

Você: Me ajuda com um email?
Bot: Claro! Qual é o assunto?

Você: Proposta comercial para cliente
Bot: [Gera email profissional completo]
```

### 2️⃣ **Comandos Diretos**
Use `/comando <texto>` para ações específicas:

```
/gerar um poema sobre tecnologia
/traduzir Hello world para português
/analisar [dados de vendas]
```

### 3️⃣ **Diálogos Interativos**
Alguns comandos fazem perguntas antes de agir:

```
/relatorio
Bot: 📊 Que tipo? 1.Diário 2.Semanal 3.Mensal
Você: 2
Bot: 📄 Formato? 1.PDF 2.Excel
Você: 1
Bot: ✅ Relatório semanal PDF gerado!
```

---

## 🤖 CATEGORIA: IA & CRIATIVIDADE

### `/gerar <texto>`
**Geração criativa de conteúdo**

**Exemplos:**
```
/gerar um slogan para empresa de tecnologia
/gerar 10 ideias de posts para Instagram
/gerar história infantil sobre um robô
/gerar código Python para calcular fibonacci
```

**Dica:** Seja específico no que quer. Quanto mais detalhes, melhor o resultado.

---

### `/analisar <texto>`
**Análise profunda de dados ou textos**

**Exemplos:**
```
/analisar vendas aumentaram 30% em janeiro mas caíram 10% em fevereiro
/analisar [cole um texto longo aqui]
/analisar pros e contras de trabalhar remoto
```

**Resposta:** Bot fornece análise detalhada com insights.

---

### `/imagem <descrição>`
**Gera imagens com IA**

**Nota:** Atualmente em implementação. Quando ativo:

```
/imagem um gato astronauta no espaço
/imagem logo minimalista para startup
```

---

### `/traduzir <texto>`
**Traduz para qualquer idioma**

**Exemplos:**
```
/traduzir Hello world
(Bot detecta idioma e traduz para português)

/traduzir Olá mundo para inglês
/traduzir Good morning para espanhol
```

**Dica:** Bot detecta idioma automaticamente.

---

### `/conhecimento <pergunta>`
**Busca na sua base de conhecimento personalizada**

**Como funciona:**
1. Você adiciona documentos em `knowledge/`
2. Bot indexa usando RAG (Retrieval-Augmented Generation)
3. Responde com base nos seus documentos

**Exemplos:**
```
/conhecimento Como usar variáveis em JavaScript?
/conhecimento Quais são as políticas da empresa?
/conhecimento Qual o processo de vendas?
```

**Setup:** Ver [CONHECIMENTO.md](CONHECIMENTO.md) para adicionar documentos.

---

## 📊 CATEGORIA: RELATÓRIOS

### `/relatorio`
**Gera relatório personalizado (diálogo interativo)**

**Fluxo:**
```
1. /relatorio
2. Bot: Que tipo? (diário/semanal/mensal/personalizado)
3. Você: 2
4. Bot: Formato? (PDF/Excel/HTML)
5. Você: 1
6. Bot: Enviar por email?
7. Você: sim
8. Bot: ✅ Relatório gerado e enviado!
```

**O que contém:**
- Resumo de atividades do bot
- Comandos mais usados
- Estatísticas de usuários
- Gráficos (se formato suportar)

**Onde vai:**
- Email (se configurado SMTP)
- Banco de dados (sempre salva)
- Telegram (link para download)

---

### `/relatorios`
**Lista últimos 10 relatórios gerados**

**Resposta:**
```
📊 Últimos Relatórios Salvos

1. ID 5 | 28/01/2026 ✅
   📊 Relatório Semanal - PDF
   👤 Gerado por: @admin
   
2. ID 4 | 27/01/2026 ❌
   📊 Relatório Diário - Excel
   ⚠️ Erro: SMTP falhou
   
💡 Use: /relatorio-baixar 5
```

**Símbolos:**
- ✅ = Enviado por email
- ❌ = Email falhou (salvo no banco)

---

### `/relatorio-baixar <id>`
**Baixa PDF do relatório do banco**

**Exemplo:**
```
/relatorio-baixar 5
→ Bot envia arquivo PDF
```

**Nota:** Apenas admins podem usar este comando.

---

## 📱 CATEGORIA: MARKETING & REDES SOCIAIS

### `/marketing`
**Estratégia completa de marketing e SEO**

**Resposta:**
- 🎯 Palavras-chave estratégicas
- 📊 Dicas de SEO
- 📱 Sugestões de conteúdo
- 🚀 Estratégias de crescimento

**Exemplo de resposta:**
```
🎯 Palavras-Chave Principais:
- "automação telegram"
- "bot ia gratuito"
- "assistente virtual"

📊 Dicas SEO:
1. Use título com palavra-chave
2. Meta description com CTA
3. URLs amigáveis
...
```

---

### `/promocao`
**Gera 5 posts prontos para redes sociais**

**Resposta:**
```
📱 POST 1 - INSTAGRAM
"🤖 Quer automatizar seu negócio?
Com nosso bot você economiza 5h/dia!
#automacao #ia #bot"

📱 POST 2 - FACEBOOK
"Descubra como IA pode transformar
seu atendimento ao cliente..."

[+ 3 posts]
```

**Dica:** Copie e cole diretamente nas redes.

---

## 👨‍💼 CATEGORIA: ADMINISTRAÇÃO

### `/admin`
**Painel administrativo completo**

**Só admin vê:**
```
👨‍💼 PAINEL ADMINISTRATIVO

📊 Estatísticas:
- Usuários: 150
- Comandos hoje: 432
- Uptime: 72h

🔧 Ações:
- /relatorio - Gerar relatório
- /relatorios - Ver histórico
- /info - Status detalhado

💡 Dica: Use /meu-id para descobrir IDs
```

---

### `/meu-id`
**Descobre seu Chat ID do Telegram**

**Resposta:**
```
🆔 Seu Chat ID é: 123456789

💡 Para se tornar admin:
1. Copie esse número
2. Adicione em .env: ADMIN_CHAT_IDS=123456789
3. Reinicie o bot
```

**Uso:** Necessário para adicionar novos admins.

---

### `/info`
**Status detalhado do bot**

**Resposta:**
```
📊 STATUS DO BOT

🤖 Sistema:
- Status: 🟢 Online
- Uptime: 3d 12h 45m
- Memória: 145MB / 512MB

👥 Usuários:
- Total: 150
- Ativos hoje: 45
- Novos (7d): 12

📈 Comandos:
- Total: 1.234
- Hoje: 89
- Mais usado: /gerar (234x)

💾 Banco:
- Tamanho: 5.2MB
- Relatórios: 28
- Último backup: há 2h
```

---

## 🏠 CATEGORIA: AUTOMAÇÃO RESIDENCIAL

### `/casa`
**Controla dispositivos smart home**

**Requisito:** Home Assistant configurado

**Exemplos:**
```
/casa status
→ Mostra dispositivos conectados

/casa ligar sala
→ Liga luzes da sala

/casa temperatura
→ Mostra temperatura atual
```

**Setup:** Ver [home-automation.js](../home-automation.js)

---

### `/clima`
**Previsão do tempo**

**Exemplo:**
```
/clima
→ Bot busca localização e mostra previsão

/clima São Paulo
→ Previsão para cidade específica
```

---

## 📧 CATEGORIA: COMUNICAÇÃO

### `/email <contexto>`
**Escreve email profissional**

**Exemplos:**
```
/email proposta comercial para cliente novo
/email resposta a reclamação de cliente
/email agradecimento por reunião
```

**Resposta:**
```
Assunto: Proposta Comercial - [Sua Empresa]

Prezado(a) Cliente,

Espero que esta mensagem o(a) encontre bem...

[Email completo formatado]

Atenciosamente,
[Assinatura]
```

---

### `/whatsapp <contexto>`
**Cria mensagens para WhatsApp**

**Exemplos:**
```
/whatsapp convite para evento
/whatsapp promoção de produto
/whatsapp lembrete de pagamento
```

**Resposta:** Texto otimizado para WhatsApp.

---

## 🔧 CATEGORIA: UTILIDADES

### `/ajuda`
**Lista todos os comandos disponíveis**

Mostra este guia resumido.

---

### `/start`
**Menu inicial do bot**

**Resposta:**
```
👋 Olá! Sou OlympIA

🤖 Posso ajudar com:
- IA e criatividade (/gerar)
- Análises (/analisar)
- Relatórios (/relatorio)
- Marketing (/marketing)
- Traduções (/traduzir)
- E muito mais!

💬 Você também pode conversar normalmente comigo!

Use /ajuda para ver todos os comandos.
```

---

## 💡 DICAS DE USO

### ✅ **Boas Práticas**

1. **Seja específico:**
   ```
   ❌ /gerar texto
   ✅ /gerar slogan criativo para loja de roupas sustentáveis
   ```

2. **Use mensagens normais para diálogos:**
   ```
   ✅ "Me ajuda com um email?"
   Bot: "Qual o assunto?"
   Você: "Proposta comercial"
   ```

3. **Combine comandos:**
   ```
   /gerar post para Instagram sobre produto X
   → "Diminua para 100 caracteres"
   → "Adicione emojis"
   ```

### 🚫 **Evite**

1. **Comandos vagos:**
   ```
   ❌ /gerar algo
   ❌ /analisar isso
   ```

2. **Textos muito longos:**
   ```
   ❌ /gerar [5000 palavras de contexto]
   ✅ Divida em partes menores
   ```

---

## 🆘 Problemas Comuns

### Bot não responde
**Solução:**
1. Verifique se bot está rodando (`node telegram-bot.js`)
2. Confirme que enviou comando correto
3. Aguarde alguns segundos (IA pode demorar)

### "Acesso negado"
**Solução:**
1. Use `/meu-id` para descobrir seu ID
2. Adicione em `.env`: `ADMIN_CHAT_IDS=seu_id`
3. Reinicie o bot

### Relatório não chega no email
**Solução:**
1. Verifique configuração SMTP em `.env`
2. Use `/relatorios` para listar
3. Baixe com `/relatorio-baixar <id>`

---

## 📚 Mais Informações

- [Instalação](INSTALACAO.md) - Setup completo
- [Configuração](CONFIGURACAO.md) - Variáveis de ambiente
- [Admin](ADMIN-GUIA.md) - Gerenciar bot
- [Relatórios](RELATORIOS.md) - Sistema de relatórios
- [Conhecimento](CONHECIMENTO.md) - Base RAG
- [Testes](TESTES.md) - Testar funcionalidades

---

**Dúvidas?** Use `/ajuda` no bot ou consulte documentação.

**Status:** 🟢 Todos os comandos testados e funcionais
