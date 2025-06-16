import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import TokenBlacklist from '../models/TokenBlacklist.js';
import { successResponse, errorResponse, responses } from '../utils/response.js';
import { pool } from '../config/database-config.js';

/*
  Gera um token JWT para autenticação do usuário
  userId - ID do usuário para incluir no token
  Token JWT assinado
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, // Payload com ID do usuário
    process.env.JWT_SECRET, // Chave secreta para assinatura
    { expiresIn: process.env.JWT_EXPIRES_IN } // Tempo de expiração
  );
};

/*
  Cria objeto de resposta do usuário sem dados sensíveis
  user - Objeto do usuário do banco de dados
  Dados do usuário para resposta da API
*/
const createUserResponse = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  escola: user.escola,
  role: user.role
});

/*
  Controlador para registro de novos usuários
  Valida dados, verifica duplicatas e cria novo usuário
*/
export const register = async (req, res) => {
  try {
    const { username, email, password, escola, role } = req.body;

    // Verifica se já existe usuário com este email
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json(errorResponse(responses.EMAIL_EXISTS, [{
        field: 'email',
        message: 'Este email já está sendo usado por outro usuário',
        value: email
      }]));
    }

    // Verifica se já existe usuário com este nome de usuário
    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.status(400).json(errorResponse(responses.USERNAME_TAKEN, [{
        field: 'username',
        message: 'Este nome de usuário já está sendo usado',
        value: username
      }]));
    }

    // Validação especial para professores: verificar se a escola existe na lista
    if (role === 'teacher') {
      const { rows: schoolExists } = await pool.query(
        'SELECT DISTINCT escola FROM participantes WHERE escola IS NOT NULL AND escola != \'\' AND escola = $1',
        [escola]
      );
      
      if (schoolExists.length === 0) {
        return res.status(400).json(errorResponse('Dados inválidos', [{
          field: 'escola',
          message: 'Selecione uma instituição válida da lista',
          value: escola
        }]));
      }
    }

    // Cria novo usuário no banco de dados
    const newUser = await User.create({ username, email, password, escola, role });
    
    // Se forneceu escola, cria automaticamente um participante com o mesmo nome
    if (escola && username) {
      try {
        await pool.query(
          'INSERT INTO participantes (nome, escola, user_id) VALUES ($1, $2, $3)',
          [username, escola, newUser.id]
        );
      } catch (participanteError) {
        console.warn('Erro ao criar participante automático:', participanteError);
        // Não falha o registro se não conseguir criar o participante
      }
    }
    
    // Gera token JWT para o novo usuário
    const token = generateToken(newUser.id);

    // Retorna sucesso com dados do usuário e token
    res.status(201).json(successResponse(responses.USER_REGISTERED, {
      user: createUserResponse(newUser),
      token
    }));

  } catch (error) {
    console.error('Erro no registro:', error); // Log do erro
    res.status(500).json(errorResponse(responses.INTERNAL_ERROR));
  }
};

/*
  Controlador para login de usuários
  Valida credenciais e retorna token de acesso
*/
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Busca usuário pelo email no banco de dados
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json(errorResponse('Credenciais inválidas', [{
        field: 'email',
        message: 'Conta não encontrada. Verifique o email ou registre-se.',
        value: email
      }]));
    }

    // Valida a senha fornecida com a hash armazenada
    const isValidPassword = await User.validatePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json(errorResponse('Credenciais inválidas', [{
        field: 'password',
        message: 'Senha incorreta. Verifique sua senha e tente novamente.',
        value: null // Não retornar a senha por segurança
      }]));
    }

    // Gera token JWT para o usuário autenticado
    const token = generateToken(user.id);

    // Retorna sucesso com dados do usuário e token
    res.json(successResponse(responses.LOGIN_SUCCESS, {
      user: createUserResponse(user),
      token
    }));

  } catch (error) {
    console.error('Erro no login:', error); // Log do erro
    res.status(500).json(errorResponse(responses.INTERNAL_ERROR));
  }
};

/*
 Controlador para obter perfil do usuário autenticado
 Retorna dados do usuário baseado no token JWT
*/
export const getProfile = async (req, res) => {
  try {
    // req.user é definido pelo middleware authenticateToken
    res.json(successResponse('Perfil obtido com sucesso', {
      user: createUserResponse(req.user)
    }));
  } catch (error) {
    console.error('Erro ao obter perfil:', error); // Log do erro
    res.status(500).json(errorResponse(responses.INTERNAL_ERROR));
  }
};

/*
 Controlador para logout do usuário
 Adiciona o token à blacklist para invalidação segura
*/
export const logout = async (req, res) => {
  try {
    const token = req.token;
    const tokenPayload = req.tokenPayload;

    if (token && tokenPayload) {
      // Calcula a data de expiração do token
      const expiresAt = new Date(tokenPayload.exp * 1000);
      
      // Adiciona o token à blacklist
      await TokenBlacklist.addToken(token, expiresAt);
    }

    res.json(successResponse(responses.LOGOUT_SUCCESS));
  } catch (error) {
    console.error('Erro no logout:', error);
    // Mesmo com erro, retorna sucesso para não expor informações
    res.json(successResponse(responses.LOGOUT_SUCCESS));
  }
};

/*
 Controlador para logout de todas as sessões do usuário
 Invalida todos os tokens ativos do usuário
*/
export const logoutAll = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Invalida todos os tokens do usuário
    await TokenBlacklist.invalidateUserTokens(userId);

    res.json(successResponse('Logout realizado em todas as sessões'));
  } catch (error) {
    console.error('Erro no logout geral:', error);
    res.status(500).json(errorResponse(responses.INTERNAL_ERROR));
  }
};

/*
 Controlador para refresh do token
 Gera um novo token e invalida o anterior
*/
export const refreshToken = async (req, res) => {
  try {
    const oldToken = req.token;
    const tokenPayload = req.tokenPayload;
    const user = req.user;

    // Gera novo token
    const newToken = generateToken(user.id);

    // Adiciona o token antigo à blacklist
    if (oldToken && tokenPayload) {
      const expiresAt = new Date(tokenPayload.exp * 1000);
      await TokenBlacklist.addToken(oldToken, expiresAt);
    }

    res.json(successResponse('Token renovado com sucesso', {
      user: createUserResponse(user),
      token: newToken
    }));

  } catch (error) {
    console.error('Erro ao renovar token:', error);
    res.status(500).json(errorResponse(responses.INTERNAL_ERROR));
  }
};