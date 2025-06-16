import express from 'express';
import { 
    listarLeituras,
    obterLeitura,
    editarLeitura,
    deletarLeitura,
    estatisticasLeituras
} from '../controllers/leiturasController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/*
 Rotas para gerenciamento de leituras
 Todas as rotas relacionadas ao CRUD de leituras realizadas
 Requer autenticação para todas as rotas
*/

// Obter estatísticas das leituras
router.get('/estatisticas', authenticateToken, estatisticasLeituras);

// Listar leituras
router.get('/', authenticateToken, listarLeituras);

// Obter uma leitura específica
router.get('/:id', authenticateToken, obterLeitura);

// Editar uma leitura (correção manual)
router.put('/:id', authenticateToken, editarLeitura);

// Deletar uma leitura
router.delete('/:id', authenticateToken, deletarLeitura);

export default router;