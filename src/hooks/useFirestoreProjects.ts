import { useEffect, useState, useCallback } from 'react';
import { WhiteboardProject } from '@/types/whiteboard';
import { firestoreService } from '@/services/firestoreService';
import { useAuth } from '@/contexts/AuthContext';

export function useFirestoreProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<WhiteboardProject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = firestoreService.subscribeToUserProjects(user.uid, (list) => {
      setProjects(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const deleteProject = useCallback(async (projectId: string) => {
    try {
      await firestoreService.deleteProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
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
      setProjects(list);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh projects');
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    projects,
    loading,
    error,
    deleteProject,
    refresh,
  };
}
