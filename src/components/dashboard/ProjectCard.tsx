import React, { useState } from 'react';
import { WhiteboardProject } from '@/types/whiteboard';
import { formatRelativeTime } from '@/utils/formatters';
import { 
  FileEdit, 
  Trash2, 
  Copy, 
  Star, 
  MoreVertical, 
  RotateCcw, 
  HardDrive, 
  Layers, 
  Clock, 
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export interface ProjectCardProps {
  project: WhiteboardProject;
  viewMode?: 'grid' | 'list';
  isTrashView?: boolean;
  onOpen: (project: WhiteboardProject) => void;
  onRename: (project: WhiteboardProject) => void;
  onDuplicate: (project: WhiteboardProject) => void;
  onToggleFavorite: (id: string, currentFav: boolean) => void;
  onMoveToTrash: (id: string, title: string) => void;
  onRestore?: (id: string, title: string) => void;
  onDeletePermanent: (project: WhiteboardProject) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  viewMode = 'grid',
  isTrashView = false,
  onOpen,
  onRename,
  onDuplicate,
  onToggleFavorite,
  onMoveToTrash,
  onRestore,
  onDeletePermanent,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const pagesCount = project.pages?.length || 1;
  const firstPage = project.pages?.[0];
  const elementsCount = project.pages?.reduce((acc, p) => acc + (p.elements?.length || 0), 0) || 0;
  const isFavorite = Boolean(project.isFavorite);

  // Background style for canvas thumbnail
  const bgColor = firstPage?.backgroundColor || '#090d16';
  const gridType = firstPage?.gridType || 'dots';

  const gridClassMap: Record<string, string> = {
    dots: 'bg-grid-dots',
    lines: 'bg-grid-lines',
    ruled: 'bg-grid-ruled',
    isometric: 'bg-grid-isometric',
    grid: 'bg-grid-lines',
    coordinate: 'bg-grid-lines',
    blank: '',
  };
  const gridClass = gridClassMap[gridType] || 'bg-grid-dots';

  if (viewMode === 'list') {
    return (
      <div className="group relative flex items-center justify-between rounded-2xl border border-slate-800/80 bg-[#0f131a] px-4 py-3 hover:border-lime-400/40 hover:bg-[#131822] hover:shadow-lg transition-all duration-150">
        <div 
          onClick={() => !isTrashView && onOpen(project)}
          className={`flex items-center gap-3.5 flex-1 min-w-0 ${!isTrashView ? 'cursor-pointer' : ''}`}
        >
          {/* List thumbnail */}
          <div 
            style={{ backgroundColor: bgColor }}
            className={`relative flex h-10 w-14 shrink-0 items-center justify-center rounded-xl border border-slate-700/60 overflow-hidden ${gridClass}`}
          >
            <BookOpen className="h-4 w-4 text-slate-500 opacity-60" />
          </div>

          {/* Title & Subject */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-semibold text-white group-hover:text-lime-400 transition-colors truncate">
                {project.title || 'Untitled Whiteboard'}
              </h3>
              {project.driveFileId && (
                <span title="Synced to Google Drive" className="text-emerald-400 shrink-0">
                  <HardDrive className="h-3 w-3" />
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {project.subject} • {project.description || `${pagesCount} slides, ${elementsCount} drawings`}
            </p>
          </div>
        </div>

        {/* Right stats & actions */}
        <div className="flex items-center gap-4 sm:gap-6 shrink-0 pl-3">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
            <Layers className="h-3 w-3 text-slate-500" />
            <span>{pagesCount} {pagesCount === 1 ? 'Page' : 'Pages'}</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Clock className="h-3 w-3 text-slate-500" />
            <span>{formatRelativeTime(project.updatedAt)}</span>
          </div>

          {!isTrashView && (
            <button
              onClick={() => onToggleFavorite(project.id, isFavorite)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
              title={isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
              aria-label={isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
            >
              <Star className={`h-4 w-4 ${isFavorite ? 'text-amber-400 fill-amber-400' : ''}`} />
            </button>
          )}

          {/* Context menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="More actions"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-1.5 w-48 rounded-2xl border border-slate-800 bg-[#0c1017] p-1.5 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95">
                  {!isTrashView ? (
                    <>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onOpen(project);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        <FileEdit className="h-3.5 w-3.5 text-lime-400" />
                        <span>Open Canvas</span>
                      </button>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onRename(project);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        <FileEdit className="h-3.5 w-3.5 text-slate-400" />
                        <span>Rename / Details</span>
                      </button>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onDuplicate(project);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        <Copy className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Duplicate</span>
                      </button>
                      <div className="my-1 border-t border-slate-800" />
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onMoveToTrash(project.id, project.title);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Move to Trash</span>
                      </button>
                    </>
                  ) : (
                    <>
                      {onRestore && (
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            onRestore(project.id, project.title);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-lime-400 hover:bg-lime-400/10 transition-colors"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Restore Whiteboard</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onDeletePermanent(project);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete Permanently</span>
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid Card View
  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-[#0f131a] p-3.5 hover:border-lime-400/40 hover:bg-[#121620] hover:shadow-xl hover:shadow-lime-400/5 transition-all duration-200">
      <div>
        {/* Canvas Visual Thumbnail */}
        <div
          onClick={() => !isTrashView && onOpen(project)}
          style={{ backgroundColor: bgColor }}
          className={`relative h-36 w-full rounded-xl border border-slate-800/90 overflow-hidden mb-3.5 select-none ${gridClass} ${
            !isTrashView ? 'cursor-pointer' : ''
          }`}
        >
          {/* Subtle element simulation */}
          <div className="absolute inset-0 p-3 pointer-events-none flex flex-col justify-between opacity-80">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500 bg-black/40 px-1.5 py-0.5 rounded">
                {gridType.toUpperCase()}
              </span>
              {project.driveFileId && (
                <span className="flex items-center gap-1 text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                  <HardDrive className="h-2.5 w-2.5" />
                  DRIVE
                </span>
              )}
            </div>

            {/* Mock whiteboard sketch hint */}
            <div className="flex items-center justify-center">
              <div className="rounded-lg border border-lime-400/20 bg-lime-400/5 px-2.5 py-1 text-[10px] text-lime-400/80 font-mono">
                {firstPage?.elements?.[0]?.type === 'sticky' ? '📝 Sticky Notes' : `${elementsCount} Elements`}
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>Slide {project.activePageIndex + 1} of {pagesCount}</span>
            </div>
          </div>

          {/* Quick Favorite Star in Top-Right of thumbnail */}
          {!isTrashView && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(project.id, isFavorite);
              }}
              className="absolute top-2 right-2 rounded-lg bg-black/60 p-1.5 text-slate-400 hover:text-amber-400 backdrop-blur-md transition-colors"
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star className={`h-3.5 w-3.5 ${isFavorite ? 'text-amber-400 fill-amber-400' : ''}`} />
            </button>
          )}
        </div>

        {/* Card info */}
        <div className="flex items-center justify-between mb-1.5">
          <Badge variant="purple" className="text-[10px] px-2 py-0.5">
            {project.subject || 'General'}
          </Badge>
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatRelativeTime(project.updatedAt)}
          </span>
        </div>

        {/* Title */}
        <h3
          onClick={() => !isTrashView && onOpen(project)}
          className={`text-sm font-semibold text-white group-hover:text-lime-400 transition-colors line-clamp-1 ${
            !isTrashView ? 'cursor-pointer' : ''
          }`}
          title={project.title}
        >
          {project.title || 'Untitled Whiteboard'}
        </h3>

        {/* Description */}
        <p className="mt-1 text-xs text-slate-400 line-clamp-2 h-8 leading-snug">
          {project.description || `${pagesCount} slides with ${elementsCount} drawn educational elements.`}
        </p>
      </div>

      {/* Card Footer Actions */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        {!isTrashView ? (
          <button
            onClick={() => onOpen(project)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-lime-400 hover:text-lime-300 transition-colors"
          >
            <FileEdit className="h-3.5 w-3.5" />
            <span>Open Canvas</span>
          </button>
        ) : (
          <div className="text-[11px] text-amber-400/90 font-medium">
            In Trash
          </div>
        )}

        {/* Right menu options */}
        <div className="flex items-center gap-1">
          {project.driveWebViewLink && (
            <a
              href={project.driveWebViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Open in Google Drive"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}

          <div className="relative">
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="More options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 bottom-full mb-1 w-48 rounded-2xl border border-slate-800 bg-[#0c1017] p-1.5 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95">
                  {!isTrashView ? (
                    <>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onOpen(project);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        <FileEdit className="h-3.5 w-3.5 text-lime-400" />
                        <span>Open Canvas</span>
                      </button>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onRename(project);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        <FileEdit className="h-3.5 w-3.5 text-slate-400" />
                        <span>Rename / Details</span>
                      </button>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onDuplicate(project);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        <Copy className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Duplicate</span>
                      </button>
                      <div className="my-1 border-t border-slate-800" />
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onMoveToTrash(project.id, project.title);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Move to Trash</span>
                      </button>
                    </>
                  ) : (
                    <>
                      {onRestore && (
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            onRestore(project.id, project.title);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-lime-400 hover:bg-lime-400/10 transition-colors"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Restore Whiteboard</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onDeletePermanent(project);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete Permanently</span>
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
