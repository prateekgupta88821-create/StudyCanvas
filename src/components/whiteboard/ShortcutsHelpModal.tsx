import React from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { 
  PenTool, 
  Copy, 
  Hand 
} from 'lucide-react';

export interface ShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsHelpModal: React.FC<ShortcutsHelpModalProps> = ({ isOpen, onClose }) => {
  const toolShortcuts = [
    { key: 'V', desc: 'Select & Transform tool' },
    { key: 'H', desc: 'Pan / Hand tool (or Space + Drag)' },
    { key: 'P', desc: 'Pen (Freehand drawing)' },
    { key: 'B', desc: 'Highlighter' },
    { key: 'E', desc: 'Eraser (Stroke & Object)' },
    { key: 'S', desc: 'Geometric Shapes' },
    { key: 'T', desc: 'Text Box' },
    { key: 'N', desc: 'Sticky Note' },
    { key: 'I', desc: 'Insert Image' },
    { key: 'M', desc: 'Math Formula / LaTeX' },
    { key: 'L', desc: 'Laser Pointer' },
  ];

  const editingShortcuts = [
    { key: 'Ctrl + Z', desc: 'Undo stroke / action' },
    { key: 'Ctrl + Y', desc: 'Redo stroke / action' },
    { key: 'Ctrl + C', desc: 'Copy selected objects' },
    { key: 'Ctrl + V', desc: 'Paste copied objects' },
    { key: 'Ctrl + D', desc: 'Duplicate selected' },
    { key: 'Delete / Backspace', desc: 'Delete selected elements' },
    { key: 'Ctrl + A', desc: 'Select all elements on page' },
    { key: 'Ctrl + S', desc: 'Save project immediately' },
    { key: 'Escape', desc: 'Deselect / Cancel active tool' },
  ];

  const navigationShortcuts = [
    { key: 'Space + Drag', desc: 'Pan infinite canvas smoothly' },
    { key: 'Mouse Wheel', desc: 'Vertical / 2D pan' },
    { key: 'Ctrl + Wheel', desc: 'Zoom centered at mouse cursor' },
    { key: '+  /  -', desc: 'Zoom in / Zoom out' },
    { key: '0', desc: 'Reset zoom to 100%' },
    { key: 'F', desc: 'Toggle Focus Mode' },
    { key: '?', desc: 'Show this keyboard shortcuts guide' },
  ];

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts & Gestures"
      description="Quick reference for drawing, navigation, and productivity shortcuts."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6 pt-1 text-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tools Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-lime-400 flex items-center gap-1.5">
              <PenTool className="h-3.5 w-3.5" />
              <span>Canvas Tools</span>
            </h4>
            <div className="space-y-1.5">
              {toolShortcuts.map((s) => (
                <div key={s.key} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">{s.desc}</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] text-slate-200 font-semibold">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Editing Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-lime-400 flex items-center gap-1.5">
              <Copy className="h-3.5 w-3.5" />
              <span>Editing</span>
            </h4>
            <div className="space-y-1.5">
              {editingShortcuts.map((s) => (
                <div key={s.key} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">{s.desc}</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] text-slate-200 font-semibold">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation & Gestures Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-lime-400 flex items-center gap-1.5">
              <Hand className="h-3.5 w-3.5" />
              <span>Navigation & View</span>
            </h4>
            <div className="space-y-1.5">
              {navigationShortcuts.map((s) => (
                <div key={s.key} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">{s.desc}</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] text-slate-200 font-semibold whitespace-nowrap">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-400 flex items-center justify-between">
          <span>Tip: Hold <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-200 font-mono">Shift</kbd> while dragging selection box or shapes for multi-selection and 1:1 aspect ratio constraint.</span>
        </div>
      </div>
    </Dialog>
  );
};
