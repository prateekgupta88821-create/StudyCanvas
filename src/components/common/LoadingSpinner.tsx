import React from 'react';

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; message?: string }> = ({
  size = 'md',
  message,
}) => {
  const sizeMap = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-6 text-slate-400">
      <div
        className={`${sizeMap[size]} animate-spin rounded-full border-indigo-500 border-t-transparent`}
      />
      {message && <p className="text-sm font-medium">{message}</p>}
    </div>
  );
};
