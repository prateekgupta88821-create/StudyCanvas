import React, { useEffect, useState } from 'react';
import { useWhiteboard } from '@/hooks/useWhiteboard';
import { useAuth } from '@/hooks/useAuth';
import { collaborationService } from '@/services/collaborationService';
import { CollaboratorCursor } from '@/types/collaboration';
import { motion, AnimatePresence } from 'motion/react';

export const CollaboratorCursors: React.FC = () => {
  const { project, activePage, scale, stagePos, isPresentationMode } = useWhiteboard();
  const { user } = useAuth();
  const [cursors, setCursors] = useState<CollaboratorCursor[]>([]);

  const currentUid = user?.uid || 'guest';

  useEffect(() => {
    if (!project?.id || !activePage?.id) return;

    const unsubscribe = collaborationService.subscribeToCursors(
      project.id,
      activePage.id,
      currentUid,
      (remoteCursors) => {
        setCursors(remoteCursors);
      }
    );

    return () => unsubscribe();
  }, [project?.id, activePage?.id, currentUid]);

  if (isPresentationMode || cursors.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      <AnimatePresence>
        {cursors.map((cursor) => {
          // Project canvas coordinates to screen coordinates
          const screenX = cursor.x * scale + stagePos.x;
          const screenY = cursor.y * scale + stagePos.y;

          const color = cursor.color || '#38bdf8';

          return (
            <motion.div
              key={cursor.uid}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: screenX,
                y: screenY,
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                type: 'spring',
                damping: 30,
                stiffness: 300,
                mass: 0.3,
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
              }}
              className="flex items-start gap-1 select-none"
            >
              {/* Pointer Arrow SVG */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-md"
              >
                <path
                  d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
                  fill={color}
                  stroke="#090b0e"
                  strokeWidth="1.5"
                />
              </svg>

              {/* Name Tag Badge */}
              <div
                style={{ backgroundColor: color }}
                className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-slate-950 shadow-lg whitespace-nowrap -mt-1 ml-0.5"
              >
                {cursor.displayName || cursor.email?.split('@')[0] || 'Collaborator'}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
