import React, { useState, useRef } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useWhiteboard } from '@/hooks/useWhiteboard';
import { convertPdfToImages } from '@/services/pdfService';
import { Page, ImageElement } from '@/types/whiteboard';
import { FileUp, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export const PdfImportModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { project, loadProject, switchPage } = useWhiteboard();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMessage('Please select a valid PDF document (.pdf).');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 50MB limit. Please upload a smaller document.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    setProgressMsg('Parsing PDF document...');

    try {
      const pageImages = await convertPdfToImages(file, (current, total) => {
        setProgressMsg(`Converting page ${current} of ${total} to lecture slides...`);
      });

      if (pageImages.length === 0) {
        throw new Error('No pages were found in the uploaded PDF.');
      }

      // Convert images into project pages
      const newPages: Page[] = pageImages.map((dataUrl, idx) => {
        const imageElement: ImageElement = {
          id: 'pdf_page_img_' + Math.random().toString(36).substring(2, 9),
          type: 'image',
          src: dataUrl,
          x: 40,
          y: 40,
          width: 900,
          height: 1200,
          isLocked: true, // Lock base PDF page to prevent accidental drags
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        return {
          id: 'pdf_page_' + Math.random().toString(36).substring(2, 9),
          title: `PDF Page ${idx + 1}`,
          elements: [imageElement],
          gridType: 'blank',
          backgroundColor: '#090b0e',
          pdfBackground: dataUrl,
        };
      });

      const nextPageIndex = project.pages.length;
      loadProject({
        ...project,
        pages: [...project.pages, ...newPages],
        updatedAt: Date.now(),
      });

      switchPage(nextPageIndex);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to import PDF.');
    } finally {
      setIsLoading(false);
      setProgressMsg('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Import PDF for Lecture & Slide Annotation"
      description="Upload textbooks, exam sheets, or lecture slides. Each PDF page becomes a whiteboard slide ready for drawing."
      maxWidth="max-w-md"
    >
      <div className="space-y-4 pt-1 text-slate-100">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={handlePdfUpload}
        />

        {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Upload Zone */}
        <div
          onClick={() => !isLoading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            isLoading
              ? 'border-lime-500/50 bg-lime-500/5 cursor-wait'
              : 'border-slate-800 bg-[#0c1017] hover:border-lime-400/60 hover:bg-[#12161f]'
          }`}
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-lime-400" />
              <p className="text-xs text-slate-300 font-medium">{progressMsg}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2.5">
              <div className="p-3 rounded-2xl bg-lime-500/10 border border-lime-500/20 text-lime-400">
                <FileUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Click to upload PDF Document</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Supports multi-page PDFs up to 50MB</p>
              </div>
            </div>
          )}
        </div>

        <div className="pt-1 flex justify-end border-t border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading} className="text-xs">
            Cancel
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
