/**
 * StudyCanvas Real-Time Collaboration & Role-Based Access Types
 */

import { CanvasElement } from './whiteboard';

export type CollaboratorRole = 'owner' | 'editor' | 'commenter' | 'viewer';

export interface Collaborator {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: CollaboratorRole;
  status: 'active' | 'pending' | 'declined';
  invitedAt: number;
  joinedAt?: number;
}

export interface CollaboratorCursor {
  uid: string;
  displayName: string;
  email: string;
  color: string;
  x: number;
  y: number;
  pageId: string;
  lastActive: number;
}

export interface CommentReply {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorPhoto?: string;
  createdAt: number;
}

export interface WhiteboardComment {
  id: string;
  projectId: string;
  pageId: string;
  x: number;
  y: number;
  text: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorPhoto?: string;
  createdAt: number;
  resolved: boolean;
  resolvedAt?: number;
  resolvedBy?: string;
  replies?: CommentReply[];
}

export interface PresentationFollowState {
  presenterId: string;
  presenterName: string;
  activePageIndex: number;
  activePageId: string;
  stagePos: { x: number; y: number };
  scale: number;
  timestamp: number;
}

export interface ProjectShareSettings {
  isPublicLinkEnabled: boolean;
  publicLinkRole: CollaboratorRole;
  allowCommentsOnPublicLink: boolean;
}
