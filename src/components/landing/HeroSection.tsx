import React from 'react';
import { Button } from '@/components/ui/Button';
import { ArrowDown, ArrowRight, HardDrive, CheckCircle2, Shield, Layers } from 'lucide-react';

export interface HeroSectionProps {
  onGetStarted: () => void;
  onOpenCanvas: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onGetStarted,
  onOpenCanvas,
}) => {
  const handleScrollToFeatures = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.querySelector('#features');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden">
      {/* Background radial glow */}
      <div 
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[420px] w-[640px] rounded-full bg-lime-400/[0.07] blur-[120px]" 
        aria-hidden="true"
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Top Eyebrow Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-lime-400/30 bg-lime-400/5 px-3.5 py-1 text-xs font-semibold text-lime-400 mb-6">
          <span className="flex h-1.5 w-1.5 rounded-full bg-lime-400 animate-pulse" />
          <span>Educational Whiteboard for Teachers, Professors & Students</span>
        </div>

        {/* Hero Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white font-heading leading-[1.1] max-w-4xl mx-auto">
          Your Ideas Deserve an{' '}
          <span className="text-lime-400 inline-block">
            Infinite Canvas.
          </span>
        </h1>

        {/* Supporting Subtitle */}
        <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          A smarter workspace for teaching, learning, drawing, and collaboration. 
          Annotate lecture notes, illustrate complex derivations, stamp verified formulas, 
          and export high-resolution multi-page PDF documents.
        </p>

        {/* CTA Button Group */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto sm:max-w-none">
          {/* Primary CTA: Get Started Free */}
          <Button
            variant="lime"
            size="lg"
            onClick={onGetStarted}
            className="w-full sm:w-auto text-sm font-semibold h-12 px-6 gap-2.5 shadow-lg shadow-lime-400/15"
          >
            <span>Get Started Free</span>
            <ArrowRight className="h-4 w-4" />
          </Button>

          {/* Secondary CTA: Explore Features */}
          <Button
            variant="outline"
            size="lg"
            onClick={handleScrollToFeatures}
            className="w-full sm:w-auto text-sm font-medium h-12 px-6 border-slate-750 bg-[#12151a] hover:bg-slate-800 text-slate-200 gap-2"
          >
            <span>Explore Features</span>
            <ArrowDown className="h-4 w-4 text-slate-400" />
          </Button>

          {/* Instant demo */}
          <button
            onClick={onOpenCanvas}
            className="text-xs text-slate-400 hover:text-lime-400 underline-offset-4 hover:underline transition-colors py-2"
          >
            Or try interactive demo without sign in &rarr;
          </button>
        </div>

        {/* Trust Badges */}
        <div className="mt-10 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <HardDrive className="h-4 w-4 text-lime-400" />
            <span>Google Drive Native Storage</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-lime-400" />
            <span>60 FPS Konva Engine</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-lime-400" />
            <span>Private & Zero Lock-in</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-lime-400" />
            <span>Offline-First Fallback</span>
          </div>
        </div>
      </div>
    </section>
  );
};
