import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { successResponse } from '../utils/response.js';

const router = express.Router();

/*
  Rotas protegidas por autenticação e role de professor
  Endpoints para professores e administradores
*/
router.get('/dashboard', authenticateToken, requireRole(['admin', 'teacher']), (req, res) => {
  // Rota para professores e administradores
  res.json(successResponse('Dashboard do professor'));
});

export default router;