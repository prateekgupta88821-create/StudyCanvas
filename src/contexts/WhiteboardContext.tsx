import React, { createContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  WhiteboardProject, 
  Page, 
  CanvasElement, 
  ToolType, 
  ShapeType, 
  GridType 
} from '@/types/whiteboard';
import { 
  SaveStatus, 
  RecoveryDraft, 
  ConflictInfo 
} from '@/types/persistence';
import { firestoreService } from '@/services/firestoreService';
import { googleDriveService, DriveConflictError } from '@/services/googleDriveService';
import { googleIdentityService } from '@/services/googleIdentityService';
import { persistenceService } from '@/services/persistenceService';
import { useAuth } from '@/hooks/useAuth';
import { migrateProject } from '@/services/schemaMigration';

export interface WhiteboardContextType {
  project: WhiteboardProject;
  activePage: Page;
  activePageIndex: number;
  tool: ToolType;
  shapeType: ShapeType;
  strokeColor: string;
  strokeWidth: number;
  strokeOpacity: number;
  fillColor: string;
  fontFamily: string;
  fontSize: number;
  stickyColor: string;
  eraserMode: 'stroke' | 'object';
  gridType: GridType;
  scale: number;
  stagePos: { x: number; y: number };
  canUndo: boolean;
  canRedo: boolean;
  isSaving: boolean;
  saveStatus: SaveStatus;
  lastSavedAt: number | null;
  isDirty: boolean;
  isSyncingDrive: boolean;
  laserPos: { x: number; y: number } | null;
  selectedElementId: string | null;
  selectedElementIds: string[];
  isFocusMode: boolean;
  isPropertiesOpen: boolean;
  isPresentationMode: boolean;

  // Persistence, Recovery & Conflicts
  recoveryDraft: RecoveryDraft | null;
  conflictInfo: ConflictInfo | null;
  isAuthExpiredOpen: boolean;
  restoreRecoveryDraft: () => void;
  discardRecoveryDraft: () => void;
  resolveConflictKeepLocal: () => Promise<void>;
  resolveConflictLoadRemote: () => Promise<void>;
  resolveConflictSaveCopy: () => Promise<void>;
  reconnectDrive: () => Promise<void>;
  dismissAuthExpired: () => void;

  setTool: (tool: ToolType) => void;
  setShapeType: (shape: ShapeType) => void;
  setStrokeColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setStrokeOpacity: (opacity: number) => void;
  setFillColor: (color: string) => void;
  setFontFamily: (font: string) => void;
  setFontSize: (size: number) => void;
  setStickyColor: (color: string) => void;
  setEraserMode: (mode: 'stroke' | 'object') => void;
  setGridType: (grid: GridType) => void;
  setBackgroundColor: (color: string) => void;
  setScale: (scale: number | ((prev: number) => number)) => void;
  setStagePos: (pos: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  setLaserPos: (pos: { x: number; y: number } | null) => void;
  setSelectedElementId: (id: string | null) => void;
  setSelectedElementIds: (ids: string[]) => void;
  setIsFocusMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  setIsPropertiesOpen: (val: boolean | ((prev: boolean) => boolean)) => void;
  setIsPresentationMode: (val: boolean | ((prev: boolean) => boolean)) => void;

  addElement: (element: CanvasElement) => void;
  addElements: (elements: CanvasElement[]) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  updateElements: (updates: { id: string; changes: Partial<CanvasElement> }[]) => void;
  deleteElement: (id: string) => void;
  deleteElements: (ids: string[]) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  copySelected: () => void;
  pasteSelected: () => void;
  selectAll: () => void;
  clearPage: () => void;

  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  toggleLockElement: (id: string) => void;

  addPage: (title?: string) => void;
  duplicatePage: (index: number) => void;
  renamePage: (index: number, newTitle: string) => void;
  reorderPages: (startIndex: number, endIndex: number) => void;
  switchPage: (index: number) => void;
  deletePage: (index: number) => void;

  undo: () => void;
  redo: () => void;
  commitHistorySnapshot: (elements: CanvasElement[]) => void;

  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  zoomToFit: (viewportWidth?: number, viewportHeight?: number) => void;

  saveProject: () => Promise<void>;
  syncToDrive: (options?: { forceOverwrite?: boolean }) => Promise<{ fileId: string; webViewLink?: string } | null>;
  loadProject: (project: WhiteboardProject) => void;
  updateTitle: (title: string) => void;
  applyTemplate: (template: import('@/types/whiteboard').WhiteboardTemplate) => void;
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
  subject: 'Mathematics',
  tags: ['Lecture', 'Notes'],
  ownerId,
  pages: [defaultInitialPage],
  activePageIndex: 0,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  version: 1,
});

export const WhiteboardContext = createContext<WhiteboardContextType | undefined>(undefined);

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
  const [strokeColor, setStrokeColor] = useState<string>('#a3e635'); // StudyCanvas electric lime default
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [strokeOpacity, setStrokeOpacity] = useState<number>(1);
  const [fillColor, setFillColor] = useState<string>('transparent');
  const [fontFamily, setFontFamily] = useState<string>('Inter');
  const [fontSize, setFontSize] = useState<number>(24);
  const [stickyColor, setStickyColor] = useState<string>('#fef08a');
  const [eraserMode, setEraserMode] = useState<'stroke' | 'object'>('object');
  const [scale, setScale] = useState<number>(1);
  const [stagePos, setStagePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [laserPos, setLaserPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState<boolean>(false);
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);

  // Undo / Redo history stacks
  const [undoStack, setUndoStack] = useState<CanvasElement[][]>([]);
  const [redoStack, setRedoStack] = useState<CanvasElement[][]>([]);

  // Clipboard buffer
  const clipboardRef = useRef<CanvasElement[]>([]);

  // Persistence, Recovery & Conflicts
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);

  const [recoveryDraft, setRecoveryDraft] = useState<RecoveryDraft | null>(null);
  const [conflictInfo, setConflictInfo] = useState<ConflictInfo | null>(null);
  const [isAuthExpiredOpen, setIsAuthExpiredOpen] = useState(false);

  // Connect persistence service and listen for multi-tab conflicts & status
  useEffect(() => {
    persistenceService.setActiveProject(project);

    // Check if recovery draft exists and has unsaved changes newer than project
    if (persistenceService.hasNewerRecovery(project)) {
      const draft = persistenceService.getRecoveryDraft(project.id);
      if (draft) {
        setRecoveryDraft(draft);
      }
    }

    const unsubscribe = persistenceService.subscribe({
      onStatusChange: (state) => {
        setSaveStatus(state.status);
        setIsDirty(state.isDirty);
        setIsSaving(state.status === 'saving');
        if (state.lastSavedAt) {
          setLastSavedAt(state.lastSavedAt);
        }
      },
      onConflict: (conflict) => {
        setConflictInfo(conflict);
      },
      onAuthExpired: () => {
        setIsAuthExpiredOpen(true);
      },
    });

    return () => {
      unsubscribe();
    };
  }, [project.id]);

  const activePage = project.pages[activePageIndex] || project.pages[0] || defaultInitialPage;
  const gridType = activePage.gridType || 'dots';

  const selectedElementId = selectedElementIds[0] || null;

  const setSelectedElementId = useCallback((id: string | null) => {
    setSelectedElementIds(id ? [id] : []);
  }, []);

  const pushToHistory = useCallback((currentElements: CanvasElement[]) => {
    setUndoStack(prev => [...prev.slice(-40), currentElements]);
    setRedoStack([]);
  }, []);

  const commitHistorySnapshot = useCallback((elements: CanvasElement[]) => {
    pushToHistory(elements);
  }, [pushToHistory]);

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
      persistenceService.markDirty(updatedProject);
      return updatedProject;
    });
  }, [activePageIndex, pushToHistory]);

  const addElements = useCallback((newElements: CanvasElement[]) => {
    if (newElements.length === 0) return;
    setProject(prev => {
      const currentElements = prev.pages[activePageIndex]?.elements || [];
      pushToHistory(currentElements);

      const updatedPages = [...prev.pages];
      updatedPages[activePageIndex] = {
        ...updatedPages[activePageIndex],
        elements: [...currentElements, ...newElements],
      };

      const updatedProject = {
        ...prev,
        pages: updatedPages,
        updatedAt: Date.now(),
      };
      persistenceService.markDirty(updatedProject);
      return updatedProject;
    });
  }, [activePageIndex, pushToHistory]);

  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setProject(prev => {
      const currentElements = prev.pages[activePageIndex]?.elements || [];
      const index = currentElements.findIndex(el => el.id === id);
      if (index === -1) return prev;

      pushToHistory(currentElements);

      const updatedElements = [...currentElements];
      updatedElements[index] = {
        ...updatedElements[index],
        ...updates,
        updatedAt: Date.now(),
      } as CanvasElement;

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
      persistenceService.markDirty(updatedProject);
      return updatedProject;
    });
  }, [activePageIndex, pushToHistory]);

  const updateElements = useCallback((updates: { id: string; changes: Partial<CanvasElement> }[]) => {
    if (updates.length === 0) return;
    setProject(prev => {
      const currentElements = prev.pages[activePageIndex]?.elements || [];
      pushToHistory(currentElements);

      const updateMap = new Map(updates.map(u => [u.id, u.changes]));
      const updatedElements = currentElements.map(el => {
        const changes = updateMap.get(el.id);
        if (!changes) return el;
        return { ...el, ...changes, updatedAt: Date.now() } as CanvasElement;
      });

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
      persistenceService.markDirty(updatedProject);
      return updatedProject;
    });
  }, [activePageIndex, pushToHistory]);

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
      persistenceService.markDirty(updatedProject);
      return updatedProject;
    });
    setSelectedElementIds(prev => prev.filter(selId => selId !== id));
  }, [activePageIndex, pushToHistory]);

  const deleteElements = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    setProject(prev => {
      const currentElements = prev.pages[activePageIndex]?.elements || [];
      pushToHistory(currentElements);

      const updatedPages = [...prev.pages];
      updatedPages[activePageIndex] = {
        ...updatedPages[activePageIndex],
        elements: currentElements.filter(el => !idSet.has(el.id)),
      };

      const updatedProject = {
        ...prev,
        pages: updatedPages,
        updatedAt: Date.now(),
      };
      persistenceService.markDirty(updatedProject);
      return updatedProject;
    });
    setSelectedElementIds(prev => prev.filter(selId => !idSet.has(selId)));
  }, [activePageIndex, pushToHistory]);

  const deleteSelected = useCallback(() => {
    if (selectedElementIds.length > 0) {
      deleteElements(selectedElementIds);
      setSelectedElementIds([]);
    }
  }, [selectedElementIds, deleteElements]);

  const duplicateSelected = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    const currentElements = project.pages[activePageIndex]?.elements || [];
    const selected = currentElements.filter(el => selectedElementIds.includes(el.id));
    if (selected.length === 0) return;

    const duplicates = selected.map(el => ({
      ...el,
      id: `${el.type}_${Math.random().toString(36).substring(2, 9)}`,
      x: el.x + 25,
      y: el.y + 25,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));

    addElements(duplicates);
    setSelectedElementIds(duplicates.map(d => d.id));
  }, [selectedElementIds, project.pages, activePageIndex, addElements]);

  const copySelected = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    const currentElements = project.pages[activePageIndex]?.elements || [];
    clipboardRef.current = currentElements.filter(el => selectedElementIds.includes(el.id));
  }, [selectedElementIds, project.pages, activePageIndex]);

  const pasteSelected = useCallback(() => {
    if (clipboardRef.current.length === 0) return;
    const clones = clipboardRef.current.map(el => ({
      ...el,
      id: `${el.type}_${Math.random().toString(36).substring(2, 9)}`,
      x: el.x + 30,
      y: el.y + 30,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));

    addElements(clones);
    setSelectedElementIds(clones.map(c => c.id));
    clipboardRef.current = clones; // Offset next paste
  }, [addElements]);

  const selectAll = useCallback(() => {
    const currentElements = project.pages[activePageIndex]?.elements || [];
    setSelectedElementIds(currentElements.map(el => el.id));
  }, [project.pages, activePageIndex]);

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

      const updatedProject = {
        ...prev,
        pages: updatedPages,
        updatedAt: Date.now(),
      };
      persistenceService.markDirty(updatedProject);
      return updatedProject;
    });
    setSelectedElementIds([]);
  }, [activePageIndex, pushToHistory]);

  const setGridType = useCallback((type: GridType) => {
    setProject(prev => {
      const updatedPages = [...prev.pages];
      updatedPages[activePageIndex] = {
        ...updatedPages[activePageIndex],
        gridType: type,
      };
      const updatedProject = { ...prev, pages: updatedPages, updatedAt: Date.now() };
      persistenceService.markDirty(updatedProject);
      return updatedProject;
    });
  }, [activePageIndex]);

  const setBackgroundColor = useCallback((color: string) => {
    setProject(prev => {
      const updatedPages = [...prev.pages];
      updatedPages[activePageIndex] = {
        ...updatedPages[activePageIndex],
        backgroundColor: color,
      };
      const updatedProject = { ...prev, pages: updatedPages, updatedAt: Date.now() };
      persistenceService.markDirty(updatedProject);
      return updatedProject;
    });
  }, [activePageIndex]);

  const addPage = useCallback((title?: string) => {
    setProject(prev => {
      const newPageNumber = prev.pages.length + 1;
      const newPage: Page = {
        id: 'page_' + Math.random().toString(36).substring(2, 9),
        title: title || `Page ${newPageNumber}`,
        elements: [],
        gridType: prev.pages[activePageIndex]?.gridType || 'dots',
        backgroundColor: prev.pages[activePageIndex]?.backgroundColor || '#090d16',
      };
      const updated = {
        ...prev,
        pages: [...prev.pages, newPage],
        updatedAt: Date.now(),
      };
      persistenceService.markDirty(updated);
      return updated;
    });
    setActivePageIndex(prev => prev + 1);
    setUndoStack([]);
    setRedoStack([]);
    setSelectedElementIds([]);
  }, [activePageIndex]);

  const switchPage = useCallback((index: number) => {
    if (index >= 0 && index < project.pages.length) {
      setActivePageIndex(index);
      setUndoStack([]);
      setRedoStack([]);
      setSelectedElementIds([]);
    }
  }, [project.pages.length]);

  const deletePage = useCallback((index: number) => {
    setProject(prev => {
      if (prev.pages.length <= 1) return prev;
      const updatedPages = prev.pages.filter((_, i) => i !== index);
      const updated = { ...prev, pages: updatedPages, updatedAt: Date.now() };
      persistenceService.markDirty(updated);
      return updated;
    });
    setActivePageIndex(prev => Math.max(0, Math.min(prev, project.pages.length - 2)));
    setUndoStack([]);
    setRedoStack([]);
    setSelectedElementIds([]);
  }, [project.pages.length]);

  const duplicatePage = useCallback((index: number) => {
    setProject(prev => {
      const targetPage = prev.pages[index];
      if (!targetPage) return prev;
      const newPage: Page = {
        ...targetPage,
        id: 'page_' + Math.random().toString(36).substring(2, 9),
        title: `${targetPage.title} (Copy)`,
        elements: targetPage.elements.map(el => ({
          ...el,
          id: el.type + '_' + Math.random().toString(36).substring(2, 9),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })),
      };
      const updatedPages = [...prev.pages];
      updatedPages.splice(index + 1, 0, newPage);
      const updated = { ...prev, pages: updatedPages, updatedAt: Date.now() };
      persistenceService.markDirty(updated);
      return updated;
    });
    setActivePageIndex(index + 1);
    setUndoStack([]);
    setRedoStack([]);
    setSelectedElementIds([]);
  }, []);

  const renamePage = useCallback((index: number, newTitle: string) => {
    setProject(prev => {
      if (!prev.pages[index] || !newTitle.trim()) return prev;
      const updatedPages = [...prev.pages];
      updatedPages[index] = { ...updatedPages[index], title: newTitle.trim() };
      const updated = { ...prev, pages: updatedPages, updatedAt: Date.now() };
      persistenceService.markDirty(updated);
      return updated;
    });
  }, []);

  const reorderPages = useCallback((startIndex: number, endIndex: number) => {
    setProject(prev => {
      if (
        startIndex < 0 || startIndex >= prev.pages.length ||
        endIndex < 0 || endIndex >= prev.pages.length ||
        startIndex === endIndex
      ) {
        return prev;
      }
      const updatedPages = [...prev.pages];
      const [moved] = updatedPages.splice(startIndex, 1);
      updatedPages.splice(endIndex, 0, moved);
      const updated = { ...prev, pages: updatedPages, updatedAt: Date.now() };
      persistenceService.markDirty(updated);
      return updated;
    });
    setActivePageIndex(endIndex);
  }, []);

  const bringToFront = useCallback((id: string) => {
    setProject(prev => {
      const current = prev.pages[activePageIndex]?.elements || [];
      const item = current.find(el => el.id === id);
      if (!item) return prev;
      pushToHistory(current);
      const reordered = current.filter(el => el.id !== id).concat(item);
      const updatedPages = [...prev.pages];
      updatedPages[activePageIndex] = { ...updatedPages[activePageIndex], elements: reordered };
      const updated = { ...prev, pages: updatedPages, updatedAt: Date.now() };
      persistenceService.markDirty(updated);
      return updated;
    });
  }, [activePageIndex, pushToHistory]);

  const sendToBack = useCallback((id: string) => {
    setProject(prev => {
      const current = prev.pages[activePageIndex]?.elements || [];
      const item = current.find(el => el.id === id);
      if (!item) return prev;
      pushToHistory(current);
      const reordered = [item].concat(current.filter(el => el.id !== id));
      const updatedPages = [...prev.pages];
      updatedPages[activePageIndex] = { ...updatedPages[activePageIndex], elements: reordered };
      const updated = { ...prev, pages: updatedPages, updatedAt: Date.now() };
      persistenceService.markDirty(updated);
      return updated;
    });
  }, [activePageIndex, pushToHistory]);

  const toggleLockElement = useCallback((id: string) => {
    setProject(prev => {
      const current = prev.pages[activePageIndex]?.elements || [];
      const item = current.find(el => el.id === id);
      if (!item) return prev;
      pushToHistory(current);
      const updatedElements = current.map(el => el.id === id ? { ...el, isLocked: !el.isLocked } : el);
      const updatedPages = [...prev.pages];
      updatedPages[activePageIndex] = { ...updatedPages[activePageIndex], elements: updatedElements };
      const updated = { ...prev, pages: updatedPages, updatedAt: Date.now() };
      persistenceService.markDirty(updated);
      return updated;
    });
  }, [activePageIndex, pushToHistory]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previousSnapshot = undoStack[undoStack.length - 1];
    const currentElements = project.pages[activePageIndex]?.elements || [];

    setRedoStack(prev => [...prev, currentElements]);
    setUndoStack(prev => prev.slice(0, -1));

    setProject(prev => {
      const updatedPages = [...prev.pages];
      updatedPages[activePageIndex] = {
        ...updatedPages[activePageIndex],
        elements: previousSnapshot,
      };
      const updated = { ...prev, pages: updatedPages, updatedAt: Date.now() };
      persistenceService.markDirty(updated);
      return updated;
    });
    setSelectedElementIds([]);
  }, [undoStack, project.pages, activePageIndex]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const nextSnapshot = redoStack[redoStack.length - 1];
    const currentElements = project.pages[activePageIndex]?.elements || [];

    setUndoStack(prev => [...prev, currentElements]);
    setRedoStack(prev => prev.slice(0, -1));

    setProject(prev => {
      const updatedPages = [...prev.pages];
      updatedPages[activePageIndex] = {
        ...updatedPages[activePageIndex],
        elements: nextSnapshot,
      };
      const updated = { ...prev, pages: updatedPages, updatedAt: Date.now() };
      persistenceService.markDirty(updated);
      return updated;
    });
    setSelectedElementIds([]);
  }, [redoStack, project.pages, activePageIndex]);

  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(5, Number((prev * 1.2).toFixed(2))));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(0.2, Number((prev / 1.2).toFixed(2))));
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1);
    setStagePos({ x: 0, y: 0 });
  }, []);

  const zoomToFit = useCallback((viewportWidth = 1200, viewportHeight = 800) => {
    const elements = project.pages[activePageIndex]?.elements || [];
    if (elements.length === 0) {
      resetZoom();
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const el of elements) {
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      const w = 'width' in el && typeof (el as any).width === 'number' ? (el as any).width : 100;
      const h = 'height' in el && typeof (el as any).height === 'number' ? (el as any).height : 100;
      maxX = Math.max(maxX, el.x + w);
      maxY = Math.max(maxY, el.y + h);
    }

    const padding = 60;
    const contentWidth = Math.max(100, maxX - minX);
    const contentHeight = Math.max(100, maxY - minY);

    const scaleX = (viewportWidth - padding * 2) / contentWidth;
    const scaleY = (viewportHeight - padding * 2) / contentHeight;
    const fitScale = Math.min(1.5, Math.max(0.2, Math.min(scaleX, scaleY)));

    setScale(Number(fitScale.toFixed(2)));
    setStagePos({
      x: (viewportWidth - contentWidth * fitScale) / 2 - minX * fitScale,
      y: (viewportHeight - contentHeight * fitScale) / 2 - minY * fitScale,
    });
  }, [project.pages, activePageIndex, resetZoom]);

  const updateTitle = useCallback((title: string) => {
    setProject(prev => {
      const updated = { ...prev, title, updatedAt: Date.now() };
      persistenceService.markDirty(updated);
      return updated;
    });
  }, []);

  const saveProject = useCallback(async () => {
    await persistenceService.flushNow();
  }, []);

  const syncToDrive = useCallback(async (options: { forceOverwrite?: boolean } = {}) => {
    let token = googleIdentityService.getValidToken() || driveAccessToken;
    if (!token && googleIdentityService.isConfigured()) {
      token = await googleIdentityService.requestDriveAccessToken();
    }
    if (!token) {
      setIsAuthExpiredOpen(true);
      throw new Error('Google Drive access token is missing. Please authorize Google Drive in settings.');
    }

    setIsSyncingDrive(true);
    try {
      const res = await persistenceService.syncToDrive(project, token, options);
      setProject(prev => ({
        ...prev,
        driveFileId: res.fileId,
        driveWebViewLink: res.webViewLink,
        driveRevisionId: res.revisionId,
        driveSyncedAt: res.syncedAt,
      }));
      return res;
    } catch (err: any) {
      if (err instanceof DriveConflictError) {
        setConflictInfo({
          projectId: project.id,
          localTitle: project.title,
          localModifiedTime: project.updatedAt,
          remoteModifiedTime: err.conflictDetails?.remoteModifiedTime || Date.now(),
          remoteFile: err.conflictDetails?.remoteFile,
          source: 'google_drive',
        });
      }
      throw err;
    } finally {
      setIsSyncingDrive(false);
    }
  }, [project, driveAccessToken]);

  const resolveConflictKeepLocal = useCallback(async () => {
    if (!conflictInfo) return;
    try {
      if (conflictInfo.source === 'google_drive') {
        let token = googleIdentityService.getValidToken() || driveAccessToken;
        if (!token && googleIdentityService.isConfigured()) {
          token = await googleIdentityService.requestDriveAccessToken();
        }
        if (token) {
          await persistenceService.syncToDrive(project, token, { forceOverwrite: true });
        } else {
          await firestoreService.saveProject(project);
        }
      } else {
        await firestoreService.saveProject(project);
      }
      persistenceService.setActiveProject(project);
      setConflictInfo(null);
    } catch (err) {
      console.error('Failed to keep local version:', err);
    }
  }, [conflictInfo, driveAccessToken, project]);

  const resolveConflictLoadRemote = useCallback(async () => {
    if (!conflictInfo) return;
    try {
      let remoteProj: WhiteboardProject | null = null;
      let token = googleIdentityService.getValidToken() || driveAccessToken;
      if (conflictInfo.remoteFile && token) {
        remoteProj = await googleDriveService.downloadProjectFromDrive(conflictInfo.remoteFile.id, token);
      } else {
        remoteProj = await firestoreService.getProjectById(conflictInfo.projectId);
      }

      if (remoteProj) {
        const migrated = migrateProject(remoteProj);
        setProject(migrated);
        persistenceService.setActiveProject(migrated);
        persistenceService.clearRecoveryDraft(migrated.id);
      }
      setConflictInfo(null);
    } catch (err) {
      console.error('Failed to load remote project:', err);
    }
  }, [conflictInfo, driveAccessToken]);

  const resolveConflictSaveCopy = useCallback(async () => {
    if (!conflictInfo) return;
    try {
      const copyId = 'canvas_' + Math.random().toString(36).substring(2, 9);
      const copiedProject: WhiteboardProject = {
        ...project,
        id: copyId,
        title: `${project.title} (Recovered Copy)`,
        driveFileId: undefined,
        driveRevisionId: undefined,
        driveWebViewLink: undefined,
        driveSyncedAt: undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
      };
      await firestoreService.saveProject(copiedProject);
      setProject(copiedProject);
      persistenceService.setActiveProject(copiedProject);
      setConflictInfo(null);
    } catch (err) {
      console.error('Failed to save copy:', err);
    }
  }, [conflictInfo, project]);

  const restoreRecoveryDraft = useCallback(() => {
    if (recoveryDraft) {
      const recovered = recoveryDraft.project;
      setProject(recovered);
      persistenceService.markDirty(recovered);
      setRecoveryDraft(null);
    }
  }, [recoveryDraft]);

  const discardRecoveryDraft = useCallback(() => {
    if (recoveryDraft) {
      persistenceService.clearRecoveryDraft(recoveryDraft.projectId);
      setRecoveryDraft(null);
    }
  }, [recoveryDraft]);

  const reconnectDrive = useCallback(async () => {
    try {
      const newToken = await googleIdentityService.requestDriveAccessToken();
      if (newToken) {
        setIsAuthExpiredOpen(false);
        await persistenceService.syncToDrive(project, newToken);
      }
    } catch (err) {
      console.error('Failed to reconnect Google Drive:', err);
    }
  }, [project]);

  const dismissAuthExpired = useCallback(() => {
    setIsAuthExpiredOpen(false);
  }, []);

  const applyTemplate = useCallback((template: import('@/types/whiteboard').WhiteboardTemplate) => {
    setProject(prev => {
      const newPage: Page = {
        id: 'page_' + Math.random().toString(36).substring(2, 9),
        title: template.name,
        gridType: template.gridType,
        backgroundColor: prev.pages[activePageIndex]?.backgroundColor || '#090b0e',
        elements: template.initialElements ? JSON.parse(JSON.stringify(template.initialElements)) : [],
      };
      const updatedPages = [...prev.pages, newPage];
      const updated = { ...prev, pages: updatedPages, updatedAt: Date.now() };
      persistenceService.markDirty(updated);
      return updated;
    });
    setActivePageIndex(project.pages.length);
    setUndoStack([]);
    setRedoStack([]);
    setSelectedElementIds([]);
  }, [activePageIndex, project.pages.length]);

  const loadProject = useCallback((newProject: WhiteboardProject) => {
    const migrated = migrateProject(newProject);
    setProject(migrated);
    setActivePageIndex(0);
    setUndoStack([]);
    setRedoStack([]);
    setSelectedElementIds([]);
    persistenceService.setActiveProject(migrated);
    if (persistenceService.hasNewerRecovery(migrated)) {
      const draft = persistenceService.getRecoveryDraft(migrated.id);
      if (draft) {
        setRecoveryDraft(draft);
      }
    }
  }, []);

  const value = useMemo<WhiteboardContextType>(() => ({
    project,
    activePage,
    activePageIndex,
    tool,
    shapeType,
    strokeColor,
    strokeWidth,
    strokeOpacity,
    fillColor,
    fontFamily,
    fontSize,
    stickyColor,
    eraserMode,
    gridType,
    scale,
    stagePos,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    isSaving,
    saveStatus,
    lastSavedAt,
    isDirty,
    isSyncingDrive,
    laserPos,
    selectedElementId,
    selectedElementIds,
    isFocusMode,
    isPropertiesOpen,
    isPresentationMode,

    recoveryDraft,
    conflictInfo,
    isAuthExpiredOpen,
    restoreRecoveryDraft,
    discardRecoveryDraft,
    resolveConflictKeepLocal,
    resolveConflictLoadRemote,
    resolveConflictSaveCopy,
    reconnectDrive,
    dismissAuthExpired,

    setTool,
    setShapeType,
    setStrokeColor,
    setStrokeWidth,
    setStrokeOpacity,
    setFillColor,
    setFontFamily,
    setFontSize,
    setStickyColor,
    setEraserMode,
    setGridType,
    setBackgroundColor,
    setScale,
    setStagePos,
    setLaserPos,
    setSelectedElementId,
    setSelectedElementIds,
    setIsFocusMode,
    setIsPropertiesOpen,
    setIsPresentationMode,

    addElement,
    addElements,
    updateElement,
    updateElements,
    deleteElement,
    deleteElements,
    deleteSelected,
    duplicateSelected,
    copySelected,
    pasteSelected,
    selectAll,
    clearPage,

    bringToFront,
    sendToBack,
    toggleLockElement,

    addPage,
    duplicatePage,
    renamePage,
    reorderPages,
    switchPage,
    deletePage,

    undo,
    redo,
    commitHistorySnapshot,

    zoomIn,
    zoomOut,
    resetZoom,
    zoomToFit,

    saveProject,
    syncToDrive,
    loadProject,
    updateTitle,
    applyTemplate,
  }), [
    project,
    activePage,
    activePageIndex,
    tool,
    shapeType,
    strokeColor,
    strokeWidth,
    strokeOpacity,
    fillColor,
    fontFamily,
    fontSize,
    stickyColor,
    eraserMode,
    gridType,
    scale,
    stagePos,
    undoStack.length,
    redoStack.length,
    isSaving,
    saveStatus,
    lastSavedAt,
    isDirty,
    isSyncingDrive,
    laserPos,
    selectedElementId,
    selectedElementIds,
    isFocusMode,
    isPropertiesOpen,
    isPresentationMode,
    recoveryDraft,
    conflictInfo,
    isAuthExpiredOpen,
    restoreRecoveryDraft,
    discardRecoveryDraft,
    resolveConflictKeepLocal,
    resolveConflictLoadRemote,
    resolveConflictSaveCopy,
    reconnectDrive,
    dismissAuthExpired,
    addElement,
    addElements,
    updateElement,
    updateElements,
    deleteElement,
    deleteElements,
    deleteSelected,
    duplicateSelected,
    copySelected,
    pasteSelected,
    selectAll,
    clearPage,
    bringToFront,
    sendToBack,
    toggleLockElement,
    addPage,
    duplicatePage,
    renamePage,
    reorderPages,
    switchPage,
    deletePage,
    undo,
    redo,
    commitHistorySnapshot,
    zoomIn,
    zoomOut,
    resetZoom,
    zoomToFit,
    saveProject,
    syncToDrive,
    loadProject,
    updateTitle,
    applyTemplate,
    setBackgroundColor,
    setGridType,
    setSelectedElementId,
  ]);

  return (
    <WhiteboardContext.Provider value={value}>
      {children}
    </WhiteboardContext.Provider>
  );
};
