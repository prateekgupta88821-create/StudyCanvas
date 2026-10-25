import { useEffect, useState, useCallback, useMemo } from 'react';
import { WhiteboardProject } from '@/types/whiteboard';
import { firestoreService } from '@/services/firestoreService';
import { useAuth } from '@/hooks/useAuth';

export function useFirestoreProjects() {
  const { user } = useAuth();
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

  const deleteProject = useCallback(async (projectId: string) => {
    try {
      await firestoreService.deleteProject(projectId);
      setStoredProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete project');
      throw err;
    }
  }, []);

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
    deleteProject,
    refresh,
  };
}
