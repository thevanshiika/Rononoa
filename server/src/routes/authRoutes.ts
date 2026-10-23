import { Router } from 'express';
import { login, getCurrentUser, updateProfile } from '../controllers/authController.ts';
import { authenticate } from '../middleware/auth.ts';

const router = Router();

router.post('/login', login);
router.get('/me', authenticate, getCurrentUser);
router.patch('/profile', authenticate, updateProfile);

export default router;
