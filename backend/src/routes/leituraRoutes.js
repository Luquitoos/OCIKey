import express from 'express';
import { processarLeitura } from '../controllers/leituraController.js';

const router = express.Router();

router.post('/process', processarLeitura)
// Rota para o processamento de leitura de imagens

export default router;