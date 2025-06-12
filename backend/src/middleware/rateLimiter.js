/* 
 Middleware de Rate Limiting (Limitação de Taxa)
 Rate Limiting é uma técnica para controlar o número de requisições
 que um cliente pode fazer em um período de tempo específico
 Previne ataques de força bruta, DDoS e uso abusivo da API
 Implementa limitação baseada em IP e endpoint usando PostgreSQL
*/

import { pool } from '../config/database.js';
import { errorResponse } from '../utils/response.js';

/* Função factory para criar rate limiters configuráveis
   Permite criar diferentes limitadores para diferentes endpoints
   Usa sliding window algorithm para controle preciso de taxa
   options - Objeto com configurações personalizadas do rate limiter */
export const createRateLimiter = (options = {}) => {
  // Desestruturação com valores padrão para configurações
  const {
    windowMs = 15 * 60 * 1000, // Janela de tempo em ms (15 minutos por padrão)
    maxAttempts = 5, // Número máximo de tentativas permitidas na janela
    message = 'Muitas tentativas. Tente novamente mais tarde.', // Mensagem de erro
    keyGenerator = (req) => req.ip // Função para gerar chave única (padrão: IP)
  } = options;

  // Retorna o middleware de rate limiting
  return async (req, res, next) => {
    try {
      // Gera chave única para identificar o cliente (IP, usuário, etc.)
      const key = keyGenerator(req);
      const now = new Date(); // Timestamp atual
      const windowStart = new Date(now.getTime() - windowMs); // Início da janela de tempo

      // Limpa registros antigos que estão fora da janela de tempo
      // Mantém a tabela limpa e melhora performance
      await pool.query(
        'DELETE FROM rate_limit_attempts WHERE created_at < $1',
        [windowStart]
      );

      // Conta quantas tentativas o cliente fez na janela atual
      const countResult = await pool.query(
        'SELECT COUNT(*) as count FROM rate_limit_attempts WHERE key = $1 AND created_at >= $2',
        [key, windowStart]
      );

      const currentAttempts = parseInt(countResult.rows[0].count);

      // Verifica se o limite foi excedido
      if (currentAttempts >= maxAttempts) {
        // Retorna erro 429 (Too Many Requests) com tempo para retry
        return res.status(429).json(errorResponse(message, {
          retryAfter: Math.ceil(windowMs / 1000) // Tempo em segundos para tentar novamente
        }));
      }

      // Registra a tentativa atual no banco de dados
      await pool.query(
        'INSERT INTO rate_limit_attempts (key, created_at) VALUES ($1, $2)',
        [key, now]
      );

      // Adiciona headers informativos sobre o rate limiting
      // Permite que o cliente saiba seu status atual
      res.set({
        'X-RateLimit-Limit': maxAttempts, // Limite máximo
        'X-RateLimit-Remaining': Math.max(0, maxAttempts - currentAttempts - 1), // Tentativas restantes
        'X-RateLimit-Reset': new Date(now.getTime() + windowMs).toISOString() // Quando o limite reseta
      });

      next(); // Permite que a requisição continue

    } catch (error) {
      console.error('Erro no rate limiter:', error);
      // Em caso de erro no rate limiter, permite a requisição para não quebrar o sistema
      // Melhor ter sistema funcionando sem rate limiting do que sistema quebrado
      next();
    }
  };
};

/* Rate limiter específico para endpoints de login
   Mais restritivo para prevenir ataques de força bruta em senhas
   Usa prefixo 'login:' na chave para separar de outros limitadores */
export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos de janela
  maxAttempts: 5, // Apenas 5 tentativas de login por IP
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  keyGenerator: (req) => `login:${req.ip}` // Prefixo para identificar tentativas de login
});

/* Rate limiter para registro de novos usuários
   Previne spam de criação de contas e ataques automatizados
   Janela maior com menos tentativas para desencorajar bots */
export const registerRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora de janela
  maxAttempts: 3, // Apenas 3 registros por IP por hora
  message: 'Muitas tentativas de registro. Tente novamente em 1 hora.',
  keyGenerator: (req) => `register:${req.ip}` // Prefixo para identificar registros
});

/* Rate limiter geral para toda a API
   Protege contra uso excessivo e ataques DDoS básicos
   Limite mais alto para não afetar uso normal da aplicação */
export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos de janela
  maxAttempts: 100, // 100 requisições por IP (uso normal)
  message: 'Limite de requisições excedido. Tente novamente mais tarde.',
  keyGenerator: (req) => `api:${req.ip}` // Prefixo para identificar requisições gerais
});