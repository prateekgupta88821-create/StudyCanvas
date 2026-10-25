# StudyCanvas — Google Drive & Google Identity Services (GIS) Setup Guide

StudyCanvas integrates with **Google Drive API v3** using the modern **Google Identity Services (GIS)** token client flow (`google.accounts.oauth2.initTokenClient`).

This guide details the exact steps to configure Google Cloud Console, OAuth consent screens, scopes, test users, and environment variables.

---

## 1. Why Google Drive Integration?

- **100% User Data Ownership**: Educational whiteboards, mathematical formulas, lecture slides, and student annotations are stored directly in the educator's personal Google Drive as `.studycanvas` files.
- **Portability & Recovery**: Even if the StudyCanvas app is offline, educators can view, download, and back up their `.studycanvas` files directly from Google Drive.
- **Zero Lock-in**: Users retain full control over sharing, permissions, and file lifecycles through Google Drive.

---

## 2. OAuth Scope Strategy: The Principle of Least Privilege

StudyCanvas intentionally uses the **narrowest practical scope**:

| Scope | URI | Description & Justification |
| :--- | :--- | :--- |
| **Drive File (Default)** | `https://www.googleapis.com/auth/drive.file` | **Recommended**. Grants access *only* to files and folders created by StudyCanvas or explicitly opened by the user with StudyCanvas. **Cannot read, edit, or delete any unrelated personal Google Docs, Sheets, photos, or emails.** |
| **Drive Read-Only (Optional)** | `https://www.googleapis.com/auth/drive.readonly` | Only needed if a user explicitly chooses to browse and import legacy non-StudyCanvas files from their broader Drive library. |

> [!IMPORTANT]
> Never use the broad `https://www.googleapis.com/auth/drive` scope. It grants unrestricted read/write access to the user's entire Drive and triggers Google's most stringent Restricted Scope Security Assessment.

---

## 3. Google Cloud Console Setup Steps

### Step 1: Create or Select a Google Cloud Project
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. In the top project selector, click **New Project** (or select your existing Firebase/GCP project).
3. Name your project (e.g., `StudyCanvas-Edu`) and click **Create**.

### Step 2: Enable the Google Drive API
1. In the navigation menu, go to **APIs & Services** > **Library**.
2. Search for **Google Drive API**.
3. Select **Google Drive API** and click **Enable**.

### Step 3: Configure the OAuth Consent Screen
1. Navigate to **APIs & Services** > **OAuth consent screen**.
2. Choose **User Type**:
   - **External**: Allows any user with a Google account to sign in (default for public apps).
   - **Internal**: Restricted to users in your Google Workspace organization (ideal for school/university-managed domains).
3. Click **Create** and complete the **App Information**:
   - **App name**: `StudyCanvas`
   - **User support email**: Your support email.
   - **App logo**: Optional during testing.
   - **Developer contact information**: Your email address.
4. Click **Save and Continue**.

### Step 4: Configure OAuth Scopes
1. Click **Add or Remove Scopes**.
2. Filter or search for:
   ```
   https://www.googleapis.com/auth/drive.file
   ```
3. Check the box next to `.../auth/drive.file` (description: *"See, edit, create, and delete only the specific Google Drive files you use with this app"*).
4. Click **Update** > **Save and Continue**.

### Step 5: Add Test Users (While App Status is "Testing")
While your app is in **Testing** status, only authorized test users can grant Google Drive permissions:
1. Under **Test users**, click **+ Add Users**.
2. Add the Google email addresses of educators, developers, or student testers who will test the application.
3. Click **Save and Continue**.

---

## 4. Create OAuth 2.0 Web Client ID

1. Navigate to **APIs & Services** > **Credentials**.
2. Click **+ Create Credentials** > **OAuth client ID**.
3. Set **Application type** to **Web application**.
4. Set **Name**: `StudyCanvas Web Client`.
5. Under **Authorized JavaScript origins**, click **+ Add URI** and add:
   - `http://localhost:5173` (Vite default development server)
   - `http://localhost:3000` (optional alternate port)
   - Your production domain (e.g., `https://studycanvas.vercel.app`)
6. Under **Authorized redirect URIs**:
   - For GIS token client (used by StudyCanvas), requests use fast popup/postMessage callbacks, but you can also add `http://localhost:5173` and your production domain for standard redirect compliance.
7. Click **Create**.
8. Copy your **Client ID** (it ends with `.apps.googleusercontent.com`).

---

## 5. Configure StudyCanvas Environment Variables

In your StudyCanvas root folder, create or edit `.env.local`:

```env
# Google Cloud OAuth 2.0 Client ID (from Step 4)
VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com

# Firebase Authentication (from Firebase Console)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

---

## 6. How StudyCanvas Manages Tokens & Security

1. **Decoupled Auth & Drive Scope**:
   - Firebase Authentication handles user identity and session persistence.
   - Google Identity Services (`googleIdentityService.ts`) manages incremental Drive access tokens.
   - If the user signs in with Google, StudyCanvas checks for Drive permissions. If permission was revoked or expired, a clean "Connect Google Drive" flow prompts the user without breaking their sign-in session.
2. **Token Lifetime & Refresh**:
   - Access tokens expire after 1 hour (3600s).
   - StudyCanvas tracks token expiration in `sessionStorage` (`studycanvas_drive_token_expires`) with a 60-second safety buffer.
   - On 401 Unauthorized or expiry, StudyCanvas prompts an automatic or single-click reconnect.
3. **No Tokens in Storage or URLs**:
   - Privileged client secrets are **never** stored on the client.
   - Access tokens are stored in `sessionStorage` and never persisted to unencrypted `localStorage` or exposed in URL query parameters.

---

## 7. Documented JSON Project Format (`.studycanvas`)

All whiteboards saved to Google Drive use a documented format with metadata headers and asset manifests:

```json
{
  "$schema": "https://studycanvas.app/schemas/project-v1.json",
  "format": "studycanvas",
  "schemaVersion": "1.0",
  "exportedAt": 1729864800000,
  "project": {
    "id": "canvas_k8j3m9x",
    "title": "Quantum Mechanics — Harmonic Oscillator",
    "subject": "Physics",
    "tags": ["quantum", "oscillator", "lecture-3"],
    "ownerId": "uid_abc123",
    "ownerEmail": "professor@university.edu",
    "createdAt": 1729860000000,
    "updatedAt": 1729864800000,
    "version": 2,
    "driveFileId": "1aBcDeFgHiJkLmNoPqRsTuVwXyZ",
    "driveRevisionId": "rev_42",
    "driveSyncedAt": 1729864800000,
    "activePageIndex": 0,
    "pages": [
      {
        "id": "page_1",
        "title": "Ladder Operators & Wavefunctions",
        "backgroundColor": "#090d16",
        "gridType": "dots",
        "elements": [ ... ]
      }
    ]
  },
  "assetsManifest": {}
}
```

### Drive File Identification
StudyCanvas files in Google Drive are marked with custom `appProperties`:
- `app`: `StudyCanvas`
- `schemaVersion`: `1.0`
- `projectId`: `canvas_...`
- `subject`: Academic subject name

This metadata allows StudyCanvas to search and list its files in Google Drive using:
```http
GET https://www.googleapis.com/drive/v3/files?q=trashed = false and appProperties has { key='app' and value='StudyCanvas' }
```
while completely preventing accidental modification of unrelated Google Docs or Sheets.

---

## 8. Production Verification (When Launching Publicly)

When preparing to publish StudyCanvas to production:
1. In Google Cloud Console, navigate to **APIs & Services** > **OAuth consent screen**.
2. Click **Publish App**.
3. Because StudyCanvas uses `https://www.googleapis.com/auth/drive.file` (a non-sensitive / non-restricted scope for app-created files), **Google does NOT require a full security audit (CASA)**.
4. Ensure you provide:
   - Verified domain via Google Search Console.
   - Valid public Privacy Policy URL.
   - Valid public Terms of Service URL.
