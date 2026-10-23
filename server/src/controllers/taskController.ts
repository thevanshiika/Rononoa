import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { Task, ITask } from '../models/Task.ts';
import { Project } from '../models/Project.ts';
import { User } from '../models/User.ts';
import { createTaskSchema, updateTaskSchema } from '../validators/schemas.ts';

export async function getProjectTasks(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params; // project ID
    const user = req.user!;
    const { status, priority, assignee, search, overdue, sortBy = 'createdAt', sortOrder = 'desc', page = '1', limit = '50' } = req.query;

    const project = await Project.findById(id);
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    // Membership check: Admin, manager, or member
    if (user.role !== 'admin') {
      const isManager = project.manager.toString() === user._id.toString();
      const isMember = project.members.some((m) => m.user.toString() === user._id.toString());
      if (!isManager && !isMember) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have access to tasks in this project.',
        });
        return;
      }
    }

    const query: any = { project: project._id };

    if (status && typeof status === 'string' && status !== 'all') {
      query.status = status;
    }

    if (priority && typeof priority === 'string' && priority !== 'all') {
      query.priority = priority;
    }

    if (assignee && typeof assignee === 'string' && assignee !== 'all') {
      if (assignee === 'unassigned') {
        query.assignee = null;
      } else {
        query.assignee = assignee;
      }
    }

    if (overdue === 'true') {
      query.status = { $ne: 'done' };
      query.dueDate = { $lt: new Date() };
    }

    if (search && typeof search === 'string') {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const sortObj: any = {};
    sortObj[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const [tasks, totalCount] = await Promise.all([
      Task.find(query)
        .populate('assignee', 'name email role avatar title')
        .populate('creator', 'name email role avatar')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum),
      Task.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: tasks.length,
      totalCount,
      page: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
      tasks,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tasks',
      error: error.message,
    });
  }
}

export async function getTaskById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const user = req.user!;

    const task = await Task.findById(id)
      .populate('assignee', 'name email role avatar title department')
      .populate('creator', 'name email role avatar title department')
      .populate('project', 'name description status manager members color');

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    const project: any = task.project;

    // Check membership access
    if (user.role !== 'admin') {
      const isManager = project.manager.toString() === user._id.toString();
      const isMember = project.members.some(
        (m: any) => m.user.toString() === user._id.toString()
      );
      if (!isManager && !isMember) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You are not authorized to view this task.',
        });
        return;
      }
    }

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve task details',
      error: error.message,
    });
  }
}

export async function createTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;

    // Viewers cannot create tasks
    if (user.role === 'viewer') {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Viewer role has read-only permissions.',
      });
      return;
    }

    const parseResult = createTaskSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const {
      title,
      description,
      project: projectId,
      assignee,
      status,
      priority,
      dueDate,
      tags,
      estimatedHours,
    } = parseResult.data;

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ success: false, message: 'Associated project not found' });
      return;
    }

    // Role check: Admin, Project Manager of this project, or Team Member in this project
    const isProjectManager =
      user.role === 'admin' ||
      (user.role === 'project_manager' && project.manager.toString() === user._id.toString());
    const isMember = project.members.some((m) => m.user.toString() === user._id.toString());

    if (!isProjectManager && !isMember) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You are not a member of this project.',
      });
      return;
    }

    // Validate assignee if provided: MUST be a member of the project!
    let validatedAssigneeId: mongoose.Types.ObjectId | null = null;
    if (assignee) {
      const assigneeUser = await User.findById(assignee);
      if (!assigneeUser) {
        res.status(400).json({
          success: false,
          message: 'Specified assignee does not exist',
        });
        return;
      }

      const isAssigneeInProject =
        project.manager.toString() === assignee ||
        project.members.some((m) => m.user.toString() === assignee);

      if (!isAssigneeInProject) {
        res.status(400).json({
          success: false,
          message: 'Invalid assignment: Assignee must be an active member of this project.',
        });
        return;
      }
      validatedAssigneeId = assigneeUser._id;
    }

    const task = new Task({
      title,
      description,
      project: project._id,
      assignee: validatedAssigneeId,
      creator: user._id,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      tags: tags || [],
      estimatedHours: estimatedHours || 0,
      version: 1, // Start with version 1
    });

    await task.save();
    await task.populate('assignee', 'name email role avatar title');
    await task.populate('creator', 'name email role avatar');

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create task',
      error: error.message,
    });
  }
}

/**
 * Optimistic Concurrency Control (OCC) Task Update
 * Atomically checks submitted version and increments it ($inc: { version: 1 }).
 * Returns 409 Conflict if current version does not match submitted version.
 */
export async function updateTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const user = req.user!;

    // Viewers cannot update tasks
    if (user.role === 'viewer') {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Viewers have read-only access and cannot update tasks.',
      });
      return;
    }

    const parseResult = updateTaskSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const {
      title,
      description,
      assignee,
      status,
      priority,
      dueDate,
      tags,
      estimatedHours,
      version: submittedVersion,
    } = parseResult.data;

    // Load existing task first to check permissions and project rules
    const existingTask = await Task.findById(id).populate('project');
    if (!existingTask) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    const project: any = existingTask.project;
    const isProjectManager =
      user.role === 'admin' ||
      (user.role === 'project_manager' && project.manager.toString() === user._id.toString());
    const isAssignedUser =
      existingTask.assignee && existingTask.assignee.toString() === user._id.toString();
    const isMember = project.members.some(
      (m: any) => m.user.toString() === user._id.toString()
    );

    if (!isProjectManager && !isMember) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to modify tasks in this project.',
      });
      return;
    }

    // Prepare update fields based on role
    const updateFields: any = {};

    if (isProjectManager) {
      // PM and Admin can update everything
      if (title !== undefined) updateFields.title = title;
      if (description !== undefined) updateFields.description = description;
      if (status !== undefined) updateFields.status = status;
      if (priority !== undefined) updateFields.priority = priority;
      if (dueDate !== undefined) {
        updateFields.dueDate = dueDate ? new Date(dueDate) : null;
      }
      if (tags !== undefined) updateFields.tags = tags;
      if (estimatedHours !== undefined) updateFields.estimatedHours = estimatedHours;

      // Assignee validation
      if (assignee !== undefined) {
        if (assignee === null || assignee === '') {
          updateFields.assignee = null;
        } else {
          const assigneeUser = await User.findById(assignee);
          if (!assigneeUser) {
            res.status(400).json({ success: false, message: 'Assignee user not found' });
            return;
          }
          const isMemberInProject =
            project.manager.toString() === assignee ||
            project.members.some((m: any) => m.user.toString() === assignee);

          if (!isMemberInProject) {
            res.status(400).json({
              success: false,
              message: 'Invalid assignment: Assignee must be an active member of this project.',
            });
            return;
          }
          updateFields.assignee = assigneeUser._id;
        }
      }
    } else {
      // Team Member: can update status, description / notes, tags
      // Cannot reassign, delete, or change core priorities unless allowed
      if (status !== undefined) updateFields.status = status;
      if (description !== undefined) updateFields.description = description;
      if (tags !== undefined) updateFields.tags = tags;

      // Attempting to reassign by a non-manager
      if (assignee !== undefined && assignee !== (existingTask.assignee?.toString() || null)) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: Team members cannot reassign tasks to other users. Only Project Managers and Admins can assign tasks.',
        });
        return;
      }
    }

    // ATOMIC CONDITIONAL UPDATE FOR OPTIMISTIC CONCURRENCY CONTROL:
    // Update only succeeds if `version: submittedVersion`.
    // In the same atomic operation, we increment version by 1.
    const updatedTask = await Task.findOneAndUpdate(
      {
        _id: id,
        version: submittedVersion,
      },
      {
        $set: updateFields,
        $inc: { version: 1 },
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate('assignee', 'name email role avatar title')
      .populate('creator', 'name email role avatar')
      .populate('project', 'name');

    if (!updatedTask) {
      // The update failed because version matched nothing (or task deleted).
      // Check if task still exists to distinguish 404 from 409 Conflict.
      const freshTask = await Task.findById(id)
        .populate('assignee', 'name email role avatar title')
        .populate('creator', 'name email role avatar');

      if (!freshTask) {
        res.status(404).json({ success: false, message: 'Task no longer exists.' });
        return;
      }

      // 409 Conflict returned!
      res.status(409).json({
        success: false,
        conflict: true,
        message: 'This task was updated by another user. Please reload the latest version before saving.',
        submittedVersion,
        currentVersion: freshTask.version,
        latestTask: freshTask,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      task: updatedTask,
      version: updatedTask.version,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update task',
      error: error.message,
    });
  }
}

export async function deleteTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const user = req.user!;

    const task = await Task.findById(id).populate('project');
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    const project: any = task.project;
    const isProjectManager =
      user.role === 'admin' ||
      (user.role === 'project_manager' && project.manager.toString() === user._id.toString());

    if (!isProjectManager) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Only the assigned Project Manager or an Admin can delete tasks.',
      });
      return;
    }

    await Task.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      id,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: error.message,
    });
  }
}

export async function getDashboardStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;

    // Find accessible projects
    const projectFilter: any = {};
    if (user.role !== 'admin') {
      projectFilter.$or = [
        { manager: user._id },
        { 'members.user': user._id },
      ];
    }

    const accessibleProjects = await Project.find(projectFilter).select('_id isArchived name status');
    const projectIds = accessibleProjects.map((p) => p._id);

    const totalProjects = accessibleProjects.length;
    const activeProjects = accessibleProjects.filter((p) => !p.isArchived && p.status === 'active').length;

    // Aggregate tasks for these projects
    const now = new Date();
    const taskQuery: any = { project: { $in: projectIds } };

    const allTasks = await Task.find(taskQuery)
      .populate('project', 'name color')
      .populate('assignee', 'name avatar')
      .sort({ updatedAt: -1 });

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.status === 'done').length;
    const inProgressTasks = allTasks.filter((t) => t.status === 'in_progress').length;
    const inReviewTasks = allTasks.filter((t) => t.status === 'in_review').length;
    const todoTasks = allTasks.filter((t) => t.status === 'todo').length;
    const overdueTasks = allTasks.filter((t) => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < now).length;
    const pendingTasks = totalTasks - completedTasks;

    // Status distribution
    const statusDistribution = [
      { name: 'To Do', value: todoTasks, key: 'todo', color: '#64748B' },
      { name: 'In Progress', value: inProgressTasks, key: 'in_progress', color: '#3B82F6' },
      { name: 'In Review', value: inReviewTasks, key: 'in_review', color: '#EAB308' },
      { name: 'Done', value: completedTasks, key: 'done', color: '#10B981' },
    ];

    // Priority distribution
    const priorityDistribution = [
      { name: 'Low', count: allTasks.filter((t) => t.priority === 'low').length, color: '#94A3B8' },
      { name: 'Medium', count: allTasks.filter((t) => t.priority === 'medium').length, color: '#3B82F6' },
      { name: 'High', count: allTasks.filter((t) => t.priority === 'high').length, color: '#F97316' },
      { name: 'Urgent', count: allTasks.filter((t) => t.priority === 'urgent').length, color: '#EF4444' },
    ];

    // Recent activity: last 10 updated tasks
    const recentTasks = allTasks.slice(0, 10).map((t) => ({
      id: t._id,
      title: t.title,
      project: t.project,
      assignee: t.assignee,
      status: t.status,
      priority: t.priority,
      version: t.version,
      isDemo: t.isDemo,
      updatedAt: t.updatedAt,
      dueDate: t.dueDate,
    }));

    // My Assigned Tasks (if team_member or any user)
    const myTasks = allTasks.filter(
      (t) => t.assignee && (t.assignee as any)._id.toString() === user._id.toString()
    );

    res.status(200).json({
      success: true,
      stats: {
        totalProjects,
        activeProjects,
        totalTasks,
        completedTasks,
        inProgressTasks,
        inReviewTasks,
        todoTasks,
        pendingTasks,
        overdueTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        myTasksCount: myTasks.length,
        myPendingCount: myTasks.filter((t) => t.status !== 'done').length,
        myOverdueCount: myTasks.filter((t) => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < now).length,
      },
      statusDistribution,
      priorityDistribution,
      recentTasks,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to compute dashboard statistics',
      error: error.message,
    });
  }
}
