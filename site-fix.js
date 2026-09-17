(()=>{
  const WA_URL='https://wa.me/22788376133?text=Bonjour%20Bickri%20Service%20Agency%2C%20je%20souhaite%20parler%20de%20mon%20projet.';
  const WA_ASSET='/assets/bickri-whatsapp-ai.svg?v=2026-09-17-4';
  const AI_ASSET='/bickri-ai.js?v=2026-09-17-4';
  function ensureAI(){
    if(document.querySelector('script[data-bickri-ai="1"]'))return;
    const scripts=[...document.scripts];
    if(scripts.some(s=>s.src&&s.src.includes('/bickri-ai.js')))return;
    const s=document.createElement('script');s.src=AI_ASSET;s.defer=true;s.dataset.bickriAi='1';document.head.appendChild(s);
  }
  function openAI(e){
    if(e){e.preventDefault();e.stopPropagation();}
    const panel=document.getElementById('bickriAiPanel');
    if(panel){
      panel.classList.add('open');
      const input=panel.querySelector('textarea');
      if(input)setTimeout(()=>input.focus(),60);
      enhancePanel();
      return false;
    }
    ensureAI();
    setTimeout(openAI,180);
    return false;
  }
  function enhanceLabel(){
    let label=document.getElementById('bickriAiLabel');
    if(!label){
      label=document.createElement('button');
      label.id='bickriAiLabel';
      label.type='button';
      label.textContent='Bickri IA';
      label.setAttribute('aria-label','Ouvrir Bickri IA');
      label.title='Ouvrir Bickri IA';
      label.onclick=openAI;
      label.style.cssText='position:fixed;right:92px;bottom:29px;z-index:1001;border:1px solid #d9a441;border-radius:999px;padding:7px 11px;background:#08101f;color:#f3cf78;font:800 12px/1.1 "DM Sans",sans-serif;box-shadow:0 10px 28px rgba(8,16,31,.24);cursor:pointer;white-space:nowrap;';
      document.body.appendChild(label);
    }
    if(window.innerWidth<=620){label.style.right='84px';label.style.bottom='27px';label.style.fontSize='11px';label.style.padding='6px 9px';}
  }
  function enhancePanel(){
    const panel=document.getElementById('bickriAiPanel');
    if(!panel)return;
    panel.style.zIndex='1000';
    if(panel.dataset.bickriWhatsappLink==='1')return;
    const form=panel.querySelector('.bai-input');
    if(!form)return;
    const link=document.createElement('a');
    link.id='bickriAiWhatsAppLink';
    link.href=WA_URL;link.target='_blank';link.rel='noopener';
    link.textContent='Contacter Bickri Service Agency sur WhatsApp';
    link.style.cssText='display:block;margin:0 11px 10px;padding:10px 12px;border-radius:12px;background:#25D366;color:#fff;text-align:center;text-decoration:none;font:800 12px/1.2 "DM Sans",sans-serif;';
    form.parentNode.insertBefore(link,form);
    panel.dataset.bickriWhatsappLink='1';
  }
  function fix(){
    ensureAI();
    const oldAI=document.getElementById('bickriAiButton');
    if(oldAI)oldAI.style.display='none';
    const panel=document.getElementById('bickriAiPanel');
    if(panel)panel.style.zIndex='1000';
    const wa=document.querySelector('.wa');
    if(wa){
      if(wa.dataset.bickriAIButton!=='1'){
        wa.innerHTML='<img src="'+WA_ASSET+'" alt="WhatsApp et Bickri IA" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;" loading="eager">';
        wa.dataset.bickriAIButton='1';
      }
      wa.style.background='transparent';
      wa.style.width='70px';wa.style.height='70px';wa.style.borderRadius='50%';
      wa.style.padding='0';wa.style.border='0';wa.style.overflow='visible';
      wa.style.display='grid';wa.style.placeItems='center';wa.style.zIndex='1002';
      wa.style.boxShadow='0 16px 35px rgba(0,0,0,.22)';
      wa.href='#bickriAiPanel';wa.removeAttribute('target');wa.removeAttribute('rel');
      wa.setAttribute('aria-label','Ouvrir Bickri IA');wa.setAttribute('title','Bickri IA — assistant client');
      wa.onclick=openAI;
    }
    enhanceLabel();
    enhancePanel();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fix);else fix();
  setTimeout(fix,350);setTimeout(fix,1000);setTimeout(fix,1800);
  window.addEventListener('resize',enhanceLabel);
  new MutationObserver(fix).observe(document.documentElement,{childList:true,subtree:true});
})();
