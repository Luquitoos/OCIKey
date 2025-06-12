import express from 'express';
import { 
    processarLeitura, 
    processarMultiplasLeituras,
    processarImagemUpload,
    processarMultiplasImagensUpload
} from '../controllers/leituraController.js';
import { uploadSingle, uploadMultiple, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

// Rotas para processamento via caminho de arquivo
router.post('/process', processarLeitura);
router.post('/process-multiple', processarMultiplasLeituras);

// Rotas para processamento via upload
router.post('/upload', uploadSingle, handleUploadError, processarImagemUpload);
router.post('/upload-multiple', uploadMultiple, handleUploadError, processarMultiplasImagensUpload);

export default router;