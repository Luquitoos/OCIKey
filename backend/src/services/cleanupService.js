/* 
 Serviço de Limpeza Automática do Sistema
 Responsável por remover dados expirados e desnecessários periodicamente
 Mantém o banco de dados limpo e otimizado para performance
 Implementa padrão Singleton para garantir única instância
*/

import TokenBlacklist from '../models/TokenBlacklist.js';
import { pool } from '../config/database.js';

/* Classe CleanupService para gerenciar limpeza automática
   Executa rotinas de manutenção em intervalos regulares
   Remove tokens expirados, tentativas de rate limit antigas, etc. */
class CleanupService {
  constructor() {
    this.isRunning = false; // Flag para controlar se o serviço está ativo
    this.intervalId = null; // ID do intervalo para poder cancelar depois
  }

  /* Inicia o serviço de limpeza automática
     Configura execução periódica das rotinas de limpeza
     interval - Intervalo em milissegundos entre execuções (padrão: 1 hora) */
  start(interval = 60 * 60 * 1000) { // 1 hora por padrão
    // Evita iniciar múltiplas instâncias do serviço
    if (this.isRunning) {
      console.log('Serviço de limpeza já está rodando');
      return;
    }

    console.log('Iniciando serviço de limpeza automática...');
    this.isRunning = true;

    // Executa limpeza imediatamente na inicialização
    this.runCleanup();

    // Agenda limpezas periódicas usando setInterval
    this.intervalId = setInterval(() => {
      this.runCleanup();
    }, interval);
  }

  /* Para o serviço de limpeza automática
     Cancela execuções futuras e limpa recursos */
  stop() {
    // Verifica se o serviço está realmente rodando
    if (!this.isRunning) {
      console.log('Serviço de limpeza não está rodando');
      return;
    }

    console.log('Parando serviço de limpeza automática...');
    this.isRunning = false;

    // Cancela o intervalo se existir
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /* Executa todas as rotinas de limpeza em paralelo
     Usa Promise.allSettled para não falhar se uma operação der erro
     Registra logs detalhados de cada operação */
  async runCleanup() {
    try {
      console.log('Executando limpeza automática...');
      
      // Executa todas as limpezas em paralelo para melhor performance
      const results = await Promise.allSettled([
        this.cleanupExpiredTokens(),
        this.cleanupRateLimitAttempts(),
        this.cleanupExpiredSessions()
      ]);

      // Log detalhado dos resultados de cada operação
      results.forEach((result, index) => {
        const operations = ['tokens expirados', 'tentativas de rate limit', 'sessões expiradas'];
        if (result.status === 'fulfilled') {
          console.log(`Limpeza de ${operations[index]}: ${result.value} registros removidos`);
        } else {
          console.error(`Erro na limpeza de ${operations[index]}:`, result.reason);
        }
      });

      console.log('Limpeza automática concluída');
    } catch (error) {
      console.error('Erro durante limpeza automática:', error);
    }
  }

  /* Remove tokens JWT expirados da blacklist
     Delega para o modelo TokenBlacklist que tem a lógica específica
     Retorna número de registros removidos */
  async cleanupExpiredTokens() {
    try {
      return await TokenBlacklist.cleanupExpiredTokens();
    } catch (error) {
      console.error('Erro ao limpar tokens expirados:', error);
      throw error;
    }
  }

  /* Remove tentativas antigas de rate limiting
     Mantém apenas as últimas 24 horas para análise
     Evita crescimento descontrolado da tabela rate_limit_attempts */
  async cleanupRateLimitAttempts() {
    try {
      // Calcula data de corte (24 horas atrás)
      const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Remove registros mais antigos que a data de corte
      const result = await pool.query(
        'DELETE FROM rate_limit_attempts WHERE created_at < $1',
        [cutoffDate]
      );

      return result.rowCount; // Retorna número de registros removidos
    } catch (error) {
      console.error('Erro ao limpar tentativas de rate limit:', error);
      throw error;
    }
  }

  /* Remove sessões expiradas do sistema
     Limpa tabela de sessões ativas que já expiraram
     Usa função NOW() do PostgreSQL para comparação precisa */
  async cleanupExpiredSessions() {
    try {
      const result = await pool.query(
        'DELETE FROM active_sessions WHERE expires_at < NOW()'
      );

      return result.rowCount; // Retorna número de sessões removidas
    } catch (error) {
      console.error('Erro ao limpar sessões expiradas:', error);
      throw error;
    }
  }

  /* Executa limpeza manual sob demanda
     ��til para testes, manutenção ou situações específicas
     Não depende do agendamento automático */
  async manualCleanup() {
    console.log('Executando limpeza manual...');
    await this.runCleanup();
  }

  /* Retorna estatísticas atuais do sistema
     Fornece informações sobre dados ativos em cada tabela
     Útil para monitoramento e debugging */
  async getStats() {
    try {
      // Executa consultas em paralelo para melhor performance
      const [blacklistCount, rateLimitCount, sessionsCount] = await Promise.all([
        pool.query('SELECT COUNT(*) as count FROM token_blacklist WHERE expires_at > NOW()'),
        pool.query('SELECT COUNT(*) as count FROM rate_limit_attempts WHERE created_at > NOW() - INTERVAL \'24 hours\''),
        pool.query('SELECT COUNT(*) as count FROM active_sessions WHERE expires_at > NOW()')
      ]);

      return {
        activeBlacklistedTokens: parseInt(blacklistCount.rows[0].count),
        recentRateLimitAttempts: parseInt(rateLimitCount.rows[0].count),
        activeSessions: parseInt(sessionsCount.rows[0].count)
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }
}

// Exporta uma instância singleton para uso em toda a aplicação
// Garante que apenas uma instância do serviço existe
export default new CleanupService();