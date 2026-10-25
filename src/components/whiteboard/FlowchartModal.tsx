import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useWhiteboard } from '@/hooks/useWhiteboard';
import { FlowchartNodeElement, FlowchartNodeType } from '@/types/whiteboard';
import { Plus, Sparkles } from 'lucide-react';

const FLOWCHART_TEMPLATES = [
  {
    name: 'Standard Algorithm',
    nodes: [
      { type: 'terminator' as FlowchartNodeType, label: 'Start', xOffset: 0, yOffset: 0 },
      { type: 'process' as FlowchartNodeType, label: 'Input Data', xOffset: 0, yOffset: 90 },
      { type: 'decision' as FlowchartNodeType, label: 'Is Valid?', xOffset: 0, yOffset: 190 },
      { type: 'process' as FlowchartNodeType, label: 'Process Result', xOffset: 0, yOffset: 300 },
      { type: 'terminator' as FlowchartNodeType, label: 'End', xOffset: 0, yOffset: 390 },
    ],
  },
  {
    name: 'Scientific Method',
    nodes: [
      { type: 'terminator' as FlowchartNodeType, label: 'Observation', xOffset: 0, yOffset: 0 },
      { type: 'process' as FlowchartNodeType, label: 'Hypothesis', xOffset: 0, yOffset: 90 },
      { type: 'process' as FlowchartNodeType, label: 'Experiment', xOffset: 0, yOffset: 180 },
      { type: 'decision' as FlowchartNodeType, label: 'Supported?', xOffset: 0, yOffset: 270 },
      { type: 'terminator' as FlowchartNodeType, label: 'Conclusion', xOffset: 0, yOffset: 370 },
    ],
  },
];

export const FlowchartModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { addElement, addElements, scale, stagePos } = useWhiteboard();
  const [nodeType, setNodeType] = useState<FlowchartNodeType>('process');
  const [nodeLabel, setNodeLabel] = useState('Process Step');

  const handleInsertSingleNode = () => {
    const centerX = (window.innerWidth / 2 - stagePos.x) / scale - 80;
    const centerY = (window.innerHeight / 2 - stagePos.y) / scale - 40;

    const newNode: FlowchartNodeElement = {
      id: 'flow_' + Math.random().toString(36).substring(2, 9),
      type: 'flowchart',
      nodeType,
      label: nodeLabel.trim() || 'Step',
      x: Math.max(20, centerX),
      y: Math.max(20, centerY),
      width: nodeType === 'decision' ? 140 : 150,
      height: nodeType === 'decision' ? 80 : 60,
      fill: '#12161f',
      stroke: '#a3e635',
      strokeWidth: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addElement(newNode);
    onClose();
  };

  const handleInsertSequence = (seq: typeof FLOWCHART_TEMPLATES[0]) => {
    const centerX = (window.innerWidth / 2 - stagePos.x) / scale - 75;
    const centerY = (window.innerHeight / 2 - stagePos.y) / scale - 200;

    const elements: FlowchartNodeElement[] = seq.nodes.map((n) => ({
      id: 'flow_' + Math.random().toString(36).substring(2, 9),
      type: 'flowchart',
      nodeType: n.type,
      label: n.label,
      x: Math.max(20, centerX + n.xOffset),
      y: Math.max(20, centerY + n.yOffset),
      width: n.type === 'decision' ? 140 : 150,
      height: n.type === 'decision' ? 80 : 60,
      fill: '#12161f',
      stroke: '#a3e635',
      strokeWidth: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));

    addElements(elements);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Flowchart & Logic Diagram Builder"
      description="Create algorithm steps, decision trees, and workflow blocks."
      maxWidth="max-w-xl"
    >
      <div className="space-y-4 pt-1 text-slate-100">
        {/* Node configuration */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c1017] p-3.5 space-y-3">
          <span className="text-xs font-semibold text-slate-300 block">Single Flowchart Block</span>

          {/* Node Type Selector */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { type: 'process' as FlowchartNodeType, label: 'Process', desc: 'Rectangle' },
              { type: 'decision' as FlowchartNodeType, label: 'Decision', desc: 'Diamond' },
              { type: 'terminator' as FlowchartNodeType, label: 'Start / End', desc: 'Pill' },
              { type: 'io' as FlowchartNodeType, label: 'Input / Output', desc: 'Slanted' },
            ].map((t) => (
              <button
                key={t.type}
                onClick={() => {
                  setNodeType(t.type);
                  if (t.type === 'terminator') setNodeLabel('Start / End');
                  else if (t.type === 'decision') setNodeLabel('Condition?');
                  else if (t.type === 'io') setNodeLabel('Input Data');
                  else setNodeLabel('Process Step');
                }}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  nodeType === t.type
                    ? 'border-lime-400 bg-lime-500/10 text-lime-300 font-semibold'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-xs">{t.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{t.desc}</div>
              </button>
            ))}
          </div>

          {/* Label Input */}
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Block Label</label>
            <input
              type="text"
              value={nodeLabel}
              onChange={(e) => setNodeLabel(e.target.value)}
              placeholder="e.g. Calculate Total"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-lime-400"
            />
          </div>

          <Button
            size="sm"
            onClick={handleInsertSingleNode}
            className="w-full text-xs bg-lime-500 text-slate-950 font-bold hover:bg-lime-400"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Place Block on Canvas
          </Button>
        </div>

        {/* Ready-to-use Flowchart Sequences */}
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-lime-400" />
            <span>Complete Flowchart Workflows</span>
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            {FLOWCHART_TEMPLATES.map((seq) => (
              <div
                key={seq.name}
                onClick={() => handleInsertSequence(seq)}
                className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-lime-400/50 hover:bg-[#12161f] cursor-pointer transition-all"
              >
                <h4 className="text-xs font-semibold text-white mb-1">{seq.name}</h4>
                <p className="text-[10px] text-slate-400">
                  {seq.nodes.map(n => n.label).join(' → ')}
                </p>
                <span className="text-[10px] text-lime-400 mt-2 block font-medium">Click to insert workflow &rarr;</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-1 flex justify-end border-t border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
