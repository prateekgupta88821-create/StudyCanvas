import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useWhiteboard } from '@/hooks/useWhiteboard';
import { WhiteboardTemplate } from '@/types/whiteboard';

const ACADEMIC_TEMPLATES: WhiteboardTemplate[] = [
  // 1. Mathematics
  {
    id: 'tpl_math_calculus',
    name: 'Calculus & Integration Board',
    description: 'Cartesian coordinate plane with fundamental theorem of calculus formula card and boundary work area.',
    subject: 'Mathematics',
    icon: 'Sigma',
    gridType: 'coordinate',
    recommendedFor: ['professor', 'student'],
    initialElements: [
      {
        id: 'tpl_calc_formula',
        type: 'formula',
        x: 100,
        y: 40,
        width: 380,
        height: 75,
        latex: '\\int_{a}^{b} f(x) \\, dx = F(b) - F(a)',
        renderedText: 'Fundamental Theorem of Calculus',
        fontSize: 22,
        color: '#a3e635',
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 'tpl_calc_sticky',
        type: 'sticky',
        x: 600,
        y: 40,
        width: 220,
        height: 120,
        text: 'Problem: Evaluate the area under the curve f(x) from x = 0 to x = π.',
        color: '#fef08a',
        createdAt: 1,
        updatedAt: 1,
      },
    ],
  },
  {
    id: 'tpl_math_geometry',
    name: 'Euclidean Geometry & Proofs',
    description: 'Square grid with triangle, circle, and structured Two-Column Proof table layout.',
    subject: 'Mathematics',
    icon: 'Square',
    gridType: 'grid',
    recommendedFor: ['teacher', 'student'],
    initialElements: [
      {
        id: 'tpl_geo_table',
        type: 'table',
        x: 80,
        y: 80,
        width: 480,
        height: 220,
        rows: 4,
        cols: 2,
        headers: ['Statements', 'Reasons'],
        data: [
          ['1. AB ≅ CD and BC ≅ DA', 'Given hypothesis'],
          ['2. AC ≅ AC', 'Reflexive property of congruence'],
          ['3. △ABC ≅ △CDA', 'SSS Congruence Postulate'],
          ['4. ∠B ≅ ∠D', 'CPCTC (Corresponding parts)'],
        ],
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 'tpl_geo_shape',
        type: 'shape',
        shapeType: 'triangle',
        x: 640,
        y: 80,
        width: 180,
        height: 160,
        stroke: '#38bdf8',
        strokeWidth: 2,
        fill: '#38bdf820',
        createdAt: 1,
        updatedAt: 1,
      },
    ],
  },

  // 2. Physics
  {
    id: 'tpl_physics_kinematics',
    name: 'Kinematics & Free-Body Motion',
    description: 'Coordinate grid with motion equations of constant acceleration and vector force diagrams.',
    subject: 'Physics',
    icon: 'Activity',
    gridType: 'coordinate',
    recommendedFor: ['professor', 'teacher', 'student'],
    initialElements: [
      {
        id: 'tpl_phys_formula',
        type: 'formula',
        x: 100,
        y: 40,
        width: 320,
        height: 70,
        latex: 'v = v_0 + at \\quad | \\quad x = x_0 + v_0 t + \\frac{1}{2}at^2',
        renderedText: 'Kinematic Equations',
        fontSize: 20,
        color: '#a3e635',
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 'tpl_phys_sticky',
        type: 'sticky',
        x: 600,
        y: 40,
        width: 220,
        height: 120,
        text: 'Known Variables:\nv₀ = 15 m/s\na = -9.8 m/s²\nFind maximum height h_max',
        color: '#bae6fd',
        createdAt: 1,
        updatedAt: 1,
      },
    ],
  },

  // 3. Chemistry
  {
    id: 'tpl_chem_reactions',
    name: 'Organic Reaction Mechanism',
    description: 'Dotted paper canvas configured with Gibbs Free energy formula and reaction mechanism steps.',
    subject: 'Chemistry',
    icon: 'FlaskConical',
    gridType: 'dots',
    recommendedFor: ['professor', 'student'],
    initialElements: [
      {
        id: 'tpl_chem_formula',
        type: 'formula',
        x: 100,
        y: 40,
        width: 300,
        height: 70,
        latex: '\\Delta G^{\\circ} = \\Delta H^{\\circ} - T\\Delta S^{\\circ}',
        renderedText: 'Gibbs Free Energy',
        fontSize: 22,
        color: '#34d399',
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 'tpl_chem_table',
        type: 'table',
        x: 100,
        y: 160,
        width: 500,
        height: 180,
        rows: 3,
        cols: 3,
        headers: ['Reactants', 'Catalyst / Conditions', 'Major Product'],
        data: [
          ['Alkene (C=C) + HBr', 'Room Temperature', 'Alkyl Bromide (Markovnikov)'],
          ['Primary Alcohol', 'PCC / CH₂Cl₂', 'Aldehyde (Oxidation)'],
          ['Carboxylic Acid + Amine', 'DCC / Coupling', 'Amide Bond + H₂O'],
        ],
        createdAt: 1,
        updatedAt: 1,
      },
    ],
  },

  // 4. Computer Science / Programming
  {
    id: 'tpl_cs_algorithm',
    name: 'Algorithm Flowchart & Architecture',
    description: 'Structured computer science flowchart with Start, Input, Decision, and Output nodes.',
    subject: 'Computer Science',
    icon: 'Binary',
    gridType: 'grid',
    recommendedFor: ['professor', 'student'],
    initialElements: [
      {
        id: 'node_start',
        type: 'flowchart',
        nodeType: 'terminator',
        label: 'START',
        x: 200,
        y: 50,
        width: 140,
        height: 55,
        fill: '#12161f',
        stroke: '#a3e635',
        strokeWidth: 2,
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 'node_input',
        type: 'flowchart',
        nodeType: 'io',
        label: 'Input Array & Key',
        x: 200,
        y: 140,
        width: 150,
        height: 55,
        fill: '#12161f',
        stroke: '#38bdf8',
        strokeWidth: 2,
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 'node_decision',
        type: 'flowchart',
        nodeType: 'decision',
        label: 'Found Match?',
        x: 205,
        y: 235,
        width: 140,
        height: 80,
        fill: '#12161f',
        stroke: '#fbbf24',
        strokeWidth: 2,
        createdAt: 1,
        updatedAt: 1,
      },
    ],
  },

  // 5. Lecture Notes (Cornell Notes)
  {
    id: 'tpl_cornell_notes',
    name: 'Cornell Notes Academic System',
    description: 'Standard academic layout with left Cues/Keywords column, right Notes area, and bottom Summary section.',
    subject: 'Lecture Notes',
    icon: 'BookOpen',
    gridType: 'ruled',
    recommendedFor: ['student', 'professor', 'teacher'],
    initialElements: [
      {
        id: 'tpl_cornell_cue',
        type: 'sticky',
        x: 80,
        y: 60,
        width: 200,
        height: 380,
        color: '#e9d5ff',
        text: 'Cues & Questions:\n\n• Key Term 1?\n• What causes this reaction?\n• Big Picture summary?',
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 'tpl_cornell_notes',
        type: 'text',
        x: 320,
        y: 60,
        width: 480,
        fontSize: 18,
        fontFamily: 'Inter, sans-serif',
        fontColor: '#f1f5f9',
        text: 'Lecture Notes:\n\n1. Main concept introduction.\n2. Detailed experimental observations.\n3. Formulas and proof derivations.\n4. Questions to review before exam.',
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 'tpl_cornell_summary',
        type: 'sticky',
        x: 80,
        y: 470,
        width: 720,
        height: 100,
        color: '#fef08a',
        text: 'Summary: One or two sentences capturing the high-level takeaways of this entire lecture.',
        createdAt: 1,
        updatedAt: 1,
      },
    ],
  },

  // 6. Revision / Flashcard
  {
    id: 'tpl_revision_quadrant',
    name: 'Exam Revision 4-Quadrant Matrix',
    description: 'Four quadrant board for Formulas, Key Definitions, Pitfalls to Avoid, and Practice Problems.',
    subject: 'Revision',
    icon: 'LayoutTemplate',
    gridType: 'grid',
    recommendedFor: ['student'],
    initialElements: [
      { id: 'q1', type: 'sticky', x: 80, y: 60, width: 280, height: 180, color: '#bbf7d0', text: '1. Essential Formulas:\n\n• E = mc²\n• F = ma\n• p = mv', createdAt: 1, updatedAt: 1 },
      { id: 'q2', type: 'sticky', x: 400, y: 60, width: 280, height: 180, color: '#bae6fd', text: '2. Core Definitions:\n\n• Conservation of Momentum\n• Inertia and Mass', createdAt: 1, updatedAt: 1 },
      { id: 'q3', type: 'sticky', x: 80, y: 270, width: 280, height: 180, color: '#fed7aa', text: '3. Common Pitfalls & Traps:\n\n• Forgetting sign conventions\n• Unit conversion (cm vs m)', createdAt: 1, updatedAt: 1 },
      { id: 'q4', type: 'sticky', x: 400, y: 270, width: 280, height: 180, color: '#e9d5ff', text: '4. Practice Problems to Solve:\n\n• 2024 Exam Question 3\n• Textbook Problem 12.4', createdAt: 1, updatedAt: 1 },
    ],
  },
];

export const TemplateSelectorModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { applyTemplate } = useWhiteboard();
  const [selectedSubject, setSelectedSubject] = useState<string>('All');

  const subjects = ['All', 'Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'Lecture Notes', 'Revision'];

  const filtered = selectedSubject === 'All'
    ? ACADEMIC_TEMPLATES
    : ACADEMIC_TEMPLATES.filter(t => t.subject === selectedSubject);

  const handleSelectTemplate = (template: WhiteboardTemplate) => {
    applyTemplate(template);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Educational Board Templates"
      description="Choose from curated educational whiteboard starters for lectures, problem-solving, and study sessions."
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4 pt-1 text-slate-100">
        {/* Subject filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {subjects.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
                selectedSubject === sub
                  ? 'bg-lime-500 text-slate-950 font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        {/* Template Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[60vh] overflow-y-auto pr-1">
          {filtered.map((tpl) => (
            <div
              key={tpl.id}
              onClick={() => handleSelectTemplate(tpl)}
              className="p-4 rounded-2xl border border-slate-800 bg-[#0c1017] hover:border-lime-400/60 hover:bg-[#12161f] cursor-pointer transition-all flex flex-col justify-between group shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-lime-400 bg-lime-500/10 px-2 py-0.5 rounded-md border border-lime-500/20">
                    {tpl.subject}
                  </span>
                  <span className="text-[10px] text-slate-500 capitalize">
                    {tpl.gridType} paper
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-white group-hover:text-lime-300 transition-colors mb-1.5">
                  {tpl.name}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {tpl.description}
                </p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {tpl.initialElements?.length || 0} pre-loaded elements
                </span>
                <span className="text-xs font-semibold text-lime-400 flex items-center gap-1">
                  Use Template &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 flex justify-end border-t border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
