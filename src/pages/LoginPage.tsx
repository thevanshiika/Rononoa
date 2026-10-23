import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { Layers, Shield, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password123!');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Invalid credentials or inactive account.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSelect = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await login(demoEmail, 'Password123!');
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to authenticate demo user'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    {
      role: 'Admin',
      name: 'Alex Rivera',
      email: 'admin@company.com',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      description: 'Hackathon Director: Provision accounts, govern permissions, and oversee all projects.',
    },
    {
      role: 'Project Manager',
      name: 'Sarah Chen',
      email: 'pm@company.com',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      description: 'Lead Student Coordinator: Manage College Hackathon Platform, invite friends, assign tasks.',
    },
    {
      role: 'Team Member',
      name: 'Marcus Vance',
      email: 'dev@company.com',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
      description: 'Senior Student Engineer: Work on assigned tasks, change status, test atomic OCC.',
    },
    {
      role: 'Faculty Judge (Viewer)',
      name: 'Elena Rostova',
      email: 'viewer@company.com',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      description: 'Faculty Advisor & Evaluator: Read-only access to inspect project velocity and submissions.',
    },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Left Side: Login Form */}
        <div className="p-8 md:p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold shadow-xs">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-tight">SynergyHub</h1>
                <p className="text-xs text-slate-500">Collaborative Project Management</p>
              </div>
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-1">Welcome back</h2>
            <p className="text-xs text-slate-500 mb-6">
              Sign in with your enterprise credentials or use a 1-click demo role.
            </p>

            {errorMessage && (
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">Demo: Password123!</span>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-xs"
              >
                {isLoading ? 'Authenticating...' : 'Sign In to Workspace'}
              </button>
            </form>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 text-[11px] text-slate-400">
            Enforces server-side JWT authentication, bcrypt password hashing, and atomic OCC.
          </div>
        </div>

        {/* Right Side: Demo Account Selector */}
        <div className="bg-slate-50/80 p-8 md:p-10 border-t md:border-t-0 md:border-l border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <KeyRound className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                1-Click Hackathon Demo Selector
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Select any role below to instantly log in and test authorization matrices:
            </p>

            <div className="space-y-2.5">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleDemoSelect(account.email)}
                  disabled={isLoading}
                  className="w-full text-left p-3 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {account.name}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${account.badgeColor}`}>
                      {account.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal mb-1">
                    {account.description}
                  </p>
                  <span className="text-[10px] font-mono text-slate-400">{account.email}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>MongoDB with atomic OCC &amp; role permissions active.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
