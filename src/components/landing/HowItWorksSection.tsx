import React from 'react';
import { LayoutGrid, PenTool, HardDrive, ArrowRight } from 'lucide-react';

export interface HowItWorksSectionProps {
  onOpenCanvas: () => void;
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ onOpenCanvas }) => {
  const steps = [
    {
      step: '01',
      icon: <LayoutGrid className="h-6 w-6 text-lime-400" />,
      title: 'Pick a Subject Template or Start Blank',
      description:
        'Launch an instant blank canvas or select an academic grid: precision coordinate graph paper for algebra, ruled lines for cursive notes, or isometric hexagons for chemistry.',
    },
    {
      step: '02',
      icon: <PenTool className="h-6 w-6 text-lime-400" />,
      title: 'Explain, Derive, and Annotate',
      description:
        'Draw smooth freehand diagrams with Catmull-Rom smoothing, stamp verified LaTeX formulas, drop color-coded sticky notes, and lead presentations with the vanishing laser pointer.',
    },
    {
      step: '03',
      icon: <HardDrive className="h-6 w-6 text-lime-400" />,
      title: 'Auto-Save to Drive & Share Notes',
      description:
        'StudyCanvas saves `.studycanvas` project files directly into your personal Google Drive. Export high-resolution PNG images or generate landscape PDF handouts for students.',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-28 relative scroll-mt-16 bg-[#090b0e] border-y border-slate-800/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-lime-400">
            Frictionless Workflow
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-heading">
            Simple, Powerful, and Ready in Seconds
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400">
            No complex installations, no clunky sign-up hoops. Start solving problems on the canvas immediately.
          </p>
        </div>

        {/* 3 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((st, idx) => (
            <div
              key={idx}
              className="relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-[#0f1217] p-8 hover:border-slate-700 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="rounded-xl bg-lime-400/10 border border-lime-400/20 p-3">
                    {st.icon}
                  </div>
                  <span className="text-3xl font-extrabold font-heading text-slate-700 group-hover:text-lime-400/50 transition-colors">
                    {st.step}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2.5 group-hover:text-lime-300 transition-colors">
                  {st.title}
                </h3>

                <p className="text-sm text-slate-400 leading-relaxed">
                  {st.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/60">
                <span className="text-xs font-semibold text-lime-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Step {idx + 1} of 3
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom prompt */}
        <div className="mt-12 text-center">
          <button
            onClick={onOpenCanvas}
            className="inline-flex items-center gap-2 text-sm font-semibold text-lime-400 hover:text-lime-300 transition-colors group"
          >
            <span>Experience the workflow yourself on an interactive canvas</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};
