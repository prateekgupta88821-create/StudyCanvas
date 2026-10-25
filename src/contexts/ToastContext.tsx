import React, { createContext, useState, useCallback, useMemo } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  showToast: (options: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string, action?: { label: string; onClick: () => void }) => string;
  info: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 4500, action }: Omit<ToastItem, 'id'>) => {
      const id = 'toast_' + Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, title, message, duration, action };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const success = useCallback((message: string, title?: string) => {
    return showToast({ type: 'success', message, title });
  }, [showToast]);

  const error = useCallback((message: string, title?: string, action?: { label: string; onClick: () => void }) => {
    return showToast({ type: 'error', message, title, duration: 6000, action });
  }, [showToast]);

  const info = useCallback((message: string, title?: string) => {
    return showToast({ type: 'info', message, title });
  }, [showToast]);

  const warning = useCallback((message: string, title?: string) => {
    return showToast({ type: 'warning', message, title });
  }, [showToast]);

  const contextValue = useMemo(
    () => ({ showToast, removeToast, success, error, info, warning }),
    [showToast, removeToast, success, error, info, warning]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Toast viewport container */}
      <div
        aria-live="assertive"
        className="pointer-events-none fixed bottom-5 right-5 z-50 flex max-w-md w-full flex-col gap-2.5 px-4 sm:px-0"
      >
        {toasts.map((toast) => {
          const typeStyles = {
            success: 'border-lime-400/40 bg-[#0d120f] text-slate-100 shadow-lime-500/10',
            error: 'border-red-500/40 bg-[#170c0c] text-slate-100 shadow-red-500/10',
            info: 'border-cyan-500/40 bg-[#0a1218] text-slate-100 shadow-cyan-500/10',
            warning: 'border-amber-500/40 bg-[#161208] text-slate-100 shadow-amber-500/10',
          }[toast.type];

          const icon = {
            success: <CheckCircle2 className="h-5 w-5 text-lime-400 shrink-0 mt-0.5" />,
            error: <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />,
            info: <Info className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />,
            warning: <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />,
          }[toast.type];

          return (
            <div
              key={toast.id}
              role="alert"
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-3 duration-200 ${typeStyles}`}
            >
              {icon}
              <div className="flex-1 min-w-0 pr-1">
                {toast.title && (
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-0.5">
                    {toast.title}
                  </h4>
                )}
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {toast.message}
                </p>
                {toast.action && (
                  <button
                    type="button"
                    onClick={() => {
                      toast.action?.onClick();
                      removeToast(toast.id);
                    }}
                    className="mt-2 text-xs font-semibold text-lime-400 hover:text-lime-300 underline underline-offset-2 transition-colors"
                  >
                    {toast.action.label}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Close notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export { ToastContext };
export type { ToastContextValue };
