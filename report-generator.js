import {
  getCommandStatsByUser,
  getUserFullReport,
  generateCompleteReport,
  getMostUsedCommands,
  getUserCommandHistory
} from './database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * GERADOR DE RELATÓRIOS
 * Cria relatórios em diferentes formatos
 */

class ReportGenerator {
  
  /**
   * Gera relatório formatado em texto
   */
  generateTextReport(days = 30) {
    const report = generateCompleteReport(days);
    
    let text = `
╔════════════════════════════════════════╗
║    RELATÓRIO COMPLETO DE ATIVIDADES    ║
╚════════════════════════════════════════╝

📅 PERÍODO: ${report.period.days} dias
📆 Data do Relatório: ${new Date(report.reportDate).toLocaleString('pt-BR')}

────────────────────────────────────────
📊 VISÃO GERAL
────────────────────────────────────────
👥 Usuários Ativos: ${report.overview.totalUsers}
⚡ Total de Comandos: ${report.overview.totalCommands}
✅ Taxa de Sucesso: ${report.overview.successRate}
📈 Média de Comandos por Usuário: ${report.overview.averageCommandsPerUser}

────────────────────────────────────────
🔥 TOP 10 COMANDOS MAIS UTILIZADOS
────────────────────────────────────────
    `;
    
    report.topCommands.forEach((cmd, index) => {
      text += `\n${index + 1}. ${cmd.command_name}
   └─ Usos: ${cmd.uses} | ⏱️ Tempo médio: ${cmd.avg_time?.toFixed(2) || 0}ms`;
    });

    text += `\n\n────────────────────────────────────────
👨‍💻 TOP 10 USUÁRIOS MAIS ATIVOS
────────────────────────────────────────
    `;
    
    report.topUsers.forEach((user, index) => {
      text += `\n${index + 1}. ${user.name} (${user.email})
   └─ Comandos: ${user.command_count} | Tipos: ${user.unique_commands}`;
    });

    text += `\n\n────────────────────────────────────────
📈 DISTRIBUIÇÃO POR HORA DO DIA
────────────────────────────────────────
    `;
    
    report.commandsByHour.forEach((hour) => {
      const barLength = Math.floor(hour.count / 5);
      const bar = '█'.repeat(barLength || 1);
      text += `\n${hour.hour}h: ${bar} (${hour.count})`;
    });

    text += `\n\n════════════════════════════════════════\n`;
    
    return text;
  }

  /**
   * Gera relatório em CSV
   */
  generateCSVReport(days = 30) {
    const report = generateCompleteReport(days);
    
    let csv = 'Métrica,Valor\n';
    csv += `Período (dias),${report.period.days}\n`;
    csv += `Data do Relatório,${report.reportDate}\n`;
    csv += `Usuários Ativos,${report.overview.totalUsers}\n`;
    csv += `Total de Comandos,${report.overview.totalCommands}\n`;
    csv += `Taxa de Sucesso,${report.overview.successRate}\n`;
    csv += `Média de Comandos por Usuário,${report.overview.averageCommandsPerUser}\n\n`;
    
    csv += 'Comando,Usos,Tempo Médio (ms)\n';
    report.topCommands.forEach(cmd => {
      csv += `"${cmd.command_name}",${cmd.uses},${cmd.avg_time?.toFixed(2) || 0}\n`;
    });
    
    csv += '\nUsuário,Email,Comandos,Tipos Únicos\n';
    report.topUsers.forEach(user => {
      csv += `"${user.name}","${user.email}",${user.command_count},${user.unique_commands}\n`;
    });
    
    return csv;
  }

  /**
   * Gera relatório por usuário
   */
  generateUserReport(userId) {
    const report = getUserFullReport(userId);
    
    if (!report) {
      return '❌ Usuário não encontrado';
    }

    let text = `
╔════════════════════════════════════════╗
║        RELATÓRIO DO USUÁRIO            ║
╚════════════════════════════════════════╝

👤 INFORMAÇÕES DO USUÁRIO
────────────────────────────────────────
Nome: ${report.user.name}
Email: ${report.user.email}
Cadastrado em: ${new Date(report.user.created_at).toLocaleString('pt-BR')}
Último acesso: ${new Date(report.user.last_login).toLocaleString('pt-BR')}
Total de acessos: ${report.user.login_count}

📊 RESUMO DE COMANDOS
────────────────────────────────────────
Total de Comandos Executados: ${report.commandSummary.total_commands}
Tipos Únicos de Comandos: ${report.commandSummary.unique_commands}
Taxa de Sucesso: ${report.commandSummary.success_rate}

🔥 COMANDOS MAIS UTILIZADOS
────────────────────────────────────────
    `;

    report.commandsByType.forEach((cmd, index) => {
      text += `\n${index + 1}. ${cmd.command_name}
   └─ Vezes: ${cmd.count} | Último uso: ${new Date(cmd.last_used).toLocaleString('pt-BR')} | ⏱️ ${cmd.avg_time?.toFixed(2) || 0}ms`;
    });

    text += `\n\n📝 ÚLTIMAS 20 ATIVIDADES
────────────────────────────────────────
    `;

    report.recentActivity.slice(0, 20).forEach((activity, index) => {
      text += `\n${index + 1}. ${activity.command_name}
   └─ Em: ${new Date(activity.executed_at).toLocaleString('pt-BR')} | Status: ${activity.status}`;
    });

    text += `\n\n════════════════════════════════════════\n`;
    
    return text;
  }

  /**
   * Salva relatório em arquivo
   */
  saveReport(filename, content) {
    try {
      const reportsDir = path.join(__dirname, 'reports');
      
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      
      const filePath = path.join(reportsDir, filename);
      fs.writeFileSync(filePath, content, 'utf-8');
      
      console.log(`✅ Relatório salvo em: ${filePath}`);
      return {
        success: true,
        path: filePath,
        filename: filename
      };
    } catch (error) {
      console.error('Erro ao salvar relatório:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Gera e salva todos os relatórios
   */
  generateAllReports(days = 30) {
    try {
      console.log('📊 Gerando relatórios...\n');
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const results = [];

      // Relatório de texto
      const textReport = this.generateTextReport(days);
      const textResult = this.saveReport(
        `relatorio-completo-${timestamp}.txt`,
        textReport
      );
      results.push(textResult);

      // Relatório CSV
      const csvReport = this.generateCSVReport(days);
      const csvResult = this.saveReport(
        `relatorio-completo-${timestamp}.csv`,
        csvReport
      );
      results.push(csvResult);

      // Relatório JSON
      const jsonReport = generateCompleteReport(days);
      const jsonResult = this.saveReport(
        `relatorio-completo-${timestamp}.json`,
        JSON.stringify(jsonReport, null, 2)
      );
      results.push(jsonResult);

      console.log('\n✅ Todos os relatórios foram gerados com sucesso!\n');
      
      return {
        success: true,
        reports: results,
        generatedAt: new Date().toLocaleString('pt-BR')
      };
    } catch (error) {
      console.error('Erro ao gerar relatórios:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtém estatísticas rápidas
   */
  getQuickStats() {
    const stats = getCommandStatsByUser(10);
    
    let text = `
┌────────────────────────────────────────┐
│    ESTATÍSTICAS RÁPIDAS DE COMANDOS    │
└────────────────────────────────────────┘

👥 USUÁRIOS E SEUS COMANDOS:
    `;
    
    stats.forEach((user, index) => {
      text += `\n${index + 1}. ${user.name || 'Sem nome'} (${user.email || 'Sem email'})
   ├─ Total de Comandos: ${user.total_commands || 0}
   ├─ Comandos Únicos: ${user.unique_commands || 0}
   ├─ Sucessos: ${user.successful || 0} | Erros: ${user.failed || 0}
   ├─ Tempo Médio: ${user.avg_execution_time?.toFixed(2) || 0}ms
   └─ Último Comando: ${user.last_command_time ? new Date(user.last_command_time).toLocaleString('pt-BR') : 'Nunca'}`;
    });
    
    text += `\n\n────────────────────────────────────────\n`;
    
    return text;
  }
}

export default new ReportGenerator();
