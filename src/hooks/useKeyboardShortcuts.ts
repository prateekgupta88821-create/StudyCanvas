import { useEffect } from 'react';
import { useWhiteboard } from '@/hooks/useWhiteboard';

export interface UseKeyboardShortcutsOptions {
  onOpenShortcuts?: () => void;
  onOpenImageUpload?: () => void;
  onOpenFormulaModal?: () => void;
  onOpenGraphModal?: () => void;
}

export function useKeyboardShortcuts(options?: UseKeyboardShortcutsOptions) {
  const {
    setTool,
    undo,
    redo,
    saveProject,
    deleteSelected,
    duplicateSelected,
    copySelected,
    pasteSelected,
    selectAll,
    setSelectedElementIds,
    zoomIn,
    zoomOut,
    resetZoom,
    setIsFocusMode,
    setIsPresentationMode,
  } = useWhiteboard();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in an input, textarea, or contentEditable element
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable
      ) {
        return;
      }

      const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Undo: Ctrl/Cmd + Z
      if (cmdOrCtrl && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z
      if ((cmdOrCtrl && e.key.toLowerCase() === 'y') || (cmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        redo();
        return;
      }

      // Save: Ctrl/Cmd + S
      if (cmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveProject();
        return;
      }

      // Copy: Ctrl/Cmd + C
      if (cmdOrCtrl && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copySelected();
        return;
      }

      // Paste: Ctrl/Cmd + V
      if (cmdOrCtrl && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        pasteSelected();
        return;
      }

      // Duplicate: Ctrl/Cmd + D
      if (cmdOrCtrl && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSelected();
        return;
      }

      // Select All: Ctrl/Cmd + A
      if (cmdOrCtrl && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        selectAll();
        return;
      }

      // Delete selected elements
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected();
        return;
      }

      // Escape key: deselect elements or switch back to select tool
      if (e.key === 'Escape') {
        setSelectedElementIds([]);
        setTool('select');
        return;
      }

      // Zoom shortcuts: + / = to zoom in, - to zoom out, 0 to reset
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        zoomIn();
        return;
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        zoomOut();
        return;
      }
      if (e.key === '0') {
        e.preventDefault();
        resetZoom();
        return;
      }

      // Focus Mode toggle: F key
      if (!cmdOrCtrl && !e.altKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsFocusMode((prev) => !prev);
        return;
      }

      // Shortcuts modal trigger: ? or Shift + /
      if (e.key === '?' && options?.onOpenShortcuts) {
        e.preventDefault();
        options.onOpenShortcuts();
        return;
      }

      // Presentation Mode: F5 or Shift + P
      if ((e.shiftKey && e.key.toLowerCase() === 'p') || e.key === 'F5') {
        e.preventDefault();
        setIsPresentationMode(true);
        return;
      }

      // Single-key tool triggers
      if (!cmdOrCtrl && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'v':
            setTool('select');
            break;
          case 'h':
            setTool('pan');
            break;
          case 'p':
            setTool('pen');
            break;
          case 'b':
            setTool('highlighter');
            break;
          case 'e':
            setTool('eraser');
            break;
          case 's':
            setTool('shape');
            break;
          case 't':
            setTool('text');
            break;
          case 'n':
            setTool('sticky');
            break;
          case 'g':
            if (options?.onOpenGraphModal) {
              options.onOpenGraphModal();
            }
            break;
          case 'i':
            if (options?.onOpenImageUpload) {
              options.onOpenImageUpload();
            } else {
              setTool('image');
            }
            break;
          case 'm':
            if (options?.onOpenFormulaModal) {
              options.onOpenFormulaModal();
            } else {
              setTool('formula');
            }
            break;
          case 'l':
            setTool('laser');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    setTool, 
    undo, 
    redo, 
    saveProject, 
    deleteSelected, 
    duplicateSelected, 
    copySelected, 
    pasteSelected, 
    selectAll, 
    setSelectedElementIds,
    zoomIn,
    zoomOut,
    resetZoom,
    setIsFocusMode,
    setIsPresentationMode,
    options,
  ]);
}
