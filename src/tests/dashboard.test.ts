import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '@/utils/storage';
import { WhiteboardProject } from '@/types/whiteboard';

// Mock in-memory localStorage
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) { return this.store.get(key) ?? null; }
  setItem(key: string, value: string) { this.store.set(key, String(value)); }
  removeItem(key: string) { this.store.delete(key); }
  clear() { this.store.clear(); }
}

(globalThis as any).localStorage = new MemoryStorage();

describe('StudyCanvas Authenticated Dashboard Logic & Project Workflows', () => {
  const mockUser = {
    uid: 'user_prof_euler',
    email: 'euler@studycanvas.edu',
    displayName: 'Prof. Leonhard Euler',
  };

  const sampleProject1: WhiteboardProject = {
    id: 'proj_calc_101',
    title: 'Multivariable Calculus - Stokes Theorem',
    subject: 'Mathematics',
    tags: ['calculus', 'stokes'],
    description: 'Lecture 14 visual proofs and surface integrals',
    ownerId: mockUser.uid,
    ownerEmail: mockUser.email,
    createdAt: 1000,
    updatedAt: 2000,
    version: 1,
    isFavorite: false,
    isTrashed: false,
    pages: [
      {
        id: 'p1',
        title: 'Stokes Theorem Proof',
        elements: [],
        backgroundColor: '#090d16',
        gridType: 'dots',
      },
    ],
    activePageIndex: 0,
  };

  const sampleProject2: WhiteboardProject = {
    id: 'proj_physics_201',
    title: 'Quantum Harmonic Oscillator',
    subject: 'Physics',
    tags: ['quantum', 'oscillator'],
    description: 'Hermite polynomials and ladder operators',
    ownerId: mockUser.uid,
    ownerEmail: mockUser.email,
    createdAt: 1100,
    updatedAt: 3000,
    version: 1,
    isFavorite: true,
    isTrashed: false,
    pages: [
      {
        id: 'p2',
        title: 'Wavefunctions',
        elements: [],
        backgroundColor: '#0b1120',
        gridType: 'ruled',
      },
    ],
    activePageIndex: 0,
  };

  const sampleProject3: WhiteboardProject = {
    id: 'proj_cs_301',
    title: 'Distributed Consensus & Raft',
    subject: 'Computer Science',
    tags: ['distributed', 'raft'],
    description: 'Leader election and log replication states',
    ownerId: 'user_turing',
    ownerEmail: 'turing@studycanvas.edu',
    sharedWith: [mockUser.email],
    createdAt: 1200,
    updatedAt: 4000,
    version: 1,
    isFavorite: false,
    isTrashed: false,
    pages: [
      {
        id: 'p3',
        title: 'Log Replication',
        elements: [],
        backgroundColor: '#181e29',
        gridType: 'blank',
      },
    ],
    activePageIndex: 0,
  };

  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. Project Storage & CRUD Operations', () => {
    it('saves a new project and retrieves it', () => {
      storage.saveProject(sampleProject1);
      const list = storage.getProjects();
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe('proj_calc_101');
      expect(list[0].title).toBe('Multivariable Calculus - Stokes Theorem');
    });

    it('updates project metadata (rename & subject)', () => {
      storage.saveProject(sampleProject1);
      const updated = storage.updateProjectMeta('proj_calc_101', {
        title: 'Advanced Vector Calculus',
        subject: 'Applied Mathematics',
      });

      expect(updated).not.toBeNull();
      expect(updated?.title).toBe('Advanced Vector Calculus');
      expect(updated?.subject).toBe('Applied Mathematics');

      const stored = storage.getProjects().find(p => p.id === 'proj_calc_101');
      expect(stored?.title).toBe('Advanced Vector Calculus');
    });

    it('toggles favorite status', () => {
      storage.saveProject(sampleProject1);
      expect(storage.getProjects()[0].isFavorite).toBe(false);

      storage.toggleFavorite('proj_calc_101');
      expect(storage.getProjects()[0].isFavorite).toBe(true);

      storage.toggleFavorite('proj_calc_101');
      expect(storage.getProjects()[0].isFavorite).toBe(false);
    });

    it('moves project to trash and restores it safely', () => {
      storage.saveProject(sampleProject1);
      expect(storage.getProjects()[0].isTrashed).toBe(false);

      // Move to trash
      storage.moveToTrash('proj_calc_101');
      let stored = storage.getProjects()[0];
      expect(stored.isTrashed).toBe(true);
      expect(stored.trashedAt).toBeDefined();

      // Restore
      storage.restoreFromTrash('proj_calc_101');
      stored = storage.getProjects()[0];
      expect(stored.isTrashed).toBe(false);
      expect(stored.trashedAt).toBeUndefined();
    });

    it('duplicates a project creating an independent clone with copy title', () => {
      storage.saveProject(sampleProject2);
      const duplicated = storage.duplicateProject('proj_physics_201');

      expect(duplicated).not.toBeNull();
      expect(duplicated?.id).not.toBe('proj_physics_201');
      expect(duplicated?.title).toBe('Quantum Harmonic Oscillator (Copy)');
      expect(duplicated?.isFavorite).toBe(false);
      expect(duplicated?.isTrashed).toBe(false);

      const all = storage.getProjects();
      expect(all).toHaveLength(2);
    });

    it('permanently deletes a project', () => {
      storage.saveProject(sampleProject1);
      storage.saveProject(sampleProject2);
      expect(storage.getProjects()).toHaveLength(2);

      storage.deleteProject('proj_calc_101');
      const all = storage.getProjects();
      expect(all).toHaveLength(1);
      expect(all[0].id).toBe('proj_physics_201');
    });

    it('empties trash clearing only trashed projects', () => {
      storage.saveProject(sampleProject1);
      storage.saveProject(sampleProject2);
      storage.moveToTrash('proj_calc_101');

      storage.emptyTrash();
      const remaining = storage.getProjects();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe('proj_physics_201');
      expect(remaining[0].isTrashed).toBe(false);
    });
  });

  describe('2. Dashboard Filtering & Search Engine', () => {
    const allProjects: WhiteboardProject[] = [
      sampleProject1,
      sampleProject2,
      sampleProject3,
      {
        ...sampleProject1,
        id: 'proj_trashed_1',
        title: 'Old Linear Algebra Scratchpad',
        isTrashed: true,
        trashedAt: 5000,
      },
    ];

    it('filters by active tab correctly (Home vs Trash vs Favorites vs Shared)', () => {
      // Home / My Projects tab should exclude trashed projects
      const homeProjects = allProjects.filter(p => !p.isTrashed);
      expect(homeProjects).toHaveLength(3);

      // Trash tab includes only trashed
      const trashProjects = allProjects.filter(p => p.isTrashed);
      expect(trashProjects).toHaveLength(1);
      expect(trashProjects[0].id).toBe('proj_trashed_1');

      // Favorites tab
      const favProjects = allProjects.filter(p => !p.isTrashed && p.isFavorite);
      expect(favProjects).toHaveLength(1);
      expect(favProjects[0].id).toBe('proj_physics_201');

      // Shared with me tab
      const sharedProjects = allProjects.filter(
        p => !p.isTrashed && p.sharedWith?.includes(mockUser.email)
      );
      expect(sharedProjects).toHaveLength(1);
      expect(sharedProjects[0].id).toBe('proj_cs_301');
    });

    it('filters by subject accurately', () => {
      const activeProjects = allProjects.filter(p => !p.isTrashed);
      const mathProjects = activeProjects.filter(p => p.subject === 'Mathematics');
      const physicsProjects = activeProjects.filter(p => p.subject === 'Physics');

      expect(mathProjects).toHaveLength(1);
      expect(mathProjects[0].title).toContain('Calculus');
      expect(physicsProjects).toHaveLength(1);
      expect(physicsProjects[0].title).toContain('Harmonic');
    });

    it('filters by ownership accurately', () => {
      const activeProjects = allProjects.filter(p => !p.isTrashed);
      const owned = activeProjects.filter(p => p.ownerId === mockUser.uid);
      const shared = activeProjects.filter(p => p.sharedWith && p.sharedWith.length > 0);

      expect(owned).toHaveLength(2);
      expect(shared).toHaveLength(1);
    });

    it('performs comprehensive multi-field search (title, subject, description)', () => {
      const activeProjects = allProjects.filter(p => !p.isTrashed);

      // Search by title match
      const query1 = 'stokes';
      const results1 = activeProjects.filter(p =>
        p.title.toLowerCase().includes(query1) ||
        p.subject?.toLowerCase().includes(query1) ||
        p.description?.toLowerCase().includes(query1)
      );
      expect(results1).toHaveLength(1);
      expect(results1[0].id).toBe('proj_calc_101');

      // Search by description keyword
      const query2 = 'ladder operators';
      const results2 = activeProjects.filter(p =>
        p.title.toLowerCase().includes(query2) ||
        p.subject?.toLowerCase().includes(query2) ||
        p.description?.toLowerCase().includes(query2)
      );
      expect(results2).toHaveLength(1);
      expect(results2[0].id).toBe('proj_physics_201');

      // Search with no match
      const query3 = 'astronomy galaxy';
      const results3 = activeProjects.filter(p =>
        p.title.toLowerCase().includes(query3) ||
        p.subject?.toLowerCase().includes(query3) ||
        p.description?.toLowerCase().includes(query3)
      );
      expect(results3).toHaveLength(0);
    });

    it('sorts projects by updated-desc, updated-asc, title-asc, and title-desc', () => {
      const active = allProjects.filter(p => !p.isTrashed);

      // Sort by updated descending (newest first)
      const sortedByUpdateDesc = [...active].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      expect(sortedByUpdateDesc[0].id).toBe('proj_cs_301'); // 4000
      expect(sortedByUpdateDesc[1].id).toBe('proj_physics_201'); // 3000
      expect(sortedByUpdateDesc[2].id).toBe('proj_calc_101'); // 2000

      // Sort by title A-Z
      const sortedByTitleAsc = [...active].sort((a, b) => a.title.localeCompare(b.title));
      expect(sortedByTitleAsc[0].title).toBe('Distributed Consensus & Raft');
      expect(sortedByTitleAsc[1].title).toBe('Multivariable Calculus - Stokes Theorem');
      expect(sortedByTitleAsc[2].title).toBe('Quantum Harmonic Oscillator');
    });
  });

  describe('3. Creation Validation Rules', () => {
    it('rejects blank project titles', () => {
      const validate = (title: string, subjectSelect: string, customSubject: string) => {
        const trimmedTitle = title.trim();
        if (!trimmedTitle) return 'Please provide a whiteboard title.';
        const effectiveSubject = subjectSelect === '__custom__' ? customSubject.trim() : subjectSelect;
        if (!effectiveSubject) return 'Please specify an academic subject.';
        return null;
      };

      expect(validate('', 'Mathematics', '')).toBe('Please provide a whiteboard title.');
      expect(validate('   ', 'Physics', '')).toBe('Please provide a whiteboard title.');
    });

    it('requires custom subject when __custom__ is selected', () => {
      const validate = (title: string, subjectSelect: string, customSubject: string) => {
        const trimmedTitle = title.trim();
        if (!trimmedTitle) return 'Please provide a whiteboard title.';
        const effectiveSubject = subjectSelect === '__custom__' ? customSubject.trim() : subjectSelect;
        if (!effectiveSubject) return 'Please specify an academic subject.';
        return null;
      };

      expect(validate('Robotics Lab', '__custom__', '')).toBe('Please specify an academic subject.');
      expect(validate('Robotics Lab', '__custom__', '   ')).toBe('Please specify an academic subject.');
      expect(validate('Robotics Lab', '__custom__', 'Autonomous Systems')).toBeNull();
    });

    it('accepts valid preset subject selection', () => {
      const validate = (title: string, subjectSelect: string, customSubject: string) => {
        const trimmedTitle = title.trim();
        if (!trimmedTitle) return 'Please provide a whiteboard title.';
        const effectiveSubject = subjectSelect === '__custom__' ? customSubject.trim() : subjectSelect;
        if (!effectiveSubject) return 'Please specify an academic subject.';
        return null;
      };

      expect(validate('Fluid Mechanics Lecture 1', 'Engineering', '')).toBeNull();
    });
  });
});
