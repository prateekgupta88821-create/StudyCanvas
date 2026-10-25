import { useState } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { WhiteboardProvider } from '@/contexts/WhiteboardContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { LandingPage } from '@/pages/LandingPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { WhiteboardPage } from '@/pages/WhiteboardPage';
import { WhiteboardProject, WhiteboardTemplate, Page } from '@/types/whiteboard';
import { storage } from '@/utils/storage';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'whiteboard'>('landing');
  const [activeProject, setActiveProject] = useState<WhiteboardProject | null>(null);

  const handleOpenProject = (project: WhiteboardProject) => {
    setActiveProject(project);
    setCurrentView('whiteboard');
  };

  const handleCreateNewProject = (
    title = 'New Educational Canvas',
    subject = 'General',
    template?: WhiteboardTemplate
  ) => {
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
      ownerId: 'guest',
      pages: [initialPage],
      activePageIndex: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
    };

    storage.saveProject(newProject);
    setActiveProject(newProject);
    setCurrentView('whiteboard');
  };

  return (
    <ErrorBoundary>
      <AuthProvider>
        {currentView === 'landing' && (
          <LandingPage
            onOpenCanvas={() => handleCreateNewProject('Physics & Kinematics Derivation', 'Physics')}
            onOpenDashboard={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'dashboard' && (
          <DashboardPage
            onOpenProject={handleOpenProject}
            onCreateNewProject={handleCreateNewProject}
            onBackToLanding={() => setCurrentView('landing')}
          />
        )}

        {currentView === 'whiteboard' && activeProject && (
          <WhiteboardProvider initialProject={activeProject}>
            <WhiteboardPage
              onBackToDashboard={() => setCurrentView('dashboard')}
            />
          </WhiteboardProvider>
        )}
      </AuthProvider>
    </ErrorBoundary>
  );
}
