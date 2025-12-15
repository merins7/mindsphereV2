import { Router } from 'express';
import { getContents, getRecommendations } from '../controllers/content.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getContents); // Catalog list
router.get('/recommendations', authenticate, getRecommendations); // Home feed

export default router;
