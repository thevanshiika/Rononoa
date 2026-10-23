import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 font-bold mx-auto mb-4 border border-indigo-100">
          <Layers className="h-7 w-7" />
        </div>
        <span className="font-mono text-xs font-bold text-indigo-600 uppercase tracking-widest">
          404 Error
        </span>
        <h1 className="text-xl font-bold text-slate-900 mt-1">Page Not Found</h1>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          The requested path does not exist or you may not possess sufficient security permissions to view this resource.
        </p>

        <div className="mt-6 flex justify-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-2xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};
