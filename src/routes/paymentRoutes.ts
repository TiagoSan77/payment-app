import {Router} from 'express';
import cliente from '../controllers/Payments';
import authService from '../controllers/UserController';

const router = Router();

// Rota protegida para criar pagamento PIX (requer autenticação)
router.post('/create_pix_payment', authService.verifyToken, cliente.criar);

// Webhook público (MercadoPago precisa acessar sem autenticação)
router.post('/webhook', cliente.webhook);

export default router;