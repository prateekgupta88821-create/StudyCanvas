import React, { createContext, useState, useCallback, useMemo } from 'react';
import { 
  WhiteboardProject, 
  Page, 
  CanvasElement, 
  ToolType, 
  ShapeType, 
  GridType 
} from '@/types/whiteboard';
import { firestoreService } from '@/services/firestoreService';
import { googleDriveService } from '@/services/googleDriveService';
import { useAuth } from '@/hooks/useAuth';
import { storage } from '@/utils/storage';

export interface WhiteboardContextType {
  project: WhiteboardProject;
  activePage: Page;
  activePageIndex: number;
  tool: ToolType;
  shapeType: ShapeType;
  strokeColor: string;
  strokeWidth: number;
  gridType: GridType;
  scale: number;
  stagePos: { x: number; y: number };
  canUndo: boolean;
  canRedo: boolean;
  isSaving: boolean;
  isSyncingDrive: boolean;
  laserPos: { x: number; y: number } | null;
  selectedElementId: string | null;

  setTool: (tool: ToolType) => void;
  setShapeType: (shape: ShapeType) => void;
  setStrokeColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setGridType: (grid: GridType) => void;
  setScale: (scale: number | ((prev: number) => number)) => void;
  setStagePos: (pos: { x: number; y: number }) => void;
  setLaserPos: (pos: { x: number; y: number } | null) => void;
  setSelectedElementId: (id: string | null) => void;

  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  clearPage: () => void;

  addPage: (title?: string) => void;
  switchPage: (index: number) => void;
  deletePage: (index: number) => void;

  undo: () => void;
  redo: () => void;

  saveProject: () => Promise<void>;
  syncToDrive: () => Promise<{ fileId: string; webViewLink?: string } | null>;
  loadProject: (project: WhiteboardProject) => void;
  updateTitle: (title: string) => void;
}

const defaultInitialPage: Page = {
  id: 'page-1',
  title: 'Page 1',
  elements: [],
  gridType: 'dots',
  backgroundColor: '#090d16',
};

const createDefaultProject = (title = 'New Educational Canvas', ownerId = 'guest'): WhiteboardProject => ({
  id: 'canvas_' + Math.random().toString(36).substring(2, 9),
  title,
  subject: 'General Science & Math',
  tags: ['Lecture', 'Notes'],
  ownerId,
  pages: [defaultInitialPage],
  activePageIndex: 0,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  version: 1,
});

const WhiteboardContext = createContext<WhiteboardContextType | undefined>(undefined);

export const WhiteboardProvider: React.FC<{
  initialProject?: WhiteboardProject;
  children: React.ReactNode;
}> = ({ initialProject, children }) => {
  const { user, driveAccessToken } = useAuth();
  
  const [project, setProject] = useState<WhiteboardProject>(() => {
    return initialProject || createDefaultProject('Calculus & Mechanics Notes', user?.uid || 'guest');
  });

  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [tool, setTool] = useState<ToolType>('pen');
  const [shapeType, setShapeType] = useState<ShapeType>('rectangle');
  const [strokeColor, setStrokeColor] = useState<string>('#6366f1');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [scale, setScale] = useState<number>(1);
  const [stagePos, setStagePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [laserPos, setLaserPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Undo / Redo history stacks for the active page elements
  const [undoStack, setUndoStack] = useState<CanvasElement[][]>([]);
  const [redoStack, setRedoStack] = useState<CanvasElement[][]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);

  const activePage = project.pages[activePageIndex] || project.pages[0] || defaultInitialPage;
  const gridType = activePage.gridType || 'dots';

  const pushToHistory = useCallback((currentElements: CanvasElement[]) => {
    setUndoStack(prev => [...prev.slice(-30), currentElements]);
    setRedoStack([]);
  }, []);

  const addElement = useCallback((element: CanvasElement) => {
    setProject(prev => {
      const currentElements = prev.pages[activePageIndex]?.elements || [];
      pushToHistory(currentElements);

      const updatedPages = [...prev.pages];
      updatedPages[activePageIndex] = {
        ...updatedPages[activePageIndex],
        elements: [...currentElements, element],
      };

      const updatedProject = {
        ...prev,
        pages: updatedPages,
        updatedAt: Date.now(),
      };
      storage.saveProject(updatedProject);
      return updatedProject;
    });
  }, [activePageIndex, pushToHistory]);

  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setProject(prev => {
      const currentElements = prev.pages[activePageIndex]?.elements || [];
      const updatedElements = currentElements.map(el => 
        el.id === id ? ({ ...el, ...updates, updatedAt: Date.now() } as CanvasElement) : el
      );

      const updatedPages = [...prev.pages];
      updatedPages[activePageIndex] = {
        ...updatedPages[activePageIndex],
        elements: updatedElements,
      };

      const updatedProject = {
        ...prev,
        pages: updatedPages,
        updatedAt: Date.now(),
      };
      storage.saveProject(updatedProject);
      return updatedProject;
    });
  }, [activePageIndex]);

  const deleteElement = useCallback((id: string) => {
    setProject(prev => {
      const currentElements = prev.pages[activePageIndex]?.elements || [];
      pushToHistory(currentElements);

      const updatedPages = [...prev.pages];
      updatedPages[activePageIndex] = {
        ...updatedPages[activePageIndex],
        elements: currentElements.filter(el => el.id !== id),
      };

      const updatedProject = {
        ...prev,
        pages: updatedPages,
        updatedAt: Date.now(),
      };
      storage.saveProject(updatedProject);
      return updatedProject;
    });
    if (selectedElementId === id) setSelectedElementId(null);
  }, [activePageIndex, pushToHistory, selectedElementId]);

  const clearPage = useCallback(() => {
    setProject(prev => {
      const currentElements = prev.pages[activePageIndex]?.elements || [];
      if (currentElements.length === 0) return prev;
      pushToHistory(currentElements);

      const updatedPages = [...prev.pages];
      updatedPages[activePageIndex] = {
        ...updatedPages[activePageIndex],
        elements: [],
      };

      const updated = { ...prev, pages: updatedPages, updatedAt: Date.now() };
      storage.saveProject(updated);
      return updated;
    });
  }, [activePageIndex, pushToHistory]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);

    setProject(prev => {
      const currentElements = prev.pages[activePageIndex]?.elements || [];
      setRedoStack(r => [...r, currentElements]);

      const updatedPages = [...prev.pages];
      updatedPages[activePageIndex] = {
        ...updatedPages[activePageIndex],
        elements: previous,
      };

      const updated = { ...prev, pages: updatedPages, updatedAt: Date.now() };
      storage.saveProject(updated);
      return updated;
    });
    setUndoStack(newUndoStack);
  }, [undoStack, activePageIndex]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);

    setProject(prev => {
      const currentElements = prev.pages[activePageIndex]?.elements || [];
      setUndoStack(u => [...u, currentElements]);

      const updatedPages = [...prev.pages];
      updatedPages[activePageIndex] = {
        ...updatedPages[activePageIndex],
        elements: next,
      };

      const updated = { ...prev, pages: updatedPages, updatedAt: Date.now() };
      storage.saveProject(updated);
      return updated;
    });
    setRedoStack(newRedoStack);
  }, [redoStack, activePageIndex]);

  const setGridType = useCallback((newGrid: GridType) => {
    setProject(prev => {
      const updatedPages = [...prev.pages];
      updatedPages[activePageIndex] = {
        ...updatedPages[activePageIndex],
        gridType: newGrid,
      };
      const updated = { ...prev, pages: updatedPages, updatedAt: Date.now() };
      storage.saveProject(updated);
      return updated;
    });
  }, [activePageIndex]);

  const addPage = useCallback((title?: string) => {
    setProject(prev => {
      const newPageNumber = prev.pages.length + 1;
      const newPage: Page = {
        id: 'page-' + Math.random().toString(36).substring(2, 8),
        title: title || `Slide ${newPageNumber}`,
        elements: [],
        gridType: prev.pages[0]?.gridType || 'dots',
        backgroundColor: '#090d16',
      };
      const updatedPages = [...prev.pages, newPage];
      const updated = { ...prev, pages: updatedPages, updatedAt: Date.now() };
      storage.saveProject(updated);
      setActivePageIndex(updatedPages.length - 1);
      return updated;
    });
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  const switchPage = useCallback((index: number) => {
    if (index >= 0 && index < project.pages.length) {
      setActivePageIndex(index);
      setUndoStack([]);
      setRedoStack([]);
      setSelectedElementId(null);
    }
  }, [project.pages.length]);

  const deletePage = useCallback((index: number) => {
    if (project.pages.length <= 1) return; // Keep at least one page
    setProject(prev => {
      const updatedPages = prev.pages.filter((_, i) => i !== index);
      const newIndex = Math.min(activePageIndex, updatedPages.length - 1);
      setActivePageIndex(newIndex);
      const updated = { ...prev, pages: updatedPages, updatedAt: Date.now() };
      storage.saveProject(updated);
      return updated;
    });
  }, [project.pages.length, activePageIndex]);

  const updateTitle = useCallback((title: string) => {
    setProject(prev => {
      const updated = { ...prev, title, updatedAt: Date.now() };
      storage.saveProject(updated);
      return updated;
    });
  }, []);

  const saveProject = useCallback(async () => {
    setIsSaving(true);
    try {
      await firestoreService.saveProject(project);
    } finally {
      setIsSaving(false);
    }
  }, [project]);

  const syncToDrive = useCallback(async () => {
    if (!driveAccessToken) {
      throw new Error('Google Drive access token is missing. Please sign in with Google Drive scopes.');
    }
    setIsSyncingDrive(true);
    try {
      const res = await googleDriveService.uploadProjectToDrive(project, driveAccessToken);
      setProject(prev => {
        const updated = {
          ...prev,
          driveFileId: res.fileId,
          driveWebViewLink: res.webViewLink,
        };
        firestoreService.saveProject(updated);
        return updated;
      });
      return res;
    } finally {
      setIsSyncingDrive(false);
    }
  }, [project, driveAccessToken]);

  const loadProject = useCallback((newProject: WhiteboardProject) => {
    setProject(newProject);
    setActivePageIndex(0);
    setUndoStack([]);
    setRedoStack([]);
    setSelectedElementId(null);
    storage.saveProject(newProject);
  }, []);

  const value = useMemo<WhiteboardContextType>(() => ({
    project,
    activePage,
    activePageIndex,
    tool,
    shapeType,
    strokeColor,
    strokeWidth,
    gridType,
    scale,
    stagePos,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    isSaving,
    isSyncingDrive,
    laserPos,
    selectedElementId,

    setTool,
    setShapeType,
    setStrokeColor,
    setStrokeWidth,
    setGridType,
    setScale,
    setStagePos,
    setLaserPos,
    setSelectedElementId,

    addElement,
    updateElement,
    deleteElement,
    clearPage,

    addPage,
    switchPage,
    deletePage,

    undo,
    redo,

    saveProject,
    syncToDrive,
    loadProject,
    updateTitle,
  }), [
    project,
    activePage,
    activePageIndex,
    tool,
    shapeType,
    strokeColor,
    strokeWidth,
    gridType,
    scale,
    stagePos,
    undoStack.length,
    redoStack.length,
    isSaving,
    isSyncingDrive,
    laserPos,
    selectedElementId,
    addElement,
    updateElement,
    deleteElement,
    clearPage,
    addPage,
    switchPage,
    deletePage,
    undo,
    redo,
    saveProject,
    syncToDrive,
    loadProject,
    updateTitle,
    setGridType
  ]);

  return (
    <WhiteboardContext.Provider value={value}>
      {children}
    </WhiteboardContext.Provider>
  );
};

export { WhiteboardContext };
