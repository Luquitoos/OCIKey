import express from 'express';
import { 
    processarLeitura, 
    processarMultiplasLeituras, 
    processarImagemUpload, 
    processarMultiplasImagensUpload 
} from '../controllers/leituraController.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadSingle, uploadMultiple } from '../middleware/upload.js';

const router = express.Router();

/*
 Rotas para leitura de gabaritos
 Todas as rotas relacionadas ao processamento de imagens de gabaritos
 Requer autenticação para todas as rotas
*/

// Processar leitura de uma imagem já salva no servidor
router.post('/processar', authenticateToken, processarLeitura);

// Processar múltiplas leituras de imagens já salvas no servidor
router.post('/multiplas', authenticateToken, processarMultiplasLeituras);

// Upload e processamento de uma única imagem
router.post('/upload', authenticateToken, uploadSingle, processarImagemUpload);

// Upload e processamento de múltiplas imagens
router.post('/upload-multiplas', authenticateToken, uploadMultiple, processarMultiplasImagensUpload);

export default router;