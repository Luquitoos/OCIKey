import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { successResponse } from '../utils/response.js';
import { cadastroRapidoParticipante } from '../controllers/adminController.js';

const router = express.Router();

/*
  Rotas protegidas por autenticação e role de administrador
  Endpoints exclusivos para administradores
*/
router.get('/users', authenticateToken, requireRole(['admin']), (req, res) => {
  // Rota exclusiva para administradores
  res.json(successResponse('Rota exclusiva para admin - Lista de usuários'));
});

router.post('/cadastro-rapido', authenticateToken, requireRole(['admin']), cadastroRapidoParticipante);

export default router;