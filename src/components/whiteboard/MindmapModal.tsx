import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useWhiteboard } from '@/hooks/useWhiteboard';
import { MindmapNodeElement, StrokeElement } from '@/types/whiteboard';
import { Network, Plus } from 'lucide-react';

export const MindmapModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { addElements, scale, stagePos } = useWhiteboard();

  const [centerTopic, setCenterTopic] = useState('Operating Systems');
  const [branches, setBranches] = useState('Process Management\nMemory Management\nFile Systems\nI/O Subsystems');

  const handleCreateMindmap = () => {
    const branchList = branches
      .split('\n')
      .map((b) => b.trim())
      .filter(Boolean);

    const centerX = (window.innerWidth / 2 - stagePos.x) / scale;
    const centerY = (window.innerHeight / 2 - stagePos.y) / scale;

    const rootId = 'mind_root_' + Math.random().toString(36).substring(2, 9);
    const rootNode: MindmapNodeElement = {
      id: rootId,
      type: 'mindmap',
      label: centerTopic.trim() || 'Central Topic',
      level: 0,
      color: '#a3e635',
      x: centerX - 90,
      y: centerY - 25,
      width: 180,
      height: 50,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const branchElements: (MindmapNodeElement | StrokeElement)[] = [rootNode];

    // Arrange branches in a radial or bi-directional offset
    const radius = 220;
    const count = branchList.length;

    branchList.forEach((text, i) => {
      const angle = (2 * Math.PI * i) / count;
      const bx = centerX + radius * Math.cos(angle) - 75;
      const by = centerY + radius * Math.sin(angle) - 20;

      const childId = 'mind_branch_' + Math.random().toString(36).substring(2, 9);
      const childNode: MindmapNodeElement = {
        id: childId,
        type: 'mindmap',
        label: text,
        parentId: rootId,
        level: 1,
        color: '#38bdf8',
        x: bx,
        y: by,
        width: 150,
        height: 40,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Connecting branch line
      const connectingLine: StrokeElement = {
        id: 'branch_line_' + Math.random().toString(36).substring(2, 9),
        type: 'pen',
        x: 0,
        y: 0,
        points: [centerX, centerY, bx + 75, by + 20],
        color: '#64748b',
        size: 2,
        opacity: 0.8,
        tension: 0.2,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      branchElements.push(connectingLine, childNode);
    });

    addElements(branchElements);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Mind Map Generator"
      description="Brainstorm and visually connect lecture concepts, topics, and sub-branches."
      maxWidth="max-w-xl"
    >
      <div className="space-y-4 pt-1 text-slate-100">
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
            <Network className="h-3.5 w-3.5 text-lime-400" />
            <span>Central Core Topic</span>
          </label>
          <input
            type="text"
            value={centerTopic}
            onChange={(e) => setCenterTopic(e.target.value)}
            placeholder="e.g. Photosynthesis or Quantum Mechanics"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-lime-400 font-semibold"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1.5">
            Branches (One topic per line)
          </label>
          <textarea
            rows={5}
            value={branches}
            onChange={(e) => setBranches(e.target.value)}
            placeholder="Subtopic 1&#10;Subtopic 2&#10;Subtopic 3"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-lime-400 font-mono leading-relaxed"
          />
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleCreateMindmap}
            className="text-xs bg-lime-500 text-slate-950 font-bold hover:bg-lime-400"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Generate Mind Map on Canvas
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
