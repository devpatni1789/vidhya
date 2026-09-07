// Firebase Web App configuration.
// Create a Firebase project, register a Web app, enable Authentication > Sign-in method > Email/Password,
// then replace the empty strings below with the values from Firebase Console > Project settings.
// Firebase web config values identify the public web app; never put admin SDK credentials or service-account JSON here.
window.GTU_CONFIG = Object.freeze({
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  },
  // Kept for the local fallback build when Firebase is not configured.
  googleClientId: ''
});
