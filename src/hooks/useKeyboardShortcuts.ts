import { useEffect } from 'react';
import { useWhiteboard } from '@/hooks/useWhiteboard';

export function useKeyboardShortcuts() {
  const {
    setTool,
    undo,
    redo,
    saveProject,
    deleteElement,
    selectedElementId,
    setSelectedElementId,
  } = useWhiteboard();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
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

      // Delete selected element
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
        e.preventDefault();
        deleteElement(selectedElementId);
        return;
      }

      // Escape key: deselect or switch to select tool
      if (e.key === 'Escape') {
        setSelectedElementId(null);
        setTool('select');
        return;
      }

      // Single-key tool triggers
      if (!cmdOrCtrl && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'v':
            setTool('select');
            break;
          case 'p':
            setTool('pen');
            break;
          case 'h':
            setTool('highlighter');
            break;
          case 'e':
            setTool('eraser');
            break;
          case 'r':
            setTool('shape');
            break;
          case 't':
            setTool('text');
            break;
          case 's':
            setTool('sticky');
            break;
          case 'm':
            setTool('formula');
            break;
          case 'l':
            setTool('laser');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTool, undo, redo, saveProject, deleteElement, selectedElementId, setSelectedElementId]);
}
