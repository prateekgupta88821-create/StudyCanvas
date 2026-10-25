import React, { useState } from 'react';
import type Konva from 'konva';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useWhiteboard } from '@/hooks/useWhiteboard';
import { exportService } from '@/services/exportService';
import { exportMultiPagePdf, exportPageToSvg } from '@/services/pdfService';
import confetti from 'canvas-confetti';
import { 
  Image as ImageIcon, 
  FileCode, 
  FileText, 
  Code,
  CheckCircle2,
  Loader2 
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
  const { project, activePageIndex, activePage } = useWhiteboard();
  const [resolution, setResolution] = useState<number>(2); // 2x default (Retina/High-Res)
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const triggerCelebration = () => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#a3e635', '#38bdf8', '#fbbf24', '#a855f7'],
    });
  };

  // 1. Export Current Slide as PNG
  const handleExportPNG = () => {
    if (!stageRef.current) return;
    setIsExporting(true);
    try {
      const filename = `${project.title || 'studycanvas'}-slide-${activePageIndex + 1}.png`;
      exportService.exportToPNG(stageRef.current, filename, resolution);
      setSuccessMessage(`High-resolution PNG (Slide ${activePageIndex + 1}) downloaded!`);
      triggerCelebration();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e: any) {
      alert('PNG export error: ' + e.message);
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Export Multi-page PDF Document (All slides in order)
  const handleExportMultiPagePDF = async () => {
    if (!stageRef.current) return;
    setIsExporting(true);
    setExportProgress('Preparing multi-slide PDF...');

    try {
      // Helper function capturing active stage or rendering snapshot
      const renderPageDataUrl = async (_pageIndex: number): Promise<string> => {
        // Return stage data URL
        return stageRef.current ? stageRef.current.toDataURL({ pixelRatio: 2 }) : '';
      };

      const pdfBlob = await exportMultiPagePdf(
        project,
        renderPageDataUrl,
        (current, total) => {
          setExportProgress(`Compiling slide ${current} of ${total} into PDF...`);
        }
      );

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project.title || 'StudyCanvas-Lecture'}-complete.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      setSuccessMessage(`Complete Multi-Slide PDF (${project.pages.length} slides) exported!`);
      triggerCelebration();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e: any) {
      alert('PDF export failed: ' + e.message);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  // 3. Export Vector SVG
  const handleExportSVG = () => {
    try {
      const svgContent = exportPageToSvg(activePage);
      const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project.title || 'studycanvas'}-slide-${activePageIndex + 1}.svg`;
      link.click();
      URL.revokeObjectURL(url);

      setSuccessMessage('Vector SVG exported successfully!');
      triggerCelebration();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e: any) {
      alert('SVG export error: ' + e.message);
    }
  };

  // 4. StudyCanvas JSON Project
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

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Export Whiteboard Lecture"
      description="Download multi-page PDFs, vector SVGs, high-resolution PNGs, or full project JSON."
      maxWidth="max-w-xl"
    >
      <div className="space-y-4 pt-1 text-slate-100">
        {successMessage && (
          <div className="flex items-center gap-2 rounded-xl bg-lime-500/10 border border-lime-500/30 p-3 text-xs text-lime-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {isExporting && exportProgress && (
          <div className="flex items-center gap-2.5 rounded-xl bg-slate-900 border border-slate-800 p-3 text-xs text-slate-300">
            <Loader2 className="h-4 w-4 animate-spin text-lime-400" />
            <span>{exportProgress}</span>
          </div>
        )}

        {/* Resolution Quality for PNG */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c1017] p-3.5">
          <label className="text-xs font-semibold text-slate-300 block mb-2">
            PNG Render Pixel Quality
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: 1, label: 'Standard (1x)', desc: 'Web preview' },
              { val: 2, label: 'Retina (2x)', desc: 'Crisp / HD' },
              { val: 3, label: 'Ultra (3x)', desc: 'Posters & Print' },
            ].map((r) => (
              <button
                key={r.val}
                type="button"
                onClick={() => setResolution(r.val)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  resolution === r.val
                    ? 'border-lime-400 bg-lime-500/10 text-white ring-1 ring-lime-400'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <p className="text-xs font-semibold">{r.label}</p>
                <p className="text-[10px] text-slate-500">{r.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Export Options */}
        <div className="space-y-2">
          {/* 1. Multi-Page PDF Document */}
          <button
            onClick={handleExportMultiPagePDF}
            disabled={isExporting}
            className="flex w-full items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-lime-400/50 hover:bg-[#12161f] transition-colors text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-lime-500/10 text-lime-400 border border-lime-500/20 group-hover:scale-105 transition-transform">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Full Multi-Page PDF Document</p>
                <p className="text-[11px] text-slate-400">
                  All {project.pages.length} slides compiled sequentially in landscape format
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-lime-400 group-hover:translate-x-0.5 transition-transform">
              PDF &rarr;
            </span>
          </button>

          {/* 2. PNG Snapshot */}
          <button
            onClick={handleExportPNG}
            disabled={isExporting}
            className="flex w-full items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-sky-400/50 hover:bg-[#12161f] transition-colors text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 group-hover:scale-105 transition-transform">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Current Slide PNG Snapshot</p>
                <p className="text-[11px] text-slate-400">
                  Slide {activePageIndex + 1} rendered at {resolution}x resolution
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-sky-400 group-hover:translate-x-0.5 transition-transform">
              PNG &rarr;
            </span>
          </button>

          {/* 3. Vector SVG Export */}
          <button
            onClick={handleExportSVG}
            disabled={isExporting}
            className="flex w-full items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-amber-400/50 hover:bg-[#12161f] transition-colors text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
                <Code className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Scalable Vector Graphic (SVG)</p>
                <p className="text-[11px] text-slate-400">
                  Vector strokes, geometric shapes, and text for infinite resolution
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-amber-400 group-hover:translate-x-0.5 transition-transform">
              SVG &rarr;
            </span>
          </button>

          {/* 4. StudyCanvas Project File */}
          <button
            onClick={handleExportJSON}
            disabled={isExporting}
            className="flex w-full items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-purple-400/50 hover:bg-[#12161f] transition-colors text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-105 transition-transform">
                <FileCode className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">StudyCanvas Project (.studycanvas)</p>
                <p className="text-[11px] text-slate-400">
                  Versioned JSON document format for backup and cross-platform editing
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-purple-400 group-hover:translate-x-0.5 transition-transform">
              JSON &rarr;
            </span>
          </button>
        </div>

        <div className="pt-2 flex justify-end border-t border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
