import TokenBlacklist from '../models/TokenBlacklist.js';
import { pool } from '../config/database.js';

/*
  Serviço de limpeza automática do sistema
  Remove dados expirados e desnecessários periodicamente
*/
class CleanupService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
  }

  /*
    Inicia o serviço de limpeza automática
    interval - Intervalo em milissegundos (padrão: 1 hora)
  */
  start(interval = 60 * 60 * 1000) { // 1 hora por padrão
    if (this.isRunning) {
      console.log('Serviço de limpeza já está rodando');
      return;
    }

    console.log('Iniciando serviço de limpeza automática...');
    this.isRunning = true;

    // Executa limpeza imediatamente
    this.runCleanup();

    // Agenda limpezas periódicas
    this.intervalId = setInterval(() => {
      this.runCleanup();
    }, interval);
  }

  /*
    Para o serviço de limpeza automática
  */
  stop() {
    if (!this.isRunning) {
      console.log('Serviço de limpeza não está rodando');
      return;
    }

    console.log('Parando serviço de limpeza automática...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /*
    Executa todas as rotinas de limpeza
  */
  async runCleanup() {
    try {
      console.log('Executando limpeza automática...');
      
      const results = await Promise.allSettled([
        this.cleanupExpiredTokens(),
        this.cleanupRateLimitAttempts(),
        this.cleanupExpiredSessions()
      ]);

      // Log dos resultados
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

  /*
    Remove tokens expirados da blacklist
  */
  async cleanupExpiredTokens() {
    try {
      return await TokenBlacklist.cleanupExpiredTokens();
    } catch (error) {
      console.error('Erro ao limpar tokens expirados:', error);
      throw error;
    }
  }

  /*
    Remove tentativas antigas de rate limiting
    Mantém apenas as últimas 24 horas
  */
  async cleanupRateLimitAttempts() {
    try {
      const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 horas atrás
      
      const result = await pool.query(
        'DELETE FROM rate_limit_attempts WHERE created_at < $1',
        [cutoffDate]
      );

      return result.rowCount;
    } catch (error) {
      console.error('Erro ao limpar tentativas de rate limit:', error);
      throw error;
    }
  }

  /*
    Remove sessões expiradas
  */
  async cleanupExpiredSessions() {
    try {
      const result = await pool.query(
        'DELETE FROM active_sessions WHERE expires_at < NOW()'
      );

      return result.rowCount;
    } catch (error) {
      console.error('Erro ao limpar sessões expiradas:', error);
      throw error;
    }
  }

  /*
    Executa limpeza manual (útil para testes ou manutenção)
  */
  async manualCleanup() {
    console.log('Executando limpeza manual...');
    await this.runCleanup();
  }

  /*
    Retorna estatísticas do sistema
  */
  async getStats() {
    try {
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

// Exporta uma instância singleton
export default new CleanupService();