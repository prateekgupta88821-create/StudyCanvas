# StudyCanvas Vercel Production Deployment & Runbook Guide

This runbook outlines the complete configuration, verification, security, and operational procedures for deploying **StudyCanvas** to [Vercel](https://vercel.com).

---

## 1. Architecture & Pre-Deployment Inspection

StudyCanvas is architected as a high-performance modern web application consisting of:
- **Client Frontend**: React 19 Single Page Application (SPA) powered by Vite, React-Konva canvas rendering engine, TailwindCSS v4, KaTeX equation typesetting, and Lucide icons.
- **Serverless API Backends**: Vercel Serverless Functions located in the `/api` directory:
  - `/api/ai-assistant.ts`: Secure server-side proxy for Gemini 1.5/2.0 Flash educational AI operations (summaries, explanations, flashcards, formula transcription, and layout generation).
  - `/api/verify-session.ts`: Session token and authorization verification.
- **Persistence & Cloud Integrations**:
  - **Firebase Auth & Firestore**: User profile, metadata catalog, access control, and collaborative room status.
  - **Google Identity Services & Google Drive API v3**: Direct document storage with per-file `drive.file` scoped authorization for user whiteboard JSON documents and assets.

---

## 2. Vite Build & Routing Configuration

### 2.1 Build Command & Output Directory
In Vercel Project Settings:
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build` (runs `tsc -b && vite build`)
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Node.js Version**: `20.x` or `22.x`

### 2.2 SPA Routing & Serverless Function Rewrites (`vercel.json`)
StudyCanvas includes a production-grade `vercel.json` located at the project root to guarantee:
1. Native routing of `/api/*` endpoints to Vercel Serverless Functions.
2. Full Single Page Application (SPA) HTML5 History fallback to `/index.html` so refreshing deep nested routes like `/whiteboard/:id` or `/dashboard` never yields a 404 HTTP status.
3. Strict HTTP security headers (`nosniff`, `DENY`, and `X-XSS-Protection`).

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

---

## 3. Environment Variables Configuration

Set these variables in your **Vercel Project Settings > Environment Variables** across `Production`, `Preview`, and `Development` environments.

### 3.1 Client-Side Variables (Vite Bundled)
*These variables are prefixed with `VITE_` and are intentionally bundled into the client build for browser SDK initialization:*

| Variable Name | Required | Description | Example / Source |
|---|---|---|---|
| `VITE_FIREBASE_API_KEY` | **Yes** | Firebase Web API Key | Firebase Console > Project Settings |
| `VITE_FIREBASE_AUTH_DOMAIN` | **Yes** | Firebase Auth Domain | `<project-id>.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | **Yes** | Firebase Cloud Project ID | `<project-id>` |
| `VITE_FIREBASE_STORAGE_BUCKET`| **Yes** | Cloud Storage Bucket | `<project-id>.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | **Yes** | Cloud Messaging Sender ID | Numeric ID from Firebase |
| `VITE_FIREBASE_APP_ID` | **Yes** | Firebase Web Application ID | `1:123456789:web:...` |
| `VITE_FIREBASE_MEASUREMENT_ID` | Optional | Google Analytics Measurement ID | `G-XXXXXXXXXX` |
| `VITE_GOOGLE_CLIENT_ID` | **Yes** | Google OAuth 2.0 Web Client ID | GCP Console > Credentials |
| `VITE_GOOGLE_API_KEY` | Optional | Google Cloud Public API Key | GCP Console > Credentials |

### 3.2 Server-Side Privileged Secrets (STRICTLY PRIVATE)
*These variables are NEVER prefixed with `VITE_` and are only accessible inside Vercel Serverless Functions (`/api/*`). They are never included in the client bundle:*

| Secret Name | Required | Description | Security Note |
|---|---|---|---|
| `GEMINI_API_KEY` | **Yes** (for AI Assistant) | Google AI Studio API Key | Kept strictly on server; powers `/api/ai-assistant.ts` |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth Web Client Secret | Kept strictly on server |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Optional | Firebase Admin Service Account JSON | Used for server-side verification |
| `APP_URL` | **Yes** | Canonical Production URL | `https://<your-project>.vercel.app` or custom domain |

---

## 4. Client Bundle Security Audit

Before deployment, ensure that no secrets are exposed in the client code:
1. Only `VITE_` variables are accessed via `import.meta.env`.
2. All calls to Gemini API pass through the serverless endpoint `/api/ai-assistant`.
3. The production bundle output (`dist/assets/*.js`) has been audited and contains only public client identifiers.

---

## 5. Firebase Authorized Domains Configuration

Firebase Authentication blocks OAuth sign-ins from unrecognized web origins.

1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Select your StudyCanvas project.
3. Go to **Build > Authentication > Settings > Authorized Domains**.
4. Click **Add Domain** and add:
   - Your primary Vercel production domain: `studycanvas.vercel.app` (or your chosen project slug).
   - Any custom domain: `studycanvas.com`, `app.studycanvas.com`.
   - Vercel preview deployment wildcard or aliases if testing preview branches.

---

## 6. Google Cloud Console OAuth & Drive API Configuration

StudyCanvas uses Google Identity Services (GIS) token client to authorize user access to Google Drive with the narrow, privacy-conscious `https://www.googleapis.com/auth/drive.file` scope.

### 6.1 Enable Google Drive API
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. In the top project selector, choose your Firebase/Google Cloud project.
3. Navigate to **APIs & Services > Library**.
4. Search for **Google Drive API** and click **Enable**.

### 6.2 Configure OAuth 2.0 Client ID
1. Navigate to **APIs & Services > Credentials**.
2. Click on your **Web application** OAuth 2.0 Client ID (or click **Create Credentials > OAuth client ID > Web application**).
3. Under **Authorized JavaScript origins**, add:
   - `https://<your-project>.vercel.app`
   - `https://<your-custom-domain>.com`
   - `http://localhost:5173` (for local development)
4. Under **Authorized redirect URIs**, add:
   - `https://<your-project>.vercel.app`
   - `https://<your-project>.firebaseapp.com/__/auth/handler`
   - `http://localhost:5173`
5. Click **Save**.

### 6.3 OAuth Consent Screen & Verification Status
1. Navigate to **APIs & Services > OAuth consent screen**.
2. Configure:
   - **App name**: StudyCanvas
   - **User support email**: Your support contact
   - **Developer contact information**: Your contact email
   - **Scopes**: `.../auth/drive.file`, `email`, `profile`, `openid`
3. **Publishing Status**:
   - **Testing Mode**: While in Testing mode, only users added to the **Test users** list in the Google Cloud Console can authorize Google Drive access. If launching to friends, classmates, or instructors, add their Google emails to the Test users table.
   - **Production Mode**: To allow any Google account holder to sign in without an "unverified app" warning, submit your app for verification or switch the Publishing status to In Production.

---

## 7. Deployment Methods

### Option A: Automatic Git Integration (Recommended)
1. Push your repository to GitHub or GitLab:
   ```bash
   git add .
   git commit -m "chore: prepare StudyCanvas for Vercel production deployment"
   git push origin main
   ```
2. In the [Vercel Dashboard](https://vercel.com/new), select **Add New > Project**.
3. Import your `StudyCanvas` repository.
4. Set the environment variables detailed in Section 3.
5. Click **Deploy**. Vercel will build and assign your production domain (`<project-name>.vercel.app`).

### Option B: Vercel CLI Deployment
1. Log in to Vercel:
   ```bash
   npx vercel login
   ```
2. Link your local project:
   ```bash
   npx vercel link
   ```
3. Deploy to production:
   ```bash
   npx vercel --prod
   ```

---

## 8. Post-Deployment Verification & Smoke Test Checklist

Once the production URL is available, execute the following verification steps on the live domain:

| Test ID | Action | Expected Result | Pass/Fail |
|---|---|---|---|
| **ST-01** | Open Production URL | Landing page loads with theme support, hero section, and navigation | [ ] |
| **ST-02** | Sign in with Google | Firebase pop-up authorizes user; success toast displays user name; redirects to `/dashboard` | [ ] |
| **ST-03** | Refresh Dashboard Route | Direct reload of `https://<domain>/dashboard` retains authenticated session; does not 404 | [ ] |
| **ST-04** | Create Whiteboard | Modal accepts title & subject; creates Firestore metadata and navigates to `/whiteboard/:id` | [ ] |
| **ST-05** | Refresh Whiteboard Route | Direct reload of `https://<domain>/whiteboard/:id` recovers active document state; does not 404 | [ ] |
| **ST-06** | Authorize Google Drive | Drive permission prompt triggers; granting `drive.file` creates app folder and syncs payload | [ ] |
| **ST-07** | Drawing & Elements | Pen strokes, shapes, text boxes, math formulas, sticky notes, and mind maps render smoothly | [ ] |
| **ST-08** | Multi-Page Navigation | Add Page 2, rename page, switch between pages without losing Page 1 content | [ ] |
| **ST-09** | Export Document | Export as Multi-page PDF, PNG, and JSON; verify generated files open correctly | [ ] |
| **ST-10** | Educational AI Assistant | Ask AI for revision notes or quiz questions; response generates without leaking API keys | [ ] |
| **ST-11** | Mobile Responsiveness | Open on mobile viewport; touch drawing works, floating toolbars collapse predictably | [ ] |
| **ST-12** | Sign Out | Click sign out; session terminates cleanly and redirects user to public landing page | [ ] |

---

## 9. Rollback & Redeployment Procedures

### 9.1 Instant Rollback via Vercel Dashboard
If a production issue occurs after deploying a new release:
1. Navigate to the **Deployments** tab of your project in the Vercel Dashboard.
2. Locate the last known good deployment.
3. Click the three dots (`...`) menu on that deployment and select **Instant Rollback** (or **Promote to Production**).
4. Vercel immediately redirects 100% of live traffic to the prior deployment in under 1 second without a rebuild.

### 9.2 Rollback via Vercel CLI
```bash
npx vercel rollback [deployment-url-or-id]
```

### 9.3 Redeploying Future Updates
For regular updates:
- Any `git push` to `main` triggers a fresh Vercel production build.
- Pull requests automatically generate isolated Preview Deployments with live preview URLs for testing before merging.
