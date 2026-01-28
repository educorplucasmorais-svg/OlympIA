# 🏠 Smart Home Setup - Casa Inteligente com OlympIA

Guia completo para integrar **Home Assistant** com seu bot OlympIA e controlar toda sua casa via Telegram.

## 🚀 Arquitetura

```
Telegram (Celular/Web)
    ↓
OlympIA Bot (Node.js)
    ↓
Home Assistant (Docker - Orquestrador IoT)
    ↓
Dispositivos Inteligentes:
├── Philips Hue (Luzes)
├── Sonos (Som/Speakers)
├── Smart Plugs
└── Câmeras/Sensores
```

---

## 📋 Pré-requisitos

- ✅ OlympIA Bot já instalado e rodando
- ✅ Docker Desktop instalado ([download](https://www.docker.com/products/docker-desktop))
- ✅ Rede local com WiFi (IoT devices)
- ⚠️ IP estático ou DHCP reservation (para sua máquina)

---

## 1️⃣ Instalar Home Assistant (Docker)

### Passo 1: Iniciar Home Assistant

```bash
# Na pasta do Moltbot
docker-compose up -d
```

**O que vai acontecer:**
- Download da imagem Home Assistant (~1GB)
- Mosquitto (MQTT Broker) inicia também
- Serviço fica disponível em: http://localhost:8123

### Passo 2: Acessar Home Assistant

1. Abra no navegador: **http://localhost:8123**
2. Crie sua conta (usuário e senha)
3. Siga o wizard de setup (localização, unidades, etc)

### Passo 3: Gerar Long-Lived Access Token

1. Clique no ícone de **Perfil** (canto inferior esquerdo)
2. Vá até final da página → **Security**
3. Clique em **Create token**
   - Nome: `OlympIA Bot`
   - Copia o token (exemplo: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

4. Cole no arquivo `.env`:
```bash
HOME_ASSISTANT_URL=http://192.168.1.100:8123
HOME_ASSISTANT_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Substitua `192.168.1.100` pelo IP real da sua máquina**

---

## 2️⃣ Adicionar Dispositivos Inteligentes

### Philips Hue (Luzes)

1. Em Home Assistant → **Settings** → **Devices & Services**
2. Clique **Create Automation**
3. Procure **Philips Hue** → Instalar
4. Digite o IP da sua **Hue Bridge** (encontre na app da Philips Hue)
5. Confirme no botão físico da Bridge
6. As luzes vão aparecer automaticamente

**Exemplo de uso:**
```
/casa ligar sala
/casa desligar quarto
/casa alternar varanda
```

### Sonos (Speakers/Música)

1. Settings → Devices & Services
2. Procure **Sonos**
3. Deixe auto-detectar (deve achar automaticamente na rede)
4. Confirme para cada speaker

**Exemplo de uso:**
```
/casa volume sonos_sala 50
/casa volume sonos_quarto 30
```

### Smart Plugs / Tomadas Inteligentes

Se usar **TP-Link Smart Plug**, **Gosund**, etc:

1. Settings → Devices & Services → Procure o modelo
2. Configure WiFi do plug (via app do fabricante)
3. Add to Home Assistant

### Câmeras (Opcional)

1. Settings → Devices & Services
2. Procure sua câmera (Wyze, Reolink, etc)
3. Configure

---

## 3️⃣ Criar Cenas (Automações)

Cenas são grupos de ações que você ativa com um comando.

**Exemplo: Cena "Cinema"**

1. Home Assistant → **Settings** → **Automations & Scenes**
2. **Create Scene**
3. Nome: `cinema`
4. Adicionar dispositivos:
   - Luz sala: 10% (bem baixa)
   - Luz quarto: OFF
   - Sonos: ON
   - Smart plug: OFF (TV standby)
5. Save

**Usar no bot:**
```
/casa cena cinema
```

**Exemplos de cenas úteis:**
- `dormindo` - Todas as luzes OFF, portas trancadas
- `saindo` - Luzes OFF, ar OFF, portas trancadas
- `chegando` - Luzes ON, ar ON
- `trabalhar` - Luz branca 100%, som OFF

---

## 4️⃣ Configurar OlympIA para Casa Inteligente

### Editar `.env`

```bash
# Adicione/atualize:
HOME_ASSISTANT_URL=http://192.168.1.100:8123
HOME_ASSISTANT_TOKEN=seu_token_aqui
```

### Atualizar `telegram-bot.js` (já feito)

Os comandos já estão adicionados. Só testar!

---

## 📱 Usar Casa Inteligente via Telegram

### Comandos Disponíveis

```
/casastatus         - Listar todos os dispositivos
/casaajuda          - Ver ajuda de comandos

# Luzes
/casa ligar sala              - Liga luz
/casa desligar quarto         - Desliga luz
/casa alternar varanda        - Alterna (on/off)

# Cenas (automações)
/casa cena cinema             - Ativa cena cinema
/casa cena dormindo           - Ativa cena dormir
/casa cena saindo             - Ativa ao sair

# Sons/Speakers
/casa volume sonos_sala 50    - Seta volume em 50%
/casa volume sonos_quarto 30  - Seta volume do quarto

# Sensores
/casa sensor temperatura_sala - Lê temperatura
/casa sensor umidade_cozinha  - Lê umidade
```

### Exemplos Práticos

**Ligar lâmpada da mesa de trabalho:**
```
/casa ligar lampada_mesa
Bot responde: 💡 light.lampada_mesa: on
```

**Ativar modo cinema:**
```
/casa cena cinema
Bot responde: 🎬 Cena ativada: cinema
```

**Ajustar som do Sonos:**
```
/casa volume sonos 70
Bot responde: 🔊 Volume de media_player.sonos: 70%
```

**Ver tudo que tem em casa:**
```
/casastatus
Bot mostra: 💡 Luzes, 🔊 Speakers, 📊 Sensores...
```

---

## 🔐 Segurança

### ✅ Boas Práticas

1. **Token seguro**: Use Long-Lived Access Token (não a senha)
2. **Arquivo .env**: Nunca compartilhe, adicione ao `.gitignore`
3. **Rede local**: Home Assistant roda 100% localmente
4. **Firewall**: Bloqueie porta 8123 externamente se possível
5. **Senha forte**: Home Assistant requer boa senha

### ⚠️ NÃO FAÇA

- ❌ Não exponha Home Assistant à internet sem VPN
- ❌ Não compartilhe o token
- ❌ Não coloque .env no GitHub
- ❌ Não use senha fraca no Home Assistant

### 🔒 Acesso Remoto Seguro (Opcional)

Se quiser controlar de fora de casa:

**Opção 1: Tailscale (Recomendado)**
```bash
# Instalar Tailscale no PC
# Isso cria VPN privada
# Acesso: https://seu-tailscale-ip:8123
```

**Opção 2: Home Assistant Cloud**
- Subscrever em `https://www.nabucasa.com/` (~€50/ano)
- Acesso seguro via cloud

**Opção 3: Nginx Reverse Proxy**
- Configure certificado SSL
- Mais técnico, mas totalmente grátis

---

## 🆘 Troubleshooting

### ❌ "Home Assistant não configurado"
**Solução:**
- Verifique `.env`: `HOME_ASSISTANT_URL` e `HOME_ASSISTANT_TOKEN`
- Teste se consegue acessar: `curl http://localhost:8123`

### ❌ "Dispositivo não encontrado"
**Solução:**
- Rodou `/casastatus` para ver a entity_id exata?
- Home Assistant usa entity_id como `light.sala`, não `Sala`
- Use minúsculas!

### ❌ Docker não inicia
**Solução:**
```bash
# Verificar logs
docker-compose logs homeassistant

# Reiniciar
docker-compose restart

# Limpar tudo
docker-compose down -v
docker-compose up -d
```

### ❌ Philips Hue não integra
**Solução:**
- Verifique IP da Bridge (app Hue → Settings → Bridge)
- Pressione botão físico da Bridge
- Try again em Home Assistant

### ❌ Sonos não aparece
**Solução:**
- Sonos precisa estar na mesma rede WiFi
- Reinicie o app Sonos
- Espere 2-3 minutos para auto-descobrir

---

## 🎯 Próximas Ideias

Agora que House inteligente está funcionando:

1. **Automações com horário**
   - Ligar luz automaticamente ao pôr do sol
   - Desligar tudo à noite

2. **Lembretes inteligentes**
   - `/lembrete ligar vidro 21:00` (usa /casa automaticamente)

3. **Histórico de dispositivos**
   - Salvar em SQLite quando foi última vez que ligou algo

4. **Notificações**
   - Enviar alerta se temperatura > 30°C

5. **Google Home / Alexa**
   - Integrar também via Home Assistant

---

## 📚 Links Úteis

- [Home Assistant Docs](https://www.home-assistant.io/)
- [Philips Hue API](https://developers.meethue.com/)
- [Sonos Integração](https://www.home-assistant.io/integrations/sonos/)
- [MQTT em HA](https://www.home-assistant.io/integrations/mqtt/)
- [Automações HA](https://www.home-assistant.io/docs/automation/)

---

**🎉 Pronto! Sua casa agora é controlada pelo Telegram!**

Teste com: `/start` → `/casastatus` → `/casa ligar alguma_luz`
