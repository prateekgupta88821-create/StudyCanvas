# Firebase Authentication & Cloud Firestore Setup Guide for StudyCanvas

This document outlines the exact Firebase Console configuration steps required to enable live Google Authentication, Google Drive token synchronization, and Cloud Firestore metadata persistence for StudyCanvas.

---

## 1. Create or Select Your Firebase Project

1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or select an existing Google Cloud / Firebase project).
3. Name your project (e.g., `studycanvas-prod` or `studycanvas-edu`).
4. (Optional) Enable Google Analytics according to your preference, then click **Create project**.

---

## 2. Register Your Web Application

1. In the Project Overview dashboard, click the **Web icon (`</>`)** to add a web application.
2. Enter an App nickname (e.g., `StudyCanvas Web Client`).
3. Check **Also set up Firebase Hosting for this app** (optional, recommended).
4. Click **Register app**.
5. Firebase will display your web configuration object:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "studycanvas-xxxx.firebaseapp.com",
     projectId: "studycanvas-xxxx",
     storageBucket: "studycanvas-xxxx.firebasestorage.app",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef..."
   };
   ```

---

## 3. Configure Local Environment Variables (`.env.local`)

Copy `.env.example` to `.env.local` in your project root:

```bash
cp .env.example .env.local
```

Fill in the values with your actual Firebase project credentials:

```ini
# Firebase Public Web Configuration
# (Never store service-account private keys or secret server tokens here)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=studycanvas-xxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=studycanvas-xxxx
VITE_FIREBASE_STORAGE_BUCKET=studycanvas-xxxx.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef...

# Application Environment
VITE_APP_ENV=development
```

> [!NOTE]
> Firebase client API keys (`VITE_FIREBASE_API_KEY`) identify your Firebase project with Google and are designed to be public in browser bundles. Security is enforced through **Firebase Security Rules** (`firestore.rules`) and **Authorized Domains**, never by hiding the frontend API key.

---

## 4. Enable Google as an Authentication Provider

1. In the Firebase Console left navigation menu, go to **Build** > **Authentication**.
2. Click **Get Started** if you haven't initialized Authentication yet.
3. Select the **Sign-in method** tab.
4. Under **Additional providers** (or Sign-in providers), click **Google**.
5. Toggle the **Enable** switch to ON.
6. Provide a **Project public-facing name** (e.g., `StudyCanvas`).
7. Select a **Project support email** from the dropdown.
8. Click **Save**.

---

## 5. Configure Authorized Domains

Google Sign-In will reject popups originating from unapproved domains with `auth/unauthorized-domain`.

1. In Firebase Console, go to **Authentication** > **Settings** > **Authorized domains**.
2. Verify that the following domains are present:
   - `localhost` (added by default for local development)
   - `127.0.0.1` (add this if you access Vite via IP)
   - Your custom deployment domain (e.g., `studycanvas.edu`, `study-canvas.vercel.app`, or `your-app.web.app`)
3. Click **Add domain** for any additional staging or production URLs.

---

## 6. Configure Google Cloud OAuth Consent Screen & Scopes

StudyCanvas requests user info and Google Drive file permissions to save `.studycanvas` whiteboards directly to the educator's personal Drive.

1. Navigate to the [Google Cloud Console API & Services](https://console.cloud.google.com/apis/credentials/consent).
2. Select the same Google Cloud project associated with your Firebase project.
3. Under **OAuth consent screen**:
   - Ensure User Type is set to **External** (for general public/student access) or **Internal** (if restricted to your school's Google Workspace domain).
   - Enter App Name (`StudyCanvas`), User support email, and Developer contact information.
4. Go to **Scopes** > **Add or Remove Scopes**:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `https://www.googleapis.com/auth/drive.file` (Per-file access to files created or opened by StudyCanvas)
5. Save and continue. If the app is in **Testing** status, add your Google account under **Test users**.

---

## 7. Deploy Cloud Firestore & Security Rules

StudyCanvas uses Cloud Firestore to synchronize whiteboard metadata in real time while keeping board files private.

1. In Firebase Console, go to **Build** > **Firestore Database**.
2. Click **Create database**.
3. Choose a Firestore location close to your users (e.g., `nam5 (us-central)` or `europe-west1`).
4. Start in **Production mode**.
5. Deploy the provided `firestore.rules`:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Included Security Rules Structure (`firestore.rules`):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null && request.auth.uid != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    match /users/{userId} {
      allow read, write: if isOwner(userId);
      allow delete: if false;
    }

    match /projects/{projectId} {
      allow read, write: if isAuthenticated() && 
        (resource == null || resource.data.ownerId == request.auth.uid) &&
        request.resource.data.ownerId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.ownerId == request.auth.uid;
    }
  }
}
```

---

## 8. Verification Checklist

- [x] Firebase SDK initialized with persistence (`browserLocalPersistence`).
- [x] Popup closed / cancelled gracefully handled (`auth/popup-closed-by-user`).
- [x] Popup blocked notification and retry action supported (`auth/popup-blocked`).
- [x] Network failures handled gracefully (`auth/network-request-failed`).
- [x] Domain authorization errors surfaced with direct instructions (`auth/unauthorized-domain`).
- [x] Loading screen active while resolving session token to prevent redirect flicker.
- [x] Toast notification `"Successfully signed in. Welcome to StudyCanvas!"` shown only on verified authentication.
- [x] User menu renders Google avatar (`photoURL`), display name (`displayName`), and verified email.
- [x] Protected routes (dashboard, projects, whiteboard) redirect unauthenticated users to the landing page.
- [x] Sign out cleans up session storage, local storage, and resets authenticated state.
