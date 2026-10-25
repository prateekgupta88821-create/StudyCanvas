import React, { useState } from 'react';
import type Konva from 'konva';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useWhiteboard } from '@/contexts/WhiteboardContext';
import { exportService } from '@/services/exportService';
import confetti from 'canvas-confetti';
import { 
  Image as ImageIcon, 
  FileCode, 
  Printer, 
  CheckCircle2
} from 'lucide-react';

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  stageRef: React.RefObject<Konva.Stage | null>;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  stageRef,
}) => {
  const { project, activePageIndex } = useWhiteboard();
  const [resolution, setResolution] = useState<number>(2); // 2x default (Retina/High-Res)
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const triggerCelebration = () => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#6366f1', '#a855f7', '#ec4899', '#38bdf8'],
    });
  };

  const handleExportPNG = () => {
    if (!stageRef.current) return;
    setIsExporting(true);
    try {
      const filename = `${project.title || 'studycanvas'}-page-${activePageIndex + 1}.png`;
      exportService.exportToPNG(stageRef.current, filename, resolution);
      setSuccessMessage('High-resolution PNG exported successfully!');
      triggerCelebration();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e: any) {
      alert('PNG export error: ' + e.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = () => {
    setIsExporting(true);
    try {
      exportService.exportToJSON(project);
      setSuccessMessage('StudyCanvas (.studycanvas) project downloaded!');
      triggerCelebration();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e: any) {
      alert('JSON export error: ' + e.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintPDF = () => {
    if (!stageRef.current) return;
    exportService.triggerPrint(stageRef.current, project.title);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Export Whiteboard Lecture"
      description="Download high-resolution image snapshots, print to PDF, or export complete multi-slide project files."
      maxWidth="max-w-lg"
    >
      <div className="space-y-4 pt-2">
        {successMessage && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Resolution selector for PNG */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
          <label className="text-xs font-semibold text-slate-300 block mb-2">
            Image Render Quality (Pixel Ratio)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: 1, label: 'Standard (1x)', desc: 'Web preview' },
              { val: 2, label: 'Retina (2x)', desc: 'Crisp / HD' },
              { val: 3, label: 'Ultra (3x)', desc: 'Print / Posters' },
            ].map((r) => (
              <button
                key={r.val}
                type="button"
                onClick={() => setResolution(r.val)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  resolution === r.val
                    ? 'border-indigo-500 bg-indigo-500/10 text-white ring-1 ring-indigo-500'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <p className="text-xs font-semibold">{r.label}</p>
                <p className="text-[10px] text-slate-500">{r.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Export options grid */}
        <div className="space-y-2">
          {/* PNG Export */}
          <button
            onClick={handleExportPNG}
            disabled={isExporting}
            className="flex w-full items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-indigo-500/40 hover:bg-slate-850 transition-colors text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-105 transition-transform">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Export as PNG Snapshot</p>
                <p className="text-[11px] text-slate-400">
                  Current slide (Slide {activePageIndex + 1}) at {resolution}x resolution
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-indigo-400 group-hover:translate-x-0.5 transition-transform">
              Download &rarr;
            </span>
          </button>

          {/* StudyCanvas JSON (.studycanvas) */}
          <button
            onClick={handleExportJSON}
            disabled={isExporting}
            className="flex w-full items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-purple-500/40 hover:bg-slate-850 transition-colors text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-105 transition-transform">
                <FileCode className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Full Project File (.studycanvas)</p>
                <p className="text-[11px] text-slate-400">
                  All {project.pages.length} slides, drawings, math formulas, and editable metadata
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-purple-400 group-hover:translate-x-0.5 transition-transform">
              Export &rarr;
            </span>
          </button>

          {/* Print / PDF */}
          <button
            onClick={handlePrintPDF}
            className="flex w-full items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-emerald-500/40 hover:bg-slate-850 transition-colors text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                <Printer className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Print / Save as PDF</p>
                <p className="text-[11px] text-slate-400">
                  Opens browser print dialog with formatted landscape page
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-emerald-400 group-hover:translate-x-0.5 transition-transform">
              Print &rarr;
            </span>
          </button>
        </div>

        <div className="pt-2 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
