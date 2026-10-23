import { Router } from 'express';
import {
  createComment,
  getTaskComments,
  deleteComment,
} from '../controllers/commentController.ts';
import { authenticate, preventViewerWrite } from '../middleware/auth.ts';

const router = Router();

router.use(authenticate);

// Create comment with { task: taskId, content: '...' }
router.post('/', preventViewerWrite, createComment);

// Get comments for a task
router.get('/task/:id', getTaskComments);

// Delete comment by ID (checks author or project manager)
router.delete('/:id', preventViewerWrite, deleteComment);

export default router;
