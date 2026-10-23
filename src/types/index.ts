export type UserRole = 'admin' | 'project_manager' | 'team_member' | 'viewer';
export type UserStatus = 'active' | 'inactive';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  title?: string;
  department?: string;
  isDemo?: boolean;
  createdAt?: string;
}

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
export type ProjectMemberRole = 'manager' | 'contributor' | 'reviewer' | 'viewer';

export interface ProjectMember {
  user: User;
  role: ProjectMemberRole;
  joinedAt: string;
}

export interface ProjectStats {
  total: number;
  done: number;
  inProgress: number;
  inReview: number;
  todo: number;
  overdue: number;
  progress: number;
}

export interface Project {
  id: string;
  _id?: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate?: string;
  dueDate?: string;
  manager: User;
  members: ProjectMember[];
  membersCount?: number;
  isArchived: boolean;
  isDemo?: boolean;
  color?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
  stats?: ProjectStats;
}

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  _id: string;
  title: string;
  description: string;
  project: Project | { _id: string; name: string; color?: string };
  assignee?: User | null;
  creator: User;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  version: number; // Concurrency control
  tags: string[];
  estimatedHours?: number;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  id?: string;
  task: string;
  project: string;
  author: User;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  inReviewTasks: number;
  todoTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  myTasksCount: number;
  myPendingCount: number;
  myOverdueCount: number;
}
