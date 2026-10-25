import React, { useRef, useState } from 'react';
import type Konva from 'konva';
import { useWhiteboard } from '@/hooks/useWhiteboard';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { WhiteboardNavbar } from '@/components/whiteboard/WhiteboardNavbar';
import { WhiteboardStage } from '@/components/whiteboard/WhiteboardStage';
import { WhiteboardToolbar } from '@/components/whiteboard/WhiteboardToolbar';
import { WhiteboardProperties } from '@/components/whiteboard/WhiteboardProperties';
import { WhiteboardBottomBar } from '@/components/whiteboard/WhiteboardBottomBar';
import { WhiteboardPageSelector } from '@/components/whiteboard/WhiteboardPageSelector';
import { MathFormulaModal } from '@/components/whiteboard/MathFormulaModal';
import { FunctionGraphModal } from '@/components/whiteboard/FunctionGraphModal';
import { FlowchartModal } from '@/components/whiteboard/FlowchartModal';
import { MindmapModal } from '@/components/whiteboard/MindmapModal';
import { TableModal } from '@/components/whiteboard/TableModal';
import { ImageCropModal } from '@/components/whiteboard/ImageCropModal';
import { PdfImportModal } from '@/components/whiteboard/PdfImportModal';
import { TemplateSelectorModal } from '@/components/whiteboard/TemplateSelectorModal';
import { SelectionContextMenu } from '@/components/whiteboard/SelectionContextMenu';
import { PresentationMode } from '@/components/whiteboard/PresentationMode';
import { ShortcutsHelpModal } from '@/components/whiteboard/ShortcutsHelpModal';
import { ExportModal } from '@/components/export/ExportModal';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { RecoveryDialog } from '@/components/whiteboard/RecoveryDialog';
import { ConflictResolutionModal } from '@/components/whiteboard/ConflictResolutionModal';
import { AuthExpiredModal } from '@/components/whiteboard/AuthExpiredModal';
import { VersionHistoryModal } from '@/components/whiteboard/VersionHistoryModal';

export interface WhiteboardPageProps {
  onBackToDashboard: () => void;
}

export const WhiteboardPage: React.FC<WhiteboardPageProps> = ({ onBackToDashboard }) => {
  const stageRef = useRef<Konva.Stage | null>(null);

  const {
    recoveryDraft,
    restoreRecoveryDraft,
    discardRecoveryDraft,
    conflictInfo,
    resolveConflictKeepLocal,
    resolveConflictLoadRemote,
    resolveConflictSaveCopy,
    isAuthExpiredOpen,
    reconnectDrive,
    dismissAuthExpired,
  } = useWhiteboard();

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPageSelectorOpen, setIsPageSelectorOpen] = useState(false);
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);
  const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);
  const [isFlowchartModalOpen, setIsFlowchartModalOpen] = useState(false);
  const [isMindmapModalOpen, setIsMindmapModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isImageCropModalOpen, setIsImageCropModalOpen] = useState(false);
  const [isPdfImportOpen, setIsPdfImportOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);

  // Activate all keyboard shortcuts including ?, M, G, I, F, F5, Ctrl+Z, Ctrl+Y, Ctrl+C, Ctrl+V, etc.
  useKeyboardShortcuts({
    onOpenShortcuts: () => setIsShortcutsOpen(true),
    onOpenFormulaModal: () => setIsFormulaModalOpen(true),
    onOpenGraphModal: () => setIsGraphModalOpen(true),
    onOpenImageUpload: () => setIsImageCropModalOpen(true),
  });

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#090b0e] text-slate-100 flex flex-col select-none">
      {/* Top Navbar */}
      <WhiteboardNavbar
        onBackToDashboard={onBackToDashboard}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPageDrawer={() => setIsPageSelectorOpen(true)}
        onOpenTemplatesModal={() => setIsTemplatesOpen(true)}
        onOpenVersionHistory={() => setIsVersionHistoryOpen(true)}
      />

      {/* Main Interactive Canvas Stage */}
      <div className="relative flex-1 w-full overflow-hidden">
        <WhiteboardStage stageRef={stageRef} />

        {/* Floating Tool Palette (Left) */}
        <WhiteboardToolbar
          onOpenFormulaModal={() => setIsFormulaModalOpen(true)}
          onOpenGraphModal={() => setIsGraphModalOpen(true)}
          onOpenTableModal={() => setIsTableModalOpen(true)}
          onOpenFlowchartModal={() => setIsFlowchartModalOpen(true)}
          onOpenMindmapModal={() => setIsMindmapModalOpen(true)}
          onOpenPdfImportModal={() => setIsPdfImportOpen(true)}
          onOpenTemplatesModal={() => setIsTemplatesOpen(true)}
          onOpenImageCropModal={() => setIsImageCropModalOpen(true)}
        />

        {/* Inspector / Properties Panel (Right) */}
        <WhiteboardProperties />

        {/* Selection Context Menu (Floating directly above active selected object) */}
        <SelectionContextMenu />

        {/* Bottom Bar Controls (Zoom, Pan, Page Navigation, Shortcuts) */}
        <WhiteboardBottomBar
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
        />
      </div>

      {/* Presentation Mode Overlay */}
      <PresentationMode />

      {/* Educational & Utility Modals */}
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

      <FunctionGraphModal
        isOpen={isGraphModalOpen}
        onClose={() => setIsGraphModalOpen(false)}
      />

      <FlowchartModal
        isOpen={isFlowchartModalOpen}
        onClose={() => setIsFlowchartModalOpen(false)}
      />

      <MindmapModal
        isOpen={isMindmapModalOpen}
        onClose={() => setIsMindmapModalOpen(false)}
      />

      <TableModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
      />

      <ImageCropModal
        isOpen={isImageCropModalOpen}
        onClose={() => setIsImageCropModalOpen(false)}
      />

      <PdfImportModal
        isOpen={isPdfImportOpen}
        onClose={() => setIsPdfImportOpen(false)}
      />

      <TemplateSelectorModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
      />

      <ShortcutsHelpModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Persistence: Recovery for unsaved work after crash / refresh */}
      <RecoveryDialog
        isOpen={Boolean(recoveryDraft)}
        draft={recoveryDraft}
        onRestore={restoreRecoveryDraft}
        onDiscard={discardRecoveryDraft}
      />

      {/* Persistence: Conflict resolution for multi-tab / multi-device concurrency */}
      <ConflictResolutionModal
        isOpen={Boolean(conflictInfo)}
        conflict={conflictInfo}
        onKeepLocal={resolveConflictKeepLocal}
        onLoadRemote={resolveConflictLoadRemote}
        onSaveCopy={resolveConflictSaveCopy}
      />

      {/* Persistence: Google Drive token expired modal with zero data loss guarantee */}
      <AuthExpiredModal
        isOpen={isAuthExpiredOpen}
        isReconnecting={false}
        onReconnect={reconnectDrive}
        onDismiss={dismissAuthExpired}
      />

      {/* Persistence: Google Drive Version History & Revision Recovery */}
      <VersionHistoryModal
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
      />
    </div>
  );
};
