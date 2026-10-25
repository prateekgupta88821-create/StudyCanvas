/**
 * StudyCanvas AI Learning Assistant Client Service
 *
 * Connects the whiteboard editor to server-side AI endpoints.
 * Includes timeout handling, automatic retry options, payload validation,
 * and clean data parsing for educational summaries, flashcards, quizzes,
 * diagrams, layout optimizations, and math OCR.
 */

export interface FlashcardItem {
  front: string;
  back: string;
  topic?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface DiagramNode {
  id: string;
  text: string;
  shape?: 'rectangle' | 'rounded' | 'diamond' | 'circle';
  x: number;
  y: number;
  color?: string;
  textColor?: string;
  level?: number;
  parentId?: string;
  isRoot?: boolean;
}

export interface DiagramConnection {
  from: string;
  to: string;
  label?: string;
}

export interface DiagramFlowchart {
  title: string;
  nodes: DiagramNode[];
  connections: DiagramConnection[];
}

export interface DiagramMindmap {
  title: string;
  nodes: DiagramNode[];
}

export interface LayoutCoordinateUpdate {
  id: string;
  x: number;
  y: number;
}

export interface MathToLatexResult {
  latex: string;
  explanation?: string;
}

export interface AiAssistantResponse<T = any> {
  success: boolean;
  action: string;
  result?: string;
  data?: T;
  rawText?: string;
  disclaimer: string;
  error?: string;
  setupRequired?: boolean;
}

export class AiAssistantError extends Error {
  setupRequired: boolean;
  retryable: boolean;

  constructor(message: string, setupRequired = false, retryable = true) {
    super(message);
    this.name = 'AiAssistantError';
    this.setupRequired = setupRequired;
    this.retryable = retryable;
  }
}

class AiAssistantService {
  private endpoint = '/api/ai-assistant';
  private requestTimeoutMs = 25000;

  /**
   * Generic request executor with timeout and error mapping
   */
  async request<T = any>(payload: {
    action: string;
    content?: string;
    diagramType?: 'flowchart' | 'mindmap';
    selectedElements?: any[];
    userPrompt?: string;
    subject?: string;
  }): Promise<AiAssistantResponse<T>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        let errData: any = {};
        try {
          errData = await response.json();
        } catch {
          // Non-JSON response
        }

        if (response.status === 503 && errData.setupRequired) {
          throw new AiAssistantError(
            errData.error || 'Gemini API key is not configured on the server. Add GEMINI_API_KEY to your environment.',
            true,
            false
          );
        }

        throw new AiAssistantError(
          errData.error || `AI Assistant request failed with status ${response.status}`,
          false,
          response.status >= 500 || response.status === 429
        );
      }

      const data: AiAssistantResponse<T> = await response.json();
      return data;
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new AiAssistantError('The AI Assistant request timed out. Please try again.', false, true);
      }
      if (err instanceof AiAssistantError) {
        throw err;
      }
      throw new AiAssistantError(err.message || 'Network error reaching the AI Assistant service.', false, true);
    }
  }

  /**
   * Explains selected text, notes, or diagram content
   */
  async explain(content: string, userPrompt?: string, subject?: string): Promise<string> {
    const res = await this.request<string>({
      action: 'explain',
      content,
      userPrompt,
      subject,
    });
    return res.result || res.rawText || 'No explanation generated.';
  }

  /**
   * Generates a concise summary of selected content
   */
  async summarize(content: string, subject?: string): Promise<string> {
    const res = await this.request<string>({
      action: 'summarize',
      content,
      subject,
    });
    return res.result || res.rawText || 'No summary generated.';
  }

  /**
   * Generates high-yield revision notes
   */
  async generateRevisionNotes(content: string, subject?: string): Promise<string> {
    const res = await this.request<string>({
      action: 'revision_notes',
      content,
      subject,
    });
    return res.result || res.rawText || 'No revision notes generated.';
  }

  /**
   * Generates interactive flashcards from whiteboard content
   */
  async generateFlashcards(content: string, subject?: string): Promise<FlashcardItem[]> {
    const res = await this.request<FlashcardItem[]>({
      action: 'flashcards',
      content,
      subject,
    });
    if (Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  }

  /**
   * Generates multiple-choice quiz questions
   */
  async generateQuiz(content: string, subject?: string): Promise<QuizQuestion[]> {
    const res = await this.request<QuizQuestion[]>({
      action: 'quiz',
      content,
      subject,
    });
    if (Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  }

  /**
   * Suggests cleaner layout coordinates for messy selected elements
   */
  async magicOrganize(elements: any[]): Promise<LayoutCoordinateUpdate[]> {
    if (!elements || elements.length < 2) return [];

    const simplified = elements.map(el => ({
      id: el.id,
      type: el.type,
      x: el.x,
      y: el.y,
      width: el.width || 120,
      height: el.height || 80,
      text: el.text || el.latex || '',
    }));

    const res = await this.request<LayoutCoordinateUpdate[]>({
      action: 'magic_organize',
      selectedElements: simplified,
    });

    if (Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  }

  /**
   * Generates an editable flowchart or mindmap from a text prompt
   */
  async generateDiagram(
    prompt: string,
    diagramType: 'flowchart' | 'mindmap',
    subject?: string
  ): Promise<DiagramFlowchart | DiagramMindmap | null> {
    const res = await this.request({
      action: 'generate_diagram',
      content: prompt,
      diagramType,
      userPrompt: prompt,
      subject,
    });
    return res.data || null;
  }

  /**
   * Converts handwriting or raw math expression into clean LaTeX
   */
  async mathToLatex(content: string): Promise<MathToLatexResult> {
    const res = await this.request<MathToLatexResult>({
      action: 'math_to_latex',
      content,
    });
    if (res.data?.latex) {
      return res.data;
    }
    return {
      latex: res.rawText?.replace(/[$`]/g, '').trim() || content,
    };
  }
}

export const aiAssistantService = new AiAssistantService();
