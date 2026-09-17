(()=>{
  const WHATSAPP_SVG='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="35" height="35" aria-hidden="true"><path fill="#fff" d="M16 4.1A11.8 11.8 0 0 0 5.8 22l-1.5 5.3 5.4-1.5A11.8 11.8 0 1 0 16 4.1Zm0 21.5c-1.2 0-2.4-.3-3.5-.9l-.3-.2-3.2.9.9-3.1-.2-.3A9.5 9.5 0 1 1 16 25.6Zm5.2-7.1c-.3-.2-1.8-.9-2-.9-.3-.1-.5-.1-.7.2l-.8 1c-.2.2-.3.2-.6.1-.3-.2-1.1-.4-2.1-1.3-.8-.7-1.3-1.5-1.4-1.7-.2-.3 0-.4.1-.6l.5-.6c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.3 5.2 4.6.7.3 1.3.4 1.8.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.3-.6-.4Z"/></svg>';
  const WA_URL='https://wa.me/22788376133?text=Bonjour%20Bickri%20Service%20Agency%2C%20je%20souhaite%20parler%20de%20mon%20projet.';
  const AI_ASSET='/bickri-ai.js?v=2026-09-17-3';
  function ensureAI(){
    if(document.getElementById('bickriAiButton')||window.__BICKRI_AI_LOAD_REQUESTED)return;
    if(document.querySelector('script[src*="/bickri-ai.js"]'))return;
    window.__BICKRI_AI_LOAD_REQUESTED=true;
    const s=document.createElement('script');s.src=AI_ASSET;s.defer=true;s.dataset.bickriAi='1';document.head.appendChild(s);
  }
  function fix(){
    ensureAI();
    const ai=document.getElementById('bickriAiButton');
    if(ai){
      ai.textContent='AI';ai.style.display='grid';ai.style.visibility='visible';ai.style.opacity='1';ai.style.zIndex='999';
      ai.setAttribute('aria-label','Bickri AI');ai.setAttribute('title','Bickri AI');
    }
    const panel=document.getElementById('bickriAiPanel');
    if(panel)panel.style.zIndex='998';
    const wa=document.querySelector('.wa');
    if(wa){
      wa.innerHTML=WHATSAPP_SVG;
      wa.style.background='#25D366';wa.style.width='62px';wa.style.height='62px';wa.style.borderRadius='50%';
      wa.style.display='grid';wa.style.placeItems='center';wa.style.padding='0';wa.style.color='transparent';
      wa.style.boxShadow='0 16px 35px rgba(0,0,0,.22)';
      wa.href=WA_URL;wa.target='_blank';wa.rel='noopener';
      wa.setAttribute('aria-label','WhatsApp Bickri Service Agency');wa.setAttribute('title','WhatsApp');
      wa.dataset.whatsappFinal='1';
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fix);else fix();
  setTimeout(fix,400);setTimeout(fix,1200);
  new MutationObserver(fix).observe(document.documentElement,{childList:true,subtree:true});
})();
