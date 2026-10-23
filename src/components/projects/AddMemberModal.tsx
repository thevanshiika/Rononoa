import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.ts';
import { Modal } from '../common/Modal.tsx';
import { User, ProjectMemberRole, UserRole } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { UserPlus, Users, CheckCircle2, AlertCircle, KeyRound, Sparkles } from 'lucide-react';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  existingMemberIds: string[];
  onSuccess: () => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  projectId,
  existingMemberIds,
  onSuccess,
}) => {
  const { user, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'existing' | 'invite'>('existing');

  // Existing user selection
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [role, setRole] = useState<ProjectMemberRole>('contributor');

  // New friend registration
  const [friendName, setFriendName] = useState('');
  const [friendEmail, setFriendEmail] = useState('');
  const [globalRole, setGlobalRole] = useState<UserRole>('team_member');
  const [friendTitle, setFriendTitle] = useState('Student Developer');
  const [friendDepartment, setFriendDepartment] = useState('Computer Science');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    message: string;
    email?: string;
    temporaryPassword?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessInfo(null);
      api
        .get('/users?status=active')
        .then((res) => {
          if (res.data.success) {
            setAllUsers(res.data.users);
            const eligible = res.data.users.filter(
              (u: any) => !existingMemberIds.includes(u.id || u._id)
            );
            if (eligible.length > 0) {
              setSelectedUserId(eligible[0].id || eligible[0]._id);
            }
          }
        })
        .catch(console.error);
    }
  }, [isOpen, existingMemberIds]);

  const eligibleUsers = allUsers.filter(
    (u) => !existingMemberIds.includes(u.id || (u as any)._id)
  );

  const handleExistingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setErrorMessage('Please select a registered user to add.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await api.post(`/projects/${projectId}/team`, {
        userId: selectedUserId,
        role,
      });

      if (res.data.success) {
        setSuccessInfo({
          message: res.data.message || 'Team member added successfully!',
        });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to add member to project'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInviteFriendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendEmail.trim() || !friendName.trim()) {
      setErrorMessage('Please provide both full name and a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await api.post(`/projects/${projectId}/team`, {
        name: friendName.trim(),
        email: friendEmail.trim(),
        globalRole,
        role,
        title: friendTitle.trim(),
        department: friendDepartment.trim(),
      });

      if (res.data.success) {
        setSuccessInfo({
          message: res.data.message,
          email: friendEmail.trim(),
          temporaryPassword: res.data.temporaryPassword,
        });
        onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to invite team member'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Team Member / Friend"
      subtitle="Expand your project collaboration roster"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('existing');
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 px-3 font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'existing'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Select Existing Member ({eligibleUsers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('invite');
              setErrorMessage(null);
            }}
            className={`flex-1 py-1.5 px-3 font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'invite'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Register Friend / Colleague</span>
          </button>
        </div>

        {/* Success Alert */}
        {successInfo && (
          <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-200 space-y-2">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-emerald-950">
                  {successInfo.message}
                </h4>
                {successInfo.temporaryPassword && (
                  <div className="mt-2 text-xs text-emerald-800 bg-white/80 p-2.5 rounded-lg border border-emerald-200/60 font-mono">
                    <div>
                      <span className="text-slate-500">Email:</span>{' '}
                      <span className="font-semibold text-slate-900">{successInfo.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Initial Dev Password:</span>{' '}
                      <span className="font-bold text-indigo-600">{successInfo.temporaryPassword}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-sans mt-1">
                      (No fake email simulated: you or your friend can log in immediately with this account!)
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab 1: Existing Member Selection */}
        {activeTab === 'existing' && !successInfo && (
          <form onSubmit={handleExistingSubmit} className="space-y-4">
            {eligibleUsers.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                <p>All active organization members are currently in this project.</p>
                <p className="mt-1 text-slate-400">
                  Switch to the "Register Friend" tab to invite a new colleague.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Registered User <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {eligibleUsers.map((u) => (
                      <option key={u.id || (u as any)._id} value={u.id || (u as any)._id}>
                        {u.name} ({u.title || u.role}) — {u.email} {u.isDemo ? '[Demo]' : '[Custom]'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Project-Level Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as ProjectMemberRole)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="contributor">Contributor (Can update assigned tasks)</option>
                    <option value="manager">Manager (Can manage tasks &amp; project team)</option>
                    <option value="reviewer">Reviewer (Can review tasks &amp; post comments)</option>
                    <option value="viewer">Viewer (Read-only project observer)</option>
                  </select>
                </div>

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
                    {isSubmitting ? 'Adding...' : 'Add to Project'}
                  </button>
                </div>
              </>
            )}
          </form>
        )}

        {/* Tab 2: Register & Invite Friend */}
        {activeTab === 'invite' && !successInfo && (
          <form onSubmit={handleInviteFriendSubmit} className="space-y-4">
            <div className="rounded-lg bg-indigo-50/60 p-3 text-xs text-indigo-900 border border-indigo-100 flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Real Local Authentication:</span> This creates a genuine user in MongoDB with default password <code className="font-mono bg-white px-1 py-0.5 rounded text-indigo-700 font-bold">Password123!</code> and adds them directly to this project.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Friend's Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={friendName}
                  onChange={(e) => setFriendName(e.target.value)}
                  placeholder="e.g. Rohan Sharma"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Friend's Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={friendEmail}
                  onChange={(e) => setFriendEmail(e.target.value)}
                  placeholder="e.g. rohan@college.edu"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Organization System Role
                </label>
                <select
                  value={globalRole}
                  onChange={(e) => setGlobalRole(e.target.value as UserRole)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="team_member">Team Member (Standard Engineer)</option>
                  <option value="project_manager">Project Manager</option>
                  <option value="viewer">Viewer (Read-Only)</option>
                  {isAdmin && <option value="admin">Admin</option>}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project Role Assignment
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as ProjectMemberRole)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="contributor">Contributor</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="manager">Manager</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={friendTitle}
                  onChange={(e) => setFriendTitle(e.target.value)}
                  placeholder="e.g. Frontend Engineer"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department / Track</label>
                <input
                  type="text"
                  value={friendDepartment}
                  onChange={(e) => setFriendDepartment(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

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
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>{isSubmitting ? 'Registering...' : 'Add Friend & Join Project'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
