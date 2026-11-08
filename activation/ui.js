// Contrôleur Auth uniquement : aucun SDK Firestore, aucune fiche étudiante créée ici.
export function mountActivation({document,auth,api,serviceNote='',now=()=>Date.now()}){
 const el=id=>document.getElementById(id),form=el('account-form');
 let mode='create',busy=false,ready=false,lastVerification=0;
 const validEmail=value=>/^[^@\s]+@uam\.edu\.sn$/.test(value)&&value.length<=254;
 const address=()=>el('email').value.trim().toLowerCase();
 const message=(text,tone='info')=>{el('message').textContent=text;el('message').dataset.tone=tone;};
 function controls(){for(const item of document.querySelectorAll('input,button'))item.disabled=!ready||busy;form.setAttribute('aria-busy',String(busy));}
 const setBusy=value=>{busy=value;controls();};
 function setMode(value){mode=value;const create=mode==='create';el('form-title').textContent=create?'Créer mon accès':'Me connecter à mon accès';el('password').autocomplete=create?'new-password':'current-password';el('password').minLength=create?10:1;el('password-hint').textContent=create?'— 10 caractères minimum':'— celui de votre nouvel accès Auth';el('confirm-password').hidden=!create;el('confirm-password').required=create;el('confirm-label').hidden=!create;el('submit').textContent=create?'Créer mon accès et recevoir le lien':'Me connecter';el('toggle').textContent=create?'J’ai déjà créé cet accès : me connecter':'Je n’ai pas encore créé cet accès';el('password').value='';el('confirm-password').value='';}
 function render(user){
  form.hidden=!!user;el('alternative').hidden=!!user;el('session').hidden=!user;
  el('session-email').textContent=user?.email||'';
  el('verified').hidden=!user?.emailVerified;el('unverified').hidden=!!user?.emailVerified;
  if(!user){el('password').value='';el('confirm-password').value='';el('email').value='';}
  controls();
 }
 function errorText(error){
  switch(error?.code){
   case 'auth/email-already-in-use':return 'Si vous avez déjà créé cet accès, choisissez « me connecter » ou réinitialisez son mot de passe.';
   case 'auth/invalid-credential':case 'auth/user-not-found':case 'auth/wrong-password':case 'auth/user-disabled':return 'Connexion impossible. Vérifiez vos informations ou utilisez la réinitialisation du mot de passe.';
   case 'auth/too-many-requests':case 'auth/quota-exceeded':return 'Trop de demandes ou quota atteint. Patientez avant de réessayer ; contactez l’équipe si cela persiste.';
   case 'auth/network-request-failed':return 'Connexion réseau impossible. Réessayez lorsque votre connexion est stable.';
   case 'auth/operation-not-allowed':case 'auth/configuration-not-found':case 'auth/unauthorized-continue-uri':case 'auth/invalid-api-key':case 'auth/invalid-app-credential':case 'auth/missing-app-credential':return 'Le service doit être configuré par l’équipe (Authentication, domaine autorisé ou App Check). Ne multipliez pas les tentatives.';
   default:return 'L’opération n’a pas pu être terminée. Réessayez plus tard ou contactez l’équipe, sans transmettre votre mot de passe.';
  }
 }
 async function sendVerification(user){
  if(!user||!validEmail(user.email||''))throw new Error('Adresse non universitaire.');
  if(lastVerification&&now()-lastVerification<60000){message('Un e-mail a déjà été demandé récemment. Attendez une minute et vérifiez les indésirables.');return;}
  await api.sendEmailVerification(user);lastVerification=now();
  if(auth.currentUser?.uid===user.uid)message('E-mail de vérification envoyé. Ouvrez le lien reçu, puis revenez cliquer sur « vérifier ».','success');
 }
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(!ready||busy)return;
  const email=address(),password=el('password').value;
  if(!validEmail(email)){message('Utilisez votre adresse personnelle en @uam.edu.sn, identique à celle de votre ancien profil.','error');return;}
  if(!password||password.length>4096){message('Saisissez un mot de passe valide.','error');return;}
  if(mode==='create'&&(password.length<10||password!==el('confirm-password').value)){message('Choisissez au moins 10 caractères et saisissez deux fois le même mot de passe.','error');return;}
  setBusy(true);message('Traitement en cours…');
  try{
   if(mode==='create'){
    const policy=await api.validatePassword(auth,password);if(!policy.isValid){message('Le mot de passe ne respecte pas la politique Firebase du projet. Choisissez un mot de passe plus fort.','error');return;}
    const result=await api.createUserWithEmailAndPassword(auth,email,password);
    if(auth.currentUser?.uid===result.user.uid){render(result.user);try{await sendVerification(result.user);}catch(error){message('Votre accès Auth a été créé, mais l’e-mail n’a pas pu être envoyé. Utilisez le bouton de renvoi. '+errorText(error),'error');}}
   }else{
    const result=await api.signInWithEmailAndPassword(auth,email,password);
    if(!validEmail(result.user.email||'')){await api.signOut(auth);message('Une adresse universitaire valide est requise.','error');return;}
    render(result.user);message(result.user.emailVerified?'Adresse vérifiée. La reprise de votre profil reste une opération séparée par l’équipe.':'Connecté. Vérifiez votre adresse e-mail pour préparer la reprise du profil.');
   }
  }catch(error){message(errorText(error),'error');}
  finally{el('password').value='';el('confirm-password').value='';setBusy(false);}
 });
 el('toggle').addEventListener('click',()=>{if(busy||!ready)return;setMode(mode==='create'?'login':'create');message('');el('email').focus();});
 el('resend').addEventListener('click',async()=>{if(busy||!ready||!auth.currentUser)return;setBusy(true);try{await sendVerification(auth.currentUser);}catch(error){message(errorText(error),'error');}finally{setBusy(false);}});
 el('check').addEventListener('click',async()=>{
  if(busy||!ready||!auth.currentUser)return;setBusy(true);
  try{const user=auth.currentUser;await api.reload(user);const token=await api.getIdTokenResult(user,true);if(auth.currentUser?.uid!==user.uid)return;
   const verified=user.emailVerified===true&&token.claims.email_verified===true&&validEmail(token.claims.email||'');
   // Le badge ne prouve jamais un import Firestore ; seul le contrôle Auth côté outil fera foi.
   render(user);el('verified').hidden=!verified;el('unverified').hidden=verified;
   message(verified?'Adresse vérifiée. Attendez la confirmation de l’équipe pour retrouver votre profil.':'Adresse pas encore vérifiée. Cliquez sur le lien reçu puis réessayez.',verified?'success':'info');
  }catch(error){message(errorText(error),'error');}finally{setBusy(false);}
 });
 el('reset').addEventListener('click',async()=>{
  if(busy||!ready)return;const email=address();if(!validEmail(email)){message('Saisissez d’abord votre adresse en @uam.edu.sn.','error');el('email').focus();return;}
  setBusy(true);try{await api.sendPasswordResetEmail(auth,email);message('Si un accès correspond à cette adresse, un e-mail de réinitialisation sera envoyé. Vérifiez aussi les indésirables.');}
  catch(error){if(['auth/user-not-found','auth/invalid-email'].includes(error?.code))message('Si un accès correspond à cette adresse, un e-mail de réinitialisation sera envoyé. Vérifiez aussi les indésirables.');else message(errorText(error),'error');}finally{setBusy(false);}
 });
 el('signout').addEventListener('click',async()=>{if(busy||!ready)return;setBusy(true);try{await api.signOut(auth);render(null);message('Déconnecté. Fermez cette page si vous utilisez un appareil partagé.');}catch(error){message(errorText(error),'error');}finally{setBusy(false);}});
 setMode('create');controls();
 const unsubscribe=api.onAuthStateChanged(auth,user=>{ready=true;render(user);el('service-note').textContent=serviceNote||'Connexion en mémoire pour cette page : aucune session persistante enregistrée par ce module.';},()=>{ready=false;controls();message('Impossible de charger la session. Rechargez la page ou contactez l’équipe.','error');});
 return {unsubscribe};
}
