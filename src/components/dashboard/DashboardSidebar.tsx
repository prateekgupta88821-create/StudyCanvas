import React from 'react';
import { 
  Home, 
  FolderKanban, 
  Users, 
  Star, 
  Trash2, 
  Settings, 
  Plus, 
  HardDrive,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export type DashboardTab = 'home' | 'my-projects' | 'shared' | 'favorites' | 'trash';

interface DashboardSidebarProps {
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  onCreateNew: () => void;
  onOpenSettings: () => void;
  counts: {
    all: number;
    favorites: number;
    trash: number;
  };
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  activeTab,
  onSelectTab,
  onCreateNew,
  onOpenSettings,
  counts,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const navItems = [
    { id: 'home' as const, label: 'Home Overview', icon: Home, count: null },
    { id: 'my-projects' as const, label: 'My Whiteboards', icon: FolderKanban, count: counts.all },
    { id: 'shared' as const, label: 'Shared with Me', icon: Users, count: 0 },
    { id: 'favorites' as const, label: 'Favorites', icon: Star, count: counts.favorites },
    { id: 'trash' as const, label: 'Trash Bin', icon: Trash2, count: counts.trash },
  ];

  const content = (
    <div className="flex h-full flex-col justify-between bg-[#0b0e13] border-r border-slate-800/80 p-4 select-none">
      <div className="space-y-6">
        {/* Brand header */}
        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="StudyCanvas" className="h-8 w-8" />
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-white font-heading">
                StudyCanvas
              </span>
              <span className="rounded-full bg-lime-400/10 border border-lime-400/25 px-1.5 py-0.2 text-[9px] font-semibold text-lime-400">
                EDU
              </span>
            </div>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close navigation sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Primary Action Button */}
        <div className="px-1">
          <Button
            variant="lime"
            size="lg"
            onClick={() => {
              onCreateNew();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full text-xs font-semibold h-11 gap-2 shadow-lg shadow-lime-400/15"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Whiteboard</span>
          </Button>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Workspaces & Views
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-lime-400/10 text-lime-400 border border-lime-400/25 font-semibold'
                    : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-lime-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.count !== null && item.count > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      isActive ? 'bg-lime-400/20 text-lime-300' : 'bg-slate-800/80 text-slate-400'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Settings & Storage Info */}
      <div className="space-y-3 pt-4 border-t border-slate-800/80">
        <button
          onClick={() => {
            onOpenSettings();
            if (onCloseMobile) onCloseMobile();
          }}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-900/80 hover:text-slate-200 transition-colors"
        >
          <Settings className="h-4 w-4 text-slate-500" />
          <span>Preferences & Role</span>
        </button>

        <div className="rounded-xl border border-slate-800/70 bg-[#0e1218] p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <HardDrive className="h-3.5 w-3.5 text-lime-400" />
            <span className="text-xs font-semibold text-slate-200">Google Drive Native</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Whiteboards are saved with zero vendor lock-in as native educational files.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Static Sidebar */}
      <aside className="hidden md:flex w-64 flex-col shrink-0">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[80vw] z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
