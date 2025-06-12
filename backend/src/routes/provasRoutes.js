import express from 'express';
import {
    importarProvasCSV,
    listarProvas,
    obterProva,
    criarProva,
    atualizarProva,
    deletarProva
} from '../controllers/provasController.js';

const router = express.Router();

// Rota para importar provas via CSV
router.post('/import-csv', importarProvasCSV);

// CRUD de provas
router.get('/', listarProvas);
router.get('/:id', obterProva);
router.post('/', criarProva);
router.put('/:id', atualizarProva);
router.delete('/:id', deletarProva);

export default router;