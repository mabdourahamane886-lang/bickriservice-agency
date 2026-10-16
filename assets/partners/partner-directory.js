(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const API_BASE = location.hostname.endsWith('.vercel.app') ? 'https://bickriservice-agency.org' : '';
  const apiUrl = (path) => API_BASE + path;
  const SUPABASE_URL='https://okdohokhlkxrmxpevees.supabase.co';
  // Publishable key, protected by the agency_partners RLS public-read policy.
  const SUPABASE_PUBLIC_KEY='sb_publishable_EiTruyR5fwwHpS_PzO5_iA_d1i4iMCP';
  const fallback = [
    {id:'tourisme-au-niger',name:'Tourisme au Niger',slug:'tourisme-au-niger',description:'Collectif d’influenceurs dédié à la promotion du tourisme, de la culture et des merveilles du Niger.',founder:'Ismaghila ADOUM Silimane',mission:'Faire découvrir et valoriser les paysages, le patrimoine, les traditions et les richesses culturelles du Niger.',country:'Niger',partnerType:'Tourisme & influence',badgeLevel:'green',badgeLabel:'Partenaire vérifié',badgeVerified:true,logoUrl:'/assets/partners/tourisme-au-niger.jpg',publicId:'',referralCode:''},
    {id:'impact-afriq',name:'Impact Afriq',slug:'impact-afriq',description:'Innovating · Inspiring · Transforming Africa',founder:'Abdoul Kader Abdourahamane',mission:'Innovation, inspiration et transformation de l’Afrique par les idées, les talents, la technologie et les collaborations.',country:'Niger',partnerType:'Collaboration',badgeLevel:'green',badgeLabel:'Partenaire vérifié',badgeVerified:true,logoUrl:'/assets/partners/impact-afriq.svg',publicId:'',referralCode:''},
    {id:'egan-btp',name:'EGAN BTP',slug:'egan-btp',description:'Construction · Rénovation · Plans · Hydraulique · Eau & assainissement',founder:'Garba Abdoul Nasser',mission:'Construction, fourniture de plans, rénovation, hydraulique de l’eau et assainissement.',country:'Niger',partnerType:'BTP & Construction',badgeLevel:'green',badgeLabel:'Partenaire vérifié',badgeVerified:true,logoUrl:'/assets/partners/egan-btp.svg',publicId:'',referralCode:''},
    {id:'sahelia-fresh',name:'Sahelia Fresh',slug:'sahelia-fresh',description:'Yaourts et jus naturels · Formations pratiques · Livraison à confirmer',fullDescription:"Sahelia Fresh met à l’honneur la fraîcheur et les saveurs de nos terres à travers ses yaourts et ses jus naturels. L’objectif est de proposer des produits gourmands, agréables à partager et adaptés aux moments du quotidien : petit-déjeuner, goûter, pause au bureau, repas en famille, réunions ou cérémonies. Les yaourts séduisent par leur texture onctueuse et leur côté pratique, tandis que les jus apportent une touche fruitée et rafraîchissante. Les parfums, ingrédients, formats, prix et conditions de conservation sont à confirmer directement auprès de l’entreprise avant toute commande.\n\nSahelia Fresh souhaite également favoriser l’apprentissage grâce à des formations pratiques. Selon les sessions proposées, les participants peuvent découvrir les bases de la préparation des produits, l’organisation du poste de travail, les règles d’hygiène, la manipulation des ingrédients, le conditionnement, la conservation, la présentation et les principes de gestion d’une petite activité. La démarche privilégie les explications concrètes et la pratique afin d’aider chacun à comprendre les étapes essentielles d’un travail soigné. Le programme, la durée, les dates, les conditions d’inscription et les éventuels frais doivent être confirmés auprès de l’équipe.\n\nPour les clients, les commandes et les possibilités de livraison peuvent être étudiées selon les produits disponibles, les quantités demandées et la destination. Contactez Sahelia Fresh pour vérifier les tarifs, les délais, les zones desservies et les modalités de paiement et de remise. Pour une commande familiale, professionnelle ou destinée à un événement, précisez les produits souhaités, les quantités, le lieu et la date afin que l’équipe puisse vous renseigner. La disponibilité de la livraison et ses conditions exactes sont à confirmer avant validation.\n\nAvec son identité inspirée du Sahel, Sahelia Fresh veut associer proximité, soin et convivialité. Que vous souhaitiez découvrir des yaourts, commander des jus naturels ou vous renseigner sur une formation pratique, demandez les informations à jour directement auprès de l’entreprise. Sahelia Fresh : la fraîcheur de nos terres, pour accompagner les moments simples, les rencontres et les projets entrepreneuriaux.",mission:'Yaourts et jus naturels, formations pratiques et informations sur les possibilités de livraison.',country:'Niger',partnerType:'Produits naturels',category:'Produits naturels',badgeLevel:'gold',badgeLabel:'Partenaire Premium',badgeVerified:true,logoUrl:'https://d2ol7oe51mr4n9.cloudfront.net/user_3Bt4xGygQGBZTOweEVrhbZ4s65k/053dc7b0-1a6c-4685-84a3-08595451a656.png',publicId:'',referralCode:''}
  ];
  const configs = {
    green:{file:'badge-verified-green.svg',label:'Partenaire vérifié'},
    blue:{file:'badge-verified-blue.svg',label:'Partenaire certifié'},
    gold:{file:'badge-verified-gold.svg',label:'Partenaire Premium'},
    construction:{file:'badge-construction.svg',label:'Partenaire BTP vérifié'}
  };
  const escapeHtml = (v) => String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const PUBLIC_ORIGIN = location.hostname.endsWith('.vercel.app') ? 'https://bickriservice-agency.org' : location.origin;
  const fullUrl = (path) => new URL(path, PUBLIC_ORIGIN).href;
  const profilePath = (p) => '/partenaires/profil/' + encodeURIComponent(p.slug) + '/';
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
    const ref = new URL(location.href).searchParams.get('ref') || '';
    fetch(apiUrl('/api/partner/click'),{method:'POST',headers:{'Content-Type':'application/json'},keepalive:true,body:JSON.stringify({
      slug:p?.slug || '', referralCode:ref, eventType, source:'partner-directory', medium,
      campaign:'partner-network', landingPath:location.pathname
    })}).catch(()=>{});
  };
  let partners = fallback.slice();
  // Conserver les partenaires ajoutés officiellement au répertoire même si l’API publique ou Supabase est en retard.
  const mergeCuratedPartners = (rows) => {
    const merged = Array.isArray(rows) ? rows.slice() : [];
    for (const curated of fallback) {
      const index = merged.findIndex(p => p.slug === curated.slug);
      if (index < 0) merged.push(curated);
      else if (curated.slug === 'sahelia-fresh') merged[index] = {...merged[index], ...curated};
    }
    return merged;
  };
  let selectedForShare = null;
  const dialog = $('partnerShareDialog');
  const directory = $('partners');
  const countryFilter = $('partnerCountryFilter');
  const categoryFilter = $('partnerCategoryFilter');
  const badgeFilter = $('partnerBadgeFilter');
  const search = $('partnerSearch');
  const count = $('partnerResultsCount');
  const message = $('partnerDirectoryMessage');

  // ISO 3166-1 alpha-2 country/territory codes; flag emojis are rendered as symbols on supported devices.
  const COUNTRY_CODES = ('AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW').split(' ');
  const REGION_NAMES = new Intl.DisplayNames(['fr'], {type:'region'});
  const flagFor = code => [...code.toUpperCase()].map(ch=>String.fromCodePoint(127397+ch.charCodeAt(0))).join('');
  const ALL_COUNTRIES = COUNTRY_CODES.map(code=>({code, name:REGION_NAMES.of(code), flag:flagFor(code)}))
    .filter(c=>c.name && c.name!==c.code).sort((a,b)=>a.name.localeCompare(b.name,'fr'));
  function fillFilter(select, values, defaultLabel, withFlags=false) {
    if (!select) return;
    const current=select.value;
    select.innerHTML='<option value="">'+escapeHtml(defaultLabel)+'</option>'+values.map(v=>{
      const country=withFlags?ALL_COUNTRIES.find(c=>c.name===v):null;
      return '<option value="'+escapeHtml(v)+'">'+(country?country.flag+' ':'')+escapeHtml(v)+'</option>';
    }).join('');
    if(values.includes(current)) select.value=current;
  }
  function rebuildFilters() {
    fillFilter(countryFilter,ALL_COUNTRIES.map(c=>c.name),'🌍 Tous les pays',true);
    fillFilter(categoryFilter,[...new Set(partners.map(p=>p.category || p.partnerType).filter(Boolean))].sort(),'Tous les domaines');
    // Keep legacy database country names selectable where browser locale data differs.
    for(const p of partners){if(p.country&&! [...countryFilter.options].some(o=>o.value===p.country)){const opt=document.createElement('option');opt.value=p.country;opt.textContent=(p.country==='Niger'?'🇳🇪 ':'🌐 ')+p.country;countryFilter.appendChild(opt);}}
  }
  function filteredPartners() {
    const q=(search?.value||'').trim().toLocaleLowerCase('fr');
    return partners.filter(p=>{
      const hay=[p.name,p.description,p.about,p.founder,p.mission,p.country,p.city,p.partnerType,p.category].join(' ').toLocaleLowerCase('fr');
      return (!q||hay.includes(q)) && (!countryFilter?.value||p.country===countryFilter.value)
        && (!categoryFilter?.value||(p.category||p.partnerType)===categoryFilter.value)
        && (!badgeFilter?.value||(badgeFilter.value==='unverified'?!p.badgeVerified:(p.badgeVerified&&(p.badgeLevel||'green')===badgeFilter.value)));
    });
  }
  function updateStats() {
    const total = partners.length;
    const verified = partners.filter(p => p.badgeVerified === true).length;
    const activeLevels = partners.filter(p => p.badgeVerified === true).length;
    const profilesWithStatus = partners.filter(p => typeof p.badgeVerified === 'boolean').length;
    const statusPercent = total ? Math.round((profilesWithStatus / total) * 100) : 0;
    if ($('statPartners')) $('statPartners').textContent = String(total).padStart(2, '0');
    if ($('statVerified')) $('statVerified').textContent = String(verified).padStart(2, '0');
    if ($('statLevels')) $('statLevels').textContent = String(activeLevels).padStart(2, '0');
    if ($('statStatus')) $('statStatus').textContent = statusPercent + '%';
  }

  function render() {
    if(!directory) return;
    const rows=filteredPartners();
    if(count) count.textContent=rows.length+' partenaire(s) affiché(s) sur '+partners.length;
    updateStats();

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
        '<h2>'+escapeHtml(p.name)+(p.badgeVerified?'<img class="verifiedBadge" src="/assets/partners/'+cfg.file+'" alt="'+escapeHtml(p.badgeLabel||cfg.label)+'" title="'+escapeHtml(p.badgeLabel||cfg.label)+'">':'')+'</h2>'+
        '<span class="partnerLiveBadge"'+(p.badgeVerified?'':' style="background:#f8fafc;color:#64748b;border-color:#e2e8f0"')+'>'+(p.badgeVerified?'✓ ':'')+escapeHtml(p.badgeVerified?(p.badgeLabel||cfg.label):'Profil actif — non vérifié')+'</span>'+
        '<p style="margin-top:12px">'+escapeHtml(p.slug==='sahelia-fresh'?'Yaourts et jus naturels · Formations pratiques · Livraison':(p.description||p.mission||'Partenaire de Bickri Service Agency'))+'</p>'+ 
        (p.founder?'<div class="partnerFounder">Dirigeant : <strong>'+escapeHtml(p.founder)+'</strong></div>':'')+
        '<div class="partnerMeta"><span class="chip">'+escapeHtml(p.category||p.partnerType||'Collaboration')+'</span><span class="chip">'+escapeHtml([p.city,p.country||'Niger'].filter(Boolean).join(' · '))+'</span></div>'+
        (p.publicId?'<div class="partnerPublicId">Identifiant de vérification : '+escapeHtml(p.publicId)+'</div>':'')+
        '<div class="partnerCardActions"><a class="primary" href="'+escapeHtml(href)+'" data-open-partner="'+escapeHtml(p.slug)+'">Voir la page</a><button class="share" type="button" data-share-partner="'+escapeHtml(p.slug)+'">Partager</button><button class="qr" type="button" data-qr-partner="'+escapeHtml(p.slug)+'">QR code</button></div></article>';
    }).join('');
  }
  function openShare(p) {
    selectedForShare=p;
    const shareTarget=new URL('/partenaires/partage/'+encodeURIComponent(p.slug)+'/',PUBLIC_ORIGIN);if(p.referralCode)shareTarget.searchParams.set('ref',p.referralCode);const link=shareTarget.href;
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
      partners=mergeCuratedPartners(saved.length?saved:fallback);
      message.textContent=saved.length?'Profils publics chargés depuis le répertoire Bickri.':'Les profils officiels seront affichés ici dès leur publication.';
    } catch(error) {
      // Read the public directory directly from Supabase if the Worker API is temporarily unavailable.
      // RLS only exposes active partner profiles; the publishable key never grants privileged access.
      try {
        const params=new URLSearchParams({
          active:'eq.true',
          select:'id,name,slug,description,company_about,logo_url,founder,mission,country,city,partner_type,category,website_url,social_links,badge_level,badge_label,badge_verified,verified_at,public_id,referral_code',
          order:'name.asc',
          limit:'300'
        });
        const direct=await fetch(SUPABASE_URL+'/rest/v1/agency_partners?'+params.toString(),{
          headers:{apikey:SUPABASE_PUBLIC_KEY,Authorization:'Bearer '+SUPABASE_PUBLIC_KEY,Accept:'application/json'},
          cache:'no-store'
        });
        const rows=await direct.json().catch(()=>[]);
        if(!direct.ok||!Array.isArray(rows))throw new Error('Supabase public directory unavailable');
        partners=mergeCuratedPartners(rows.map(row=>({
          id:row.id,name:row.name,slug:row.slug,description:row.description||'',about:row.company_about||'',
          logoUrl:row.slug==='sahelia-fresh'?'https://d2ol7oe51mr4n9.cloudfront.net/user_3Bt4xGygQGBZTOweEVrhbZ4s65k/053dc7b0-1a6c-4685-84a3-08595451a656.png':(row.logo_url||''),founder:row.founder||'',mission:row.mission||'',
          country:row.country||'Niger',city:row.city||'',partnerType:row.partner_type||'',
          category:row.category||row.partner_type||'',websiteUrl:row.website_url||'',socialLinks:row.social_links||{},
          badgeLevel:row.badge_level||'green',badgeLabel:row.badge_label||'Partenaire vérifié',
          badgeVerified:Boolean(row.badge_verified),verifiedAt:row.verified_at||null,publicId:row.public_id||'',referralCode:row.referral_code||''
        })));
        message.textContent='Répertoire chargé depuis la base de données.';
      } catch(directError) {
        partners=fallback.slice();
        message.textContent='Affichage de secours : le répertoire dynamique est momentanément indisponible.';
      }
    }
    rebuildFilters();render();
    try{
      const response=await fetch(apiUrl('/api/partners/metrics'),{cache:'no-store'});
      const data=await response.json();
      if(response.ok && $('statPartners')) $('statPartners').textContent=String(Math.max(Number(data.partners)||0,partners.length)).padStart(2,'0'); updateStats();
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