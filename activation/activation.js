import {initializeApp} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import {initializeAuth,inMemoryPersistence,createUserWithEmailAndPassword,signInWithEmailAndPassword,sendEmailVerification,sendPasswordResetEmail,onAuthStateChanged,signOut,reload,getIdTokenResult,validatePassword} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js';
import {initializeAppCheck,ReCaptchaV3Provider} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app-check.js';
import {firebaseConfig,RECAPTCHA_V3_SITE_KEY} from './firebase-config.js';
import {mountActivation} from './ui.js';
try{
 if(window.top!==window.self)throw new Error('Ouvrez cette page directement, pas dans un cadre intégré.');
 if(location.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(location.hostname))throw new Error('Cette page doit être publiée en HTTPS. L’ouverture directe depuis un fichier ne convient pas.');
 if(firebaseConfig.projectId!=='agromentor-1fd49')throw new Error('Projet différent : vérifier avec le responsable avant toute activation.');
 const app=initializeApp(firebaseConfig,'AgroMentorActivation');
 if(RECAPTCHA_V3_SITE_KEY.trim())initializeAppCheck(app,{provider:new ReCaptchaV3Provider(RECAPTCHA_V3_SITE_KEY),isTokenAutoRefreshEnabled:true});
 const auth=initializeAuth(app,{persistence:inMemoryPersistence});auth.languageCode='fr';
 mountActivation({document,auth,api:{createUserWithEmailAndPassword,signInWithEmailAndPassword,sendEmailVerification,sendPasswordResetEmail,onAuthStateChanged,signOut,reload,getIdTokenResult,validatePassword},serviceNote:RECAPTCHA_V3_SITE_KEY.trim()?'Accès Auth temporaire ; la session reste en mémoire pour cette page.':'Accès Auth temporaire. App Check non initialisé sur cette page : clé de site non renseignée.'});
}catch{
 document.getElementById('service-note').textContent='Activation indisponible : vérifier HTTPS, projet, configuration Firebase et App Check avec l’équipe. Aucun accès créé par ce chargement.';
}
