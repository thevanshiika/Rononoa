import { Router } from 'express';
import { resetDemoWorkspace, getDemoInfo } from '../controllers/demoController.ts';
import { authenticate, preventViewerWrite } from '../middleware/auth.ts';

const router = Router();

router.use(authenticate);

router.get('/info', getDemoInfo);
router.post('/reset', preventViewerWrite, resetDemoWorkspace);

export default router;
