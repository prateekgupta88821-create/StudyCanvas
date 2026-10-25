import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useWhiteboard } from '@/hooks/useWhiteboard';
import { FormulaElement } from '@/types/whiteboard';
import { FORMULA_PRESETS } from '@/config/constants';
import { Plus } from 'lucide-react';

export const MathFormulaModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { addElement, strokeColor } = useWhiteboard();
  const [customFormula, setCustomFormula] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Calculus', 'Algebra', 'Physics', 'Trigonometry'];

  const filtered = selectedCategory === 'All'
    ? FORMULA_PRESETS
    : FORMULA_PRESETS.filter(f => f.category === selectedCategory);

  const handleStampFormula = (formulaText: string, latex = '') => {
    const newFormula: FormulaElement = {
      id: 'formula_' + Math.random().toString(36).substring(2, 9),
      type: 'formula',
      x: 350 + Math.random() * 80,
      y: 200 + Math.random() * 80,
      latex: latex || formulaText,
      renderedText: formulaText,
      fontSize: 22,
      color: strokeColor || '#ffffff',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addElement(newFormula);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Educational Formula & Equation Palette"
      description="Stamp verified scientific formulas, equations, and mathematical proofs directly onto your whiteboard."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4 pt-2">
        {/* Custom equation input */}
        <div className="rounded-2xl border border-indigo-500/30 bg-slate-950/70 p-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-indigo-400 block mb-1.5">
            Insert Custom Equation or Math Expression
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customFormula}
              onChange={(e) => setCustomFormula(e.target.value)}
              placeholder="e.g. ∫ x² dx = x³/3 + C or λ = h / p"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customFormula.trim()) {
                  handleStampFormula(customFormula.trim());
                }
              }}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            <Button
              variant="default"
              size="sm"
              disabled={!customFormula.trim()}
              onClick={() => handleStampFormula(customFormula.trim())}
              className="text-xs h-10 px-4"
            >
              <Plus className="mr-1 h-4 w-4" />
              Stamp
            </Button>
          </div>
        </div>

        {/* Category filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Preset list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
          {filtered.map((item, idx) => (
            <div
              key={idx}
              onClick={() => handleStampFormula(item.display, item.latex)}
              className="group flex flex-col justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-indigo-500/50 hover:bg-slate-850 cursor-pointer transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-semibold uppercase text-indigo-400">
                    {item.category}
                  </span>
                  <span className="text-[10px] text-slate-500 group-hover:text-indigo-300">
                    Click to Stamp &rarr;
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-slate-200 mb-1.5">
                  {item.title}
                </h4>
                <p className="font-mono text-sm text-amber-300/90 bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 break-words">
                  {item.display}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
