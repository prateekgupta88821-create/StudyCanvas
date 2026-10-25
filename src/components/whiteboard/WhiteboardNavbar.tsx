import React, { useState } from 'react';
import { useWhiteboard } from '@/hooks/useWhiteboard';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { UserMenu } from '@/components/auth/UserMenu';
import { ThemeToggle } from '@/components/common/ThemeToggle';
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
  Edit2,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  Loader2,
  AlertCircle,
  CloudCheck,
  Play,
  LayoutTemplate,
  AlertTriangle,
  CloudOff,
  KeyRound,
  History,
  Sparkles,
  MessageSquare
} from 'lucide-react';

export interface WhiteboardNavbarProps {
  onBackToDashboard: () => void;
  onOpenExport: () => void;
  onOpenSettings: () => void;
  onOpenPageDrawer: () => void;
  onOpenTemplatesModal?: () => void;
  onOpenVersionHistory?: () => void;
  onToggleAiAssistant?: () => void;
  isAiAssistantOpen?: boolean;
  onOpenShare?: () => void;
  onToggleComments?: () => void;
  isCommentsOpen?: boolean;
}

export const WhiteboardNavbar: React.FC<WhiteboardNavbarProps> = ({
  onBackToDashboard,
  onOpenExport,
  onOpenSettings,
  onOpenPageDrawer,
  onOpenTemplatesModal,
  onOpenVersionHistory,
  onToggleAiAssistant,
  isAiAssistantOpen,
  onOpenShare,
  onToggleComments,
  isCommentsOpen,
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
    saveStatus,
    isFocusMode,
    setIsFocusMode,
    isPropertiesOpen,
    setIsPropertiesOpen,
    setIsPresentationMode,
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

  // Render visible save status
  const renderSaveStatus = () => {
    if (saveStatus === 'saving' || isSyncingDrive) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium" title="Saving your drawing...">
          <Loader2 className="h-3 w-3 animate-spin text-amber-400" />
          <span>Saving...</span>
        </div>
      );
    }
    if (saveStatus === 'conflict') {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium cursor-pointer" title="Sync conflict detected. Click to resolve.">
          <AlertTriangle className="h-3 w-3 text-rose-400" />
          <span>Conflict</span>
        </div>
      );
    }
    if (saveStatus === 'auth_expired') {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium cursor-pointer" title="Drive authorization expired. Work is saved in local recovery.">
          <KeyRound className="h-3 w-3 text-amber-400" />
          <span>Auth Expired</span>
        </div>
      );
    }
    if (saveStatus === 'offline') {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs font-medium" title="Offline mode: Drawings safely preserved in recovery cache">
          <CloudOff className="h-3 w-3 text-slate-400" />
          <span>Offline</span>
        </div>
      );
    }
    if (saveStatus === 'error') {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium" title="Cloud save failed. Drawing preserved in local recovery.">
          <AlertCircle className="h-3 w-3 text-rose-400" />
          <span>Save failed</span>
        </div>
      );
    }
    // Saved / Idle
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-lime-500/10 border border-lime-500/20 text-lime-400 text-xs font-medium" title="All edits saved">
        <Check className="h-3 w-3 text-lime-400" />
        <span>Saved</span>
      </div>
    );
  };

  return (
    <header className={`h-14 border-b border-slate-800/80 bg-[#090b0e]/90 backdrop-blur-xl px-3 sm:px-4 flex items-center justify-between z-30 select-none transition-all duration-200 ${
      isFocusMode ? 'opacity-30 hover:opacity-100' : ''
    }`}>
      {/* Left section: Return button, Title, Subject badge & Save Status */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
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
          <img src="/logo.svg" alt="StudyCanvas" className="h-7 w-7 shrink-0 hidden md:block" />
          
          {isEditingTitle ? (
            <input
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
              autoFocus
              className="bg-slate-900 border border-lime-500/60 rounded-lg px-2 py-0.5 text-sm font-semibold text-white focus:outline-none max-w-xs ring-1 ring-lime-500/30"
            />
          ) : (
            <div 
              onClick={() => setIsEditingTitle(true)}
              className="flex items-center gap-1.5 cursor-pointer group truncate"
              title="Click to rename project"
            >
              <h1 className="text-sm font-semibold text-slate-100 group-hover:text-lime-300 transition-colors truncate max-w-[130px] sm:max-w-[200px] md:max-w-xs">
                {project.title || 'Untitled Whiteboard'}
              </h1>
              <Edit2 className="h-3 w-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
          )}

          {/* Subject Badge */}
          {project.subject && (
            <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60">
              {project.subject}
            </span>
          )}
        </div>

        {/* Visible Save Status Pill */}
        <div className="hidden sm:flex items-center ml-1">
          {renderSaveStatus()}
        </div>
      </div>

      {/* Center section: Undo/Redo & Page selector */}
      <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800/90 rounded-xl p-0.5 sm:p-1 shadow-inner">
        <Button
          variant="ghost"
          size="iconSm"
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="text-slate-300 disabled:opacity-25 hover:text-white"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="iconSm"
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className="text-slate-300 disabled:opacity-25 hover:text-white"
        >
          <Redo2 className="h-4 w-4" />
        </Button>

        <div className="h-4 w-[1px] bg-slate-800 mx-1" />

        <button
          onClick={onOpenPageDrawer}
          className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
          title="View Slides & Pages"
        >
          <Layers className="h-3.5 w-3.5 text-lime-400" />
          <span className="hidden xs:inline">Page</span>
          <span>{activePageIndex + 1}/{project.pages.length}</span>
        </button>
      </div>

      {/* Right section: AI Tutor, Presentation, Templates, Focus Mode, Properties Toggle, Drive, Export, Settings, User */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* AI Learning Assistant */}
        {onToggleAiAssistant && (
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleAiAssistant}
            title="AI Learning Assistant (Explain, Summaries, Flashcards, Quiz, Flowcharts)"
            className={`text-xs h-8 border-lime-500/40 text-lime-400 hover:bg-lime-500/10 transition-all ${
              isAiAssistantOpen
                ? 'bg-lime-500/20 border-lime-500 text-lime-300 shadow-[0_0_12px_rgba(163,230,53,0.25)]'
                : 'bg-slate-900/80'
            }`}
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5 text-lime-400" />
            <span className="hidden sm:inline">AI Tutor</span>
          </Button>
        )}

        {/* Presentation Mode */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsPresentationMode(true)}
          title="Distraction-Free Presentation Mode (Shift+P)"
          className="text-xs h-8 hidden md:inline-flex border-slate-700 bg-slate-900/80 text-slate-200 hover:text-white hover:border-lime-500/50"
        >
          <Play className="mr-1.5 h-3.5 w-3.5 text-lime-400 fill-lime-400/20" />
          <span>Present</span>
        </Button>

        {/* Templates Modal */}
        {onOpenTemplatesModal && (
          <Button
            variant="ghost"
            size="iconSm"
            onClick={onOpenTemplatesModal}
            title="Educational Starter Templates"
            className="text-slate-400 hover:text-lime-300 hidden lg:inline-flex"
          >
            <LayoutTemplate className="h-4 w-4" />
          </Button>
        )}

        {/* Focus Mode Toggle */}
        <Button
          variant="ghost"
          size="iconSm"
          onClick={() => setIsFocusMode((prev) => !prev)}
          title={isFocusMode ? "Exit Focus Mode (F)" : "Focus Mode (F)"}
          className={isFocusMode ? "text-lime-400 bg-lime-500/10" : "text-slate-400 hover:text-white"}
        >
          {isFocusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>

        {/* Collapsible Properties Panel Toggle */}
        <Button
          variant="ghost"
          size="iconSm"
          onClick={() => setIsPropertiesOpen((prev) => !prev)}
          title="Toggle Properties Panel"
          className={isPropertiesOpen ? "text-lime-400 bg-lime-500/10" : "text-slate-400 hover:text-white"}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>

        {/* Google Drive sync button */}
        {driveAccessToken && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncToDrive()}
            isLoading={isSyncingDrive}
            className="hidden xl:inline-flex text-xs h-8 border-lime-500/30 text-lime-400 hover:bg-lime-500/10"
          >
            {project.driveFileId ? (
              <CloudCheck className="mr-1.5 h-3.5 w-3.5 text-lime-400" />
            ) : (
              <HardDrive className="mr-1.5 h-3.5 w-3.5" />
            )}
            Drive
          </Button>
        )}

        {/* Google Drive Version History */}
        {onOpenVersionHistory && driveAccessToken && (
          <Button
            variant="ghost"
            size="iconSm"
            onClick={onOpenVersionHistory}
            title="Google Drive Version History & Revisions"
            className="text-slate-400 hover:text-lime-300 hidden lg:inline-flex"
          >
            <History className="h-4 w-4" />
          </Button>
        )}

        {/* Clear Slide Button */}
        <Button
          variant="ghost"
          size="iconSm"
          onClick={() => {
            if (confirm('Clear all drawings and annotations on this page?')) {
              clearPage();
            }
          }}
          title="Clear Current Page"
          className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hidden md:inline-flex"
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        {/* Comments Drawer Toggle */}
        {onToggleComments && (
          <Button
            variant="ghost"
            size="iconSm"
            onClick={onToggleComments}
            title="Whiteboard Comments & Review"
            className={isCommentsOpen ? "text-sky-400 bg-sky-500/10" : "text-slate-400 hover:text-white"}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        )}

        {/* Share Button (Real-time Collaboration & Role Management) */}
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenShare || handleShare}
          title="Share & Real-Time Collaboration"
          className="text-xs h-8 border-slate-700 bg-slate-900/80 text-slate-200 hover:text-white hover:border-lime-500/50 hidden sm:inline-flex"
        >
          <Share2 className="mr-1.5 h-3.5 w-3.5 text-lime-400" />
          <span>Share</span>
        </Button>

        {/* Export Button */}
        <Button
          variant="default"
          size="sm"
          onClick={onOpenExport}
          className="text-xs h-8 font-semibold shadow-none bg-lime-500 text-slate-950 hover:bg-lime-400"
        >
          <Download className="mr-1.5 h-3.5 w-3.5" />
          <span className="hidden sm:inline">Export</span>
        </Button>

        {/* Theme Toggle Button */}
        <ThemeToggle className="hidden md:flex h-8" />

        {/* Settings */}
        <Button
          variant="ghost"
          size="iconSm"
          onClick={onOpenSettings}
          title="Whiteboard Settings"
          className="text-slate-400 hover:text-white"
        >
          <Settings className="h-4 w-4" />
        </Button>

        <div className="pl-0.5">
          <UserMenu onOpenSettings={onOpenSettings} />
        </div>
      </div>
    </header>
  );
};
