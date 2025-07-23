import {Router} from 'express';
import cliente from '../controllers/Payments';
import authService from '../controllers/UserController';

const router = Router();

// Rotas protegidas para pagamentos (requerem autenticação)
router.post('/create_pix_payment', authService.verifyToken, cliente.criar);
router.get('/payment/:id', authService.verifyToken, cliente.consultarPagamento);
router.get('/payments', authService.verifyToken, cliente.listarPagamentos);

// Webhook público (MercadoPago precisa acessar sem autenticação)
router.post('/webhook', cliente.webhook);

export default router;