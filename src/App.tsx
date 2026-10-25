import React, { useState, Suspense, lazy } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { WhiteboardProvider } from '@/contexts/WhiteboardContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { StudyCanvasLoadingScreen } from '@/components/common/StudyCanvasLoadingScreen';
import { WhiteboardProject, WhiteboardTemplate, Page } from '@/types/whiteboard';
import { storage } from '@/utils/storage';
import { useAuth } from '@/hooks/useAuth';

// Performance: Lazy-load heavy route components with Suspense
const LandingPage = lazy(() =>
  import('@/pages/LandingPage').then((m) => ({ default: m.LandingPage }))
);
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const WhiteboardPage = lazy(() =>
  import('@/pages/WhiteboardPage').then((m) => ({ default: m.WhiteboardPage }))
);

function AppContent() {
  const { user, loading } = useAuth();
  const [targetView, setTargetView] = useState<'landing' | 'dashboard' | 'whiteboard'>('landing');
  const [activeProject, setActiveProject] = useState<WhiteboardProject | null>(null);

  // Requirements: Protect dashboard and whiteboard routes.
  // When user is not authenticated, currentView is derived strictly as 'landing'.
  const currentView: 'landing' | 'dashboard' | 'whiteboard' =
    !user && (targetView === 'dashboard' || targetView === 'whiteboard')
      ? 'landing'
      : targetView;

  const handleOpenProject = (project: WhiteboardProject) => {
    if (!user) {
      setTargetView('landing');
      return;
    }
    setActiveProject(project);
    setTargetView('whiteboard');
  };

  const handleCreateNewProject = (
    title = 'New Educational Canvas',
    subject = 'General',
    template?: WhiteboardTemplate
  ) => {
    if (!user) {
      setTargetView('landing');
      return;
    }

    const initialPage: Page = {
      id: 'page-1',
      title: 'Slide 1',
      elements: template?.initialElements || [],
      gridType: template?.gridType || 'dots',
      backgroundColor: '#090d16',
    };

    const newProject: WhiteboardProject = {
      id: 'canvas_' + Math.random().toString(36).substring(2, 9),
      title,
      subject,
      tags: ['Lecture', subject],
      ownerId: user.uid,
      pages: [initialPage],
      activePageIndex: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
    };

    storage.saveProject(newProject);
    setActiveProject(newProject);
    setTargetView('whiteboard');
  };

  // Show a loading screen while authentication status is being resolved to prevent redirect flicker
  if (loading) {
    return <StudyCanvasLoadingScreen message="Resolving secure educator session..." />;
  }

  return (
    <Suspense fallback={<StudyCanvasLoadingScreen message="Loading StudyCanvas..." />}>
      {currentView === 'landing' && (
        <LandingPage
          onOpenCanvas={() => {
            if (user) {
              handleCreateNewProject('Physics & Kinematics Derivation', 'Physics');
            } else {
              setTargetView('landing');
            }
          }}
          onOpenDashboard={() => {
            setTargetView(user ? 'dashboard' : 'landing');
          }}
        />
      )}

      {currentView === 'dashboard' && user && (
        <DashboardPage
          onOpenProject={handleOpenProject}
          onCreateNewProject={handleCreateNewProject}
          onBackToLanding={() => setTargetView('landing')}
        />
      )}

      {currentView === 'whiteboard' && user && activeProject && (
        <WhiteboardProvider initialProject={activeProject}>
          <WhiteboardPage
            onBackToDashboard={() => setTargetView('dashboard')}
          />
        </WhiteboardProvider>
      )}
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
