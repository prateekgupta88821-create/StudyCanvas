import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { ShieldCheck } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export interface FooterProps {
  onOpenCanvas: () => void;
  onSignIn: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenCanvas, onSignIn }) => {
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);

  const handleScrollTo = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const elem = document.querySelector(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="border-t border-slate-800 bg-[#07090c] text-slate-400 text-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand info column */}
          <div className="col-span-2 space-y-4">
            <a href="#" className="flex items-center gap-2 group">
              <img src="/logo.svg" alt="StudyCanvas" className="h-7 w-7" />
              <span className="text-base font-bold text-white font-heading">
                StudyCanvas
              </span>
            </a>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              The high-performance educational whiteboard for school teachers, college professors, and students. 
              Built with React, Konva.js, and native Google Drive sync.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="inline-block h-2 w-2 rounded-full bg-lime-400 animate-pulse" />
              <span className="text-[11px] text-slate-400">All systems operational • Vercel Edge</span>
            </div>
          </div>

          {/* Product links */}
          <div className="space-y-3">
            <p className="font-semibold uppercase tracking-wider text-slate-200 text-[11px]">
              Platform
            </p>
            <ul className="space-y-2">
              <li>
                <a
                  href="#features"
                  onClick={(e) => handleScrollTo(e, '#features')}
                  className="hover:text-lime-400 transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  onClick={(e) => handleScrollTo(e, '#how-it-works')}
                  className="hover:text-lime-400 transition-colors"
                >
                  How It Works
                </a>
              </li>
              <li>
                <button
                  onClick={onOpenCanvas}
                  className="hover:text-lime-400 transition-colors text-left"
                >
                  Interactive Canvas
                </button>
              </li>
              <li>
                <button
                  onClick={onSignIn}
                  className="hover:text-lime-400 transition-colors text-left"
                >
                  Google Drive Sync
                </button>
              </li>
            </ul>
          </div>

          {/* Academic Roles */}
          <div className="space-y-3">
            <p className="font-semibold uppercase tracking-wider text-slate-200 text-[11px]">
              Academia
            </p>
            <ul className="space-y-2">
              <li>
                <a
                  href="#educators"
                  onClick={(e) => handleScrollTo(e, '#educators')}
                  className="hover:text-lime-400 transition-colors"
                >
                  For School Teachers
                </a>
              </li>
              <li>
                <a
                  href="#professors"
                  onClick={(e) => handleScrollTo(e, '#professors')}
                  className="hover:text-lime-400 transition-colors"
                >
                  For College Professors
                </a>
              </li>
              <li>
                <a
                  href="#students"
                  onClick={(e) => handleScrollTo(e, '#students')}
                  className="hover:text-lime-400 transition-colors"
                >
                  For Students & Scholars
                </a>
              </li>
              <li>
                <button
                  onClick={onOpenCanvas}
                  className="hover:text-lime-400 transition-colors text-left"
                >
                  LaTeX Equation Palette
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Privacy */}
          <div className="space-y-3">
            <p className="font-semibold uppercase tracking-wider text-slate-200 text-[11px]">
              Trust & Security
            </p>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setLegalModal('privacy')}
                  className="hover:text-lime-400 transition-colors text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => setLegalModal('terms')}
                  className="hover:text-lime-400 transition-colors text-left"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => setLegalModal('privacy')}
                  className="hover:text-lime-400 transition-colors text-left"
                >
                  Google Drive Permissions
                </button>
              </li>
              <li>
                <span className="text-slate-500">v1.0.0 Production</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {CURRENT_YEAR} StudyCanvas. Engineered for modern educators and students.</p>
          <p>Protected by standard Google Cloud & Firebase enterprise encryption.</p>
        </div>
      </div>

      {/* Privacy Policy Dialog */}
      <Dialog
        isOpen={legalModal === 'privacy'}
        onClose={() => setLegalModal(null)}
        title="StudyCanvas Privacy & Google Drive Policy"
        description="Transparent breakdown of how your whiteboard data and files are safeguarded."
        maxWidth="max-w-xl"
      >
        <div className="space-y-3 text-xs text-slate-300 pt-2 leading-relaxed">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-lime-400/5 border border-lime-400/20 text-slate-200">
            <ShieldCheck className="h-5 w-5 text-lime-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Google Drive Private Scope</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                StudyCanvas only requests the <code className="text-lime-400">drive.file</code> scope. It can only see and edit files created directly within StudyCanvas, and has zero access to your existing Google Drive documents or photos.
              </p>
            </div>
          </div>
          <p>
            <strong>Data Ownership:</strong> You retain complete, unrestricted ownership of all whiteboard strokes, equations, diagrams, and exported files. We never sell student or faculty data.
          </p>
          <p>
            <strong>Local Offline Mode:</strong> If you use StudyCanvas without signing in, all drawings are saved locally in your browser storage and never touch any server.
          </p>
          <div className="pt-2 flex justify-end">
            <Button size="sm" variant="lime" onClick={() => setLegalModal(null)}>
              Understood
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Terms Dialog */}
      <Dialog
        isOpen={legalModal === 'terms'}
        onClose={() => setLegalModal(null)}
        title="Terms of Service"
        description="Standard guidelines for using StudyCanvas in schools, universities, and self-study."
        maxWidth="max-w-xl"
      >
        <div className="space-y-3 text-xs text-slate-300 pt-2 leading-relaxed">
          <p>
            <strong>1. Permitted Use:</strong> StudyCanvas is provided for educational whiteboard presentation, lecture note-taking, tutoring, and collaborative academic study.
          </p>
          <p>
            <strong>2. Google Integration:</strong> Use of Google Sign-In and Google Drive sync is subject to Google's standard Terms of Service and API acceptable use policies.
          </p>
          <p>
            <strong>3. Availability:</strong> The service is designed for high reliability on Vercel and Firebase infrastructure with offline local fallback.
          </p>
          <div className="pt-2 flex justify-end">
            <Button size="sm" variant="lime" onClick={() => setLegalModal(null)}>
              Close
            </Button>
          </div>
        </div>
      </Dialog>
    </footer>
  );
};
