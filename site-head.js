(()=>{
const css=`
.bsa-head-nav{position:sticky;top:0;z-index:95;background:rgba(255,255,255,.97);backdrop-filter:blur(18px);border-bottom:1px solid #e8ecf2}
.bsa-head-nav .navin{min-height:88px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:18px}
.bsa-head-nav .brand{justify-self:start;display:flex;align-items:center;gap:12px}
.bsa-head-nav .mark{width:62px!important;height:62px!important;border:0!important;border-radius:0!important;background-color:transparent!important;box-shadow:none!important;flex:0 0 62px}
.bsa-head-nav .brandText{display:flex;flex-direction:column;line-height:1}
.bsa-head-nav .brandText b{font:800 25px/1 Manrope,sans-serif;color:#0b1b35;letter-spacing:.02em}
.bsa-head-nav .brandText small{display:block!important;margin-top:7px;font:800 9px/1 'DM Sans',sans-serif;letter-spacing:.24em;color:#667289}
.bsa-head-nav .primary{justify-self:center;min-height:50px;padding:0 28px;border-radius:16px;font-size:16px;box-shadow:0 8px 24px rgba(217,164,65,.22)}
.bsa-menu{justify-self:end;width:50px;height:50px;border:0;background:transparent;display:grid;place-items:center;cursor:pointer;padding:8px}
.bsa-menu span,.bsa-menu span:before,.bsa-menu span:after{display:block;width:30px;height:3px;background:#0b1b35;border-radius:3px;content:'';position:relative;transition:.2s}
.bsa-menu span:before{position:absolute;top:-9px}.bsa-menu span:after{position:absolute;top:9px}
.bsa-menu.open span{background:transparent}.bsa-menu.open span:before{top:0;transform:rotate(45deg)}.bsa-menu.open span:after{top:0;transform:rotate(-45deg)}
.bsa-mobile-menu{display:none;position:absolute;top:88px;left:0;right:0;background:#fff;border-bottom:1px solid #e8ecf2;padding:12px 18px;box-shadow:0 15px 35px rgba(8,16,31,.08)}
.bsa-mobile-menu.open{display:grid;gap:4px}.bsa-mobile-menu a{padding:14px 8px;font-weight:800;color:#17233a;border-bottom:1px solid #eef1f5}.bsa-mobile-menu a:last-child{border-bottom:0}
.heroMedia{padding:0!important;border-radius:0!important;box-shadow:none!important;background:#f4c900!important;overflow:hidden!important}
.heroImg{border-radius:0!important;box-shadow:none!important;display:block!important;width:100%!important;object-fit:cover!important;object-position:center center!important}
@media(max-width:620px){.bsa-head-nav .navin{min-height:82px;grid-template-columns:1fr auto auto;gap:8px}.bsa-head-nav .mark{width:54px!important;height:54px!important;flex-basis:54px}.bsa-head-nav .brandText b{font-size:20px}.bsa-head-nav .brandText small{font-size:7px;letter-spacing:.19em;margin-top:6px}.bsa-head-nav .primary{min-height:46px;padding:0 18px;font-size:15px;border-radius:15px}.bsa-menu{width:46px;height:46px}.bsa-mobile-menu{top:82px}.hero{padding-top:16px!important}.hero p{font-size:19px!important;line-height:1.48!important}.actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:12px!important}.actions .btn{min-height:56px!important;border-radius:17px!important;font-size:15px!important}.heroImg{height:430px!important}.floatCard{left:22px!important;right:22px!important;min-width:0!important;bottom:24px!important;padding:18px 20px!important;border-radius:22px!important}.floatCard strong{font-size:28px!important}.floatCard span{font-size:14px!important}}
`;
function mount(){
 const nav=document.querySelector('.nav'); if(!nav||nav.dataset.bsaHead==='1')return;
 nav.classList.add('bsa-head-nav');nav.dataset.bsaHead='1';
 const links=[...document.querySelectorAll('.links a')].map(a=>({href:a.getAttribute('href'),text:a.textContent.trim()}));
 const menu=document.createElement('button');menu.className='bsa-menu';menu.type='button';menu.setAttribute('aria-label','Ouvrir le menu');menu.innerHTML='<span></span>';
 const mobile=document.createElement('div');mobile.className='bsa-mobile-menu';mobile.innerHTML=links.map(x=>`<a href="${x.href}">${x.text}</a>`).join('');
 nav.appendChild(mobile);nav.querySelector('.navin').appendChild(menu);
 menu.addEventListener('click',()=>{menu.classList.toggle('open');mobile.classList.toggle('open');menu.setAttribute('aria-expanded',mobile.classList.contains('open')?'true':'false')});
 mobile.addEventListener('click',e=>{if(e.target.matches('a')){menu.classList.remove('open');mobile.classList.remove('open')}});
 const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
