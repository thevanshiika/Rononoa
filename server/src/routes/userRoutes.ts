import { Router } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
} from '../controllers/userController.ts';
import { authenticate, requireRole } from '../middleware/auth.ts';

const router = Router();

// Users can be listed by authenticated members for project member selection
router.get('/', authenticate, getUsers);
router.get('/:id', authenticate, getUserById);

// Admin-only management endpoints
router.post('/', authenticate, requireRole('admin'), createUser);
router.patch('/:id', authenticate, requireRole('admin'), updateUser);
router.patch('/:id/deactivate', authenticate, requireRole('admin'), deactivateUser);

export default router;
