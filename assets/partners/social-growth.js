(() => {
  'use strict';
  const TOKEN_KEY='bsa_partner_access_token';
  const API_BASE=location.hostname.endsWith('.vercel.app')?'https://bickriservice-agency.org':'';
  const $=id=>document.getElementById(id);
  const platforms=[
    {id:'facebook',name:'Facebook',letter:'f',desc:'Pages, publications, Reels et statistiques.'},
    {id:'x',name:'X (Twitter)',letter:'𝕏',desc:'Posts, conversations et audience.'},
    {id:'instagram',name:'Instagram',letter:'◎',desc:'Reels, carrousels et contenus visuels.'},
    {id:'youtube',name:'YouTube',letter:'▶',desc:'Vidéos, Shorts et statistiques de chaîne.'},
    {id:'tiktok',name:'TikTok',letter:'♪',desc:'Vidéos courtes et découverte.'}
  ];
  let selected=new Set(['facebook','instagram','tiktok']);
  let overview=null;
  const token=()=>sessionStorage.getItem(TOKEN_KEY)||'';
  const setStatus=(message,type='info')=>{const el=$('sgStatus');el.textContent=message;el.className='status '+(type==='error'?'error':type==='success'?'success':'');};
  async function api(path,options={}){
    const headers={'Accept':'application/json',...(options.headers||{})};
    if(token())headers.Authorization='Bearer '+token();
    if(options.body&&!headers['Content-Type'])headers['Content-Type']='application/json';
    const response=await fetch(API_BASE+path,{...options,headers,cache:'no-store'});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||data.message||('Erreur HTTP '+response.status));
    return data;
  }
  function renderPlatforms(accounts=[]){
    const byPlatform=new Map(accounts.map(a=>[a.platform,a]));
    $('platformGrid').innerHTML=platforms.map(p=>{
      const account=byPlatform.get(p.id);
      const connected=account&&account.connectionStatus==='connected';
      const config=account&&account.connectionStatus==='configuration_required';
      return '<article class="platform '+(selected.has(p.id)?'selected':'')+'" data-platform="'+p.id+'"><div class="platformTop"><div class="platformIcon">'+p.letter+'</div><span class="pill '+(connected?'connected':config?'config':'')+'">'+(connected?'Connecté':config?'Configuration requise':'Non connecté')+'</span></div><h3>'+p.name+'</h3><p>'+p.desc+'</p><div style="display:flex;gap:7px;flex-wrap:wrap"><button class="btn light selectPlatform" data-id="'+p.id+'">'+(selected.has(p.id)?'Sélectionné':'Sélectionner')+'</button><button class="btn connectPlatform" data-id="'+p.id+'" '+(connected?'disabled':'')+'>Connecter</button></div></article>';
    }).join('');
    document.querySelectorAll('.selectPlatform').forEach(btn=>btn.addEventListener('click',()=>{
      const id=btn.dataset.id;selected.has(id)?selected.delete(id):selected.add(id);renderPlatforms(accounts);
    }));
    document.querySelectorAll('.connectPlatform').forEach(btn=>btn.addEventListener('click',()=>connectPlatform(btn.dataset.id)));
  }
  function renderStats(metrics=[]){
    const totals=metrics.reduce((acc,m)=>({
      followers:acc.followers+Number(m.followers_count||0),
      reach:acc.reach+Number(m.reach||0),
      engagements:acc.engagements+Number(m.engagements||0),
      views:acc.views+Number(m.video_views||0)
    }),{followers:0,reach:0,engagements:0,views:0});
    $('statsGrid').innerHTML=[['Abonnés',totals.followers],['Portée',totals.reach],['Interactions',totals.engagements],['Vues vidéo',totals.views]].map(([label,value])=>'<div class="stat"><strong>'+Number(value).toLocaleString('fr-FR')+'</strong><span>'+label+'</span></div>').join('');
  }
  function renderContent(items=[]){
    $('generatedContent').innerHTML=items.length?items.map(item=>'<article class="contentItem"><strong>'+escapeHtml(item.platformLabel||item.platform)+' — '+escapeHtml(item.format||'Publication')+'</strong><p>'+escapeHtml(item.caption||item.text||'')+'</p></article>').join(''):'';
  }
  function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  async function loadOverview(){
    if(!token()){setStatus('Connectez-vous d’abord à votre espace partenaire.','error');return;}
    try{
      const data=await api('/api/social-growth/overview');
      overview=data;
      selected=new Set(data.preferences?.selectedPlatforms||[]);
      renderPlatforms(data.accounts||[]);
      renderStats(data.metrics||[]);
      renderScheduled(data.content||[]);
      if(data.preferences){
        const goals=new Set(data.preferences.growthGoals||['visibility']);
        document.querySelectorAll('#goalChoices input').forEach(el=>el.checked=goals.has(el.value));
        $('targetAudience').value=data.preferences.targetAudience?.description||'';
        $('weeklyTarget').value=data.preferences.weeklyPostTarget??4;
      }
      $('savePlatforms').disabled=false;$('saveStrategy').disabled=false;$('refreshOverview').disabled=false;$('generateContent').disabled=false;$('schedulePost').disabled=false;
      setStatus('Espace Social Growth chargé pour '+(data.partner?.name||'votre marque')+'.','success');
    }catch(error){
      setStatus(error.message||'Impossible de charger Social Growth. Connectez-vous à votre espace partenaire.', 'error');
      if(/session|connectez|authentification/i.test(error.message))setTimeout(()=>{location.href='/partenaires/espace/';},1800);
    }
  }
  async function syncAndRefresh(){
    const button=$('refreshOverview');button.disabled=true;button.textContent='Synchronisation…';
    try{
      const result=await api('/api/social-growth/sync',{method:'POST',body:'{}'});
      await loadOverview();
      setStatus('Synchronisation terminée : '+result.synced+' compte(s) actualisé(s), '+result.failed+' erreur(s).',result.failed?'error':'success');
    }catch(error){setStatus(error.message,'error');}
    finally{button.disabled=false;button.textContent='Synchroniser les statistiques';}
  }
  async function connectPlatform(platform){
    try{
      const data=await api('/api/social-growth/oauth/start?platform='+encodeURIComponent(platform));
      if(data.authorizationUrl)location.href=data.authorizationUrl;
      else setStatus(data.message||'Connexion indisponible pour le moment.','error');
    }catch(error){setStatus(error.message,'error');}
  }
  async function savePreferences(){
    try{
      await api('/api/social-growth/preferences',{method:'PUT',body:JSON.stringify({selectedPlatforms:[...selected]})});
      setStatus('Votre sélection de réseaux a été enregistrée.','success');
    }catch(error){setStatus(error.message,'error');}
  }
  async function saveStrategy(){
    try{
      const growthGoals=[...document.querySelectorAll('#goalChoices input:checked')].map(el=>el.value);
      await api('/api/social-growth/preferences',{method:'PUT',body:JSON.stringify({
        selectedPlatforms:[...selected],growthGoals,
        targetAudience:{description:$('targetAudience').value.trim()},
        weeklyPostTarget:Number($('weeklyTarget').value||4)
      })});
      setStatus('Votre stratégie a été enregistrée.','success');
    }catch(error){setStatus(error.message,'error');}
  }
  async function generate(){
    const brief=$('contentBrief').value.trim();
    if(brief.length<10){setStatus('Décrivez votre produit ou sujet avec au moins 10 caractères.','error');return;}
    const button=$('generateContent');button.disabled=true;button.textContent='Bickri IA prépare vos contenus…';
    try{
      const result=await api('/api/social-growth/generate',{method:'POST',body:JSON.stringify({
        sector:$('brandSector').value.trim(),objective:$('contentObjective').value,brief,
        platforms:[...selected]
      })});
      renderContent(result.contents||[]);
      setStatus('Votre stratégie de contenu est prête. Enregistrez les idées que vous souhaitez conserver.','success');
    }catch(error){setStatus(error.message,'error');}
    finally{button.disabled=false;button.textContent='Générer ma stratégie de contenu';}
  }

  function renderScheduled(items=[]){
    const el=$('scheduledList');if(!el)return;
    const rows=items.filter(x=>['scheduled','published','failed','cancelled','publishing'].includes(x.status));
    el.innerHTML=rows.length?rows.map(x=>'<article class="contentItem"><strong>'+escapeHtml(x.platform)+' · '+escapeHtml(x.status)+'</strong><p>'+escapeHtml(x.caption||'')+'</p><span class="muted">'+escapeHtml(x.scheduled_at?new Date(x.scheduled_at).toLocaleString('fr-FR',{timeZone:'Africa/Niamey'}):'')+'</span>'+(x.error_code?'<p class="muted">Code : '+escapeHtml(x.error_code)+'</p>':'')+'</article>').join(''):'<p class="muted">Aucune publication programmée pour le moment.</p>';
  }
  async function schedulePost(){
    const button=$('schedulePost');button.disabled=true;button.textContent='Enregistrement…';
    try{
      const local=$('scheduleAt').value;
      const media=$('scheduleMedia').value.trim();
      const scheduledAt=local?new Date(local).toISOString():'';
      const result=await api('/api/social-growth/content/schedule',{method:'POST',body:JSON.stringify({
        platform:$('schedulePlatform').value,caption:$('scheduleCaption').value.trim(),
        scheduledAt,mediaUrls:media?[media]:[],contentType:'post'
      })});
      $('scheduleCaption').value='';$('scheduleMedia').value='';
      await loadOverview();
      setStatus('Publication programmée. Elle sera envoyée à l’heure choisie si le compte et les autorisations API sont toujours valides.','success');
    }catch(error){setStatus(error.message||'Impossible de programmer cette publication.','error');}
    finally{button.disabled=false;button.textContent='Programmer la publication';}
  }

  $('schedulePost').addEventListener('click',schedulePost);
  $('savePlatforms').addEventListener('click',savePreferences);
  $('saveStrategy').addEventListener('click',saveStrategy);
  $('generateContent').addEventListener('click',generate);
  $('refreshOverview').addEventListener('click',syncAndRefresh);
  const params=new URLSearchParams(location.search);
  if(params.get('connected')==='1')setStatus('Compte social connecté. Chargement des données…','success');
  if(params.get('error'))setStatus('Connexion non terminée : '+params.get('error'),'error');
  loadOverview();
})();