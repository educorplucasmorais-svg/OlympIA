import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Criar/abrir banco de dados
const db = new Database(path.join(__dirname, 'users.db'));

// Habilitar chaves estrangeiras
db.pragma('foreign_keys = ON');

/**
 * INICIALIZAR BANCO DE DADOS
 * Cria as tabelas se não existirem
 */
export function initializeDatabase() {
  try {
    // Tabela de usuários
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id INTEGER UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME DEFAULT CURRENT_TIMESTAMP,
        login_count INTEGER DEFAULT 1,
        status TEXT DEFAULT 'active'
      );

      CREATE INDEX IF NOT EXISTS idx_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_chat_id ON users(chat_id);
    `);

    // Tabela de logs de login
    db.exec(`
      CREATE TABLE IF NOT EXISTS login_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        chat_id INTEGER NOT NULL,
        login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT,
        status TEXT DEFAULT 'success',
        FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE INDEX IF NOT EXISTS idx_user_id ON login_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_login_time ON login_logs(login_time);
    `);

    // Tabela de comandos utilizados pelos usuários
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_commands (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        chat_id INTEGER NOT NULL,
        command_name TEXT NOT NULL,
        command_description TEXT,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        execution_time_ms INTEGER,
        status TEXT DEFAULT 'success',
        parameters TEXT,
        response_length INTEGER,
        error_message TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );

      CREATE INDEX IF NOT EXISTS idx_command_user_id ON user_commands(user_id);
      CREATE INDEX IF NOT EXISTS idx_command_name ON user_commands(command_name);
      CREATE INDEX IF NOT EXISTS idx_executed_at ON user_commands(executed_at);
      CREATE INDEX IF NOT EXISTS idx_command_status ON user_commands(status);
    `);

    console.log('✅ Banco de dados inicializado com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    return false;
  }
}

/**
 * REGISTRAR NOVO USUÁRIO
 */
export function registerUser(chatId, name, email) {
  try {
    const stmt = db.prepare(`
      INSERT INTO users (chat_id, name, email, login_count)
      VALUES (?, ?, ?, 1)
    `);
    
    const result = stmt.run(chatId, name, email);
    
    // Registrar log de login
    registerLoginLog(result.lastInsertRowid, chatId, 'success');
    
    return {
      success: true,
      message: '✅ Cadastro realizado com sucesso!',
      userId: result.lastInsertRowid
    };
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed: users.email')) {
      return {
        success: false,
        message: '❌ Este email já está cadastrado!'
      };
    }
    if (error.message.includes('UNIQUE constraint failed: users.chat_id')) {
      return {
        success: false,
        message: '❌ Você já tem um cadastro em nosso sistema!'
      };
    }
    console.error('Erro ao registrar usuário:', error);
    return {
      success: false,
      message: '❌ Erro ao registrar: ' + error.message
    };
  }
}

/**
 * FAZER LOGIN
 */
export function loginUser(chatId, email) {
  try {
    // Buscar usuário por email
    const stmt = db.prepare(`
      SELECT * FROM users WHERE email = ? AND status = 'active'
    `);
    
    const user = stmt.get(email);
    
    if (!user) {
      return {
        success: false,
        message: '❌ Email não encontrado em nosso sistema!'
      };
    }

    // Verificar se o chat_id é o mesmo
    if (user.chat_id !== chatId) {
      return {
        success: false,
        message: '⚠️ Este email está registrado em outra conta!'
      };
    }

    // Atualizar último login e contador
    const updateStmt = db.prepare(`
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP, login_count = login_count + 1
      WHERE id = ?
    `);
    
    updateStmt.run(user.id);
    
    // Registrar log de login
    registerLoginLog(user.id, chatId, 'success');

    return {
      success: true,
      message: `✅ Bem-vindo, ${user.name}! 👋`,
      user: user
    };
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return {
      success: false,
      message: '❌ Erro ao fazer login: ' + error.message
    };
  }
}

/**
 * BUSCAR USUÁRIO POR CHAT_ID
 */
export function getUserByChatId(chatId) {
  try {
    const stmt = db.prepare('SELECT * FROM users WHERE chat_id = ?');
    return stmt.get(chatId);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return null;
  }
}

/**
 * BUSCAR USUÁRIO POR EMAIL
 */
export function getUserByEmail(email) {
  try {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return null;
  }
}

/**
 * REGISTRAR LOG DE LOGIN
 */
export function registerLoginLog(userId, chatId, status = 'success') {
  try {
    const stmt = db.prepare(`
      INSERT INTO login_logs (user_id, chat_id, status)
      VALUES (?, ?, ?)
    `);
    
    stmt.run(userId, chatId, status);
    return true;
  } catch (error) {
    console.error('Erro ao registrar log de login:', error);
    return false;
  }
}

/**
 * LISTAR TODOS OS USUÁRIOS
 */
export function getAllUsers() {
  try {
    const stmt = db.prepare(`
      SELECT 
        id, chat_id, name, email, 
        created_at, last_login, login_count, status
      FROM users
      ORDER BY created_at DESC
    `);
    
    return stmt.all();
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return [];
  }
}

/**
 * OBTER ESTATÍSTICAS DE USUÁRIOS
 */
export function getUserStats() {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const activeUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE status = "active"').get();
    const loginLogs = db.prepare('SELECT COUNT(*) as count FROM login_logs').get();
    const todayLogins = db.prepare(`
      SELECT COUNT(*) as count FROM login_logs 
      WHERE DATE(login_time) = DATE('now')
    `).get();

    return {
      totalUsers: totalUsers.count,
      activeUsers: activeUsers.count,
      totalLogins: loginLogs.count,
      loginsToday: todayLogins.count
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalLogins: 0,
      loginsToday: 0
    };
  }
}

/**
 * LISTAR LOGS DE LOGIN DE UM USUÁRIO
 */
export function getUserLoginHistory(userId, limit = 10) {
  try {
    const stmt = db.prepare(`
      SELECT * FROM login_logs 
      WHERE user_id = ? 
      ORDER BY login_time DESC 
      LIMIT ?
    `);
    
    return stmt.all(userId, limit);
  } catch (error) {
    console.error('Erro ao obter histórico de login:', error);
    return [];
  }
}

/**
 * ATUALIZAR DADOS DO USUÁRIO
 */
export function updateUser(userId, updates) {
  try {
    const allowedFields = ['name', 'email', 'status'];
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return false;

    values.push(userId);
    const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
    
    stmt.run(...values);
    return true;
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return false;
  }
}

/**
 * DELETAR USUÁRIO
 */
export function deleteUser(userId) {
  try {
    // Deletar logs de login primeiro
    db.prepare('DELETE FROM login_logs WHERE user_id = ?').run(userId);
    
    // Deletar usuário
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    
    return true;
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return false;
  }
}

/**
 * EXPORTAR BANCO DE DADOS COMO JSON
 */
export function exportDatabaseAsJSON() {
  try {
    const users = getAllUsers();
    const stats = getUserStats();

    const data = {
      exportedAt: new Date().toISOString(),
      statistics: stats,
      users: users
    };

    return data;
  } catch (error) {
    console.error('Erro ao exportar banco de dados:', error);
    return null;
  }
}

/**
 * REGISTRAR COMANDO UTILIZADO
 */
export function registerCommand(userId, chatId, commandName, commandDescription = '', executionTimeMs = 0, status = 'success', parameters = null, responseLength = 0, errorMessage = null) {
  try {
    const stmt = db.prepare(`
      INSERT INTO user_commands 
      (user_id, chat_id, command_name, command_description, execution_time_ms, status, parameters, response_length, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      userId, 
      chatId, 
      commandName, 
      commandDescription,
      executionTimeMs,
      status,
      parameters ? JSON.stringify(parameters) : null,
      responseLength,
      errorMessage
    );
    
    return {
      success: true,
      commandId: result.lastInsertRowid
    };
  } catch (error) {
    console.error('Erro ao registrar comando:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * OBTER HISTÓRICO DE COMANDOS DE UM USUÁRIO
 */
export function getUserCommandHistory(userId, limit = 50) {
  try {
    const stmt = db.prepare(`
      SELECT 
        id, user_id, chat_id, command_name, command_description,
        executed_at, execution_time_ms, status, response_length
      FROM user_commands 
      WHERE user_id = ? 
      ORDER BY executed_at DESC 
      LIMIT ?
    `);
    
    return stmt.all(userId, limit);
  } catch (error) {
    console.error('Erro ao obter histórico de comandos:', error);
    return [];
  }
}

/**
 * OBTER COMANDOS MAIS UTILIZADOS
 */
export function getMostUsedCommands(limit = 10, days = 30) {
  try {
    const stmt = db.prepare(`
      SELECT 
        command_name,
        COUNT(*) as total_uses,
        AVG(execution_time_ms) as avg_execution_time,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_count
      FROM user_commands 
      WHERE executed_at > datetime('now', '-' || ? || ' days')
      GROUP BY command_name 
      ORDER BY total_uses DESC 
      LIMIT ?
    `);
    
    return stmt.all(days, limit);
  } catch (error) {
    console.error('Erro ao obter comandos mais utilizados:', error);
    return [];
  }
}

/**
 * OBTER ESTATÍSTICAS DE COMANDOS POR USUÁRIO
 */
export function getCommandStatsByUser(limit = 20) {
  try {
    const stmt = db.prepare(`
      SELECT 
        u.id,
        u.name,
        u.email,
        COUNT(uc.id) as total_commands,
        COUNT(DISTINCT uc.command_name) as unique_commands,
        SUM(CASE WHEN uc.status = 'success' THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN uc.status = 'error' THEN 1 ELSE 0 END) as failed,
        AVG(uc.execution_time_ms) as avg_execution_time,
        MAX(uc.executed_at) as last_command_time
      FROM users u
      LEFT JOIN user_commands uc ON u.id = uc.user_id
      WHERE u.status = 'active'
      GROUP BY u.id
      ORDER BY total_commands DESC
      LIMIT ?
    `);
    
    return stmt.all(limit);
  } catch (error) {
    console.error('Erro ao obter estatísticas de comandos por usuário:', error);
    return [];
  }
}

/**
 * OBTER RELATÓRIO COMPLETO POR USUÁRIO (COM TODOS OS COMANDOS)
 */
export function getUserFullReport(userId) {
  try {
    const userStmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const user = userStmt.get(userId);

    if (!user) return null;

    const commandsStmt = db.prepare(`
      SELECT 
        command_name,
        COUNT(*) as count,
        AVG(execution_time_ms) as avg_time,
        MAX(executed_at) as last_used
      FROM user_commands 
      WHERE user_id = ?
      GROUP BY command_name
      ORDER BY count DESC
    `);

    const commandStats = commandsStmt.all(userId);

    const historyStmt = db.prepare(`
      SELECT * FROM user_commands 
      WHERE user_id = ? 
      ORDER BY executed_at DESC
    `);

    const fullHistory = historyStmt.all(userId);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
        last_login: user.last_login,
        login_count: user.login_count
      },
      commandSummary: {
        total_commands: fullHistory.length,
        unique_commands: commandStats.length,
        success_rate: fullHistory.length > 0 
          ? ((fullHistory.filter(c => c.status === 'success').length / fullHistory.length) * 100).toFixed(2) + '%'
          : '0%'
      },
      commandsByType: commandStats,
      recentActivity: fullHistory.slice(0, 20)
    };
  } catch (error) {
    console.error('Erro ao gerar relatório do usuário:', error);
    return null;
  }
}

/**
 * GERAR RELATÓRIO ANALÍTICO COMPLETO
 */
export function generateCompleteReport(days = 30) {
  try {
    const reportDate = new Date().toISOString();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Usuários ativos no período
    const activeUsersStmt = db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count FROM user_commands 
      WHERE executed_at > datetime('now', '-' || ? || ' days')
    `);
    const activeUsers = activeUsersStmt.get(days);

    // Total de comandos
    const totalCommandsStmt = db.prepare(`
      SELECT COUNT(*) as count FROM user_commands 
      WHERE executed_at > datetime('now', '-' || ? || ' days')
    `);
    const totalCommands = totalCommandsStmt.get(days);

    // Taxa de sucesso
    const successRateStmt = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful
      FROM user_commands 
      WHERE executed_at > datetime('now', '-' || ? || ' days')
    `);
    const successData = successRateStmt.get(days);
    const successRate = successData.total > 0 
      ? ((successData.successful / successData.total) * 100).toFixed(2)
      : 0;

    // Top 10 comandos
    const topCommandsStmt = db.prepare(`
      SELECT 
        command_name,
        COUNT(*) as uses,
        AVG(execution_time_ms) as avg_time
      FROM user_commands 
      WHERE executed_at > datetime('now', '-' || ? || ' days')
      GROUP BY command_name 
      ORDER BY uses DESC 
      LIMIT 10
    `);
    const topCommands = topCommandsStmt.all(days);

    // Top 10 usuários mais ativos
    const topUsersStmt = db.prepare(`
      SELECT 
        u.name,
        u.email,
        COUNT(uc.id) as command_count,
        COUNT(DISTINCT uc.command_name) as unique_commands
      FROM users u
      LEFT JOIN user_commands uc ON u.id = uc.user_id 
        AND uc.executed_at > datetime('now', '-' || ? || ' days')
      WHERE u.status = 'active'
      GROUP BY u.id
      ORDER BY command_count DESC
      LIMIT 10
    `);
    const topUsers = topUsersStmt.all(days);

    // Comandos por hora do dia
    const commandsByHourStmt = db.prepare(`
      SELECT 
        strftime('%H', executed_at) as hour,
        COUNT(*) as count
      FROM user_commands 
      WHERE executed_at > datetime('now', '-' || ? || ' days')
      GROUP BY hour
      ORDER BY hour
    `);
    const commandsByHour = commandsByHourStmt.all(days);

    return {
      reportDate,
      period: {
        days,
        startDate,
        endDate: reportDate
      },
      overview: {
        totalUsers: activeUsers.count,
        totalCommands: totalCommands.count,
        successRate: successRate + '%',
        averageCommandsPerUser: totalCommands.count > 0 && activeUsers.count > 0
          ? (totalCommands.count / activeUsers.count).toFixed(2)
          : 0
      },
      topCommands,
      topUsers,
      commandsByHour
    };
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    return null;
  }
}

/**
 * EXPORTAR RELATÓRIO COMO JSON
 */
export function exportReportAsJSON(days = 30) {
  try {
    const report = generateCompleteReport(days);
    return {
      success: true,
      data: report
    };
  } catch (error) {
    console.error('Erro ao exportar relatório:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * FECHAR CONEXÃO COM BANCO DE DADOS
 */
export function closeDatabase() {
  try {
    db.close();
    console.log('✅ Banco de dados fechado');
    return true;
  } catch (error) {
    console.error('Erro ao fechar banco de dados:', error);
    return false;
  }
}

export default db;
