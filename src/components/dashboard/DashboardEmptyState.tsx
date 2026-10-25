import React from 'react';
import { 
  Plus, 
  SearchX, 
  Star, 
  Trash2, 
  Users, 
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DashboardTab } from './DashboardSidebar';

interface DashboardEmptyStateProps {
  tab: DashboardTab;
  searchQuery?: string;
  onClearSearch?: () => void;
  onCreateNew: () => void;
}

export const DashboardEmptyState: React.FC<DashboardEmptyStateProps> = ({
  tab,
  searchQuery,
  onClearSearch,
  onCreateNew,
}) => {
  if (searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-800/80 bg-slate-900/30 p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/60 border border-slate-700/50 text-slate-400 mb-4">
          <SearchX className="h-7 w-7" />
        </div>
        <h3 className="text-base font-bold text-white font-heading">
          No Whiteboards Match &ldquo;{searchQuery}&rdquo;
        </h3>
        <p className="mt-1.5 text-xs text-slate-400 max-w-sm leading-relaxed">
          Check for spelling errors or try searching for another academic subject or keyword.
        </p>
        {onClearSearch && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSearch}
            className="mt-5 text-xs"
          >
            Clear Search Filter
          </Button>
        )}
      </div>
    );
  }

  if (tab === 'favorites') {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-800/80 bg-slate-900/30 p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400 mb-4">
          <Star className="h-7 w-7 fill-amber-400/20" />
        </div>
        <h3 className="text-base font-bold text-white font-heading">No Favorite Whiteboards Yet</h3>
        <p className="mt-1.5 text-xs text-slate-400 max-w-sm leading-relaxed">
          Star your most important lecture notes and active courses to pin them for quick access.
        </p>
      </div>
    );
  }

  if (tab === 'shared') {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-800/80 bg-slate-900/30 p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 mb-4">
          <Users className="h-7 w-7" />
        </div>
        <h3 className="text-base font-bold text-white font-heading">No Shared Whiteboards Yet</h3>
        <p className="mt-1.5 text-xs text-slate-400 max-w-sm leading-relaxed">
          Whiteboards shared with your Google account by fellow educators or students will appear here.
        </p>
      </div>
    );
  }

  if (tab === 'trash') {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-800/80 bg-slate-900/30 p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/60 border border-slate-700/50 text-slate-400 mb-4">
          <Trash2 className="h-7 w-7" />
        </div>
        <h3 className="text-base font-bold text-white font-heading">Trash Bin is Empty</h3>
        <p className="mt-1.5 text-xs text-slate-400 max-w-sm leading-relaxed">
          Deleted whiteboards stay in your Trash Bin so you can recover them anytime.
        </p>
      </div>
    );
  }

  // Default Home / My Whiteboards empty state
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-800/80 bg-gradient-to-b from-[#11151d] to-[#0c0f15] p-10 sm:p-14 text-center shadow-xl">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-lime-400/10 border border-lime-400/20 text-lime-400 mb-4 shadow-lg shadow-lime-400/10">
        <Layers className="h-8 w-8" />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-white font-heading">
        Your Ideas Deserve an Infinite Canvas
      </h3>
      <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed">
        Start creating your first educational session. Draw diagrams, annotate formulas, illustrate complex proofs, and save directly to Google Drive.
      </p>
      <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
        <Button
          variant="lime"
          size="md"
          onClick={onCreateNew}
          className="text-xs font-semibold gap-2 shadow-lg shadow-lime-400/15"
        >
          <Plus className="h-4 w-4" />
          <span>Create First Whiteboard</span>
        </Button>
      </div>
    </div>
  );
};
