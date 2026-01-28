# 📱 Moltbot WhatsApp Integration

Bot de WhatsApp integrado com o servidor MCP Moltbot e a skill Nano Banana Pro.

## 🚀 Como Usar

### 1. Iniciar o Bot

```bash
npm run whatsapp
```

### 2. Escanear QR Code

- Um QR Code aparecerá no terminal
- Abra o WhatsApp no seu celular
- Vá em **Aparelhos conectados** → **Conectar um aparelho**
- Escaneie o QR Code do terminal

### 3. Bot está Pronto!

Envie mensagens para o bot usando os comandos abaixo.

## 📝 Comandos Disponíveis

### Ajuda
```
!help
!ajuda
```
Mostra todos os comandos disponíveis

### Gerar Texto com IA
```
!gerar <seu prompt>
```
**Exemplos:**
- `!gerar explique o que é inteligência artificial`
- `!gerar crie uma piada sobre programação`
- `!gerar escreva um poema sobre tecnologia`

### Analisar Sentimento
```
!analisar <texto>
!sentimento <texto>
```
**Exemplos:**
- `!analisar estou muito feliz com os resultados!`
- `!sentimento que dia horrível`

### Extrair Palavras-chave
```
!keywords <texto>
```
**Exemplo:**
- `!keywords inteligência artificial está revolucionando a tecnologia`

### Listar Skills
```
!skills
```
Mostra todas as skills disponíveis no Moltbot

## ⚙️ Recursos

- ✅ Geração de texto com IA
- ✅ Análise de sentimento
- ✅ Extração de palavras-chave
- ✅ Análise de entidades
- ✅ Suporte a múltiplos contatos
- ✅ Autenticação persistente (não precisa escanear QR toda vez)

## 🔧 Configuração Avançada

### Personalizar Respostas

Edite o arquivo [whatsapp-bot.js](whatsapp-bot.js) para:
- Adicionar novos comandos
- Modificar mensagens de resposta
- Integrar outras skills do Moltbot

### Adicionar APIs Reais

Para usar APIs de IA reais, edite [index.js](index.js) e adicione:

```javascript
// Exemplo com OpenAI
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: 'sua-api-key' });

// No caso 'nano_banana_pro_generate':
const completion = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: prompt }],
  temperature: temperature,
  max_tokens: max_tokens,
});
```

## 🛡️ Segurança

- ⚠️ Não compartilhe o QR Code
- ⚠️ Mantenha a pasta `.wwebjs_auth` segura (contém suas credenciais)
- ⚠️ Use variáveis de ambiente para API keys

## 📊 Status

Acompanhe logs no terminal:
- 📩 Mensagens recebidas
- ✅ Comandos processados
- ❌ Erros (se houver)

## 🐛 Troubleshooting

### Bot não conecta
```bash
# Remova a pasta de autenticação e tente novamente
Remove-Item -Recurse -Force .wwebjs_auth
npm run whatsapp
```

### Erro ao processar comando
- Verifique se o servidor MCP está funcionando
- Execute `npm test` para testar o MCP separadamente
