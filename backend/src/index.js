import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { register, login, getProfile, logout, logoutAll, refreshToken } from './controllers/authController.js';
import { authenticateToken, requireRole } from './middleware/auth.js';
import { apiRateLimiter, loginRateLimiter, registerRateLimiter } from './middleware/rateLimiter.js';
import { validateRegistration, validateLogin } from './utils/validation.js';
import { successResponse, errorResponse, responses } from './utils/response.js';
import cleanupService from './services/cleanupService.js';

// Carrega variáveis de ambiente do arquivo .env
dotenv.config();

// Inicializa aplicação Express
const app = express();
const PORT = process.env.PORT || 3001;

// Configuração de middlewares globais
app.use(cors()); // Habilita CORS para todas as rotas
app.use(express.json()); // Parser para JSON
app.use(express.urlencoded({ extended: true })); // Parser para dados de formulário
app.use(apiRateLimiter); // Rate limiting geral para todas as rotas

/*
 Endpoint de verificação de saúde do servidor
 Retorna status OK e timestamp atual
*/
app.get('/health', (req, res) => {
  res.json(successResponse('OCIKey Backend está funcionando', {
    status: 'OK',
    timestamp: new Date().toISOString()
  }));
});

/*
 Rotas de autenticação
 Todas as rotas relacionadas ao sistema de login/registro
*/
app.post('/api/auth/register', registerRateLimiter, validateRegistration, register); // Registro com rate limiting
app.post('/api/auth/login', loginRateLimiter, validateLogin, login); // Login com rate limiting
app.get('/api/auth/profile', authenticateToken, getProfile); // Perfil protegido por token
app.post('/api/auth/logout', authenticateToken, logout); // Logout seguro no backend
app.post('/api/auth/logout-all', authenticateToken, logoutAll); // Logout de todas as sessões
app.post('/api/auth/refresh', authenticateToken, refreshToken); // Renovação de token

/*
  Rotas protegidas por autenticação e role
  Exemplos de endpoints com diferentes níveis de acesso
*/
app.get('/api/admin/users', authenticateToken, requireRole(['admin']), (req, res) => {
  // Rota exclusiva para administradores
  res.json(successResponse('Rota exclusiva para admin - Lista de usuários'));
});

app.get('/api/teacher/dashboard', authenticateToken, requireRole(['admin', 'teacher']), (req, res) => {
  // Rota para professores e administradores
  res.json(successResponse('Dashboard do professor'));
});

/*
 Middleware global de tratamento de erros
 Captura todos os erros não tratados da aplicação
*/
app.use((err, req, res, next) => {
  console.error('Erro:', err); // Log do erro para debug
  res.status(500).json(errorResponse(
    responses.INTERNAL_ERROR,
    process.env.NODE_ENV === 'development' ? [err.message] : null 
  ));
});

/*
 Manipulador para rotas não encontradas (404)
 Deve ser o último middleware registrado
*/
app.use('*', (req, res) => {
  res.status(404).json(errorResponse(responses.NOT_FOUND));
});

/*
 Inicia o servidor HTTP na porta especificada
 Exibe informações de conexão no console
*/
app.listen(PORT, () => {
  console.log(`Servidor OCIKey Backend rodando na porta ${PORT}`);
  console.log(`Verificação de saúde: http://localhost:${PORT}/health`);
  console.log(`Endpoints de autenticação disponíveis em: http://localhost:${PORT}/api/auth/`);
  
  // Inicia o serviço de limpeza automática
  cleanupService.start();
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Recebido SIGTERM, encerrando servidor...');
    cleanupService.stop();
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    console.log('Recebido SIGINT, encerrando servidor...');
    cleanupService.stop();
    process.exit(0);
  });
});