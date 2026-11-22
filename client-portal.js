(() => {
  'use strict';
  const BASE='https://okdohokhlkxrmxpevees.supabase.co';
  const PUBLIC_KEY='sb_publishable_EiTruyR5fwwHpS_PzO5_iA_d1i4iMCP';
  // API sur le même hébergeur : Vercel et Cloudflare exposent les mêmes routes.
  const API_BASE='';
  const prefix='bsa_client_';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const date=s=>s?new Date(s).toLocaleString('fr-FR'):'—';
  const money=n=>n===null||n===undefined?'À définir':new Intl.NumberFormat('fr-FR').format(n)+' FCFA';
  const labels={new:'Nouvelle',reviewing:'En cours d’examen',quoted:'Devis disponible',in_progress:'En réalisation',completed:'Terminée',cancelled:'Annulée'};
  const adminMode=document.body.dataset.clientMode==='admin';
  let authMode='login',captchatoken='',captchaId=null,adminRows=[],clientRows=[];
  function notice(msg,kind='info'){const e=$('portalMessage');if(!e)return;e.hidden=!msg;e.dataset.kind=kind;e.textContent=msg;if(msg)e.scrollIntoView({behavior:'smooth',block:'nearest'});}
  function token(){return sessionStorage.getItem(prefix+'token')||'';}
  function saveAuth(d){sessionStorage.setItem(prefix+'token',d.access_token);sessionStorage.setItem(prefix+'refresh',d.refresh_token||'');sessionStorage.setItem(prefix+'expiry',String(Date.now()+Math.max(60,Number(d.expires_in)||3600)*1000));}
  function clearAuth(){['token','refresh','expiry'].forEach(k=>sessionStorage.removeItem(prefix+k));}
  async function auth(path,data){
    const res=await fetch(BASE+'/auth/v1/'+path,{method:'POST',headers:{apikey:PUBLIC_KEY,'Content-Type':'application/json'},body:JSON.stringify(data)});
    const out=await res.json().catch(()=>({}));
    if(!res.ok){
      const msg=out.msg||out.message||out.error_description||out.error||'Authentification impossible.';
      if(res.status===429)throw Error('Trop de tentatives. Réessayez plus tard.');
      if(res.status>=500)throw Error('Le service de création de compte est momentanément indisponible. Réessayez plus tard.');
      throw Error(msg);
    }
    return out;
  }
  async function refresh(){
    const refreshToken=sessionStorage.getItem(prefix+'refresh');
    if(!refreshToken)return false;
    try{const r=await auth('token?grant_type=refresh_token',{refresh_token:refreshToken});if(r.access_token){saveAuth(r);return true;}}catch{}
    clearAuth();return false;
  }
  async function api(path,opt={}){
    if(token()&&Date.now()>Number(sessionStorage.getItem(prefix+'expiry')||0)-30000)await refresh();
    const headers={'Accept':'application/json',...(opt.headers||{})};
    if(token())headers.Authorization='Bearer '+token();
    if(opt.body)headers['Content-Type']='application/json';
    const res=await fetch(API_BASE+path,{...opt,headers,cache:'no-store'});
    const out=await res.json().catch(()=>({}));
    if(!res.ok)throw Object.assign(Error(out.error||'Service indisponible.'),{status:res.status});
    return out;
  }
  function showAuth(text=''){
    $('authCard').hidden=false;
    if($('portalDashboard'))$('portalDashboard').hidden=true;
    if($('adminDashboard'))$('adminDashboard').hidden=true;
    if(text)notice(text,'error');
  }
  function setAuthMode(next){
    authMode=next;
    const signingUp=next==='signup';
    const resetting=next==='reset';
    $('nameField').hidden=!signingUp;
    $('authName').required=signingUp;
    $('emailField').hidden=resetting;
    $('authEmail').required=!resetting;
    $('authTitle').textContent=signingUp?'Créer votre compte':resetting?'Choisir un nouveau mot de passe':'Connexion sécurisée';
    $('authSubmit').textContent=signingUp?'Créer mon compte':resetting?'Enregistrer mon mot de passe':'Se connecter';
    $('authToggle').textContent=signingUp||resetting?'J’ai déjà un compte':'Créer un compte';
    $('authDesc').textContent=signingUp?'Créez votre compte avec votre e-mail et un mot de passe de 8 caractères minimum.':resetting?'Saisissez un nouveau mot de passe de 8 caractères minimum.':'Connectez-vous avec votre compte Bickri pour suivre vos dossiers.';
    $('authForgot').hidden=next!=='login';
    $('authPassword').autocomplete=signingUp||resetting?'new-password':'current-password';
  }
  $('authToggle').addEventListener('click',()=>{
    setAuthMode(authMode==='login'?'signup':'login');
    notice('');
    $('authPassword').value='';
    $('authEmail').focus();
  });
  $('authForgot')?.addEventListener('click',async()=>{
    const email=$('authEmail').value.trim();
    if(!email||!$('authEmail').checkValidity()){
      $('authEmail').reportValidity();
      $('authEmail').focus();
      return;
    }
    const button=$('authForgot');
    button.disabled=true;
    notice('Demande de récupération du mot de passe…');
    try{
      await auth('recover?redirect_to='+encodeURIComponent(location.origin+'/espace-client/'),{email});
      notice('Si cette adresse possède un compte, un lien de récupération sera envoyé. Vérifiez votre boîte de réception et les courriers indésirables.','success');
    }catch(err){
      notice(err?.message||'Impossible de demander la récupération du mot de passe.','error');
    }finally{button.disabled=false;}
  });
  // Les liens de récupération utilisent le flux implicite Supabase.
  // On retire les jetons de l'URL dès que possible pour ne pas les exposer à la navigation.
  const recoveryFragment=new URLSearchParams(location.hash.replace(/^#/,''));
  if(recoveryFragment.get('type')==='recovery'){
    const access=recoveryFragment.get('access_token');
    const refreshToken=recoveryFragment.get('refresh_token');
    history.replaceState(null,'',location.pathname+location.search);
    if(access){
      saveAuth({access_token:access,refresh_token:refreshToken||'',expires_in:Number(recoveryFragment.get('expires_in'))||3600});
      setAuthMode('reset');
      notice('Lien vérifié. Définissez maintenant votre nouveau mot de passe.','success');
    }else{
      notice('Ce lien de récupération est invalide ou a expiré. Demandez un nouveau lien.','error');
    }
  }
  $('authForm').addEventListener('submit',async e=>{
    e.preventDefault();const b=$('authSubmit'),d=Object.fromEntries(new FormData(e.currentTarget).entries());
    b.disabled=true;
    notice(authMode==='signup'?'Création de votre compte…':authMode==='reset'?'Mise à jour du mot de passe…':'Connexion à votre compte…');
    try{
      if(authMode==='reset'){
        const response=await fetch(BASE+'/auth/v1/user',{
          method:'PUT',
          headers:{apikey:PUBLIC_KEY,Authorization:'Bearer '+token(),'Content-Type':'application/json'},
          body:JSON.stringify({password:String(d.password)})
        });
        const result=await response.json().catch(()=>({}));
        if(!response.ok)throw Error(result.msg||result.message||result.error_description||'Impossible de modifier le mot de passe.');
        clearAuth();
        $('authPassword').value='';
        setAuthMode('login');
        notice('Mot de passe mis à jour. Connectez-vous avec votre nouveau mot de passe.','success');
      }else if(authMode==='signup'){
        const r=await auth('signup',{email:String(d.email).trim(),password:String(d.password),data:{full_name:String(d.fullName||'').trim()}});
        if(r.access_token){
          saveAuth(r);
          await openDashboard();
        }else if(r.id||r.user?.id){
          // L'API REST /signup renvoie parfois directement le profil utilisateur (id à la racine).
          // Pour protéger la confidentialité, Supabase peut aussi renvoyer un objet simulé
          // lorsque l'adresse existe déjà : ne jamais annoncer que le compte vient d'être créé.
          $('authPassword').value='';
          setAuthMode('login');
          notice('Demande reçue. Si vous possédez déjà un compte, connectez-vous avec votre mot de passe. Sinon, vérifiez votre e-mail de confirmation (y compris les indésirables).','success');
        }else{
          throw Error('Aucune confirmation de la demande n’a été fournie par le serveur. Vérifiez votre compte existant ou réessayez plus tard.');
        }
      }else{
        const r=await auth('token?grant_type=password',{email:String(d.email).trim(),password:String(d.password)});
        if(!r.access_token)throw Error('Connexion impossible.');
        saveAuth(r);await openDashboard();
      }
    }catch(err){notice(err?.message||'Impossible de finaliser la demande. Vérifiez votre connexion.','error');}finally{b.disabled=false;}
  });
  document.querySelectorAll('[data-logout]').forEach(button=>button.addEventListener('click',()=>{
    const access=token();clearAuth();if(access)fetch(BASE+'/auth/v1/logout',{method:'POST',headers:{apikey:PUBLIC_KEY,Authorization:'Bearer '+access}}).catch(()=>{});
    showAuth('Vous êtes déconnecté.');notice('Déconnexion effectuée.','success');
  }));
  function cardRequest(r) {
    return '<article class="clientItem"><h4>'+esc(r.request_code)+'</h4><p><span class="clientBadge">'+esc(labels[r.status]||r.status)+'</span> · '+esc(r.kind==='rendezvous'?'Rendez-vous':'Devis')+'</p><p><b>Service :</b> '+esc(r.service_slug)+'</p><p><b>Création :</b> '+esc(date(r.created_at))+'</p>'+(r.preferred_at?'<p><b>Proposition :</b> '+esc(date(r.preferred_at))+' (à confirmer)</p>':'')+'<p><b>Montant proposé :</b> '+esc(money(r.quote_amount_xof))+'</p>'+(r.admin_message?'<p><b>Réponse de l’agence :</b></p><p class="clientLong">'+esc(r.admin_message)+'</p>':'')+(r.quote_amount_xof!==null&&r.quote_amount_xof!==undefined?'<p><button class="clientTextButton" type="button" data-print="'+esc(r.id)+'">Imprimer / Enregistrer le devis en PDF</button></p>':'')+'</article>';
  }
  async function loadClient(){
    const [reqs,news]=await Promise.all([api('/api/client/requests'),api('/api/client/notifications')]);
    clientRows=reqs.requests||[];
    $('myRequests').innerHTML=clientRows.length?clientRows.map(cardRequest).join(''):'<p class="clientMuted">Aucune demande. Remplissez le formulaire pour créer votre premier dossier.</p>';
    const unread=(news.notifications||[]).filter(n=>!n.read_at);
    $('notificationCount').textContent=unread.length?'('+unread.length+' non lues)':'';
    $('myNotifications').innerHTML=news.notifications?.length?news.notifications.map(n=>'<div class="clientNotification"><strong>'+esc(n.title)+'</strong><p>'+esc(n.message)+'</p><small class="clientMeta">'+esc(date(n.created_at))+'</small>'+(n.read_at?'':'<br><button type="button" class="clientTextButton" data-read="'+esc(n.id)+'">Marquer comme lue</button>')+'</div>').join(''):'<p class="clientMuted">Aucune notification.</p>';
  }
  $('myRequests')?.addEventListener('click',e=>{
    const button=e.target.closest('[data-print]');if(!button)return;
    const r=clientRows.find(row=>row.id===button.dataset.print);
    if(!r||r.quote_amount_xof===null||r.quote_amount_xof===undefined)return;
    const w=window.open('','_blank');
    if(!w)return notice('Autorisez les fenêtres contextuelles pour imprimer le devis.','error');
    const html='<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Proposition de devis '+esc(r.request_code)+'</title><style>body{font:16px Arial,sans-serif;color:#08101f;padding:44px;max-width:760px;margin:auto}h1{border-bottom:3px solid #d9a441;padding-bottom:12px}p{line-height:1.6}section{background:#f6f8fb;padding:20px;margin-top:18px;border-radius:12px}.total{font-size:28px;font-weight:800;color:#08101f}small{color:#667289}footer{margin-top:35px;border-top:1px solid #e3e8f0;padding-top:18px}@media print{body{padding:20px}}</style></head><body><header><b>BICKRI SERVICE AGENCY</b><p>Niamey, Niger · bickriservice-agency.org</p></header><h1>Proposition de devis</h1><p><b>Référence :</b> '+esc(r.request_code)+'</p><p><b>Client :</b> '+esc(r.full_name)+'</p><p><b>Service :</b> '+esc(r.service_slug)+'</p><p><b>Date de la demande :</b> '+esc(date(r.created_at))+'</p><section><b>Montant proposé</b><p class="total">'+esc(money(r.quote_amount_xof))+'</p><b>Détails de la réponse</b><p>'+esc(r.admin_message||'Devis soumis à la validation de l’agence.')+'</p></section><footer><small>Proposition non contractuelle. Les conditions définitives sont confirmées par Bickri Service Agency. Aucun paiement effectué depuis ce document.</small></footer></body></html>';
    w.document.open();w.document.write(html);w.document.close();w.focus();w.print();
  });
  $('myNotifications')?.addEventListener('click',async e=>{
    const btn=e.target.closest('[data-read]');if(!btn)return;btn.disabled=true;
    try{await api('/api/client/notifications',{method:'PATCH',body:JSON.stringify({id:btn.dataset.read})});await loadClient();}catch(err){notice(err.message,'error');btn.disabled=false;}
  });
  async function loadServices(){
    if(!$('service'))return;
    const opt=new URLSearchParams(location.search).get('service')||'';
    try{
      const r=await fetch('/services-share.json',{cache:'no-store'});
      if(!r.ok)throw Error('Catalogue indisponible.');
      const list=await r.json();
      if(!Array.isArray(list)||!list.length)throw Error('Catalogue indisponible.');
      const el=$('service');el.replaceChildren();
      const p=document.createElement('option');p.value='';p.textContent='Sélectionnez un service';el.appendChild(p);
      for(const s of list){if(!/^[a-z0-9-]{2,100}$/.test(s.slug||''))continue;const option=document.createElement('option');option.value=s.slug;option.textContent=s.name||s.slug;el.appendChild(option);}
      if(opt && [...el.options].some(o=>o.value===opt))el.value=opt;
    }catch(err){$('service').innerHTML='<option value="">Catalogue indisponible — réessayez</option>';notice('Le catalogue des services est temporairement indisponible.','error');}
  }
  $('kind')?.addEventListener('change',()=>{
    const appointment=$('kind').value==='rendezvous';
    $('dateField').hidden=!appointment;$('preferredAt').required=appointment;
  });
  async function setupCaptcha(){
    if(captchaId!==null)return;
    const msg=$('captchaMessage');if(!msg)return;
    try{
      const response=await fetch(API_BASE+'/api/turnstile-sitekey',{cache:'no-store'});
      const data=await response.json();
      if(!response.ok||!data.siteKey)throw Error('Vérification indisponible.');
      const render=()=>{
        if(!window.turnstile)return;
        captchaId=window.turnstile.render('#clientTurnstile',{sitekey:data.siteKey,callback:v=>{captchatoken=v;$('requestSubmit').disabled=false;msg.textContent='Vérification réussie.';},'expired-callback':()=>{captchatoken='';$('requestSubmit').disabled=true;msg.textContent='Vérification expirée.';},'error-callback':()=>{captchatoken='';$('requestSubmit').disabled=true;msg.textContent='Vérification impossible.';}});
        msg.textContent='Terminez la vérification anti-robot.';
      };
      if(window.turnstile){render();return;}
      window.bsaClientCaptchaReady=render;
      const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?onload=bsaClientCaptchaReady&render=explicit';script.async=true;script.defer=true;script.onerror=()=>{msg.textContent='Impossible de charger la vérification.';};document.head.appendChild(script);
    }catch(err){msg.textContent=err.message;}
  }
  $('requestForm')?.addEventListener('submit',async e=>{
    e.preventDefault();
    if(!captchatoken)return notice('Validez la vérification anti-robot.','error');
    const button=$('requestSubmit');button.disabled=true;
    const d=Object.fromEntries(new FormData(e.currentTarget).entries());
    const body={...d,consent:$('consent').checked,turnstileToken:captchatoken,preferred_at:d.preferred_at?new Date(d.preferred_at).toISOString():null};
    notice('Enregistrement de votre demande…');
    try{
      const result=await api('/api/client/requests',{method:'POST',body:JSON.stringify(body)});
      notice('Demande '+result.request.code+' enregistrée. Suivez son statut ci-dessous.','success');
      e.currentTarget.reset();$('dateField').hidden=true;$('preferredAt').required=false;
      await loadClient();
    }catch(err){notice(err.message,'error');}
    finally{captchatoken='';if(window.turnstile&&captchaId!==null)window.turnstile.reset(captchaId);button.disabled=true;}
  });
  function adminCard(r){
    return '<article class="card"><div class="clientItem"><h4>'+esc(r.request_code)+'</h4><p><span class="clientBadge">'+esc(labels[r.status]||r.status)+'</span> · '+esc(r.kind==='rendezvous'?'Rendez-vous':'Devis')+'</p><p><b>Client :</b> '+esc(r.full_name)+' · '+esc(r.phone)+'</p><p><b>Service :</b> '+esc(r.service_slug)+'</p><p><b>Entreprise :</b> '+esc(r.company)+'</p><p><b>Budget :</b> '+esc(r.budget)+'</p><p><b>Paiement souhaité :</b> '+esc(r.payment_preference)+'</p><p><b>Créé :</b> '+esc(date(r.created_at))+'</p>'+(r.preferred_at?'<p><b>Date souhaitée :</b> '+esc(date(r.preferred_at))+' (non confirmée)</p>':'')+'<p class="clientLong">'+esc(r.description)+'</p><form data-admin-request="'+esc(r.id)+'"><label>Statut</label><select name="status">'+Object.keys(labels).map(k=>'<option value="'+k+'"'+(k===r.status?' selected':'')+'>'+esc(labels[k])+'</option>').join('')+'</select><label>Montant du devis (FCFA, facultatif)</label><input type="number" name="quote_amount_xof" min="0" max="1000000000" step="1" value="'+(r.quote_amount_xof??'')+'"><label>Réponse visible par le client</label><textarea name="admin_message" maxlength="2500">'+esc(r.admin_message)+'</textarea><button class="cta" type="submit">Enregistrer et notifier</button></form></div></article>';
  }
  function renderAdmin(){
    const filter=$('adminFilter').value;
    const rows=adminRows.filter(r=>filter==='all'||r.status===filter);
    $('adminSummary').textContent=adminRows.length+' dossier(s) enregistrés. '+adminRows.filter(r=>r.status==='new').length+' nouvelle(s) demande(s).';
    $('adminRequests').innerHTML=rows.length?rows.map(adminCard).join(''):'<div class="card"><p>Aucun dossier pour ce filtre.</p></div>';
  }
  $('adminFilter')?.addEventListener('change',renderAdmin);
  $('adminRequests')?.addEventListener('submit',async e=>{
    const form=e.target.closest('[data-admin-request]');if(!form)return;e.preventDefault();
    const button=form.querySelector('button[type="submit"]');button.disabled=true;
    const d=Object.fromEntries(new FormData(form).entries());
    const payload={id:form.dataset.adminRequest,status:d.status,admin_message:d.admin_message,quote_amount_xof:d.quote_amount_xof===''?null:Number(d.quote_amount_xof)};
    try{
      await api('/api/client/admin/requests',{method:'PATCH',body:JSON.stringify(payload)});
      notice('Dossier mis à jour. Le client a une nouvelle notification.','success');
      await loadAdmin();
    }catch(err){notice(err.message,'error');button.disabled=false;}
  });
  async function loadAdmin(){
    const data=await api('/api/client/admin/requests');
    adminRows=data.requests||[];renderAdmin();
  }
  async function openDashboard(){
    try{
      const me=await api('/api/client/me');
      if(adminMode&&!me.isAdmin)throw Error('Ce compte ne dispose pas des droits administrateur.');
      $('authCard').hidden=true;
      if(adminMode){$('adminDashboard').hidden=false;await loadAdmin();}
      else{$('portalDashboard').hidden=false;await loadClient();await setupCaptcha();}
      notice('');
    }catch(err){
      const message=err?.status===503
        ? 'Votre compte est connecté, mais l’espace de suivi des devis est temporairement indisponible : la configuration serveur doit être finalisée.'
        : err?.message||'Impossible de charger votre espace client.';
      showAuth(message);
    }
  }
  loadServices();
  // Turnstile se charge uniquement lorsque le formulaire devient visible.
  if(token()&&authMode!=='reset')openDashboard().catch(()=>showAuth('Reconnectez-vous.'));
})();
