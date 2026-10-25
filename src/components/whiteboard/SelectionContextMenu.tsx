import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useWhiteboard } from '@/hooks/useWhiteboard';
import { 
  Copy, 
  Trash2, 
  ArrowUpToLine, 
  ArrowDownToLine, 
  Lock, 
  Unlock, 
  Files,
  X 
} from 'lucide-react';

export const SelectionContextMenu: React.FC = () => {
  const {
    selectedElementIds,
    activePage,
    scale,
    stagePos,
    duplicateSelected,
    copySelected,
    deleteSelected,
    bringToFront,
    sendToBack,
    toggleLockElement,
    setSelectedElementIds,
    isFocusMode,
    isPresentationMode,
  } = useWhiteboard();

  if (isFocusMode || isPresentationMode || selectedElementIds.length === 0) {
    return null;
  }

  const primaryId = selectedElementIds[0];
  const primaryElement = activePage.elements.find(el => el.id === primaryId);
  if (!primaryElement) return null;

  const isLocked = Boolean(primaryElement.isLocked);

  // Compute screen coordinates for floating context menu
  const elemX = 'x' in primaryElement ? (primaryElement.x as number) : 100;
  const elemY = 'y' in primaryElement ? (primaryElement.y as number) : 100;

  const screenX = elemX * scale + stagePos.x;
  const screenY = elemY * scale + stagePos.y - 48; // Position 48px above top of element

  // Keep within viewport bounds
  const clampedX = Math.max(16, Math.min(window.innerWidth - 320, screenX));
  const clampedY = Math.max(70, Math.min(window.innerHeight - 80, screenY));

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        style={{ left: `${clampedX}px`, top: `${clampedY}px` }}
        className="fixed z-50 select-none flex items-center gap-1 rounded-2xl border border-slate-800/90 bg-[#0c1017]/95 p-1.5 shadow-2xl backdrop-blur-xl text-slate-200"
      >
        {/* Duplicate button */}
        <button
          onClick={duplicateSelected}
          className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Duplicate (Ctrl+D)"
        >
          <Files className="h-4 w-4" />
        </button>

        {/* Copy button */}
        <button
          onClick={copySelected}
          className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Copy (Ctrl+C)"
        >
          <Copy className="h-4 w-4" />
        </button>

        <div className="h-4 w-[1px] bg-slate-800 mx-0.5" />

        {/* Bring to Front */}
        <button
          onClick={() => bringToFront(primaryId)}
          className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Bring to Front"
        >
          <ArrowUpToLine className="h-4 w-4" />
        </button>

        {/* Send to Back */}
        <button
          onClick={() => sendToBack(primaryId)}
          className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Send to Back"
        >
          <ArrowDownToLine className="h-4 w-4" />
        </button>

        <div className="h-4 w-[1px] bg-slate-800 mx-0.5" />

        {/* Lock / Unlock Toggle */}
        <button
          onClick={() => toggleLockElement(primaryId)}
          className={`h-8 w-8 rounded-xl flex items-center justify-center transition-colors ${
            isLocked
              ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
          title={isLocked ? 'Unlock element' : 'Lock element'}
        >
          {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
        </button>

        {/* Delete */}
        <button
          onClick={deleteSelected}
          className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          title="Delete (Backspace / Del)"
        >
          <Trash2 className="h-4 w-4" />
        </button>

        <div className="h-4 w-[1px] bg-slate-800 mx-0.5" />

        {/* Dismiss selection */}
        <button
          onClick={() => setSelectedElementIds([])}
          className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Deselect (Escape)"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
