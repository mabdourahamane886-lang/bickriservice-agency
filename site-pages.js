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
  function initUI(){
    const menu=document.querySelector('.menu'),mobile=document.querySelector('.mobile');
    if(menu&&mobile&&!menu.dataset.bound){menu.dataset.bound='1';menu.setAttribute('aria-expanded','false');menu.addEventListener('click',()=>{mobile.classList.toggle('open');menu.setAttribute('aria-expanded',mobile.classList.contains('open')?'true':'false')})}
    document.querySelectorAll('[data-wa]').forEach(a=>{if(a.dataset.waBound)return;a.dataset.waBound='1';a.addEventListener('click',e=>{e.preventDefault();const text=a.getAttribute('data-wa')||'Bonjour Bickri Service Agency, je souhaite obtenir des informations.';window.open('https://wa.me/22788376133?text='+encodeURIComponent(text),'_blank','noopener')})});
    document.querySelectorAll('.faq button').forEach(b=>{if(b.dataset.faqBound)return;b.dataset.faqBound='1';b.addEventListener('click',()=>b.parentElement.classList.toggle('open'))});
    const y=document.querySelector('[data-year]');if(y)y.textContent=new Date().getFullYear();
  }
  function boot(){addScript('/_vercel/insights/script.js','bickri-vercel-analytics');addScript('/_vercel/speed-insights/script.js','bickri-vercel-speed');enhanceSEO();addArabicLink();initUI()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();