import React, { useState, useEffect } from 'react';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { User, UserRole } from '../types/index.ts';
import { Badge } from '../components/common/Badge.tsx';
import { Modal } from '../components/common/Modal.tsx';
import {
  Users,
  UserPlus,
  Search,
  Shield,
  CheckCircle2,
  XCircle,
  Edit2,
  Power,
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Create User Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password123!');
  const [role, setRole] = useState<UserRole>('team_member');
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Product Engineering');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit User Modal state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('team_member');
  const [editTitle, setEditTitle] = useState('');
  const [editDepartment, setEditDepartment] = useState('');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(
        `/users?search=${encodeURIComponent(search)}&role=${roleFilter}&status=${statusFilter}`
      );
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err: any) {
      console.error('Failed to load users', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCreateError(null);

    try {
      const res = await api.post('/users', {
        name,
        email,
        password,
        role,
        title,
        department,
      });

      if (res.data.success) {
        setIsCreateModalOpen(false);
        setName('');
        setEmail('');
        setPassword('Password123!');
        setTitle('');
        fetchUsers();
      }
    } catch (err: any) {
      setCreateError(
        err.response?.data?.message || err.message || 'Failed to create user account'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmitting(true);

    try {
      const res = await api.patch(`/users/${editingUser.id || (editingUser as any)._id}`, {
        role: editRole,
        title: editTitle,
        department: editDepartment,
      });

      if (res.data.success) {
        setEditingUser(null);
        fetchUsers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleDeactivate = async (targetUser: User) => {
    const userId = targetUser.id || (targetUser as any)._id;
    const isSelf = currentUser && (currentUser.id === userId || (currentUser as any)._id === userId);

    if (isSelf) {
      alert('You cannot deactivate your own administrative account.');
      return;
    }

    const action = targetUser.status === 'active' ? 'deactivate' : 'reactivate';
    if (!confirm(`Are you sure you want to ${action} ${targetUser.name}'s account?`)) return;

    try {
      const res = await api.patch(`/users/${userId}/deactivate`);
      if (res.data.success) {
        fetchUsers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to ${action} user`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              Admin Only Console
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">User Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Provision user accounts, assign enterprise roles, and govern active session status.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-2xs"
        >
          <UserPlus className="h-4 w-4" /> Provision New User
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email address..."
            className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </form>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="project_manager">Project Manager</option>
            <option value="team_member">Team Member</option>
            <option value="viewer">Viewer</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Deactivated Only</option>
          </select>
        </div>
      </div>

      {/* Users Directory Table */}
      <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Account Type</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Department</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Created</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                  Loading users directory...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                  No users found matching query.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const userId = u.id || (u as any)._id;
                const isSelf = currentUser && (currentUser.id === userId || (currentUser as any)._id === userId);

                return (
                  <tr key={userId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            {u.name}
                            {isSelf && (
                              <span className="text-[10px] font-normal text-slate-400 font-mono">
                                (You)
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-normal">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-3 whitespace-nowrap">
                      {u.isDemo ? (
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          Demo Seed
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Colleague / Friend
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-3 whitespace-nowrap">
                      <Badge type="role" value={u.role} />
                    </td>

                    <td className="px-6 py-3 whitespace-nowrap text-slate-600">
                      <div>{u.title || 'Team Member'}</div>
                      <div className="text-[10px] text-slate-400">{u.department || 'Engineering'}</div>
                    </td>

                    <td className="px-6 py-3 whitespace-nowrap">
                      {u.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-xs">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 font-semibold text-xs">
                          <XCircle className="h-3.5 w-3.5 text-rose-500" /> Deactivated
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-3 whitespace-nowrap font-mono text-[11px] text-slate-400">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>

                    <td className="px-6 py-3 whitespace-nowrap text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingUser(u);
                          setEditRole(u.role);
                          setEditTitle(u.title || '');
                          setEditDepartment(u.department || '');
                        }}
                        className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        title="Edit Role and Details"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      {!isSelf && (
                        <button
                          onClick={() => handleToggleDeactivate(u)}
                          className={`p-1 rounded transition-colors ${
                            u.status === 'active'
                              ? 'text-rose-500 hover:text-rose-700 hover:bg-rose-50'
                              : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                          }`}
                          title={u.status === 'active' ? 'Deactivate Account' : 'Reactivate Account'}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Provision User Account"
        subtitle="Create an authenticated identity with role assignment"
        maxWidth="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {createError && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {createError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jordan Hayes"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@company.com"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="team_member">Team Member</option>
              <option value="project_manager">Project Manager</option>
              <option value="viewer">Viewer (Read-Only)</option>
              <option value="admin">Admin (Full Access)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Backend Dev"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Core Platform"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Provision User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        title={`Edit ${editingUser?.name}`}
        subtitle="Modify role and profile metadata"
        maxWidth="md"
      >
        <form onSubmit={handleEditUser} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Role Assignment
            </label>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value as UserRole)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="team_member">Team Member</option>
              <option value="project_manager">Project Manager</option>
              <option value="viewer">Viewer (Read-Only)</option>
              <option value="admin">Admin (Full Access)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
            <input
              type="text"
              value={editDepartment}
              onChange={(e) => setEditDepartment(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Save Updates'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
