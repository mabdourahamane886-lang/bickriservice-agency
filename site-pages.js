(function(){
  window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};
  window.si=window.si||function(){(window.siq=window.siq||[]).push(arguments)};
  function addScript(src,id){if(document.getElementById(id))return;const s=document.createElement('script');s.defer=true;s.src=src;s.id=id;document.head.appendChild(s)}
  function enhanceSEO(){
    const title=document.title||'Bickri Service Agency — Agence digitale';
    const description=document.querySelector('meta[name="description"]')?.content||'Bickri Service Agency — agence digitale à Niamey, Niger.';
    const url=location.href.split('#')[0]; const image='https://bickriservice-agency.vercel.app/hero-yellow.jpg';
    const ensure=(selector,attrs)=>{if(document.head.querySelector(selector))return;const m=document.createElement('meta');Object.entries(attrs).forEach(([k,v])=>m.setAttribute(k,v));document.head.appendChild(m)};
    ensure('meta[property="og:type"]',{property:'og:type',content:'website'});
    ensure('meta[property="og:url"]',{property:'og:url',content:url});
    ensure('meta[property="og:title"]',{property:'og:title',content:title});
    ensure('meta[property="og:description"]',{property:'og:description',content:description});
    ensure('meta[property="og:image"]',{property:'og:image',content:image});
    ensure('meta[name="twitter:card"]',{name:'twitter:card',content:'summary_large_image'});
    ensure('meta[name="twitter:title"]',{name:'twitter:title',content:title});
    ensure('meta[name="twitter:description"]',{name:'twitter:description',content:description});
    ensure('meta[name="twitter:image"]',{name:'twitter:image',content:image});
    if(!document.querySelector('link[rel="icon"]')){const icon=document.createElement('link');icon.rel='icon';icon.href='/assets/bickri-b-logo.svg';document.head.appendChild(icon)}
    if(!document.querySelector('link[rel="canonical"]')){const canonical=document.createElement('link');canonical.rel='canonical';canonical.href=url;document.head.appendChild(canonical)}
    if(!document.getElementById('bickri-webpage-schema')){const ld=document.createElement('script');ld.type='application/ld+json';ld.id='bickri-webpage-schema';ld.textContent=JSON.stringify({'@context':'https://schema.org','@type':'WebPage',name:title,url,inLanguage:document.documentElement.lang||'fr',isPartOf:{'@type':'WebSite',name:'Bickri Service Agency',url:'https://bickriservice-agency.vercel.app/'}});document.head.appendChild(ld)}
  }
  function addArabicLink(){const desktop=document.querySelector('.links');if(desktop&&!desktop.querySelector('a[href="/ar/"]')){const a=document.createElement('a');a.href='/ar/';a.textContent='العربية';desktop.appendChild(a)}const mobile=document.querySelector('.mobile');if(mobile&&!mobile.querySelector('a[href="/ar/"]')){const a=document.createElement('a');a.href='/ar/';a.textContent='العربية';mobile.appendChild(a)}}
  function initPortfolioFilters(){
    const buttons=document.querySelectorAll('.portfolioFilter');
    const cards=document.querySelectorAll('.projectCard');
    if(!buttons.length||!cards.length)return;
    buttons.forEach(button=>{
      if(button.dataset.filterBound)return;
      button.dataset.filterBound='1';
      button.addEventListener('click',()=>{
        const filter=button.dataset.filter||'all';
        buttons.forEach(b=>b.classList.toggle('active',b===button));
        cards.forEach(card=>{
          const categories=(card.dataset.category||'').split(/s+/);
          card.classList.toggle('is-hidden',filter!=='all'&&!categories.includes(filter));
        });
      });
    });
  }
  function initServicePhoto(){
    if(!location.pathname.startsWith('/services/'))return;
    const slug=location.pathname.split('/').filter(Boolean)[1];
    if(!slug)return;
    const hero=document.querySelector('.hero');
    const heroGrid=document.querySelector('.heroGrid');
    if(!hero||!heroGrid||hero.querySelector('.servicePageImage'))return;
    fetch('/services-share.json',{cache:'no-store'})
      .then(r=>r.ok?r.json():[])
      .then(items=>{
        const service=items.find(x=>x.slug===slug);
        if(!service||!service.img)return;
        const img=document.createElement('img');
        img.className='servicePageImage';
        img.src=service.img;
        img.alt=service.name||document.title;
        img.loading='eager';
        img.decoding='async';
        img.addEventListener('error',()=>img.remove());
        const wrap=hero.querySelector('.wrap');
        if(wrap)wrap.insertBefore(img,heroGrid);
      })
      .catch(()=>{});
  }
  function initServiceDetailContent(){
    if(!location.pathname.startsWith('/services/'))return;
    const slug=location.pathname.split('/').filter(Boolean)[1];
    if(!slug)return;
    const main=document.querySelector('main');
    const hero=main?.querySelector('.hero');
    if(!main||!hero||main.querySelector('.serviceLongDetails'))return;
    Promise.all([
      fetch('/services-share.json',{cache:'no-store'}).then(r=>r.ok?r.json():[]),
      fetch('/service-details.json',{cache:'no-store'}).then(r=>r.ok?r.json():{})
    ]).then(([items,details])=>{
      const service=items.find(x=>x.slug===slug);
      if(!service)return;
      const d=details[slug]||[service.what||'',service.get||'',service.why||''];
      const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
      const image=esc(service.img||'');
      const section=document.createElement('section');
      section.className='section serviceLongDetails';
      section.innerHTML='<div class="wrap">'+
        '<div class="eyebrow">Fiche complète du service</div><h2 class="title">'+esc(service.name)+'</h2>'+
        '<p class="serviceDetailLead">'+esc(service.desc)+' Bickri Service Agency adapte cette prestation à votre activité, vos objectifs et vos contraintes.</p>'+
        '<div class="serviceDetailHero"><img src="'+image+'" alt="'+esc(service.name)+' — Bickri Service Agency" loading="lazy" decoding="async"><div><span class="tag">Pourquoi cette prestation ?</span><h3>Une solution pensée pour votre projet</h3><p>'+esc(d[2])+'</p><p class="serviceDetailMeta"><strong>Référence :</strong> '+esc(service.code||'')+'</p></div></div>'+
        '<div class="serviceDetailGrid"><article class="card"><span class="tag">Ce que nous réalisons</span><h3>Une prestation structurée</h3><p>'+esc(d[0])+'</p></article><article class="card"><span class="tag">Ce que vous obtenez</span><h3>Des livrables concrets</h3><p>'+esc(d[1])+'</p></article><article class="card"><span class="tag">Pour qui ?</span><h3>Une approche adaptée</h3><p>'+esc(service.who||'Entrepreneurs, entreprises, créateurs et organisations.')+'</p></article><article class="card"><span class="tag">Pourquoi maintenant ?</span><h3>Passer de l’idée à l’action</h3><p>'+esc(d[2])+'</p></article></div>'+
        '<div class="serviceDetailLong"><div><span class="tag">Prestations incluses</span><h3>Ce qui peut être réalisé</h3><ul><li>'+esc(service.what||d[0])+'</li><li>'+esc(d[0])+'</li><li>'+esc(d[1])+'</li></ul></div><div><span class="tag">Prochaines étapes</span><h3>Ce que nous vous conseillons de faire</h3><div class="serviceProcess"><span><b>01</b> Définir votre objectif et votre besoin</span><span><b>02</b> Nous transmettre les informations utiles</span><span><b>03</b> Recevoir une proposition adaptée</span><span><b>04</b> Valider le périmètre et démarrer le projet</span><span><b>05</b> Suivre la réalisation, les tests et la livraison</span></div></div></div>'+
        '<div class="serviceDetailCta"><div><strong>Prêt à démarrer ?</strong><span>Expliquez-nous votre projet et nous vous orienterons vers la prochaine étape.</span></div><a class="cta" href="/rendez-vous/">Demander ce service →</a></div></div>';
      hero.insertAdjacentElement('afterend',section);
    }).catch(()=>{});
  }

  function initServiceDetailScroll(){
    if(!location.pathname.startsWith('/services/'))return;
    document.body.classList.add('service-detail-mode');
    const main=document.querySelector('main');
    if(main)main.classList.add('serviceDetailScroller');
  }
  function initUI(){
    const menu=document.querySelector('.menu'),mobile=document.querySelector('.mobile');
    if(menu&&mobile&&!menu.dataset.bound){menu.dataset.bound='1';menu.setAttribute('aria-expanded','false');menu.addEventListener('click',()=>{mobile.classList.toggle('open');menu.setAttribute('aria-expanded',mobile.classList.contains('open')?'true':'false')})}
    document.querySelectorAll('[data-wa]').forEach(a=>{if(a.dataset.waBound)return;a.dataset.waBound='1';a.addEventListener('click',e=>{e.preventDefault();const text=a.getAttribute('data-wa')||'Bonjour Bickri Service Agency, je souhaite obtenir des informations.';window.open('https://wa.me/22788376133?text='+encodeURIComponent(text),'_blank','noopener')})});
    document.querySelectorAll('.faq button').forEach(b=>{if(b.dataset.faqBound)return;b.dataset.faqBound='1';b.addEventListener('click',()=>b.parentElement.classList.toggle('open'))});
    const y=document.querySelector('[data-year]');if(y)y.textContent=new Date().getFullYear();
    initPortfolioFilters();
    initServicePhoto();
    initServiceDetailContent();
    initServiceDetailScroll();
  }
  function boot(){addScript('/service-experience.js','bickri-service-experience');addScript('/_vercel/insights/script.js','bickri-vercel-analytics');addScript('/_vercel/speed-insights/script.js','bickri-vercel-speed');enhanceSEO();addArabicLink();initUI()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();