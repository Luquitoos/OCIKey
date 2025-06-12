import express from 'express';
import {
    importarParticipantesCSV,
    listarParticipantes,
    obterParticipante,
    criarParticipante,
    atualizarParticipante,
    deletarParticipante,
    listarEscolas
} from '../controllers/participantesController.js';

const router = express.Router();

// Rota para importar participantes via CSV
router.post('/import-csv', importarParticipantesCSV);

// Rota para listar escolas únicas
router.get('/escolas', listarEscolas);

// CRUD de participantes
router.get('/', listarParticipantes);
router.get('/:id', obterParticipante);
router.post('/', criarParticipante);
router.put('/:id', atualizarParticipante);
router.delete('/:id', deletarParticipante);

export default router;