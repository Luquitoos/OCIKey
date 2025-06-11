import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import TokenBlacklist from '../models/TokenBlacklist.js';
import { errorResponse, responses } from '../utils/response.js';

/*
 Middleware para autenticação de token JWT
 Verifica se o token é válido e adiciona o usuário ao request
*/
export const authenticateToken = async (req, res, next) => {
  // Extrai o header de autorização da requisição
  const authHeader = req.headers['authorization'];
  // Extrai o token do formato "Bearer TOKEN"
  const token = authHeader && authHeader.split(' ')[1];

  // Verifica se o token foi fornecido
  if (!token) {
    return res.status(401).json(errorResponse(responses.TOKEN_REQUIRED));
  }

  try {
    // Verifica se o token está na blacklist
    const isBlacklisted = await TokenBlacklist.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json(errorResponse('Token foi invalidado'));
    }

    // Verifica e decodifica o token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Busca o usuário no banco de dados usando o ID do token
    const user = await User.findById(decoded.userId);
    
    // Verifica se o usuário ainda existe no banco
    if (!user) {
      return res.status(401).json(errorResponse(responses.TOKEN_INVALID));
    }

    // Adiciona o usuário e token ao objeto request para uso nos próximos middlewares
    req.user = user;
    req.token = token;
    req.tokenPayload = decoded;
    next(); // Continua para o próximo middleware
  } catch (error) {
    // Token inválido ou expirado
    return res.status(403).json(errorResponse(responses.TOKEN_EXPIRED));
  }
};

/*
  Middleware para verificação de roles/permissões
  Verifica se o usuário tem uma das roles necessárias
  roles - Array de roles permitidas
*/
export const requireRole = (roles) => {
  return (req, res, next) => {
    // Verifica se o usuário foi autenticado (deve vir após authenticateToken)
    if (!req.user) {
      return res.status(401).json(errorResponse(responses.AUTH_REQUIRED));
    }

    // Verifica se o role do usuário está na lista de roles permitidas
    if (!roles.includes(req.user.role)) {
      return res.status(403).json(errorResponse(responses.INSUFFICIENT_PERMISSIONS));
    }

    next(); // Usuário tem permissão, continua
  };
};