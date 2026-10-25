import React, { useState } from 'react';
import { 
  PenTool, 
  Highlighter, 
  Eraser, 
  Square, 
  Type, 
  StickyNote, 
  Sigma, 
  Flame, 
  MousePointer,
  HardDrive,
  ZoomIn,
  ZoomOut,
  Layers,
  ArrowRight
} from 'lucide-react';

export interface ProductPreviewProps {
  onOpenCanvas: () => void;
}

type SubjectTab = 'physics' | 'calculus' | 'chemistry' | 'cornell';

export const ProductPreview: React.FC<ProductPreviewProps> = ({ onOpenCanvas }) => {
  const [activeTab, setActiveTab] = useState<SubjectTab>('physics');
  const [activePreviewTool, setActivePreviewTool] = useState<string>('pen');

  return (
    <section className="relative px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto -mt-4 pb-20">
      {/* Subject switcher tabs */}
      <div className="flex items-center justify-center gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { id: 'physics' as SubjectTab, label: 'Physics Kinematics' },
          { id: 'calculus' as SubjectTab, label: 'Calculus Integrals' },
          { id: 'chemistry' as SubjectTab, label: 'Organic Chemistry' },
          { id: 'cornell' as SubjectTab, label: 'Cornell Study Notes' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all shrink-0 ${
              activeTab === tab.id
                ? 'bg-lime-400 text-slate-950 font-semibold shadow-md shadow-lime-400/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Product Window Mockup */}
      <div className="relative rounded-2xl sm:rounded-3xl border border-slate-800 bg-[#0e1116] shadow-2xl overflow-hidden">
        {/* Window Header Bar */}
        <div className="h-11 border-b border-slate-800/90 bg-[#13161c] px-4 flex items-center justify-between select-none">
          {/* Mac-style traffic lights & Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-500/80" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
            </div>

            <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-200">
                {activeTab === 'physics' && 'PHYS-201: Classical Mechanics — Projectile Trajectory'}
                {activeTab === 'calculus' && 'MATH-102: Definite Integrals & Riemann Sums'}
                {activeTab === 'chemistry' && 'CHEM-301: Benzene Ring Resonance & Electrophilic Substitution'}
                {activeTab === 'cornell' && 'BIOL-110: Cellular Respiration & ATP Cycle'}
              </span>
            </div>
          </div>

          {/* Sync Pill & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-lime-400/10 border border-lime-400/20 px-2.5 py-0.5 text-[11px] font-medium text-lime-400">
              <HardDrive className="h-3 w-3" />
              <span>Drive Synced</span>
            </div>

            <div className="flex items-center gap-1 text-slate-400 text-xs">
              <Layers className="h-3.5 w-3.5 text-lime-400" />
              <span>Slide 2 of 4</span>
            </div>

            <button
              onClick={onOpenCanvas}
              className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-lime-400 hover:text-lime-300 transition-colors ml-2"
            >
              <span>Try Live</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Whiteboard Interactive Viewport */}
        <div className="relative h-[420px] sm:h-[500px] w-full bg-[#0a0d12] bg-grid-lines overflow-hidden select-none p-6">
          {/* Subject Content 1: Physics */}
          {activeTab === 'physics' && (
            <div className="relative h-full w-full">
              {/* Coordinate Grid & Vector Curve SVG */}
              <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 800 450">
                {/* Axes */}
                <line x1="80" y1="360" x2="720" y2="360" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
                <line x1="80" y1="60" x2="80" y2="360" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
                <text x="730" y="365" fill="#94a3b8" fontSize="12" fontFamily="monospace">x (distance)</text>
                <text x="70" y="50" fill="#94a3b8" fontSize="12" fontFamily="monospace">y (height)</text>

                {/* Parabolic Trajectory */}
                <path
                  d="M 80 360 Q 320 80 620 360"
                  fill="none"
                  stroke="#a3e635"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Initial Velocity Vector */}
                <line x1="80" y1="360" x2="210" y2="230" stroke="#38bdf8" strokeWidth="2.5" markerEnd="url(#arrow)" />
                <text x="170" y="215" fill="#38bdf8" fontSize="13" fontWeight="bold" fontFamily="monospace">v₀ = 25 m/s</text>

                {/* Vector Components */}
                <line x1="80" y1="360" x2="210" y2="360" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />
                <line x1="210" y1="360" x2="210" y2="230" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />
                <text x="130" y="380" fill="#94a3b8" fontSize="11" fontFamily="monospace">v_x = v₀ cos(θ)</text>
                <text x="220" y="300" fill="#94a3b8" fontSize="11" fontFamily="monospace">v_y = v₀ sin(θ) - gt</text>

                {/* Peak Point Annotation */}
                <circle cx="350" cy="190" r="5" fill="#f43f5e" />
                <text x="360" y="185" fill="#f43f5e" fontSize="12" fontWeight="bold">Max Height (v_y = 0)</text>
              </svg>

              {/* Formula Cards */}
              <div className="absolute top-4 left-24 sm:left-28 rounded-xl border border-slate-800 bg-[#0e1217]/90 p-3 shadow-lg backdrop-blur-sm space-y-1">
                <span className="text-[10px] uppercase font-bold text-lime-400 tracking-wider">Kinematic Equations</span>
                <p className="font-mono text-xs sm:text-sm text-slate-100">
                  y(t) = y₀ + v₀ t - ½ g t²
                </p>
                <p className="font-mono text-xs sm:text-sm text-slate-300">
                  x(t) = x₀ + (v₀ cos θ) t
                </p>
              </div>

              {/* Amber Sticky Note */}
              <div className="absolute bottom-20 right-6 sm:right-16 w-48 sm:w-56 rounded-xl bg-amber-200 p-3.5 text-slate-900 shadow-xl rotate-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Professor's Note</p>
                <p className="mt-1 text-xs font-medium leading-snug">
                  Recall: horizontal acceleration a_x is always zero under ideal vacuum conditions.
                </p>
              </div>

              {/* Laser Pointer demonstration */}
              <div className="absolute top-44 left-[340px] flex items-center gap-2 pointer-events-none">
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-lime-400" />
                </span>
                <span className="bg-lime-400 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded-full shadow-md">
                  Prof. Canvas (Laser)
                </span>
              </div>
            </div>
          )}

          {/* Subject Content 2: Calculus */}
          {activeTab === 'calculus' && (
            <div className="relative h-full w-full">
              <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 800 450">
                <line x1="80" y1="360" x2="720" y2="360" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
                <line x1="80" y1="60" x2="80" y2="360" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
                {/* Curve */}
                <path d="M 120 320 C 260 220 400 120 640 180" fill="none" stroke="#a3e635" strokeWidth="3" />
                {/* Area under curve */}
                <path d="M 220 360 L 220 260 C 280 225 360 170 460 155 L 460 360 Z" fill="rgba(163, 230, 53, 0.15)" stroke="#a3e635" strokeWidth="1" strokeDasharray="3 3" />
                <text x="320" y="280" fill="#a3e635" fontSize="16" fontWeight="bold" fontFamily="monospace">∫[a, b] f(x) dx</text>
              </svg>

              <div className="absolute top-4 left-24 rounded-xl border border-slate-800 bg-[#0e1217]/90 p-3.5 shadow-lg backdrop-blur-sm space-y-1">
                <span className="text-[10px] uppercase font-bold text-lime-400 tracking-wider">Fundamental Theorem</span>
                <p className="font-mono text-sm text-slate-100">
                  ∫[a to b] f(x) dx = F(b) - F(a)
                </p>
              </div>

              <div className="absolute bottom-20 right-12 w-52 rounded-xl bg-indigo-950/80 border border-indigo-500/30 p-3 text-slate-200 shadow-xl">
                <p className="text-[10px] font-bold text-indigo-400 uppercase">Class Exercise</p>
                <p className="mt-1 text-xs leading-relaxed font-mono">
                  Evaluate: ∫[0 to 3] (3x² - 2x + 1) dx
                </p>
              </div>
            </div>
          )}

          {/* Subject Content 3: Chemistry */}
          {activeTab === 'chemistry' && (
            <div className="relative h-full w-full">
              <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 800 450">
                {/* Hexagon 1 */}
                <polygon points="260,180 310,150 360,180 360,240 310,270 260,240" fill="none" stroke="#a3e635" strokeWidth="3" />
                <circle cx="310" cy="210" r="32" fill="none" stroke="#a3e635" strokeWidth="2" strokeDasharray="6 4" />
                <text x="310" y="130" fill="#38bdf8" fontSize="14" fontWeight="bold">NO₂</text>
                <line x1="310" y1="150" x2="310" y2="135" stroke="#38bdf8" strokeWidth="2" />

                {/* Reaction Arrow */}
                <path d="M 400 210 L 480 210" stroke="#f4f4f5" strokeWidth="2" markerEnd="url(#arrow)" />
                <text x="415" y="195" fill="#94a3b8" fontSize="11">HNO₃ / H₂SO₄</text>
                <text x="425" y="235" fill="#94a3b8" fontSize="11">50°C</text>
              </svg>

              <div className="absolute top-4 left-24 rounded-xl border border-slate-800 bg-[#0e1217]/90 p-3.5 shadow-lg backdrop-blur-sm space-y-1">
                <span className="text-[10px] uppercase font-bold text-lime-400 tracking-wider">Aromatic Substitution</span>
                <p className="text-xs text-slate-200">
                  Electrophilic Nitration of Benzene using Nitronium Ion (NO₂⁺) intermediate.
                </p>
              </div>

              <div className="absolute bottom-20 right-12 w-52 rounded-xl bg-amber-200 text-slate-900 p-3 shadow-xl">
                <p className="text-[10px] font-bold text-amber-900 uppercase">Lab Caution</p>
                <p className="mt-1 text-xs">Maintain temperature under 55°C to avoid dinitration.</p>
              </div>
            </div>
          )}

          {/* Subject Content 4: Cornell Notes */}
          {activeTab === 'cornell' && (
            <div className="relative h-full w-full">
              <div className="grid grid-cols-3 h-full border border-slate-800 rounded-xl overflow-hidden bg-[#0c0f14]/80">
                {/* Cue column */}
                <div className="border-r border-slate-800 p-4 space-y-3">
                  <span className="text-[10px] font-bold uppercase text-lime-400">Recall Cues</span>
                  <div className="space-y-2 text-xs font-medium text-slate-300">
                    <p className="p-1.5 rounded bg-slate-900 border border-slate-800">1. Glycolysis Site?</p>
                    <p className="p-1.5 rounded bg-slate-900 border border-slate-800">2. Net ATP Yield?</p>
                    <p className="p-1.5 rounded bg-slate-900 border border-slate-800">3. Role of NADH?</p>
                  </div>
                </div>

                {/* Main notes column */}
                <div className="col-span-2 p-4 space-y-2.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Lecture Notes</span>
                  <ul className="text-xs text-slate-200 space-y-2 list-disc list-inside leading-relaxed">
                    <li>Glycolysis occurs in the <strong>cytosol</strong> without requiring oxygen.</li>
                    <li>Glucose (6C) is cleaved into 2 Pyruvate (3C) molecules.</li>
                    <li>Net yield per glucose: <strong>2 ATP + 2 NADH</strong>.</li>
                    <li>Substrate-level phosphorylation accounts for all ATP formed in this stage.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Floating Whiteboard Tool Palette (Interactive UI simulation) */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-2xl border border-slate-750 bg-[#141820]/95 p-1.5 shadow-2xl backdrop-blur-xl z-20">
            {[
              { id: 'select', icon: <MousePointer className="h-4 w-4" />, label: 'Select' },
              { id: 'pen', icon: <PenTool className="h-4 w-4" />, label: 'Pen' },
              { id: 'highlighter', icon: <Highlighter className="h-4 w-4" />, label: 'Highlighter' },
              { id: 'eraser', icon: <Eraser className="h-4 w-4" />, label: 'Eraser' },
              { id: 'shape', icon: <Square className="h-4 w-4" />, label: 'Shape' },
              { id: 'text', icon: <Type className="h-4 w-4" />, label: 'Text' },
              { id: 'sticky', icon: <StickyNote className="h-4 w-4" />, label: 'Sticky' },
              { id: 'formula', icon: <Sigma className="h-4 w-4" />, label: 'Formula' },
              { id: 'laser', icon: <Flame className="h-4 w-4" />, label: 'Laser' },
            ].map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActivePreviewTool(tool.id)}
                className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl transition-all ${
                  activePreviewTool === tool.id
                    ? 'bg-lime-400 text-slate-950 font-bold shadow-md shadow-lime-400/25'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
                title={tool.label}
              >
                {tool.icon}
              </button>
            ))}
          </div>

          {/* Zoom controls */}
          <div className="absolute top-4 right-4 hidden sm:flex items-center gap-1 rounded-xl border border-slate-800 bg-[#12151b]/90 p-1 text-slate-400 text-xs">
            <button className="p-1 hover:text-white" title="Zoom Out">
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="px-1 text-[11px] font-semibold text-slate-300">100%</span>
            <button className="p-1 hover:text-white" title="Zoom In">
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
