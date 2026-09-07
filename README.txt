GTU DIPLOMA STUDY SPACE
========================

This is a complete offline, browser-local GTU student dashboard package.

OPEN DIRECTLY
-------------

1. Extract the ZIP while keeping the folder structure intact.
2. Open `index.html` directly in Chrome, Edge, Firefox, or another modern browser.
3. Do not use localhost, Live Server, npm, Node.js, or any build command.

REQUIRED LOCAL FILES
--------------------

`index.html` is the entry point. The visual system and existing motion remain in
`assets/css/styles.css`, while the dashboard logic, authentication, local data,
navigation, upload handling, and interactions are in `assets/js/app.js`.

LOCAL ACCOUNT OPTIONS
---------------------

On first open, choose `Create account`. The default `Username only` option creates
a local account without an email address. Enter a name, username, password,
confirmation, semester, and branch. The optional `Add email` mode keeps the same
local account flow but lets you store an email address for profile context.

After creation, log in with the username and password. Existing accounts from the
previous email/username version remain compatible: login accepts the saved email,
username, or legacy login identity.

PRIVACY AND LIMITATIONS
-----------------------

When Firebase configuration is blank, authentication and study content are stored only in this browser with localStorage. When Firebase is configured, account authentication is handled by Firebase Authentication, while study content remains browser-local unless a separate database sync is implemented.
Uploaded files up to 2.5 MB are retained locally for browser download; larger files
are remembered by name only to keep the direct-open package lightweight.

FEATURES
--------

The package includes the PinHome-inspired teal and warm-white workspace treatment,
existing cinematic transitions and motion, responsive layout, dashboard overview,
GTU syllabus tracker, unit progress, notes, tasks, assignments, solutions, exam
papers, timetable, profile, settings, theme controls, local uploads, and keyboard
focus support.

FIREBASE AUTHENTICATION
-----------------------

The login screen supports Firebase Email/Password authentication and includes a
Google popup sign-in path when Firebase is configured. Its configuration is
intentionally empty in `assets/js/config.js`, so the package remains safe to open
until the owner adds their Firebase Web app values. If Firebase is not configured,
the original local-browser account fallback remains available.

MOTION
------

The existing cinematic transition remains in place. The entry screen now adds a
staged, ease-out 3D assembly: the copy enters from the left, the account card
moves forward from the right with a restrained dock/bounce, internal details
cascade into view, and the local account mode control receives a subtle floating
motion. Reduced-motion preferences disable the added choreography safely.

This multi-file package must be extracted with its `assets` folder beside `index.html` so the local stylesheet, configuration, and JavaScript load correctly.

CURRICULUM DATA
---------------

The complete normalized curriculum is stored in `assets/data/curriculum.js`.
It contains 30 supplied GTU Diploma subjects across Semesters 1–5, including
all six Semester 3 subjects: Digital Electronics Fundamentals, Data Structures,
Relational Database Management System, Fundamentals Operating System, Computer
Networks, and Responsive Web Page Design.

Each subject includes its course code, semester, chapter/unit list, and a
`weights` array aligned to those units. Every weight array totals 100. The
syllabus tracker uses these official unit weightages for subject progress and
semester progress; completing a 14% unit contributes 14%, while a 24% unit
contributes 24%. All course rows, subject selectors, and chapter accordions use
the same curriculum data file.

FIREBASE AUTHENTICATION SETUP
-----------------------------

This package now supports Firebase Authentication through the Firebase Web SDK. The
Firebase scripts are loaded from the official Firebase CDN in `index.html`. To enable
remote authentication, create or open a Firebase project, register a Web app, and
turn on Authentication > Sign-in method > Email/Password. Copy the Web app config
from Firebase Console > Project settings into `assets/js/config.js`:

```
window.GTU_CONFIG = Object.freeze({
  firebase: {
    apiKey: 'YOUR_FIREBASE_WEB_API_KEY',
    authDomain: 'YOUR_PROJECT.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT.firebasestorage.app',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId: 'YOUR_WEB_APP_ID'
  },
  googleClientId: ''
});
```

Only the Firebase Web app configuration belongs in this static website. Never put
Firebase Admin SDK credentials, service-account JSON, or private server secrets in
this package. Add the GitHub Pages domain to Firebase Authentication > Settings >
Authorized domains. When all required Firebase fields are non-empty, the website uses
Firebase for account creation, email/password login, password-reset email, Google
popup sign-in, auth-state persistence, and logout. The profile, syllabus progress,
notes, tasks, files, and timetable remain browser-local unless a separate database
sync is implemented. When the fields stay empty, the original local-browser account
fallback remains available.

LOCAL TESTING — IMPORTANT
--------------------------

Do not double-click `index.html` after Firebase values are configured. That opens the
page with the unsupported `file://` protocol. On Windows, double-click
`START_LOCAL_SERVER.bat`, keep the black terminal window open, and visit
`http://localhost:5500/` in Chrome. Alternatively, open PowerShell in this folder
and run:

```
python -m http.server 5500
```

Then visit `http://localhost:5500/`. For GitHub Pages, use the HTTPS repository site
URL and add its hostname to Firebase Authentication > Settings > Authorized domains.

CROSS-DEVICE PROGRESS SYNC
---------------------------

The Firebase-ready build now syncs syllabus progress, selected semester, and profile
metadata to Firestore under the signed-in Firebase user. The document path is
`users/{uid}/app/state`, so the same Google account can load its progress on another
browser or phone. Notes, tasks, timetable entries, and uploaded files remain local in
this version unless separately migrated to Firestore or Firebase Storage.

Enable Firestore Database in the Firebase Console before testing. The ZIP also includes `firestore.rules`. Publish that file in Firebase Console → Firestore → Rules so each signed-in user can access only their own state document:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/app/{document} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

The app first loads the cloud progress after Firebase auth completes, merges it with
the browser cache, and writes progress changes back to the same user document. If
Firestore is unavailable, the local browser copy remains available and the app shows
a cloud-sync warning.

PUBLIC CROSS-DEVICE SHARING
---------------------------

The public share flow stores uploaded bytes in Firebase Storage and publishes a share manifest in Firestore. A recipient can open the generated `#shared=...` link without creating an account, view the original file URL, and download the original bytes. The owner must use a configured Firebase project and be signed in before uploading/sharing; local-browser-only mode cannot transfer files between devices.

To enable it:
1. Add the Firebase Web app values to `assets/js/config.js`.
2. Enable Authentication, Firestore Database, and Storage in Firebase Console.
3. Publish both `firestore.rules` and `storage.rules`.
4. Upload files again after Firebase is configured so the original file bytes are stored in Storage.
5. Use Share → Copy Link. Recipients can open the link directly without login.
