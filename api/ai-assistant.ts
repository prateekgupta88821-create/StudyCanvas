/**
 * StudyCanvas AI Learning Assistant Serverless API Route
 *
 * Secure server-side handler for educational AI generation.
 * Keeps API keys safely on the server and provides structured
 * educational explanations, summaries, flashcards, quizzes,
 * prompt-to-diagram generation, layout organization, and math OCR.
 */

declare const process: any;

export interface AiAssistantRequest {
  action: 
    | 'explain' 
    | 'summarize' 
    | 'revision_notes' 
    | 'flashcards' 
    | 'quiz' 
    | 'magic_organize' 
    | 'generate_diagram' 
    | 'math_to_latex';
  content: string;
  diagramType?: 'flowchart' | 'mindmap';
  selectedElements?: any[];
  userPrompt?: string;
  subject?: string;
}

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-2.0-flash',
];

export async function processAiRequest(body: AiAssistantRequest, apiKey: string): Promise<any> {
  const { action, content, diagramType, selectedElements, userPrompt, subject = 'General Education' } = body;

  let systemInstruction = `You are the StudyCanvas AI Learning Assistant, an expert educational tutor and curriculum designer for teachers, professors, and students in ${subject}.
Always maintain high pedagogical standards:
1. Explain concepts with clarity, progressive disclosure, and intuitive real-world analogies.
2. Structure math and science clearly with standard LaTeX notation enclosed in dollar signs, e.g. $E = mc^2$ or $$\\int_a^b f(x)dx$$.
3. Clearly state assumptions and guide learners step-by-step.
4. When generating diagrams or layouts, return strictly valid JSON matching the requested schema.
5. NEVER fabricate false mathematical or scientific facts.`;

  let prompt = '';

  switch (action) {
    case 'explain':
      prompt = `Explain the following educational content in an engaging, easy-to-understand way for a student studying ${subject}.
Content:
"""
${content}
"""

${userPrompt ? `Specific question/focus from user: "${userPrompt}"` : ''}

Provide:
1. Core Concept (Plain English definition)
2. Why it matters / Intuitive Analogy
3. Key Principles / Step-by-Step Breakdown
4. Common Mistakes or Pitfalls to Avoid`;
      break;

    case 'summarize':
      prompt = `Provide a clear, high-yield summary of the following educational notes/canvas content:
"""
${content}
"""

Format with:
- Quick Executive Summary (2-3 sentences)
- Key Takeaways (Bullet points)
- Essential Terminology`;
      break;

    case 'revision_notes':
      prompt = `Generate structured, high-yield revision study notes from the following whiteboard content for revision and exam prep:
"""
${content}
"""

Format in clean markdown with:
- Topic Overview & Learning Objectives
- Core Principles & Key Formulas
- Worked Concept or Example
- Quick Memory Anchors / Mnemonics`;
      break;

    case 'flashcards':
      prompt = `Create 4 to 8 high-quality study flashcards based on the following whiteboard content:
"""
${content}
"""

Return ONLY a valid JSON array of objects with the exact structure:
[
  {
    "front": "Question, prompt, or term",
    "back": "Clear, concise answer or definition",
    "topic": "Subtopic or chapter"
  }
]
Do not wrap in markdown code fences if possible, or use standard \`\`\`json.`;
      break;

    case 'quiz':
      prompt = `Create a 3 to 5 question multiple-choice quiz to test understanding of the following whiteboard content:
"""
${content}
"""

Return ONLY a valid JSON array of objects with the exact structure:
[
  {
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Detailed explanation of why this answer is correct and why other options are false"
  }
]
Do not wrap in markdown code fences if possible, or use standard \`\`\`json.`;
      break;

    case 'generate_diagram':
      if (diagramType === 'flowchart') {
        prompt = `Generate a structured educational flowchart for the following process or concept:
"${userPrompt || content}"

Return ONLY a valid JSON object matching this structure:
{
  "title": "Short title",
  "nodes": [
    {
      "id": "node_1",
      "text": "Start / Step 1",
      "shape": "rounded",
      "x": 100,
      "y": 80,
      "color": "#1e293b",
      "textColor": "#ffffff"
    },
    {
      "id": "node_2",
      "text": "Decision / Step 2",
      "shape": "diamond",
      "x": 100,
      "y": 200,
      "color": "#1e293b",
      "textColor": "#ffffff"
    }
  ],
  "connections": [
    {
      "from": "node_1",
      "to": "node_2",
      "label": "Next"
    }
  ]
}
Allowed shapes: "rectangle", "rounded", "diamond", "circle".
Arrange nodes cleanly with sensible x and y coordinates (vertical spacing 100-140px).`;
      } else {
        // Mind map
        prompt = `Generate a hierarchical educational mind map for the following subject/concept:
"${userPrompt || content}"

Return ONLY a valid JSON object matching this structure:
{
  "title": "Central Concept Title",
  "nodes": [
    {
      "id": "root",
      "text": "Central Topic",
      "level": 0,
      "isRoot": true,
      "color": "#a3e635"
    },
    {
      "id": "branch_1",
      "parentId": "root",
      "text": "Key Subtopic 1",
      "level": 1,
      "color": "#38bdf8"
    },
    {
      "id": "branch_2",
      "parentId": "root",
      "text": "Key Subtopic 2",
      "level": 1,
      "color": "#f472b6"
    }
  ]
}
Include a central root and 3-5 sub-branches with 1-2 sub-nodes each.`;
      }
      break;

    case 'magic_organize':
      prompt = `Analyze the following positioned whiteboard canvas elements:
${JSON.stringify(selectedElements || [], null, 2)}

Suggest an optimized, clean layout that aligns and groups these elements with balanced spacing (e.g. tidy grid, vertical column, or horizontal timeline).
Return ONLY a valid JSON array of coordinate updates with the exact structure:
[
  {
    "id": "element_id",
    "x": 100,
    "y": 120
  }
]`;
      break;

    case 'math_to_latex':
      prompt = `Convert the following handwritten math description, raw formula, or textual equation into a clean, accurate LaTeX equation string:
"""
${content}
"""

Return ONLY a valid JSON object:
{
  "latex": "cleaned LaTeX string without surrounding dollar signs",
  "explanation": "Brief description of what this formula represents (e.g. Quadratic Formula, Schrödinger Equation, etc.)"
}`;
      break;

    default:
      throw new Error(`Unsupported AI assistant action: ${action}`);
  }

  // Attempt generation with available Gemini models in priority order
  let lastError: Error | null = null;

  for (const modelName of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstruction}\n\nTask:\n${prompt}` }],
            },
          ],
          generationConfig: {
            temperature: action === 'magic_organize' || action === 'math_to_latex' ? 0.2 : 0.6,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        lastError = new Error(`Gemini API Error (${modelName} ${response.status}): ${errorText}`);
        continue;
      }

      const data: any = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!rawText) {
        lastError = new Error(`Empty response returned from ${modelName}`);
        continue;
      }

      // Format response based on action
      if (['flashcards', 'quiz', 'generate_diagram', 'magic_organize', 'math_to_latex'].includes(action)) {
        // Parse JSON output cleanly (stripping any accidental markdown fences)
        const cleaned = rawText.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
        try {
          const parsed = JSON.parse(cleaned);
          return {
            success: true,
            action,
            data: parsed,
            rawText,
            model: modelName,
            disclaimer: 'AI-generated educational content for learning assistance. Please verify important mathematical or scientific facts.',
          };
        } catch {
          // If JSON parse failed, return raw text
          return {
            success: true,
            action,
            rawText,
            model: modelName,
            disclaimer: 'AI-generated educational content for learning assistance. Please verify important mathematical or scientific facts.',
          };
        }
      }

      return {
        success: true,
        action,
        result: rawText,
        model: modelName,
        disclaimer: 'AI-generated educational content for learning assistance. Please verify important mathematical or scientific facts.',
      };
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini API model attempts failed.');
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'GEMINI_API_KEY is not configured on the server. Please add your GEMINI_API_KEY in server environment variables.',
      setupRequired: true,
    });
  }

  try {
    const body: AiAssistantRequest = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body || !body.action) {
      return res.status(400).json({ error: 'Missing action in request body' });
    }

    const result = await processAiRequest(body, apiKey);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('AI Assistant API Error:', error);
    return res.status(500).json({
      error: error.message || 'An error occurred while processing the educational AI request.',
      retryable: true,
    });
  }
}
