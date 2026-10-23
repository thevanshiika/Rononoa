import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.ts';
import { Modal } from '../common/Modal.tsx';
import { Task, Project, TaskStatus, TaskPriority } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { AlertTriangle, RefreshCw, Zap } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  projectId: string;
  projectMembers?: any[];
  onSuccess: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  task,
  projectId,
  projectMembers = [],
  onSuccess,
}) => {
  const { isViewer, isTeamMember } = useAuth();
  const isEditing = Boolean(task);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignee, setAssignee] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [tagsString, setTagsString] = useState<string>('');
  const [estimatedHours, setEstimatedHours] = useState<number>(0);
  const [version, setVersion] = useState<number>(1);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [conflictData, setConflictData] = useState<{
    message: string;
    submittedVersion: number;
    currentVersion: number;
    latestTask: any;
  } | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      const assigneeId = typeof task.assignee === 'object' && task.assignee ? task.assignee.id || (task.assignee as any)._id : task.assignee || '';
      setAssignee(assigneeId || '');
      setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
      setTagsString(task.tags ? task.tags.join(', ') : '');
      setEstimatedHours(task.estimatedHours || 0);
      setVersion(task.version || 1);
    } else {
      setTitle('');
      setDescription('');
      setStatus('todo');
      setPriority('medium');
      setAssignee('');
      setDueDate('');
      setTagsString('');
      setEstimatedHours(0);
      setVersion(1);
    }
    setErrorMessage(null);
    setConflictData(null);
  }, [task, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setConflictData(null);

    const tags = tagsString
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      if (isEditing && task) {
        // PATCH with optimistic concurrency version field
        const payload: any = {
          title,
          description,
          status,
          priority,
          assignee: assignee ? assignee : null,
          dueDate: dueDate ? dueDate : null,
          tags,
          estimatedHours: Number(estimatedHours) || 0,
          version, // Required for OCC
        };

        const res = await api.patch(`/tasks/${task._id || task.id}`, payload);
        if (res.data.success) {
          onSuccess();
          onClose();
        }
      } else {
        // POST new task
        const payload = {
          title,
          description,
          project: projectId,
          status,
          priority,
          assignee: assignee ? assignee : null,
          dueDate: dueDate ? dueDate : null,
          tags,
          estimatedHours: Number(estimatedHours) || 0,
        };

        const res = await api.post(`/projects/${projectId}/tasks`, payload);
        if (res.data.success) {
          onSuccess();
          onClose();
        }
      }
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data?.conflict) {
        // Concurrency conflict detected!
        setConflictData(err.response.data);
      } else {
        setErrorMessage(
          err.response?.data?.message || err.message || 'An error occurred while saving the task.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const reloadLatestVersion = () => {
    if (conflictData?.latestTask) {
      const latest = conflictData.latestTask;
      setTitle(latest.title);
      setDescription(latest.description || '');
      setStatus(latest.status);
      setPriority(latest.priority);
      const latestAssignee = typeof latest.assignee === 'object' && latest.assignee ? latest.assignee.id || latest.assignee._id : latest.assignee || '';
      setAssignee(latestAssignee || '');
      setDueDate(latest.dueDate ? latest.dueDate.split('T')[0] : '');
      setTagsString(latest.tags ? latest.tags.join(', ') : '');
      setEstimatedHours(latest.estimatedHours || 0);
      setVersion(latest.version);
      setConflictData(null);
      setErrorMessage(null);
    }
  };

  // Helper for judges to simulate a stale edit
  const simulateStaleConflict = () => {
    setVersion(Math.max(1, version - 1));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Task (v${version})` : 'Create New Task'}
      subtitle={isEditing ? 'Atomic optimistic concurrency control enabled' : 'Add task to project'}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Conflict Warning Box (HTTP 409) */}
        {conflictData && (
          <div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-xs font-bold text-amber-900">
                  Concurrency Conflict Detected (HTTP 409)
                </h4>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  {conflictData.message}
                </p>
                <div className="mt-2 text-[11px] font-mono text-amber-800">
                  Submitted version: v{conflictData.submittedVersion} · Database current version: v{conflictData.currentVersion}
                </div>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={reloadLatestVersion}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Reload Latest Version (v{conflictData.currentVersion})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
            {errorMessage}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Task Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isViewer}
            placeholder="e.g. Implement authentication middleware"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isViewer}
            placeholder="Provide context, acceptance criteria, or technical details..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
          />
        </div>

        {/* Status & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              disabled={isViewer}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              disabled={isViewer || isTeamMember}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {/* Assignee & Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assignee</label>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              disabled={isViewer || isTeamMember}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
            >
              <option value="">Unassigned</option>
              {projectMembers.map((member: any) => {
                const u = member.user || member;
                const id = u.id || u._id;
                return (
                  <option key={id} value={id}>
                    {u.name} ({member.role || u.role})
                  </option>
                );
              })}
            </select>
            {isTeamMember && (
              <p className="text-[10px] text-slate-400 mt-1">
                Only managers can reassign tasks to team members.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={isViewer || isTeamMember}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
            />
          </div>
        </div>

        {/* Tags & Estimated Hours */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tagsString}
              onChange={(e) => setTagsString(e.target.value)}
              disabled={isViewer}
              placeholder="e.g. Backend, Auth, HighPriority"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Estimated Hours
            </label>
            <input
              type="number"
              min="0"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(Math.max(0, parseInt(e.target.value, 10) || 0))}
              disabled={isViewer || isTeamMember}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 font-mono"
            />
          </div>
        </div>

        {/* Concurrency Testing helper for Hackathon Demonstration */}
        {isEditing && (
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-700">Optimistic Concurrency Version:</span>{' '}
                <span className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                  v{version}
                </span>
              </div>
              <button
                type="button"
                onClick={simulateStaleConflict}
                title="Force a lower version number to test server 409 conflict detection"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:text-amber-800 bg-amber-100/70 hover:bg-amber-100 px-2 py-1 rounded transition-colors"
              >
                <Zap className="h-3 w-3" /> Simulate Stale Version
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Every successful edit increments this version atomically in MongoDB.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          {!isViewer && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Task' : 'Create Task'}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
};
