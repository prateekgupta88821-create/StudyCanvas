import React from 'react';
import { Button } from '@/components/ui/Button';
import { ArrowRight, HardDrive, Sparkles } from 'lucide-react';

export interface CTASectionProps {
  onContinueWithGoogle: () => void;
  onOpenCanvas: () => void;
}

export const CTASection: React.FC<CTASectionProps> = ({
  onContinueWithGoogle,
  onOpenCanvas,
}) => {
  return (
    <section className="py-20 relative bg-[#090b0e] overflow-hidden">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl border border-slate-800 bg-gradient-to-b from-[#141923] to-[#0e1218] p-8 sm:p-12 md:p-16 text-center shadow-2xl overflow-hidden">
          {/* Subtle lime glow in background */}
          <div 
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[500px] rounded-full bg-lime-400/[0.08] blur-[100px]"
            aria-hidden="true" 
          />

          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-lime-400/30 bg-lime-400/5 px-3 py-1 text-xs font-semibold text-lime-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Free to Start • No Credit Card Required</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white font-heading leading-tight">
              Ready to Upgrade Your Whiteboard Experience?
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Join professors, teachers, and ambitious students creating clearer derivations and smarter lecture notes. 
              Open an interactive session now or sync with Google Drive.
            </p>

            {/* CTAs */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="lime"
                size="lg"
                onClick={onContinueWithGoogle}
                className="w-full sm:w-auto text-sm font-semibold h-12 px-7 gap-2 shadow-lg shadow-lime-400/20"
              >
                <span>Continue with Google</span>
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Button
                variant="secondary"
                size="lg"
                onClick={onOpenCanvas}
                className="w-full sm:w-auto text-sm font-medium h-12 px-6 border-slate-700 bg-slate-900 hover:bg-slate-800"
              >
                <span>Launch Guest Canvas</span>
              </Button>
            </div>

            <div className="pt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
              <HardDrive className="h-3.5 w-3.5 text-lime-400" />
              <span>Native Google Drive integration with zero vendor lock-in</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
