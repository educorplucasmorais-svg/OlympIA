# 🚀 Quick Start - Casa Inteligente + PDF

Você pediu 3 coisas. Aqui tá tudo pronto:

## ✅ 1. Home Assistant (Docker)

```bash
# Iniciar Home Assistant + MQTT
docker-compose up -d

# Acessar em: http://localhost:8123
```

**Próximos passos:**
1. Criar conta em http://localhost:8123
2. Profile → Security → Create token (copiar)
3. Colar token no `.env`:
   ```
   HOME_ASSISTANT_TOKEN=seu_token_aqui
   ```

Documentação completa: [SMART-HOME-SETUP.md](SMART-HOME-SETUP.md)

---

## ✅ 2. Segurança com .env

Arquivo `.env` criado com:
- TELEGRAM_TOKEN (já preenchido)
- HOME_ASSISTANT_URL + TOKEN
- EMAIL credentials
- API keys (Groq, NewsAPI, etc)

⚠️ **Arquivo está em .gitignore - NUNCA vai ao GitHub!**

---

## ✅ 3. Gerar PDF

Novo comando adicionado:

```
/pdf Meu Documento
```

Gera PDF com título e envia no Telegram!

---

## 🏠 Novos Comandos (17 total agora)

### Casa Inteligente
```
/casastatus          - Ver todos os dispositivos
/casa ligar sala     - Ligar luz
/casa desligar luz   - Desligar luz
/casa cena cinema    - Ativar cena
/casa volume sonos 50 - Ajustar som
/casaajuda           - Ver ajuda completa
```

### PDF
```
/pdf Relatório Mensal - Gera PDF
```

---

## 📊 Arquitetura Atual

```
├── telegram-bot.js         (Bot principal - 17 comandos)
├── home-automation.js      (Novo - Integração Home Assistant)
├── index.js               (MCP Server - Groq AI)
├── .env                   (Novo - Variáveis de ambiente)
├── docker-compose.yml     (Novo - Home Assistant)
├── .gitignore             (Novo - Protege .env)
└── Documentação
    ├── README.md
    ├── TELEGRAM-SETUP.md  (Atualizado)
    ├── EMAIL-SETUP.md
    ├── FACESWAP-SETUP.md
    └── SMART-HOME-SETUP.md (NOVO)
```

---

## 🎯 O que foi Feito

| Item | Status | Detalhes |
|------|--------|----------|
| **Home Assistant (Docker)** | ✅ | docker-compose.yml pronto, documentação em SMART-HOME-SETUP.md |
| **.env seguro** | ✅ | Todas as credenciais centralizadas, .gitignore protege |
| **Geração de PDF** | ✅ | Comando `/pdf <título>` implementado com pdfkit |
| **Integração Casa** | ✅ | home-automation.js + 6 comandos `/casa*` |
| **Documentação** | ✅ | SMART-HOME-SETUP.md com 50+ linhas de guia |

---

## 🔧 Para Começar

### 1. Ativar Home Assistant
```bash
docker-compose up -d
# Acessar http://localhost:8123
```

### 2. Gerar token e configurar .env
```bash
# Em .env, completar:
HOME_ASSISTANT_URL=http://192.168.1.XXX:8123
HOME_ASSISTANT_TOKEN=seu_token_longo_aqui
```

### 3. Testar no Telegram
```
/casastatus      # Deve listar dispositivos
/pdf Teste       # Deve gerar PDF
```

---

## 💡 Próximas Ideias

1. **Automações com horário**: `/lembrete ligar tv 19:00`
2. **Alertas**: Notificação se temperatura alta
3. **Histórico**: Salvar em BD quando acionou dispositivos
4. **Voz**: "Alexa, peça ao bot para ligar a luz"
5. **Grafos**: Dashboard com consumo de energia

---

## 📚 Links Importantes

- [Guia Home Assistant](SMART-HOME-SETUP.md) - 100% português
- [Philips Hue Docs](https://developers.meethue.com/)
- [Sonos Integration](https://www.home-assistant.io/integrations/sonos/)
- [Home Assistant](https://www.home-assistant.io/)

---

**🎉 Tudo pronto! Bot rodando com 17 comandos + Casa Inteligente**
