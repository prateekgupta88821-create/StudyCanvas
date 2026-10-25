import React from 'react';

export const DashboardSkeleton: React.FC<{ viewMode?: 'grid' | 'list'; count?: number }> = ({
  viewMode = 'grid',
  count = 6,
}) => {
  if (viewMode === 'list') {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-900/30 p-4 animate-pulse"
          >
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <div className="h-10 w-14 rounded-xl bg-slate-800/80 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-3.5 w-48 rounded bg-slate-800" />
                <div className="h-2.5 w-28 rounded bg-slate-850" />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="h-3 w-16 rounded bg-slate-850 hidden sm:block" />
              <div className="h-3 w-20 rounded bg-slate-800" />
              <div className="h-6 w-6 rounded-lg bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-900/30 p-4 space-y-4 animate-pulse"
        >
          {/* Card preview thumbnail skeleton */}
          <div className="h-36 w-full rounded-xl bg-slate-800/70" />

          {/* Details skeleton */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 rounded bg-slate-800" />
              <div className="h-3 w-12 rounded bg-slate-850" />
            </div>
            <div className="h-4 w-3/4 rounded bg-slate-800" />
            <div className="h-2.5 w-1/2 rounded bg-slate-850" />
          </div>

          {/* Footer skeleton */}
          <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between">
            <div className="h-3 w-24 rounded bg-slate-800" />
            <div className="h-6 w-6 rounded bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
};
