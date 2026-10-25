import React, { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestoreProjects } from '@/hooks/useFirestoreProjects';
import { WhiteboardProject, WhiteboardTemplate } from '@/types/whiteboard';
import { TemplateGallery } from '@/components/dashboard/TemplateGallery';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { DriveImportModal } from '@/components/dashboard/DriveImportModal';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { AuthModal } from '@/components/auth/AuthModal';
import { UserMenu } from '@/components/auth/UserMenu';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog } from '@/components/ui/Dialog';
import { exportService } from '@/services/exportService';
import { storage } from '@/utils/storage';
import { 
  Plus, 
  Search, 
  HardDrive, 
  Upload, 
  Layers, 
  GraduationCap, 
  BookOpen
} from 'lucide-react';

export interface DashboardPageProps {
  onOpenProject: (project: WhiteboardProject) => void;
  onCreateNewProject: (title?: string, subject?: string, template?: WhiteboardTemplate) => void;
  onBackToLanding?: () => void;
}

const SUBJECT_FILTERS = [
  'All',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Computer Science',
  'Biology',
  'General',
];

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenProject,
  onCreateNewProject,
  onBackToLanding,
}) => {
  const { user } = useAuth();
  const { projects, deleteProject, refresh } = useFirestoreProjects();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [isDriveImportOpen, setIsDriveImportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Mathematics');

  // Filter projects by search query and subject
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch = 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.subject && p.subject.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesSubject = 
        selectedSubject === 'All' || p.subject === selectedSubject;
      return matchesSearch && matchesSubject;
    });
  }, [projects, searchQuery, selectedSubject]);

  // Handle uploading existing .studycanvas file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await exportService.importFromJSON(file);
      storage.saveProject(imported);
      await refresh();
      onOpenProject(imported);
    } catch (err: any) {
      alert('Failed to import file: ' + err.message);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreateModalOpen(false);
    onCreateNewProject(newTitle || 'Untitled Lecture Whiteboard', newSubject);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-y-auto selection:bg-indigo-500 selection:text-white">
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl px-6 py-3.5 flex items-center justify-between">
        <button
          onClick={onBackToLanding}
          className="flex items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 rounded-lg p-1 group"
        >
          <img src="/logo.svg" alt="StudyCanvas" className="h-9 w-9 group-hover:scale-105 transition-transform" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white group-hover:text-lime-400 transition-colors">
                StudyCanvas
              </span>
              <span className="rounded-full bg-lime-400/10 px-2 py-0.5 text-[10px] font-semibold text-lime-400 border border-lime-400/25">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Interactive Whiteboards for Schools & Universities
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDriveImportOpen(true)}
            className="text-xs h-9 border-slate-750"
          >
            <HardDrive className="mr-1.5 h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Google Drive</span>
          </Button>

          <label className="cursor-pointer">
            <input
              type="file"
              accept=".studycanvas,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="inline-flex items-center justify-center rounded-xl border border-slate-750 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors h-9">
              <Upload className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
              <span className="hidden sm:inline">Import File</span>
            </div>
          </label>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="text-xs h-9 font-semibold"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New Canvas
          </Button>

          <div className="pl-1 border-l border-slate-800">
            <UserMenu onOpenSettings={() => setIsSettingsOpen(true)} />
          </div>
        </div>
      </header>

      {/* Main Content Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">
        {/* Banner summary */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 sm:p-8 shadow-2xl">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300">
              <GraduationCap className="h-3.5 w-3.5" />
              <span>Welcome back, {user?.displayName || 'Educator'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Your Digital Blackboard, Lecture Hall, and Study Room
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Create rich presentations, annotate mathematics formulas, illustrate scientific diagrams, and keep your lecture notes seamlessly synchronized with Google Drive.
            </p>
          </div>
          {/* Subtle decorative glow */}
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-72 w-72 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
        </div>

        {/* Template Gallery */}
        <TemplateGallery
          onSelectTemplate={(tmpl) => {
            onCreateNewProject(`${tmpl.name} Session`, tmpl.subject, tmpl);
          }}
        />

        {/* Recent Whiteboards Section */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-400" />
                <span>Your Whiteboard Sessions</span>
              </h3>
              <p className="text-xs text-slate-400">
                {projects.length} {projects.length === 1 ? 'project' : 'projects'} saved
              </p>
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-72">
              <Input
                type="text"
                placeholder="Search lectures or subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="h-4 w-4" />}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Subject Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {SUBJECT_FILTERS.map((subj) => (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
                  selectedSubject === subj
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
                }`}
              >
                {subj}
              </button>
            ))}
          </div>

          {/* Projects Grid */}
          {filteredProjects.length === 0 ? (
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-12 text-center text-slate-400">
              <Layers className="h-10 w-10 mx-auto text-slate-600 mb-3" />
              <h4 className="text-sm font-semibold text-slate-300">No Whiteboards Found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                {searchQuery
                  ? `No whiteboards matching "${searchQuery}". Try clearing search.`
                  : 'Start by creating your first lecture canvas or pick an educational template above.'}
              </p>
              <Button
                variant="default"
                size="sm"
                onClick={() => onCreateNewProject('First Lecture Canvas', 'General')}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Create First Canvas
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProjects.map((proj) => (
                <ProjectCard
                  key={proj.id}
                  project={proj}
                  onOpen={onOpenProject}
                  onDelete={deleteProject}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal Dialogs */}
      <DriveImportModal
        isOpen={isDriveImportOpen}
        onClose={() => setIsDriveImportOpen(false)}
        onImport={(proj) => {
          onOpenProject(proj);
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* Create Project Modal */}
      <Dialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Whiteboard"
        description="Set up a new lecture canvas session with your desired academic subject."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Whiteboard Title
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Linear Algebra: Vector Spaces"
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Academic Subject
            </label>
            <select
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Biology">Biology</option>
              <option value="General">General Education</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Canvas
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
