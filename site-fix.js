(()=>{
  const WHATSAPP_SVG='<svg viewBox="0 0 32 32" width="34" height="34" aria-hidden="true"><path fill="#fff" d="M16 4.1A11.8 11.8 0 0 0 5.8 22l-1.5 5.3 5.4-1.5A11.8 11.8 0 1 0 16 4.1Zm0 21.5c-1.2 0-2.4-.3-3.5-.9l-.3-.2-3.2.9.9-3.1-.2-.3A9.5 9.5 0 1 1 16 25.6Zm5.2-7.1c-.3-.2-1.8-.9-2-.9-.3-.1-.5-.1-.7.2l-.8 1c-.2.2-.3.2-.6.1-.3-.2-1.1-.4-2.1-1.3-.8-.7-1.3-1.5-1.4-1.7-.2-.3 0-.4.1-.6l.5-.6c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.3 5.2 4.6.7.3 1.2.4 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.3-.6-.4Z"/></svg>';
  function fix(){
    const ai=document.getElementById('bickriAiButton');
    if(ai){ai.style.display='grid';ai.style.visibility='visible';ai.style.opacity='1';ai.style.zIndex='999';}
    const panel=document.getElementById('bickriAiPanel');
    if(panel)panel.style.zIndex='998';
    const wa=document.querySelector('.wa');
    if(wa && wa.dataset.whatsappFinal!=='1'){
      wa.innerHTML=WHATSAPP_SVG;
      wa.style.background='#25D366';
      wa.style.width='62px';wa.style.height='62px';wa.style.borderRadius='50%';
      wa.style.display='grid';wa.style.placeItems='center';wa.style.padding='0';
      wa.style.color='transparent';
      wa.setAttribute('aria-label','WhatsApp');wa.setAttribute('title','WhatsApp');
      wa.dataset.whatsappFinal='1';
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fix);else fix();
  new MutationObserver(fix).observe(document.documentElement,{childList:true,subtree:true});
})();
