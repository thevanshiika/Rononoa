import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Project } from '../types/index.ts';
import { Badge } from '../components/common/Badge.tsx';
import { ProjectModal } from '../components/projects/ProjectModal.tsx';
import {
  FolderKanban,
  CheckSquare,
  Users,
  Calendar,
  Clock,
  Edit3,
  Archive,
  ArrowLeft,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin, isViewer } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchProject = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/projects/${id}`);
      if (res.data.success) {
        setProject(res.data.project);
      }
    } catch (err: any) {
      console.error('Failed to load project details', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const handleArchive = async () => {
    if (!project) return;
    try {
      await api.patch(`/projects/${project.id || (project as any)._id}/archive`);
      fetchProject();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to archive project');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <h3 className="text-sm font-bold text-slate-900">Project Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">This project does not exist or you do not have permission.</p>
        <Link to="/projects" className="mt-4 inline-block text-xs font-semibold text-indigo-600">
          Back to Projects
        </Link>
      </div>
    );
  }

  const projectId = project.id || (project as any)._id;
  const isManager =
    isAdmin ||
    (project.manager &&
      ((project.manager as any)._id === user?.id || project.manager.id === user?.id));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back button and Header */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/projects" className="hover:text-slate-800 flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Projects
        </Link>
      </div>

      <div className="rounded-xl bg-white p-6 border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-slate-500">{project.category}</span>
              <Badge type="project_status" value={project.status} />
              {project.isArchived && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200">
                  Archived
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
            <p className="text-xs text-slate-600 mt-2 max-w-3xl leading-relaxed">
              {project.description || 'No description set for this project.'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {isManager && !isViewer && (
              <>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Edit Project
                </button>
                <button
                  onClick={handleArchive}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Archive className="h-3.5 w-3.5" /> {project.isArchived ? 'Unarchive' : 'Archive'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Sub-navigation tabs */}
        <div className="flex items-center gap-6 mt-6 border-t border-slate-200 pt-4 text-xs font-semibold">
          <span className="text-indigo-600 border-b-2 border-indigo-600 pb-2">Overview</span>
          <Link
            to={`/projects/${projectId}/tasks`}
            className="text-slate-600 hover:text-slate-900 pb-2 transition-colors flex items-center gap-1"
          >
            Tasks <ExternalLink className="h-3 w-3" />
          </Link>
          <Link
            to={`/projects/${projectId}/team`}
            className="text-slate-600 hover:text-slate-900 pb-2 transition-colors flex items-center gap-1"
          >
            Team ({project.members?.length || 0}) <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-white p-4 border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Completion Rate</span>
            <CheckSquare className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="text-xl font-bold text-slate-900 tabular-nums">
            {project.stats?.progress ?? 0}%
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full"
              style={{ width: `${project.stats?.progress ?? 0}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl bg-white p-4 border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Tasks</span>
            <FolderKanban className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-slate-900 tabular-nums">
            {project.stats?.done ?? 0} / {project.stats?.total ?? 0}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Completed tasks</span>
        </div>

        <div className="rounded-xl bg-white p-4 border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Project Manager</span>
            <Users className="h-4 w-4 text-purple-600" />
          </div>
          <p className="text-xs font-bold text-slate-900 truncate">
            {project.manager?.name || 'Unassigned'}
          </p>
          <span className="text-[11px] text-slate-400 truncate block">
            {project.manager?.email}
          </span>
        </div>

        <div className="rounded-xl bg-white p-4 border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Target Deadline</span>
            <Calendar className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-xs font-bold text-slate-900">
            {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'No date set'}
          </p>
          {project.stats && project.stats.overdue > 0 && (
            <span className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> {project.stats.overdue} overdue tasks
            </span>
          )}
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-indigo-600" /> Task Management
            </h3>
            <Link
              to={`/projects/${projectId}/tasks`}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Open Kanban Board →
            </Link>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            Filter tasks by status, priority, or assignee. Change workflow states from To Do to Done.
          </p>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-slate-600">To Do: {project.stats?.todo ?? 0}</span>
            <span className="text-blue-600">In Progress: {project.stats?.inProgress ?? 0}</span>
            <span className="text-amber-600">In Review: {project.stats?.inReview ?? 0}</span>
            <span className="text-emerald-600">Done: {project.stats?.done ?? 0}</span>
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-600" /> Project Team Members
            </h3>
            <Link
              to={`/projects/${projectId}/team`}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Manage Team →
            </Link>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            {project.members?.length || 0} active members currently collaborating on this project.
          </p>
          <div className="flex items-center -space-x-2 overflow-hidden">
            {project.members?.slice(0, 6).map((m: any, idx: number) => {
              const u = m.user || m;
              return (
                <div
                  key={idx}
                  title={`${u.name} (${m.role})`}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] border-2 border-white"
                >
                  {u.name ? u.name.slice(0, 2).toUpperCase() : 'U'}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <ProjectModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        project={project}
        onSuccess={fetchProject}
      />
    </div>
  );
};
