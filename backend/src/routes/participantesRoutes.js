import express from 'express';
import { 
    importarParticipantesCSV,
    listarParticipantes,
    obterParticipante,
    criarParticipante,
    atualizarParticipante,
    associarParticipante,
    deletarParticipante,
    listarEscolas,
    meuPerfil,
    minhasEstatisticas
} from '../controllers/participantesController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/*
 Rotas para gerenciamento de participantes
 Todas as rotas relacionadas ao CRUD de participantes
 Requer autenticação para todas as rotas
*/

// Importar participantes via CSV
router.post('/import', authenticateToken, importarParticipantesCSV);

// Listar escolas únicas (público para permitir acesso durante registro)
router.get('/escolas', listarEscolas);

// Obter perfil do participante do usuário logado
router.get('/meu-perfil', authenticateToken, meuPerfil);

// Obter estatísticas do participante do usuário logado
router.get('/minhas-estatisticas', authenticateToken, minhasEstatisticas);

// Listar participantes
router.get('/', authenticateToken, listarParticipantes);

// Obter um participante específico
router.get('/:id', authenticateToken, obterParticipante);

// Criar um novo participante
router.post('/', authenticateToken, criarParticipante);

// Atualizar um participante existente
router.put('/:id', authenticateToken, atualizarParticipante);

// Associar participante ao usuário logado
router.patch('/:id/associar', authenticateToken, associarParticipante);

// Deletar um participante
router.delete('/:id', authenticateToken, deletarParticipante);

export default router;