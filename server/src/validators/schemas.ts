import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'project_manager', 'team_member', 'viewer']).default('team_member'),
  title: z.string().optional(),
  department: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['admin', 'project_manager', 'team_member', 'viewer']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  title: z.string().optional(),
  department: z.string().optional(),
  avatar: z.string().optional(),
});

export const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters').max(100),
  description: z.string().max(2000).optional().default(''),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'archived']).default('active'),
  startDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
  dueDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
  manager: z.string().optional(),
  category: z.string().optional().default('Product Engineering'),
  color: z.string().optional().default('#4F46E5'),
  initialMembers: z
    .array(
      z.object({
        userId: z.string(),
        role: z.enum(['manager', 'contributor', 'reviewer', 'viewer']).default('contributor'),
      })
    )
    .optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'archived']).optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  manager: z.string().optional(),
  category: z.string().optional(),
  color: z.string().optional(),
  isArchived: z.boolean().optional(),
});

export const addTeamMemberSchema = z.object({
  userId: z.string().optional(),
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  globalRole: z.enum(['admin', 'project_manager', 'team_member', 'viewer']).optional(),
  role: z.enum(['manager', 'contributor', 'reviewer', 'viewer']).default('contributor'),
  title: z.string().optional(),
  department: z.string().optional(),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['manager', 'contributor', 'reviewer', 'viewer']),
});

export const createTaskSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(150),
  description: z.string().max(5000).optional().default(''),
  project: z.string().min(1, 'Project ID is required'),
  assignee: z.string().nullable().optional(),
  status: z.enum(['todo', 'in_progress', 'in_review', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  dueDate: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  estimatedHours: z.number().min(0).optional().default(0),
});

export const updateTaskSchema = z.object({
  title: z.string().min(2).max(150).optional(),
  description: z.string().max(5000).optional(),
  assignee: z.string().nullable().optional(),
  status: z.enum(['todo', 'in_progress', 'in_review', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  estimatedHours: z.number().min(0).optional(),
  // Optimistic concurrency version check
  version: z.number().int().min(1, 'Current task version is required for concurrency control'),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000),
  task: z.string().optional(),
});
