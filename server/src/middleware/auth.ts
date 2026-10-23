import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/token.ts';
import { User, IUser, UserRole } from '../models/User.ts';
import { Project, IProject } from '../models/Project.ts';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  tokenPayload?: TokenPayload;
  project?: IProject;
  userProjectRole?: string;
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Missing or malformed Bearer token.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired session token. Please log in again.',
      });
      return;
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User account associated with this token no longer exists.',
      });
      return;
    }

    if (user.status === 'inactive') {
      res.status(403).json({
        success: false,
        message: 'Your account has been deactivated by an administrator.',
      });
      return;
    }

    req.user = user;
    req.tokenPayload = decoded;
    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Authentication internal error',
      error: error.message,
    });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthenticated' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: This action requires one of the following roles: [${allowedRoles.join(
          ', '
        )}]. Your current role is: ${req.user.role}`,
      });
      return;
    }

    next();
  };
}

export function preventViewerWrite(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.user?.role === 'viewer') {
    res.status(403).json({
      success: false,
      message: 'Forbidden: Viewer accounts have read-only access and cannot create, modify, or delete resources.',
    });
    return;
  }
  next();
}

export async function checkProjectMembership(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const projectId = req.params.id || req.params.projectId || req.body.project;

    if (!projectId) {
      res.status(400).json({ success: false, message: 'Project ID is required' });
      return;
    }

    const project = await Project.findById(projectId);
    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    const user = req.user!;

    // Admins have global access
    if (user.role === 'admin') {
      req.project = project;
      req.userProjectRole = 'admin';
      return next();
    }

    // Is the user the project manager?
    const isManager = project.manager.toString() === user._id.toString();
    if (isManager) {
      req.project = project;
      req.userProjectRole = 'manager';
      return next();
    }

    // Is the user a member of the project?
    const memberEntry = project.members.find(
      (m) => m.user.toString() === user._id.toString()
    );

    if (memberEntry) {
      req.project = project;
      req.userProjectRole = memberEntry.role;
      return next();
    }

    // User is neither Admin, Manager, nor a member
    res.status(403).json({
      success: false,
      message: 'Forbidden: You are not a member of this project and cannot access its resources.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error verifying project membership',
      error: error.message,
    });
  }
}

export async function requireProjectManagement(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const user = req.user!;
  const project = req.project;

  if (!project) {
    res.status(500).json({ success: false, message: 'Project context not loaded' });
    return;
  }

  // Admin always has management power
  if (user.role === 'admin') {
    return next();
  }

  // Project manager of this specific project has management power
  const isManager =
    project.manager.toString() === user._id.toString() ||
    req.userProjectRole === 'manager';

  if (isManager && user.role === 'project_manager') {
    return next();
  }

  res.status(403).json({
    success: false,
    message: 'Forbidden: Only the assigned Project Manager or an Admin can manage this project, its team, and its configuration.',
  });
}
