import { useEffect, useState, useCallback, useMemo } from 'react';
import { WhiteboardProject } from '@/types/whiteboard';
import { firestoreService } from '@/services/firestoreService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

export function useFirestoreProjects() {
  const { user } = useAuth();
  const { success, error: toastError, info } = useToast();
  const [storedProjects, setStoredProjects] = useState<WhiteboardProject[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(user));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribe = firestoreService.subscribeToUserProjects(user.uid, (list) => {
      setStoredProjects(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const projects = useMemo(() => {
    return user ? storedProjects : [];
  }, [user, storedProjects]);

  const saveProject = useCallback(async (project: WhiteboardProject) => {
    try {
      await firestoreService.saveProject(project);
      setStoredProjects((prev) => {
        const idx = prev.findIndex((p) => p.id === project.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = project;
          return updated;
        }
        return [project, ...prev];
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save project');
      toastError(err.message || 'Could not save whiteboard');
      throw err;
    }
  }, [toastError]);

  const renameProject = useCallback(async (id: string, title: string, subject?: string, description?: string) => {
    try {
      const updates: Partial<WhiteboardProject> = { title, updatedAt: Date.now() };
      if (subject !== undefined) updates.subject = subject;
      if (description !== undefined) updates.description = description;

      await firestoreService.updateProjectMeta(id, updates);
      setStoredProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
      success('Whiteboard details updated successfully', 'Saved');
    } catch (err: any) {
      setError(err.message || 'Failed to rename project');
      toastError('Failed to update project metadata');
    }
  }, [success, toastError]);

  const toggleFavorite = useCallback(async (id: string, currentFav = false) => {
    try {
      const nextFav = !currentFav;
      // Optimistic update
      setStoredProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isFavorite: nextFav } : p))
      );
      await firestoreService.toggleFavorite(id, currentFav);
      if (nextFav) {
        info('Added to Favorites');
      } else {
        info('Removed from Favorites');
      }
    } catch {
      // Revert optimistic update
      setStoredProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isFavorite: currentFav } : p))
      );
      toastError('Could not update favorite status');
    }
  }, [info, toastError]);

  const moveToTrash = useCallback(async (id: string, title?: string) => {
    try {
      // Optimistic update
      setStoredProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isTrashed: true, trashedAt: Date.now() } : p))
      );
      await firestoreService.moveToTrash(id);
      success(`"${title || 'Whiteboard'}" moved to Trash. You can restore it anytime.`, 'Moved to Trash');
    } catch {
      setStoredProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isTrashed: false } : p))
      );
      toastError('Failed to move whiteboard to trash');
    }
  }, [success, toastError]);

  const restoreFromTrash = useCallback(async (id: string, title?: string) => {
    try {
      setStoredProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isTrashed: false, trashedAt: undefined } : p))
      );
      await firestoreService.restoreFromTrash(id);
      success(`"${title || 'Whiteboard'}" restored to My Projects`, 'Restored');
    } catch {
      setStoredProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isTrashed: true } : p))
      );
      toastError('Failed to restore whiteboard');
    }
  }, [success, toastError]);

  const duplicateProject = useCallback(async (id: string, customTitle?: string): Promise<WhiteboardProject | null> => {
    try {
      const copy = await firestoreService.duplicateProject(id, customTitle);
      if (copy) {
        setStoredProjects((prev) => [copy, ...prev]);
        success(`Created duplicate: "${copy.title}"`, 'Project Duplicated');
      }
      return copy;
    } catch {
      toastError('Failed to duplicate whiteboard');
      return null;
    }
  }, [success, toastError]);

  const deleteProjectPermanently = useCallback(async (projectId: string) => {
    try {
      await firestoreService.deleteProject(projectId);
      setStoredProjects((prev) => prev.filter((p) => p.id !== projectId));
      success('Whiteboard permanently deleted', 'Deleted');
    } catch (err: any) {
      setError(err.message || 'Failed to delete project');
      toastError('Failed to delete project');
      throw err;
    }
  }, [success, toastError]);

  const emptyTrash = useCallback(async () => {
    if (!user) return;
    try {
      const trashed = storedProjects.filter((p) => p.isTrashed);
      const ids = trashed.map((p) => p.id);
      await firestoreService.emptyTrash(user.uid, ids);
      setStoredProjects((prev) => prev.filter((p) => !p.isTrashed));
      success('Trash bin emptied successfully', 'Trash Cleared');
    } catch {
      toastError('Failed to empty trash');
    }
  }, [user, storedProjects, success, toastError]);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const list = await firestoreService.getUserProjects(user.uid);
      setStoredProjects(list);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh projects');
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    projects,
    loading: user ? loading : false,
    error,
    saveProject,
    renameProject,
    toggleFavorite,
    moveToTrash,
    restoreFromTrash,
    duplicateProject,
    deleteProject: deleteProjectPermanently,
    emptyTrash,
    refresh,
  };
}
