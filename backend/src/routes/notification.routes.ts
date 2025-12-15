import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { subscribe } from '../controllers/notification.controller';

const router = Router();

router.post('/subscribe', authenticate, subscribe);

export default router;
