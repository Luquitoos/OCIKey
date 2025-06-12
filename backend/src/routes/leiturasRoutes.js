import express from 'express';
import {
    listarLeituras,
    obterLeitura,
    editarLeitura,
    deletarLeitura,
    obterEstatisticas,
    exportarCSV
} from '../controllers/leiturasController.js';

const router = express.Router();

// Rotas para consulta e gerenciamento de leituras
router.get('/', listarLeituras);
router.get('/estatisticas', obterEstatisticas);
router.get('/export-csv', exportarCSV);
router.get('/:id', obterLeitura);
router.put('/:id', editarLeitura);
router.delete('/:id', deletarLeitura);

export default router;