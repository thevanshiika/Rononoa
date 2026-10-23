import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.ts';
import { Modal } from '../common/Modal.tsx';
import { Project, ProjectStatus, User } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
  onSuccess: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onSuccess,
}) => {
  const { user, isAdmin } = useAuth();
  const isEditing = Boolean(project);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [category, setCategory] = useState('Product Engineering');
  const [color, setColor] = useState('#4F46E5');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [managerId, setManagerId] = useState('');
  const [availableManagers, setAvailableManagers] = useState<User[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch managers/users for manager selection
  useEffect(() => {
    if (isOpen) {
      api
        .get('/users')
        .then((res) => {
          if (res.data.success) {
            setAvailableManagers(res.data.users);
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || '');
      setStatus(project.status);
      setCategory(project.category || 'Product Engineering');
      setColor(project.color || '#4F46E5');
      setStartDate(project.startDate ? project.startDate.split('T')[0] : '');
      setDueDate(project.dueDate ? project.dueDate.split('T')[0] : '');
      const mgr = project.manager ? (project.manager as any)._id || project.manager.id : '';
      setManagerId(mgr || '');
    } else {
      setName('');
      setDescription('');
      setStatus('active');
      setCategory('Product Engineering');
      setColor('#4F46E5');
      setStartDate(new Date().toISOString().split('T')[0]);
      setDueDate('');
      setManagerId(user?.id || (user as any)?._id || '');
    }
    setErrorMessage(null);
  }, [project, isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload: any = {
        name,
        description,
        status,
        category,
        color,
        startDate: startDate || undefined,
        dueDate: dueDate || undefined,
        manager: managerId || user?.id,
      };

      if (isEditing && project) {
        const res = await api.patch(`/projects/${project.id || project._id}`, payload);
        if (res.data.success) {
          onSuccess();
          onClose();
        }
      } else {
        const res = await api.post('/projects', payload);
        if (res.data.success) {
          onSuccess();
          onClose();
        }
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'An error occurred while saving the project.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const projectColors = [
    '#4F46E5', // Indigo
    '#0284C7', // Sky Blue
    '#059669', // Emerald
    '#D97706', // Amber
    '#DC2626', // Red
    '#9333EA', // Purple
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Project' : 'Create New Project'}
      subtitle={isEditing ? 'Update project settings and timeline' : 'Initialize a collaborative workspace'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
            {errorMessage}
          </div>
        )}

        {/* Project Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Project Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Enterprise Cloud Migration"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Category & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Infrastructure, Mobile, Security"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="High-level milestones, architectural objectives, and project goals..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Start Date & Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Project Manager Assignment (Admin only, or PM self) */}
        {isAdmin && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Project Manager Assignment
            </label>
            <select
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {availableManagers.map((m) => (
                <option key={m.id || (m as any)._id} value={m.id || (m as any)._id}>
                  {m.name} ({m.role}) — {m.email}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Theme Accent Color */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Project Color</label>
          <div className="flex items-center gap-3">
            {projectColors.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className={`h-6 w-6 rounded-full transition-transform ${
                  color === c ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
