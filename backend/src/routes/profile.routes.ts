import { Router } from 'express';
import { getProfile, updatePreferences } from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getProfile);
router.put('/preferences', authenticate, updatePreferences);

export default router;
