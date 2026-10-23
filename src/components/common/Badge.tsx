import React from 'react';
import { TaskStatus, TaskPriority, ProjectStatus, UserRole } from '../../types/index.ts';

interface BadgeProps {
  type: 'status' | 'priority' | 'project_status' | 'role';
  value: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, value, className = '' }) => {
  if (type === 'status') {
    const status = value as TaskStatus;
    const styles: Record<TaskStatus, { label: string; cls: string }> = {
      todo: { label: 'To Do', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
      in_progress: { label: 'In Progress', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
      in_review: { label: 'In Review', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
      done: { label: 'Done', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    };

    const current = styles[status] || { label: value, cls: 'bg-slate-100 text-slate-700 border-slate-200' };

    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${current.cls} ${className}`}
      >
        {current.label}
      </span>
    );
  }

  if (type === 'priority') {
    const priority = value as TaskPriority;
    const styles: Record<TaskPriority, { label: string; dot: string; text: string }> = {
      low: { label: 'Low', dot: 'bg-slate-400', text: 'text-slate-600' },
      medium: { label: 'Medium', dot: 'bg-blue-500', text: 'text-blue-700' },
      high: { label: 'High', dot: 'bg-amber-500', text: 'text-amber-700' },
      urgent: { label: 'Urgent', dot: 'bg-rose-500', text: 'text-rose-700 font-semibold' },
    };

    const current = styles[priority] || { label: value, dot: 'bg-slate-400', text: 'text-slate-600' };

    return (
      <span className={`inline-flex items-center gap-1.5 text-xs ${current.text} ${className}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`} />
        <span>{current.label}</span>
      </span>
    );
  }

  if (type === 'project_status') {
    const pStatus = value as ProjectStatus;
    const styles: Record<ProjectStatus, { label: string; cls: string }> = {
      planning: { label: 'Planning', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
      active: { label: 'Active', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      on_hold: { label: 'On Hold', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
      completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      archived: { label: 'Archived', cls: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
    };

    const current = styles[pStatus] || { label: value, cls: 'bg-slate-100 text-slate-700 border-slate-200' };

    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${current.cls} ${className}`}
      >
        {current.label}
      </span>
    );
  }

  if (type === 'role') {
    const role = value as UserRole;
    const labels: Record<UserRole, { label: string; cls: string }> = {
      admin: { label: 'Admin', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
      project_manager: { label: 'Project Manager', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
      team_member: { label: 'Team Member', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
      viewer: { label: 'Viewer', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    };

    const current = labels[role] || { label: value, cls: 'bg-slate-100 text-slate-700 border-slate-200' };

    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${current.cls} ${className}`}
      >
        {current.label}
      </span>
    );
  }

  return <span>{value}</span>;
};
