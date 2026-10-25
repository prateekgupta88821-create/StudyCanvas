import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Settings, HardDrive } from 'lucide-react';
import { AuthModal } from './AuthModal';

export const UserMenu: React.FC<{ onOpenSettings?: () => void }> = ({ onOpenSettings }) => {
  const { user, signOut, driveAccessToken } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'professor': return 'College Professor';
      case 'student': return 'Student';
      case 'teacher':
      default: return 'School Teacher';
    }
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(prev => !prev)}
          className="flex items-center gap-2.5 rounded-full border border-slate-800 bg-slate-900/80 p-1.5 pr-3 text-left transition hover:border-lime-400/50 hover:bg-slate-800"
          aria-label="Account menu"
          aria-expanded={dropdownOpen}
        >
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Google Account'}
              referrerPolicy="no-referrer"
              className="h-7 w-7 rounded-full object-cover ring-1 ring-lime-400/50"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-lime-400 text-xs font-bold text-slate-950 shadow-inner">
              {user?.displayName ? user.displayName[0].toUpperCase() : 'G'}
            </div>
          )}
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-slate-200 leading-tight">
              {user?.displayName || 'Educator Account'}
            </p>
            <p className="text-[10px] text-lime-400 capitalize">
              {getRoleLabel(user?.role)}
            </p>
          </div>
        </button>

        {dropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setDropdownOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-800 bg-[#0f131a] p-2 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2.5 mb-2">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      referrerPolicy="no-referrer"
                      className="h-9 w-9 rounded-full object-cover ring-1 ring-lime-400/40"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-lime-400 text-sm font-bold text-slate-950">
                      {user?.displayName ? user.displayName[0].toUpperCase() : 'G'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate">
                      {user?.displayName || 'Google Account'}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {user?.email || 'No email attached'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span className="capitalize text-lime-400 font-medium">{getRoleLabel(user?.role)}</span>
                  <span className="flex items-center gap-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${driveAccessToken ? 'bg-lime-400' : 'bg-slate-500'}`} />
                    {driveAccessToken ? 'Drive Sync Active' : 'Local Storage'}
                  </span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    setIsAuthOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <HardDrive className="h-4 w-4 text-indigo-400" />
                  <span>Google Drive Sync</span>
                </button>
                {onOpenSettings && (
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenSettings();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <Settings className="h-4 w-4 text-slate-400" />
                    <span>Preferences & Role</span>
                  </button>
                )}
              </div>

              <div className="border-t border-slate-800 pt-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    signOut();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
};
