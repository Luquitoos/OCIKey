/* 
 Middleware de Autenticação e Autorização
 Utiliza JWT (JSON Web Token) para autenticação stateless
 JWT é um padrão para transmitir informações de forma segura entre partes
 Permite autenticação sem necessidade de sessões no servidor
*/

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import TokenBlacklist from '../models/TokenBlacklist.js';
import { errorResponse, responses } from '../utils/response.js';

/* Middleware para autenticação de token JWT
   Verifica se o token é válido e adiciona o usuário ao request
   Deve ser usado em rotas que requerem autenticação
   Adiciona req.user, req.token e req.tokenPayload para uso posterior */
export const authenticateToken = async (req, res, next) => {
  // Extrai o header de autorização da requisição (formato: "Authorization: Bearer TOKEN")
  const authHeader = req.headers['authorization'];
  // Extrai apenas o token, removendo a palavra "Bearer " do início
  const token = authHeader && authHeader.split(' ')[1];

  // Verifica se o token foi fornecido na requisição
  if (!token) {
    return res.status(401).json(errorResponse(responses.TOKEN_REQUIRED));
  }

  try {
    // Verifica se o token está na blacklist (tokens invalidados por logout)
    const isBlacklisted = await TokenBlacklist.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json(errorResponse('Token foi invalidado'));
    }

    // Verifica e decodifica o token JWT usando a chave secreta
    // jwt.verify() lança exceção se o token for inválido ou expirado
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Busca o usuário no banco de dados usando o ID extraído do token
    const user = await User.findById(decoded.userId);
    
    // Verifica se o usuário ainda existe no banco (pode ter sido deletado)
    if (!user) {
      return res.status(401).json(errorResponse(responses.TOKEN_INVALID));
    }

    // Adiciona informações do usuário ao objeto request para uso nos próximos middlewares
    req.user = user; // Dados completos do usuário
    req.token = token; // Token original para possível invalidação
    req.tokenPayload = decoded; // Payload decodificado do JWT
    next(); // Continua para o próximo middleware/controller
  } catch (error) {
    // Token inválido, malformado ou expirado
    return res.status(403).json(errorResponse(responses.TOKEN_EXPIRED));
  }
};

/* Middleware para verificação de roles/permissões (autorização)
   Verifica se o usuário autenticado tem uma das roles necessárias
   Deve ser usado após authenticateToken
   roles - Array de roles permitidas (ex: ['admin', 'teacher']) */
export const requireRole = (roles) => {
  // Retorna uma função middleware que tem acesso ao array de roles
  return (req, res, next) => {
    // Verifica se o usuário foi autenticado (deve vir após authenticateToken)
    if (!req.user) {
      return res.status(401).json(errorResponse(responses.AUTH_REQUIRED));
    }

    // Verifica se o role do usuário está na lista de roles permitidas
    // req.user.role contém o role do usuário (admin, teacher, user)
    if (!roles.includes(req.user.role)) {
      return res.status(403).json(errorResponse(responses.INSUFFICIENT_PERMISSIONS));
    }

    next(); // Usuário tem permissão adequada, continua para o próximo middleware
  };
};