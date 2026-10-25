import React, { useState } from 'react';
import { useWhiteboard } from '@/contexts/WhiteboardContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/common/StatusPill';
import { UserMenu } from '@/components/auth/UserMenu';
import { 
  ArrowLeft, 
  Undo2, 
  Redo2, 
  HardDrive, 
  Download, 
  Trash2, 
  Layers, 
  Settings,
  Share2,
  Check,
  Edit2
} from 'lucide-react';

export interface WhiteboardNavbarProps {
  onBackToDashboard: () => void;
  onOpenExport: () => void;
  onOpenSettings: () => void;
  onOpenPageDrawer: () => void;
}

export const WhiteboardNavbar: React.FC<WhiteboardNavbarProps> = ({
  onBackToDashboard,
  onOpenExport,
  onOpenSettings,
  onOpenPageDrawer,
}) => {
  const { 
    project, 
    updateTitle, 
    undo, 
    redo, 
    canUndo, 
    canRedo, 
    clearPage,
    syncToDrive,
    isSyncingDrive,
    activePageIndex,
  } = useWhiteboard();

  const { driveAccessToken } = useAuth();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(project.title);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleValue.trim()) {
      updateTitle(titleValue.trim());
    } else {
      setTitleValue(project.title);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <header className="h-14 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl px-4 flex items-center justify-between z-30 select-none">
      {/* Left section: Return button & Title */}
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="iconSm"
          onClick={onBackToDashboard}
          title="Back to Dashboard"
          className="text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2 min-w-0">
          <img src="/logo.svg" alt="StudyCanvas" className="h-7 w-7 shrink-0 hidden sm:block" />
          
          {isEditingTitle ? (
            <input
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
              autoFocus
              className="bg-slate-900 border border-indigo-500 rounded-lg px-2 py-0.5 text-sm font-semibold text-white focus:outline-none max-w-xs"
            />
          ) : (
            <div 
              onClick={() => setIsEditingTitle(true)}
              className="flex items-center gap-1.5 cursor-pointer group truncate"
              title="Click to rename"
            >
              <h1 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors truncate max-w-[200px] sm:max-w-xs">
                {project.title || 'Untitled Whiteboard'}
              </h1>
              <Edit2 className="h-3 w-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
          )}
        </div>

        {/* Sync status pill */}
        <div className="hidden md:flex items-center">
          <StatusPill 
            state={isSyncingDrive ? 'syncing' : (project.driveFileId ? 'synced' : (driveAccessToken ? 'idle' : 'disconnected'))}
            lastSyncedAt={project.updatedAt}
          />
        </div>
      </div>

      {/* Center section: Undo/Redo & Page counter */}
      <div className="flex items-center gap-1 bg-slate-900/60 border border-slate-800 rounded-xl p-1">
        <Button
          variant="ghost"
          size="iconSm"
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="text-slate-300 disabled:opacity-30"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="iconSm"
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className="text-slate-300 disabled:opacity-30"
        >
          <Redo2 className="h-4 w-4" />
        </Button>

        <div className="h-4 w-[1px] bg-slate-800 mx-1" />

        <button
          onClick={onOpenPageDrawer}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          title="View Slides & Pages"
        >
          <Layers className="h-3.5 w-3.5 text-indigo-400" />
          <span>Page {activePageIndex + 1} of {project.pages.length}</span>
        </button>
      </div>

      {/* Right section: Drive Sync, Export, Settings, User */}
      <div className="flex items-center gap-2">
        {driveAccessToken && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncToDrive()}
            isLoading={isSyncingDrive}
            className="hidden sm:inline-flex text-xs h-8 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10"
          >
            <HardDrive className="mr-1.5 h-3.5 w-3.5" />
            Save to Drive
          </Button>
        )}

        <Button
          variant="ghost"
          size="iconSm"
          onClick={() => {
            if (confirm('Clear all drawings and annotations on this page?')) {
              clearPage();
            }
          }}
          title="Clear Current Slide"
          className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="iconSm"
          onClick={handleShare}
          title="Share Whiteboard Link"
          className="text-slate-400 hover:text-white"
        >
          {copiedLink ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={onOpenExport}
          className="text-xs h-8 font-semibold shadow-none"
        >
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Export
        </Button>

        <Button
          variant="ghost"
          size="iconSm"
          onClick={onOpenSettings}
          title="Whiteboard Settings"
          className="text-slate-400 hover:text-white"
        >
          <Settings className="h-4 w-4" />
        </Button>

        <div className="pl-1">
          <UserMenu onOpenSettings={onOpenSettings} />
        </div>
      </div>
    </header>
  );
};
