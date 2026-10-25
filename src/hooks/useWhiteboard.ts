import { useContext } from 'react';
import { WhiteboardContext, type WhiteboardContextType } from '@/contexts/WhiteboardContext';

export const useWhiteboard = (): WhiteboardContextType => {
  const context = useContext(WhiteboardContext);
  if (!context) {
    throw new Error('useWhiteboard must be used within a WhiteboardProvider');
  }
  return context;
};
