import React from 'react';
import { useWhiteboard } from '@/contexts/WhiteboardContext';
import { GridType } from '@/types/whiteboard';
import { ZoomIn, ZoomOut } from 'lucide-react';

const COLOR_PALETTE = [
  '#ffffff', // White
  '#6366f1', // Indigo (Primary)
  '#38bdf8', // Sky Blue
  '#34d399', // Emerald
  '#fbbf24', // Amber
  '#f43f5e', // Rose Red
  '#a855f7', // Violet
  '#94a3b8', // Slate Gray
];

const STROKE_WIDTHS = [2, 4, 8, 14, 20];

export const WhiteboardProperties: React.FC = () => {
  const { 
    strokeColor, 
    setStrokeColor, 
    strokeWidth, 
    setStrokeWidth,
    gridType,
    setGridType,
    scale,
    setScale,
    setStagePos,
    tool
  } = useWhiteboard();

  const handleZoom = (delta: number) => {
    setScale((prev) => Math.min(Math.max(0.2, prev + delta), 4));
  };

  const handleResetZoom = () => {
    setScale(1);
    setStagePos({ x: 0, y: 0 });
  };

  const grids: { type: GridType; label: string }[] = [
    { type: 'blank', label: 'Blank' },
    { type: 'dots', label: 'Dots' },
    { type: 'grid', label: 'Math' },
    { type: 'ruled', label: 'Ruled' },
    { type: 'isometric', label: 'Iso' },
  ];

  return (
    <div className="fixed top-20 right-4 z-40 select-none flex flex-col gap-2">
      {/* Stroke Color & Size Panel (visible when drawing) */}
      {(tool === 'pen' || tool === 'highlighter' || tool === 'shape' || tool === 'text') && (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/90 p-2.5 shadow-xl backdrop-blur-xl space-y-3 w-40">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Color
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  onClick={() => setStrokeColor(color)}
                  className={`h-6 w-6 rounded-lg transition-transform ${
                    strokeColor === color
                      ? 'scale-110 ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Stroke Width
            </span>
            <div className="flex items-center justify-between bg-slate-950/60 rounded-xl p-1 border border-slate-800">
              {STROKE_WIDTHS.map((width) => (
                <button
                  key={width}
                  onClick={() => setStrokeWidth(width)}
                  className={`flex h-7 w-6 items-center justify-center rounded-lg transition-colors ${
                    strokeWidth === width
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span
                    className="rounded-full bg-current"
                    style={{
                      width: Math.min(width, 10),
                      height: Math.min(width, 10),
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grid Switcher & Zoom Controls */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/90 p-2 shadow-xl backdrop-blur-xl flex flex-col gap-2 w-40">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1 px-1">
            Background Grid
          </span>
          <div className="grid grid-cols-3 gap-1">
            {grids.map((g) => (
              <button
                key={g.type}
                onClick={() => setGridType(g.type)}
                className={`py-1 rounded-lg text-[10px] font-medium transition-colors ${
                  gridType === g.type
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-950/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-800 pt-2 flex items-center justify-between px-1">
          <button
            onClick={() => handleZoom(-0.15)}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="text-[11px] font-semibold text-slate-300 hover:text-indigo-400 transition-colors"
            title="Reset Zoom to 100%"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            onClick={() => handleZoom(0.15)}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
