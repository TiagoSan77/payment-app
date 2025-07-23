import {Router} from 'express';
import paymentRoutes from './paymentRoutes';
import clientesRoutes from './clientesRoutes';
import authRoutes from './authRoutes';

const router = Router();

router.use('/', paymentRoutes);
router.use('/', clientesRoutes);
router.use('/auth', authRoutes);

export default router;