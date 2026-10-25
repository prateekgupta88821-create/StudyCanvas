import React from 'react';
import { 
  Compass, 
  Grid3X3, 
  Sigma, 
  HardDrive, 
  Flame, 
  Layers, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const FeatureGrid: React.FC = () => {
  const features = [
    {
      icon: <Compass className="h-6 w-6 text-lime-400" />,
      title: 'Infinite Vector Drawing Engine',
      description:
        'Powered by Konva.js with Catmull-Rom spline smoothing. Draw physics vectors, geometric diagrams, and freehand handwriting at buttery-smooth 60 FPS.',
      highlights: ['Sub-millisecond pen latency', 'Catmull-Rom curve interpolation', 'High-DPI Retina export'],
    },
    {
      icon: <Grid3X3 className="h-6 w-6 text-lime-400" />,
      title: 'Curated Academic Templates',
      description:
        'Skip setup time. Start with precision Cartesian grids for algebra, ruled lines for handwriting, isometric lattices for organic chemistry, or Cornell notes for revision.',
      highlights: ['Cartesian math grids', 'Chemistry hex lattices', 'Structured Cornell blocks'],
    },
    {
      icon: <Sigma className="h-6 w-6 text-lime-400" />,
      title: 'Verified Math & Formula Stamper',
      description:
        'Stamp verified mathematical formulas, integrals, and physics laws onto the board with a single click, or insert custom LaTeX expressions with instant formatting.',
      highlights: ['Calculus & physics presets', 'Instant LaTeX notation', 'Typography formatting'],
    },
    {
      icon: <HardDrive className="h-6 w-6 text-lime-400" />,
      title: 'Google Drive Native File Storage',
      description:
        'Your whiteboards are saved directly as `.studycanvas` files in your personal or university Google Drive. Zero vendor lock-in and complete ownership of your work.',
      highlights: ['Drive v3 multipart sync', 'Private drive.file scope', 'Full offline fallback'],
    },
    {
      icon: <Flame className="h-6 w-6 text-lime-400" />,
      title: 'Laser Pointer for Live Lectures',
      description:
        'Highlight critical derivation steps on classroom projectors, interactive smartboards, or Zoom/Meet screen shares with an auto-vanishing laser trail.',
      highlights: ['Auto-fading light trail', 'Zero canvas clutter', 'Perfect for screen shares'],
    },
    {
      icon: <Layers className="h-6 w-6 text-lime-400" />,
      title: 'Multi-Slide Lecture Architecture',
      description:
        'Never lose your place on an overwhelming canvas. Group topics into distinct lecture slides with thumbnail navigation, slide reordering, and PDF export.',
      highlights: ['Visual slide drawer', 'Independent slide grids', '1-Click landscape PDF export'],
    },
  ];

  return (
    <section id="features" className="py-20 md:py-28 relative scroll-mt-16 bg-[#0a0c10]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-lime-400/25 bg-lime-400/5 px-3 py-1 text-xs font-semibold text-lime-400 mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Built Specifically for STEM & Academia</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-heading">
            Everything You Need to Explain, Solve, and Inspire
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
            Generic whiteboards are built for agile meetings and sticky note brainstorms. 
            StudyCanvas is engineered ground-up for rigorous derivations, lesson plans, and deep academic learning.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-[#11141a]/80 p-7 hover:border-lime-400/40 hover:bg-[#151922] transition-all duration-200"
            >
              <div>
                {/* Icon box with subtle lime hover glow */}
                <div className="inline-flex rounded-xl bg-lime-400/10 border border-lime-400/20 p-3 mb-5 transition-transform group-hover:scale-105">
                  {feat.icon}
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-lime-300 transition-colors">
                  {feat.title}
                </h3>

                <p className="mt-2.5 text-sm text-slate-400 leading-relaxed">
                  {feat.description}
                </p>
              </div>

              {/* Highlights checklist */}
              <ul className="mt-6 pt-5 border-t border-slate-800/60 space-y-2">
                {feat.highlights.map((h, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs font-medium text-slate-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-lime-400 shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
