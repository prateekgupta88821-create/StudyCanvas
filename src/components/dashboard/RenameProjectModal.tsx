import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { WhiteboardProject } from '@/types/whiteboard';

interface RenameProjectModalProps {
  project: WhiteboardProject | null;
  isOpen: boolean;
  onClose: () => void;
  onRename: (id: string, newTitle: string, newSubject?: string, newDescription?: string) => Promise<void>;
}

const RenameProjectModalInner: React.FC<{
  project: WhiteboardProject;
  isOpen: boolean;
  onClose: () => void;
  onRename: (id: string, newTitle: string, newSubject?: string, newDescription?: string) => Promise<void>;
}> = ({ project, isOpen, onClose, onRename }) => {
  const [title, setTitle] = useState(project.title || '');
  const [subject, setSubject] = useState(project.subject || 'General');
  const [description, setDescription] = useState(project.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onRename(project.id, title.trim(), subject.trim(), description.trim());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Rename & Edit Whiteboard"
      description="Update the title, academic subject, or description for this session."
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-1.5">
            Whiteboard Title <span className="text-lime-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-1.5">
            Academic Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Mathematics, Physics, Chemistry..."
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400 resize-none"
          />
        </div>

        <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="lime" size="sm" isLoading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </Dialog>
  );
};

export const RenameProjectModal: React.FC<RenameProjectModalProps> = ({
  project,
  isOpen,
  onClose,
  onRename,
}) => {
  if (!project || !isOpen) return null;

  return (
    <RenameProjectModalInner
      key={project.id}
      project={project}
      isOpen={isOpen}
      onClose={onClose}
      onRename={onRename}
    />
  );
};
