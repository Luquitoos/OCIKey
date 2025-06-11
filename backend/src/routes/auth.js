import express from 'express';
import { register, login, getProfile, logout, logoutAll, refreshToken } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { loginRateLimiter, registerRateLimiter } from '../middleware/rateLimiter.js';
import { validateRegistration, validateLogin } from '../utils/validation.js';

const router = express.Router();

/*
 Rotas de autenticação
 Todas as rotas relacionadas ao sistema de login/registro
*/
router.post('/register', registerRateLimiter, validateRegistration, register); // Registro com rate limiting
router.post('/login', loginRateLimiter, validateLogin, login); // Login com rate limiting
router.get('/profile', authenticateToken, getProfile); // Perfil protegido por token
router.post('/logout', authenticateToken, logout); // Logout seguro no backend
router.post('/logout-all', authenticateToken, logoutAll); // Logout de todas as sessões
router.post('/refresh', authenticateToken, refreshToken); // Renovação de token

export default router;