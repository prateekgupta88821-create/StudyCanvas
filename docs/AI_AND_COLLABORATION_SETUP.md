# StudyCanvas AI Learning Assistant & Real-Time Collaboration Architecture

This document details the configuration, security rules, environment variables, and execution architecture for the **AI Learning Assistant** and **Real-Time Collaboration** modules in StudyCanvas.

---

## 1. Required API Keys & Environment Setup

All privileged API keys are kept strictly on the server or serverless runtime environment. The client application never bundles or exposes AI secret keys.

| Environment Variable | Where Configured | Required For | Security Scope |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Server (`.env`, Vercel Environment Variables) | AI Learning Assistant (Explain, Summarize, Notes, Flashcards, Quizzes, Diagram Gen, Magic Organize, Math OCR) | **Server-side only**. Handled via `/api/ai-assistant.ts` and Vite dev middleware `devApiPlugin`. |
| `VITE_FIREBASE_API_KEY` | Client (`.env`) | Firebase Authentication & Cloud Firestore | Public web API key (hardened by Firebase Auth & `firestore.rules`). |
| `VITE_FIREBASE_AUTH_DOMAIN` | Client (`.env`) | Google Sign-In redirect/popup authorization | Domain validation for Google Auth. |
| `VITE_FIREBASE_PROJECT_ID` | Client (`.env`) | Cloud Firestore Project ID | Connects to project collections and real-time streams. |
| `VITE_FIREBASE_STORAGE_BUCKET`| Client (`.env`) | Cloud Storage assets | Document assets and snapshots. |
| `VITE_GOOGLE_CLIENT_ID` | Client (`.env`) | Google Drive OAuth (`drive.file` scope) | User-consented cloud document persistence. |

### Setting Up the Gemini API Key

1. Obtain a Google Gemini API Key from Google AI Studio.
2. For local development, add to your `.env` or `.env.local` in the project root:
   ```bash
   GEMINI_API_KEY=AIzaSy...
   ```
3. In production (e.g., Vercel / Cloud Run), configure `GEMINI_API_KEY` in your hosting dashboard under **Settings &rarr; Environment Variables**.
4. The backend automatically selects the fastest, most reliable available model:
   - Primary: `gemini-2.5-flash`
   - Fallback 1: `gemini-1.5-flash`
   - Fallback 2: `gemini-2.0-flash`
5. If `GEMINI_API_KEY` is not present, the endpoint returns a `503 Service Unavailable` with `setupRequired: true`, and the UI presents clear setup instructions and retry controls rather than crashing.

---

## 2. AI Learning Assistant Architecture

### Serverless Endpoint (`/api/ai-assistant.ts`)
- **Location**: `api/ai-assistant.ts`
- **Development Proxy**: `vite.config.ts` includes `devApiPlugin` which executes the serverless handler directly during `npm run dev`, providing full end-to-end local testing without separate microservices.
- **Client Service**: `src/services/aiAssistantService.ts` implements timeout handling (`25s`), abort controller, error classification (`AiAssistantError`), and automatic retry metadata.

### Educational Features
1. **Pedagogical Explanations (`explain`)**: Progressive disclosure, plain-English definitions, intuitive analogies, and common student pitfalls.
2. **High-Yield Summaries (`summarize`)**: Executive overview, key takeaways, and essential definitions.
3. **Revision Notes (`revision_notes`)**: Exam preparation summaries with clean formulas and mnemonics.
4. **Interactive Flashcards (`flashcards`)**: Interactive 3D flip card component with "Insert as Sticky Notes onto Canvas" action.
5. **Multiple-Choice Quizzes (`quiz`)**: Dynamic questions with immediate correct/incorrect feedback and pedagogical rationales.
6. **Text-to-Diagram Generator (`generate_diagram`)**: Natural language prompt to editable native `flowchart` or `mindmap` nodes.
7. **Magic Organize (`magic_organize`)**: Reorganizes messy canvas elements with consistent spacing.
   - **User Confirmation Guarantee**: Requires explicit user confirmation via `MagicOrganizeConfirmDialog` before applying coordinate updates. Supports instant undo (`Ctrl+Z`).
8. **Math OCR / LaTeX (`math_to_latex`)**: Converts handwritten or raw mathematical syntax to clean KaTeX LaTeX with live rendered preview and canvas insertion.
9. **Ethical AI Disclaimer**: Every AI-generated output includes the mandatory educational disclaimer:
   > *"AI-generated educational content for learning assistance. Please verify important mathematical or scientific facts before examinations or formal submissions."*

---

## 3. Real-Time Collaboration & Permissions

### Role-Based Access Control (RBAC)

StudyCanvas supports four distinct collaboration roles:

| Role | Canvas Drawing | Add Comments | Resolve Threads | Invite/Manage Members | Delete Project |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Owner** | Yes | Yes | Yes | Yes | Yes |
| **Editor** | Yes | Yes | Yes | No | No |
| **Commenter** | No | Yes | Yes (own) | No | No |
| **Viewer** | No | No | No | No | No |

### Server-Side Security Enforcement (`firestore.rules`)
Permissions are not merely cosmetic client checks; they are strictly enforced by Cloud Firestore security rules:
- `projects/{projectId}`: Only the `owner` can delete projects. Only `owner` and `editor` can write document updates.
- `projects/{projectId}/collaborators/{userId}`: Only the `owner` can create, modify roles, or delete collaborators.
- `projects/{projectId}/comments/{commentId}`: `owner`, `editor`, and `commenter` can post comments; `viewer` is read-only.
- `projects/{projectId}/presence/{userId}`: Each user can only write to their own cursor document.
- `projects/{projectId}/presentation/{sessionId}`: Only `owner` and `editor` can broadcast presentation states.

### Real-Time Features
- **Throttled Collaborator Cursors**: Position broadcasts are throttled to 50ms (20 fps max) to prevent bandwidth saturation while delivering fluid cursor movement. Stale cursors (> 15 seconds) are automatically filtered out.
- **Live Comments Drawer**: Slide comments with thread replies, resolution toggles, and author timestamps.
- **Presentation & Viewport Follow Mode**: Presenters broadcast viewport coordinates (`stagePos`, `scale`, `activePageIndex`); participants can follow in real time with one click.
- **Connection Loss Recovery**: Gracefully queues operations offline and reconnects automatically upon receiving `online` events.

---

## 4. Automated Testing Suite

Automated tests cover all critical collaboration and AI workflows:

```bash
npm run test
```

Test coverage includes:
- `src/tests/aiAssistant.test.ts`: Client service, serverless handler, prompt engineering, multi-model fallback, disclaimer verification, retryable error mapping.
- `src/tests/collaboration.test.ts`: Role permissions, unauthorized access rejection, cursor throttling, thread resolution, presentation broadcast, and connection loss recovery.
- `src/tests/persistence.test.ts`: Conflict detection, dirty tracking, local storage recovery, exponential backoff.
- `src/tests/googleDrive.test.ts`: Drive OAuth token handling, file revisions, manifest asset storage.
- `src/tests/auth.test.ts`: Google Auth, session persistence, logout.
- `src/tests/dashboard.test.ts`: Project management and filtering.
- `src/tests/whiteboardCore.test.ts`: Drawing engine, tools, undo/redo.

---

## 5. Deployment Instructions

1. **Build & Verify**:
   ```bash
   npm run build
   ```
2. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```
3. **Deploy Security Rules to Firestore**:
   ```bash
   firebase deploy --only firestore:rules
   ```
