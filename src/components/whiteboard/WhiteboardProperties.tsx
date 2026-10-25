import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useWhiteboard } from '@/hooks/useWhiteboard';
import { GridType } from '@/types/whiteboard';
import { 
  X, 
  Grid, 
  Type as TypeIcon, 
  StickyNote as StickyIcon, 
  Eraser as EraserIcon, 
  Paintbrush,
} from 'lucide-react';

const COLOR_PALETTE = [
  '#ffffff', // Pure White
  '#a3e635', // Electric Lime (Brand Accent)
  '#38bdf8', // Vivid Sky Blue
  '#f43f5e', // Vibrant Rose
  '#fbbf24', // Amber Glow
  '#a855f7', // Purple/Violet
  '#34d399', // Emerald Green
  '#94a3b8', // Cool Slate
];

const STROKE_WIDTHS = [2, 4, 8, 14, 20];

const STICKY_COLORS = [
  { name: 'Yellow', color: '#fef08a', text: '#713f12' },
  { name: 'Green', color: '#bbf7d0', text: '#14532d' },
  { name: 'Blue', color: '#bae6fd', text: '#0c4a6e' },
  { name: 'Purple', color: '#e9d5ff', text: '#581c87' },
  { name: 'Orange', color: '#fed7aa', text: '#7c2d12' },
  { name: 'Slate', color: '#334155', text: '#f8fafc' },
];

const FONT_FAMILIES = [
  { label: 'Sans (Inter)', value: 'Inter, sans-serif' },
  { label: 'Serif (Merriweather)', value: 'Merriweather, serif' },
  { label: 'Monospace (Code)', value: 'JetBrains Mono, monospace' },
  { label: 'Handwritten', value: 'Caveat, cursive' },
];

const FONT_SIZES = [14, 18, 24, 32, 48];

export const WhiteboardProperties: React.FC = () => {
  const { 
    tool,
    strokeColor, 
    setStrokeColor, 
    strokeWidth, 
    setStrokeWidth,
    strokeOpacity,
    setStrokeOpacity,
    fillColor,
    setFillColor,
    fontFamily,
    setFontFamily,
    fontSize,
    setFontSize,
    stickyColor,
    setStickyColor,
    eraserMode,
    setEraserMode,
    gridType,
    setGridType,
    isFocusMode,
    isPropertiesOpen,
    setIsPropertiesOpen,
  } = useWhiteboard();

  // If in focus mode or properties closed, don't show the full panel
  if (isFocusMode || !isPropertiesOpen) {
    return (
      <button
        onClick={() => setIsPropertiesOpen(true)}
        className="fixed right-3 top-20 z-40 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-[#0c1017]/90 text-slate-400 shadow-xl backdrop-blur-xl hover:text-white hover:border-slate-700 transition-all"
        title="Open Properties Panel"
      >
        <Paintbrush className="h-4 w-4" />
      </button>
    );
  }

  const grids: { type: GridType; label: string }[] = [
    { type: 'blank', label: 'Plain' },
    { type: 'dots', label: 'Dotted' },
    { type: 'grid', label: 'Grid' },
    { type: 'ruled', label: 'Lined' },
    { type: 'coordinate', label: 'Coordinate' },
  ];

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ x: 30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 30, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="fixed top-18 right-3 z-40 select-none flex flex-col gap-2 w-64 max-h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar"
      >
        <div className="rounded-2xl border border-slate-800/90 bg-[#0c1017]/95 p-3.5 shadow-2xl backdrop-blur-xl flex flex-col gap-4 text-slate-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Paintbrush className="h-3.5 w-3.5 text-lime-400" />
              <span>Inspector</span>
            </div>
            <button
              onClick={() => setIsPropertiesOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              title="Close panel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* 1. Color Palette (Drawing, Shapes, Text) */}
          {(tool === 'pen' || tool === 'highlighter' || tool === 'shape' || tool === 'text' || tool === 'select') && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">Color</span>
                <span className="text-[10px] font-mono text-slate-500 uppercase">{strokeColor}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {COLOR_PALETTE.map((color) => (
                  <button
                    key={color}
                    onClick={() => setStrokeColor(color)}
                    className={`h-7 rounded-lg transition-transform relative ${
                      strokeColor === color
                        ? 'scale-105 ring-2 ring-lime-400 ring-offset-1 ring-offset-slate-950'
                        : 'hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 2. Stroke Width & Opacity */}
          {(tool === 'pen' || tool === 'highlighter' || tool === 'shape') && (
            <div className="space-y-3 border-t border-slate-800/80 pt-3">
              {/* Width */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-medium text-slate-400">Stroke Width</span>
                  <span className="text-[10px] font-mono text-slate-400">{strokeWidth}px</span>
                </div>
                <div className="flex items-center justify-between bg-slate-950/80 rounded-xl p-1 border border-slate-800">
                  {STROKE_WIDTHS.map((width) => (
                    <button
                      key={width}
                      onClick={() => setStrokeWidth(width)}
                      className={`flex h-7 w-8 items-center justify-center rounded-lg transition-colors ${
                        strokeWidth === width
                          ? 'bg-lime-500 text-slate-950 font-bold'
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

              {/* Opacity */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-slate-400">Opacity</span>
                  <span className="text-[10px] font-mono text-slate-400">{Math.round(strokeOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={strokeOpacity}
                  onChange={(e) => setStrokeOpacity(parseFloat(e.target.value))}
                  className="w-full accent-lime-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Fill Color Toggle for Shapes */}
              {tool === 'shape' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-medium text-slate-400">Shape Fill</span>
                    <span className="text-[10px] text-slate-500">{fillColor === 'transparent' ? 'None' : 'Solid'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setFillColor('transparent')}
                      className={`py-1 rounded-lg text-xs font-medium border transition-colors ${
                        fillColor === 'transparent'
                          ? 'bg-slate-800 border-lime-400 text-lime-300'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      Transparent
                    </button>
                    <button
                      onClick={() => setFillColor(strokeColor)}
                      className={`py-1 rounded-lg text-xs font-medium border transition-colors ${
                        fillColor !== 'transparent'
                          ? 'bg-slate-800 border-lime-400 text-lime-300'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      Fill Color
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. Eraser Mode */}
          {tool === 'eraser' && (
            <div className="space-y-2 border-t border-slate-800/80 pt-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <EraserIcon className="h-3.5 w-3.5 text-lime-400" />
                <span>Eraser Type</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setEraserMode('stroke')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors ${
                    eraserMode === 'stroke'
                      ? 'bg-lime-500/10 border-lime-500 text-lime-300'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                  }`}
                >
                  Stroke Eraser
                </button>
                <button
                  onClick={() => setEraserMode('object')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors ${
                    eraserMode === 'object'
                      ? 'bg-lime-500/10 border-lime-500 text-lime-300'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                  }`}
                >
                  Object Eraser
                </button>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                {eraserMode === 'stroke' 
                  ? 'Erases individual stroke segments upon contact.' 
                  : 'Removes the entire touched shape, text, or stroke.'}
              </p>
            </div>
          )}

          {/* 4. Text Tool Properties */}
          {tool === 'text' && (
            <div className="space-y-2.5 border-t border-slate-800/80 pt-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <TypeIcon className="h-3.5 w-3.5 text-lime-400" />
                <span>Typography</span>
              </div>

              {/* Font Family */}
              <div>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-lime-500"
                >
                  {FONT_FAMILIES.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Font Size */}
              <div>
                <span className="text-[10px] font-medium text-slate-400 block mb-1">Font Size</span>
                <div className="flex items-center justify-between gap-1">
                  {FONT_SIZES.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setFontSize(sz)}
                      className={`flex-1 py-1 rounded-lg text-xs font-medium transition-colors ${
                        fontSize === sz
                          ? 'bg-lime-500 text-slate-950 font-bold'
                          : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 5. Sticky Note Color */}
          {tool === 'sticky' && (
            <div className="space-y-2 border-t border-slate-800/80 pt-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <StickyIcon className="h-3.5 w-3.5 text-lime-400" />
                <span>Note Palette</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {STICKY_COLORS.map((st) => (
                  <button
                    key={st.name}
                    onClick={() => setStickyColor(st.color)}
                    className={`py-1.5 rounded-lg text-[11px] font-semibold transition-transform ${
                      stickyColor === st.color
                        ? 'ring-2 ring-lime-400 scale-105'
                        : 'opacity-90 hover:opacity-100 hover:scale-102'
                    }`}
                    style={{ backgroundColor: st.color, color: st.text }}
                  >
                    {st.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 6. Background Grid Options */}
          <div className="space-y-2 border-t border-slate-800/80 pt-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <Grid className="h-3.5 w-3.5 text-lime-400" />
              <span>Canvas Paper / Grid</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {grids.map((g) => (
                <button
                  key={g.type}
                  onClick={() => setGridType(g.type)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors ${
                    gridType === g.type
                      ? 'bg-lime-500/10 border-lime-500 text-lime-300 font-semibold'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};
