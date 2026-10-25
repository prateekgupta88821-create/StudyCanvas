import React, { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFirestoreProjects } from '@/hooks/useFirestoreProjects';
import { WhiteboardProject, WhiteboardTemplate } from '@/types/whiteboard';
import { DashboardSidebar, DashboardTab } from '@/components/dashboard/DashboardSidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardFilterBar, SortOption, OwnershipFilter } from '@/components/dashboard/DashboardFilterBar';
import { ProjectCard } from '@/components/dashboard/ProjectCard';
import { CreateProjectModal, CreateProjectFormData } from '@/components/dashboard/CreateProjectModal';
import { RenameProjectModal } from '@/components/dashboard/RenameProjectModal';
import { ConfirmDeleteModal } from '@/components/dashboard/ConfirmDeleteModal';
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { TemplateGallery } from '@/components/dashboard/TemplateGallery';
import { DriveImportModal } from '@/components/dashboard/DriveImportModal';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { exportService } from '@/services/exportService';
import { 
  Plus, 
  Upload, 
  Trash2, 
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface DashboardPageProps {
  onOpenProject: (project: WhiteboardProject) => void;
  onCreateNewProject: (title?: string, subject?: string, template?: WhiteboardTemplate) => void;
  onBackToLanding?: () => void;
}

const DEFAULT_SUBJECTS = [
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
  onBackToLanding: _onBackToLanding,
}) => {
  const { user } = useAuth();
  const {
    projects,
    loading,
    error,
    saveProject,
    renameProject,
    toggleFavorite,
    moveToTrash,
    restoreFromTrash,
    duplicateProject,
    deleteProject,
    emptyTrash,
    refresh,
  } = useFirestoreProjects();

  // Navigation & View state
  const [activeTab, setActiveTab] = useState<DashboardTab>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('updated-desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projectToRename, setProjectToRename] = useState<WhiteboardProject | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<{ project: WhiteboardProject; isPermanent: boolean } | null>(null);
  const [isDriveImportOpen, setIsDriveImportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEmptyTrashConfirmOpen, setIsEmptyTrashConfirmOpen] = useState(false);

  // Pagination / Incremental loading
  const [displayLimit, setDisplayLimit] = useState(12);

  // Calculate tab counts
  const counts = useMemo(() => {
    let all = 0;
    let favorites = 0;
    let trash = 0;

    for (const p of projects) {
      if (p.isTrashed) {
        trash++;
      } else {
        all++;
        if (p.isFavorite) {
          favorites++;
        }
      }
    }

    return { all, favorites, trash };
  }, [projects]);

  // Compute dynamic subject list based on projects
  const availableSubjects = useMemo(() => {
    const set = new Set<string>(DEFAULT_SUBJECTS);
    for (const p of projects) {
      if (p.subject && !p.isTrashed) {
        set.add(p.subject);
      }
    }
    return Array.from(set);
  }, [projects]);

  // Filter & Sort projects
  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        // Tab-level filtering
        if (activeTab === 'trash') {
          if (!p.isTrashed) return false;
        } else {
          // For home, my-projects, shared, favorites: exclude trashed
          if (p.isTrashed) return false;

          if (activeTab === 'favorites' && !p.isFavorite) return false;
          if (activeTab === 'shared' && (!p.sharedWith || p.sharedWith.length === 0)) return false;
          if (activeTab === 'my-projects' && p.ownerId !== user?.uid) return false;
        }

        // Favorites quick toggle
        if (favoritesOnly && !p.isFavorite) return false;

        // Ownership dropdown filter
        if (ownershipFilter === 'owned' && p.ownerId !== user?.uid) return false;
        if (ownershipFilter === 'shared' && (!p.sharedWith || p.sharedWith.length === 0)) return false;

        // Subject filter
        if (selectedSubject !== 'All' && p.subject !== selectedSubject) return false;

        // Global search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = p.title.toLowerCase().includes(q);
          const matchesSubject = p.subject?.toLowerCase().includes(q);
          const matchesDesc = p.description?.toLowerCase().includes(q);
          if (!matchesTitle && !matchesSubject && !matchesDesc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'updated-desc':
            return (b.updatedAt || 0) - (a.updatedAt || 0);
          case 'updated-asc':
            return (a.updatedAt || 0) - (b.updatedAt || 0);
          case 'title-asc':
            return (a.title || '').localeCompare(b.title || '');
          case 'title-desc':
            return (b.title || '').localeCompare(a.title || '');
          case 'created-desc':
            return (b.createdAt || 0) - (a.createdAt || 0);
          default:
            return 0;
        }
      });
  }, [
    projects,
    activeTab,
    favoritesOnly,
    ownershipFilter,
    selectedSubject,
    searchQuery,
    sortBy,
    user?.uid,
  ]);

  const visibleProjects = useMemo(() => {
    return filteredProjects.slice(0, displayLimit);
  }, [filteredProjects, displayLimit]);

  // Handle uploading existing .studycanvas file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await exportService.importFromJSON(file);
      await saveProject(imported);
      await refresh();
      onOpenProject(imported);
    } catch (err: any) {
      alert('Failed to import file: ' + err.message);
    }
  };

  const handleCreateProjectSubmit = (
    _formData: CreateProjectFormData,
    newProject: WhiteboardProject
  ) => {
    saveProject(newProject);
    onOpenProject(newProject);
  };

  const handleCreateFromTemplate = (tmpl: WhiteboardTemplate) => {
    onCreateNewProject(`${tmpl.name} Session`, tmpl.subject, tmpl);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#090b0e] text-slate-100 selection:bg-lime-400 selection:text-slate-950">
      {/* Left Navigation Sidebar */}
      <DashboardSidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setDisplayLimit(12);
        }}
        onCreateNew={() => setIsCreateModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        counts={counts}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <DashboardHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenDriveModal={() => setIsDriveImportOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Scrollable Dashboard Body */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Home Tab Greeting Banner */}
          {activeTab === 'home' && !searchQuery && (
            <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-[#11151e] via-[#0f1422] to-[#121620] p-6 sm:p-8 shadow-2xl">
              <div className="relative z-10 max-w-2xl space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-lime-400/10 border border-lime-400/25 px-3 py-1 text-xs font-semibold text-lime-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Interactive Academic Whiteboard</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-heading">
                  Your Digital Blackboard & Lecture Hall
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Annotate formulas, sketch scientific derivations, structure student notes, and store directly in Google Drive.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <Button
                    variant="lime"
                    size="sm"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="text-xs font-semibold gap-1.5 h-9 px-4"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create New Whiteboard</span>
                  </Button>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".studycanvas,.json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors h-9">
                      <Upload className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
                      <span>Import .studycanvas File</span>
                    </div>
                  </label>
                </div>
              </div>
              {/* Background radial glow */}
              <div className="absolute right-0 top-0 -mr-16 -mt-16 h-72 w-72 rounded-full bg-lime-400/[0.08] blur-3xl pointer-events-none" />
            </div>
          )}

          {/* Quick Starting Template Gallery on Home view */}
          {activeTab === 'home' && !searchQuery && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white font-heading">
                    Quick Starting Templates
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Jump straight into a pre-configured pedagogical layout
                  </p>
                </div>
              </div>
              <TemplateGallery onSelectTemplate={handleCreateFromTemplate} />
            </div>
          )}

          {/* Section Title & Header for Tab */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div>
              <h2 className="text-lg font-bold text-white font-heading flex items-center gap-2">
                {activeTab === 'home' && <span>Recent Whiteboards</span>}
                {activeTab === 'my-projects' && <span>My Whiteboards</span>}
                {activeTab === 'shared' && <span>Shared with Me</span>}
                {activeTab === 'favorites' && <span>Favorite Whiteboards</span>}
                {activeTab === 'trash' && <span>Trash Bin</span>}
              </h2>
              <p className="text-xs text-slate-400">
                {activeTab === 'trash'
                  ? 'Items in Trash can be restored anytime or deleted permanently.'
                  : `Showing ${filteredProjects.length} of ${counts.all} active educational canvases`}
              </p>
            </div>

            {/* Trash Bin Actions */}
            {activeTab === 'trash' && counts.trash > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsEmptyTrashConfirmOpen(true)}
                className="text-xs gap-1.5 h-8"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Empty Trash</span>
              </Button>
            )}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300 flex items-center justify-between">
              <span>{error}</span>
              <Button size="sm" variant="outline" onClick={refresh} className="h-7 text-xs">
                Retry
              </Button>
            </div>
          )}

          {/* Filter, Sort & View Controls */}
          {activeTab !== 'trash' && (
            <DashboardFilterBar
              subjects={availableSubjects}
              selectedSubject={selectedSubject}
              onSelectSubject={setSelectedSubject}
              ownership={ownershipFilter}
              onSelectOwnership={setOwnershipFilter}
              favoritesOnly={favoritesOnly}
              onToggleFavoritesOnly={() => setFavoritesOnly((prev) => !prev)}
              sortBy={sortBy}
              onSelectSortBy={setSortBy}
              viewMode={viewMode}
              onToggleViewMode={setViewMode}
              totalCount={filteredProjects.length}
            />
          )}

          {/* Project List / Grid / Skeletons / Empty State */}
          {loading ? (
            <DashboardSkeleton viewMode={viewMode} count={viewMode === 'grid' ? 8 : 6} />
          ) : filteredProjects.length === 0 ? (
            <DashboardEmptyState
              tab={activeTab}
              searchQuery={searchQuery}
              onClearSearch={() => setSearchQuery('')}
              onCreateNew={() => setIsCreateModalOpen(true)}
            />
          ) : (
            <div className="space-y-4">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {visibleProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      viewMode="grid"
                      isTrashView={activeTab === 'trash'}
                      onOpen={onOpenProject}
                      onRename={(p) => setProjectToRename(p)}
                      onDuplicate={(p) => duplicateProject(p.id)}
                      onToggleFavorite={(id, cur) => toggleFavorite(id, cur)}
                      onMoveToTrash={(id, title) => moveToTrash(id, title)}
                      onRestore={(id, title) => restoreFromTrash(id, title)}
                      onDeletePermanent={(p) => setProjectToDelete({ project: p, isPermanent: true })}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {visibleProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      viewMode="list"
                      isTrashView={activeTab === 'trash'}
                      onOpen={onOpenProject}
                      onRename={(p) => setProjectToRename(p)}
                      onDuplicate={(p) => duplicateProject(p.id)}
                      onToggleFavorite={(id, cur) => toggleFavorite(id, cur)}
                      onMoveToTrash={(id, title) => moveToTrash(id, title)}
                      onRestore={(id, title) => restoreFromTrash(id, title)}
                      onDeletePermanent={(p) => setProjectToDelete({ project: p, isPermanent: true })}
                    />
                  ))}
                </div>
              )}

              {/* Load More Pagination */}
              {filteredProjects.length > displayLimit && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDisplayLimit((prev) => prev + 12)}
                    className="text-xs"
                  >
                    Load More Whiteboards ({filteredProjects.length - displayLimit} remaining)
                  </Button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Create Whiteboard Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProjectSubmit}
        userId={user?.uid || 'guest'}
        userEmail={user?.email}
      />

      {/* Rename / Edit Project Details Modal */}
      <RenameProjectModal
        project={projectToRename}
        isOpen={Boolean(projectToRename)}
        onClose={() => setProjectToRename(null)}
        onRename={renameProject}
      />

      {/* Delete / Move to Trash Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(projectToDelete)}
        onClose={() => setProjectToDelete(null)}
        title={projectToDelete?.project.title || 'Whiteboard'}
        isPermanent={projectToDelete?.isPermanent}
        onConfirm={() => {
          if (projectToDelete) {
            deleteProject(projectToDelete.project.id);
            setProjectToDelete(null);
          }
        }}
      />

      {/* Empty Trash Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isEmptyTrashConfirmOpen}
        onClose={() => setIsEmptyTrashConfirmOpen(false)}
        title="All Trashed Whiteboards"
        isPermanent={true}
        onConfirm={() => {
          emptyTrash();
          setIsEmptyTrashConfirmOpen(false);
        }}
      />

      {/* Google Drive Import Modal */}
      <DriveImportModal
        isOpen={isDriveImportOpen}
        onClose={() => setIsDriveImportOpen(false)}
        onImport={(proj) => {
          saveProject(proj);
          onOpenProject(proj);
        }}
      />

      {/* Preferences & Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
