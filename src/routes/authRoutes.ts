import { Router } from 'express';
import { AuthService } from '../controllers/UserController';

const router = Router();
const authService = new AuthService();

// Rota para criar usuário
router.post('/register', authService.createUser);

// Rota para login
router.post('/login', authService.login);

// Rota para obter informações do usuário (protegida)
router.get('/user/:uid', authService.verifyToken, authService.getUserInfo);

export default router;
