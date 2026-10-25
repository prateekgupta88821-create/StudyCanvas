import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { 
  FileText, 
  Grid3X3, 
  Network, 
  GitMerge, 
  Presentation, 
  Square,
  AlertCircle
} from 'lucide-react';
import { GridType, Page, CanvasElement, WhiteboardProject } from '@/types/whiteboard';

export interface CreateProjectFormData {
  title: string;
  subject: string;
  description: string;
  templateId: 'blank' | 'lined' | 'grid' | 'mindmap' | 'flowchart' | 'slides';
  backgroundColor: string;
}

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: CreateProjectFormData, initialProject: WhiteboardProject) => void;
  userId: string;
  userEmail?: string | null;
}

const TEMPLATE_OPTIONS = [
  {
    id: 'blank' as const,
    name: 'Blank Canvas',
    desc: 'Infinite freehand drawing and sketching',
    icon: Square,
    gridType: 'blank' as GridType,
  },
  {
    id: 'lined' as const,
    name: 'Lined Notes',
    desc: 'Ruled lines for mathematical derivations and lecture notes',
    icon: FileText,
    gridType: 'ruled' as GridType,
  },
  {
    id: 'grid' as const,
    name: 'Coordinate Grid',
    desc: 'Dot grid ideal for geometric plots and graph theory',
    icon: Grid3X3,
    gridType: 'dots' as GridType,
  },
  {
    id: 'mindmap' as const,
    name: 'Mind Map',
    desc: 'Visual knowledge trees and conceptual brainstorming',
    icon: Network,
    gridType: 'blank' as GridType,
  },
  {
    id: 'flowchart' as const,
    name: 'Algorithm Flowchart',
    desc: 'Flow blocks, conditionals, and logical diagrams',
    icon: GitMerge,
    gridType: 'dots' as GridType,
  },
  {
    id: 'slides' as const,
    name: 'Lecture Slides',
    desc: 'Structured 16:9 slides for academic presentations',
    icon: Presentation,
    gridType: 'lines' as GridType,
  },
];

const BACKGROUND_OPTIONS = [
  { id: '#090d16', label: 'Dark Charcoal', colorClass: 'bg-[#090d16]' },
  { id: '#0b1120', label: 'Deep Navy', colorClass: 'bg-[#0b1120]' },
  { id: '#0d1410', label: 'Classic Blackboard', colorClass: 'bg-[#0d1410]' },
  { id: '#181e29', label: 'Clean Slate', colorClass: 'bg-[#181e29]' },
  { id: '#1a1829', label: 'Night Violet', colorClass: 'bg-[#1a1829]' },
];

const PRESET_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Computer Science',
  'Biology',
  'Engineering',
  'History & Humanities',
  'General Education',
  '__custom__',
];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  userId,
  userEmail,
}) => {
  const [title, setTitle] = useState('');
  const [subjectSelect, setSubjectSelect] = useState('Mathematics');
  const [customSubject, setCustomSubject] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<'blank' | 'lined' | 'grid' | 'mindmap' | 'flowchart' | 'slides'>('blank');
  const [backgroundColor, setBackgroundColor] = useState('#090d16');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setValidationError('Please provide a whiteboard title.');
      return;
    }

    const effectiveSubject =
      subjectSelect === '__custom__' ? customSubject.trim() : subjectSelect;

    if (!effectiveSubject) {
      setValidationError('Please specify an academic subject.');
      return;
    }

    // Determine initial template elements
    const templateConfig = TEMPLATE_OPTIONS.find((t) => t.id === selectedTemplate) || TEMPLATE_OPTIONS[0];
    const initialElements: CanvasElement[] = [];

    if (selectedTemplate === 'mindmap') {
      initialElements.push(
        {
          id: 'node-central',
          type: 'sticky',
          x: 400,
          y: 260,
          width: 180,
          height: 100,
          text: trimmedTitle + '\n(Central Topic)',
          color: '#a3e635',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'node-child-1',
          type: 'sticky',
          x: 180,
          y: 160,
          width: 140,
          height: 80,
          text: 'Key Concept 1',
          color: '#38bdf8',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'node-child-2',
          type: 'sticky',
          x: 640,
          y: 160,
          width: 140,
          height: 80,
          text: 'Key Concept 2',
          color: '#c084fc',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
      );
    } else if (selectedTemplate === 'slides') {
      initialElements.push({
        id: 'slide-title',
        type: 'text',
        x: 120,
        y: 100,
        text: trimmedTitle,
        fontSize: 36,
        fontFamily: 'Outfit, sans-serif',
        fontColor: '#ffffff',
        fontWeight: 'bold',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    const initialPage: Page = {
      id: 'page-1',
      title: 'Slide 1',
      elements: initialElements,
      gridType: templateConfig.gridType,
      backgroundColor,
    };

    const newProject: WhiteboardProject = {
      id: 'canvas_' + Math.random().toString(36).substring(2, 9),
      title: trimmedTitle,
      subject: effectiveSubject,
      description: description.trim() || undefined,
      tags: ['Lecture', effectiveSubject],
      ownerId: userId,
      ownerEmail: userEmail || undefined,
      isFavorite: false,
      isTrashed: false,
      pages: [initialPage],
      activePageIndex: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
    };

    onSubmit(
      {
        title: trimmedTitle,
        subject: effectiveSubject,
        description: description.trim(),
        templateId: selectedTemplate,
        backgroundColor,
      },
      newProject
    );

    // Reset form
    setTitle('');
    setSubjectSelect('Mathematics');
    setCustomSubject('');
    setDescription('');
    setSelectedTemplate('blank');
    setBackgroundColor('#090d16');
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Whiteboard"
      description="Configure your educational canvas, subject classification, and starting layout."
    >
      <form onSubmit={handleSubmit} className="space-y-5 pt-2">
        {/* Title Input */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-1.5">
            Whiteboard Title <span className="text-lime-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Kinematics Derivation & Vector Calculus"
            required
            autoFocus
            className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400 transition-colors"
          />
        </div>

        {/* Subject Selection & Custom Subject */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-1.5">
              Academic Subject <span className="text-lime-400">*</span>
            </label>
            <select
              value={subjectSelect}
              onChange={(e) => setSubjectSelect(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs sm:text-sm text-white focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400"
            >
              {PRESET_SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s === '__custom__' ? '+ Custom Subject...' : s}
                </option>
              ))}
            </select>
          </div>

          {subjectSelect === '__custom__' && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-150">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-1.5">
                Custom Subject Name <span className="text-lime-400">*</span>
              </label>
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="e.g. Quantum Computing"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400"
              />
            </div>
          )}
        </div>

        {/* Optional Description */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-1.5">
            Lesson Description or Notes <span className="text-slate-500 text-[10px] lowercase font-normal">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief overview of lecture topics, formulas, or student reminders..."
            rows={2}
            className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:border-lime-400 focus:outline-none focus:ring-1 focus:ring-lime-400 transition-colors resize-none"
          />
        </div>

        {/* Canvas Starting Template Selector */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-2">
            Canvas Starting Template
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {TEMPLATE_OPTIONS.map((tmpl) => {
              const Icon = tmpl.icon;
              const isSelected = selectedTemplate === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => setSelectedTemplate(tmpl.id)}
                  className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-lime-400 bg-lime-400/10 text-white ring-1 ring-lime-400'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`h-4 w-4 mb-1.5 ${isSelected ? 'text-lime-400' : 'text-slate-400'}`} />
                  <span className="text-xs font-semibold text-slate-200 leading-tight">{tmpl.name}</span>
                  <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{tmpl.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Initial Background Choice */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-2">
            Initial Background Canvas Theme
          </label>
          <div className="flex items-center gap-3">
            {BACKGROUND_OPTIONS.map((bg) => (
              <button
                key={bg.id}
                type="button"
                onClick={() => setBackgroundColor(bg.id)}
                title={bg.label}
                className={`relative flex items-center justify-center h-8 w-8 rounded-full border-2 transition-transform ${
                  backgroundColor === bg.id
                    ? 'border-lime-400 scale-110 shadow-md shadow-lime-400/20'
                    : 'border-slate-700 hover:scale-105'
                } ${bg.colorClass}`}
              >
                {backgroundColor === bg.id && (
                  <span className="h-2 w-2 rounded-full bg-lime-400" />
                )}
              </button>
            ))}
            <span className="text-xs text-slate-400">
              {BACKGROUND_OPTIONS.find((b) => b.id === backgroundColor)?.label}
            </span>
          </div>
        </div>

        {validationError && (
          <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="lime" size="sm" className="font-semibold px-4">
            Create & Open Whiteboard
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
