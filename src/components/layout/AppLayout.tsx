import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  UserCheck,
  LogOut,
  Menu,
  X,
  Layers,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Badge } from '../common/Badge.tsx';
import { DemoResetModal } from '../common/DemoResetModal.tsx';

export const AppLayout: React.FC = () => {
  const { user, logout, login, isAdmin, isViewer } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleRoleQuickSwitch = async (roleEmail: string) => {
    try {
      await login(roleEmail, 'Password123!');
      navigate(0);
    } catch (err) {
      console.error('Failed to quick switch role', err);
    }
  };

  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumbLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    projects: 'Projects',
    tasks: 'Tasks',
    team: 'Team Members',
    users: 'User Management',
    profile: 'Profile & Settings',
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Desktop Sidebar (256px) */}
      <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 bg-white shrink-0">
        {/* Brand header */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold shadow-xs">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-none">SynergyHub</h1>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Project Platform</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
            <Sparkles className="h-2.5 w-2.5" /> Demo
          </span>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/projects"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <FolderKanban className="h-4 w-4 shrink-0" />
            <span>Projects &amp; Tasks</span>
          </NavLink>

          {isAdmin && (
            <NavLink
              to="/users"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Users className="h-4 w-4 shrink-0" />
              <span>User Management</span>
            </NavLink>
          )}

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <UserCheck className="h-4 w-4 shrink-0" />
            <span>My Profile</span>
          </NavLink>
        </nav>

        {/* Quick Role Tester Bar (Hackathon Evaluation Helper) */}
        <div className="p-3 mx-3 mb-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-indigo-600" /> Fast Role Switch
            </span>
            <span className="text-[10px] text-slate-400 font-mono">1-Click</span>
          </div>
          <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
            Test server RBAC authorization across personas:
          </p>
          <div className="grid grid-cols-2 gap-1 text-[11px]">
            <button
              onClick={() => handleRoleQuickSwitch('admin@company.com')}
              className={`px-2 py-1 rounded text-left font-medium truncate transition-colors ${
                user?.role === 'admin'
                  ? 'bg-purple-100 text-purple-800 font-bold'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              Admin (Alex)
            </button>
            <button
              onClick={() => handleRoleQuickSwitch('pm@company.com')}
              className={`px-2 py-1 rounded text-left font-medium truncate transition-colors ${
                user?.role === 'project_manager'
                  ? 'bg-blue-100 text-blue-800 font-bold'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              PM (Sarah)
            </button>
            <button
              onClick={() => handleRoleQuickSwitch('dev@company.com')}
              className={`px-2 py-1 rounded text-left font-medium truncate transition-colors ${
                user?.role === 'team_member' && user.email === 'dev@company.com'
                  ? 'bg-slate-200 text-slate-900 font-bold'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              Dev (Marcus)
            </button>
            <button
              onClick={() => handleRoleQuickSwitch('viewer@company.com')}
              className={`px-2 py-1 rounded text-left font-medium truncate transition-colors ${
                user?.role === 'viewer'
                  ? 'bg-amber-100 text-amber-800 font-bold'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              Judge (Elena)
            </button>
          </div>
        </div>

        {/* User profile, Reset Demo button, and logout */}
        <div className="border-t border-slate-200 p-3 space-y-2">
          <button
            onClick={() => setIsResetModalOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <RefreshCw className="h-3 w-3 text-slate-500" />
            <span>Restore Demo Workspace</span>
          </button>

          <div className="flex items-center justify-between rounded-lg p-2 bg-slate-50/70 border border-slate-100">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-semibold text-xs border border-indigo-200">
                {user?.name.slice(0, 2).toUpperCase() || 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-900 truncate">{user?.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Badge type="role" value={user?.role || 'team_member'} />
                  {user?.isDemo && (
                    <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-1 rounded">
                      Demo
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8 shrink-0">
          {/* Left: Mobile Toggle & Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Breadcrumb path */}
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium overflow-hidden">
              <span className="text-slate-400">Workspace</span>
              {pathParts.map((part, index) => {
                const label = breadcrumbLabels[part] || (part.length > 18 ? 'Details' : part);
                const isLast = index === pathParts.length - 1;
                return (
                  <React.Fragment key={index}>
                    <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
                    <span
                      className={
                        isLast
                          ? 'text-slate-900 font-semibold truncate'
                          : 'text-slate-500 hover:text-slate-800'
                      }
                    >
                      {label}
                    </span>
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Right: Active Role banner and Demo indicator */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsResetModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              title="Re-seed realistic college projects"
            >
              <RefreshCw className="h-3 w-3 text-indigo-600" />
              <span>Restore Demo</span>
            </button>

            {isViewer && (
              <div className="hidden sm:flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs text-amber-700 border border-amber-200">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Read-Only Viewer Access</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 hidden sm:inline">Logged in as:</span>
              <span className="font-semibold text-slate-800">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-4 py-3 space-y-2">
            <NavLink
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-100"
            >
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </NavLink>
            <NavLink
              to="/projects"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-100"
            >
              <FolderKanban className="h-4 w-4" /> Projects &amp; Tasks
            </NavLink>
            {isAdmin && (
              <NavLink
                to="/users"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-100"
              >
                <Users className="h-4 w-4" /> User Management
              </NavLink>
            )}
            <NavLink
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg text-slate-700 hover:bg-slate-100"
            >
              <UserCheck className="h-4 w-4" /> My Profile
            </NavLink>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setIsResetModalOpen(true);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg text-indigo-700 bg-indigo-50"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Restore Demo Workspace
            </button>
            <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
              <span className="text-xs text-slate-500">{user?.email}</span>
              <button
                onClick={logout}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>

      {/* Demo Reset Modal */}
      <DemoResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onResetComplete={() => navigate(0)}
      />
    </div>
  );
};
