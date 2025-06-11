import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { successResponse } from '../utils/response.js';

const router = express.Router();

/*
  Rotas protegidas por autenticação e role de administrador
  Endpoints exclusivos para administradores
*/
router.get('/users', authenticateToken, requireRole(['admin']), (req, res) => {
  // Rota exclusiva para administradores
  res.json(successResponse('Rota exclusiva para admin - Lista de usuários'));
});

export default router;