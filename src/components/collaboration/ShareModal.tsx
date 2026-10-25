import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useWhiteboard } from '@/hooks/useWhiteboard';
import { useAuth } from '@/hooks/useAuth';
import { collaborationService } from '@/services/collaborationService';
import { Collaborator, CollaboratorRole } from '@/types/collaboration';
import {
  UserPlus,
  Mail,
  Shield,
  Trash2,
  Copy,
  Check,
  Crown,
  AlertCircle
} from 'lucide-react';

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const { project } = useWhiteboard();
  const { user } = useAuth();

  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<CollaboratorRole>('editor');
  const [isInviting, setIsInviting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = user?.uid ? user.uid === project.ownerId : true;

  useEffect(() => {
    if (!isOpen || !project.id) return;

    const unsubscribe = collaborationService.subscribeToCollaborators(
      project.id,
      (list) => {
        setCollaborators(list);
      }
    );

    return () => unsubscribe();
  }, [isOpen, project.id]);

  const handleSendInvite = async () => {
    const email = emailInput.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid educational email address.');
      return;
    }

    if (collaborators.some((c) => c.email.toLowerCase() === email)) {
      setError('This user is already invited to this whiteboard.');
      return;
    }

    setIsInviting(true);
    setError(null);

    try {
      await collaborationService.inviteCollaborator(project.id, email, selectedRole);
      setEmailInput('');
    } catch (err: any) {
      setError(err?.message || 'Failed to send collaboration invite.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (collabId: string, newRole: CollaboratorRole) => {
    try {
      await collaborationService.updateCollaboratorRole(project.id, collabId, newRole);
    } catch (err: any) {
      setError(err?.message || 'Failed to update collaborator role.');
    }
  };

  const handleRemove = async (collabId: string) => {
    try {
      await collaborationService.removeCollaborator(project.id, collabId);
    } catch (err: any) {
      setError(err?.message || 'Failed to remove collaborator.');
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Share & Real-Time Collaboration"
      description="Invite educators, teaching assistants, and students to collaborate live."
      maxWidth="max-w-lg"
    >
      <div className="space-y-4 pt-1 text-slate-200">
        {/* Role permission info banner */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c1017] p-3 text-xs text-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-lime-400 shrink-0" />
            <span>Permissions enforced by database rules &amp; Firestore security</span>
          </div>
          <button
            onClick={handleCopyLink}
            className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
          >
            {copiedLink ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            {copiedLink ? 'Link Copied' : 'Copy Link'}
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Invite Input (Only Project Owner) */}
        {isOwner ? (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              Invite by Email Address
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    if (error) setError(null);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendInvite()}
                  placeholder="colleague@university.edu"
                  className="w-full bg-[#090b0e] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-lime-500/60 transition-colors"
                />
              </div>

              {/* Role selector dropdown */}
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as CollaboratorRole)}
                className="bg-[#090b0e] border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-lime-500/60"
              >
                <option value="editor">Editor (Can draw &amp; modify)</option>
                <option value="commenter">Commenter (Can comment)</option>
                <option value="viewer">Viewer (Read-only)</option>
              </select>

              <Button
                variant="default"
                size="sm"
                onClick={handleSendInvite}
                isLoading={isInviting}
                className="bg-lime-500 text-slate-950 hover:bg-lime-400 font-semibold text-xs px-3 shadow-none"
              >
                <UserPlus className="mr-1 h-3.5 w-3.5" />
                Invite
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            You are collaborating with <span className="text-lime-300 font-medium">Editor</span> permissions. Only the project owner can invite or remove participants.
          </div>
        )}

        {/* Collaborators List */}
        <div className="space-y-2 pt-1">
          <span className="text-xs font-semibold text-slate-300 block">
            Project Members ({collaborators.length + 1})
          </span>

          <div className="rounded-2xl border border-slate-800 bg-[#090b0e] divide-y divide-slate-800/60 max-h-56 overflow-y-auto">
            {/* Owner Row */}
            <div className="p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-full bg-lime-500/20 border border-lime-500/40 text-lime-400 flex items-center justify-center font-bold text-xs">
                  {user?.displayName ? user.displayName[0].toUpperCase() : 'O'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-white">
                      {user?.displayName || 'Project Owner'}
                    </span>
                    <span className="text-[10px] text-slate-500">(You)</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{user?.email || 'Owner'}</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                <Crown className="h-3 w-3" /> Owner
              </span>
            </div>

            {/* Invited Members */}
            {collaborators.map((c) => (
              <div key={c.uid} className="p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center font-semibold text-xs">
                    {c.displayName ? c.displayName[0].toUpperCase() : c.email[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-slate-200">{c.displayName}</span>
                      {c.status === 'pending' && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          Pending
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">{c.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isOwner ? (
                    <>
                      <select
                        value={c.role}
                        onChange={(e) => handleRoleChange(c.uid, e.target.value as CollaboratorRole)}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none"
                      >
                        <option value="editor">Editor</option>
                        <option value="commenter">Commenter</option>
                        <option value="viewer">Viewer</option>
                      </select>

                      <button
                        onClick={() => handleRemove(c.uid)}
                        className="h-7 w-7 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition-colors"
                        title="Remove collaborator"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-400 capitalize">
                      {c.role}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Close Button */}
        <div className="flex items-center justify-end pt-2 border-t border-slate-800/80">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-slate-300 hover:text-white"
          >
            Done
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
