import React from 'react';
import { 
  Square, 
  Grid3X3, 
  FileText, 
  Compass, 
  Atom, 
  Music, 
  Presentation,
  Sparkles
} from 'lucide-react';
import { WhiteboardTemplate } from '@/types/whiteboard';
import { EDUCATIONAL_TEMPLATES } from '@/config/constants';

export interface TemplateGalleryProps {
  onSelectTemplate: (template: WhiteboardTemplate) => void;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({ onSelectTemplate }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Grid3X3': return <Grid3X3 className="h-5 w-5 text-indigo-400" />;
      case 'FileText': return <FileText className="h-5 w-5 text-amber-400" />;
      case 'Compass': return <Compass className="h-5 w-5 text-sky-400" />;
      case 'Atom': return <Atom className="h-5 w-5 text-emerald-400" />;
      case 'Presentation': return <Presentation className="h-5 w-5 text-purple-400" />;
      case 'Music': return <Music className="h-5 w-5 text-pink-400" />;
      default: return <Square className="h-5 w-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            Start from an Educational Template
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {EDUCATIONAL_TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.id}
            onClick={() => onSelectTemplate(tmpl)}
            className="group flex flex-col justify-between p-4 rounded-2xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-850 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-200 text-left"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="rounded-xl bg-slate-800/80 p-2.5 border border-slate-700/60 group-hover:scale-105 transition-transform">
                  {getIcon(tmpl.icon)}
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {tmpl.subject}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                {tmpl.name}
              </h4>
              <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {tmpl.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
              <span>Grid: {tmpl.gridType}</span>
              <span className="text-indigo-400 font-medium group-hover:translate-x-0.5 transition-transform">Use &rarr;</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
