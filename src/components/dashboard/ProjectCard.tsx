import React from 'react';
import { WhiteboardProject } from '@/types/whiteboard';
import { formatRelativeTime } from '@/utils/formatters';
import { 
  FileEdit, 
  Trash2, 
  HardDrive, 
  Layers, 
  Clock, 
  ExternalLink 
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export interface ProjectCardProps {
  project: WhiteboardProject;
  onOpen: (project: WhiteboardProject) => void;
  onDelete: (id: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onOpen,
  onDelete,
}) => {
  const pagesCount = project.pages?.length || 1;
  const elementsCount = project.pages?.reduce((acc, p) => acc + (p.elements?.length || 0), 0) || 0;

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5 backdrop-blur-md hover:border-indigo-500/40 hover:bg-slate-900/80 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-200">
      <div>
        {/* Top bar */}
        <div className="flex items-center justify-between mb-3">
          <Badge variant="purple">
            {project.subject || 'General'}
          </Badge>
          <div className="flex items-center gap-1.5">
            {project.driveFileId ? (
              <span 
                title="Synced to Google Drive"
                className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20"
              >
                <HardDrive className="h-3 w-3" />
                Drive
              </span>
            ) : (
              <span 
                title="Saved locally in browser"
                className="text-[11px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full"
              >
                Local
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 
          onClick={() => onOpen(project)}
          className="text-base font-semibold text-white group-hover:text-indigo-300 transition-colors cursor-pointer line-clamp-1"
        >
          {project.title || 'Untitled Whiteboard'}
        </h3>

        {/* Description or tags */}
        <p className="mt-1 text-xs text-slate-400 line-clamp-2">
          {project.description || `${pagesCount} slides with ${elementsCount} drawn elements.`}
        </p>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-slate-500" />
            <span>{pagesCount} {pagesCount === 1 ? 'Page' : 'Pages'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span>{formatRelativeTime(project.updatedAt)}</span>
          </div>
        </div>
      </div>

      {/* Actions footer */}
      <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <button
          onClick={() => onOpen(project)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <FileEdit className="h-3.5 w-3.5" />
          <span>Open Canvas</span>
        </button>

        <div className="flex items-center gap-1">
          {project.driveWebViewLink && (
            <a
              href={project.driveWebViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
              title="Open in Google Drive"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Are you sure you want to delete "${project.title}"?`)) {
                onDelete(project.id);
              }
            }}
            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Delete Project"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
