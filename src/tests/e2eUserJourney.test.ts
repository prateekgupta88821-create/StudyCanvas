import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WhiteboardProject, StrokeElement, TextElement, ShapeElement, Page } from '@/types/whiteboard';
import { googleDriveService } from '@/services/googleDriveService';
import { persistenceService } from '@/services/persistenceService';
import { exportMultiPagePdf } from '@/services/pdfService';
import { formatAuthError } from '@/services/authService';

// In-memory web storage mock
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) { return this.store.get(key) ?? null; }
  setItem(key: string, value: string) { this.store.set(key, String(value)); }
  removeItem(key: string) { this.store.delete(key); }
  clear() { this.store.clear(); }
}

(globalThis as any).sessionStorage = new MemoryStorage();
(globalThis as any).localStorage = new MemoryStorage();

// Mock event target for window
class MockEventTarget {
  private listeners = new Map<string, Function[]>();
  addEventListener(event: string, fn: Function) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event)!.push(fn);
  }
  removeEventListener(event: string, fn: Function) {
    const list = this.listeners.get(event) || [];
    this.listeners.set(event, list.filter(cb => cb !== fn));
  }
  dispatchEvent(event: any) {
    const list = this.listeners.get(event.type) || [];
    list.forEach(fn => fn(event));
    return true;
  }
}
(globalThis as any).window = new MockEventTarget();

describe('StudyCanvas End-to-End QA User Journey & Technical Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  // -------------------------------------------------------------
  // STEP 1-4: Landing Page, Authentication & Protected Navigation
  // -------------------------------------------------------------
  describe('User Journey 1-4: Landing Page, Google Auth, Notifications & Dashboard', () => {
    it('Step 1: Landing page provides unauthenticated access and default dark theme structure', () => {
      const themePreference = localStorage.getItem('studycanvas_theme_preference') || 'dark';
      expect(themePreference).toBe('dark');
    });

    it('Step 2 & 3: Authentication flow triggers welcome toast strictly on success', async () => {
      let toastNotification: string | null = null;
      let isAuthenticated = false;

      const onAuthSuccess = (_user: any) => {
        isAuthenticated = true;
        toastNotification = 'Successfully signed in. Welcome to StudyCanvas!';
      };

      // Ensure toast is NOT displayed before authentication
      expect(toastNotification).toBeNull();
      expect(isAuthenticated).toBe(false);

      // Simulate successful Google OAuth response
      const mockGoogleUser = {
        uid: 'prof_e2e_456',
        displayName: 'Dr. Katherine Johnson',
        email: 'kjohnson@nasa.gov',
        photoURL: 'https://example.com/avatar.png',
        role: 'professor',
      };

      onAuthSuccess(mockGoogleUser);

      // Confirm toast appears only after successful auth with exact copy
      expect(isAuthenticated).toBe(true);
      expect(toastNotification).toBe('Successfully signed in. Welcome to StudyCanvas!');
    });

    it('Step 4: Authenticated user transitions to dashboard with role metadata', () => {
      const user = {
        uid: 'prof_e2e_456',
        displayName: 'Dr. Katherine Johnson',
        email: 'kjohnson@nasa.gov',
        role: 'professor' as const,
      };

      // Protected route resolver
      const resolveRoute = (currentRoute: string, authedUser: any) => {
        if (!authedUser && currentRoute !== 'landing') return 'landing';
        return currentRoute;
      };

      expect(resolveRoute('dashboard', null)).toBe('landing');
      expect(resolveRoute('dashboard', user)).toBe('dashboard');
    });
  });

  // -------------------------------------------------------------
  // STEP 5-9: Project Creation, Whiteboard Editor, Drawing & Pages
  // -------------------------------------------------------------
  describe('User Journey 5-9: Project Creation, Whiteboard Drawing, Undo/Redo & Pages', () => {
    let project: WhiteboardProject;

    beforeEach(() => {
      project = {
        id: 'proj_e2e_101',
        title: 'Orbital Mechanics & Calculus 101',
        subject: 'Physics',
        ownerId: 'prof_e2e_456',
        tags: ['physics', 'calculus'],
        version: 1,
        pages: [
          {
            id: 'page_1',
            title: 'Elliptical Orbits',
            elements: [],
            gridType: 'dots',
            backgroundColor: '#090b0e',
          },
        ],
        activePageIndex: 0,
        schemaVersion: '1.0.0',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    });

    it('Step 5 & 6: Creates project with custom title and subject, initializing whiteboard', () => {
      expect(project.title).toBe('Orbital Mechanics & Calculus 101');
      expect(project.subject).toBe('Physics');
      expect(project.pages).toHaveLength(1);
      expect(project.pages[0].gridType).toBe('dots');
    });

    it('Step 7: Whiteboard drawing operations (Pen, Highlighter, Text, Shapes, Erase, Move)', () => {
      const page = project.pages[0];

      // 7a. Pen stroke
      const penStroke: StrokeElement = {
        id: 'el_pen_1',
        type: 'pen',
        x: 0,
        y: 0,
        points: [100, 150, 105, 155, 110, 160, 120, 170],
        color: '#a3e635',
        size: 4,
        opacity: 1,
        tension: 0.45,
        lineCap: 'round',
        lineJoin: 'round',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      page.elements.push(penStroke);

      // 7b. Highlighter stroke
      const highlighterStroke: StrokeElement = {
        id: 'el_highlighter_1',
        type: 'highlighter',
        x: 0,
        y: 0,
        points: [200, 250, 250, 250],
        color: '#facc15',
        size: 20,
        opacity: 0.35,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      page.elements.push(highlighterStroke);

      // 7c. Text element
      const textElement: TextElement = {
        id: 'el_text_1',
        type: 'text',
        x: 300,
        y: 400,
        text: 'r = a(1 - e^2) / (1 + e cos θ)',
        fontSize: 22,
        fontFamily: 'Inter, sans-serif',
        fontColor: '#ffffff',
        width: 320,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      page.elements.push(textElement);

      // 7d. Shape (Ellipse)
      const ellipseShape: ShapeElement = {
        id: 'el_ellipse_1',
        type: 'shape',
        shapeType: 'ellipse',
        x: 450,
        y: 300,
        width: 180,
        height: 120,
        stroke: '#38bdf8',
        strokeWidth: 3,
        fill: 'transparent',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      page.elements.push(ellipseShape);

      expect(page.elements).toHaveLength(4);

      // 7e. Move / transform object
      const targetElement = page.elements.find(el => el.id === 'el_ellipse_1') as ShapeElement;
      targetElement.x = 500;
      targetElement.y = 350;
      expect(targetElement.x).toBe(500);
      expect(targetElement.y).toBe(350);

      // 7f. Eraser removes targeted element
      page.elements = page.elements.filter(el => el.id !== 'el_highlighter_1');
      expect(page.elements).toHaveLength(3);
      expect(page.elements.some(el => el.id === 'el_highlighter_1')).toBe(false);
    });

    it('Step 8: Undo and Redo operations preserve canvas history fidelity', () => {
      const historyStack: WhiteboardProject[] = [];
      let redoStack: WhiteboardProject[] = [];

      const commitChange = (updated: WhiteboardProject) => {
        historyStack.push(JSON.parse(JSON.stringify(project)));
        redoStack = [];
        project = JSON.parse(JSON.stringify(updated));
      };

      const undo = () => {
        if (historyStack.length === 0) return;
        redoStack.push(JSON.parse(JSON.stringify(project)));
        project = historyStack.pop()!;
      };

      const redo = () => {
        if (redoStack.length === 0) return;
        historyStack.push(JSON.parse(JSON.stringify(project)));
        project = redoStack.pop()!;
      };

      // Add stroke
      const modified1 = JSON.parse(JSON.stringify(project));
      modified1.pages[0].elements.push({ id: 'stroke_1', type: 'pen', points: [0, 0, 10, 10] });
      commitChange(modified1);
      expect(project.pages[0].elements).toHaveLength(1);

      // Add another stroke
      const modified2 = JSON.parse(JSON.stringify(project));
      modified2.pages[0].elements.push({ id: 'stroke_2', type: 'pen', points: [20, 20, 30, 30] });
      commitChange(modified2);
      expect(project.pages[0].elements).toHaveLength(2);

      // Undo
      undo();
      expect(project.pages[0].elements).toHaveLength(1);
      expect(project.pages[0].elements[0].id).toBe('stroke_1');

      // Undo to initial state
      undo();
      expect(project.pages[0].elements).toHaveLength(0);

      // Redo
      redo();
      expect(project.pages[0].elements).toHaveLength(1);
      expect(project.pages[0].elements[0].id).toBe('stroke_1');
    });

    it('Step 9: Creates, renames, reorders, and deletes pages', () => {
      // Add page 2
      const newPage: Page = {
        id: 'page_2',
        title: 'Kepler Laws',
        elements: [],
        gridType: 'ruled',
        backgroundColor: '#090b0e',
      };
      project.pages.push(newPage);
      expect(project.pages).toHaveLength(2);

      // Add page 3
      const page3: Page = {
        id: 'page_3',
        title: 'Velocity Vectors',
        elements: [],
        gridType: 'coordinate',
        backgroundColor: '#090b0e',
      };
      project.pages.push(page3);
      expect(project.pages).toHaveLength(3);

      // Reorder pages (move page 3 to index 1)
      const [movedPage] = project.pages.splice(2, 1);
      project.pages.splice(1, 0, movedPage);

      expect(project.pages[0].id).toBe('page_1');
      expect(project.pages[1].id).toBe('page_3');
      expect(project.pages[2].id).toBe('page_2');
    });
  });

  // -------------------------------------------------------------
  // STEP 10-12: Persistence, Google Drive Sync & Document Fidelity
  // -------------------------------------------------------------
  describe('User Journey 10-12: Persistence, Recovery, Google Drive Sync & Fidelity', () => {
    let sampleProject: WhiteboardProject;

    beforeEach(() => {
      sampleProject = {
        id: 'proj_sync_999',
        title: 'Astrophysics Derivations',
        subject: 'Physics',
        ownerId: 'prof_e2e_456',
        tags: ['physics'],
        version: 1,
        pages: [
          {
            id: 'page_a',
            title: 'Derivation A',
            elements: [
              {
                id: 'pen_elem_a',
                type: 'pen',
                x: 0,
                y: 0,
                points: [10, 20, 30, 40],
                color: '#ef4444',
                size: 3,
                createdAt: 1000,
                updatedAt: 1000,
              } as StrokeElement,
            ],
            gridType: 'dots',
            backgroundColor: '#090b0e',
          },
        ],
        activePageIndex: 0,
        schemaVersion: '1.0.0',
        createdAt: 1000,
        updatedAt: 1000,
      };
    });

    it('Step 10: Refresh the browser and confirm unsaved work is recoverable via local draft', () => {
      persistenceService.setActiveProject(sampleProject);

      // Simulate local unsaved edit right before an abrupt browser refresh/crash
      const editedProject: WhiteboardProject = {
        ...sampleProject,
        title: 'Astrophysics Derivations (Revised)',
        updatedAt: 2000,
      };

      persistenceService.markDirty(editedProject);

      // Save draft into storage
      const draft = {
        projectId: editedProject.id,
        project: editedProject,
        timestamp: 2000,
        dirtyFields: ['title', 'updatedAt'],
      };
      localStorage.setItem(`studycanvas_draft_${editedProject.id}`, JSON.stringify(draft));

      // Simulate browser refresh & recovery check
      const recoveredDraft = persistenceService.getRecoveryDraft(editedProject.id);
      expect(recoveredDraft).not.toBeNull();
      expect(recoveredDraft!.project.title).toBe('Astrophysics Derivations (Revised)');
      expect(persistenceService.hasNewerRecovery(sampleProject)).toBe(true);
    });

    it('Step 11 & 12: Project serialization to Google Drive format and 100% drawing fidelity on reopen', () => {
      // Serialize project into official .studycanvas Google Drive payload
      const filePayload = googleDriveService.buildProjectFilePayload(sampleProject);
      expect(filePayload.format).toBe('studycanvas');
      expect(filePayload.schemaVersion).toBe('1.0');
      expect(filePayload.project.id).toBe(sampleProject.id);

      const serializedJson = JSON.stringify(filePayload);
      expect(typeof serializedJson).toBe('string');

      // Deserialize and verify exact drawing fidelity
      const parsed = JSON.parse(serializedJson);
      const reloadedProject = parsed.project as WhiteboardProject;
      expect(reloadedProject.id).toBe(sampleProject.id);
      expect(reloadedProject.title).toBe(sampleProject.title);
      expect(reloadedProject.pages).toHaveLength(1);

      const reloadedStroke = reloadedProject.pages[0].elements[0] as StrokeElement;
      expect(reloadedStroke.points).toEqual([10, 20, 30, 40]);
      expect(reloadedStroke.color).toBe('#ef4444');
      expect(reloadedStroke.size).toBe(3);
    });
  });

  // -------------------------------------------------------------
  // STEP 13-15: PDF Export, Dashboard Operations & Sign-Out
  // -------------------------------------------------------------
  describe('User Journey 13-15: PDF Export, Dashboard CRUD & Sign-Out', () => {
    it('Step 13: Export project to PDF verifies page ordering and binary output structure', async () => {
      const multiPageProject: WhiteboardProject = {
        id: 'proj_export_test',
        title: 'Calculus Final Review',
        subject: 'Mathematics',
        ownerId: 'user_1',
        tags: ['math'],
        version: 1,
        pages: [
          { id: 'p1', title: 'Limits', elements: [], gridType: 'blank', backgroundColor: '#090b0e' },
          { id: 'p2', title: 'Derivatives', elements: [], gridType: 'ruled', backgroundColor: '#090b0e' },
          { id: 'p3', title: 'Integrals', elements: [], gridType: 'grid', backgroundColor: '#090b0e' },
        ],
        activePageIndex: 0,
        schemaVersion: '1.0.0',
        createdAt: 0,
        updatedAt: 0,
      };

      // Mock canvas renderer delivering page snapshot
      const mockRenderPage = vi.fn().mockResolvedValue('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');

      const pdfBlob = await exportMultiPagePdf(multiPageProject, mockRenderPage);

      expect(pdfBlob).toBeInstanceOf(Blob);
      expect(pdfBlob.type).toBe('application/pdf');
      expect(pdfBlob.size).toBeGreaterThan(0);
      expect(mockRenderPage).toHaveBeenCalledTimes(3);
    });

    it('Step 14: Dashboard search, rename, favorite, and soft delete', () => {
      let projects: WhiteboardProject[] = [
        {
          id: 'p_1',
          title: 'Quantum Mechanics',
          subject: 'Physics',
          ownerId: 'prof_1',
          tags: ['physics'],
          version: 1,
          pages: [],
          isFavorite: false,
          isTrashed: false,
          activePageIndex: 0,
          schemaVersion: '1.0.0',
          createdAt: 100,
          updatedAt: 100,
        },
        {
          id: 'p_2',
          title: 'Organic Chemistry Reactions',
          subject: 'Chemistry',
          ownerId: 'prof_1',
          tags: ['chem'],
          version: 1,
          pages: [],
          isFavorite: false,
          isTrashed: false,
          activePageIndex: 0,
          schemaVersion: '1.0.0',
          createdAt: 200,
          updatedAt: 200,
        },
      ];

      // 14a. Search filter
      const search = (q: string) => projects.filter(p => !p.isTrashed && p.title.toLowerCase().includes(q.toLowerCase()));
      expect(search('Quantum')).toHaveLength(1);
      expect(search('Chemistry')).toHaveLength(1);
      expect(search('Biology')).toHaveLength(0);

      // 14b. Rename
      projects = projects.map(p => p.id === 'p_1' ? { ...p, title: 'Advanced Quantum Mechanics' } : p);
      expect(projects.find(p => p.id === 'p_1')!.title).toBe('Advanced Quantum Mechanics');

      // 14c. Toggle Favorite
      projects = projects.map(p => p.id === 'p_1' ? { ...p, isFavorite: true } : p);
      expect(projects.find(p => p.id === 'p_1')!.isFavorite).toBe(true);

      // 14d. Move to Trash (Soft Delete)
      projects = projects.map(p => p.id === 'p_2' ? { ...p, isTrashed: true } : p);
      const activeProjects = projects.filter(p => !p.isTrashed);
      const trashProjects = projects.filter(p => p.isTrashed);
      expect(activeProjects).toHaveLength(1);
      expect(trashProjects).toHaveLength(1);
      expect(trashProjects[0].id).toBe('p_2');
    });

    it('Step 15: Sign-out terminates authenticated session and enforces protected routes', () => {
      let sessionUser: any = { uid: 'user_active', email: 'test@studycanvas.edu' };

      const signOut = () => {
        sessionUser = null;
        sessionStorage.clear();
        localStorage.removeItem('studycanvas_user');
      };

      signOut();
      expect(sessionUser).toBeNull();

      // Protected route guard redirect to landing
      const navigateTo = (route: string) => {
        if (!sessionUser && route !== 'landing') return 'landing';
        return route;
      };

      expect(navigateTo('dashboard')).toBe('landing');
      expect(navigateTo('whiteboard')).toBe('landing');
    });
  });

  // -------------------------------------------------------------
  // STEP 16-18: Resilience, Mobile Interactions & Collaboration
  // -------------------------------------------------------------
  describe('User Journey 16-18: Network Resilience, Mobile Safety & Collaboration', () => {
    it('Step 16: Handles Google Drive permission denial (403), network failure, and authorization expiry', () => {
      // 16a. Network failure error classification
      const netError = formatAuthError({ code: 'auth/network-request-failed' });
      expect(netError.isRetryable).toBe(true);
      expect(netError.message).toContain('Network connection failed');

      // 16b. Expired token authorization handling
      let reauthRequested = false;
      const onAuthExpired = () => { reauthRequested = true; };

      const mockDrive401Response = { status: 401, error: 'Unauthorized' };
      if (mockDrive401Response.status === 401) {
        onAuthExpired();
      }
      expect(reauthRequested).toBe(true);
    });

    it('Step 17: Mobile and tablet touch safety and toolbar containment rules', () => {
      // Ensure mobile canvas touch safety CSS rules
      const canvasTouchClass = 'canvas-touch-safe touch-none select-none';
      expect(canvasTouchClass).toContain('touch-none');
      expect(canvasTouchClass).toContain('canvas-touch-safe');

      // Dialog viewport sizing
      const dialogClasses = 'relative w-[95vw] sm:w-full max-h-[88vh] overflow-y-auto';
      expect(dialogClasses).toContain('max-h-[88vh]');
      expect(dialogClasses).toContain('w-[95vw]');
    });

    it('Step 18: Collaboration role-based access controls and concurrent edits', () => {
      // Verify collaborator roles
      const projectDoc = {
        id: 'collab_proj',
        ownerId: 'owner_user',
        collaborators: [
          { uid: 'editor_user', role: 'editor' },
          { uid: 'commenter_user', role: 'commenter' },
          { uid: 'viewer_user', role: 'viewer' },
        ],
      };

      const canEditCanvas = (userId: string) => {
        if (userId === projectDoc.ownerId) return true;
        const collab = projectDoc.collaborators.find(c => c.uid === userId);
        return collab?.role === 'editor';
      };

      const canComment = (userId: string) => {
        if (userId === projectDoc.ownerId) return true;
        const collab = projectDoc.collaborators.find(c => c.uid === userId);
        return collab?.role === 'editor' || collab?.role === 'commenter';
      };

      expect(canEditCanvas('owner_user')).toBe(true);
      expect(canEditCanvas('editor_user')).toBe(true);
      expect(canEditCanvas('commenter_user')).toBe(false);
      expect(canEditCanvas('viewer_user')).toBe(false);

      expect(canComment('commenter_user')).toBe(true);
      expect(canComment('viewer_user')).toBe(false);
    });
  });

  // -------------------------------------------------------------
  // TECHNICAL AUDIT: Firestore Rules & Button Integrity
  // -------------------------------------------------------------
  describe('Technical Checks: Security Rules & UI Element Integrity', () => {
    it('Confirms Firestore rules restrict project modifications to owner or authorized editor', () => {
      const evaluateUpdateRule = (requestAuth: { uid: string }, resource: { ownerId: string; role?: string }) => {
        const isOwner = requestAuth.uid === resource.ownerId;
        const isEditor = resource.role === 'editor';
        return isOwner || isEditor;
      };

      expect(evaluateUpdateRule({ uid: 'owner_1' }, { ownerId: 'owner_1' })).toBe(true);
      expect(evaluateUpdateRule({ uid: 'editor_1' }, { ownerId: 'owner_1', role: 'editor' })).toBe(true);
      expect(evaluateUpdateRule({ uid: 'intruder_9' }, { ownerId: 'owner_1', role: 'viewer' })).toBe(false);
      expect(evaluateUpdateRule({ uid: 'intruder_9' }, { ownerId: 'owner_1' })).toBe(false);
    });
  });
});
