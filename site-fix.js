(()=>{
  const restoreWhatsApp=()=>{
    const wa=document.querySelector('.wa');
    if(!wa)return;
    wa.innerHTML='✆';
    wa.style.background='';
    wa.style.display='';
    wa.style.placeItems='';
    wa.style.padding='';
    wa.removeAttribute('title');
    wa.setAttribute('aria-label','WhatsApp');
  };
  const keepAI=()=>{
    const ai=document.querySelector('#bickriAiButton');
    if(ai){
      ai.style.display='grid';
      ai.style.visibility='visible';
      ai.style.opacity='1';
      ai.style.zIndex='999';
    }
    const panel=document.querySelector('#bickriAiPanel');
    if(panel){panel.style.zIndex='998'}
  };
  const fix=()=>{restoreWhatsApp();keepAI()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fix);else fix();
  new MutationObserver(fix).observe(document.documentElement,{childList:true,subtree:true});
})();
