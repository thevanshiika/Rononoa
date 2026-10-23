import { Router } from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  archiveProject,
  getProjectTeam,
  addProjectMember,
  updateMemberRole,
  removeProjectMember,
} from '../controllers/projectController.ts';
import { getProjectTasks, createTask } from '../controllers/taskController.ts';
import { authenticate, preventViewerWrite } from '../middleware/auth.ts';

const router = Router();

router.use(authenticate);

// Projects
router.get('/', getProjects);
router.post('/', preventViewerWrite, createProject);
router.get('/:id', getProjectById);
router.patch('/:id', preventViewerWrite, updateProject);
router.patch('/:id/archive', preventViewerWrite, archiveProject);

// Project team management (support both /team and /members endpoints)
router.get('/:id/team', getProjectTeam);
router.get('/:id/members', getProjectTeam);
router.post('/:id/team', preventViewerWrite, addProjectMember);
router.post('/:id/members', preventViewerWrite, addProjectMember);
router.patch('/:id/team/:userId', preventViewerWrite, updateMemberRole);
router.patch('/:id/members/:userId', preventViewerWrite, updateMemberRole);
router.delete('/:id/team/:userId', preventViewerWrite, removeProjectMember);
router.delete('/:id/members/:userId', preventViewerWrite, removeProjectMember);

// Tasks under a project
router.get('/:id/tasks', getProjectTasks);
router.post('/:id/tasks', preventViewerWrite, createTask);

export default router;
