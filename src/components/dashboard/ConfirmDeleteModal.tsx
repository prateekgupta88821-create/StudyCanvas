import React from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  isPermanent?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  isPermanent = false,
}) => {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isPermanent ? 'Permanently Delete Whiteboard?' : 'Move Whiteboard to Trash?'}
      description={
        isPermanent
          ? `Are you sure you want to permanently delete "${title}"? This action is irreversible and all slides will be permanently erased.`
          : `"${title}" will be moved to the Trash Bin. You can restore it anytime or empty the trash later.`
      }
    >
      <div className="space-y-4 pt-2">
        <div className={`flex items-start gap-3 rounded-xl p-3 border ${
          isPermanent
            ? 'bg-red-500/10 border-red-500/30 text-red-300'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
        }`}>
          {isPermanent ? (
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          ) : (
            <Trash2 className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          )}
          <p className="text-xs leading-relaxed">
            {isPermanent
              ? 'Warning: All slides, drawings, formulas, and local backups will be permanently purged from your account.'
              : 'Items in Trash can be restored to your active projects list whenever you need them.'}
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={isPermanent ? 'destructive' : 'primary'}
            size="sm"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={!isPermanent ? 'bg-amber-600 hover:bg-amber-500 text-white border-none' : ''}
          >
            {isPermanent ? 'Delete Permanently' : 'Move to Trash'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
