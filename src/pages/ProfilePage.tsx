import React, { useState } from 'react';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Badge } from '../components/common/Badge.tsx';
import {
  User,
  Shield,
  KeyRound,
  CheckCircle2,
  Lock,
  Layers,
  Check,
  X,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [title, setTitle] = useState(user?.title || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (password && password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password && password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = { name, title, department };
      if (password) {
        payload.password = password;
      }

      const res = await api.patch('/auth/profile', payload);
      if (res.data.success) {
        updateUser(res.data.user);
        setSuccessMessage('Profile information saved successfully.');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to update profile'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const rolePermissionsMatrix = [
    {
      feature: 'View Assigned Projects & Tasks',
      admin: true,
      pm: true,
      member: true,
      viewer: true,
    },
    {
      feature: 'Update Task Workflow Status',
      admin: true,
      pm: true,
      member: true,
      viewer: false,
    },
    {
      feature: 'Post Task Comments & Discussions',
      admin: true,
      pm: true,
      member: true,
      viewer: false,
    },
    {
      feature: 'Create & Assign New Tasks',
      admin: true,
      pm: true,
      member: false,
      viewer: false,
    },
    {
      feature: 'Delete Tasks & Projects',
      admin: true,
      pm: true,
      member: false,
      viewer: false,
    },
    {
      feature: 'Add / Remove Project Team Members',
      admin: true,
      pm: true,
      member: false,
      viewer: false,
    },
    {
      feature: 'Provision & Deactivate User Accounts',
      admin: true,
      pm: false,
      member: false,
      viewer: false,
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">My Profile</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Account credentials, identity parameters, and role-based permissions matrix.
        </p>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="rounded-xl bg-white p-6 border border-slate-200 shadow-2xs flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-2xl border-2 border-indigo-200 mb-4">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
          </div>

          <h3 className="text-base font-bold text-slate-900">{user?.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>

          <div className="mt-3 flex items-center gap-1.5">
            <Badge type="role" value={user?.role || 'team_member'} />
          </div>

          <div className="mt-6 w-full pt-4 border-t border-slate-100 text-left text-xs space-y-2">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Job Title</span>
              <span className="font-semibold text-slate-800">{user?.title || 'Engineer'}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Department</span>
              <span className="font-semibold text-slate-800">{user?.department || 'Engineering'}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Account Status</span>
              <span className="font-semibold text-emerald-700 capitalize">{user?.status || 'Active'}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile Form */}
        <div className="md:col-span-2 rounded-xl bg-white p-6 border border-slate-200 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-indigo-600" /> Edit Account Information
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-2">
                <Lock className="h-3.5 w-3.5 text-slate-400" /> Change Password (optional)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <input
                    type="password"
                    placeholder="New password (min 6 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-2xs"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-600" /> Platform Authorization Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enforced strictly via backend Express middleware. Direct unauthorized API calls receive HTTP 403.
            </p>
          </div>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-6 py-3">Permission / Capability</th>
              <th className="px-4 py-3 text-center">Admin</th>
              <th className="px-4 py-3 text-center">Project Manager</th>
              <th className="px-4 py-3 text-center">Team Member</th>
              <th className="px-4 py-3 text-center">Viewer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {rolePermissionsMatrix.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-6 py-3 font-semibold text-slate-800">{item.feature}</td>
                <td className="px-4 py-3 text-center">
                  {item.admin ? (
                    <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                  ) : (
                    <X className="h-4 w-4 text-slate-300 mx-auto" />
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {item.pm ? (
                    <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                  ) : (
                    <X className="h-4 w-4 text-slate-300 mx-auto" />
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {item.member ? (
                    <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                  ) : (
                    <X className="h-4 w-4 text-slate-300 mx-auto" />
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {item.viewer ? (
                    <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                  ) : (
                    <X className="h-4 w-4 text-slate-300 mx-auto" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
