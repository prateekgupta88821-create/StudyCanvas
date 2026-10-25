import { EducatorRole } from './auth';
import { GridType } from './whiteboard';

export interface UserPreferences {
  role: EducatorRole;
  defaultGrid: GridType;
  defaultStrokeColor: string;
  defaultStrokeWidth: number;
  autoSaveToDrive: boolean;
  theme: 'dark' | 'light' | 'system';
  enableSoundEffects: boolean;
  showLaserTrail: boolean;
  institutionName: string;
  defaultSubject: string;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  role: 'teacher',
  defaultGrid: 'dots',
  defaultStrokeColor: '#6366f1',
  defaultStrokeWidth: 3,
  autoSaveToDrive: true,
  theme: 'dark',
  enableSoundEffects: true,
  showLaserTrail: true,
  institutionName: '',
  defaultSubject: 'General',
};
