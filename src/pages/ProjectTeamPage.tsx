import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Project, ProjectMemberRole } from '../types/index.ts';
import { Badge } from '../components/common/Badge.tsx';
import { AddMemberModal } from '../components/projects/AddMemberModal.tsx';
import {
  Users,
  UserPlus,
  Trash2,
  ChevronRight,
  ArrowLeft,
  Shield,
  CheckCircle2,
} from 'lucide-react';

export const ProjectTeamPage: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const { user, isAdmin, isViewer } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchTeam = async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const [projRes, teamRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/projects/${projectId}/team`),
      ]);

      if (projRes.data.success) {
        setProject(projRes.data.project);
      }
      if (teamRes.data.success) {
        setTeamMembers(teamRes.data.members || []);
      }
    } catch (err: any) {
      console.error('Failed to load project team', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [projectId]);

  const isManager =
    isAdmin ||
    (project?.manager &&
      ((project.manager as any)._id === user?.id || project.manager.id === user?.id));

  const handleRoleChange = async (memberUserId: string, newRole: ProjectMemberRole) => {
    try {
      const res = await api.patch(`/projects/${projectId}/team/${memberUserId}`, {
        role: newRole,
      });
      if (res.data.success) {
        setStatusMessage('Member role updated successfully');
        setTimeout(() => setStatusMessage(null), 3000);
        fetchTeam();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update member role');
    }
  };

  const handleRemoveMember = async (memberUserId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this project? Any tasks assigned to them will be unassigned.`)) {
      return;
    }

    try {
      const res = await api.delete(`/projects/${projectId}/team/${memberUserId}`);
      if (res.data.success) {
        setStatusMessage('Member removed from project');
        setTimeout(() => setStatusMessage(null), 3000);
        fetchTeam();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header and Breadcrumbs */}
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
            <span className="text-slate-900 font-semibold">Team Members</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {project?.name} — Team
          </h2>
        </div>

        {isManager && !isViewer && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-2xs"
          >
            <UserPlus className="h-4 w-4" /> Add Team Member / Friend
          </button>
        )}
      </div>

      {statusMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Primary Project Manager Banner */}
      <div className="rounded-xl bg-white p-5 border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-bold border border-purple-200">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">
                Primary Project Manager: {project?.manager?.name}
              </span>
              <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200 font-bold">
                Lead PM
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {project?.manager?.email} · {project?.manager?.title || 'Lead Technical Project Manager'}
            </p>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-600" /> Project Members ({teamMembers.length})
          </h3>
          <span className="text-xs text-slate-500">
            Server-enforced member authorization &amp; role governance
          </span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-6 py-3">Member</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Global Role</th>
              <th className="px-6 py-3">Project Role</th>
              <th className="px-6 py-3">Department</th>
              <th className="px-6 py-3">Joined</th>
              {isManager && !isViewer && <th className="px-6 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {teamMembers.map((member: any) => {
              const u = member.user || member;
              const userId = u.id || u._id;
              const isLeadManager =
                project?.manager &&
                ((project.manager as any)._id === userId || project.manager.id === userId);

              return (
                <tr key={userId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">
                        {u.name ? u.name.slice(0, 2).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-400 font-normal">{u.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-3 whitespace-nowrap">
                    {u.isDemo ? (
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        Demo
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Friend / Colleague
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-3 whitespace-nowrap">
                    <Badge type="role" value={u.role || 'team_member'} />
                  </td>

                  <td className="px-6 py-3 whitespace-nowrap">
                    {isManager && !isViewer && !isLeadManager ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(userId, e.target.value as ProjectMemberRole)}
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="manager">Manager</option>
                        <option value="contributor">Contributor</option>
                        <option value="reviewer">Reviewer</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span className="font-semibold text-slate-700 capitalize">
                        {member.role || 'Contributor'}
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-3 whitespace-nowrap text-slate-500">
                    {u.department || 'Product Engineering'}
                  </td>

                  <td className="px-6 py-3 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                    {member.joinedAt
                      ? new Date(member.joinedAt).toLocaleDateString()
                      : new Date().toLocaleDateString()}
                  </td>

                  {isManager && !isViewer && (
                    <td className="px-6 py-3 whitespace-nowrap text-right">
                      {!isLeadManager ? (
                        <button
                          onClick={() => handleRemoveMember(userId, u.name)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Remove from project"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Primary PM</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        projectId={projectId!}
        existingMemberIds={teamMembers.map((m: any) => {
          const u = m.user || m;
          return u.id || u._id;
        })}
        onSuccess={fetchTeam}
      />
    </div>
  );
};
