import express from 'express';
import authRoutes from './auth.js';
import adminRoutes from './admin.js';
import teacherRoutes from './teacher.js';
import leituraRoutes from './leituraRoutes.js';
import provasRoutes from './provasRoutes.js';
import participantesRoutes from './participantesRoutes.js';
import leiturasRoutes from './leiturasRoutes.js';

const router = express.Router();

/*
 Configuração centralizada de todas as rotas da API
 Organiza e agrupa rotas por funcionalidade
*/
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/teacher', teacherRoutes);
router.use('/leitura', leituraRoutes);
router.use('/provas', provasRoutes);
router.use('/participantes', participantesRoutes);
router.use('/leituras', leiturasRoutes);

export default router;