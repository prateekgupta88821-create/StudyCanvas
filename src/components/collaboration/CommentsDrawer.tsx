import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useWhiteboard } from '@/hooks/useWhiteboard';
import { useAuth } from '@/hooks/useAuth';
import { collaborationService } from '@/services/collaborationService';
import { WhiteboardComment, CommentReply } from '@/types/collaboration';
import {
  MessageSquare,
  X,
  Send,
  Trash2,
  Check
} from 'lucide-react';

export interface CommentsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommentsDrawer: React.FC<CommentsDrawerProps> = ({ isOpen, onClose }) => {
  const { project, activePage, stagePos, scale } = useWhiteboard();
  const { user } = useAuth();

  const [comments, setComments] = useState<WhiteboardComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [filterMode, setFilterMode] = useState<'all' | 'unresolved'>('unresolved');

  useEffect(() => {
    if (!isOpen || !project.id || !activePage.id) return;

    const unsubscribe = collaborationService.subscribeToComments(
      project.id,
      activePage.id,
      (list) => {
        setComments(list);
      }
    );

    return () => unsubscribe();
  }, [isOpen, project.id, activePage.id]);

  const handleAddComment = async () => {
    const text = newCommentText.trim();
    if (!text) return;

    // Place comment in current viewport center
    const centerX = (window.innerWidth / 2 - stagePos.x) / scale;
    const centerY = (window.innerHeight / 2 - stagePos.y) / scale;

    const comment: WhiteboardComment = {
      id: 'comment_' + Math.random().toString(36).substring(2, 9),
      projectId: project.id,
      pageId: activePage.id,
      x: Math.round(centerX),
      y: Math.round(centerY),
      text,
      authorId: user?.uid || 'guest',
      authorName: user?.displayName || 'Educator',
      authorEmail: user?.email || '',
      authorPhoto: user?.photoURL || undefined,
      createdAt: Date.now(),
      resolved: false,
    };

    await collaborationService.addComment(project.id, comment);
    setNewCommentText('');
  };

  const handleToggleResolve = async (comment: WhiteboardComment) => {
    await collaborationService.toggleResolveComment(
      project.id,
      comment.id,
      comment.resolved,
      user?.displayName || 'Educator'
    );
  };

  const handleAddReply = async (commentId: string) => {
    const text = (replyTextMap[commentId] || '').trim();
    if (!text) return;

    const reply: CommentReply = {
      id: 'reply_' + Math.random().toString(36).substring(2, 9),
      text,
      authorId: user?.uid || 'guest',
      authorName: user?.displayName || 'Educator',
      authorEmail: user?.email || '',
      authorPhoto: user?.photoURL || undefined,
      createdAt: Date.now(),
    };

    await collaborationService.addCommentReply(project.id, commentId, reply);
    setReplyTextMap((prev) => ({ ...prev, [commentId]: '' }));
  };

  const handleDeleteComment = async (commentId: string) => {
    await collaborationService.deleteComment(project.id, commentId);
  };

  const filteredComments = comments.filter((c) => {
    if (filterMode === 'unresolved') return !c.resolved;
    return true;
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ x: 380, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 380, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="fixed top-14 right-0 bottom-0 w-full sm:w-[380px] bg-[#0c1017]/95 border-l border-slate-800/90 shadow-2xl backdrop-blur-2xl z-40 flex flex-col select-none text-slate-100"
      >
        {/* Header */}
        <div className="h-14 px-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-[#090b0e]/70">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Whiteboard Comments</h2>
              <p className="text-[11px] text-slate-400">Page {activePage.title || '1'}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Filter Toggle */}
            <button
              onClick={() =>
                setFilterMode((prev) => (prev === 'unresolved' ? 'all' : 'unresolved'))
              }
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-colors ${
                filterMode === 'unresolved'
                  ? 'bg-lime-500/15 border-lime-500/30 text-lime-400'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              {filterMode === 'unresolved' ? 'Unresolved' : 'All'}
            </button>

            <button
              onClick={onClose}
              className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Comment Thread List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {filteredComments.length > 0 ? (
            filteredComments.map((c) => (
              <div
                key={c.id}
                className={`rounded-2xl border p-3.5 space-y-2.5 transition-all ${
                  c.resolved
                    ? 'border-slate-800/60 bg-[#090b0e]/50 opacity-60'
                    : 'border-slate-800 bg-[#090b0e]'
                }`}
              >
                {/* Author row */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-slate-800 text-lime-400 border border-slate-700 flex items-center justify-center font-bold text-[10px]">
                      {c.authorName ? c.authorName[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-200">{c.authorName}</span>
                      <span className="text-[10px] text-slate-500 ml-1.5">
                        {new Date(c.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleResolve(c)}
                      className={`h-6 px-2 rounded-lg text-[10px] font-semibold flex items-center gap-1 border transition-colors ${
                        c.resolved
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                          : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-emerald-500/30 hover:text-emerald-300'
                      }`}
                    >
                      <Check className="h-2.5 w-2.5" />
                      {c.resolved ? 'Resolved' : 'Resolve'}
                    </button>

                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="h-6 w-6 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition-colors"
                      title="Delete thread"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Main comment text */}
                <p className="text-xs text-slate-200 leading-relaxed pl-8">{c.text}</p>

                {/* Replies */}
                {c.replies && c.replies.length > 0 && (
                  <div className="pl-8 space-y-2 pt-1 border-t border-slate-800/60">
                    {c.replies.map((reply) => (
                      <div key={reply.id} className="text-xs space-y-0.5">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <span className="font-semibold text-slate-300">{reply.authorName}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(reply.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-slate-300 text-xs">{reply.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply input */}
                {!c.resolved && (
                  <div className="pl-8 pt-1 flex gap-1.5">
                    <input
                      type="text"
                      value={replyTextMap[c.id] || ''}
                      onChange={(e) =>
                        setReplyTextMap((prev) => ({ ...prev, [c.id]: e.target.value }))
                      }
                      onKeyDown={(e) => e.key === 'Enter' && handleAddReply(c.id)}
                      placeholder="Reply to thread..."
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
                    />
                    <button
                      onClick={() => handleAddReply(c.id)}
                      className="h-7 px-2 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-semibold flex items-center justify-center"
                    >
                      <Send className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 rounded-2xl border border-slate-800/80 bg-[#090b0e] text-center text-xs text-slate-400">
              No comments on this slide yet. Add feedback or questions for collaborators.
            </div>
          )}
        </div>

        {/* New Comment Input Box at bottom */}
        <div className="p-3.5 border-t border-slate-800 bg-[#090b0e] shrink-0 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              placeholder="Post a comment or feedback on this slide..."
              className="flex-1 bg-[#0c1017] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-lime-500/60"
            />
            <button
              onClick={handleAddComment}
              disabled={!newCommentText.trim()}
              className="px-3 py-2 rounded-xl bg-lime-500 text-slate-950 font-semibold hover:bg-lime-400 text-xs inline-flex items-center gap-1 disabled:opacity-40 transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};
