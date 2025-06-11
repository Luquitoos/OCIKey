import express from 'express';
import { register, login, getProfile, logout } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest, registerSchema, loginSchema } from '../utils/validation.js';

const router = express.Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);

router.get('/profile', authenticateToken, getProfile);
router.post('/logout', authenticateToken, logout);

export default router;