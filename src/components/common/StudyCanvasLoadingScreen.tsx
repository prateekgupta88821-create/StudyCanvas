import React from 'react';

export const StudyCanvasLoadingScreen: React.FC<{ message?: string }> = ({
  message = 'Verifying secure session...',
}) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#090b0e] text-slate-100 select-none">
      {/* Background ambient glow */}
      <div 
        className="pointer-events-none absolute h-72 w-72 rounded-full bg-lime-400/10 blur-[100px]" 
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-sm">
        {/* Pulsing Brand Icon */}
        <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-lime-400/30 bg-[#12161f] shadow-xl shadow-lime-400/10">
          <img
            src="/logo.svg"
            alt="StudyCanvas"
            className="h-10 w-10 animate-pulse"
          />
          <div className="absolute -inset-1 rounded-2xl border border-lime-400/20 animate-ping opacity-30" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold tracking-tight text-white font-heading">
          Study<span className="text-lime-400">Canvas</span>
        </h2>

        {/* Status message */}
        <p className="mt-2 text-xs font-medium text-slate-400 animate-pulse">
          {message}
        </p>

        {/* Sleek horizontal progress bar */}
        <div className="mt-6 h-1 w-44 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full w-full bg-lime-400 origin-left animate-indeterminate-bar" />
        </div>
      </div>
    </div>
  );
};
