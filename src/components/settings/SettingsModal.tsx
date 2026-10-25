import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { storage } from '@/utils/storage';
import { UserPreferences } from '@/types/settings';
import { EducatorRole } from '@/types/auth';
import { 
  GraduationCap, 
  HardDrive, 
  Check, 
  Flame, 
  Building 
} from 'lucide-react';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { updateRole, driveAccessToken } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(() => storage.getPreferences());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleRoleChange = async (role: EducatorRole) => {
    setPreferences(prev => ({ ...prev, role }));
    await updateRole(role);
  };

  const handleSave = () => {
    storage.savePreferences(preferences);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="StudyCanvas Educator Settings"
      description="Customize your academic role, whiteboard default layouts, and Google Drive auto-sync preferences."
      maxWidth="max-w-xl"
    >
      <div className="space-y-5 pt-2">
        {/* Academic Role Selection */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Educator Role
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: 'teacher', title: 'School Teacher', desc: 'Curriculum & Whiteboards' },
                { id: 'professor', title: 'College Prof', desc: 'Advanced Lectures & Proofs' },
                { id: 'student', title: 'Student', desc: 'Note-taking & Problem Solving' },
              ] as const
            ).map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => handleRoleChange(role.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  preferences.role === role.id
                    ? 'border-indigo-500 bg-indigo-500/10 text-white ring-1 ring-indigo-500'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <GraduationCap className={`h-4 w-4 ${preferences.role === role.id ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-semibold">{role.title}</span>
                </div>
                <p className="text-[10px] text-slate-500">{role.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Institution & Department */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
            Institution or School Name
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <Building className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={preferences.institutionName}
              onChange={(e) => setPreferences(prev => ({ ...prev, institutionName: e.target.value }))}
              placeholder="e.g. Stanford University or Lincoln High School"
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 pl-10 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3 pt-1">
          {/* Drive auto-save */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <HardDrive className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-200">Auto-Save to Google Drive</p>
                <p className="text-[11px] text-slate-400">
                  {driveAccessToken ? 'Enabled for your connected account.' : 'Connect Google Drive to enable auto-backup.'}
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.autoSaveToDrive && Boolean(driveAccessToken)}
              disabled={!driveAccessToken}
              onChange={(e) => setPreferences(prev => ({ ...prev, autoSaveToDrive: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-750 text-indigo-600 focus:ring-indigo-500"
            />
          </div>

          {/* Laser trail */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                <Flame className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-200">Laser Pointer Vanishing Trail</p>
                <p className="text-[11px] text-slate-400">
                  Illuminates presentation points on projector or screen share.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.showLaserTrail}
              onChange={(e) => setPreferences(prev => ({ ...prev, showLaserTrail: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-750 text-indigo-600 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            {savedSuccess ? (
              <>
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Saved
              </>
            ) : (
              'Save Preferences'
            )}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
