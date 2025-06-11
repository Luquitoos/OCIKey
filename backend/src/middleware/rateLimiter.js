import { pool } from '../config/database.js';
import { errorResponse } from '../utils/response.js';

/*
  Middleware de rate limiting para prevenir ataques de força bruta
  Implementa limitação baseada em IP e endpoint
*/

/*
  Cria um rate limiter configurável
  options - Configurações do rate limiter
*/
export const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutos por padrão
    maxAttempts = 5, // 5 tentativas por padrão
    message = 'Muitas tentativas. Tente novamente mais tarde.',
    keyGenerator = (req) => req.ip // Gerador de chave padrão baseado no IP
  } = options;

  return async (req, res, next) => {
    try {
      const key = keyGenerator(req);
      const now = new Date();
      const windowStart = new Date(now.getTime() - windowMs);

      // Limpa registros antigos
      await pool.query(
        'DELETE FROM rate_limit_attempts WHERE created_at < $1',
        [windowStart]
      );

      // Conta tentativas na janela atual
      const countResult = await pool.query(
        'SELECT COUNT(*) as count FROM rate_limit_attempts WHERE key = $1 AND created_at >= $2',
        [key, windowStart]
      );

      const currentAttempts = parseInt(countResult.rows[0].count);

      if (currentAttempts >= maxAttempts) {
        return res.status(429).json(errorResponse(message, {
          retryAfter: Math.ceil(windowMs / 1000)
        }));
      }

      // Registra a tentativa atual
      await pool.query(
        'INSERT INTO rate_limit_attempts (key, created_at) VALUES ($1, $2)',
        [key, now]
      );

      // Adiciona headers informativos
      res.set({
        'X-RateLimit-Limit': maxAttempts,
        'X-RateLimit-Remaining': Math.max(0, maxAttempts - currentAttempts - 1),
        'X-RateLimit-Reset': new Date(now.getTime() + windowMs).toISOString()
      });

      next();

    } catch (error) {
      console.error('Erro no rate limiter:', error);
      // Em caso de erro, permite a requisição para não quebrar o sistema
      next();
    }
  };
};

/*
  Rate limiter específico para login
  Mais restritivo para prevenir ataques de força bruta
*/
export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxAttempts: 5, // 5 tentativas por IP
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  keyGenerator: (req) => `login:${req.ip}`
});

/*
  Rate limiter para registro de usuários
  Previne spam de criação de contas
*/
export const registerRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  maxAttempts: 3, // 3 registros por IP por hora
  message: 'Muitas tentativas de registro. Tente novamente em 1 hora.',
  keyGenerator: (req) => `register:${req.ip}`
});

/*
  Rate limiter geral para API
  Protege contra uso excessivo da API
*/
export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxAttempts: 100, // 100 requisições por IP
  message: 'Limite de requisições excedido. Tente novamente mais tarde.',
  keyGenerator: (req) => `api:${req.ip}`
});