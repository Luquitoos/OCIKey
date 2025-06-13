import { pool } from '../config/database.js';

/*
  Modelo para gerenciar blacklist de tokens JWT
  Implementa invalidação segura de tokens no logout
*/
class TokenBlacklist {
  /*
    Adiciona um token à blacklist
    token - Token JWT a ser invalidado
    expiresAt - Data de expiração do token
  */
  static async addToken(token, expiresAt) {
    try {
      const query = `
        INSERT INTO token_blacklist (token, expires_at) 
        VALUES ($1, $2)
        ON CONFLICT (token) DO NOTHING
      `;
      await pool.query(query, [token, expiresAt]);
      return true;
    } catch (error) {
      console.error('Erro ao adicionar token à blacklist:', error);
      throw error;
    }
  }

  /*
    Verifica se um token está na blacklist
    token - Token JWT a ser verificado
    Retorna true se o token está na blacklist
  */
  static async isTokenBlacklisted(token) {
    try {
      const query = `
        SELECT 1 FROM token_blacklist 
        WHERE token = $1 AND expires_at > NOW()
      `;
      const result = await pool.query(query, [token]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Erro ao verificar blacklist:', error);
      throw error;
    }
  }

  /*
    Remove tokens expirados da blacklist
    Deve ser executado periodicamente para limpeza
  */
  static async cleanupExpiredTokens() {
    try {
      const query = 'DELETE FROM token_blacklist WHERE expires_at <= NOW()';
      const result = await pool.query(query);
      return result.rowCount;
    } catch (error) {
      throw error;
    }
  }

  /*
    Invalida todos os tokens de um usuário específico
    Útil para logout de todas as sessões
  */
  static async invalidateUserTokens(userId) {
    try {
      // Esta implementação requer que armazenemos o userId no token
      // Por enquanto, vamos implementar uma versão simples
      const query = `
        INSERT INTO token_blacklist (token, expires_at, user_id) 
        SELECT token, expires_at, $1 
        FROM active_sessions 
        WHERE user_id = $1
        ON CONFLICT (token) DO NOTHING
      `;
      await pool.query(query, [userId]);
      
      // Remove as sessões ativas do usuário
      await pool.query('DELETE FROM active_sessions WHERE user_id = $1', [userId]);
      
      return true;
    } catch (error) {
      console.error('Erro ao invalidar tokens do usuário:', error);
      throw error;
    }
  }
}

export default TokenBlacklist;