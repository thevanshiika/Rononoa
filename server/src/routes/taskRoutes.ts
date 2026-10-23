import { Router } from 'express';
import {
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  getDashboardStats,
} from '../controllers/taskController.ts';
import {
  getTaskComments,
  createComment,
} from '../controllers/commentController.ts';
import { authenticate, preventViewerWrite } from '../middleware/auth.ts';

const router = Router();

router.use(authenticate);

// Global dashboard metrics
router.get('/stats/dashboard', getDashboardStats);

// Create task directly at /api/tasks
router.post('/', preventViewerWrite, createTask);

// Single task details and OCC update
router.get('/:id', getTaskById);
router.patch('/:id', preventViewerWrite, updateTask);
router.delete('/:id', preventViewerWrite, deleteTask);

// Task comments
router.get('/:id/comments', getTaskComments);
router.post('/:id/comments', preventViewerWrite, createComment);

export default router;
