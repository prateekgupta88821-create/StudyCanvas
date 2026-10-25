import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  User, 
  UserCircle2, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  LogOut 
} from 'lucide-react';
import { EducatorRole } from '@/types/auth';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { 
    user, 
    signInWithEmail, 
    signUpWithEmail, 
    signInAsGuest, 
    signOut,
    loading, 
    authErrorInfo, 
    clearError 
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState<EducatorRole>('teacher');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localValidation, setLocalValidation] = useState<string | null>(null);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setLocalValidation(null);
    clearError();
  };

  const handleTabSwitch = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    setLocalValidation(null);
    clearError();
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalValidation(null);
    clearError();

    if (!email.trim() || !email.includes('@')) {
      setLocalValidation('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setLocalValidation('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password, displayName, selectedRole);
      } else {
        await signInWithEmail(email, password);
      }
      resetForm();
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch {
      // Handled via context & authErrorInfo
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestSignIn = async () => {
    setLocalValidation(null);
    clearError();
    setIsSubmitting(true);
    try {
      await signInAsGuest('Guest Educator', selectedRole);
      resetForm();
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch {
      // Handled via context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    resetForm();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={user ? 'StudyCanvas Profile' : mode === 'signin' ? 'Sign In to StudyCanvas' : 'Create StudyCanvas Account'}
      description={
        user 
          ? `Manage your active session and educator profile.`
          : mode === 'signin'
            ? 'Access your saved whiteboards, lecture notes, and classroom boards.'
            : 'Join educators and students creating interactive derivations and lecture notes.'
      }
      maxWidth="max-w-md"
    >
      <div className="space-y-5 pt-1 text-slate-100">
        {user ? (
          // Active User Session Card
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-lime-400/10 border border-lime-400/20 flex items-center justify-center text-lime-400 font-bold text-sm">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white truncate">{user.displayName || 'StudyCanvas User'}</p>
                    {user.isGuest && (
                      <span className="text-[10px] font-semibold uppercase bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                        Guest Mode
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate">{user.email || 'Temporary local session'}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="capitalize">Role: <strong className="text-white">{user.role}</strong></span>
                <span className="text-[11px] text-lime-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Ready
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="w-full text-xs text-rose-300 border-rose-500/30 hover:bg-rose-500/10 gap-1.5"
                onClick={handleSignOut}
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </Button>
              <Button
                variant="lime"
                className="w-full text-xs font-semibold"
                onClick={() => {
                  onClose();
                  if (onSuccess) onSuccess();
                }}
              >
                <span>Continue</span>
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Mode Toggle Tabs */}
            <div className="flex rounded-xl bg-slate-900/80 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => handleTabSwitch('signin')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'signin'
                    ? 'bg-lime-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleTabSwitch('signup')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'signup'
                    ? 'bg-lime-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Role selector (in Signup mode) */}
            {mode === 'signup' && (
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Select Your Primary Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'teacher', label: 'Teacher', desc: 'K-12 Classes' },
                      { id: 'professor', label: 'Professor', desc: 'Higher Ed' },
                      { id: 'student', label: 'Student', desc: 'Study & Review' },
                    ] as const
                  ).map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRole(r.id)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                        selectedRole === r.id
                          ? 'border-lime-400 bg-lime-400/10 text-white ring-1 ring-lime-400'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <GraduationCap className={`h-4 w-4 mb-1 ${selectedRole === r.id ? 'text-lime-400' : 'text-slate-500'}`} />
                      <span className="text-xs font-semibold">{r.label}</span>
                      <span className="text-[9px] text-slate-500">{r.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Email / Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3.5">
              {mode === 'signup' && (
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Professor Marie Curie"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-lime-400"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@school.edu"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-lime-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-lime-400"
                  />
                </div>
              </div>

              {(localValidation || authErrorInfo) && (
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/25 p-3 text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{localValidation || authErrorInfo?.message}</span>
                </div>
              )}

              <Button
                type="submit"
                variant="lime"
                size="lg"
                className="w-full text-xs font-bold h-10 mt-1"
                isLoading={loading || isSubmitting}
              >
                <span>{mode === 'signin' ? 'Sign In' : 'Create Free Account'}</span>
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </form>

            {/* Guest Mode Divider & Quick Access */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-semibold">
                <span className="bg-[#090b0e] px-2 text-slate-500 tracking-wider">Or continue without account</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleGuestSignIn}
              disabled={loading || isSubmitting}
              className="w-full text-xs font-semibold h-10 border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-200 hover:text-white gap-2"
            >
              <UserCircle2 className="h-4 w-4 text-lime-400" />
              <span>Continue as Guest</span>
              <span className="text-[10px] text-slate-400 ml-auto font-normal flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-lime-400" /> Instant Access
              </span>
            </Button>
          </>
        )}
      </div>
    </Dialog>
  );
};
