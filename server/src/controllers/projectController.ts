import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { Project, IProject } from '../models/Project.ts';
import { Task } from '../models/Task.ts';
import { User } from '../models/User.ts';
import {
  createProjectSchema,
  updateProjectSchema,
  addTeamMemberSchema,
  updateMemberRoleSchema,
} from '../validators/schemas.ts';

export async function getProjects(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const { status, search, archived } = req.query;

    const filter: any = {};

    // RBAC: Admins can view all projects. Non-admins can only view projects where they are manager or member
    if (user.role !== 'admin') {
      filter.$or = [
        { manager: user._id },
        { 'members.user': user._id },
      ];
    }

    if (archived === 'true') {
      filter.isArchived = true;
    } else if (archived === 'false' || archived === undefined) {
      filter.isArchived = false;
    }

    if (status && typeof status === 'string' && status !== 'all') {
      filter.status = status;
    }

    if (search && typeof search === 'string') {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
        ],
      });
    }

    const projects = await Project.find(filter)
      .populate('manager', 'name email role avatar title')
      .populate('members.user', 'name email role avatar title')
      .sort({ updatedAt: -1 });

    // Compute task counts and progress for each project
    const projectIds = projects.map((p) => p._id);
    const taskAggregations = await Task.aggregate([
      { $match: { project: { $in: projectIds } } },
      {
        $group: {
          _id: '$project',
          total: { $sum: 1 },
          done: {
            $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] },
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] },
          },
          inReview: {
            $sum: { $cond: [{ $eq: ['$status', 'in_review'] }, 1, 0] },
          },
          todo: {
            $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] },
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$status', 'done'] },
                    { $lt: ['$dueDate', new Date()] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const statsMap = new Map();
    taskAggregations.forEach((item) => {
      statsMap.set(item._id.toString(), item);
    });

    const enrichedProjects = projects.map((p) => {
      const stats = statsMap.get(p._id.toString()) || {
        total: 0,
        done: 0,
        inProgress: 0,
        inReview: 0,
        todo: 0,
        overdue: 0,
      };

      const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

      return {
        id: p._id,
        name: p.name,
        description: p.description,
        status: p.status,
        startDate: p.startDate,
        dueDate: p.dueDate,
        manager: p.manager,
        membersCount: p.members.length,
        members: p.members,
        isArchived: p.isArchived,
        color: p.color,
        category: p.category,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        stats: {
          ...stats,
          progress,
        },
      };
    });

    res.status(200).json({
      success: true,
      count: enrichedProjects.length,
      projects: enrichedProjects,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
      error: error.message,
    });
  }
}

export async function getProjectById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const user = req.user!;

    const project = await Project.findById(id)
      .populate('manager', 'name email role avatar title department')
      .populate('members.user', 'name email role avatar title department');

    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    // Permission check: Admin or assigned manager or member
    if (user.role !== 'admin') {
      const isManager = project.manager && (project.manager as any)._id.toString() === user._id.toString();
      const isMember = project.members.some((m) => m.user && (m.user as any)._id.toString() === user._id.toString());
      if (!isManager && !isMember) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to access this project.',
        });
        return;
      }
    }

    // Compute project task statistics
    const tasks = await Task.find({ project: project._id });
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === 'done').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const inReview = tasks.filter((t) => t.status === 'in_review').length;
    const todo = tasks.filter((t) => t.status === 'todo').length;
    const overdue = tasks.filter(
      (t) => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < new Date()
    ).length;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;

    res.status(200).json({
      success: true,
      project: {
        id: project._id,
        name: project.name,
        description: project.description,
        status: project.status,
        startDate: project.startDate,
        dueDate: project.dueDate,
        manager: project.manager,
        members: project.members,
        isArchived: project.isArchived,
        color: project.color,
        category: project.category,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        stats: {
          total,
          done,
          inProgress,
          inReview,
          todo,
          overdue,
          progress,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve project',
      error: error.message,
    });
  }
}

export async function createProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;

    // Only Admin or Project Manager can create projects
    if (user.role !== 'admin' && user.role !== 'project_manager') {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Only Admins and Project Managers can create new projects.',
      });
      return;
    }

    const parseResult = createProjectSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const {
      name,
      description,
      status,
      startDate,
      dueDate,
      manager,
      category,
      color,
      initialMembers,
    } = parseResult.data;

    // Verify manager exists (defaults to creator if omitted)
    const managerId = parseResult.data.manager || user._id.toString();
    const managerUser = await User.findById(managerId);
    if (!managerUser) {
      res.status(400).json({ success: false, message: 'Designated manager does not exist' });
      return;
    }

    // Prepare initial members list (ensuring manager is included as a member too)
    const membersList: any[] = [];
    membersList.push({
      user: managerUser._id,
      role: 'manager',
      joinedAt: new Date(),
    });

    if (initialMembers && Array.isArray(initialMembers)) {
      for (const m of initialMembers) {
        if (m.userId !== managerUser._id.toString()) {
          const u = await User.findById(m.userId);
          if (u) {
            membersList.push({
              user: u._id,
              role: m.role || 'contributor',
              joinedAt: new Date(),
            });
          }
        }
      }
    }

    const project = new Project({
      name,
      description,
      status,
      startDate: startDate ? new Date(startDate) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      manager: managerUser._id,
      members: membersList,
      category,
      color,
      isArchived: false,
    });

    await project.save();
    await project.populate('manager', 'name email role avatar title');
    await project.populate('members.user', 'name email role avatar title');

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: error.message,
    });
  }
}

export async function updateProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const user = req.user!;

    const project = await Project.findById(id);
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    // Permission: Admin or the project manager of this project
    const isProjectManager =
      user.role === 'project_manager' &&
      project.manager.toString() === user._id.toString();

    if (user.role !== 'admin' && !isProjectManager) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Only the assigned Project Manager or an Admin can modify this project.',
      });
      return;
    }

    const parseResult = updateProjectSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const updates = parseResult.data;

    if (updates.name) project.name = updates.name;
    if (updates.description !== undefined) project.description = updates.description;
    if (updates.status) project.status = updates.status;
    if (updates.startDate) project.startDate = new Date(updates.startDate);
    if (updates.dueDate !== undefined) {
      project.dueDate = updates.dueDate ? new Date(updates.dueDate) : undefined;
    }
    if (updates.category) project.category = updates.category;
    if (updates.color) project.color = updates.color;
    if (updates.isArchived !== undefined) project.isArchived = updates.isArchived;

    // Only Admin can reassign project manager
    if (updates.manager && updates.manager !== project.manager.toString()) {
      if (user.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Forbidden: Only administrators can reassign project managers.',
        });
        return;
      }
      const newManager = await User.findById(updates.manager);
      if (!newManager) {
        res.status(400).json({ success: false, message: 'New manager user not found' });
        return;
      }
      project.manager = newManager._id;

      // Ensure new manager is in members list
      const hasMember = project.members.some((m) => m.user.toString() === newManager._id.toString());
      if (!hasMember) {
        project.members.push({
          user: newManager._id,
          role: 'manager',
          joinedAt: new Date(),
        });
      }
    }

    await project.save();
    await project.populate('manager', 'name email role avatar title');
    await project.populate('members.user', 'name email role avatar title');

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      project,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update project',
      error: error.message,
    });
  }
}

export async function archiveProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const user = req.user!;

    const project = await Project.findById(id);
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    // Permission: Admin or the project manager
    const isProjectManager =
      user.role === 'project_manager' &&
      project.manager.toString() === user._id.toString();

    if (user.role !== 'admin' && !isProjectManager) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Only the assigned Project Manager or an Admin can archive this project.',
      });
      return;
    }

    project.isArchived = !project.isArchived;
    if (project.isArchived) {
      project.status = 'archived';
    } else {
      project.status = 'active';
    }

    await project.save();

    res.status(200).json({
      success: true,
      message: `Project has been ${project.isArchived ? 'archived' : 'unarchived'}.`,
      isArchived: project.isArchived,
      status: project.status,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to archive project',
      error: error.message,
    });
  }
}

export async function getProjectTeam(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const user = req.user!;

    const project = await Project.findById(id)
      .populate('manager', 'name email role avatar title department')
      .populate('members.user', 'name email role avatar title department');

    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    // Check membership
    if (user.role !== 'admin') {
      const isManager = project.manager && (project.manager as any)._id.toString() === user._id.toString();
      const isMember = project.members.some((m) => m.user && (m.user as any)._id.toString() === user._id.toString());
      if (!isManager && !isMember) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }
    }

    res.status(200).json({
      success: true,
      manager: project.manager,
      members: project.members,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve team members',
      error: error.message,
    });
  }
}

export async function addProjectMember(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const user = req.user!;

    const project = await Project.findById(id);
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    // Permission: Admin or the project manager of this project
    const isProjectManager =
      user.role === 'project_manager' &&
      project.manager.toString() === user._id.toString();

    if (user.role !== 'admin' && !isProjectManager) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Only the assigned Project Manager or an Admin can add team members.',
      });
      return;
    }

    const parseResult = addTeamMemberSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { userId, name, email, globalRole, role, title, department } = parseResult.data;

    let targetUser: any = null;
    let isNewUserCreated = false;

    if (userId) {
      targetUser = await User.findById(userId);
      if (!targetUser) {
        res.status(404).json({ success: false, message: 'User to add not found in workspace' });
        return;
      }
    } else if (email) {
      targetUser = await User.findOne({ email: email.toLowerCase() });
      if (!targetUser) {
        // If user is Admin, provision account on the spot
        if (user.role === 'admin') {
          targetUser = new User({
            name: name || email.split('@')[0],
            email: email.toLowerCase(),
            password: 'Password123!',
            role: globalRole || 'team_member',
            title: title || 'Team Member',
            department: department || 'Engineering',
            status: 'active',
            isDemo: false,
          });
          await targetUser.save();
          isNewUserCreated = true;
        } else {
          res.status(404).json({
            success: false,
            message: `User with email "${email}" is not yet registered. An Administrator must provision their account first, or you may select an existing registered member from the directory.`,
          });
          return;
        }
      }
    } else {
      res.status(400).json({
        success: false,
        message: 'Either userId or an email address must be provided to add a member.',
      });
      return;
    }

    // Prevent duplicate membership
    const alreadyMember = project.members.some((m) => m.user.toString() === targetUser._id.toString());
    if (alreadyMember) {
      res.status(400).json({
        success: false,
        message: `${targetUser.name} is already an active member of this project.`,
      });
      return;
    }

    project.members.push({
      user: targetUser._id,
      role: role || 'contributor',
      joinedAt: new Date(),
    });

    await project.save();
    await project.populate('members.user', 'name email role avatar title department isDemo');

    res.status(201).json({
      success: true,
      message: isNewUserCreated
        ? `Account provisioned for ${targetUser.name} (${targetUser.email}) and added to project!`
        : `${targetUser.name} added to project team successfully!`,
      isNewUserCreated,
      temporaryPassword: isNewUserCreated ? 'Password123!' : undefined,
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
      members: project.members,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to add project member',
      error: error.message,
    });
  }
}

export async function updateMemberRole(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id, userId } = req.params;
    const user = req.user!;

    const project = await Project.findById(id);
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    const isProjectManager =
      user.role === 'project_manager' &&
      project.manager.toString() === user._id.toString();

    if (user.role !== 'admin' && !isProjectManager) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Only the assigned Project Manager or an Admin can update member roles.',
      });
      return;
    }

    const parseResult = updateMemberRoleSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { role } = parseResult.data;

    const member = project.members.find((m) => m.user.toString() === userId);
    if (!member) {
      res.status(404).json({ success: false, message: 'Member not found in this project' });
      return;
    }

    member.role = role;
    await project.save();
    await project.populate('members.user', 'name email role avatar title department');

    res.status(200).json({
      success: true,
      message: 'Member role updated successfully',
      members: project.members,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update member role',
      error: error.message,
    });
  }
}

export async function removeProjectMember(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id, userId } = req.params;
    const user = req.user!;

    const project = await Project.findById(id);
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    const isProjectManager =
      user.role === 'project_manager' &&
      project.manager.toString() === user._id.toString();

    if (user.role !== 'admin' && !isProjectManager) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Only the assigned Project Manager or an Admin can remove team members.',
      });
      return;
    }

    // Cannot remove the project manager without reassigning
    if (project.manager.toString() === userId) {
      res.status(400).json({
        success: false,
        message: 'Cannot remove the primary project manager. Reassign the project manager first.',
      });
      return;
    }

    const initialLength = project.members.length;
    project.members = project.members.filter((m) => m.user.toString() !== userId);

    if (project.members.length === initialLength) {
      res.status(404).json({ success: false, message: 'User is not a member of this project' });
      return;
    }

    await project.save();

    // Unassign tasks assigned to this removed member in this project
    await Task.updateMany(
      { project: project._id, assignee: new mongoose.Types.ObjectId(userId) },
      { $set: { assignee: null } }
    );

    res.status(200).json({
      success: true,
      message: 'Member removed from project and their tasks unassigned.',
      membersCount: project.members.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to remove project member',
      error: error.message,
    });
  }
}
