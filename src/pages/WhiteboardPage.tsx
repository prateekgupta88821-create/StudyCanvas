import React, { useRef, useState } from 'react';
import type Konva from 'konva';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { WhiteboardNavbar } from '@/components/whiteboard/WhiteboardNavbar';
import { WhiteboardStage } from '@/components/whiteboard/WhiteboardStage';
import { WhiteboardToolbar } from '@/components/whiteboard/WhiteboardToolbar';
import { WhiteboardProperties } from '@/components/whiteboard/WhiteboardProperties';
import { WhiteboardPageSelector } from '@/components/whiteboard/WhiteboardPageSelector';
import { MathFormulaModal } from '@/components/whiteboard/MathFormulaModal';
import { ExportModal } from '@/components/export/ExportModal';
import { SettingsModal } from '@/components/settings/SettingsModal';

export interface WhiteboardPageProps {
  onBackToDashboard: () => void;
}

export const WhiteboardPage: React.FC<WhiteboardPageProps> = ({ onBackToDashboard }) => {
  const stageRef = useRef<Konva.Stage | null>(null);

  // Activate keyboard shortcuts (v, p, h, e, r, t, s, m, l, Ctrl+Z, Ctrl+Y, Ctrl+S)
  useKeyboardShortcuts();

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPageSelectorOpen, setIsPageSelectorOpen] = useState(false);
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col select-none">
      {/* Top Navbar */}
      <WhiteboardNavbar
        onBackToDashboard={onBackToDashboard}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPageDrawer={() => setIsPageSelectorOpen(true)}
      />

      {/* Main Interactive Canvas Stage */}
      <div className="relative flex-1 w-full overflow-hidden">
        <WhiteboardStage stageRef={stageRef} />

        {/* Floating Tool Palette */}
        <WhiteboardToolbar
          onOpenFormulaModal={() => setIsFormulaModalOpen(true)}
        />

        {/* Color Swatches, Stroke Size, Grid, and Zoom Panel */}
        <WhiteboardProperties />
      </div>

      {/* Modals */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        stageRef={stageRef}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <WhiteboardPageSelector
        isOpen={isPageSelectorOpen}
        onClose={() => setIsPageSelectorOpen(false)}
      />

      <MathFormulaModal
        isOpen={isFormulaModalOpen}
        onClose={() => setIsFormulaModalOpen(false)}
      />
    </div>
  );
};
