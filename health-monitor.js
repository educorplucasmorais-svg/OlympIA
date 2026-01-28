/**
 * 🏥 HEALTH MONITOR - Sistema de Monitoramento 24/7
 * 
 * Verifica se o bot está online e respondendo de minuto em minuto
 * Envia alerta por email se detectar problema
 */

import nodemailer from 'nodemailer';

// Configuração de email
const ADMIN_EMAILS = [
  'educorp.lucasmorais@gmail.com',
  'roseamorimgoncalves@gmail.com',
  'samillavs@gmail.com',
  'zeussiqueira@gmail.com'
];

// Estado do monitor
let lastHealthCheck = Date.now();
let consecutiveFailures = 0;
let isAlertSent = false;

/**
 * 🏥 Verificar saúde do bot
 */
export async function checkBotHealth(bot) {
  try {
    // Teste 1: Bot existe?
    if (!bot) {
      throw new Error('Bot não está definido');
    }

    // Teste 3: Banco de dados responde?
    const { getAllUsers } = await import('./database.js');
    const users = await getAllUsers();
    if (users === undefined) {
      throw new Error('Banco de dados não responde');
    }

    // ✅ Tudo OK
    consecutiveFailures = 0;
    lastHealthCheck = Date.now();
    
    // Se tinha enviado alerta, avisar que voltou ao normal
    if (isAlertSent) {
      await sendRecoveryEmail();
      isAlertSent = false;
    }

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      users: users.length
    };

  } catch (error) {
    consecutiveFailures++;
    console.error(`[HEALTH] ❌ Falha #${consecutiveFailures}:`, error.message);

    // Se falhar 3 vezes consecutivas (3 minutos), enviar alerta
    if (consecutiveFailures >= 3 && !isAlertSent) {
      await sendEmergencyAlert(error);
      isAlertSent = true;
    }

    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      consecutiveFailures
    };
  }
}

/**
 * 🚨 Enviar alerta de emergência por email
 */
async function sendEmergencyAlert(error) {
  try {
    console.log('[HEALTH] 🚨 Enviando alerta de emergência...');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const subject = '🚨 ALERTA: OlympIA Bot Offline!';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
          .container { background: white; border-radius: 8px; padding: 30px; max-width: 600px; margin: 0 auto; }
          .alert { background: #ff4444; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .alert h1 { margin: 0 0 10px 0; font-size: 24px; }
          .details { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .detail-item { margin: 10px 0; }
          .detail-label { font-weight: bold; color: #333; }
          .detail-value { color: #666; font-family: monospace; }
          .actions { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; color: #999; margin-top: 30px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="alert">
            <h1>🚨 OlympIA Bot Offline!</h1>
            <p>O bot parou de responder após 3 verificações consecutivas.</p>
          </div>

          <div class="details">
            <h3>📋 Detalhes do Problema:</h3>
            
            <div class="detail-item">
              <span class="detail-label">⏰ Horário do Alerta:</span>
              <span class="detail-value">${new Date().toLocaleString('pt-BR')}</span>
            </div>

            <div class="detail-item">
              <span class="detail-label">❌ Erro Detectado:</span>
              <span class="detail-value">${error.message}</span>
            </div>

            <div class="detail-item">
              <span class="detail-label">🔄 Falhas Consecutivas:</span>
              <span class="detail-value">${consecutiveFailures} tentativas</span>
            </div>

            <div class="detail-item">
              <span class="detail-label">⏱️ Última Verificação OK:</span>
              <span class="detail-value">${new Date(lastHealthCheck).toLocaleString('pt-BR')}</span>
            </div>

            <div class="detail-item">
              <span class="detail-label">💻 Uptime Antes da Falha:</span>
              <span class="detail-value">${Math.floor(process.uptime() / 60)} minutos</span>
            </div>
          </div>

          <div class="actions">
            <h3>🛠️ Ações Recomendadas:</h3>
            <ol>
              <li>Verificar se o servidor está rodando</li>
              <li>Checar logs: <code>tail -f logs/admin-audit.log</code></li>
              <li>Reiniciar bot: <code>node telegram-bot.js</code></li>
              <li>Verificar conexão MCP</li>
              <li>Testar banco de dados</li>
            </ol>
          </div>

          <div class="footer">
            <p>Este é um alerta automático do sistema de monitoramento OlympIA Bot.</p>
            <p>Você receberá outro email quando o bot voltar ao normal.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Enviar para todos os admins
    for (const email of ADMIN_EMAILS) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject,
        html
      });
    }

    console.log('[HEALTH] ✅ Alerta enviado para', ADMIN_EMAILS.length, 'admins');

  } catch (emailError) {
    console.error('[HEALTH] ❌ Erro ao enviar alerta:', emailError.message);
  }
}

/**
 * ✅ Enviar email de recuperação
 */
async function sendRecoveryEmail() {
  try {
    console.log('[HEALTH] ✅ Enviando email de recuperação...');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const subject = '✅ OlympIA Bot Voltou ao Normal';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
          .container { background: white; border-radius: 8px; padding: 30px; max-width: 600px; margin: 0 auto; }
          .success { background: #4CAF50; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .success h1 { margin: 0 0 10px 0; font-size: 24px; }
          .details { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #999; margin-top: 30px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success">
            <h1>✅ Bot Voltou ao Normal!</h1>
            <p>O OlympIA Bot está respondendo novamente.</p>
          </div>

          <div class="details">
            <p><strong>⏰ Horário da Recuperação:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            <p><strong>⏱️ Downtime:</strong> ~${consecutiveFailures} minutos</p>
            <p><strong>✅ Status:</strong> Operacional</p>
          </div>

          <div class="footer">
            <p>Sistema de monitoramento OlympIA Bot</p>
          </div>
        </div>
      </body>
      </html>
    `;

    for (const email of ADMIN_EMAILS) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject,
        html
      });
    }

    console.log('[HEALTH] ✅ Email de recuperação enviado');

  } catch (error) {
    console.error('[HEALTH] ❌ Erro ao enviar email de recuperação:', error.message);
  }
}

/**
 * 🔄 Iniciar monitoramento contínuo
 */
export function startHealthMonitoring(bot) {
  console.log('[HEALTH] 🏥 Iniciando monitoramento de saúde...');
  console.log('[HEALTH] 📊 Verificação a cada 1 minuto');
  console.log('[HEALTH] 🚨 Alerta após 3 falhas consecutivas');

  // Verificação inicial
  checkBotHealth(bot);

  // Verificar a cada 1 minuto (60000ms)
  setInterval(async () => {
    const health = await checkBotHealth(bot);
    
    if (health.status === 'healthy') {
      console.log(`[HEALTH] ✅ Bot OK | Uptime: ${Math.floor(health.uptime / 60)}min | Users: ${health.users}`);
    } else {
      console.error(`[HEALTH] ❌ Bot com problemas | Falhas: ${health.consecutiveFailures}`);
    }
  }, 60000); // 1 minuto

  console.log('[HEALTH] ✅ Monitoramento ativado com sucesso!');
}

/**
 * 📊 Obter status atual do monitoramento
 */
export function getHealthStatus() {
  return {
    lastCheck: new Date(lastHealthCheck).toISOString(),
    consecutiveFailures,
    isAlertSent,
    uptime: process.uptime()
  };
}

export default {
  checkBotHealth,
  startHealthMonitoring,
  getHealthStatus
};
