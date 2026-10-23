import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { Comment } from '../models/Comment.ts';
import { Task } from '../models/Task.ts';
import { Project } from '../models/Project.ts';
import { createCommentSchema } from '../validators/schemas.ts';

export async function getTaskComments(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const taskId = req.params.id || req.params.taskId || (req.query.task as string);
    const user = req.user!;

    if (!taskId) {
      res.status(400).json({ success: false, message: 'Task ID is required' });
      return;
    }

    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    const project: any = task.project;

    // Membership check: Admin, manager, or member
    if (user.role !== 'admin') {
      const isManager = project.manager.toString() === user._id.toString();
      const isMember = project.members.some(
        (m: any) => m.user.toString() === user._id.toString()
      );
      if (!isManager && !isMember) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have access to view comments for this task.',
        });
        return;
      }
    }

    const comments = await Comment.find({ task: task._id })
      .populate('author', 'name email role avatar title department')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve comments',
      error: error.message,
    });
  }
}

export async function createComment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params; // task ID
    const user = req.user!;

    // Viewers cannot post comments
    if (user.role === 'viewer') {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Viewers have read-only access and cannot post comments.',
      });
      return;
    }

    const parseResult = createCommentSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { content, task: bodyTaskId } = parseResult.data;
    const taskId = req.params.id || req.params.taskId || bodyTaskId;

    if (!taskId) {
      res.status(400).json({ success: false, message: 'Task ID is required' });
      return;
    }

    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    const project: any = task.project;

    // Membership check
    if (user.role !== 'admin') {
      const isManager = project.manager.toString() === user._id.toString();
      const isMember = project.members.some(
        (m: any) => m.user.toString() === user._id.toString()
      );
      if (!isManager && !isMember) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You are not a member of this project.',
        });
        return;
      }
    }

    const comment = new Comment({
      task: task._id,
      project: project._id,
      author: user._id,
      content,
    });

    await comment.save();
    await comment.populate('author', 'name email role avatar title department');

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message,
    });
  }
}

export async function deleteComment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params; // comment ID
    const user = req.user!;

    const comment = await Comment.findById(id).populate('project');
    if (!comment) {
      res.status(404).json({ success: false, message: 'Comment not found' });
      return;
    }

    const project: any = comment.project;
    const isAuthor = comment.author.toString() === user._id.toString();
    const isManager =
      user.role === 'admin' ||
      (user.role === 'project_manager' && project.manager.toString() === user._id.toString());

    // Only comment author, project manager, or admin can delete comments
    if (!isAuthor && !isManager) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You can only delete your own comments unless you are a Project Manager or Admin.',
      });
      return;
    }

    await Comment.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
      id,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: error.message,
    });
  }
}
