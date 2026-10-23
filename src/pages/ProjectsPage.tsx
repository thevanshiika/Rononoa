import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Project, ProjectStatus } from '../types/index.ts';
import { Badge } from '../components/common/Badge.tsx';
import { ProjectModal } from '../components/projects/ProjectModal.tsx';
import {
  FolderKanban,
  Plus,
  Search,
  Users,
  CheckCircle2,
  Calendar,
  Archive,
  MoreVertical,
  ExternalLink,
} from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const { user, isAdmin, isProjectManager, isViewer } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      let url = `/projects?archived=${showArchived}`;
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }

      const res = await api.get(url);
      if (res.data.success) {
        setProjects(res.data.projects);
      }
    } catch (err) {
      console.error('Failed to fetch projects', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [statusFilter, showArchived]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProjects();
  };

  const handleArchiveToggle = async (project: Project) => {
    try {
      await api.patch(`/projects/${project.id || (project as any)._id}/archive`);
      fetchProjects();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to archive project');
    }
  };

  const canCreate = isAdmin || isProjectManager;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Projects</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage projects, teams, deadlines, and task pipelines.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => {
              setEditingProject(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-2xs"
          >
            <Plus className="h-4 w-4" /> New Project
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by name, category, or description..."
            className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </form>

        {/* Filter buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 font-medium rounded-md transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-2.5 py-1 font-medium rounded-md transition-colors ${
                statusFilter === 'active'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('planning')}
              className={`px-2.5 py-1 font-medium rounded-md transition-colors ${
                statusFilter === 'planning'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Planning
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-2.5 py-1 font-medium rounded-md transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed
            </button>
          </div>

          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
              showArchived
                ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Archive className="h-3 w-3" />
            <span>{showArchived ? 'Viewing Archived' : 'Archived'}</span>
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-xl bg-white p-5 border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center border border-slate-200">
          <FolderKanban className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900">No projects found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search
              ? 'No projects match your search criteria. Try a different query.'
              : 'You do not have access to any projects yet.'}
          </p>
          {canCreate && !search && (
            <button
              onClick={() => {
                setEditingProject(null);
                setIsModalOpen(true);
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" /> Create First Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => {
            const projectId = project.id || (project as any)._id;
            const isManager =
              isAdmin ||
              (project.manager &&
                ((project.manager as any)._id === user?.id || project.manager.id === user?.id));

            return (
              <div
                key={projectId}
                className="rounded-xl bg-white p-5 border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Category, Demo Badge, and Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-[11px] font-semibold text-slate-500 truncate">
                        {project.category || 'General'}
                      </span>
                      {project.isDemo ? (
                        <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          Demo
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          Custom
                        </span>
                      )}
                    </div>
                    <Badge type="project_status" value={project.status} />
                  </div>

                  {/* Title & description */}
                  <Link
                    to={`/projects/${projectId}`}
                    className="text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors block line-clamp-1"
                  >
                    {project.name}
                  </Link>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {project.description || 'No description provided.'}
                  </p>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500">Progress</span>
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {project.stats?.progress ?? 0}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                        style={{ width: `${project.stats?.progress ?? 0}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                      <span>{project.stats?.done ?? 0} of {project.stats?.total ?? 0} tasks completed</span>
                      {project.stats && project.stats.overdue > 0 && (
                        <span className="text-rose-600 font-medium">{project.stats.overdue} overdue</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Manager, Members, and Action Links */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200">
                      {project.manager?.name ? project.manager.name.slice(0, 2).toUpperCase() : 'PM'}
                    </div>
                    <span className="text-slate-600 font-medium truncate max-w-[100px]">
                      {project.manager?.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/projects/${projectId}/tasks`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      Tasks <ExternalLink className="h-3 w-3" />
                    </Link>

                    {isManager && !isViewer && (
                      <button
                        onClick={() => {
                          setEditingProject(project);
                          setIsModalOpen(true);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        title="Edit Project"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProject(null);
        }}
        project={editingProject}
        onSuccess={fetchProjects}
      />
    </div>
  );
};
