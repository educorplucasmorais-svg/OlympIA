# 📧 Como Configurar Email no Moltbot

Para o bot enviar emails por você, precisa configurar uma conta Gmail.

## Passo 1: Criar Senha de App no Gmail

1. Acesse: https://myaccount.google.com/
2. Vá em **Segurança**
3. Ative **Verificação em duas etapas** (se ainda não tiver)
4. Procure por **Senhas de app**
5. Selecione:
   - App: **Email**
   - Dispositivo: **Outro** (escreva "Moltbot")
6. Clique em **Gerar**
7. **COPIE A SENHA** gerada (16 caracteres)

## Passo 2: Configurar no Código

Abra o arquivo `telegram-bot.js` e encontre:

```javascript
const EMAIL_CONFIG = {
  user: 'seu-email@gmail.com',  // Seu email
  pass: 'sua-senha-de-app'       // Senha de app do Gmail
};
```

Substitua:
- `seu-email@gmail.com` → Seu email real (ex: joao@gmail.com)
- `sua-senha-de-app` → A senha de 16 caracteres que copiou

## Passo 3: Como Usar

### Formato do comando:
```
/email destinatario@email.com | Assunto do Email | Mensagem aqui
```

### Exemplos:

**Email simples:**
```
/email maria@exemplo.com | Reunião | Olá Maria, confirmo presença na reunião de amanhã às 14h.
```

**Email profissional:**
```
/email cliente@empresa.com | Proposta Comercial | Prezado cliente, segue em anexo nossa proposta. Atenciosamente.
```

**Email rápido:**
```
/email amigo@gmail.com | Oi | E aí, tudo bem? Vamos marcar algo!
```

## ⚠️ Importante:

1. **Nunca compartilhe** sua senha de app
2. A senha de app é **diferente** da senha do Gmail
3. Use **"|"** (pipe) para separar as partes
4. O bot envia **do seu email** configurado
5. Formato: `destinatário | assunto | mensagem`

## 🔒 Segurança:

- A senha fica apenas no seu computador
- O bot roda localmente na sua máquina
- Gmail permite até 500 emails por dia
- Você pode revogar a senha de app a qualquer momento

## 🆘 Problemas?

**Erro "Invalid login":**
- Verifique se ativou verificação em 2 etapas
- Confirme que copiou a senha de app corretamente
- Use a senha de app, não a senha do Gmail

**Erro "Username and Password not accepted":**
- Senha de app incorreta
- Gere uma nova senha de app

**Emails não chegam:**
- Verifique spam/lixeira
- Confirme o email do destinatário
- Aguarde alguns minutos
