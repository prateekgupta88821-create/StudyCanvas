import React, { useState, useMemo } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useWhiteboard } from '@/hooks/useWhiteboard';
import { FormulaElement } from '@/types/whiteboard';
import { renderLatexToHtml, renderLatexToSvgDataUrl } from '@/utils/mathRenderer';
import { Plus, Sparkles, Check } from 'lucide-react';

const PRESET_FORMULAS = [
  // Calculus
  { category: 'Calculus', title: 'Definite Integral', latex: '\\int_{a}^{b} f(x) \\, dx = F(b) - F(a)', display: 'Fundamental Theorem of Calculus' },
  { category: 'Calculus', title: 'Chain Rule', latex: '\\frac{d}{dx}[f(g(x))] = f\'(g(x)) \\cdot g\'(x)', display: 'Derivative Chain Rule' },
  { category: 'Calculus', title: 'Taylor Series', latex: 'f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!} (x-a)^n', display: 'Taylor Series Expansion' },
  { category: 'Calculus', title: 'Stokes Theorem', latex: '\\oint_{\\partial \\Sigma} \\mathbf{F} \\cdot d\\mathbf{r} = \\iint_{\\Sigma} (\\nabla \\times \\mathbf{F}) \\cdot d\\mathbf{S}', display: 'Stokes Theorem' },
  
  // Algebra & Pre-calc
  { category: 'Algebra', title: 'Quadratic Formula', latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', display: 'Roots of ax² + bx + c = 0' },
  { category: 'Algebra', title: 'Euler Identity', latex: 'e^{i\\pi} + 1 = 0', display: 'Euler Formula' },
  { category: 'Algebra', title: 'Logarithm Quotient', latex: '\\log_b\\left(\\frac{x}{y}\\right) = \\log_b(x) - \\log_b(y)', display: 'Logarithm Quotient Rule' },

  // Physics
  { category: 'Physics', title: 'Schrödinger Equation', latex: 'i\\hbar \\frac{\\partial}{\\partial t} \\Psi(\\mathbf{r}, t) = \\hat{H} \\Psi(\\mathbf{r}, t)', display: 'Quantum Wave Equation' },
  { category: 'Physics', title: 'Gravitational Force', latex: 'F = G \\frac{m_1 m_2}{r^2}', display: 'Universal Gravitation' },
  { category: 'Physics', title: 'Lorentz Factor', latex: '\\gamma = \\frac{1}{\\sqrt{1 - \\frac{v^2}{c^2}}}', display: 'Special Relativity Gamma' },
  { category: 'Physics', title: 'Maxwell Ampere', latex: '\\nabla \\times \\mathbf{B} = \\mu_0 \\mathbf{J} + \\mu_0 \\varepsilon_0 \\frac{\\partial \\mathbf{E}}{\\partial t}', display: 'Maxwell-Ampere Equation' },

  // Chemistry
  { category: 'Chemistry', title: 'Gibbs Free Energy', latex: '\\Delta G^{\\circ} = \\Delta H^{\\circ} - T\\Delta S^{\\circ}', display: 'Spontaneity Equation' },
  { category: 'Chemistry', title: 'Nernst Equation', latex: 'E = E^\\circ - \\frac{RT}{nF} \\ln Q', display: 'Cell Potential at Non-standard Conditions' },
  { category: 'Chemistry', title: 'Ideal Gas Law', latex: 'PV = nRT', display: 'Ideal Gas Law' },

  // Trigonometry & Statistics
  { category: 'Trigonometry', title: 'Pythagorean Identity', latex: '\\sin^2(\\theta) + \\cos^2(\\theta) = 1', display: 'Unit Circle Identity' },
  { category: 'Trigonometry', title: 'Angle Sum', latex: '\\sin(\\alpha + \\beta) = \\sin\\alpha\\cos\\beta + \\cos\\alpha\\sin\\beta', display: 'Sine Sum Formula' },
  { category: 'Statistics', title: 'Normal Distribution', latex: 'f(x) = \\frac{1}{\\sigma \\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}', display: 'Gaussian Bell Curve' },
];

export const MathFormulaModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { addElement, strokeColor, scale, stagePos } = useWhiteboard();
  const [latexInput, setLatexInput] = useState('\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const categories = ['All', 'Calculus', 'Algebra', 'Physics', 'Chemistry', 'Trigonometry', 'Statistics'];

  const filtered = selectedCategory === 'All'
    ? PRESET_FORMULAS
    : PRESET_FORMULAS.filter(f => f.category === selectedCategory);

  const livePreviewHtml = useMemo(() => {
    return renderLatexToHtml(latexInput.trim() || '0');
  }, [latexInput]);

  const handleStampFormula = (latex: string, displayLabel = '') => {
    const trimmed = latex.trim();
    if (!trimmed) return;

    // Place formula in current viewport center
    const centerX = (window.innerWidth / 2 - stagePos.x) / scale - 140;
    const centerY = (window.innerHeight / 2 - stagePos.y) / scale - 45;

    const svgDataUri = renderLatexToSvgDataUrl(trimmed, strokeColor || '#ffffff', 22);

    const newFormula: FormulaElement = {
      id: 'formula_' + Math.random().toString(36).substring(2, 9),
      type: 'formula',
      x: Math.max(20, centerX),
      y: Math.max(20, centerY),
      width: Math.max(220, Math.min(650, trimmed.length * 15)),
      height: 85,
      latex: trimmed,
      renderedText: displayLabel || trimmed,
      renderedSvg: svgDataUri,
      fontSize: 22,
      color: strokeColor || '#ffffff',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addElement(newFormula);
    setCopiedSuccess(true);
    setTimeout(() => {
      setCopiedSuccess(false);
      onClose();
    }, 300);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Interactive Mathematical Equation Palette"
      description="Type any LaTeX expression or stamp verified formulas for mathematics, physics, and chemistry."
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4 pt-1 text-slate-100">
        {/* Real-time KaTeX preview box */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c1017] p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-lime-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Live KaTeX Preview</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">LaTeX Render Engine</span>
          </div>

          <div 
            className="min-h-16 py-3 px-4 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-center overflow-x-auto text-lime-200 text-lg sm:text-xl font-serif"
            dangerouslySetInnerHTML={{ __html: livePreviewHtml }}
          />

          {/* LaTeX Input area */}
          <div className="mt-3 flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={latexInput}
                onChange={(e) => setLatexInput(e.target.value)}
                placeholder="Type LaTeX here... e.g. \\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-lime-400 font-mono"
              />
            </div>
            <Button
              size="sm"
              disabled={!latexInput.trim()}
              onClick={() => handleStampFormula(latexInput)}
              className="text-xs h-10 px-5 bg-lime-500 text-slate-950 font-bold hover:bg-lime-400 shrink-0"
            >
              {copiedSuccess ? <Check className="mr-1 h-4 w-4" /> : <Plus className="mr-1 h-4 w-4" />}
              {copiedSuccess ? 'Stamped!' : 'Stamp Equation'}
            </Button>
          </div>
        </div>

        {/* Category filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
                selectedCategory === cat
                  ? 'bg-lime-500 text-slate-950 font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Preset Library Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
          {filtered.map((item, idx) => (
            <div
              key={idx}
              onClick={() => {
                setLatexInput(item.latex);
                handleStampFormula(item.latex, item.title);
              }}
              className="group flex flex-col justify-between p-3 rounded-xl border border-slate-800 bg-[#0c1017] hover:border-lime-400/50 hover:bg-[#12161f] cursor-pointer transition-all shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-semibold uppercase text-lime-400 font-mono">
                    {item.category}
                  </span>
                  <span className="text-[10px] text-slate-500 group-hover:text-lime-300">
                    Click to stamp &rarr;
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-slate-200 mb-1">
                  {item.title}
                </h4>
                <div 
                  className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 text-xs text-lime-300 overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: renderLatexToHtml(item.latex, false) }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="pt-1 flex items-center justify-between border-t border-slate-800">
          <span className="text-[11px] text-slate-500 font-mono">Tip: You can move, resize, or delete equations on canvas anytime.</span>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
