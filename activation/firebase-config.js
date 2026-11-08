// Configuration Web publique : ce n’est pas une clé privée d’administration.
export const firebaseConfig = Object.freeze({
  apiKey: 'AIzaSyBkox5PdBjhbdQCkHCuRU2K-Hc_nIrfQVg',
  authDomain: 'agromentor-1fd49.firebaseapp.com',
  projectId: 'agromentor-1fd49',
  storageBucket: 'agromentor-1fd49.firebasestorage.app',
  messagingSenderId: '306686983284',
  appId: '1:306686983284:web:5517841775500efcaaa521'
});

// Renseigner la clé de SITE reCAPTCHA v3, jamais une clé secrète.
// L’application n’active pas à distance l’enforcement App Check : voir LISEZ-MOI.md.
export const RECAPTCHA_V3_SITE_KEY = '';
