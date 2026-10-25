import React from 'react';
import { 
  LayoutGrid, 
  List, 
  Star, 
  ArrowUpDown,
  Filter
} from 'lucide-react';

export type SortOption = 'updated-desc' | 'updated-asc' | 'title-asc' | 'title-desc' | 'created-desc';
export type OwnershipFilter = 'all' | 'owned' | 'shared';

interface DashboardFilterBarProps {
  subjects: string[];
  selectedSubject: string;
  onSelectSubject: (subject: string) => void;
  ownership: OwnershipFilter;
  onSelectOwnership: (ownership: OwnershipFilter) => void;
  favoritesOnly: boolean;
  onToggleFavoritesOnly: () => void;
  sortBy: SortOption;
  onSelectSortBy: (sort: SortOption) => void;
  viewMode: 'grid' | 'list';
  onToggleViewMode: (mode: 'grid' | 'list') => void;
  totalCount: number;
}

export const DashboardFilterBar: React.FC<DashboardFilterBarProps> = ({
  subjects,
  selectedSubject,
  onSelectSubject,
  ownership,
  onSelectOwnership,
  favoritesOnly,
  onToggleFavoritesOnly,
  sortBy,
  onSelectSortBy,
  viewMode,
  onToggleViewMode,
  totalCount,
}) => {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-800/80 bg-[#0c1016] p-3 shadow-md">
      {/* Top row: Subject Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1 text-xs text-slate-400 font-semibold uppercase tracking-wider pr-2 shrink-0">
          <Filter className="h-3.5 w-3.5 text-lime-400" />
          <span>Subject:</span>
        </div>
        {subjects.map((subj) => {
          const isSelected = selectedSubject === subj;
          return (
            <button
              key={subj}
              onClick={() => onSelectSubject(subj)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all shrink-0 ${
                isSelected
                  ? 'bg-lime-400 text-slate-950 font-semibold shadow-sm shadow-lime-400/20'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              {subj}
            </button>
          );
        })}
      </div>

      {/* Bottom row: Ownership, Favorites, Sorting, View Mode, Count */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/70">
        <div className="flex flex-wrap items-center gap-2">
          {/* Ownership dropdown */}
          <select
            value={ownership}
            onChange={(e) => onSelectOwnership(e.target.value as OwnershipFilter)}
            className="rounded-xl border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400"
          >
            <option value="all">All Ownership</option>
            <option value="owned">Owned by Me</option>
            <option value="shared">Shared with Me</option>
          </select>

          {/* Favorites toggle */}
          <button
            onClick={onToggleFavoritesOnly}
            className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium border transition-colors ${
              favoritesOnly
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Star className={`h-3.5 w-3.5 ${favoritesOnly ? 'text-amber-400 fill-amber-400' : ''}`} />
            <span>Favorites</span>
          </button>

          {/* Sort dropdown */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-400">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => onSelectSortBy(e.target.value as SortOption)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="updated-desc">Last Modified (Newest)</option>
              <option value="updated-asc">Last Modified (Oldest)</option>
              <option value="title-asc">Title (A &rarr; Z)</option>
              <option value="title-desc">Title (Z &rarr; A)</option>
              <option value="created-desc">Created Date</option>
            </select>
          </div>
        </div>

        {/* Right side: Count & Grid/List View Toggle */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            {totalCount} {totalCount === 1 ? 'whiteboard' : 'whiteboards'}
          </span>

          <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900 p-0.5">
            <button
              onClick={() => onToggleViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-slate-800 text-lime-400 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
              aria-label="Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onToggleViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-slate-800 text-lime-400 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="List View"
              aria-label="List View"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
