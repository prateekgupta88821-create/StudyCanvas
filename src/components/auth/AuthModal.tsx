import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { isFirebaseInitialized } from '@/config/firebase';
import { GraduationCap, ShieldCheck, HardDrive, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { EducatorRole } from '@/types/auth';

export const AuthModal: React.FC<{ isOpen: boolean; onClose: () => void; onSuccess?: () => void }> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, signInWithGoogle, updateRole, loading, authErrorInfo, clearError } = useAuth();
  const [selectedRole, setSelectedRole] = useState<EducatorRole>(user?.role || 'teacher');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async () => {
    clearError();
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      if (selectedRole) {
        await updateRole(selectedRole);
      }
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch {
      // Error is caught, formatted, and exposed via AuthContext and Toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="StudyCanvas Account & Google Drive Sync"
      description="Connect your verified Google Account to save whiteboard lessons, sync real-time metadata, and access your lecture notes anywhere."
    >
      <div className="space-y-6 pt-2">
        {/* Role selector */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Select Your Educator / Student Profile
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: 'teacher', label: 'School Teacher', desc: 'K-12 Classes' },
                { id: 'professor', label: 'College Prof', desc: 'Higher Ed' },
                { id: 'student', label: 'Student / Scholar', desc: 'Study & Review' },
              ] as const
            ).map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRole(r.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  selectedRole === r.id
                    ? 'border-lime-400 bg-lime-400/10 text-white ring-1 ring-lime-400'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <GraduationCap className={`h-5 w-5 mb-1 ${selectedRole === r.id ? 'text-lime-400' : 'text-slate-500'}`} />
                <span className="text-xs font-semibold">{r.label}</span>
                <span className="text-[10px] text-slate-500 mt-0.5">{r.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Benefits list */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-lime-400/10 p-1.5 text-lime-400 border border-lime-400/20">
              <HardDrive className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-200">Google Drive Native File Storage</p>
              <p className="text-[11px] text-slate-400">
                Your whiteboards are stored as <code className="text-lime-400 font-mono">.studycanvas</code> files directly in your Google Drive without third-party vendor lock-in.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-emerald-500/10 p-1.5 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-200">Cloud Firestore Realtime Metadata</p>
              <p className="text-[11px] text-slate-400">
                Synchronize title, subjects, timestamps, and page counts across all your browser tabs.
              </p>
            </div>
          </div>
        </div>

        {authErrorInfo && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/25 p-3.5 space-y-2 text-xs text-red-300">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-200">{authErrorInfo.code}</p>
                <p className="text-[11px] text-red-300/90 leading-relaxed mt-0.5">
                  {authErrorInfo.message}
                </p>
              </div>
            </div>
            {authErrorInfo.isRetryable && (
              <div className="pt-1 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSignIn}
                  disabled={loading || isSubmitting}
                  className="text-xs border-red-500/30 text-red-300 hover:bg-red-500/20 gap-1.5 h-7"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Retry Sign In</span>
                </Button>
              </div>
            )}
          </div>
        )}

        {!isFirebaseInitialized && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-300">
            <strong>Configuration Notice:</strong> Firebase credentials are currently unconfigured in <code className="text-amber-200 font-mono">.env.local</code>. Real Google authentication requires adding your Firebase project credentials.
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2 pt-2">
          {user ? (
            <div className="flex items-center justify-between rounded-xl border border-lime-400/30 bg-lime-400/10 p-3">
              <div className="flex items-center gap-2.5">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="h-8 w-8 rounded-full object-cover ring-1 ring-lime-400/50"
                  />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-lime-400" />
                )}
                <div>
                  <p className="text-xs font-semibold text-white">Signed in as {user.displayName}</p>
                  <p className="text-[11px] text-lime-300/80">{user.email}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={onClose}>
                Done
              </Button>
            </div>
          ) : (
            <Button
              variant="lime"
              size="lg"
              className="w-full text-sm font-semibold h-11"
              onClick={handleSignIn}
              isLoading={loading || isSubmitting}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#000000"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#000000"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#000000"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#000000"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400">
            Cancel
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
