import { WhiteboardProject } from '@/types/whiteboard';
import { UserPreferences, DEFAULT_PREFERENCES } from '@/types/settings';

const LOCAL_PROJECTS_KEY = 'studycanvas_local_projects';
const PREFERENCES_KEY = 'studycanvas_user_preferences';

export const storage = {
  getProjects(): WhiteboardProject[] {
    try {
      const data = localStorage.getItem(LOCAL_PROJECTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveProject(project: WhiteboardProject): void {
    try {
      const projects = this.getProjects();
      const index = projects.findIndex(p => p.id === project.id);
      if (index >= 0) {
        projects[index] = { ...project, updatedAt: Date.now() };
      } else {
        projects.unshift({ ...project, createdAt: project.createdAt || Date.now(), updatedAt: Date.now() });
      }
      localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  },

  updateProjectMeta(id: string, updates: Partial<WhiteboardProject>): WhiteboardProject | null {
    try {
      const projects = this.getProjects();
      const index = projects.findIndex(p => p.id === id);
      if (index >= 0) {
        projects[index] = { ...projects[index], ...updates, updatedAt: Date.now() };
        localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
        return projects[index];
      }
      return null;
    } catch (e) {
      console.warn('Storage update error:', e);
      return null;
    }
  },

  toggleFavorite(id: string): WhiteboardProject | null {
    const projects = this.getProjects();
    const target = projects.find(p => p.id === id);
    if (!target) return null;
    return this.updateProjectMeta(id, { isFavorite: !target.isFavorite });
  },

  moveToTrash(id: string): WhiteboardProject | null {
    return this.updateProjectMeta(id, { isTrashed: true, trashedAt: Date.now() });
  },

  restoreFromTrash(id: string): WhiteboardProject | null {
    return this.updateProjectMeta(id, { isTrashed: false, trashedAt: undefined });
  },

  duplicateProject(id: string, customTitle?: string): WhiteboardProject | null {
    const projects = this.getProjects();
    const source = projects.find(p => p.id === id);
    if (!source) return null;

    const copy: WhiteboardProject = {
      ...source,
      id: 'canvas_' + Math.random().toString(36).substring(2, 9),
      title: customTitle || `${source.title} (Copy)`,
      isFavorite: false,
      isTrashed: false,
      trashedAt: undefined,
      driveFileId: undefined,
      driveWebViewLink: undefined,
      driveRevisionId: undefined,
      driveSyncedAt: undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
    };

    this.saveProject(copy);
    return copy;
  },

  deleteProject(id: string): void {
    try {
      const projects = this.getProjects().filter(p => p.id !== id);
      localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
    } catch (e) {
      console.warn('Storage delete error:', e);
    }
  },

  emptyTrash(ownerId?: string): void {
    try {
      const projects = this.getProjects().filter(p => {
        if (ownerId && p.ownerId !== ownerId) return true;
        return !p.isTrashed;
      });
      localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
    } catch (e) {
      console.warn('Storage empty trash error:', e);
    }
  },

  getPreferences(): UserPreferences {
    try {
      const data = localStorage.getItem(PREFERENCES_KEY);
      return data ? { ...DEFAULT_PREFERENCES, ...JSON.parse(data) } : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  },

  savePreferences(prefs: Partial<UserPreferences>): UserPreferences {
    try {
      const current = this.getPreferences();
      const updated = { ...current, ...prefs };
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }
};
