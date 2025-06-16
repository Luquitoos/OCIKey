import express from 'express';
import { 
    importarProvasCSV,
    listarProvas,
    obterProva,
    criarProva,
    atualizarProva,
    deletarProva
} from '../controllers/provasController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/*
 Rotas para gerenciamento de provas
 Todas as rotas relacionadas ao CRUD de provas
 Requer autenticação para todas as rotas
*/

// Importar provas via CSV
router.post('/import', authenticateToken, importarProvasCSV);

// Listar todas as provas
router.get('/', authenticateToken, listarProvas);

// Obter uma prova específica
router.get('/:id', authenticateToken, obterProva);

// Criar uma nova prova
router.post('/', authenticateToken, criarProva);

// Atualizar uma prova existente
router.put('/:id', authenticateToken, atualizarProva);

// Deletar uma prova
router.delete('/:id', authenticateToken, deletarProva);

export default router;