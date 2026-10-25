import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Menu, 
  Sparkles,
  X,
  CheckCircle2,
  Moon
} from 'lucide-react';
import { UserMenu } from '@/components/auth/UserMenu';
import { useAuth } from '@/hooks/useAuth';
import { DriveStatusBadge } from '@/components/drive/DriveStatusBadge';

interface DashboardHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenMobileMenu: () => void;
  onOpenDriveModal: () => void;
  onOpenSettings: () => void;
}

function getGreeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onOpenMobileMenu,
  onOpenDriveModal: _onOpenDriveModal,
  onOpenSettings,
}) => {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [greeting] = useState(() => getGreeting(new Date().getHours()));

  const displayName = user?.displayName?.split(' ')[0] || 'Educator';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-[#090b0e]/90 px-4 sm:px-6 backdrop-blur-md">
      {/* Left: Mobile hamburger & Greeting */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          aria-label="Open sidebar menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5 font-heading">
            <span>{greeting}, {displayName}</span>
            <span className="hidden sm:inline-block">👋</span>
          </h1>
          <p className="hidden md:block text-[11px] text-slate-400">
            Interactive Academic Whiteboards & Lecture Canvas
          </p>
        </div>
      </div>

      {/* Middle: Global Search Input */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search whiteboard lectures, formulas, or subjects..."
            className="w-full h-9 rounded-xl border border-slate-800 bg-[#12151b] pl-9 pr-8 text-xs text-slate-100 placeholder:text-slate-500 focus:border-lime-400/50 focus:bg-[#161a22] focus:outline-none focus:ring-1 focus:ring-lime-400/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right: Actions, Notifications & Account Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Google Drive Status & Reconnect Badge */}
        <DriveStatusBadge />

        {/* Theme Indicator (Dark Sophisticated) */}
        <div 
          className="hidden lg:flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-900 border border-slate-800 px-2 py-1 rounded-xl"
          title="Current Theme: Deep Charcoal & Electric Lime"
        >
          <Moon className="h-3.5 w-3.5 text-lime-400" />
          <span>Dark Mode</span>
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            className="relative rounded-xl border border-slate-800 bg-[#12151b] p-2 text-slate-400 hover:border-slate-700 hover:text-white transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-lime-400 ring-2 ring-[#090b0e]" />
          </button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-800 bg-[#0f131a] p-3 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-semibold text-white">Recent Activity & Sync</span>
                  <span className="text-[10px] text-lime-400 font-medium">All systems normal</span>
                </div>
                <div className="py-2 space-y-2">
                  <div className="flex items-start gap-2.5 rounded-lg p-2 bg-slate-900/60">
                    <CheckCircle2 className="h-4 w-4 text-lime-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-slate-200">StudyCanvas Engine Ready</p>
                      <p className="text-[10px] text-slate-400">Konva 60 FPS drawing ready for multi-slide lectures.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 rounded-lg p-2 bg-slate-900/60">
                    <Sparkles className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-slate-200">Formula & Derivation Presets</p>
                      <p className="text-[10px] text-slate-400">12 academic presets available in Canvas toolbar.</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Account Menu */}
        <div className="pl-1 border-l border-slate-800/80">
          <UserMenu onOpenSettings={onOpenSettings} />
        </div>
      </div>
    </header>
  );
};
