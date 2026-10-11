(() => {
  'use strict';
  const SUPABASE_URL='https://okdohokhlkxrmxpevees.supabase.co';
  // Supabase publishable key intended for browser clients; no service-role key is exposed here.
  const SUPABASE_PUBLIC_KEY='sb_publishable_EiTruyR5fwwHpS_PzO5_iA_d1i4iMCP';
  const $=id=>document.getElementById(id);
  const API_BASE = location.hostname.endsWith('.vercel.app') ? 'https://bickriservice-agency.org' : '';
  const apiUrl = path => API_BASE + path;
  const mode=document.body.dataset.portalMode==='admin'?'admin':'member';
  const TOKEN_KEY='bsa_partner_access_token';
  const REFRESH_KEY='bsa_partner_refresh_token';
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const date=value=>value?new Date(value).toLocaleDateString('fr-FR'):'—';
  const labels={pending:'En attente',under_review:'En cours d’examen',approved:'Approuvée',rejected:'Refusée'};
  const messages={
    invalid:'Adresse e-mail ou mot de passe incorrect.',
    noSession:'Connectez-vous pour accéder à cet espace.',
    server:'Le service est momentanément indisponible. Réessayez.'
  };
  let authMode='login';
  let currentData=null;
  let adminApplications=[];
  let adminPartners=[];
  let adminEvents=[];

  function token(){return sessionStorage.getItem(TOKEN_KEY)||'';}
  function saveSession(data){
    if(data?.access_token)sessionStorage.setItem(TOKEN_KEY,data.access_token);
    if(data?.refresh_token)sessionStorage.setItem(REFRESH_KEY,data.refresh_token);
    if(data?.expires_in)sessionStorage.setItem('bsa_partner_expires_at',String(Date.now()+Number(data.expires_in)*1000));
  }
  function clearSession(){[TOKEN_KEY,REFRESH_KEY,'bsa_partner_expires_at'].forEach(k=>sessionStorage.removeItem(k));}
  async function authRequest(path,body){
    const response=await fetch(SUPABASE_URL+'/auth/v1/'+path,{
      method:'POST',headers:{apikey:SUPABASE_PUBLIC_KEY,'Content-Type':'application/json'},
      body:JSON.stringify(body)
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.msg||data.message||data.error_description||data.error||'Authentification impossible.');
    return data;
  }
  async function api(path,options={}){
    const headers={'Accept':'application/json',...(options.headers||{})};
    if(token())headers.Authorization='Bearer '+token();
    if(options.body&&!headers['Content-Type'])headers['Content-Type']='application/json';
    const response=await fetch(apiUrl(path),{...options,headers,cache:options.cache||'no-store'});
    const data=await response.json().catch(()=>({}));
    if(!response.ok){
      if(response.status===401){clearSession();showAuth('Votre session est terminée. Reconnectez-vous.');}
      throw new Error(data.error||data.message||('Erreur HTTP '+response.status));
    }
    return data;
  }
  function showMessage(text,type='info'){
    const box=$('portalMessage');if(!box)return;
    box.hidden=!text;box.textContent=text;box.className='portalMessage '+type;
  }
  function showAuth(text=''){
    if($('authCard'))$('authCard').hidden=false;
    if($('portalDashboard'))$('portalDashboard').hidden=true;
    if($('adminDashboard'))$('adminDashboard').hidden=true;
    if(text)showMessage(text,'error');
  }
  function showDashboard(){
    if($('authCard'))$('authCard').hidden=true;
    if(mode==='admin'){if($('adminDashboard'))$('adminDashboard').hidden=false;}
    else if($('portalDashboard'))$('portalDashboard').hidden=false;
    showMessage('','info');
  }
  function setAuthMode(next){
    authMode=next;
    if($('authNameField'))$('authNameField').hidden=next!=='signup';
    if($('authSubmit'))$('authSubmit').textContent=next==='signup'?'Créer mon compte':'Se connecter';
    if($('authModeToggle'))$('authModeToggle').textContent=next==='signup'?'J’ai déjà un compte':'Créer un compte partenaire';
    if($('authDescription'))$('authDescription').textContent=next==='signup'
      ?'Créez un compte sécurisé avec votre adresse e-mail. Confirmez-la si un message de vérification vous est envoyé.'
      :'Connectez-vous avec votre compte Bickri pour retrouver vos candidatures et vos informations partenaires.';
  }

  $('authModeToggle')?.addEventListener('click',()=>setAuthMode(authMode==='login'?'signup':'login'));
  $('loginForm')?.addEventListener('submit',async event=>{
    event.preventDefault();
    const form=event.currentTarget,button=$('authSubmit');
    if(button)button.disabled=true;
    showMessage(authMode==='signup'?'Création du compte…':'Connexion…','info');
    const data=Object.fromEntries(new FormData(form).entries());
    try{
      if(authMode==='signup'){
        const result=await authRequest('signup',{email:String(data.email).trim(),password:String(data.password),data:{full_name:String(data.fullName||'').trim()}});
        if(result.access_token){saveSession(result);await loadDashboard();}
        else{
          setAuthMode('login');
          showMessage('Compte créé. Vérifiez votre boîte e-mail pour confirmer l’adresse, puis connectez-vous.','success');
        }
      }else{
        const result=await authRequest('token?grant_type=password',{email:String(data.email).trim(),password:String(data.password)});
        saveSession(result);await loadDashboard();
      }
    }catch(error){showMessage(error.message||messages.server,'error');}
    finally{if(button)button.disabled=false;}
  });
  $('forgotPassword')?.addEventListener('click',async()=>{
    const email=$('authEmail')?.value.trim();
    if(!email){showMessage('Saisissez d’abord votre adresse e-mail.','error');return;}
    try{
      const response=await fetch(SUPABASE_URL+'/auth/v1/recover',{method:'POST',headers:{apikey:SUPABASE_PUBLIC_KEY,'Content-Type':'application/json'},body:JSON.stringify({email})});
      if(!response.ok)throw new Error('La demande de réinitialisation n’a pas pu être envoyée.');
      showMessage('Si cette adresse correspond à un compte, un message de réinitialisation sera envoyé.','success');
    }catch(error){showMessage(error.message||messages.server,'error');}
  });
  $('logoutButton')?.addEventListener('click',async()=>{
    try{if(token())await fetch(SUPABASE_URL+'/auth/v1/logout',{method:'POST',headers:{apikey:SUPABASE_PUBLIC_KEY,Authorization:'Bearer '+token()}});}catch{}
    clearSession();showAuth('Vous êtes déconnecté.');
  });

  async function loadDashboard(){
    if(!token()){showAuth();return;}
    showMessage('Chargement de votre espace…','info');
    try{
      if(mode==='admin'){await loadAdmin();return;}
      const data=await api('/api/partner/me');currentData=data;renderMember(data);showDashboard();
    }catch(error){showAuth(error.message||messages.server);}
  }

  function renderMember(data){
    const apps=Array.isArray(data.applications)?data.applications:[];
    const p=data.partner;
    if($('portalWelcome'))$('portalWelcome').textContent=data.user?.email?'Connecté : '+data.user.email:'Votre espace partenaire';
    if($('portalStats'))$('portalStats').innerHTML=[
      ['Candidatures',apps.length],
      ['Dossiers en attente',apps.filter(a=>a.status==='pending'||a.status==='under_review').length],
      ['Clics suivis',Number(data.clickStats?.total||0)],
      ['Clics sur 7 jours',Number(data.clickStats?.last7Days||0)]
    ].map(([label,value])=>'<div class="portalStat"><strong>'+esc(value)+'</strong><span>'+esc(label)+'</span></div>').join('');
    if($('applicationsList')){
      $('applicationsList').innerHTML=apps.length?apps.map(a=>'<article class="portalApplication"><div class="portalRow"><strong>'+esc(a.companyName)+'</strong><span class="statusPill '+esc(a.status)+'">'+esc(labels[a.status]||a.status)+'</span></div><p>Référence : <strong>'+esc(a.code)+'</strong> · Dépôt : '+esc(date(a.submittedAt))+'</p><p>'+esc(a.partnerType||'Partenariat')+' · '+esc([a.city,a.country].filter(Boolean).join(', '))+'</p>'+(a.reviewerNotes?'<p class="reviewNotes">Message de l’équipe : '+esc(a.reviewerNotes)+'</p>':'')+'</article>').join(''):'<div class="emptyState">Aucune candidature n’est encore associée à ce compte. Vous pouvez déposer une candidature depuis la page Partenaires.</div>';
    }
    if($('noPartnerPanel'))$('noPartnerPanel').hidden=Boolean(p);
    if($('partnerManagementPanel'))$('partnerManagementPanel').hidden=!p;
    if(p){
      const edit=$('partnerProfileForm');
      if(edit){
        edit.elements.description.value=p.description||'';
        edit.elements.mission.value=p.mission||'';
        edit.elements.country.value=p.country||'Niger';
        edit.elements.city.value=p.city||'';
        edit.elements.logoUrl.value=p.logoUrl||'';
        edit.elements.category.value=p.category||'';
        edit.elements.websiteUrl.value=p.websiteUrl||'';
        edit.elements.socialLinks.value=JSON.stringify(p.socialLinks||{},null,2);
      }
      const publicOrigin=location.hostname.endsWith('.vercel.app')?'https://bickriservice-agency.org':location.origin;
      const link=publicOrigin+'/partenaires/profil/?slug='+encodeURIComponent(p.slug)+(p.referralCode?'&ref='+encodeURIComponent(p.referralCode):'');
      if($('partnerReferralUrl'))$('partnerReferralUrl').value=link;
      if($('partnerProfileLink')){$('partnerProfileLink').href='/partenaires/profil/?slug='+encodeURIComponent(p.slug);$('partnerProfileLink').textContent='Ouvrir mon profil public ↗';}
      if($('portalPartnerName'))$('portalPartnerName').textContent=p.name;
      if($('portalPartnerBadge'))$('portalPartnerBadge').textContent=p.badgeLabel||'Partenaire';
      if($('portalPartnerQr')){$('portalPartnerQr').src='https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=12&data='+encodeURIComponent(link);$('portalPartnerQr').hidden=false;}
    }
  }

  $('partnerProfileForm')?.addEventListener('submit',async event=>{
    event.preventDefault();const form=event.currentTarget,button=$('savePartnerProfile');
    if(button)button.disabled=true;showMessage('Enregistrement du profil…','info');
    try{
      const data=Object.fromEntries(new FormData(form).entries());
      let socialLinks={};
      try{socialLinks=JSON.parse(String(data.socialLinks||'{}'));}catch{throw new Error('Les liens sociaux doivent être un objet JSON valide, par exemple {"facebook":"https://…"}');}
      if(!socialLinks||Array.isArray(socialLinks)||typeof socialLinks!=='object')throw new Error('Format des liens sociaux invalide.');
      await api('/api/partner/me',{method:'PATCH',body:JSON.stringify({...data,socialLinks})});
      showMessage('Profil mis à jour.','success');await loadDashboard();
    }catch(error){showMessage(error.message||messages.server,'error');}
    finally{if(button)button.disabled=false;}
  });
  $('copyPartnerReferral')?.addEventListener('click',async()=>{
    const input=$('partnerReferralUrl');if(!input)return;
    try{await navigator.clipboard.writeText(input.value);$('copyPartnerReferral').textContent='Lien copié ✓';}
    catch{input.focus();input.select();$('copyPartnerReferral').textContent='Sélectionnez et copiez';}
    setTimeout(()=>{if($('copyPartnerReferral'))$('copyPartnerReferral').textContent='Copier le lien';},1600);
  });
  $('sharePartnerReferral')?.addEventListener('click',async()=>{
    const url=$('partnerReferralUrl')?.value||'';if(!url)return;
    if(navigator.share){try{await navigator.share({title:'Mon profil partenaire Bickri',text:'Découvrez mon profil partenaire Bickri Service Agency',url});}catch{}}
    else window.open('https://wa.me/?text='+encodeURIComponent('Découvrez mon profil partenaire Bickri Service Agency : '+url),'_blank','noopener');
  });

  async function loadAdmin(){
    const data=await api('/api/partner/admin');
    adminApplications=Array.isArray(data.applications)?data.applications:[];
    adminPartners=Array.isArray(data.partners)?data.partners:[];
    adminEvents=Array.isArray(data.events)?data.events:[];
    if($('adminStats'))$('adminStats').innerHTML=[
      ['Dossiers',data.stats?.applications||0],['En attente',data.stats?.pending||0],['À examiner',data.stats?.underReview||0],['Partenaires actifs',data.stats?.partners||0],['Vérifiés',data.stats?.verified||0],['Événements suivis',data.stats?.trackedEvents||0]
    ].map(([label,value])=>'<div class="portalStat"><strong>'+esc(value)+'</strong><span>'+esc(label)+'</span></div>').join('');
    renderAdminApplications();renderAdminPartners();renderAdminHistory();showDashboard();
    if($('adminSignedIn'))$('adminSignedIn').textContent='Administration connectée';
  }
  function renderAdminApplications(){
    const root=$('adminApplications');if(!root)return;
    const status=$('adminStatusFilter')?.value||'',q=($('adminSearch')?.value||'').trim().toLowerCase();
    const rows=adminApplications.filter(a=>(!status||a.status===status)&&(!q||[a.application_code,a.full_name,a.email,a.company_name,a.country,a.city,a.category,a.message].join(' ').toLowerCase().includes(q)));
    if($('adminApplicationCount'))$('adminApplicationCount').textContent=rows.length+' dossier(s)';
    if(!rows.length){root.innerHTML='<div class="emptyState">Aucune candidature ne correspond aux filtres.</div>';return;}
    root.innerHTML=rows.map(a=>'<article class="adminApplication" data-application="'+esc(a.id)+'"><div class="adminApplicationTop"><div><span class="eyebrow">Dossier '+esc(a.application_code)+'</span><h3>'+esc(a.company_name)+'</h3><p>'+esc(a.full_name)+' · <a href="mailto:'+esc(a.email)+'">'+esc(a.email)+'</a></p></div><span class="statusPill '+esc(a.status)+'">'+esc(labels[a.status]||a.status)+'</span></div><div class="adminDetails"><span><b>Pays :</b> '+esc(a.country||'Niger')+(a.city?' · '+esc(a.city):'')+'</span><span><b>Type :</b> '+esc(a.partner_type)+'</span><span><b>Site :</b> '+(a.website_url?'<a href="'+esc(a.website_url)+'" target="_blank" rel="noopener">Ouvrir ↗</a>':'Non renseigné')+'</span><span><b>Date :</b> '+esc(date(a.created_at))+'</span><span><b>Notification :</b> '+esc(a.email_status||'pending')+(a.email_error_code?' ('+esc(a.email_error_code)+')':'')+'</span></div><div class="adminMessage"><strong>Message privé de candidature</strong><br>'+esc(a.message)+'</div><div class="adminMessage"><strong>Informations proposées pour le profil public</strong><br>Consentement : '+(a.public_profile_consent?'✅ Enregistré':'⚠️ Absent')+'<br>Logo : '+(a.logo_url?'<a href="'+esc(a.logo_url)+'" target="_blank" rel="noopener">Aperçu du logo ↗</a>':'Non fourni')+'<br>Présentation : '+esc(a.public_description||'Non renseignée')+'<br>Mission : '+esc(a.public_mission||'Non renseignée')+'</div><div class="adminReviewControls"><label>Badge si approbation<select data-badge><option value="green">Partenaire vérifié</option><option value="blue">Partenaire certifié</option><option value="gold">Partenaire Premium</option><option value="construction">Partenaire BTP vérifié</option></select></label><label>Note interne<textarea data-notes rows="2" maxlength="2000" placeholder="Note interne (facultatif)">'+esc(a.reviewer_notes||'')+'</textarea></label></div><div class="adminActions"><button data-review="under_review" class="btnSoft">Mettre en examen</button><button data-review="reject" class="btnDanger">Refuser</button><button data-review="approve" class="btnGold">Approuver et publier</button></div></article>').join('');
  }
  function renderAdminPartners(){
    const root=$('adminPartners');if(!root)return;
    if(!adminPartners.length){root.innerHTML='<div class="emptyState">Aucun partenaire dans la base pour le moment.</div>';return;}
    root.innerHTML=adminPartners.map(p=>{
      const status=p.active?'<span class="statusPill approved">Actif</span>':'<span class="statusPill rejected">Suspendu</span>';
      const badge=p.badge_verified?esc(p.badge_label||'Vérifié'):'Profil non vérifié';
      const url='https://bickriservice-agency.org/partenaires/profil/?slug='+encodeURIComponent(p.slug);
      return '<article class="adminApplication adminPartnerCard" data-admin-partner="'+esc(p.id)+'"><div class="adminApplicationTop"><div><span class="eyebrow">'+esc(p.public_id||'Profil partenaire')+'</span><h3>'+esc(p.name)+'</h3><p>'+esc([p.city,p.country].filter(Boolean).join(' · '))+' · '+esc(p.category||p.partner_type||'Partenaire')+'</p><p>Badge : '+badge+' · Code : '+esc(p.referral_code||'—')+'</p></div><div>'+status+'</div></div><div class="adminPartnerControls"><label>Badge<select data-manage-badge><option value="green" '+(p.badge_level==='green'?'selected':'')+'>Vérifié</option><option value="blue" '+(p.badge_level==='blue'?'selected':'')+'>Certifié</option><option value="gold" '+(p.badge_level==='gold'?'selected':'')+'>Premium</option><option value="construction" '+(p.badge_level==='construction'?'selected':'')+'>BTP vérifié</option></select></label><label class="inlineCheck"><input type="checkbox" data-manage-verified '+(p.badge_verified?'checked':'')+'> Badge vérifié</label></div><div class="adminActions"><a class="btn btnSoft" href="'+url+'" target="_blank" rel="noopener">Ouvrir profil ↗</a><button type="button" class="btn btnLight" data-manage-action="set_badge">Enregistrer le badge</button><button type="button" class="'+(p.active?'btnDanger':'btnGold')+'" data-manage-action="'+(p.active?'suspend':'activate')+'">'+(p.active?'Suspendre':'Réactiver')+'</button></div></article>';
    }).join('');
  }
  const auditLabels={application_under_review:'Candidature mise en examen',application_approved:'Candidature approuvée',application_rejected:'Candidature refusée',partner_created:'Partenaire ajouté',partner_suspended:'Partenaire suspendu',partner_activated:'Partenaire réactivé',partner_badge_updated:'Badge modifié'};
  function renderAdminHistory(){
    const root=$('adminHistory');if(!root)return;
    if(!adminEvents.length){root.innerHTML='<div class="emptyState">Aucune action administrative enregistrée pour le moment.</div>';return;}
    root.innerHTML=adminEvents.map(e=>'<article class="portalApplication"><div class="portalRow"><strong>'+esc(auditLabels[e.action]||e.action)+'</strong><span class="muted">'+esc(date(e.created_at))+'</span></div><p>Administrateur : '+esc(e.admin_user_id||'—')+'</p><p>'+esc(JSON.stringify(e.details||{}))+'</p></article>').join('');
  }
  $('adminPartnerCreateForm')?.addEventListener('submit',async event=>{
    event.preventDefault();
    const form=event.currentTarget,button=$('adminPartnerCreateButton');
    if(button)button.disabled=true;
    showMessage('Création du profil public…','info');
    try{
      const raw=Object.fromEntries(new FormData(form).entries());
      let socialLinks={};
      try{socialLinks=JSON.parse(String(raw.socialLinks||'{}'));}catch{throw new Error('Les réseaux sociaux doivent être un objet JSON valide.');}
      if(!socialLinks||Array.isArray(socialLinks)||typeof socialLinks!=='object')throw new Error('Format de liens sociaux invalide.');
      const response=await api('/api/partner/admin/partner',{method:'POST',body:JSON.stringify({
        action:'create',name:raw.name,slug:raw.slug,logoUrl:raw.logoUrl,websiteUrl:raw.websiteUrl,
        description:raw.description,mission:raw.mission,country:raw.country,city:raw.city,
        category:raw.category,partnerType:raw.partnerType,badgeLevel:raw.badgeLevel,
        socialLinks,publicConsent:form.elements.publicConsent.checked,
        verificationConfirmed:form.elements.verificationConfirmed.checked
      })});
      showMessage(response.message||'Partenaire créé.','success');form.reset();await loadAdmin();
    }catch(error){showMessage(error.message||messages.server,'error');}
    finally{if(button)button.disabled=false;}
  });
  $('adminPartners')?.addEventListener('click',async event=>{
    const button=event.target.closest('[data-manage-action]');if(!button)return;
    const card=button.closest('[data-admin-partner]');if(!card)return;
    const action=button.dataset.manageAction;
    if(!window.confirm(action==='suspend'?'Suspendre et retirer ce profil de l’annuaire public ?':action==='activate'?'Réactiver ce profil sans lui attribuer automatiquement un badge vérifié ?':'Enregistrer le niveau de badge choisi ?'))return;
    const payload={action,partnerId:card.dataset.adminPartner};
    if(action==='set_badge'){
      payload.badgeLevel=card.querySelector('[data-manage-badge]')?.value||'green';
      payload.badgeVerified=Boolean(card.querySelector('[data-manage-verified]')?.checked);
    }
    button.disabled=true;showMessage('Mise à jour du partenaire…','info');
    try{const result=await api('/api/partner/admin/partner',{method:'POST',body:JSON.stringify(payload)});showMessage(result.message||'Partenaire mis à jour.','success');await loadAdmin();}
    catch(error){showMessage(error.message||messages.server,'error');}
    finally{button.disabled=false;}
  });
    $('adminStatusFilter')?.addEventListener('change',renderAdminApplications);
  $('adminSearch')?.addEventListener('input',renderAdminApplications);
  $('adminRefresh')?.addEventListener('click',()=>loadDashboard().catch(e=>showMessage(e.message,'error')));
  $('adminApplications')?.addEventListener('click',async event=>{
    const button=event.target.closest('[data-review]');if(!button)return;
    const card=button.closest('[data-application]');if(!card)return;
    const applicationId=card.dataset.application,action=button.dataset.review;
    const badgeLevel=card.querySelector('[data-badge]')?.value||'green';
    const reviewerNotes=card.querySelector('[data-notes]')?.value||'';
    const title=action==='approve'?'Approuver et publier ce partenaire ?':action==='reject'?'Refuser cette candidature ?':'Placer cette candidature en examen ?';
    if(!window.confirm(title))return;
    button.disabled=true;showMessage('Mise à jour du dossier…','info');
    try{await api('/api/partner/admin/review',{method:'POST',body:JSON.stringify({applicationId,action,badgeLevel,reviewerNotes})});showMessage('Candidature mise à jour.','success');await loadAdmin();}
    catch(error){showMessage(error.message||messages.server,'error');}
    finally{button.disabled=false;}
  });

  // Détecte une session déjà ouverte uniquement dans cet onglet.
  if(token())loadDashboard().catch(error=>showAuth(error.message||messages.server));
  else showAuth();
  if(mode==='admin')setAuthMode('login');
})();