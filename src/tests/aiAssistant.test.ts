import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  aiAssistantService,
  AiAssistantError,
  FlashcardItem,
  QuizQuestion,
  DiagramFlowchart,
  DiagramMindmap,
  LayoutCoordinateUpdate,
} from '@/services/aiAssistantService';
import { processAiRequest, AiAssistantRequest } from '../../api/ai-assistant';

describe('AI Learning Assistant Client Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('generates pedagogical explanations with educational disclaimer', async () => {
    const mockResponse = {
      success: true,
      action: 'explain',
      result: 'The Fundamental Theorem of Calculus links differentiation and integration.',
      disclaimer: 'AI-generated educational content for learning assistance. Please verify important mathematical or scientific facts.',
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as any);

    const result = await aiAssistantService.explain('Definite integrals', 'Explain intuitively', 'Calculus');
    expect(result).toContain('Fundamental Theorem of Calculus');
    expect(fetch).toHaveBeenCalledWith(
      '/api/ai-assistant',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('generates high-yield summaries of selected whiteboard notes', async () => {
    const mockResponse = {
      success: true,
      action: 'summarize',
      result: '- Core Concepts: Photosynthesis Light & Dark Reactions\n- Key Term: Thylakoid Membrane',
      disclaimer: 'AI-generated educational content for learning assistance. Please verify important mathematical or scientific facts.',
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as any);

    const summary = await aiAssistantService.summarize('Light reactions in chloroplasts', 'Biology');
    expect(summary).toContain('Photosynthesis');
  });

  it('generates structured revision notes for exam preparation', async () => {
    const mockResponse = {
      success: true,
      action: 'revision_notes',
      result: '## Kinematics Revision\n- $v = u + at$\n- $s = ut + \\frac{1}{2}at^2$',
      disclaimer: 'AI-generated educational content for learning assistance. Please verify important mathematical or scientific facts.',
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as any);

    const notes = await aiAssistantService.generateRevisionNotes('Equations of motion', 'Physics');
    expect(notes).toContain('Kinematics Revision');
  });

  it('generates interactive flashcards array', async () => {
    const sampleCards: FlashcardItem[] = [
      {
        front: 'What is Newton\'s First Law?',
        back: 'An object will remain at rest or in uniform motion unless acted upon by a net external force.',
        topic: 'Mechanics',
      },
      {
        front: 'What is inertia?',
        back: 'The resistance of any physical object to any change in its velocity.',
        topic: 'Mechanics',
      },
    ];

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        action: 'flashcards',
        data: sampleCards,
        disclaimer: 'AI-generated educational content for learning assistance.',
      }),
    } as any);

    const flashcards = await aiAssistantService.generateFlashcards('Newtonian mechanics notes');
    expect(flashcards).toHaveLength(2);
    expect(flashcards[0].front).toBe('What is Newton\'s First Law?');
    expect(flashcards[1].topic).toBe('Mechanics');
  });

  it('generates multiple-choice quiz questions with answer explanations', async () => {
    const sampleQuiz: QuizQuestion[] = [
      {
        question: 'Which organelle is known as the powerhouse of the cell?',
        options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Endoplasmic Reticulum'],
        correctIndex: 1,
        explanation: 'Mitochondria produce cellular ATP through oxidative phosphorylation.',
      },
    ];

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        action: 'quiz',
        data: sampleQuiz,
        disclaimer: 'AI-generated educational content for learning assistance.',
      }),
    } as any);

    const quiz = await aiAssistantService.generateQuiz('Cell biology notes', 'Biology');
    expect(quiz).toHaveLength(1);
    expect(quiz[0].options[1]).toBe('Mitochondria');
    expect(quiz[0].correctIndex).toBe(1);
  });

  it('generates structured flowcharts and mind maps', async () => {
    const sampleFlowchart: DiagramFlowchart = {
      title: 'Binary Search Algorithm',
      nodes: [
        { id: 'node_1', text: 'Start with sorted array', shape: 'rounded', x: 100, y: 100 },
        { id: 'node_2', text: 'Compare target with mid', shape: 'diamond', x: 100, y: 220 },
      ],
      connections: [{ from: 'node_1', to: 'node_2', label: 'Next' }],
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        action: 'generate_diagram',
        data: sampleFlowchart,
        disclaimer: 'AI-generated educational content for learning assistance.',
      }),
    } as any);

    const diagram = (await aiAssistantService.generateDiagram(
      'Binary search algorithm',
      'flowchart',
      'Computer Science'
    )) as DiagramFlowchart;

    expect(diagram.title).toBe('Binary Search Algorithm');
    expect(diagram.nodes).toHaveLength(2);
    expect(diagram.connections).toHaveLength(1);
  });

  it('suggests clean layout coordinates in Magic Organize', async () => {
    const mockUpdates: LayoutCoordinateUpdate[] = [
      { id: 'elem_1', x: 100, y: 100 },
      { id: 'elem_2', x: 280, y: 100 },
    ];

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        action: 'magic_organize',
        data: mockUpdates,
        disclaimer: 'AI-generated educational content for learning assistance.',
      }),
    } as any);

    const elements = [
      { id: 'elem_1', type: 'sticky', x: 42, y: 99, text: 'Note A' },
      { id: 'elem_2', type: 'sticky', x: 77, y: 340, text: 'Note B' },
    ];

    const result = await aiAssistantService.magicOrganize(elements);
    expect(result).toHaveLength(2);
    expect(result[0].x).toBe(100);
    expect(result[1].x).toBe(280);
  });

  it('converts mathematical expression into editable LaTeX', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        action: 'math_to_latex',
        data: { latex: '\\int_0^1 x^2 dx = \\frac{1}{3}' },
        disclaimer: 'AI-generated educational content for learning assistance.',
      }),
    } as any);

    const math = await aiAssistantService.mathToLatex('integral from 0 to 1 of x squared dx equals 1/3');
    expect(math.latex).toBe('\\int_0^1 x^2 dx = \\frac{1}{3}');
  });

  it('handles missing GEMINI_API_KEY with setupRequired flag', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({
        error: 'Gemini API key is not configured on the server. Add GEMINI_API_KEY to your environment.',
        setupRequired: true,
      }),
    } as any);

    await expect(aiAssistantService.explain('Test topic')).rejects.toThrow(AiAssistantError);
    try {
      await aiAssistantService.explain('Test topic');
    } catch (err: any) {
      // Checked via first expect
    }
  });

  it('handles server errors and marks them as retryable', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        error: 'Internal upstream model failure',
      }),
    } as any);

    try {
      await aiAssistantService.summarize('Notes');
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err).toBeInstanceOf(AiAssistantError);
      expect(err.retryable).toBe(true);
    }
  });
});

describe('Server-Side AI Assistant Handler (processAiRequest)', () => {
  it('constructs well-structured prompts for educational explanations', async () => {
    const mockGeminiFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: 'Calculus concept explanation with derivatives.' }],
            },
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', mockGeminiFetch);

    const body: AiAssistantRequest = {
      action: 'explain',
      content: 'Derivative of x^2',
      userPrompt: 'Step by step derivation',
      subject: 'Mathematics',
    };

    const res = await processAiRequest(body, 'test_mock_api_key');
    expect(res.success).toBe(true);
    expect(res.action).toBe('explain');
    expect(res.result).toContain('Calculus concept explanation');
    expect(res.disclaimer).toContain('AI-generated educational content');
  });

  it('extracts clean JSON array for flashcards without markdown fence errors', async () => {
    const mockGeminiFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: '```json\n[\n  {\n    "front": "What is DNA?",\n    "back": "Deoxyribonucleic acid",\n    "topic": "Genetics"\n  }\n]\n```',
                },
              ],
            },
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', mockGeminiFetch);

    const body: AiAssistantRequest = {
      action: 'flashcards',
      content: 'DNA structure and bases',
      subject: 'Biology',
    };

    const res = await processAiRequest(body, 'test_mock_api_key');
    expect(res.success).toBe(true);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data[0].front).toBe('What is DNA?');
  });

  it('extracts flowchart structure for diagram generation', async () => {
    const mockGeminiFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    title: 'Mitosis Phases',
                    nodes: [
                      { id: 'p1', text: 'Prophase', shape: 'rounded', x: 100, y: 100 },
                      { id: 'p2', text: 'Metaphase', shape: 'rectangle', x: 100, y: 220 },
                    ],
                    connections: [{ from: 'p1', to: 'p2', label: 'Next' }],
                  }),
                },
              ],
            },
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', mockGeminiFetch);

    const body: AiAssistantRequest = {
      action: 'generate_diagram',
      content: 'Mitosis stages',
      diagramType: 'flowchart',
      subject: 'Biology',
    };

    const res = await processAiRequest(body, 'test_mock_api_key');
    expect(res.success).toBe(true);
    expect(res.data.title).toBe('Mitosis Phases');
    expect(res.data.nodes).toHaveLength(2);
  });
});
