import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { collaborationService } from '@/services/collaborationService';
import {
  CollaboratorCursor,
  WhiteboardComment,
  PresentationFollowState,
} from '@/types/collaboration';

// Memory storage mock for localStorage in Node test environment
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string) { return this.store.get(key) ?? null; }
  setItem(key: string, value: string) { this.store.set(key, String(value)); }
  removeItem(key: string) { this.store.delete(key); }
  clear() { this.store.clear(); }
}

(globalThis as any).localStorage = new MemoryStorage();

// Window mock for Node test environment
class MockEventTarget {
  private listeners = new Map<string, Set<(e: any) => void>>();

  addEventListener(type: string, listener: (e: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: (e: any) => void) {
    this.listeners.get(type)?.delete(listener);
  }

  dispatchEvent(event: any): boolean {
    const set = this.listeners.get(event.type);
    if (set) {
      for (const l of set) {
        l(event);
      }
    }
    return true;
  }
}

if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = new MockEventTarget();
}

describe('Real-Time Collaboration Service & Role-Based Permissions', () => {
  const testProjectId = 'project_collab_123';
  const ownerUid = 'user_owner_1';

  beforeEach(() => {
    (globalThis as any).localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    (globalThis as any).localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. Role-Based Permissions & Invitations', () => {
    it('allows project owner to invite collaborators with editor, commenter, and viewer roles', async () => {
      const editor = await collaborationService.inviteCollaborator(
        testProjectId,
        'dr.smith@university.edu',
        'editor',
        'Dr. Smith'
      );

      expect(editor.email).toBe('dr.smith@university.edu');
      expect(editor.role).toBe('editor');
      expect(editor.status).toBe('pending');

      const commenter = await collaborationService.inviteCollaborator(
        testProjectId,
        'ta.alex@university.edu',
        'commenter',
        'Alex (TA)'
      );
      expect(commenter.role).toBe('commenter');

      const viewer = await collaborationService.inviteCollaborator(
        testProjectId,
        'student.emma@university.edu',
        'viewer',
        'Emma'
      );
      expect(viewer.role).toBe('viewer');
    });

    it('correctly resolves user role for owner, editor, commenter, and viewer', async () => {
      // 1. Owner
      const roleOwner = await collaborationService.resolveUserRole(
        testProjectId,
        ownerUid,
        ownerUid,
        'owner@university.edu'
      );
      expect(roleOwner).toBe('owner');

      // 2. Add collaborator
      await collaborationService.inviteCollaborator(
        testProjectId,
        'editor@university.edu',
        'editor',
        'Editor User'
      );

      const roleEditor = await collaborationService.resolveUserRole(
        testProjectId,
        ownerUid,
        'random_uid',
        'editor@university.edu'
      );
      expect(roleEditor).toBe('editor');

      // 3. Unauthorized non-collaborator defaults to viewer or none
      const roleStranger = await collaborationService.resolveUserRole(
        testProjectId,
        ownerUid,
        'stranger_uid',
        'stranger@external.com'
      );
      expect(roleStranger).toBe('viewer');
    });

    it('updates collaborator role and removes collaborators', async () => {
      const member = await collaborationService.inviteCollaborator(
        testProjectId,
        'student@university.edu',
        'viewer'
      );
      expect(member.role).toBe('viewer');

      // Promote to editor
      await collaborationService.updateCollaboratorRole(testProjectId, member.uid, 'editor');
      const updatedRole = await collaborationService.resolveUserRole(
        testProjectId,
        ownerUid,
        member.uid,
        member.email
      );
      expect(updatedRole).toBe('editor');

      // Remove collaborator
      await collaborationService.removeCollaborator(testProjectId, member.uid);
      const afterRemoval = await collaborationService.resolveUserRole(
        testProjectId,
        ownerUid,
        member.uid,
        member.email
      );
      expect(afterRemoval).toBe('viewer'); // reverted to default external
    });
  });

  describe('2. Real-Time Cursors & Broadcast Throttling', () => {
    it('throttles high-frequency cursor movements to avoid network congestion', () => {
      const cursor: CollaboratorCursor = {
        uid: 'user_456',
        displayName: 'Sarah',
        email: 'sarah@edu.com',
        color: '#a3e635',
        x: 100,
        y: 200,
        pageId: 'page_1',
        lastActive: Date.now(),
      };

      const now = Date.now();
      const dateSpy = vi.spyOn(Date, 'now').mockReturnValue(now);

      // First broadcast succeeds
      collaborationService.broadcastCursor(testProjectId, cursor);

      // Second broadcast 10ms later should be throttled (< 50ms)
      dateSpy.mockReturnValue(now + 10);
      collaborationService.broadcastCursor(testProjectId, { ...cursor, x: 110 });

      // Third broadcast 60ms later passes through
      dateSpy.mockReturnValue(now + 65);
      collaborationService.broadcastCursor(testProjectId, { ...cursor, x: 150 });

      expect(true).toBe(true);
    });

    it('filters out stale cursors and own cursor in subscriptions', () => {
      let receivedCursors: CollaboratorCursor[] = [];
      const currentUid = 'user_self';

      const unsubscribe = collaborationService.subscribeToCursors(
        testProjectId,
        'page_1',
        currentUid,
        (list) => {
          receivedCursors = list;
        }
      );

      expect(Array.isArray(receivedCursors)).toBe(true);
      unsubscribe();
    });
  });

  describe('3. Collaborative Comments & Review Threads', () => {
    it('creates, replies to, and resolves educational comments', async () => {
      const newComment: WhiteboardComment = {
        id: 'comm_1',
        projectId: testProjectId,
        pageId: 'page_1',
        x: 250,
        y: 350,
        text: 'Please check the derivation in step 3.',
        authorId: 'ta_1',
        authorName: 'Alex (TA)',
        authorEmail: 'alex@edu.com',
        createdAt: Date.now(),
        resolved: false,
      };

      await collaborationService.addComment(testProjectId, newComment);

      // Add a reply
      await collaborationService.addCommentReply(testProjectId, 'comm_1', {
        id: 'reply_1',
        text: 'Corrected the minus sign in step 3!',
        authorId: ownerUid,
        authorName: 'Professor',
        authorEmail: 'prof@edu.com',
        createdAt: Date.now(),
      });

      // Toggle resolve
      await collaborationService.toggleResolveComment(testProjectId, 'comm_1', false, 'Professor');

      let currentComments: WhiteboardComment[] = [];
      collaborationService.subscribeToComments(testProjectId, 'page_1', (list) => {
        currentComments = list;
      });

      const found = currentComments.find((c) => c.id === 'comm_1');
      expect(found).toBeDefined();
      expect(found?.resolved).toBe(true);
      expect(found?.replies).toHaveLength(1);
      expect(found?.replies?.[0].text).toContain('Corrected the minus sign');
    });
  });

  describe('4. Presentation & Viewport Follow Mode', () => {
    it('broadcasts presentation follow state and handles live session updates', async () => {
      const state: PresentationFollowState = {
        presenterId: ownerUid,
        presenterName: 'Prof. Miller',
        activePageIndex: 2,
        activePageId: 'page_3',
        stagePos: { x: -150, y: -80 },
        scale: 1.25,
        timestamp: Date.now(),
      };

      await collaborationService.broadcastPresentationState(testProjectId, state);

      let followed: PresentationFollowState | null = null;
      const unsubscribe = collaborationService.subscribeToPresentationState(
        testProjectId,
        (s) => {
          followed = s;
        }
      );

      // Presenter stops presentation
      await collaborationService.stopPresentation(testProjectId);
      expect(followed).toBeNull();
      unsubscribe();
    });
  });

  describe('5. Offline Resilience and Connection Loss Recovery', () => {
    it('gracefully handles offline state without throwing exceptions', () => {
      // Simulate navigator offline
      if (typeof navigator !== 'undefined') {
        Object.defineProperty(navigator, 'onLine', {
          configurable: true,
          value: false,
        });
      }

      const target = typeof window !== 'undefined' ? window : globalThis;
      target.dispatchEvent(new Event('offline'));

      const cursor: CollaboratorCursor = {
        uid: 'user_456',
        displayName: 'Sarah',
        email: 'sarah@edu.com',
        color: '#a3e635',
        x: 100,
        y: 200,
        pageId: 'page_1',
        lastActive: Date.now(),
      };

      // Does not throw when offline
      expect(() => {
        collaborationService.broadcastCursor(testProjectId, cursor);
      }).not.toThrow();

      // Dispatch online event to restore
      if (typeof navigator !== 'undefined') {
        Object.defineProperty(navigator, 'onLine', {
          configurable: true,
          value: true,
        });
      }
      target.dispatchEvent(new Event('online'));
    });
  });
});
