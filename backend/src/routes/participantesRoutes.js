import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
    importarParticipantesCSV,
    listarParticipantes,
    obterParticipante,
    criarParticipante,
    atualizarParticipante,
    deletarParticipante,
    listarEscolas,
    associarParticipante,
    meuPerfil
} from '../controllers/participantesController.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Rota para importar participantes via CSV (API)
router.post('/import', importarParticipantesCSV);

// Rota para obter perfil do participante do usuário logado
router.get('/meu-perfil', meuPerfil);

// Rota para listar escolas únicas
router.get('/escolas', listarEscolas);

// Rota para associar participante ao usuário logado
router.put('/:id/associar', associarParticipante);

// CRUD de participantes
router.get('/', listarParticipantes);
router.get('/:id', obterParticipante);
router.post('/', criarParticipante);
router.put('/:id', atualizarParticipante);
router.delete('/:id', deletarParticipante);

export default router;