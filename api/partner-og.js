const SITE='https://bickriservice-agency.org';
const SUPABASE_URL='https://okdohokhlkxrmxpevees.supabase.co';
const SUPABASE_KEY='sb_publishable_EiTruyR5fwwHpS_PzO5_iA_d1i4iMCP';
const DEFAULT_IMAGE=SITE+'/assets/bickri-logo-final.jpg?v=20261023';
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function imageUrl(v){try{const u=new URL(v||DEFAULT_IMAGE,SITE);return ['https:','http:'].includes(u.protocol)?u.href:DEFAULT_IMAGE;}catch(_){return DEFAULT_IMAGE;}}
function html(title,description,image,url,type){
 const t=esc(title),d=esc(description),im=esc(imageUrl(image)),u=esc(url);
 return '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+t+'</title><meta name="description" content="'+d+'"><link rel="canonical" href="'+u+'"><meta property="og:type" content="'+esc(type||'profile')+'"><meta property="og:site_name" content="Bickri Service Agency"><meta property="og:locale" content="fr_FR"><meta property="og:title" content="'+t+'"><meta property="og:description" content="'+d+'"><meta property="og:url" content="'+u+'"><meta property="og:image" content="'+im+'"><meta property="og:image:secure_url" content="'+im+'"><meta property="og:image:alt" content="'+t+'"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="'+t+'"><meta name="twitter:description" content="'+d+'"><meta name="twitter:image" content="'+im+'"></head><body><main><img src="'+im+'" alt="'+t+'" style="max-width:240px;height:auto"><h1>'+t+'</h1><p>'+d+'</p><p><a href="'+u+'">Consulter ce profil partenaire</a></p></main></body></html>';
}
module.exports=async function(req,res){
 res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=600');
 const path=String((req.url||'').split('?')[0]);const slug=String((req.query&&req.query.slug)||(path.indexOf('/partenaires/sas-entreprise')===0?'sas-entreprise':'')).trim().toLowerCase();
 if(!slug||!/^[a-z0-9-]{1,100}$/.test(slug)){res.statusCode=400;return res.end(html('Nos partenaires — Bickri Service Agency','Découvrez les partenaires de Bickri Service Agency.',DEFAULT_IMAGE,SITE+'/partenaires/','website'));}
 const curated={
 'ayish-prestige':{name:'Ayish Prestige',description:'Mode féminine, hijabs et parfums. Une marque dédiée à l’élégance et à la beauté au féminin.',logo_url:'https://cdn.smoothbundle.com/abdourahamane-mohamed/ayish-prestige-logo/logos/ayish-prestige-original.png',category:'Mode féminine & beauté'},
 'sahelia-fresh':{name:'Sahelia Fresh',description:'Yaourts et jus naturels, formations pratiques et informations sur les possibilités de livraison.',logo_url:'https://d2ol7oe51mr4n9.cloudfront.net/user_3Bt4xGygQGBZTOweEVrhbZ4s65k/053dc7b0-1a6c-4685-84a3-08595451a656.png',category:'Produits naturels'},
 'egan-btp':{name:'EGAN BTP',description:'Construction, rénovation, plans, hydraulique, eau et assainissement.',logo_url:SITE+'/assets/partners/egan-btp.svg',category:'BTP & construction'},
 'impact-afriq':{name:'Impact Afriq',description:'Innovation, inspiration et transformation de l’Afrique par les idées, les talents, la technologie et les collaborations.',logo_url:SITE+'/assets/partners/impact-afriq.svg',category:'Collaboration'},
 'tourisme-au-niger':{name:'Tourisme au Niger',description:'Collectif dédié à la promotion du tourisme, de la culture et des merveilles du Niger.',logo_url:SITE+'/assets/partners/tourisme-au-niger.jpg',category:'Tourisme & influence'},
 'sas-entreprise':{name:'SAS ENTREPRISE',description:'Construction et valorisation du patrimoine, avec la qualité d’exécution et la confiance au cœur de chaque projet.',logo_url:'https://d2ol7oe51mr4n9.cloudfront.net/user_3Bt4xGygQGBZTOweEVrhbZ4s65k/4df94d4f-a33a-42a9-979b-5a88f4ea4972.png',category:'Construction & patrimoine'}
 };
 let partner=curated[slug]||null;
 try{const endpoint=SUPABASE_URL+'/rest/v1/agency_partners?slug=eq.'+encodeURIComponent(slug)+'&select=name,slug,description,company_about,logo_url,founder,mission,country,city,partner_type,category,website_url,badge_level&limit=1';const response=await fetch(endpoint,{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY,Accept:'application/json'}});if(response.ok){const rows=await response.json();if(Array.isArray(rows)&&rows[0])partner=Object.assign({},partner||{},rows[0]);}}catch(_){}
 if(!partner){res.statusCode=404;return res.end(html('Profil partenaire — Bickri Service Agency','Découvrez les partenaires de Bickri Service Agency.',DEFAULT_IMAGE,SITE+'/partenaires/','website'));}
 const title=String(partner.name||'Partenaire').trim();
 const description=String(partner.company_about||partner.description||partner.mission||partner.category||'Découvrez ce partenaire de Bickri Service Agency.').replace(/\s+/g,' ').slice(0,260);
 return res.end(html(title,description,partner.logo_url||partner.logoUrl,SITE+'/partenaires/profil/?slug='+encodeURIComponent(slug),'profile'));
};