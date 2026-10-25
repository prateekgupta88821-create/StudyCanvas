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
        projects[index] = project;
      } else {
        projects.unshift(project);
      }
      localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  },

  deleteProject(id: string): void {
    try {
      const projects = this.getProjects().filter(p => p.id !== id);
      localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
    } catch (e) {
      console.warn('Storage delete error:', e);
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
