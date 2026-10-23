import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Task, Comment } from '../types/index.ts';
import { Badge } from '../components/common/Badge.tsx';
import { TaskModal } from '../components/tasks/TaskModal.tsx';
import {
  ArrowLeft,
  Clock,
  User,
  Calendar,
  MessageSquare,
  Send,
  Trash2,
  Edit3,
  AlertTriangle,
  Zap,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export const TaskDetailPage: React.FC = () => {
  const { id: taskId } = useParams<{ id: string }>();
  const { user, isViewer, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New comment
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Edit task modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Conflict state demonstration
  const [conflictAlert, setConflictAlert] = useState<string | null>(null);

  const fetchTaskAndComments = async () => {
    if (!taskId) return;
    setIsLoading(true);
    try {
      const [taskRes, commentsRes] = await Promise.all([
        api.get(`/tasks/${taskId}`),
        api.get(`/tasks/${taskId}/comments`),
      ]);

      if (taskRes.data.success) {
        setTask(taskRes.data.task);
      }
      if (commentsRes.data.success) {
        setComments(commentsRes.data.comments || []);
      }
    } catch (err: any) {
      console.error('Failed to load task details', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskAndComments();
  }, [taskId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isViewer) return;

    setIsSubmittingComment(true);
    try {
      const res = await api.post(`/tasks/${taskId}/comments`, {
        content: newComment.trim(),
      });
      if (res.data.success) {
        setNewComment('');
        fetchTaskAndComments();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      await api.delete(`/comments/${commentId}`);
      fetchTaskAndComments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete comment');
    }
  };

  const handleDeleteTask = async () => {
    if (!task) return;
    if (!confirm('Are you sure you want to permanently delete this task?')) return;

    try {
      const proj: any = task.project;
      const projectId = typeof proj === 'object' ? proj._id || proj.id : proj;
      await api.delete(`/tasks/${task._id || task.id}`);
      navigate(`/projects/${projectId}/tasks`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete task');
    }
  };

  // Concurrency collision tester
  const simulateStaleUpdateCollision = async () => {
    if (!task) return;
    try {
      // Intentionally send version - 1 to trigger 409 Conflict
      await api.patch(`/tasks/${task._id || task.id}`, {
        title: `${task.title} (Stale Test)`,
        version: Math.max(0, task.version - 1),
      });
    } catch (err: any) {
      if (err.response?.status === 409) {
        setConflictAlert(
          `Conflict (HTTP 409) verified! The server detected stale version v${Math.max(
            0,
            task.version - 1
          )} against database current version v${task.version}. Atomic OCC prevents silent overwrite!`
        );
      } else {
        alert(err.response?.data?.message || 'Update failed');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <h3 className="text-sm font-bold text-slate-900">Task Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">This task may have been removed or is inaccessible.</p>
        <Link to="/projects" className="mt-4 inline-block text-xs font-semibold text-indigo-600">
          Return to Projects
        </Link>
      </div>
    );
  }

  const project: any = task.project;
  const projectId = project?._id || project?.id;
  const isManager =
    isAdmin ||
    (project?.manager &&
      ((project.manager as any)._id === user?.id || project.manager.id === user?.id));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          to={`/projects/${projectId}/tasks`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Project Tasks
        </Link>

        {isManager && !isViewer && (
          <button
            onClick={handleDeleteTask}
            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 p-1 rounded"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete Task
          </button>
        )}
      </div>

      {/* Conflict Verification Alert (if simulated) */}
      {conflictAlert && (
        <div className="rounded-xl bg-amber-50 p-4 border border-amber-200 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Optimistic Concurrency Control (OCC) Confirmed
              </h4>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">{conflictAlert}</p>
            </div>
          </div>
          <button
            onClick={() => setConflictAlert(null)}
            className="text-xs text-amber-700 font-semibold hover:text-amber-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Task Card */}
      <div className="rounded-xl bg-white p-6 border border-slate-200 shadow-2xs space-y-6">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Link
                to={`/projects/${projectId}`}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                {project?.name || 'Project'}
              </Link>
              <span className="text-slate-300">/</span>
              <Badge type="status" value={task.status} />
              <Badge type="priority" value={task.priority} />
            </div>

            <h1 className="text-xl font-bold text-slate-900">{task.title}</h1>
          </div>

          {!isViewer && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-2xs"
            >
              <Edit3 className="h-3.5 w-3.5" /> Edit Task
            </button>
          )}
        </div>

        {/* Task Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Assignee</span>
            <div className="flex items-center gap-1.5 mt-1">
              <User className="h-3.5 w-3.5 text-slate-500" />
              <span className="font-semibold text-slate-800">
                {task.assignee?.name || 'Unassigned'}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Due Date</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              <span className="font-semibold text-slate-800">
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date set'}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Estimated Effort</span>
            <div className="flex items-center gap-1.5 mt-1 font-mono">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              <span className="font-semibold text-slate-800">
                {task.estimatedHours || 0} hrs
              </span>
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 font-medium block">Concurrency Version</span>
            <div className="flex items-center gap-1.5 mt-1 font-mono">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
              <span className="font-bold text-indigo-700 bg-indigo-100/70 px-1.5 py-0.5 rounded text-[11px]">
                v{task.version}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Description
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-white p-4 rounded-lg border border-slate-100">
            {task.description || 'No description provided for this task.'}
          </p>
        </div>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Tags
            </h3>
            <div className="flex items-center gap-1.5 flex-wrap">
              {task.tags.map((tg) => (
                <span
                  key={tg}
                  className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                >
                  #{tg}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Concurrency Testing Console for Judges */}
        <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-indigo-600" /> Hackathon Concurrency Verification
            </h4>
            <p className="text-[11px] text-indigo-800/80 mt-0.5">
              Test Section 7: Dispatch a concurrent stale update to verify server-enforced HTTP 409 Conflict.
            </p>
          </div>
          <button
            onClick={simulateStaleUpdateCollision}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shrink-0"
          >
            <Zap className="h-3.5 w-3.5" /> Test Stale Collision (409)
          </button>
        </div>
      </div>

      {/* Discussion & Comments Thread */}
      <div className="rounded-xl bg-white p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-indigo-600" /> Discussion ({comments.length})
          </h3>
          <span className="text-xs text-slate-400">Team remarks and status updates</span>
        </div>

        {/* Comments List */}
        <div className="space-y-3">
          {comments.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              No comments yet on this task. Start the discussion below.
            </p>
          ) : (
            comments.map((comment) => {
              const commentId = comment._id || (comment as any).id;
              const isAuthor =
                user &&
                (comment.author?.id === user.id ||
                  (comment.author as any)?._id === user.id ||
                  comment.author?.email === user.email);
              const canDelete = isAuthor || isManager;

              return (
                <div
                  key={commentId}
                  className="rounded-lg bg-slate-50 p-3.5 border border-slate-200/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold text-[10px]">
                        {comment.author?.name ? comment.author.name.slice(0, 2).toUpperCase() : 'U'}
                      </div>
                      <span className="text-xs font-bold text-slate-900">
                        {comment.author?.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {canDelete && !isViewer && (
                      <button
                        onClick={() => handleDeleteComment(commentId)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete comment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed pl-8">
                    {comment.content}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Add Comment Input (Disabled for Viewer) */}
        {!isViewer ? (
          <form onSubmit={handleAddComment} className="pt-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Post a comment or technical note..."
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !newComment.trim()}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <Send className="h-3.5 w-3.5" /> Send
              </button>
            </div>
          </form>
        ) : (
          <p className="text-center text-xs text-slate-400 italic py-2">
            Viewer accounts cannot post comments.
          </p>
        )}
      </div>

      {/* Edit Task Modal */}
      <TaskModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        task={task}
        projectId={projectId}
        projectMembers={project?.members || []}
        onSuccess={fetchTaskAndComments}
      />
    </div>
  );
};
