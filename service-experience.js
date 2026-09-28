(()=>{const load=()=>fetch('/services-share.json',{cache:'no-store'}).then(r=>r.ok?r.json():[]).catch(()=>[]);const go=s=>{if(s)location.href='/services/'+encodeURIComponent(s)+'/'};function home(a){if(location.pathname!=='/'&&location.pathname!=='/index.html')return;document.body.classList.add('service-cards-no-modal');document.querySelectorAll('.service').forEach((card,i)=>{const x=a[i];if(!x)return;card.dataset.serviceSlug=x.slug;card.tabIndex=0;card.setAttribute('role','link');card.setAttribute('aria-label','Voir la fiche complète de '+x.name);if(card.dataset.directServiceBound)return;card.dataset.directServiceBound='1';card.onclick=e=>{if(!e.target.closest('a,button'))go(x.slug)};card.onkeydown=e=>{if((e.key==='Enter'||e.key===' ')&&!e.target.closest('a,button')){e.preventDefault();go(x.slug)}};const b=card.querySelector('.serviceBtn');if(b){b.textContent='Voir la fiche complète →';b.onclick=e=>{e.preventDefault();e.stopPropagation();go(x.slug)}}})}function styles(){if(document.getElementById('bickri-service-experience-css'))return;const s=document.createElement('style');s.id='bickri-service-experience-css';s.textContent=`
.service-cards-no-modal .modal{display:none!important}.service{cursor:pointer;transition:transform .2s ease,box-shadow .2s ease}
.service:hover{transform:translateY(-3px);box-shadow:0 18px 50px rgba(8,16,31,.10)}
.service:focus-visible{outline:3px solid #d9a441;outline-offset:3px}
.service-detail-mode .hero{padding-bottom:35px}
.service-detail-mode .heroGrid{display:block;max-width:1100px}
.service-detail-mode .heroGrid>.heroCard{display:none!important}
.service-detail-mode .servicePageImage{display:block;width:100%;max-width:1100px;height:min(58vw,520px);min-height:280px;object-fit:cover;margin:28px auto 42px;border-radius:28px;box-shadow:0 24px 70px rgba(8,16,31,.20)}
.service-detail-mode .serviceLongDetails{padding-top:35px}
.service-detail-mode .serviceLongDetails>.wrap{max-width:1100px}
.service-detail-mode .serviceLongDetails .title{max-width:950px;font-size:clamp(2rem,4vw,4rem);line-height:1.05;margin-bottom:18px}
.service-detail-mode .serviceDetailLead{max-width:900px;font-size:1.08rem;line-height:1.85;color:#52627a;margin-bottom:42px}
.service-detail-mode .serviceDetailHero{display:grid;grid-template-columns:1.05fr .95fr;gap:30px;align-items:stretch;margin:35px 0 55px}
.service-detail-mode .serviceDetailHero img{width:100%;height:100%;min-height:360px;object-fit:cover;border-radius:24px}
.service-detail-mode .serviceDetailHero>div{padding:34px;border-radius:24px;background:#f6f8fb;border:1px solid rgba(8,16,31,.09)}
.service-detail-mode .serviceDetailHero h3{font-size:1.7rem;line-height:1.2;margin:18px 0 14px}
.service-detail-mode .serviceDetailHero p{line-height:1.85;color:#52627a}
.service-detail-mode .serviceDetailGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px;margin:35px 0 55px}
.service-detail-mode .serviceDetailGrid .card{height:100%;padding:30px}
.service-detail-mode .serviceDetailGrid .card h3{font-size:1.35rem;margin:12px 0}
.service-detail-mode .serviceDetailGrid .card p{line-height:1.85;color:#52627a}
.service-detail-mode .serviceDetailLong{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin:35px 0;padding:34px;border-radius:26px;background:#08101f;color:#fff}
.service-detail-mode .serviceDetailLong h3{font-size:1.5rem;margin:12px 0 20px}
.service-detail-mode .serviceDetailLong p,.service-detail-mode .serviceDetailLong li{line-height:1.85;color:#c8d2e2}
.service-detail-mode .serviceDetailLong ul{padding-left:20px}
.service-detail-mode .serviceProcess{display:grid;gap:12px}
.service-detail-mode .serviceProcess span{display:block;padding:14px 16px;border:1px solid rgba(255,255,255,.12);border-radius:14px;background:rgba(255,255,255,.04);color:#dbe4f0;line-height:1.6}
.service-detail-mode .serviceProcess b{display:inline-grid;place-items:center;width:32px;height:32px;margin-right:10px;border-radius:50%;background:#d9a441;color:#08101f}
.service-detail-mode .serviceDetailCta{display:flex;align-items:center;justify-content:space-between;gap:25px;margin-top:35px;padding:28px 32px;border-radius:24px;background:linear-gradient(135deg,#0b1730,#142b54);color:#fff}
.service-detail-mode .serviceDetailCta strong{display:block;font-size:1.35rem;margin-bottom:5px}
.service-detail-mode .serviceDetailCta span{display:block;color:#c8d2e2}
.service-detail-mode .serviceDetailCta .cta{white-space:nowrap}
@media(max-width:800px){.service-detail-mode .servicePageImage{height:330px;margin-top:20px;border-radius:20px}.service-detail-mode .serviceDetailHero,.service-detail-mode .serviceDetailGrid,.service-detail-mode .serviceDetailLong{grid-template-columns:1fr}.service-detail-mode .serviceDetailHero img{min-height:260px}.service-detail-mode .serviceDetailLong{padding:24px}.service-detail-mode .serviceDetailCta{align-items:flex-start;flex-direction:column}.service-detail-mode .serviceDetailCta .cta{width:100%;text-align:center}}
@media(max-width:520px){.service-detail-mode .servicePageImage{height:260px}.service-detail-mode .serviceDetailGrid .card,.service-detail-mode .serviceDetailHero>div{padding:22px}}
`;document.head.appendChild(s)}function installNoModalNavigation(){if(window.__bickriNoModalNavigation)return;window.__bickriNoModalNavigation=1;document.addEventListener('click',e=>{const card=e.target.closest('.service');if(!card)return;const slug=card.dataset.serviceSlug;if(!slug)return;if(e.target.closest('.copyCode,.modalShare,a[href],button:not(.serviceBtn)'))return;e.preventDefault();e.stopImmediatePropagation();go(slug)},true)}function boot(){styles();installNoModalNavigation();load().then(home)}document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot):boot()})();