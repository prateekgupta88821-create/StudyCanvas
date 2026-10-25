import React from 'react';
import { GraduationCap, BookOpen, Award, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface PersonaBenefitsProps {
  onOpenCanvas: () => void;
  onSignIn: () => void;
}

export const PersonaBenefits: React.FC<PersonaBenefitsProps> = ({
  onOpenCanvas,
  onSignIn,
}) => {
  const personas = [
    {
      id: 'educators',
      role: 'School Teachers',
      tag: 'K-12 & Secondary Education',
      icon: <GraduationCap className="h-6 w-6 text-lime-400" />,
      tagline: 'Engage classrooms with an intuitive, mess-free blackboard.',
      benefits: [
        'Replace clunky physical whiteboards with smooth digital ink',
        'Organize lessons into multi-slide presentations without erasing',
        'Quick geometric shapes and colored pens for visual engagement',
        'Export clean PDF worksheets and lecture notes directly to parents and students',
      ],
      ctaText: 'Start Teaching with Canvas',
      action: onOpenCanvas,
    },
    {
      id: 'professors',
      role: 'College Professors',
      tag: 'Universities & Research Labs',
      icon: <Award className="h-6 w-6 text-lime-400" />,
      tagline: 'High-precision derivations, proofs, and vector physics.',
      benefits: [
        'Sub-millisecond drawing latency for rapid blackboard equations',
        'Verified LaTeX formula stamper for Calculus, Physics, and Engineering',
        'Vanishing laser pointer engineered for lecture hall projectors and Zoom',
        'Save lecture files directly to Google Drive without enterprise vendor lock-in',
      ],
      ctaText: 'Prepare Lecture Decks',
      action: onOpenCanvas,
    },
    {
      id: 'students',
      role: 'Students & Scholars',
      tag: 'Self-Study & Problem Solving',
      icon: <BookOpen className="h-6 w-6 text-lime-400" />,
      tagline: 'Master complex concepts with structured study notebooks.',
      benefits: [
        'Structured Cornell note-taking template with instant cue columns',
        'Infinite workspace for solving multi-step physics and calculus problems',
        'Organize notebooks by subject (Math, Physics, Chemistry, Biology)',
        'Access your saved study boards anywhere directly through Google Drive',
      ],
      ctaText: 'Start Studying Now',
      action: onSignIn,
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-[#0a0c10] relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-lime-400">
            Tailored Experiences
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-heading">
            Built for Every Stage of Academic Discovery
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400">
            Whether presenting to three hundred students in an amphitheater or working through calculus problems late at night.
          </p>
        </div>

        {/* Persona Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {personas.map((p) => (
            <div
              key={p.role}
              id={p.id}
              className="scroll-mt-24 flex flex-col justify-between rounded-3xl border border-slate-800 bg-[#10141a] p-8 hover:border-lime-400/30 transition-all group"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="rounded-2xl bg-lime-400/10 border border-lime-400/20 p-3">
                    {p.icon}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full">
                    {p.tag}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-lime-300 transition-colors">
                  {p.role}
                </h3>
                <p className="text-xs text-slate-400 font-medium mb-6">
                  {p.tagline}
                </p>

                {/* Benefits List */}
                <ul className="space-y-3 pt-2 border-t border-slate-800/80">
                  {p.benefits.map((b, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                      <CheckCircle2 className="h-4 w-4 text-lime-400 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-6 border-t border-slate-800/60">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={p.action}
                  className="w-full text-xs font-semibold bg-slate-900 hover:bg-lime-400 hover:text-slate-950 transition-colors border-slate-750"
                >
                  {p.ctaText}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
