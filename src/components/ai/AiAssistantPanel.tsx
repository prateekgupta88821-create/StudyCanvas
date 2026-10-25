import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useWhiteboard } from '@/hooks/useWhiteboard';
import {
  aiAssistantService,
  AiAssistantError,
  FlashcardItem,
  QuizQuestion,
  DiagramFlowchart,
  DiagramMindmap,
  LayoutCoordinateUpdate,
} from '@/services/aiAssistantService';
import {
  StickyElement,
  FlowchartNodeElement,
  MindmapNodeElement,
  FormulaElement,
} from '@/types/whiteboard';
import { renderLatexToHtml } from '@/utils/mathRenderer';
import {
  Sparkles,
  X,
  BookOpen,
  FileText,
  Layers,
  LayoutGrid,
  Network,
  Sigma,
  Loader2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  Plus,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  ShieldCheck,
  Info
} from 'lucide-react';

export interface AiAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestMagicOrganize?: (updates: LayoutCoordinateUpdate[]) => void;
}

type TabType = 'explain' | 'study' | 'diagrams' | 'organize' | 'math';
type StudySubTab = 'flashcards' | 'quiz';

export const AiAssistantPanel: React.FC<AiAssistantPanelProps> = ({
  isOpen,
  onClose,
  onRequestMagicOrganize,
}) => {
  const {
    activePage,
    selectedElementIds,
    project,
    addElement,
    addElements,
    scale,
    stagePos,
  } = useWhiteboard();

  const [activeTab, setActiveTab] = useState<TabType>('explain');
  const [studySubTab, setStudySubTab] = useState<StudySubTab>('flashcards');

  // Input states
  const [userPrompt, setUserPrompt] = useState('');
  const [diagramPrompt, setDiagramPrompt] = useState('Process of Cellular Respiration');
  const [diagramType, setDiagramType] = useState<'flowchart' | 'mindmap'>('flowchart');
  const [mathInput, setMathInput] = useState('E = mc^2 + \\int_0^1 x dx');

  // Status & Async states
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSetupRequired, setIsSetupRequired] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Result states
  const [explanationText, setExplanationText] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [activeFlashcardIndex, setActiveFlashcardIndex] = useState(0);
  const [isFlashcardFlipped, setIsFlashcardFlipped] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [generatedDiagram, setGeneratedDiagram] = useState<DiagramFlowchart | DiagramMindmap | null>(null);
  const [mathLatexResult, setMathLatexResult] = useState<string | null>(null);

  // Extract text from currently selected elements or whole page
  const selectedElements = useMemo(() => {
    return activePage.elements.filter((el) => selectedElementIds.includes(el.id));
  }, [activePage.elements, selectedElementIds]);

  const extractedContent = useMemo(() => {
    const targets = selectedElements.length > 0 ? selectedElements : activePage.elements;
    const pieces: string[] = [];

    for (const el of targets) {
      if ('text' in el && typeof el.text === 'string' && el.text.trim()) {
        pieces.push(el.text.trim());
      } else if ('label' in el && typeof el.label === 'string' && el.label.trim()) {
        pieces.push(el.label.trim());
      } else if ('latex' in el && typeof el.latex === 'string' && el.latex.trim()) {
        pieces.push(`[Formula: ${el.latex.trim()}]`);
      } else if ('expression' in el && typeof el.expression === 'string' && el.expression.trim()) {
        pieces.push(`[Graph: ${el.expression.trim()}]`);
      } else if (el.type === 'table' && 'data' in el && Array.isArray(el.data)) {
        const rows = (el.data as string[][]).map(r => r.join(' | ')).join('\n');
        pieces.push(`[Table:\n${rows}]`);
      }
    }

    return pieces.join('\n\n');
  }, [selectedElements, activePage.elements]);

  // When selection changes to a formula or stroke, populate math tab
  useEffect(() => {
    if (selectedElements.length > 0) {
      const formulaEl = selectedElements.find(e => e.type === 'formula') as FormulaElement | undefined;
      if (formulaEl?.latex) {
        queueMicrotask(() => {
          setMathInput(formulaEl.latex);
        });
      }
    }
  }, [selectedElements]);

  // Generic request runner with error handling
  const runAiTask = async (
    taskName: string,
    action: () => Promise<void>
  ) => {
    setIsLoading(true);
    setLoadingStage(taskName);
    setErrorMessage(null);
    setIsSetupRequired(false);

    try {
      await action();
    } catch (err: any) {
      if (err instanceof AiAssistantError) {
        setErrorMessage(err.message);
        setIsSetupRequired(err.setupRequired);
      } else {
        setErrorMessage(err?.message || 'An unexpected error occurred during AI generation.');
      }
    } finally {
      setIsLoading(false);
      setLoadingStage('');
    }
  };

  // 1. Explain action
  const handleExplain = () => {
    const content = extractedContent || userPrompt || 'General educational overview for ' + (project.subject || 'StudyCanvas');
    runAiTask('Generating pedagogical explanation...', async () => {
      const result = await aiAssistantService.explain(content, userPrompt, project.subject);
      setExplanationText(result);
    });
  };

  // 2. Summarize action
  const handleSummarize = () => {
    const content = extractedContent || userPrompt;
    if (!content) {
      setErrorMessage('Please select elements or notes on the canvas to summarize.');
      return;
    }
    runAiTask('Summarizing whiteboard content...', async () => {
      const result = await aiAssistantService.summarize(content, project.subject);
      setExplanationText(result);
    });
  };

  // 3. Revision notes action
  const handleRevisionNotes = () => {
    const content = extractedContent || userPrompt;
    if (!content) {
      setErrorMessage('Please select elements or notes on the canvas to create revision notes.');
      return;
    }
    runAiTask('Structuring high-yield revision notes...', async () => {
      const result = await aiAssistantService.generateRevisionNotes(content, project.subject);
      setExplanationText(result);
    });
  };

  // 4. Flashcards action
  const handleGenerateFlashcards = () => {
    const content = extractedContent || userPrompt;
    if (!content) {
      setErrorMessage('Please select elements or enter topics to generate flashcards.');
      return;
    }
    runAiTask('Synthesizing study flashcards...', async () => {
      const cards = await aiAssistantService.generateFlashcards(content, project.subject);
      setFlashcards(cards);
      setActiveFlashcardIndex(0);
      setIsFlashcardFlipped(false);
    });
  };

  // 5. Quiz action
  const handleGenerateQuiz = () => {
    const content = extractedContent || userPrompt;
    if (!content) {
      setErrorMessage('Please select whiteboard elements to create quiz questions.');
      return;
    }
    runAiTask('Crafting educational quiz questions...', async () => {
      const questions = await aiAssistantService.generateQuiz(content, project.subject);
      setQuizQuestions(questions);
      setQuizAnswers({});
    });
  };

  // 6. Diagram generation
  const handleGenerateDiagram = () => {
    const prompt = diagramPrompt.trim();
    if (!prompt) return;
    runAiTask(`Generating structured ${diagramType}...`, async () => {
      const result = await aiAssistantService.generateDiagram(prompt, diagramType, project.subject);
      setGeneratedDiagram(result);
    });
  };

  // 7. Magic organize layout
  const handleMagicOrganize = () => {
    if (selectedElements.length < 2) {
      setErrorMessage('Select at least 2 canvas elements (sticky notes, shapes, or diagrams) to organize.');
      return;
    }
    runAiTask('Calculating optimal whiteboard layout...', async () => {
      const updates = await aiAssistantService.magicOrganize(selectedElements);
      if (onRequestMagicOrganize) {
        onRequestMagicOrganize(updates);
      }
    });
  };

  // 8. Math to LaTeX
  const handleMathToLatex = () => {
    const content = mathInput.trim() || extractedContent;
    if (!content) {
      setErrorMessage('Please provide mathematical handwriting or an expression to format.');
      return;
    }
    runAiTask('Formatting mathematical expression...', async () => {
      const result = await aiAssistantService.mathToLatex(content);
      setMathLatexResult(result.latex);
    });
  };

  // Insert Flashcards onto canvas as tidy Sticky Notes
  const handleInsertFlashcardsToCanvas = () => {
    if (flashcards.length === 0) return;

    const centerX = (window.innerWidth / 2 - stagePos.x) / scale - 200;
    const centerY = (window.innerHeight / 2 - stagePos.y) / scale - 150;

    const elements: StickyElement[] = flashcards.map((card, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      return {
        id: 'flashcard_' + Math.random().toString(36).substring(2, 9),
        type: 'sticky',
        text: `Q: ${card.front}\n\nA: ${card.back}`,
        color: '#fef08a',
        x: Math.max(20, centerX + col * 170),
        y: Math.max(20, centerY + row * 170),
        width: 150,
        height: 150,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    });

    addElements(elements);
    onClose();
  };

  // Insert Generated Flowchart/Mindmap onto Canvas
  const handleInsertDiagramToCanvas = () => {
    if (!generatedDiagram) return;

    const centerX = (window.innerWidth / 2 - stagePos.x) / scale - 120;
    const centerY = (window.innerHeight / 2 - stagePos.y) / scale - 150;

    if ('connections' in generatedDiagram) {
      // Flowchart
      const flow = generatedDiagram as DiagramFlowchart;
      const elements: FlowchartNodeElement[] = flow.nodes.map((n, i) => {
        let nodeType: 'process' | 'decision' | 'terminator' = 'process';
        if (n.shape === 'diamond') nodeType = 'decision';
        else if (n.shape === 'rounded' || i === 0 || i === flow.nodes.length - 1) nodeType = 'terminator';

        return {
          id: 'flow_' + Math.random().toString(36).substring(2, 9),
          type: 'flowchart',
          nodeType,
          label: n.text,
          x: Math.max(20, centerX + (n.x || 0)),
          y: Math.max(20, centerY + (n.y || i * 110)),
          width: nodeType === 'decision' ? 140 : 150,
          height: nodeType === 'decision' ? 80 : 60,
          fill: '#12161f',
          stroke: '#a3e635',
          strokeWidth: 2,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      });
      addElements(elements);
    } else {
      // Mindmap
      const mind = generatedDiagram as DiagramMindmap;
      const rootId = 'mind_root_' + Math.random().toString(36).substring(2, 9);
      const elements: MindmapNodeElement[] = mind.nodes.map((n, i) => {
        const isRoot = n.isRoot || n.level === 0 || i === 0;
        const angle = isRoot ? 0 : (2 * Math.PI * (i - 1)) / Math.max(1, mind.nodes.length - 1);
        const radius = isRoot ? 0 : 220;
        const bx = isRoot ? centerX : centerX + radius * Math.cos(angle);
        const by = isRoot ? centerY : centerY + radius * Math.sin(angle);

        return {
          id: isRoot ? rootId : 'mind_branch_' + Math.random().toString(36).substring(2, 9),
          type: 'mindmap',
          label: n.text,
          parentId: isRoot ? undefined : rootId,
          level: isRoot ? 0 : 1,
          color: isRoot ? '#a3e635' : (n.color || '#38bdf8'),
          x: bx,
          y: by,
          width: isRoot ? 170 : 140,
          height: isRoot ? 50 : 40,
          isRoot,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      });
      addElements(elements);
    }

    onClose();
  };

  // Insert LaTeX equation onto canvas
  const handleInsertEquationToCanvas = () => {
    if (!mathLatexResult) return;

    const centerX = (window.innerWidth / 2 - stagePos.x) / scale - 100;
    const centerY = (window.innerHeight / 2 - stagePos.y) / scale - 40;

    const newFormula: FormulaElement = {
      id: 'formula_' + Math.random().toString(36).substring(2, 9),
      type: 'formula',
      latex: mathLatexResult,
      renderedText: mathLatexResult,
      fontSize: 24,
      color: '#ffffff',
      x: Math.max(20, centerX),
      y: Math.max(20, centerY),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addElement(newFormula);
    onClose();
  };

  // Copy helper
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ x: 420, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 420, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="fixed top-14 right-0 bottom-0 w-full sm:w-[420px] bg-[#0c1017]/95 border-l border-slate-800/90 shadow-2xl backdrop-blur-2xl z-40 flex flex-col select-none text-slate-100"
      >
        {/* Header */}
        <div className="h-14 px-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-[#090b0e]/70">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-lime-500/15 border border-lime-500/30 text-lime-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white tracking-wide">AI Learning Assistant</h2>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  Gemini
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[220px]">
                {project.subject || 'Personalized Educational Tutor'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close Assistant"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Selection Context Pill */}
        <div className="px-4 py-2 border-b border-slate-800/70 bg-slate-900/40 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <Info className="h-3.5 w-3.5 text-lime-400 shrink-0" />
            <span className="truncate">
              {selectedElements.length > 0
                ? `${selectedElements.length} element${selectedElements.length > 1 ? 's' : ''} selected`
                : 'Using current page notes & text'}
            </span>
          </div>
          {selectedElements.length > 0 && (
            <span className="text-[10px] font-mono bg-lime-500/10 text-lime-400 px-1.5 py-0.5 rounded border border-lime-500/20">
              Active Context
            </span>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-5 p-1.5 gap-1 border-b border-slate-800 bg-[#090b0e]/50 text-xs font-medium">
          {[
            { id: 'explain' as TabType, label: 'Tutor', icon: BookOpen },
            { id: 'study' as TabType, label: 'Study', icon: Layers },
            { id: 'diagrams' as TabType, label: 'Diagram', icon: Network },
            { id: 'organize' as TabType, label: 'Layout', icon: LayoutGrid },
            { id: 'math' as TabType, label: 'Math', icon: Sigma },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-1.5 px-1 rounded-xl flex flex-col items-center gap-1 transition-all ${
                  isActive
                    ? 'bg-lime-500/15 text-lime-400 border border-lime-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="text-[10px]">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Loading Indicator */}
          {isLoading && (
            <div className="p-4 rounded-2xl border border-lime-500/20 bg-lime-500/5 flex flex-col items-center justify-center gap-2.5 text-center">
              <Loader2 className="h-6 w-6 text-lime-400 animate-spin" />
              <p className="text-xs font-semibold text-slate-200">{loadingStage || 'Processing with Gemini...'}</p>
              <p className="text-[11px] text-slate-400">Synthesizing pedagogical notes and models safely on the server.</p>
            </div>
          )}

          {/* Error & Retry Banner */}
          {errorMessage && !isLoading && (
            <div className="p-3.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-200 flex-1">
                <p className="font-semibold text-rose-300">
                  {isSetupRequired ? 'API Key Configuration Required' : 'AI Assistant Request Failed'}
                </p>
                <p className="mt-1 text-rose-200/90 leading-relaxed">{errorMessage}</p>
                {isSetupRequired ? (
                  <p className="mt-2 text-[11px] text-slate-400 font-mono bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    Set GEMINI_API_KEY in your server environment variables or .env file.
                  </p>
                ) : (
                  <button
                    onClick={() => {
                      if (activeTab === 'explain') handleExplain();
                      else if (activeTab === 'study' && studySubTab === 'flashcards') handleGenerateFlashcards();
                      else if (activeTab === 'study' && studySubTab === 'quiz') handleGenerateQuiz();
                      else if (activeTab === 'diagrams') handleGenerateDiagram();
                      else if (activeTab === 'organize') handleMagicOrganize();
                      else if (activeTab === 'math') handleMathToLatex();
                    }}
                    className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-medium transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Retry action
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: TUTOR (Explain, Summarize, Revision Notes) */}
          {activeTab === 'explain' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Ask a Question or Set Specific Focus (Optional)
                </label>
                <div className="relative">
                  <textarea
                    rows={2}
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    placeholder="e.g. Explain intuitively with a real-world example, or focus on calculus applications..."
                    className="w-full bg-[#090b0e] border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-lime-500/60 transition-colors"
                  />
                </div>
              </div>

              {/* Quick Actions Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleExplain}
                  disabled={isLoading}
                  className="py-2 px-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-lime-500/40 text-slate-200 text-xs font-medium flex flex-col items-center gap-1 transition-all disabled:opacity-40"
                >
                  <BookOpen className="h-3.5 w-3.5 text-lime-400" />
                  <span>Explain</span>
                </button>
                <button
                  onClick={handleSummarize}
                  disabled={isLoading}
                  className="py-2 px-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-lime-500/40 text-slate-200 text-xs font-medium flex flex-col items-center gap-1 transition-all disabled:opacity-40"
                >
                  <FileText className="h-3.5 w-3.5 text-sky-400" />
                  <span>Summarize</span>
                </button>
                <button
                  onClick={handleRevisionNotes}
                  disabled={isLoading}
                  className="py-2 px-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-lime-500/40 text-slate-200 text-xs font-medium flex flex-col items-center gap-1 transition-all disabled:opacity-40"
                >
                  <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                  <span>Revision</span>
                </button>
              </div>

              {/* Explanation Output Container */}
              {explanationText && (
                <div className="rounded-2xl border border-slate-800 bg-[#090b0e] p-3.5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-semibold text-lime-400 flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3" />
                      Educational Explanation
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopyText(explanationText)}
                        className="h-6 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1"
                        title="Copy to clipboard"
                      >
                        {copiedSuccess ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        {copiedSuccess ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed space-y-2 max-h-80 overflow-y-auto pr-1">
                    {explanationText}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STUDY (Flashcards & Quizzes) */}
          {activeTab === 'study' && (
            <div className="space-y-4">
              {/* Sub-tab pills */}
              <div className="flex rounded-xl bg-[#090b0e] p-1 border border-slate-800">
                <button
                  onClick={() => setStudySubTab('flashcards')}
                  className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    studySubTab === 'flashcards'
                      ? 'bg-lime-500/20 text-lime-300'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Flashcards ({flashcards.length})
                </button>
                <button
                  onClick={() => setStudySubTab('quiz')}
                  className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    studySubTab === 'quiz'
                      ? 'bg-lime-500/20 text-lime-300'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Quiz ({quizQuestions.length})
                </button>
              </div>

              {/* Flashcards View */}
              {studySubTab === 'flashcards' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {flashcards.length > 0 ? `Card ${activeFlashcardIndex + 1} of ${flashcards.length}` : 'No flashcards generated'}
                    </span>
                    <button
                      onClick={handleGenerateFlashcards}
                      disabled={isLoading}
                      className="px-2.5 py-1 rounded-lg bg-lime-500/20 hover:bg-lime-500/30 text-lime-300 text-xs font-semibold border border-lime-500/40 inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="h-3 w-3" />
                      {flashcards.length > 0 ? 'Regenerate' : 'Generate Cards'}
                    </button>
                  </div>

                  {flashcards.length > 0 ? (
                    <div className="space-y-3">
                      {/* Flip card */}
                      <div
                        onClick={() => setIsFlashcardFlipped((prev) => !prev)}
                        className="cursor-pointer min-h-[170px] rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 to-[#12161f] p-4 flex flex-col justify-between shadow-xl hover:border-lime-500/50 transition-all text-center"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-semibold text-lime-400 uppercase tracking-wider text-[10px]">
                            {isFlashcardFlipped ? 'Answer / Explanation' : 'Question / Prompt'}
                          </span>
                          <span className="text-slate-500 flex items-center gap-1">
                            <RotateCw className="h-3 w-3" /> Click to flip
                          </span>
                        </div>

                        <div className="py-4 text-sm font-medium text-slate-100 flex items-center justify-center">
                          {isFlashcardFlipped
                            ? flashcards[activeFlashcardIndex]?.back
                            : flashcards[activeFlashcardIndex]?.front}
                        </div>

                        {flashcards[activeFlashcardIndex]?.topic && (
                          <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                            {flashcards[activeFlashcardIndex].topic}
                          </div>
                        )}
                      </div>

                      {/* Navigation buttons */}
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => {
                            setIsFlashcardFlipped(false);
                            setActiveFlashcardIndex((prev) => Math.max(0, prev - 1));
                          }}
                          disabled={activeFlashcardIndex === 0}
                          className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-xs text-slate-300 hover:text-white disabled:opacity-30 inline-flex items-center gap-1"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" /> Previous
                        </button>
                        <button
                          onClick={() => {
                            setIsFlashcardFlipped(false);
                            setActiveFlashcardIndex((prev) => Math.min(flashcards.length - 1, prev + 1));
                          }}
                          disabled={activeFlashcardIndex === flashcards.length - 1}
                          className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-xs text-slate-300 hover:text-white disabled:opacity-30 inline-flex items-center gap-1"
                        >
                          Next <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Canvas Export */}
                      <button
                        onClick={handleInsertFlashcardsToCanvas}
                        className="w-full py-2 rounded-xl border border-lime-500/40 bg-lime-500/10 hover:bg-lime-500/20 text-lime-300 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Insert Cards onto Canvas as Sticky Notes
                      </button>
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl border border-slate-800/80 bg-[#090b0e] text-center text-xs text-slate-400">
                      Select lecture notes or topics, then click "Generate Cards" to build an interactive revision deck.
                    </div>
                  )}
                </div>
              )}

              {/* Quiz View */}
              {studySubTab === 'quiz' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Multiple-Choice Assessment</span>
                    <button
                      onClick={handleGenerateQuiz}
                      disabled={isLoading}
                      className="px-2.5 py-1 rounded-lg bg-lime-500/20 hover:bg-lime-500/30 text-lime-300 text-xs font-semibold border border-lime-500/40 inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="h-3 w-3" />
                      {quizQuestions.length > 0 ? 'Regenerate' : 'Create Quiz'}
                    </button>
                  </div>

                  {quizQuestions.length > 0 ? (
                    <div className="space-y-4">
                      {quizQuestions.map((q, qIndex) => {
                        const selectedOption = quizAnswers[qIndex];
                        const isAnswered = selectedOption !== undefined;
                        const isCorrect = selectedOption === q.correctIndex;

                        return (
                          <div
                            key={qIndex}
                            className="rounded-2xl border border-slate-800 bg-[#090b0e] p-3.5 space-y-2.5"
                          >
                            <p className="text-xs font-semibold text-slate-100">
                              {qIndex + 1}. {q.question}
                            </p>

                            <div className="space-y-1.5">
                              {q.options.map((option, optIndex) => {
                                let style = 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700';

                                if (isAnswered) {
                                  if (optIndex === q.correctIndex) {
                                    style = 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300';
                                  } else if (optIndex === selectedOption) {
                                    style = 'border-rose-500/50 bg-rose-500/10 text-rose-300';
                                  } else {
                                    style = 'border-slate-800/40 opacity-40 text-slate-500';
                                  }
                                }

                                return (
                                  <button
                                    key={optIndex}
                                    disabled={isAnswered}
                                    onClick={() =>
                                      setQuizAnswers((prev) => ({ ...prev, [qIndex]: optIndex }))
                                    }
                                    className={`w-full text-left p-2 rounded-xl border text-xs font-medium transition-all flex items-start gap-2 ${style}`}
                                  >
                                    <span className="font-mono text-[10px] text-slate-500 shrink-0 mt-0.5">
                                      {String.fromCharCode(65 + optIndex)}.
                                    </span>
                                    <span>{option}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Pedagogical Explanation */}
                            {isAnswered && (
                              <div
                                className={`text-[11px] p-2.5 rounded-xl border ${
                                  isCorrect
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                                    : 'bg-rose-500/10 border-rose-500/20 text-rose-200'
                                }`}
                              >
                                <p className="font-semibold">{isCorrect ? 'Correct!' : 'Incorrect'}</p>
                                <p className="mt-0.5 leading-relaxed opacity-90">{q.explanation}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl border border-slate-800/80 bg-[#090b0e] text-center text-xs text-slate-400">
                      Generate high-yield educational quiz questions to assess comprehension of your whiteboard material.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DIAGRAMS (Text to Flowchart or Mind Map) */}
          {activeTab === 'diagrams' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Diagram Type &amp; Educational Concept Prompt
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDiagramType('flowchart')}
                    className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      diagramType === 'flowchart'
                        ? 'bg-lime-500/15 border-lime-500/40 text-lime-300'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Network className="h-3.5 w-3.5" />
                    Flowchart
                  </button>
                  <button
                    onClick={() => setDiagramType('mindmap')}
                    className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      diagramType === 'mindmap'
                        ? 'bg-lime-500/15 border-lime-500/40 text-lime-300'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    Mind Map
                  </button>
                </div>

                <textarea
                  rows={3}
                  value={diagramPrompt}
                  onChange={(e) => setDiagramPrompt(e.target.value)}
                  placeholder="e.g. Nitrogen cycle biological stages, or QuickSort algorithm recursive steps..."
                  className="w-full bg-[#090b0e] border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-lime-500/60 transition-colors"
                />

                {/* Example prompt chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    'Cellular Respiration',
                    'Binary Search Tree',
                    'Scientific Method',
                    'Calculus Derivatives',
                  ].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => setDiagramPrompt(chip)}
                      className="px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[10px] text-slate-300 border border-slate-700/60"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerateDiagram}
                disabled={isLoading || !diagramPrompt.trim()}
                className="w-full py-2.5 rounded-xl bg-lime-500 text-slate-950 hover:bg-lime-400 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all shadow-none disabled:opacity-40"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Generate Diagram with AI
              </button>

              {/* Diagram Preview */}
              {generatedDiagram && (
                <div className="rounded-2xl border border-slate-800 bg-[#090b0e] p-3.5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-semibold text-lime-400 truncate max-w-[200px]">
                      {generatedDiagram.title || 'Generated Diagram'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {generatedDiagram.nodes.length} nodes
                    </span>
                  </div>

                  {/* List of nodes */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {generatedDiagram.nodes.map((node, i) => (
                      <div
                        key={node.id || i}
                        className="p-2 rounded-xl border border-slate-800/80 bg-slate-900/50 flex items-center justify-between text-xs"
                      >
                        <span className="text-slate-200 truncate">{node.text}</span>
                        {node.shape && (
                          <span className="text-[10px] text-slate-500 uppercase">{node.shape}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleInsertDiagramToCanvas}
                    className="w-full py-2 rounded-xl bg-lime-500/20 hover:bg-lime-500/30 text-lime-300 border border-lime-500/40 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Insert onto Canvas (Editable)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MAGIC ORGANIZE */}
          {activeTab === 'organize' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-lime-500/20 bg-lime-500/10 p-3.5 flex items-start gap-3">
                <LayoutGrid className="h-5 w-5 text-lime-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 leading-relaxed">
                  <p className="font-semibold text-white">Smart Canvas Layout Engine</p>
                  <p className="mt-1 text-slate-400">
                    Calculates a balanced grid or flow alignment for selected whiteboard elements,
                    preventing messy overlaps and uneven margins.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-[#090b0e] p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Selected Elements</span>
                  <span className="font-semibold text-lime-400">{selectedElements.length} items</span>
                </div>

                {selectedElements.length < 2 ? (
                  <p className="text-xs text-slate-400">
                    Please select at least 2 elements on your canvas using the selection tool (V) to analyze layout.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedElements.slice(0, 5).map((el) => (
                      <div
                        key={el.id}
                        className="text-xs text-slate-300 p-1.5 rounded-lg bg-slate-900/60 truncate"
                      >
                        {'text' in el && el.text ? `"${String(el.text).slice(0, 30)}..."` : el.type}
                      </div>
                    ))}
                    {selectedElements.length > 5 && (
                      <p className="text-[11px] text-slate-500 italic">+ {selectedElements.length - 5} more elements</p>
                    )}
                  </div>
                )}

                <button
                  onClick={handleMagicOrganize}
                  disabled={isLoading || selectedElements.length < 2}
                  className="w-full py-2.5 rounded-xl bg-lime-500 text-slate-950 hover:bg-lime-400 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all shadow-none disabled:opacity-40"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Preview Magic Organize Layout
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: MATH OCR / LATEX */}
          {activeTab === 'math' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Math Expression or Handwriting Content
                </label>
                <textarea
                  rows={2}
                  value={mathInput}
                  onChange={(e) => setMathInput(e.target.value)}
                  placeholder="Enter raw math, e.g. integral from 0 to inf of e^(-x^2) dx..."
                  className="w-full bg-[#090b0e] border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-lime-500/60 transition-colors font-mono"
                />
              </div>

              <button
                onClick={handleMathToLatex}
                disabled={isLoading || !mathInput.trim()}
                className="w-full py-2 rounded-xl bg-lime-500 text-slate-950 hover:bg-lime-400 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all shadow-none disabled:opacity-40"
              >
                <Sigma className="h-3.5 w-3.5" />
                Format to LaTeX Equation
              </button>

              {/* KaTeX Live Preview */}
              {mathLatexResult && (
                <div className="rounded-2xl border border-slate-800 bg-[#090b0e] p-3.5 space-y-3">
                  <span className="text-xs font-semibold text-lime-400 block">Rendered KaTeX Output</span>
                  
                  <div
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-x-auto text-white"
                    dangerouslySetInnerHTML={{
                      __html: renderLatexToHtml(mathLatexResult),
                    }}
                  />

                  <div className="text-[11px] font-mono text-slate-400 bg-slate-950 p-2 rounded-lg break-all">
                    {mathLatexResult}
                  </div>

                  <button
                    onClick={handleInsertEquationToCanvas}
                    className="w-full py-2 rounded-xl bg-lime-500/20 hover:bg-lime-500/30 text-lime-300 border border-lime-500/40 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Insert Equation onto Canvas
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer: Ethical AI Educational Disclaimer */}
        <div className="p-3 border-t border-slate-800 bg-[#090b0e] shrink-0 text-slate-400">
          <div className="flex items-start gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-lime-400 shrink-0 mt-0.5" />
            <p className="text-[10px] leading-relaxed text-slate-400">
              <span className="font-semibold text-slate-300">Pedagogical Disclaimer:</span> AI-generated educational content for learning assistance. Please verify important mathematical or scientific facts before examinations or formal submissions.
            </p>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};
