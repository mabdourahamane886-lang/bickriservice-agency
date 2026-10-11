(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const API_BASE = location.hostname.endsWith('.vercel.app') ? 'https://bickriservice-agency.org' : '';
  const apiUrl = (path) => API_BASE + path;
  const fallback = [
    {id:'impact-afriq',name:'Impact Afriq',slug:'impact-afriq',description:'Innovating · Inspiring · Transforming Africa',founder:'Abdoul Kader Abdourahamane',mission:'Innovation, inspiration et transformation de l’Afrique par les idées, les talents, la technologie et les collaborations.',country:'Niger',partnerType:'Collaboration',badgeLevel:'green',badgeLabel:'Partenaire vérifié',badgeVerified:true,logoUrl:'/assets/partners/impact-afriq.svg',publicId:'',referralCode:''},
    {id:'egan-btp',name:'EGAN BTP',slug:'egan-btp',description:'Construction · Rénovation · Plans · Hydraulique · Eau & assainissement',founder:'Garba Abdoul Nasser',mission:'Construction, fourniture de plans, rénovation, hydraulique de l’eau et assainissement.',country:'Niger',partnerType:'BTP & Construction',badgeLevel:'green',badgeLabel:'Partenaire vérifié',badgeVerified:true,logoUrl:'/assets/partners/egan-btp.svg',publicId:'',referralCode:''}
  ];
  const configs = {
    green:{file:'badge-verified-green.svg',label:'Partenaire vérifié'},
    blue:{file:'badge-verified-blue.svg',label:'Partenaire certifié'},
    gold:{file:'badge-verified-gold.svg',label:'Partenaire Premium'},
    construction:{file:'badge-construction.svg',label:'Partenaire BTP vérifié'}
  };
  const escapeHtml = (v) => String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const fullUrl = (path) => new URL(path, location.origin).href;
  const profilePath = (p) => ['impact-afriq','egan-btp'].includes(p.slug)
    ? '/partenaires/' + encodeURIComponent(p.slug) + '/'
    : '/partenaires/profil/?slug=' + encodeURIComponent(p.slug);
  const copyText = async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) return await navigator.clipboard.writeText(text);
      const input=document.createElement('textarea'); input.value=text; input.readOnly=true;
      input.style.position='fixed'; input.style.opacity='0'; document.body.appendChild(input);
      input.select(); const ok=document.execCommand('copy'); input.remove();
      if(!ok) throw new Error('copy failed');
    } catch (error) { throw error; }
  };
  const recordClick = (p, eventType, medium='directory') => {
    const ref = new URL(location.href).searchParams.get('ref') || p?.referralCode || '';
    fetch(apiUrl('/api/partner/click'),{method:'POST',headers:{'Content-Type':'application/json'},keepalive:true,body:JSON.stringify({
      slug:p?.slug || '', referralCode:ref, eventType, source:'partner-directory', medium,
      campaign:'partner-network', landingPath:location.pathname
    })}).catch(()=>{});
  };
  let partners = fallback.slice();
  let selectedForShare = null;
  const dialog = $('partnerShareDialog');
  const directory = $('partners');
  const countryFilter = $('partnerCountryFilter');
  const categoryFilter = $('partnerCategoryFilter');
  const badgeFilter = $('partnerBadgeFilter');
  const search = $('partnerSearch');
  const count = $('partnerResultsCount');
  const message = $('partnerDirectoryMessage');

  function fillFilter(select, values, defaultLabel) {
    if (!select) return;
    const current=select.value;
    select.innerHTML='<option value="">' + escapeHtml(defaultLabel) + '</option>' + values.map(v=>'<option value="'+escapeHtml(v)+'">'+escapeHtml(v)+'</option>').join('');
    if(values.includes(current)) select.value=current;
  }
  function rebuildFilters() {
    fillFilter(countryFilter,[...new Set(partners.map(p=>p.country).filter(Boolean))].sort(),'Tous les pays');
    fillFilter(categoryFilter,[...new Set(partners.map(p=>p.category || p.partnerType).filter(Boolean))].sort(),'Tous les domaines');
    if(countryFilter && ![...countryFilter.options].some(o=>o.value==='Niger')) countryFilter.insertAdjacentHTML('beforeend','<option value="Niger">Niger</option>');
  }
  function filteredPartners() {
    const q=(search?.value||'').trim().toLocaleLowerCase('fr');
    return partners.filter(p=>{
      const hay=[p.name,p.description,p.founder,p.mission,p.country,p.city,p.partnerType,p.category].join(' ').toLocaleLowerCase('fr');
      return (!q||hay.includes(q)) && (!countryFilter?.value||p.country===countryFilter.value)
        && (!categoryFilter?.value||(p.category||p.partnerType)===categoryFilter.value)
        && (!badgeFilter?.value||(p.badgeLevel||'green')===badgeFilter.value);
    });
  }
  function render() {
    if(!directory) return;
    const rows=filteredPartners();
    if(count) count.textContent=rows.length+' partenaire(s) affiché(s) sur '+partners.length;
    if($('statPartners')) $('statPartners').textContent=String(partners.length).padStart(2,'0');
    if($('statVerified')) $('statVerified').textContent=String(partners.filter(p=>p.badgeVerified).length).padStart(2,'0');
    if(!rows.length) {
      directory.innerHTML='<div class="empty"><strong>Aucun partenaire trouvé</strong><span>Modifiez vos critères ou effacez la recherche.</span></div>';
      return;
    }
    directory.innerHTML=rows.map(p=>{
      const badge=p.badgeLevel||'green', cfg=configs[badge]||configs.green;
      const logo=p.logoUrl||p.logo_url||('/assets/partners/'+(p.slug==='impact-afriq'?'impact-afriq.svg':p.slug==='egan-btp'?'egan-btp.svg':'badge-verified-green.svg'));
      const href=fullUrl(profilePath(p));
      return '<article class="partner" data-partner-card="'+escapeHtml(p.slug)+'">'+
        '<img class="partnerLogo" src="'+escapeHtml(logo)+'" alt="'+escapeHtml(p.name)+'" loading="lazy" onerror="this.onerror=null;this.src=\'/assets/bickri-b-logo.svg\'">'+
        '<h2>'+escapeHtml(p.name)+'<img class="verifiedBadge" src="/assets/partners/'+cfg.file+'" alt="'+escapeHtml(p.badgeLabel||cfg.label)+'" title="'+escapeHtml(p.badgeLabel||cfg.label)+'"></h2>'+
        '<span class="partnerLiveBadge">'+(p.badgeVerified?'✓ ':'')+escapeHtml(p.badgeLabel||cfg.label)+'</span>'+
        '<p style="margin-top:12px">'+escapeHtml(p.description||p.mission||'Partenaire de Bickri Service Agency')+'</p>'+
        (p.founder?'<div class="partnerFounder">Dirigeant : <strong>'+escapeHtml(p.founder)+'</strong></div>':'')+
        '<div class="partnerMeta"><span class="chip">'+escapeHtml(p.category||p.partnerType||'Collaboration')+'</span><span class="chip">'+escapeHtml([p.city,p.country||'Niger'].filter(Boolean).join(' · '))+'</span></div>'+
        (p.publicId?'<div class="partnerPublicId">Identifiant de vérification : '+escapeHtml(p.publicId)+'</div>':'')+
        '<div class="partnerCardActions"><a class="primary" href="'+escapeHtml(href)+'" data-open-partner="'+escapeHtml(p.slug)+'">Voir le profil</a><button class="share" type="button" data-share-partner="'+escapeHtml(p.slug)+'">Partager</button><button class="qr" type="button" data-qr-partner="'+escapeHtml(p.slug)+'">QR code</button></div></article>';
    }).join('');
  }
  function openShare(p) {
    selectedForShare=p;
    const link=fullUrl(profilePath(p)+(p.referralCode?'?ref='+encodeURIComponent(p.referralCode):''));
    if($('partnerDialogTitle')) $('partnerDialogTitle').textContent=p.name;
    if($('partnerDialogCaption')) $('partnerDialogCaption').textContent=[p.partnerType||p.category,p.city,p.country].filter(Boolean).join(' · ');
    if($('partnerDialogUrl')) $('partnerDialogUrl').textContent=link;
    if($('partnerDialogQr')) $('partnerDialogQr').src='https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&data='+encodeURIComponent(link);
    if($('partnerDialogWhatsApp')) $('partnerDialogWhatsApp').href='https://wa.me/?text='+encodeURIComponent(p.name+' — découvrez le profil partenaire de Bickri Service Agency : '+link);
    if(dialog && typeof dialog.showModal==='function') dialog.showModal();
    else window.prompt('Copiez le lien du partenaire :',link);
  }
  directory?.addEventListener('click',async event=>{
    const share=event.target.closest('[data-share-partner]');
    const qr=event.target.closest('[data-qr-partner]');
    const open=event.target.closest('[data-open-partner]');
    const p=partners.find(x=>x.slug===(share?.dataset.sharePartner||qr?.dataset.qrPartner||open?.dataset.openPartner));
    if(!p) return;
    if(share){recordClick(p,'share_click','share');openShare(p);}
    if(qr){recordClick(p,'share_click','qr');openShare(p);}
    if(open) recordClick(p,'profile_view','profile-link');
  });
  search?.addEventListener('input',render);
  [countryFilter,categoryFilter,badgeFilter].forEach(el=>el?.addEventListener('change',render));
  $('partnerDialogClose')?.addEventListener('click',()=>dialog?.close());
  $('partnerDialogCopy')?.addEventListener('click',async()=>{
    const text=$('partnerDialogUrl')?.textContent||'';
    try{await copyText(text);$('partnerDialogCopy').textContent='Lien copié ✓';if(selectedForShare)recordClick(selectedForShare,'share_click','copy');}
    catch{$('partnerDialogUrl').focus?.();window.prompt('Copiez ce lien :',text);}
    setTimeout(()=>{if($('partnerDialogCopy'))$('partnerDialogCopy').textContent='Copier le lien';},1500);
  });
  $('partnerDialogNative')?.addEventListener('click',async()=>{
    const text=$('partnerDialogUrl')?.textContent||'';
    if(navigator.share){try{await navigator.share({title:selectedForShare?.name||'Partenaire Bickri',text:selectedForShare?.description||'Découvrez ce partenaire',url:text});if(selectedForShare)recordClick(selectedForShare,'share_click','native');}catch{}}
    else {try{await copyText(text);$('partnerDialogNative').textContent='Lien copié ✓';}catch{window.prompt('Copiez ce lien :',text);}}
  });
  $('partnerDialogDownloadQr')?.addEventListener('click',async()=>{
    const img=$('partnerDialogQr');if(!img?.src)return;
    try {const response=await fetch(img.src);if(!response.ok)throw new Error('QR indisponible');const blob=await response.blob();const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='qr-partenaire-'+(selectedForShare?.slug||'bickri')+'.png';a.click();URL.revokeObjectURL(a.href);}
    catch {window.open(img.src,'_blank','noopener');}
  });

  async function loadDirectory(){
    if(!directory)return;
    try {
      const response=await fetch(apiUrl('/api/partners'),{headers:{Accept:'application/json'},cache:'no-store'});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!Array.isArray(data.partners))throw new Error(data.error||'Répertoire indisponible');
      const saved= data.partners;
      partners=saved.length?saved:fallback.slice();
      message.textContent=saved.length?'Profils publics chargés depuis le répertoire Bickri.':'Les profils officiels seront affichés ici dès leur publication.';
    } catch(error) {
      partners=fallback.slice();
      message.textContent='Affichage de secours : le répertoire dynamique est momentanément indisponible.';
    }
    rebuildFilters();render();
    try{
      const response=await fetch(apiUrl('/api/partners/metrics'),{cache:'no-store'});
      const data=await response.json();
      if(response.ok){if($('statPartners'))$('statPartners').textContent=String(data.partners??partners.length).padStart(2,'0');if($('statVerified'))$('statVerified').textContent=String(data.verified??partners.filter(p=>p.badgeVerified).length).padStart(2,'0');}
    }catch{}
  }

  // Retirer l'ancien gestionnaire du formulaire pour éviter une double soumission.
  const originalForm=$('partnerApplicationForm');
  if(originalForm){
    const form=originalForm.cloneNode(true);
    originalForm.replaceWith(form);
    const ref=new URL(location.href).searchParams.get('ref')||'';
    const refField=form.querySelector('[name="referralCode"]');
    if(refField)refField.value=ref;
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      const submit=$('partnerSubmitButton'),progress=$('partnerFormProgress'),success=$('partnerFormSuccess'),errorBox=$('partnerFormError'),codePanel=$('partnerApplicationCodePanel');
      if(success)success.hidden=true;if(errorBox)errorBox.hidden=true;if(codePanel)codePanel.hidden=true;
      if(progress)progress.textContent='Envoi et enregistrement en cours…';if(submit)submit.disabled=true;
      const data=Object.fromEntries(new FormData(form).entries());
      try{
        const response=await fetch(apiUrl('/api/partner'),{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data)});
        const result=await response.json().catch(()=>({}));
        if(!response.ok||!result.ok)throw new Error(result.error||'La candidature n’a pas pu être enregistrée.');
        form.reset();if(refField)refField.value=ref;
        if(success){success.hidden=false;success.textContent=result.message||'Votre candidature a été enregistrée.';}
        if(progress)progress.textContent=result.emailStatus==='sent'?'Notification e-mail envoyée.':result.emailStatus==='failed'?'Candidature sauvegardée ; la notification e-mail reste à rétablir.':'Candidature sauvegardée ; la notification e-mail est en attente de configuration.';
        if(result.applicationCode&&codePanel){codePanel.hidden=false;if($('partnerApplicationCode'))$('partnerApplicationCode').textContent=result.applicationCode;if($('partnerStatusCode'))$('partnerStatusCode').value=result.applicationCode;}
        success?.scrollIntoView({behavior:'smooth',block:'center'});
      }catch(error){if(errorBox){errorBox.textContent=error.message||'Une erreur est survenue. Réessayez.';errorBox.hidden=false;}if(progress)progress.textContent='';}
      finally{if(submit)submit.disabled=false;}
    });
  }
  $('copyPartnerApplicationCode')?.addEventListener('click',async()=>{
    const code=$('partnerApplicationCode')?.textContent||'';
    try{await copyText(code);$('copyPartnerApplicationCode').textContent='Copié ✓';}
    catch{window.prompt('Copiez votre code de dossier :',code);}
    setTimeout(()=>{if($('copyPartnerApplicationCode'))$('copyPartnerApplicationCode').textContent='Copier le code';},1600);
  });
  const statusForm=$('partnerStatusForm');
  statusForm?.addEventListener('submit',async event=>{
    event.preventDefault();
    const resultEl=$('partnerStatusResult');if(!resultEl)return;
    resultEl.hidden=false;resultEl.className='partnerTrackerResult';resultEl.textContent='Vérification du dossier…';
    const data=Object.fromEntries(new FormData(statusForm).entries());
    try{
      const url='/api/partner/status?code='+encodeURIComponent(data.code.trim())+'&email='+encodeURIComponent(data.email.trim());
      const response=await fetch(apiUrl(url),{headers:{Accept:'application/json'},cache:'no-store'});const body=await response.json().catch(()=>({}));
      if(!response.ok||!body.application)throw new Error(body.error||'Aucun dossier trouvé.');
      resultEl.className='partnerTrackerResult success';
      resultEl.textContent='Dossier '+body.application.code+' — '+body.application.companyName+' : '+body.application.statusLabel+'. Déposé le '+new Date(body.application.submittedAt).toLocaleDateString('fr-FR')+'.';
    }catch(error){resultEl.className='partnerTrackerResult error';resultEl.textContent=error.message||'Impossible de vérifier le dossier.';}
  });

  loadDirectory();
})();