import express from 'express';
import authRoutes from './auth.js';
import adminRoutes from './admin.js';
import teacherRoutes from './teacher.js';
import leituraRoutes from './leituraRoutes.js'

const router = express.Router();

/*
 Configuração centralizada de todas as rotas da API
 Organiza e agrupa rotas por funcionalidade
*/
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/teacher', teacherRoutes);
router.use('/leitura', leituraRoutes)

export default router;