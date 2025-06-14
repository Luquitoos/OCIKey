import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
    listarLeituras,
    obterLeitura,
    editarLeitura,
    deletarLeitura,
    estatisticasLeituras
} from '../controllers/leiturasController.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Rotas para consulta e gerenciamento de leituras
router.get('/', listarLeituras);
router.get('/estatisticas', estatisticasLeituras);
router.get('/:id', obterLeitura);
router.put('/:id', editarLeitura);
router.delete('/:id', deletarLeitura);

export default router;