import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useWhiteboard } from '@/hooks/useWhiteboard';
import { TableElement } from '@/types/whiteboard';
import { Table as TableIcon, Plus, Sparkles } from 'lucide-react';

const PRESET_TABLES = [
  {
    name: 'Comparison Table (2 Options)',
    headers: ['Feature', 'Mitosis', 'Meiosis'],
    rows: 4,
    cols: 3,
    sampleData: [
      ['Divisions', '1 Division', '2 Divisions'],
      ['Daughter Cells', '2 Diploid Cells', '4 Haploid Cells'],
      ['Genetic Variation', 'Identical', 'Recombinant Crossing Over'],
      ['Purpose', 'Growth & Repair', 'Gamete Production'],
    ],
  },
  {
    name: 'Scientific Experiment Matrix',
    headers: ['Trial #', 'Variable (x)', 'Result (y)', 'Error Margin'],
    rows: 3,
    cols: 4,
    sampleData: [
      ['Trial 1', '10.5 m/s', '4.2 s', '± 0.1'],
      ['Trial 2', '20.0 m/s', '8.1 s', '± 0.2'],
      ['Trial 3', '30.2 m/s', '12.3 s', '± 0.1'],
    ],
  },
  {
    name: 'Pros & Cons Analysis',
    headers: ['Factor', 'Advantages (+)', 'Tradeoffs (-)'],
    rows: 3,
    cols: 3,
    sampleData: [
      ['Performance', 'High execution speed', 'Higher memory footprint'],
      ['Scalability', 'Horizontally distributable', 'Complex sync logic'],
      ['Cost', 'Open source zero licensing', 'Maintenance overhead'],
    ],
  },
];

export const TableModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { addElement, scale, stagePos } = useWhiteboard();

  const [cols, setCols] = useState(3);
  const [rows, setRows] = useState(3);
  const [header1, setHeader1] = useState('Topic / Parameter');
  const [header2, setHeader2] = useState('Group A');
  const [header3, setHeader3] = useState('Group B');

  const handleInsertCustomTable = () => {
    const centerX = (window.innerWidth / 2 - stagePos.x) / scale - 200;
    const centerY = (window.innerHeight / 2 - stagePos.y) / scale - 100;

    const headers = [header1, header2, header3];
    const data: string[][] = [];
    for (let r = 0; r < rows; r++) {
      const rowData: string[] = [];
      for (let c = 0; c < cols; c++) {
        rowData.push(`Data ${r + 1}-${c + 1}`);
      }
      data.push(rowData);
    }

    const newTable: TableElement = {
      id: 'table_' + Math.random().toString(36).substring(2, 9),
      type: 'table',
      x: Math.max(20, centerX),
      y: Math.max(20, centerY),
      width: Math.max(380, cols * 130),
      height: 40 + (rows + 1) * 36,
      rows,
      cols,
      headers: headers.slice(0, cols),
      data,
      borderColor: '#334155',
      headerBg: '#1e293b',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addElement(newTable);
    onClose();
  };

  const handleInsertPresetTable = (preset: typeof PRESET_TABLES[0]) => {
    const centerX = (window.innerWidth / 2 - stagePos.x) / scale - 220;
    const centerY = (window.innerHeight / 2 - stagePos.y) / scale - 120;

    const newTable: TableElement = {
      id: 'table_' + Math.random().toString(36).substring(2, 9),
      type: 'table',
      x: Math.max(20, centerX),
      y: Math.max(20, centerY),
      width: preset.cols * 150,
      height: 40 + (preset.sampleData.length + 1) * 36,
      rows: preset.sampleData.length,
      cols: preset.cols,
      headers: preset.headers,
      data: preset.sampleData,
      borderColor: '#334155',
      headerBg: '#1e293b',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addElement(newTable);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Lecture Notes & Comparison Table Inserter"
      description="Insert editable structured comparison tables and data matrices onto the canvas."
      maxWidth="max-w-xl"
    >
      <div className="space-y-4 pt-1 text-slate-100">
        {/* Custom Table Builder */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c1017] p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <TableIcon className="h-3.5 w-3.5 text-lime-400" />
              <span>Custom Table Grid</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Columns (2 - 5)</label>
              <input
                type="number"
                min={2}
                max={5}
                value={cols}
                onChange={(e) => setCols(Math.min(5, Math.max(2, parseInt(e.target.value) || 2)))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Rows (2 - 10)</label>
              <input
                type="number"
                min={2}
                max={10}
                value={rows}
                onChange={(e) => setRows(Math.min(10, Math.max(2, parseInt(e.target.value) || 2)))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>
          </div>

          {/* Headers preview */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-400 block">Header Labels</label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={header1}
                onChange={(e) => setHeader1(e.target.value)}
                placeholder="Header 1"
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white"
              />
              <input
                type="text"
                value={header2}
                onChange={(e) => setHeader2(e.target.value)}
                placeholder="Header 2"
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white"
              />
              <input
                type="text"
                value={header3}
                onChange={(e) => setHeader3(e.target.value)}
                placeholder="Header 3"
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white"
              />
            </div>
          </div>

          <Button
            size="sm"
            onClick={handleInsertCustomTable}
            className="w-full text-xs bg-lime-500 text-slate-950 font-bold hover:bg-lime-400"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Place Table on Whiteboard
          </Button>
        </div>

        {/* Academic Comparison Presets */}
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-lime-400" />
            <span>Educational Table Templates</span>
          </span>
          <div className="space-y-2">
            {PRESET_TABLES.map((t) => (
              <div
                key={t.name}
                onClick={() => handleInsertPresetTable(t)}
                className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-lime-400/50 hover:bg-[#12161f] cursor-pointer transition-all flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-semibold text-white mb-0.5">{t.name}</h4>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {t.headers.join(' | ')}
                  </p>
                </div>
                <span className="text-xs text-lime-400 font-medium shrink-0 ml-2">Insert &rarr;</span>
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
