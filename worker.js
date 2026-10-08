const SITE_VERSION = '2026-09-19-logo-exact-1';
const ASSET_VERSION = '2026-09-19-logo-exact-1';
const SUPABASE_URL = 'https://okdohokhlkxrmxpevees.supabase.co';
const SERVICES = ['Création web','E-commerce','Réseaux sociaux','Intelligence artificielle','Branding & design','Publicité digitale','Formation & coaching'];

const SYSTEM_PROMPT = `Tu es Bickri IA, l'assistant officiel de Bickri Service Agency, agence digitale basée à Niamey, Niger.
TU DOIS RÉPONDRE UNIQUEMENT À PARTIR DU CONTENU PRÉSENT SUR LE SITE.
Le site présente : création de sites web, e-commerce, réseaux sociaux, intelligence artificielle, branding & design, publicité digitale, formation & coaching ; les solutions Lancer, Développer et Automatiser ; le coaching entrepreneurial, réseaux sociaux et IA & digital ; la méthode en 6 étapes Écoute, Stratégie, Conception, Production, Optimisation et Suivi ; les réalisations du portfolio ; ainsi que les informations de contact du site.
Si une question porte sur un sujet qui n'est pas présenté sur le site, ne donne aucune information extérieure, ne devine pas et ne fabrique pas de réponse. Explique poliment que tu peux uniquement renseigner sur le contenu de Bickri Service Agency et invite la personne à poser une question liée au site.
Aucun tarif fixe n'est indiqué sur le site : pour les prix, indique que le devis est personnalisé selon le projet.
CONTACT : oriente vers le bouton WhatsApp du site ou bickriserviceagency@gmail.com. Ne communique pas de numéro de téléphone.
STYLE : français par défaut, ton professionnel, chaleureux, motivant et encourageant. Encourage la personne à avancer dans son projet, sans inventer de résultats, garanties, délais, clients ou promesses.
`;

function json(body,status=200,extra={}){const h=new Headers({'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type',...extra});return new Response(JSON.stringify(body),{status,headers:h})}
function isUuid(v){return typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)}
function getSessionId(req){const c=req.headers.get('Cookie')||'';const m=c.match(/(?:^|;\\s*)bickri_ai_session=([^;]+)/i);return m&&isUuid(m[1])?m[1]:null}
async function supabaseRequest(path,key,opt={}){if(!key)return null;const h=new Headers(opt.headers||{});h.set('apikey',key);h.set('Authorization',`Bearer ${key}`);h.set('Content-Type','application/json');const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...opt,headers:h});if(!r.ok)throw new Error(`Supabase ${r.status}`);return r}
async function ensureConversation(sessionId,key){if(!key||!sessionId)return null;const r=await supabaseRequest('agency_ai_conversations?on_conflict=session_id',key,{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify({session_id:sessionId,updated_at:new Date().toISOString()})});const rows=await r.json().catch(()=>[]);return rows?.[0]?.id||null}
async function loadConversationHistory(id,key){if(!key||!id)return[];const r=await supabaseRequest(`agency_ai_messages?conversation_id=eq.${encodeURIComponent(id)}&select=role,content&order=created_at.desc&limit=8`,key,{method:'GET'});const rows=await r.json().catch(()=>[]);return Array.isArray(rows)?rows.reverse().filter(x=>(x?.role==='user'||x?.role==='assistant')&&typeof x?.content==='string').map(x=>({role:x.role,content:x.content.slice(0,2000)})):[]}
async function saveConversationExchange(id,key,user,assistant){if(!key||!id)return;await supabaseRequest('agency_ai_messages',key,{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify([{conversation_id:id,role:'user',content:user.slice(0,4000)},{conversation_id:id,role:'assistant',content:assistant.slice(0,4000)}])});await supabaseRequest(`agency_ai_conversations?id=eq.${encodeURIComponent(id)}`,key,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({updated_at:new Date().toISOString()})})}
function secureCookie(id){return `bickri_ai_session=${id}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`}
function fallbackAnswer(message){
  const q=message.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'');
  if(/^(bonjour|salut|salam|assalam|hello|bonsoir|coucou)/.test(q)) return 'Bonjour 👋 Je suis Bickri IA. Je peux vous renseigner sur nos services, les sites web, l’e-commerce, les réseaux sociaux, l’IA, le design, la publicité, les formations et le coaching.';
  if(/prix|tarif|cout|combien|devis|budget/.test(q)) return 'Nos tarifs dépendent du projet et de ses fonctionnalités. Bickri Service Agency prépare un devis personnalisé après analyse de votre besoin. Décrivez votre projet et nous vous orienterons.';
  if(/site|web|plateforme|application/.test(q)) return 'Nous créons des sites web professionnels, des plateformes et des expériences responsive. Nous pouvons aussi intégrer des fonctionnalités comme formulaires, espace client, paiements, IA et connexion à Supabase.';
  if(/e.?commerce|boutique|vente en ligne/.test(q)) return 'Nous concevons des boutiques en ligne avec catalogue, présentation des produits, parcours d’achat et fonctionnalités adaptées à votre activité.';
  if(/reseaux sociaux|facebook|instagram|tiktok|whatsapp/.test(q)) return 'Nous accompagnons les marques et créateurs sur la stratégie de contenu, l’optimisation des profils, la création de contenus et le développement de leur présence digitale.';
  if(/intelligence artificielle|\bia\b|automatisation|chatbot/.test(q)) return 'Nous utilisons l’IA pour automatiser certaines tâches, créer des assistants, améliorer la productivité et intégrer des fonctionnalités intelligentes dans les projets digitaux.';
  if(/logo|branding|identite visuelle|design/.test(q)) return 'Nous créons des logos, identités visuelles et supports de communication avec une direction artistique professionnelle et cohérente.';
  if(/publicite|facebook ads|meta ads|campagne/.test(q)) return 'Nous pouvons structurer des campagnes de publicité digitale, définir les messages, cibler l’audience et suivre les performances.';
  if(/formation|apprendre|cours|coaching/.test(q)) return 'Nous proposons des formations et du coaching en entrepreneuriat, marketing digital, réseaux sociaux, IA et outils numériques.';
  if(/contact|joindre|adresse|email|numero|telephone/.test(q)) return 'Vous pouvez nous contacter via le bouton WhatsApp du site ou par e-mail à bickriserviceagency@gmail.com. Nous sommes basés à Niamey, Niger.';
  if(/niger|niamey/.test(q)) return 'Bickri Service Agency est basée à Niamey, au Niger, et peut accompagner des clients sur place ou à distance.';
  return 'Je suis Bickri IA, l’assistant de Bickri Service Agency. Je peux vous aider à choisir un service, préparer une demande de devis ou vous expliquer nos solutions. Quel est votre projet ?';
}

export default {async fetch(request,env,ctx){
  const url=new URL(request.url);
  if(url.pathname==='/api/bickri-ai'){
    if(request.method==='OPTIONS')return json({},204);
    if(request.method!=='POST')return json({error:'Method not allowed'},405);
    const apiKey=env.AI_API_KEY, endpoint=env.AI_API_URL, model=env.AI_MODEL;
    let body;try{body=await request.json()}catch{return json({error:'Invalid JSON body'},400)}
    const message=typeof body?.message==='string'?body.message.trim():'';
    if(!message)return json({error:'Message required'},400);
    if(message.length>2000)return json({error:'Message too long'},400);
    if(!apiKey||!endpoint||!model)return json({answer:fallbackAnswer(message),version:SITE_VERSION,mode:'local'});
    const clientHistory=Array.isArray(body?.history)?body.history.slice(-8).filter(x=>x&&(x.role==='user'||x.role==='assistant')&&typeof x.content==='string').map(x=>({role:x.role,content:x.content.slice(0,2000)})):[];
    let sessionId=getSessionId(request),conversationId=null,storedHistory=[];
    const supabaseKey=env.SUPABASE_SERVICE_ROLE_KEY;
    if(!sessionId&&supabaseKey)sessionId=crypto.randomUUID();
    if(supabaseKey&&sessionId){try{conversationId=await ensureConversation(sessionId,supabaseKey);storedHistory=await loadConversationHistory(conversationId,supabaseKey)}catch(e){console.error('Supabase persistence read failed',e)}}
    const history=storedHistory.length?storedHistory:clientHistory;
    try{
      const upstream=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},body:JSON.stringify({model,temperature:.2,messages:[{role:'system',content:SYSTEM_PROMPT},...history,{role:'user',content:message}]})});
      const data=await upstream.json().catch(()=>({}));
      if(!upstream.ok)return json({answer:fallbackAnswer(message),version:SITE_VERSION,mode:'fallback'});
      const answer=data?.choices?.[0]?.message?.content||data?.output_text||data?.response;
      if(typeof answer!=='string'||!answer.trim())return json({answer:fallbackAnswer(message),version:SITE_VERSION,mode:'fallback'});
      const finalAnswer=answer.trim();
      if(ctx?.waitUntil&&supabaseKey&&conversationId)ctx.waitUntil(saveConversationExchange(conversationId,supabaseKey,message,finalAnswer).catch(e=>console.error('Supabase persistence write failed',e)));
      const headers={};if(sessionId&&!getSessionId(request))headers['Set-Cookie']=secureCookie(sessionId);
      return json({answer:finalAnswer,version:SITE_VERSION,persistence:Boolean(supabaseKey&&conversationId)},200,headers);
    }catch{return json({answer:fallbackAnswer(message),version:SITE_VERSION,mode:'fallback'})}
  }
  if(url.pathname==='/api/site-version')return json({version:SITE_VERSION,assets:ASSET_VERSION,platform:'Cloudflare Workers'});
  // Short service links: /s/<code> serve the service-specific Open Graph page directly.
  if (request.method === 'GET' && /^\/s\/[^/]+\/?$/.test(url.pathname)) {
    try {
      const code = decodeURIComponent(url.pathname.split('/').filter(Boolean)[1] || '').trim().toUpperCase();
      const catalogResponse = await env.ASSETS.fetch(new Request(new URL('/services-share.json', url.origin)));
      const catalog = await catalogResponse.json().catch(() => []);
      const service = Array.isArray(catalog) ? catalog.find(x => String(x?.code || '').trim().toUpperCase() === code) : null;
      if (!service?.slug) return new Response('Service link not found', {status:404,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});

      const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
      const image = String(service.img || '').trim();
      const shortUrl = new URL('/s/' + encodeURIComponent(String(service.code).trim()), url.origin).href;
      const appUrl = new URL('/services/' + encodeURIComponent(service.slug) + '/', url.origin).href;
      const title = (service.name || 'Service') + ' — Bickri Service Agency';
      const description = service.desc || 'Découvrez ce service de Bickri Service Agency à Niamey, Niger.';
      const html = '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
        '<title>' + esc(title) + '</title><meta name="description" content="' + esc(description) + '">' +
        '<link rel="canonical" href="' + esc(shortUrl) + '">' +
        '<meta property="og:type" content="website"><meta property="og:site_name" content="Bickri Service Agency"><meta property="og:locale" content="fr_FR">' +
        '<meta property="og:url" content="' + esc(shortUrl) + '"><meta property="og:title" content="' + esc(title) + '">' +
        '<meta property="og:description" content="' + esc(description) + '">' +
        '<meta property="og:image" content="' + esc(image) + '"><meta property="og:image:secure_url" content="' + esc(image) + '">' +
        '<meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1600"><meta property="og:image:height" content="900">' +
        '<meta property="og:image:alt" content="' + esc(service.name || 'Service Bickri Service Agency') + '">' +
        '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="' + esc(title) + '">' +
        '<meta name="twitter:description" content="' + esc(description) + '"><meta name="twitter:image" content="' + esc(image) + '">' +
        '</head><body style="margin:0;background:#08101f;color:#fff;font-family:Arial,sans-serif"><main style="max-width:900px;margin:auto;padding:24px">' +
        '<img src="' + esc(image) + '" alt="' + esc(service.name || '') + '" style="width:100%;max-height:520px;object-fit:cover;border-radius:20px">' +
        '<p style="color:#d9a441;font-weight:700;letter-spacing:.08em">BICKRI SERVICE AGENCY · NIAMEY · NIGER</p>' +
        '<h1>' + esc(service.name || 'Service') + '</h1><p style="font-size:18px;line-height:1.6">' + esc(description) + '</p>' +
        '<div style="margin:24px 0;padding:18px;border:1px solid #2b3850;border-radius:18px;background:#0d1729;text-align:center">' +
        '<div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#d9a441;margin-bottom:10px">Lien du service</div>' +
        '<div style="display:flex;flex-direction:column;gap:10px;align-items:stretch">' +
        '<a href="' + esc(shortUrl) + '" style="padding:11px 12px;border-radius:10px;background:#fff;color:#111827;font-weight:800;overflow-wrap:anywhere;text-decoration:underline">' + esc(shortUrl) + '</a>' +
        '<button type="button" id="copy-share-url" style="padding:13px;border:1px solid #d9a441;background:#d9a441;color:#08101f;border-radius:10px;font-weight:800;cursor:pointer">Copier le lien</button>' +
        '<a href="https://wa.me/?text=' + encodeURIComponent('Découvrez ' + String(service.name || 'ce service') + ' — ' + shortUrl) + '" target="_blank" rel="noopener" style="padding:13px;border-radius:10px;background:#fff;color:#111827;text-decoration:none;font-weight:800">Partager sur WhatsApp</a>' +
        '<a href="' + esc(appUrl) + '" style="padding:13px;border-radius:10px;background:#d9a441;color:#08101f;text-decoration:none;font-weight:800">Ouvrir le service</a>' +
        '</div></div>' +
        '<script>document.getElementById("copy-share-url")?.addEventListener("click",async function(){try{await navigator.clipboard.writeText(shortUrl);this.textContent="Lien copié ✓";setTimeout(()=>this.textContent="Copier le lien",1600)}catch(e){window.prompt("Copiez ce lien :",shortUrl)}});</script>' +
        '</main></body></html>';
      return new Response(html,{status:200,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0','Vary':'User-Agent'}});
    } catch (e) {
      console.error('Short service Open Graph page failed', e);
      return new Response('Service link error',{status:500,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
    }
  }
  const response=await env.ASSETS.fetch(request);
  const headers=new Headers(response.headers);
  if(response.ok && request.method==='GET' && /^\/services\/[^/]+\/?$/.test(url.pathname)){
    try{
      const slug=url.pathname.split('/').filter(Boolean)[1];
      const catalogResponse=await env.ASSETS.fetch(new Request(new URL('/services-share.json',url.origin)));
      const catalog=await catalogResponse.json().catch(()=>[]);
      const service=Array.isArray(catalog)?catalog.find(x=>x&&x.slug===slug):null;
      if(service && typeof service.img==='string' && service.img){
        const source=await response.text();
        if(source.includes('<head')){
          const safe=(v)=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
          const title=safe((service.name||'Service')+' — Bickri Service Agency');
          const description=safe(service.desc||'Découvrez ce service de Bickri Service Agency à Niamey, Niger.');
          const image=safe(service.img);
          const canonical=safe(new URL('/services/'+slug+'/',url.origin).href);
          const meta=[
            '<meta name="description" content="'+description+'">',
            '<link rel="canonical" href="'+canonical+'">',
            '<meta property="og:type" content="website">',
            '<meta property="og:site_name" content="Bickri Service Agency">',
            '<meta property="og:title" content="'+title+'">',
            '<meta property="og:description" content="'+description+'">',
            '<meta property="og:url" content="'+canonical+'">',
            '<meta property="og:image" content="'+image+'">',
            '<meta property="og:image:width" content="1600">',
            '<meta property="og:image:height" content="900">',
            '<meta property="og:image:alt" content="'+title+'">',
            '<meta name="twitter:card" content="summary_large_image">',
            '<meta name="twitter:title" content="'+title+'">',
            '<meta name="twitter:description" content="'+description+'">',
            '<meta name="twitter:image" content="'+image+'">'
          ].join('');
          const shortLink=safe(new URL('/s/'+encodeURIComponent(String(service.code||'').trim()),url.origin).href);
          const serviceLinkBlock='<div style="margin:32px 18px 0;padding:18px 20px;border:1px solid #e5e7eb;border-radius:18px;background:#fff8e8;text-align:center;font-family:inherit"><div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#8a6a2f;margin-bottom:8px">Lien Open Graph du service</div><div style="display:flex;gap:8px;justify-content:center;align-items:center;flex-wrap:wrap"><a href="'+shortLink+'" style="display:inline-block;max-width:100%;overflow-wrap:anywhere;color:#111827;font-weight:700;text-decoration:underline">'+shortLink+'</a><button type="button" onclick="navigator.clipboard&&navigator.clipboard.writeText('+JSON.stringify(shortLink)+').then(()=>{this.textContent=\'Lien copié ✓\'})" style="border:1px solid #e3e8f0;background:#fff;border-radius:9px;padding:8px 11px;font-weight:800;cursor:pointer">Copier le lien</button></div><a href="https://wa.me/?text='+encodeURIComponent('Découvrez '+String(service.name||'ce service')+' — '+shortLink)+'" target="_blank" rel="noopener" style="display:inline-block;margin-top:10px;color:#8a6416;font-weight:800;text-decoration:none">Partager sur WhatsApp</a></div>';
          const replaced=source.replace(/<title>[\s\S]*?<\/title>/i,'<title>'+title+'</title>').replace(/<head>/i,'<head>'+meta).replace(/<\/body>/i,serviceLinkBlock+'</body>');
          headers.set('Content-Type','text/html; charset=utf-8');
          headers.set('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
          return new Response(replaced,{status:response.status,statusText:response.statusText,headers});
        }
      }
    }catch(e){console.error('Service OG metadata failed',e)}
  }
  if(url.pathname==='/'||url.pathname==='/index.html'){
    headers.set('Content-Type','text/html; charset=utf-8');
    headers.set('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    headers.set('Pragma','no-cache');headers.set('Expires','0');
  }
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}};