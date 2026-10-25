import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useWhiteboard } from '@/hooks/useWhiteboard';
import { GraphElement } from '@/types/whiteboard';
import { Activity, Plus, Sparkles } from 'lucide-react';

const PRESET_FUNCTIONS = [
  { name: 'Sine Wave', expr: 'sin(x)', xMin: -6.28, xMax: 6.28, yMin: -2, yMax: 2 },
  { name: 'Cosine Wave', expr: 'cos(x)', xMin: -6.28, xMax: 6.28, yMin: -2, yMax: 2 },
  { name: 'Parabola', expr: 'x^2 - 4', xMin: -5, xMax: 5, yMin: -5, yMax: 15 },
  { name: 'Cubic', expr: 'x^3 - 3*x', xMin: -3, xMax: 3, yMin: -5, yMax: 5 },
  { name: 'Linear', expr: '2*x + 1', xMin: -5, xMax: 5, yMin: -10, yMax: 10 },
  { name: 'Exponential', expr: 'exp(x)', xMin: -3, xMax: 3, yMin: -1, yMax: 10 },
  { name: 'Gaussian Bell', expr: 'exp(-x^2)', xMin: -3, xMax: 3, yMin: -0.5, yMax: 1.5 },
  { name: 'Hyperbola', expr: '1/x', xMin: -5, xMax: 5, yMin: -5, yMax: 5 },
];

export const FunctionGraphModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { addElement, scale, stagePos, strokeColor } = useWhiteboard();

  const [expression, setExpression] = useState('sin(x)');
  const [xMin, setXMin] = useState(-6.28);
  const [xMax, setXMax] = useState(6.28);
  const [yMin, setYMin] = useState(-2);
  const [yMax, setYMax] = useState(2);
  const [plotColor, setPlotColor] = useState('#a3e635');

  const handleInsertGraph = () => {
    const centerX = (window.innerWidth / 2 - stagePos.x) / scale - 180;
    const centerY = (window.innerHeight / 2 - stagePos.y) / scale - 140;

    const newGraph: GraphElement = {
      id: 'graph_' + Math.random().toString(36).substring(2, 9),
      type: 'graph',
      x: Math.max(20, centerX),
      y: Math.max(20, centerY),
      width: 360,
      height: 280,
      expression,
      label: `f(x) = ${expression}`,
      xMin,
      xMax,
      yMin,
      yMax,
      strokeColor: plotColor,
      showAxes: true,
      showGrid: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addElement(newGraph);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Function Grapher & Coordinate Plotter"
      description="Plot 2D mathematical functions, curves, and coordinates on your canvas with customizable axes."
      maxWidth="max-w-xl"
    >
      <div className="space-y-4 pt-1 text-slate-100">
        {/* Function input */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-lime-400" />
            <span>Mathematical Function Expression</span>
          </label>
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2">
            <span className="font-mono text-lime-400 font-semibold text-sm">f(x) =</span>
            <input
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="e.g. sin(x), x^2 - 4, 2*x + 1"
              className="bg-transparent text-white font-mono text-sm w-full focus:outline-none"
            />
          </div>
        </div>

        {/* Domain & Range Range Controls */}
        <div className="grid grid-cols-2 gap-3 bg-[#0c1017] p-3 rounded-2xl border border-slate-800">
          <div>
            <span className="text-[11px] font-medium text-slate-400 block mb-1">X-Domain [Min, Max]</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="any"
                value={xMin}
                onChange={(e) => setXMin(parseFloat(e.target.value) || -10)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono"
              />
              <span className="text-slate-600 text-xs">to</span>
              <input
                type="number"
                step="any"
                value={xMax}
                onChange={(e) => setXMax(parseFloat(e.target.value) || 10)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-400 block mb-1">Y-Range [Min, Max]</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="any"
                value={yMin}
                onChange={(e) => setYMin(parseFloat(e.target.value) || -10)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono"
              />
              <span className="text-slate-600 text-xs">to</span>
              <input
                type="number"
                step="any"
                value={yMax}
                onChange={(e) => setYMax(parseFloat(e.target.value) || 10)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-lime-400" />
            <span>Preset Functions</span>
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRESET_FUNCTIONS.map((p) => (
              <button
                key={p.name}
                onClick={() => {
                  setExpression(p.expr);
                  setXMin(p.xMin);
                  setXMax(p.xMax);
                  setYMin(p.yMin);
                  setYMax(p.yMax);
                }}
                className={`p-2 rounded-xl border text-left transition-colors ${
                  expression === p.expr
                    ? 'border-lime-400 bg-lime-500/10 text-lime-300'
                    : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="text-[11px] font-semibold">{p.name}</div>
                <div className="font-mono text-[10px] text-slate-400 truncate">{p.expr}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleInsertGraph}
            className="text-xs bg-lime-500 text-slate-950 font-bold hover:bg-lime-400"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Insert Graph on Canvas
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
