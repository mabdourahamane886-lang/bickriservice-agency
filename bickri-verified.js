(function(){
"use strict";
function esc(v){return String(v||"").replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]})}
function getName(el){
  const card=el.closest(".partner,.projectCard");
  if(card){
    const h=card.querySelector(".partner h2,.projectBody h3");
    if(h){
      const clone=h.cloneNode(true);
      clone.querySelectorAll(".inlineVerified,.verifiedBadge").forEach(x=>x.remove());
      const t=clone.textContent.trim();
      if(t) return t;
    }
  }
  return el.dataset.verifiedName||"Cette entreprise";
}
function openModal(trigger){
  closeModal();
  const name=getName(trigger);
  const isProfile=/Bickri Verified/i.test(name);
  const title=isProfile?"Profil vérifié":"Entreprise vérifiée";
  const text=isProfile
    ?"Ce profil est vérifié par Bickri Verified."
    :"Cette entreprise est vérifiée par Bickri Verified.";
  const modal=document.createElement("div");
  modal.className="bickriVerifiedModal";
  modal.innerHTML='<div class="bickriVerifiedBackdrop" data-verified-close></div>'+
    '<section class="bickriVerifiedDialog" role="dialog" aria-modal="true" aria-labelledby="bickriVerifiedTitle">'+
      '<button class="bickriVerifiedClose" type="button" aria-label="Fermer" data-verified-close>×</button>'+
      '<div class="bickriVerifiedIcon" aria-hidden="true"><img src="/assets/partners/badge-verified-green.svg" alt=""></div>'+
      '<div class="bickriVerifiedKicker">Bickri Verified</div>'+
      '<h2 id="bickriVerifiedTitle">'+esc(title)+'</h2>'+
      '<p class="bickriVerifiedName">'+esc(name)+'</p>'+
      '<p class="bickriVerifiedText"><strong>Vérifié par Bickri Verified</strong><br>'+esc(text)+'</p>'+
      '<div class="bickriVerifiedTrust"><span class="bickriVerifiedTrustBadge"><img src="/assets/partners/badge-verified-green.svg" alt=""></span><div><strong>Vérification officielle</strong><small>« Bickri Verified confirme que ce profil appartient bien à l’entreprise indiquée et répond aux critères de vérification. »</small></div></div>'+
    '</section>';
  document.body.appendChild(modal);
  document.body.classList.add("bickriVerifiedOpen");
  requestAnimationFrame(()=>modal.classList.add("is-open"));
  modal.querySelector("[data-verified-close]")?.focus();
  modal.addEventListener("click",e=>{if(e.target.closest("[data-verified-close]"))closeModal()});
  document.addEventListener("keydown",escHandler);
}
function closeModal(){
  const m=document.querySelector(".bickriVerifiedModal");
  if(!m)return;
  m.classList.remove("is-open");
  document.body.classList.remove("bickriVerifiedOpen");
  setTimeout(()=>m.remove(),180);
  document.removeEventListener("keydown",escHandler);
}
function escHandler(e){if(e.key==="Escape")closeModal()}
function init(){
  document.querySelectorAll(".verifiedBadge,.metaStyleBadge,[data-bickri-verified]").forEach(el=>{
    if(el.dataset.verifiedBound)return;
    el.dataset.verifiedBound="1";
    el.setAttribute("role","button");
    el.setAttribute("tabindex","0");
    el.setAttribute("aria-label","Voir la vérification Bickri Verified");
    el.style.cursor="pointer";
    el.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();openModal(el)});
    el.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();openModal(el)}});
  });
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
window.BickriVerified={open:openModal,close:closeModal,init:init};
})();