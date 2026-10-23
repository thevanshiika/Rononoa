import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { DashboardStats, Task, TaskStatus } from '../types/index.ts';
import { Badge } from '../components/common/Badge.tsx';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Plus,
  RefreshCw,
  CheckSquare,
  Activity,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { ProjectModal } from '../components/projects/ProjectModal.tsx';

export const DashboardPage: React.FC = () => {
  const { user, isAdmin, isProjectManager, isViewer } = useAuth();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);
  const [priorityDistribution, setPriorityDistribution] = useState<any[]>([]);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/tasks/stats/dashboard');
      if (res.data.success) {
        setStats(res.data.stats);
        setStatusDistribution(res.data.statusDistribution || []);
        setPriorityDistribution(res.data.priorityDistribution || []);
        setRecentTasks(res.data.recentTasks || []);
      }

      // Fetch my assigned tasks
      if (user) {
        const userId = user.id || (user as any)._id;
        const projectsRes = await api.get('/projects');
        if (projectsRes.data.success && projectsRes.data.projects.length > 0) {
          const allTasks: Task[] = [];
          for (const p of projectsRes.data.projects) {
            const tasksRes = await api.get(`/projects/${p.id || p._id}/tasks?assignee=${userId}`);
            if (tasksRes.data.success) {
              allTasks.push(...tasksRes.data.tasks);
            }
          }
          setMyTasks(allTasks);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const handleQuickStatusChange = async (task: Task, newStatus: TaskStatus) => {
    if (isViewer) return;
    setUpdatingTaskId(task._id || task.id);
    try {
      await api.patch(`/tasks/${task._id || task.id}`, {
        status: newStatus,
        version: task.version, // atomic OCC check
      });
      fetchDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update task status');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  if (isLoading && !stats) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="text-xs text-slate-500 font-medium">Aggregating workspace analytics...</p>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    todo: '#64748B',
    in_progress: '#3B82F6',
    in_review: '#F59E0B',
    done: '#10B981',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Overview &amp; Metrics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time project velocity, workload distribution, and task milestones.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDashboardData}
            title="Refresh statistics"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>

          {(isAdmin || isProjectManager) && (
            <button
              onClick={() => setIsProjectModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-2xs"
            >
              <Plus className="h-4 w-4" /> New Project
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl bg-white p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Projects</span>
            <FolderKanban className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="text-xl font-bold text-slate-900 tabular-nums">
            {stats?.totalProjects ?? 0}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {stats?.activeProjects ?? 0} actively tracked
          </span>
        </div>

        <div className="rounded-xl bg-white p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Tasks</span>
            <CheckSquare className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-slate-900 tabular-nums">
            {stats?.totalTasks ?? 0}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Across all assignments</span>
        </div>

        <div className="rounded-xl bg-white p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Completed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-emerald-700 tabular-nums">
            {stats?.completedTasks ?? 0}
          </p>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
            {stats?.completionRate ?? 0}% success rate
          </span>
        </div>

        <div className="rounded-xl bg-white p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Pending Tasks</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-xl font-bold text-slate-900 tabular-nums">
            {stats?.pendingTasks ?? 0}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">In progress or review</span>
        </div>

        <div className="rounded-xl bg-white p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Overdue</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <p className="text-xl font-bold text-rose-700 tabular-nums">
            {stats?.overdueTasks ?? 0}
          </p>
          <span className="text-[11px] text-rose-500 font-medium mt-1 block">Needs attention</span>
        </div>

        <div className="rounded-xl bg-indigo-50/60 p-4 border border-indigo-100 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-900 mb-1">
            <span className="text-xs font-semibold">My Assigned</span>
            <Activity className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="text-xl font-bold text-indigo-700 tabular-nums">
            {stats?.myTasksCount ?? myTasks.length}
          </p>
          <span className="text-[11px] text-indigo-600 font-medium mt-1 block">
            {stats?.myPendingCount ?? 0} pending action
          </span>
        </div>
      </div>

      {/* Progress & Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown Bar Chart */}
        <div className="rounded-xl bg-white p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Task Status Distribution</h3>
              <p className="text-xs text-slate-500">Breakdown of workflow pipelines</p>
            </div>
            <div className="text-xs font-semibold text-slate-700 tabular-nums">
              {stats?.totalTasks} Total
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#F1F5F9' }}
                  contentStyle={{ backgroundColor: '#1E293B', borderRadius: '8px', color: '#FFF', fontSize: '12px' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={statusColors[entry.key] || '#4F46E5'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown & Workload Distribution */}
        <div className="rounded-xl bg-white p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Priority &amp; Urgency Mix</h3>
                <p className="text-xs text-slate-500">Resource allocation across risk levels</p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {priorityDistribution.map((item) => {
                const total = stats?.totalTasks || 1;
                const percentage = Math.round((item.count / total) * 100);
                return (
                  <div key={item.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-slate-700 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.name}
                      </span>
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {item.count} tasks ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Overall completion velocity:</span>
            <span className="font-semibold text-emerald-600 font-mono">
              {stats?.completionRate}% Complete
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Section: My Assigned Tasks + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Assigned Tasks (Interactive for Team Members) */}
        <div className="rounded-xl bg-white p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">My Assigned Tasks</h3>
              <p className="text-xs text-slate-500">Quickly change status or review your items</p>
            </div>
            <Link
              to="/projects"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              All Projects <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {myTasks.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No tasks currently assigned to your account.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {myTasks.slice(0, 5).map((task) => (
                <div key={task._id || task.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/tasks/${task._id || task.id}`}
                      className="text-xs font-bold text-slate-900 hover:text-indigo-600 transition-colors truncate block"
                    >
                      {task.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span>v{task.version}</span>
                      <span>·</span>
                      <Badge type="priority" value={task.priority} />
                      {task.dueDate && (
                        <>
                          <span>·</span>
                          <span
                            className={
                              new Date(task.dueDate) < new Date() && task.status !== 'done'
                                ? 'text-rose-600 font-semibold'
                                : 'text-slate-500'
                            }
                          >
                            Due {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Direct status switcher */}
                  <div className="shrink-0">
                    <select
                      value={task.status}
                      disabled={isViewer || updatingTaskId === (task._id || task.id)}
                      onChange={(e) => handleQuickStatusChange(task, e.target.value as TaskStatus)}
                      className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="in_review">In Review</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Workspace Updates with Concurrency Version Stamps */}
        <div className="rounded-xl bg-white p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Workspace Activity</h3>
              <p className="text-xs text-slate-500">Atomic concurrency updates in MongoDB</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {recentTasks.slice(0, 5).map((t) => (
              <div key={t.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/tasks/${t.id}`}
                    className="text-xs font-semibold text-slate-900 hover:text-indigo-600 transition-colors truncate block"
                  >
                    {t.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                    <span className="font-mono text-indigo-600 font-semibold">v{t.version}</span>
                    <span>·</span>
                    <Badge type="status" value={t.status} />
                    <span>·</span>
                    {t.isDemo ? (
                      <span className="text-[9px] text-slate-400 bg-slate-100 px-1 rounded">Demo</span>
                    ) : (
                      <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200 font-bold">Custom</span>
                    )}
                    <span>·</span>
                    <span>{new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <Badge type="priority" value={t.priority} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Project Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSuccess={() => {
          fetchDashboardData();
        }}
      />
    </div>
  );
};
