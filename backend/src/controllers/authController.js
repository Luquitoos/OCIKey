import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { successResponse, errorResponse, responses } from '../utils/response.js';

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
  role: user.role
});

/*
  Controlador para registro de novos usuários
  Valida dados, verifica duplicatas e cria novo usuário
*/
export const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Verifica se já existe usuário com este email
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json(errorResponse(responses.EMAIL_EXISTS));
    }

    // Verifica se já existe usuário com este nome de usuário
    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.status(400).json(errorResponse(responses.USERNAME_TAKEN));
    }

    // Cria novo usuário no banco de dados
    const newUser = await User.create({ username, email, password, role });
    
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
      return res.status(401).json(errorResponse(responses.INVALID_CREDENTIALS));
    }

    // Valida a senha fornecida com a hash armazenada
    const isValidPassword = await User.validatePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json(errorResponse(responses.INVALID_CREDENTIALS));
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
 Como usamos JWT, o logout é tratado no lado do cliente (ainda vou ver isso na integração)
 removendo o token do armazenamento local
*/
export const logout = async (req, res) => {
  res.json(successResponse(responses.LOGOUT_SUCCESS));
};