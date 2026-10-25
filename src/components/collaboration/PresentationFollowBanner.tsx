import React, { useEffect, useState } from 'react';
import { useWhiteboard } from '@/hooks/useWhiteboard';
import { useAuth } from '@/hooks/useAuth';
import { collaborationService } from '@/services/collaborationService';
import { PresentationFollowState } from '@/types/collaboration';
import { Eye, EyeOff, Radio } from 'lucide-react';

export const PresentationFollowBanner: React.FC = () => {
  const {
    project,
    isPresentationMode,
    stagePos,
    scale,
    activePageIndex,
    activePage,
    setStagePos,
    setScale,
    switchPage,
  } = useWhiteboard();
  const { user } = useAuth();

  const [activeSession, setActiveSession] = useState<PresentationFollowState | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  // Presenter broadcasts their state
  useEffect(() => {
    if (!project.id || !isPresentationMode) {
      if (activeSession?.presenterId === user?.uid) {
        collaborationService.stopPresentation(project.id);
      }
      return;
    }

    const followState: PresentationFollowState = {
      presenterId: user?.uid || 'guest',
      presenterName: user?.displayName || 'Educator',
      activePageIndex,
      activePageId: activePage.id,
      stagePos,
      scale,
      timestamp: Date.now(),
    };

    collaborationService.broadcastPresentationState(project.id, followState);
  }, [
    isPresentationMode,
    project.id,
    stagePos,
    scale,
    activePageIndex,
    activePage.id,
    user?.uid,
    user?.displayName,
  ]);

  // Viewers listen to presentation state
  useEffect(() => {
    if (!project.id) return;

    const unsubscribe = collaborationService.subscribeToPresentationState(
      project.id,
      (session) => {
        setActiveSession(session);

        // If following, sync viewport and page automatically
        if (session && isFollowing && session.presenterId !== user?.uid) {
          if (typeof session.activePageIndex === 'number') {
            switchPage(session.activePageIndex);
          }
          if (session.stagePos) {
            setStagePos(session.stagePos);
          }
          if (session.scale) {
            setScale(session.scale);
          }
        }
      }
    );

    return () => unsubscribe();
  }, [project.id, isFollowing, user?.uid, switchPage, setStagePos, setScale]);

  // Don't show banner to presenter themselves
  if (!activeSession || activeSession.presenterId === user?.uid || isPresentationMode) {
    return null;
  }

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 select-none animate-in fade-in slide-in-from-top-3">
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-lime-500/40 bg-[#0c1017]/95 shadow-2xl backdrop-blur-xl text-xs text-slate-200">
        <Radio className="h-3.5 w-3.5 text-lime-400 animate-pulse" />
        <span className="font-semibold text-white">{activeSession.presenterName}</span>
        <span className="text-slate-400">is presenting live</span>

        <button
          onClick={() => setIsFollowing((prev) => !prev)}
          className={`ml-1.5 px-2.5 py-0.5 rounded-full font-semibold text-[11px] transition-colors flex items-center gap-1 ${
            isFollowing
              ? 'bg-lime-500 text-slate-950 hover:bg-lime-400'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
        >
          {isFollowing ? (
            <>
              <Eye className="h-3 w-3" /> Following
            </>
          ) : (
            <>
              <EyeOff className="h-3 w-3" /> Follow Viewport
            </>
          )}
        </button>
      </div>
    </div>
  );
};
