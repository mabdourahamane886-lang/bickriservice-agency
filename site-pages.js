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
    const hero=document.querySelector('.pageHero,.hero');
    if(!hero||hero.querySelector('.servicePageImage'))return;
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
        if(wrap)wrap.insertBefore(img,wrap.firstChild);
      })
      .catch(()=>{});
  }
  function initServiceDetailContent(){
    if(!location.pathname.startsWith('/services/'))return;
    const slug=location.pathname.split('/').filter(Boolean)[1];
    if(!slug)return;
    const main=document.querySelector('main');
    const hero=main?.querySelector('.pageHero,.hero');
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
        '<div class="serviceDetailLong"><div><span class="tag">Prestations incluses</span><h3>Ce qui peut être réalisé</h3><ul><li>'+esc(service.what||d[0])+'</li><li>'+esc(d[0])+'</li><li>'+esc(d[1])+'</li></ul></div><div><span class="tag">Prochaines étapes</span><h3>Une méthode claire</h3><div class="serviceProcess"><span><b>01</b> Définir votre objectif et votre besoin</span><span><b>02</b> Nous transmettre les informations utiles</span><span><b>03</b> Recevoir une proposition adaptée</span><span><b>04</b> Valider le périmètre et démarrer le projet</span><span><b>05</b> Suivre la réalisation, les tests et la livraison</span></div></div></div>'+
        '<div class="serviceDetailGrid serviceDetailExtended"><article class="card"><span class="tag">Notre approche</span><h3>Une prestation adaptée à votre contexte</h3><p>'+esc(d[3]||'Nous adaptons la prestation à votre activité, vos objectifs, votre audience et vos contraintes afin de construire une solution réellement utile.')+'</p></article><article class="card"><span class="tag">Notre méthode</span><h3>De l’analyse à l’accompagnement</h3><p>'+esc(d[4]||'Nous analysons le besoin, concevons la solution, réalisons les éléments prévus, effectuons les tests puis accompagnons la livraison.')+'</p></article></div>'+
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
  function initServiceReferenceLayout(){
    if(!location.pathname.startsWith('/services/')) return false;
    const slug=location.pathname.split('/').filter(Boolean)[1];
    if(!slug) return false;
    const style=document.createElement('style');
    style.id='bickri-service-reference-style';
    style.textContent=`
      body.service-reference-mode{margin:0;background:#f6f8fb;color:#101827;font-family:"DM Sans",sans-serif}
      .service-reference-mode *{box-sizing:border-box}
      .service-reference-mode a{text-decoration:none;color:inherit}
      .service-reference-mode .siteHeader{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.96);backdrop-filter:blur(16px);border-bottom:1px solid #e3e8f0}
      .service-reference-mode .siteWrap{width:min(1160px,calc(100% - 32px));margin:0 auto}
      .service-reference-mode .siteHeader .siteWrap{min-height:74px;display:flex;align-items:center;justify-content:space-between;gap:22px}
      .service-reference-mode .siteBrand{font-weight:900;letter-spacing:.02em;color:#08101f}
      .service-reference-mode .siteHeader nav{display:flex;gap:22px;font-size:14px;font-weight:800;color:#536077}
      .service-reference-mode .siteHeader nav a:hover{color:#9b701e}
      .service-reference-mode .pageHero{padding:72px 0 56px;background:linear-gradient(#fff,#f6f8fb)}
      .service-reference-mode .eyebrow{display:inline-flex;padding:8px 12px;border-radius:999px;background:#fff4d9;color:#775b1f;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.1em}
      .service-reference-mode .pageHero h1{font:800 clamp(2.5rem,6vw,4.7rem)/1.02 Manrope,sans-serif;letter-spacing:-.05em;margin:24px 0 20px;color:#08101f}
      .service-reference-mode .pageHero>div>p{font-size:clamp(1.05rem,2vw,1.35rem);line-height:1.8;color:#52627a;max-width:850px;margin:0}
      .service-reference-mode .actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}
      .service-reference-mode .btn{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 20px;border-radius:13px;border:1px solid #e3e8f0;background:#fff;font-weight:900}
      .service-reference-mode .btn.primary{background:linear-gradient(135deg,#d9a441,#b9852d);border-color:#d9a441;color:#08101f}
      .service-reference-mode .pageSection{padding:72px 0 96px;background:#fff}
      .service-reference-mode .contentGrid{display:block}
      .service-reference-mode .contentCard{margin:0 0 30px}
      .service-reference-mode .contentCard h2{font:800 clamp(1.8rem,4vw,2.7rem)/1.1 Manrope,sans-serif;letter-spacing:-.03em;color:#08101f;margin:0 0 18px}
      .service-reference-mode .contentCard p{font-size:1.08rem;line-height:1.9;color:#52627a;max-width:900px}
      .service-reference-mode .serviceFullCard{margin-bottom:44px}
      .service-reference-mode .serviceFullCard img{display:block;width:100%;max-width:1100px;height:min(58vw,520px);min-height:280px;object-fit:cover;border-radius:28px;box-shadow:0 24px 70px rgba(8,16,31,.16);margin:24px auto 0}
      .service-reference-mode .serviceCta{display:flex;align-items:center;justify-content:space-between;gap:24px;margin:42px 0 72px;padding:30px 34px;border-radius:26px;background:linear-gradient(135deg,#0b1730,#142b54);color:#fff}
      .service-reference-mode .serviceCta strong{display:block;font-size:1.4rem;margin-bottom:6px}
      .service-reference-mode .serviceCta span{display:block;color:#c8d2e2;line-height:1.6}
      .service-reference-mode .serviceCta .btn{white-space:nowrap;background:#d9a441;border-color:#d9a441}
      .service-reference-mode .shareBox{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
      .service-reference-mode .shareBox code{display:block;flex:1 1 500px;padding:14px 16px;border:1px solid #e3e8f0;border-radius:12px;background:#f7f9fc;color:#52627a;overflow-wrap:anywhere}
      .service-reference-mode .shareBox button{min-height:46px;padding:0 16px;border:1px solid #d9a441;border-radius:12px;background:#fff4d9;color:#775b1f;font-weight:900;cursor:pointer}
      .service-reference-mode .siteFooter{padding:28px 0;background:#08101f;color:#c8d2e2}
      @media(max-width:700px){
        .service-reference-mode .siteHeader .siteWrap{min-height:64px}
        .service-reference-mode .siteHeader nav{gap:12px;font-size:12px}
        .service-reference-mode .pageHero{padding:52px 0 44px}
        .service-reference-mode .pageSection{padding:52px 0 72px}
        .service-reference-mode .serviceFullCard img{height:330px;min-height:0;border-radius:20px}
        .service-reference-mode .serviceCta{align-items:flex-start;flex-direction:column;padding:24px}
        .service-reference-mode .serviceCta .btn{width:100%}
      }
      @media(max-width:480px){
        .service-reference-mode .siteHeader nav{display:none}
        .service-reference-mode .siteBrand{font-size:15px}
        .service-reference-mode .serviceFullCard img{height:260px}
      }
    `;
    document.head.appendChild(style);
    Promise.all([
      fetch('/services-share.json',{cache:'no-store'}).then(r=>r.ok?r.json():[]),
      fetch('/service-details.json',{cache:'no-store'}).then(r=>r.ok?r.json():{})
    ]).then(([items,details])=>{
      const service=items.find(x=>x.slug===slug);
      if(!service)return;
      const d=details[slug]||[service.what||'',service.get||'',service.why||''];
      const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
      const url=location.href.split('#')[0];
      document.body.className='service-reference-mode';
      document.body.innerHTML=`
        <header class="siteHeader">
          <div class="siteWrap">
            <a class="siteBrand" href="/">BICKRI SERVICE AGENCY</a>
            <nav><a href="/services/">Services</a><a href="/portfolio/">Projets</a><a href="/rendez-vous/">Contact</a></nav>
          </div>
        </header>
        <main>
          <section class="pageHero"><div class="siteWrap">
            <span class="eyebrow">Service digital</span>
            <h1>${esc(service.name)}</h1>
            <p>${esc(service.desc)}</p>
            <div class="actions"><a class="btn primary" href="/rendez-vous/">Demander ce service</a><a class="btn" href="/services/">Tous les services</a></div>
          </div></section>
          <section class="pageSection"><div class="siteWrap contentGrid">
            <article class="contentCard serviceFullCard">
              <span class="eyebrow">Fiche complète du service</span>
              <h2>${esc(service.name)}</h2>
              <p>${esc(service.desc)} Bickri Service Agency adapte cette prestation à votre activité, vos objectifs et vos contraintes.</p>
              <img src="${esc(service.img)}" alt="${esc(service.name)} — Bickri Service Agency" loading="eager" decoding="async">
            </article>
            <div class="serviceCta"><div><strong>Prêt à démarrer ?</strong><span>Expliquez-nous votre projet et nous vous orienterons vers la prochaine étape.</span></div><a class="btn" href="/rendez-vous/">Demander ce service →</a></div>
            <article class="contentCard"><h2>Ce que nous proposons</h2><p>${esc(service.desc)}</p><p>${esc(d[0]||service.what||'Nous adaptons la prestation à votre activité, vos objectifs et votre public afin de construire une solution digitale professionnelle et cohérente.')}</p></article>
            <article class="contentCard"><h2>Pour qui ?</h2><p>${esc(service.who||'Entrepreneurs, entreprises, créateurs, associations et organisations qui souhaitent développer leur activité grâce au numérique.')}</p></article>
            <article class="contentCard"><h2>Votre lien partageable</h2><div class="shareBox"><code>${esc(url)}</code><button type="button" data-copy-service-link>Copier le lien</button></div></article>
          </div></section>
        </main>
        <footer class="siteFooter"><div class="siteWrap">© ${new Date().getFullYear()} Bickri Service Agency — Niamey, Niger</div></footer>`;
      initBackButton();
      const copy=document.querySelector('[data-copy-service-link]');
      if(copy)copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);copy.textContent='Lien copié ✓'}catch(e){copy.textContent='Copiez le lien ci-dessus'}})
    }).catch(()=>{});
    return true;
  }

  function initBackButton(){
    if(document.getElementById('bickri-back-button'))return;
    const path=location.pathname.replace(/\\/+$/,'')||'/';
    if(path==='/'||path==='/index.html')return;
    const btn=document.createElement('button');
    btn.id='bickri-back-button';
    btn.type='button';
    btn.setAttribute('aria-label','Retour à la page précédente');
    btn.innerHTML='<span aria-hidden="true">←</span> Retour';
    btn.style.cssText='position:fixed;left:16px;bottom:18px;z-index:9999;display:inline-flex;align-items:center;gap:8px;padding:11px 15px;border:1px solid rgba(8,16,31,.12);border-radius:999px;background:rgba(255,255,255,.96);color:#08101f;font:800 13px/1 "DM Sans",sans-serif;box-shadow:0 10px 30px rgba(8,16,31,.16);backdrop-filter:blur(12px);cursor:pointer;';
    btn.addEventListener('click',()=>{
      if(window.history.length>1){window.history.back();}
      else if(path.startsWith('/services/')){window.location.href='/services/';}
      else{window.location.href='/';}
    });
    document.body.appendChild(btn);
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
  function boot(){addScript('/service-experience.js','bickri-service-experience');addScript('/_vercel/insights/script.js','bickri-vercel-analytics');addScript('/_vercel/speed-insights/script.js','bickri-vercel-speed');enhanceSEO();addArabicLink();if(initServiceReferenceLayout())return;initUI();initBackButton()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();