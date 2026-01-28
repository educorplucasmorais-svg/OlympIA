/**
 * 🔐 ADMIN DATABASE PROTECTION
 * Proteção máxima para dados sensíveis do administrador
 * 
 * Segurança:
 * - Criptografia de senhas em hash
 * - Acesso SOMENTE para admins autenticados
 * - Logs de auditória de todas as operações
 * - Proteção contra SQL injection
 * - Rate limiting para tentativas falhadas
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Chave de criptografia (usar variável de ambiente em produção)
const ENCRYPTION_KEY = process.env.ADMIN_ENCRYPTION_KEY || 'your-super-secret-key-change-in-production';

/**
 * Hash seguro de senha usando PBKDF2
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  
  return `${salt}:${hash}`;
}

/**
 * Verificar senha hashada
 */
export function verifyPassword(storedHash, inputPassword) {
  const [salt, originalHash] = storedHash.split(':');
  const inputHash = crypto
    .pbkdf2Sync(inputPassword, salt, 1000, 64, 'sha512')
    .toString('hex');
  
  return inputHash === originalHash;
}

/**
 * Criptografar dados sensíveis
 */
export function encryptData(data) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
  
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
    authTag: authTag.toString('hex')
  };
}

/**
 * Descriptografar dados sensíveis
 */
export function decryptData(encryptedObj) {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(ENCRYPTION_KEY),
    Buffer.from(encryptedObj.iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(encryptedObj.authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedObj.encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return JSON.parse(decrypted);
}

/**
 * Log de auditória - rastrear todas as operações de admin
 */
export function logAuditEvent(adminId, action, details, success = true) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    adminId: adminId,
    action: action,
    details: details,
    success: success,
    ip: '127.0.0.1' // Em produção, obter do request real
  };

  // Salvar em arquivo de log criptografado
  const logPath = path.join(process.cwd(), 'logs', 'admin-audit.log');
  
  try {
    if (!fs.existsSync(path.dirname(logPath))) {
      fs.mkdirSync(path.dirname(logPath), { recursive: true });
    }

    // Criptografar log antes de salvar
    const encryptedLog = encryptData(logEntry);
    
    fs.appendFileSync(
      logPath,
      JSON.stringify(encryptedLog) + '\n'
    );

    console.log(`[AUDIT] ${action} by admin ${adminId}`);
  } catch (error) {
    console.error('[AUDIT] Erro ao salvar log:', error);
  }
}

/**
 * Rate limiter para tentativas falhadas
 */
class LoginAttemptLimiter {
  constructor() {
    this.attempts = new Map(); // { chatId: { count, lastAttempt } }
    this.maxAttempts = 5;
    this.lockoutTime = 15 * 60 * 1000; // 15 minutos
  }

  recordAttempt(chatId, success) {
    if (success) {
      this.attempts.delete(chatId);
      return { allowed: true };
    }

    const now = Date.now();
    const current = this.attempts.get(chatId) || { count: 0, lastAttempt: 0 };

    // Reset após lockout
    if (now - current.lastAttempt > this.lockoutTime) {
      current.count = 0;
    }

    current.count++;
    current.lastAttempt = now;

    this.attempts.set(chatId, current);

    if (current.count >= this.maxAttempts) {
      return {
        allowed: false,
        locked: true,
        lockoutRemaining: this.lockoutTime - (now - current.lastAttempt)
      };
    }

    return {
      allowed: true,
      attemptsRemaining: this.maxAttempts - current.count
    };
  }

  isLocked(chatId) {
    const current = this.attempts.get(chatId);
    if (!current) return false;

    const now = Date.now();
    if (now - current.lastAttempt > this.lockoutTime) {
      this.attempts.delete(chatId);
      return false;
    }

    return current.count >= this.maxAttempts;
  }
}

export const loginLimiter = new LoginAttemptLimiter();

/**
 * Validar dados antes de salvar no banco
 */
export function validateAdminData(data) {
  const errors = [];

  if (!data.name || data.name.length < 3) {
    errors.push('Nome deve ter pelo menos 3 caracteres');
  }

  if (!data.email || !isValidEmail(data.email)) {
    errors.push('Email inválido');
  }

  if (data.password && data.password.length < 8) {
    errors.push('Senha deve ter pelo menos 8 caracteres');
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Validar email
 */
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Sanitizar entrada contra SQL injection
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;

  return input
    .replace(/['"`;]/g, '') // Remove caracteres perigosos
    .trim()
    .substring(0, 255); // Limita tamanho
}

/**
 * Gerar token seguro para autenticação
 */
export function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Proteger campos sensíveis em query result
 */
export function redactSensitiveData(data) {
  const redacted = { ...data };

  // Campos a mascarar
  const sensitiveFields = ['password', 'email', 'phone', 'address'];

  sensitiveFields.forEach(field => {
    if (redacted[field]) {
      redacted[field] = '***REDACTED***';
    }
  });

  return redacted;
}

/**
 * Verificar permissão de acesso
 */
export async function checkAdminPermission(chatId, requiredPermission, isAdmin) {
  if (!isAdmin) {
    logAuditEvent(chatId, `ACCESS_DENIED_${requiredPermission}`, 'Não é admin', false);
    return false;
  }

  logAuditEvent(chatId, `ACCESS_GRANTED_${requiredPermission}`, 'Acesso autorizado', true);
  return true;
}

/**
 * Backup seguro do banco de dados
 */
export async function secureBackupDatabase(db) {
  try {
    const backupPath = path.join(process.cwd(), 'backups');
    
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupPath, `backup-${timestamp}.db`);

    // Copiar arquivo do banco
    fs.copyFileSync(
      path.join(process.cwd(), 'database.sqlite'),
      backupFile
    );

    // Criptografar backup
    const backupData = fs.readFileSync(backupFile);
    const encrypted = encryptData(backupData.toString('base64'));
    
    fs.writeFileSync(
      backupFile + '.enc',
      JSON.stringify(encrypted)
    );

    // Remover backup desencriptado
    fs.unlinkSync(backupFile);

    console.log(`[SECURITY] ✅ Backup criptografado salvo: ${backupFile}.enc`);
    logAuditEvent('SYSTEM', 'DATABASE_BACKUP', 'Backup diário realizado', true);

    return backupFile + '.enc';

  } catch (error) {
    console.error('[SECURITY] ❌ Erro ao fazer backup:', error);
    logAuditEvent('SYSTEM', 'DATABASE_BACKUP', `Erro: ${error.message}`, false);
    throw error;
  }
}

/**
 * Limpar logs antigos (manter últimos 90 dias)
 */
export function cleanOldLogs() {
  try {
    const logPath = path.join(process.cwd(), 'logs', 'admin-audit.log');
    
    if (!fs.existsSync(logPath)) return;

    const lines = fs.readFileSync(logPath, 'utf-8').split('\n');
    const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);

    const recentLogs = lines.filter(line => {
      if (!line.trim()) return true;
      
      try {
        const decrypted = decryptData(JSON.parse(line));
        return new Date(decrypted.timestamp) > ninetyDaysAgo;
      } catch {
        return false;
      }
    });

    fs.writeFileSync(logPath, recentLogs.join('\n'));
    console.log('[SECURITY] ✅ Logs antigos removidos');

  } catch (error) {
    console.error('[SECURITY] ❌ Erro ao limpar logs:', error);
  }
}

/**
 * Verificar integridade do banco de dados
 */
export function verifyDatabaseIntegrity(db) {
  try {
    const result = db.prepare('PRAGMA integrity_check').all();
    
    if (result[0].integrity_check === 'ok') {
      console.log('[SECURITY] ✅ Integridade do banco: OK');
      return true;
    } else {
      console.error('[SECURITY] ❌ Problema na integridade do banco:', result);
      return false;
    }
  } catch (error) {
    console.error('[SECURITY] ❌ Erro ao verificar integridade:', error);
    return false;
  }
}

export default {
  hashPassword,
  verifyPassword,
  encryptData,
  decryptData,
  logAuditEvent,
  loginLimiter,
  validateAdminData,
  sanitizeInput,
  generateSecureToken,
  redactSensitiveData,
  checkAdminPermission,
  secureBackupDatabase,
  cleanOldLogs,
  verifyDatabaseIntegrity
};
