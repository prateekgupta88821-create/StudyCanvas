# StudyCanvas — Premium Educational Whiteboard

> High-performance, interactive digital whiteboard engineered for school teachers, college professors, and students with Google Drive and Cloud sync.

![StudyCanvas Architecture](public/logo.svg)

---

## 🌟 Overview & Key Capabilities

StudyCanvas is built specifically for academic environments, lecture halls, tutoring, and collaborative study sessions:

- **High-Performance Drawing Engine**: Powered by **Konva.js** and **React Konva** for 60fps freehand drawing with Catmull-Rom smoothing, bezier interpolation, and stroke pressure simulation.
- **Academic Tool Suite**:
  - **Freehand Pen & Highlighter**: Smooth writing with customizable stroke widths, opacity, and curated educational palettes.
  - **Geometric Shapes**: Rectangles, circles, triangles, stars, coordinate arrows, and lines with live transform controls.
  - **Sticky Notes**: Color-coded lecture cards with auto-wrapping text.
  - **Equation & Formula Palette**: One-click formula stamper with LaTeX presets for Calculus, Algebra, Physics, and Trigonometry.
  - **Laser Pointer**: Vanishing light trail for instructors pointing on projectors or screen shares.
  - **Multi-Slide Lecture Decks**: Create and organize multi-slide lectures with thumbnail drawers.
- **Cloud & Native Storage**:
  - **Google Drive API**: Real multipart upload saving `.studycanvas` files directly into user's Google Drive without vendor lock-in.
  - **Cloud Firestore**: Real-time project metadata, titles, subjects, timestamps, and page counts.
  - **Offline-First Resilience**: Instant local storage caching ensures zero data loss even if disconnected.
- **Export Engine**:
  - High-resolution PNG snapshots (1x, 2x Retina, 3x Ultra Print).
  - Full `.studycanvas` JSON project export & import.
  - Direct print and PDF export with landscape orientation formatting.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Core Framework** | React 19, TypeScript, Vite |
| **Styling & Design System** | Tailwind CSS v4, shadcn/ui inspired primitives, custom glassmorphism design tokens |
| **Icons & Motion** | Lucide React, Motion for React (`motion`) |
| **Whiteboard Engine** | Konva.js & React Konva |
| **Authentication** | Firebase Authentication (Google Sign-In with Drive OAuth scopes) |
| **Cloud Metadata** | Cloud Firestore (Real-time snapshots) |
| **Cloud File Storage** | Google Drive v3 REST API (Multipart uploads & file retrieval) |
| **Serverless Functions** | Vercel Serverless Functions (`/api/*`) |
| **Deployment** | Vercel |

---

## 📂 Project Architecture

```
StudyCanvas/
├── api/                             # Serverless backend functions for privileged operations
│   ├── health.ts                    # Healthcheck / status endpoint
│   ├── drive-proxy.ts               # Server-side Drive query & token verification
│   └── verify-session.ts            # Server-side session authentication
├── public/
│   └── logo.svg                     # Vector brand logo
├── src/
│   ├── components/
│   │   ├── auth/                    # AuthModal, UserMenu
│   │   ├── common/                  # ErrorBoundary, GlassCard, LoadingSpinner, StatusPill
│   │   ├── dashboard/               # ProjectCard, TemplateGallery, DriveImportModal
│   │   ├── export/                  # ExportModal
│   │   ├── settings/                # SettingsModal
│   │   ├── ui/                      # Button, Input, Badge, Dialog
│   │   └── whiteboard/              # WhiteboardStage, WhiteboardNavbar, WhiteboardToolbar,
│   │                                # WhiteboardProperties, WhiteboardPageSelector, MathFormulaModal
│   ├── config/
│   │   ├── env.ts                   # Strongly-typed environment variables & validation
│   │   └── firebase.ts              # Firebase App, Auth, Firestore & Google Drive OAuth config
│   ├── contexts/
│   │   ├── AuthContext.tsx          # User profile, Google sign-in, Drive access token
│   │   └── WhiteboardContext.tsx    # State machine for drawing tools, pages, undo/redo, sync
│   ├── hooks/
│   │   ├── useFirestoreProjects.ts  # Real Firestore query & snapshot subscription
│   │   ├── useGoogleDrive.ts        # Google Drive file browser, upload, download
│   │   └── useKeyboardShortcuts.ts  # Global hotkeys (v, p, h, e, r, t, s, m, l, Ctrl+Z, etc.)
│   ├── pages/
│   │   ├── DashboardPage.tsx        # Projects list, search, template launcher, Drive import
│   │   └── WhiteboardPage.tsx       # Live interactive canvas studio
│   ├── services/
│   │   ├── authService.ts           # Firebase Google Sign-In with Drive scopes
│   │   ├── exportService.ts         # High-res PNG, JSON, PDF print generator
│   │   ├── firestoreService.ts      # Cloud Firestore CRUD operations
│   │   └── googleDriveService.ts    # Google Drive v3 REST API integration
│   ├── types/
│   │   ├── auth.ts                  # EducatorRole, UserProfile, AuthContextType
│   │   ├── drive.ts                 # DriveFileMetadata, DriveSyncStatus
│   │   ├── settings.ts              # UserPreferences, Theme
│   │   └── whiteboard.ts            # CanvasElement, Stroke, Shape, Page, WhiteboardProject
│   ├── utils/
│   │   ├── cn.ts                    # Tailwind class merger
│   │   ├── formatters.ts            # Relative time & byte size formatters
│   │   ├── geometry.ts              # Stroke smoothing & bounding box helpers
│   │   └── storage.ts               # Local cache & offline persistence fallback
│   ├── App.tsx                      # Root component with routing
│   ├── main.tsx                     # React entrypoint
│   └── index.css                    # Design tokens, themes, and grid utilities
├── .env.example                     # Environment variables template
├── vercel.json                      # Vercel deployment configuration
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## ⚡ Quick Start & Development

### 1. Prerequisites
- **Node.js** v20+ or v24+
- **npm** v10+

### 2. Installation
```bash
git clone <repo-url>
cd StudyCanvas
npm install
```

### 3. Setup Environment Variables
Create `.env.local` or `.env` in the root:
```bash
cp .env.example .env.local
```
*(If environment variables are not yet configured, StudyCanvas automatically boots into guest mode with full local storage persistence so you can start drawing immediately).*

### 4. Run Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 5. Build for Production
```bash
npm run build
npm run preview
```

---

## 🔐 Environment Variables & Google Drive Setup

### Firebase Authentication & Cloud Firestore
1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Enable **Authentication** -> **Sign-in method** -> **Google**.
3. Enable **Cloud Firestore** in production or test mode.
4. Under **Project Settings** -> **General** -> **Your apps**, register a Web app and copy the credentials:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
   ```

### Google Drive Integration (OAuth 2.0)
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your Firebase project.
3. In **APIs & Services** -> **Library**, enable the **Google Drive API**.
4. In **OAuth consent screen**, add the scope:
   `https://www.googleapis.com/auth/drive.file`
   *(This gives the app permission to create and open only the files that it creates, ensuring user privacy).*
5. Set:
   ```env
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   VITE_GOOGLE_API_KEY=your-api-key
   ```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `V` | Select & Transform Tool |
| `P` | Freehand Pen |
| `H` | Highlighter |
| `E` | Eraser |
| `R` | Geometric Shape |
| `T` | Text Annotation |
| `S` | Sticky Note |
| `M` | Math Formula Palette |
| `L` | Laser Pointer |
| `Ctrl / Cmd + Z` | Undo |
| `Ctrl / Cmd + Y` / `Shift + Z` | Redo |
| `Ctrl / Cmd + S` | Save Project |
| `Delete` / `Backspace` | Delete Selected Item |
| `Esc` | Deselect / Return to Select |

---

## 🚀 Deployment to Vercel

StudyCanvas is ready to deploy on **Vercel** out of the box:

1. Push your code to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Set the environment variables in the Vercel dashboard from your `.env.local`.
4. Deploy!
   - Client bundle is built from Vite (`dist`).
   - Serverless functions in `/api` automatically route to `https://your-domain.vercel.app/api/*`.
