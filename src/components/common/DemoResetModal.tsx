import React, { useState } from 'react';
import { api } from '../../api/client.ts';
import { Modal } from './Modal.tsx';
import { AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';

interface DemoResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetComplete: () => void;
}

export const DemoResetModal: React.FC<DemoResetModalProps> = ({
  isOpen,
  onClose,
  onResetComplete,
}) => {
  const [retainCustomData, setRetainCustomData] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleReset = async () => {
    setIsResetting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await api.post('/demo/reset', {
        confirmReset: true,
        retainCustomData,
      });

      if (res.data.success) {
        setSuccessMessage(res.data.message || 'Demo workspace successfully restored.');
        setTimeout(() => {
          onResetComplete();
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to restore demo workspace'
      );
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Restore Demo Workspace"
      subtitle="Re-seed realistic college hackathon projects and tasks"
      maxWidth="md"
    >
      <div className="space-y-4">
        {successMessage ? (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-3.5 border border-amber-200 text-xs text-amber-800">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Notice to Evaluators &amp; Students:</span>
                <p className="mt-1 leading-relaxed text-amber-900">
                  This action connects directly to your local MongoDB instance to restore the 4 standard college hackathon projects (College Hackathon Platform, Student Collaboration Portal, Portfolio Website Redesign, Campus Event Management) and 20 sample tasks.
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                {errorMessage}
              </div>
            )}

            <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={retainCustomData}
                  onChange={(e) => setRetainCustomData(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800">
                    Preserve my real friends &amp; custom projects
                  </span>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Recommended: Keeps accounts and tasks you created, while resetting the core demo seeds.
                  </p>
                </div>
              </label>
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
                type="button"
                disabled={isResetting}
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                <span>{isResetting ? 'Restoring Data...' : 'Confirm Restore'}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
