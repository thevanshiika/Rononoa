import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { seedDatabase } from '../scripts/autoSeed.ts';
import { User } from '../models/User.ts';
import { Project } from '../models/Project.ts';
import { Task } from '../models/Task.ts';

export async function resetDemoWorkspace(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { confirmReset, retainCustomData = false } = req.body;

    if (!confirmReset) {
      res.status(400).json({
        success: false,
        message: 'Explicit confirmation required. Please set confirmReset: true to execute demo workspace reset.',
      });
      return;
    }

    console.log(`[Demo] Reset initiated by user: ${req.user?.name} (${req.user?.role}). Retain custom data: ${retainCustomData}`);

    await seedDatabase({
      resetAll: !retainCustomData,
      retainCustomData,
    });

    const [userCount, projectCount, taskCount] = await Promise.all([
      User.countDocuments(),
      Project.countDocuments(),
      Task.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      message: 'Demo workspace successfully restored with realistic college hackathon datasets.',
      summary: {
        totalUsers: userCount,
        totalProjects: projectCount,
        totalTasks: taskCount,
        retainCustomData,
      },
    });
  } catch (error: any) {
    console.error('[Demo] Reset failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset demo workspace',
      error: error.message,
    });
  }
}

export async function getDemoInfo(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const [demoUsers, demoProjects, demoTasks, customUsers, customProjects] = await Promise.all([
      User.countDocuments({ isDemo: true }),
      Project.countDocuments({ isDemo: true }),
      Task.countDocuments({ isDemo: true }),
      User.countDocuments({ isDemo: { $ne: true } }),
      Project.countDocuments({ isDemo: { $ne: true } }),
    ]);

    res.status(200).json({
      success: true,
      isDemoWorkspace: true,
      stats: {
        demoUsers,
        demoProjects,
        demoTasks,
        customUsers,
        customProjects,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch demo workspace info',
      error: error.message,
    });
  }
}
