import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Task, Project, TaskStatus, TaskPriority } from '../types/index.ts';
import { Badge } from '../components/common/Badge.tsx';
import { TaskModal } from '../components/tasks/TaskModal.tsx';
import {
  Plus,
  Search,
  Filter,
  Kanban,
  Table as TableIcon,
  Clock,
  ArrowLeft,
  ChevronRight,
  AlertTriangle,
  User as UserIcon,
} from 'lucide-react';

export const ProjectTasksPage: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const { user, isViewer, isAdmin, isProjectManager } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [overdueOnly, setOverdueOnly] = useState(false);

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const fetchProjectAndTasks = async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const [projRes, tasksRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(
          `/projects/${projectId}/tasks?status=${statusFilter}&priority=${priorityFilter}&assignee=${assigneeFilter}&overdue=${overdueOnly}&search=${encodeURIComponent(
            search
          )}`
        ),
      ]);

      if (projRes.data.success) {
        setProject(projRes.data.project);
      }
      if (tasksRes.data.success) {
        setTasks(tasksRes.data.tasks);
      }
    } catch (err: any) {
      console.error('Failed to load project tasks', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectAndTasks();
  }, [projectId, statusFilter, priorityFilter, assigneeFilter, overdueOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProjectAndTasks();
  };

  const handleQuickStatusMove = async (task: Task, nextStatus: TaskStatus) => {
    if (isViewer) return;
    try {
      await api.patch(`/tasks/${task._id || task.id}`, {
        status: nextStatus,
        version: task.version, // atomic OCC check
      });
      fetchProjectAndTasks();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update task status');
    }
  };

  const columns: { key: TaskStatus; label: string; border: string; bg: string }[] = [
    { key: 'todo', label: 'To Do', border: 'border-slate-300', bg: 'bg-slate-50' },
    { key: 'in_progress', label: 'In Progress', border: 'border-blue-300', bg: 'bg-blue-50/40' },
    { key: 'in_review', label: 'In Review', border: 'border-amber-300', bg: 'bg-amber-50/40' },
    { key: 'done', label: 'Done', border: 'border-emerald-300', bg: 'bg-emerald-50/40' },
  ];

  const canCreateTask = !isViewer;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to="/projects" className="hover:text-slate-800">
              Projects
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link to={`/projects/${projectId}`} className="hover:text-slate-800">
              {project?.name || 'Project'}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-900 font-semibold">Tasks &amp; Board</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {project?.name} — Tasks
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md flex items-center gap-1 font-semibold transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Kanban Board View"
            >
              <Kanban className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md flex items-center gap-1 font-semibold transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Table Grid View"
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          {canCreateTask && (
            <button
              onClick={() => {
                setSelectedTask(null);
                setIsTaskModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-2xs"
            >
              <Plus className="h-4 w-4" /> Add Task
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks by title, tag, or description..."
            className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </form>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="urgent">Urgent Priority</option>
          </select>

          {/* Assignee filter */}
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Assignees</option>
            <option value="unassigned">Unassigned</option>
            {project?.members?.map((m: any) => {
              const u = m.user || m;
              return (
                <option key={u.id || u._id} value={u.id || u._id}>
                  {u.name}
                </option>
              );
            })}
          </select>

          {/* Overdue filter */}
          <button
            onClick={() => setOverdueOnly(!overdueOnly)}
            className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 font-medium ${
              overdueOnly
                ? 'bg-rose-50 border-rose-300 text-rose-700 font-semibold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
            <span>Overdue Only</span>
          </button>
        </div>
      </div>

      {/* Main View: Kanban Board OR Table */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : viewMode === 'kanban' ? (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {columns.map((col) => {
            const columnTasks = tasks.filter((t) => t.status === col.key);

            return (
              <div
                key={col.key}
                className="rounded-xl bg-slate-100/70 p-3 border border-slate-200 flex flex-col min-h-[500px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">{col.label}</span>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-mono text-[10px] font-bold">
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                {/* Tasks in column */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {columnTasks.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-slate-400">
                      No tasks in {col.label}
                    </div>
                  ) : (
                    columnTasks.map((task) => {
                      const taskId = task._id || task.id;
                      const isOverdue =
                        task.dueDate &&
                        new Date(task.dueDate) < new Date() &&
                        task.status !== 'done';

                      return (
                        <div
                          key={taskId}
                          className="rounded-lg bg-white p-3.5 border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
                        >
                          <div>
                            {/* Priority & Version */}
                            <div className="flex items-center justify-between gap-1 mb-2">
                              <Badge type="priority" value={task.priority} />
                              <span
                                title="MongoDB atomic OCC version"
                                className="font-mono text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-1 rounded"
                              >
                                v{task.version}
                              </span>
                            </div>

                            {/* Title */}
                            <Link
                              to={`/tasks/${taskId}`}
                              className="text-xs font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-2 block"
                            >
                              {task.title}
                            </Link>

                            {/* Tags */}
                            {task.tags && task.tags.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap mt-2">
                                {task.tags.map((tg) => (
                                  <span
                                    key={tg}
                                    className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded"
                                  >
                                    #{tg}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Footer */}
                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            {/* Assignee Avatar */}
                            <div className="flex items-center gap-1.5">
                              {task.assignee ? (
                                <div
                                  title={`Assigned to ${task.assignee.name}`}
                                  className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-[9px] border border-indigo-200"
                                >
                                  {task.assignee.name.slice(0, 2).toUpperCase()}
                                </div>
                              ) : (
                                <span className="text-slate-400 flex items-center gap-1">
                                  <UserIcon className="h-3 w-3" /> Unassigned
                                </span>
                              )}
                            </div>

                            {/* Due date */}
                            {task.dueDate && (
                              <span
                                className={`flex items-center gap-1 font-mono ${
                                  isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-400'
                                }`}
                              >
                                <Clock className="h-3 w-3" />
                                {new Date(task.dueDate).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            )}
                          </div>

                          {/* Quick workflow mover buttons */}
                          {!isViewer && (
                            <div className="mt-2 pt-2 border-t border-dashed border-slate-100 flex items-center justify-between text-[10px]">
                              {col.key !== 'todo' && (
                                <button
                                  onClick={() =>
                                    handleQuickStatusMove(
                                      task,
                                      col.key === 'done'
                                        ? 'in_review'
                                        : col.key === 'in_review'
                                        ? 'in_progress'
                                        : 'todo'
                                    )
                                  }
                                  className="text-slate-500 hover:text-slate-800 font-medium"
                                >
                                  ← Move Back
                                </button>
                              )}
                              {col.key !== 'done' && (
                                <button
                                  onClick={() =>
                                    handleQuickStatusMove(
                                      task,
                                      col.key === 'todo'
                                        ? 'in_progress'
                                        : col.key === 'in_progress'
                                        ? 'in_review'
                                        : 'done'
                                    )
                                  }
                                  className="text-indigo-600 hover:text-indigo-800 font-semibold ml-auto"
                                >
                                  Advance →
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE GRID VIEW */
        <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Task Title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Assignee</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Version</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No tasks match the selected filters.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => {
                  const taskId = task._id || task.id;
                  const isOverdue =
                    task.dueDate &&
                    new Date(task.dueDate) < new Date() &&
                    task.status !== 'done';

                  return (
                    <tr key={taskId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 max-w-xs">
                        <Link
                          to={`/tasks/${taskId}`}
                          className="font-bold text-slate-900 hover:text-indigo-600 transition-colors truncate block"
                        >
                          {task.title}
                        </Link>
                        {task.tags && task.tags.length > 0 && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            {task.tags.join(', ')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge type="status" value={task.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge type="priority" value={task.priority} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {task.assignee ? (
                          <span className="text-slate-700">{task.assignee.name}</span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {task.dueDate ? (
                          <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-indigo-600 font-semibold">
                        v{task.version}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <Link
                          to={`/tasks/${taskId}`}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          View Details →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        projectId={projectId!}
        projectMembers={project?.members || []}
        onSuccess={fetchProjectAndTasks}
      />
    </div>
  );
};
