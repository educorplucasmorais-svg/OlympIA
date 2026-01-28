# 📊 SISTEMA DE RASTREAMENTO DE COMANDOS

## 📋 Visão Geral

Um banco de dados completo e estruturado para rastrear:
- ✅ Data/Hora de cada comando
- ✅ Nome do usuário
- ✅ Email do usuário
- ✅ Comandos executados
- ✅ Tempo de execução
- ✅ Status de sucesso/erro

## 🗄️ Estrutura do Banco de Dados

### Tabela: `users`
Armazena informações dos usuários

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  chat_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at DATETIME,
  last_login DATETIME,
  login_count INTEGER,
  status TEXT
);
```

### Tabela: `user_commands`
Rastreia todos os comandos executados

```sql
CREATE TABLE user_commands (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,              -- Referência ao usuário
  chat_id INTEGER,              -- ID do Telegram
  command_name TEXT,            -- Nome do comando (/gerar, /imagem, etc)
  command_description TEXT,     -- Descrição do comando
  executed_at DATETIME,         -- Data/hora da execução
  execution_time_ms INTEGER,    -- Tempo de execução em ms
  status TEXT,                  -- 'success' ou 'error'
  parameters TEXT,              -- Parâmetros JSON
  response_length INTEGER,      -- Tamanho da resposta
  error_message TEXT            -- Mensagem de erro (se houver)
);
```

## 🎯 Principais Funções

### 1. Registrar um Comando
```javascript
import { registerCommand } from './database.js';

registerCommand(
  userId,                    // ID do usuário
  chatId,                    // ID do chat Telegram
  '/gerar',                  // Nome do comando
  'Gerar conteúdo com IA',  // Descrição
  1250,                      // Tempo em ms
  'success',                 // Status
  { param1: 'valor' },       // Parâmetros (opcional)
  2500,                      // Tamanho da resposta (opcional)
  null                       // Mensagem de erro (opcional)
);
```

### 2. Obter Histórico de Comandos de um Usuário
```javascript
import { getUserCommandHistory } from './database.js';

const history = getUserCommandHistory(userId, 50); // Últimos 50 comandos
history.forEach(cmd => {
  console.log(`${cmd.command_name} - ${cmd.executed_at}`);
});
```

### 3. Obter Comandos Mais Utilizados
```javascript
import { getMostUsedCommands } from './database.js';

const topCommands = getMostUsedCommands(10, 30); // Top 10 dos últimos 30 dias
topCommands.forEach(cmd => {
  console.log(`${cmd.command_name}: ${cmd.total_uses} usos`);
});
```

### 4. Gerar Relatório Completo
```javascript
import { generateCompleteReport } from './database.js';

const report = generateCompleteReport(30); // Relatório dos últimos 30 dias
console.log(`Usuários ativos: ${report.overview.totalUsers}`);
console.log(`Total de comandos: ${report.overview.totalCommands}`);
console.log(`Taxa de sucesso: ${report.overview.successRate}`);
```

### 5. Gerar Relatório por Usuário
```javascript
import { getUserFullReport } from './database.js';

const userReport = getUserFullReport(userId);
console.log(`Nome: ${userReport.user.name}`);
console.log(`Email: ${userReport.user.email}`);
console.log(`Total de comandos: ${userReport.commandSummary.total_commands}`);
```

## 📈 Uso com CommandTracker (Automático)

```javascript
import commandTracker from './command-tracker.js';

// Forma 1: Rastreamento manual
const tracker = await commandTracker.logCommand(
  chatId,
  '/gerar',
  'Gerar conteúdo com IA',
  { tema: 'marketing' }
);

// ... executar comando ...

tracker.complete('success', null, responseLength);

// Forma 2: Rastreamento automático
const result = await commandTracker.executeWithTracking(
  chatId,
  '/gerar',
  'Gerar conteúdo com IA',
  async () => {
    // Seu código do comando aqui
    return 'Resultado do comando';
  },
  { param: 'valor' }
);
```

## 📊 Uso com ReportGenerator

```javascript
import reportGenerator from './report-generator.js';

// Gerar relatório em texto
const textReport = reportGenerator.generateTextReport(30);
console.log(textReport);

// Gerar relatório em CSV
const csvReport = reportGenerator.generateCSVReport(30);

// Gerar estatísticas rápidas
const stats = reportGenerator.getQuickStats();
console.log(stats);

// Gerar todos os relatórios e salvar
reportGenerator.generateAllReports(30);
```

## 🧪 Teste o Sistema

Execute o script de teste:

```bash
node test-command-tracking.js
```

Isso irá:
1. ✅ Criar o banco de dados
2. ✅ Registrar 3 usuários de teste
3. ✅ Simular 13 comandos
4. ✅ Gerar relatórios completos
5. ✅ Salvar relatórios em txt, csv e json

Os relatórios estarão na pasta `/reports`

## 📁 Estrutura de Arquivos

```
Moltbot/
├── database.js                  # Funções de banco de dados
├── command-tracker.js           # Rastreador de comandos
├── report-generator.js          # Gerador de relatórios
├── test-command-tracking.js     # Script de teste
├── users.db                     # Banco de dados SQLite
└── reports/                     # Pasta com relatórios gerados
    ├── relatorio-completo-*.txt
    ├── relatorio-completo-*.csv
    └── relatorio-completo-*.json
```

## 🔍 Exemplo de Relatório Gerado

```
╔════════════════════════════════════════╗
║    RELATÓRIO COMPLETO DE ATIVIDADES    ║
╚════════════════════════════════════════╝

📅 PERÍODO: 30 dias
📆 Data do Relatório: 28/01/2026 14:30:45

────────────────────────────────────────
📊 VISÃO GERAL
────────────────────────────────────────
👥 Usuários Ativos: 3
⚡ Total de Comandos: 42
✅ Taxa de Sucesso: 95.24%
📈 Média de Comandos por Usuário: 14.00

────────────────────────────────────────
🔥 TOP 10 COMANDOS MAIS UTILIZADOS
────────────────────────────────────────
1. /gerar
   └─ Usos: 8 | ⏱️ Tempo médio: 1215.00ms

2. /marketing
   └─ Usos: 3 | ⏱️ Tempo médio: 2075.00ms

3. /conhecimento
   └─ Usos: 2 | ⏱️ Tempo médio: 2225.00ms
```

## 🚀 Integração no telegram-bot.js

Para integrar com o seu bot, adicione no início:

```javascript
import commandTracker from './command-tracker.js';
import reportGenerator from './report-generator.js';
```

E ao executar cada comando:

```javascript
const tracker = await commandTracker.logCommand(
  msg.chat.id,
  '/comando_aqui',
  'Descrição do comando'
);

// ... executar lógica ...

tracker.complete('success', null, resultado.length);
```

## 📊 Consultas SQL Úteis

### Todos os comandos de um usuário
```sql
SELECT * FROM user_commands 
WHERE user_id = 1 
ORDER BY executed_at DESC;
```

### Comandos mais utilizados no mês
```sql
SELECT command_name, COUNT(*) as total
FROM user_commands 
WHERE executed_at > datetime('now', '-30 days')
GROUP BY command_name
ORDER BY total DESC;
```

### Taxa de sucesso por comando
```sql
SELECT command_name,
       COUNT(*) as total,
       SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as sucesso,
       ROUND(100.0 * SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*), 2) as taxa_sucesso
FROM user_commands 
GROUP BY command_name;
```

### Usuários mais ativos
```sql
SELECT u.name, u.email, COUNT(uc.id) as total_comandos
FROM users u
LEFT JOIN user_commands uc ON u.id = uc.user_id
GROUP BY u.id
ORDER BY total_comandos DESC;
```

## ✅ Checklist de Implementação

- [x] Tabela de usuários criada
- [x] Tabela de comandos criada
- [x] Funções de registro de comandos
- [x] Funções de geração de relatórios
- [x] CommandTracker para rastreamento automático
- [x] ReportGenerator para gerar relatórios formatados
- [x] Script de teste
- [x] Documentação completa

## 🎯 Próximos Passos

1. Integrar `commandTracker` em todos os comandos do telegram-bot.js
2. Criar endpoint API para consultar relatórios
3. Adicionar visualização de gráficos
4. Criar dashboard em tempo real
5. Exportar relatórios via email

---

**Desenvolvido para análise e gestão de uso de comandos no Moltbot** 📊
