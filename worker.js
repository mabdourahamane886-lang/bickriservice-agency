import { sendPartnerApplication } from './lib/bickri-mail.js';
const SITE_VERSION = '2.0.0';
const ASSET_VERSION = '2.0.0';
const SUPABASE_URL = 'https://okdohokhlkxrmxpevees.supabase.co';
const SERVICES = ['Création web','E-commerce','Réseaux sociaux','Intelligence artificielle','Branding & design','Publicité digitale','Formation & coaching'];

const AI_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const AI_RATE_LIMIT_MAX = 10;
const aiRateBuckets = globalThis.__bickriWorkerAiRateBuckets || new Map();
globalThis.__bickriWorkerAiRateBuckets = aiRateBuckets;

const turnstileRateBuckets = globalThis.__bickriWorkerTurnstileRateBuckets || new Map();
globalThis.__bickriWorkerTurnstileRateBuckets = turnstileRateBuckets;

function checkTurnstileRateLimit(request) {
  const ip = request.headers.get('CF-Connecting-IP') ||
    String(request.headers.get('X-Forwarded-For') || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const current = turnstileRateBuckets.get(ip);
  if (!current || now - current.startedAt >= AI_RATE_LIMIT_WINDOW_MS) {
    turnstileRateBuckets.set(ip, {startedAt: now, count: 1});
    return {allowed: true, retryAfter: 60};
  }
  current.count += 1;
  if (turnstileRateBuckets.size > 5000) {
    for (const [key, value] of turnstileRateBuckets) {
      if (now - value.startedAt >= AI_RATE_LIMIT_WINDOW_MS) turnstileRateBuckets.delete(key);
    }
  }
  return {allowed: current.count <= 20, retryAfter: Math.max(1, Math.ceil((AI_RATE_LIMIT_WINDOW_MS - (now - current.startedAt)) / 1000))};
}


function isAllowedOrigin(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    const host = parsed.hostname.toLowerCase();
    return parsed.protocol === 'https:' && (
      host === 'bickriservice-agency.org' ||
      host.endsWith('.bickriservice-agency.org') ||
      host === 'bickriservice-agency.vercel.app' ||
      host.endsWith('-bickri-service-agency.vercel.app') ||
      host === 'bickriservice-agency.bickriserviceagency.dev'
    );
  } catch {
    return false;
  }
}

function partnerJson(request, body, status=200, extra={}) {
  const headers=new Headers({...SECURITY_HEADERS,'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...extra});
  const origin=request.headers.get('Origin');
  if (origin && isAllowedOrigin(request)) {
    headers.set('Access-Control-Allow-Origin',origin);
    headers.set('Access-Control-Allow-Methods','GET, POST, PATCH, OPTIONS');
    headers.set('Access-Control-Allow-Headers','Authorization, Content-Type, Accept');
    headers.set('Access-Control-Max-Age','86400');
    headers.set('Vary','Origin');
  }
  return new Response(status===204||status===304?null:JSON.stringify(body),{status,headers});
}


function checkAiRateLimit(request) {
  const ip = request.headers.get('CF-Connecting-IP') ||
    String(request.headers.get('X-Forwarded-For') || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const current = aiRateBuckets.get(ip);
  if (!current || now - current.startedAt >= AI_RATE_LIMIT_WINDOW_MS) {
    aiRateBuckets.set(ip, {startedAt: now, count: 1});
    return {allowed: true, retryAfter: 60};
  }
  current.count += 1;
  if (aiRateBuckets.size > 5000) {
    for (const [key, value] of aiRateBuckets) {
      if (now - value.startedAt >= AI_RATE_LIMIT_WINDOW_MS) aiRateBuckets.delete(key);
    }
  }
  return {
    allowed: current.count <= AI_RATE_LIMIT_MAX,
    retryAfter: Math.max(1, Math.ceil((AI_RATE_LIMIT_WINDOW_MS - (now - current.startedAt)) / 1000))
  };
}

async function verifyWorkerTurnstile(request, token, env, expectedAction) {
  const secret = env.TURNSTILE_SECRET_KEY;
  if (!secret) return {ok: false, configured: false};
  if (typeof token !== 'string' || !token || token.length > 2048) return {ok: false, configured: true};
  try {
    const body = new URLSearchParams({secret, response: token});
    const ip = request.headers.get('CF-Connecting-IP');
    if (ip) body.set('remoteip', ip);
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body
    });
    const data = await response.json().catch(() => ({success: false}));
    const allowedHosts = String(env.TURNSTILE_HOSTNAMES || 'bickriservice-agency.org,bickriservice-agency.vercel.app,bickriservice-agency.bickriserviceagency.dev')
      .split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
    return {
      ok: Boolean(response.ok && data.success && typeof data.hostname === 'string' && allowedHosts.includes(data.hostname.toLowerCase()) && (!expectedAction || data.action === expectedAction)),
      configured: true
    };
  } catch (error) {
    console.error('Bickri AI Turnstile verification failed', error?.message || error);
    return {ok: false, configured: true};
  }
}


const SYSTEM_PROMPT = `Tu es Bickri IA, l'assistant officiel de Bickri Service Agency, agence digitale basée à Niamey, Niger.
TU DOIS RÉPONDRE UNIQUEMENT À PARTIR DU CONTENU PRÉSENT SUR LE SITE.
Le site présente : création de sites web, e-commerce, réseaux sociaux, intelligence artificielle, branding & design, publicité digitale, formation & coaching ; les solutions Lancer, Développer et Automatiser ; le coaching entrepreneurial, réseaux sociaux et IA & digital ; la méthode en 6 étapes Écoute, Stratégie, Conception, Production, Optimisation et Suivi ; les réalisations du portfolio ; ainsi que les informations de contact du site.
Si une question porte sur un sujet qui n'est pas présenté sur le site, ne donne aucune information extérieure, ne devine pas et ne fabrique pas de réponse. Explique poliment que tu peux uniquement renseigner sur le contenu de Bickri Service Agency et invite la personne à poser une question liée au site.
Aucun tarif fixe n'est indiqué sur le site : pour les prix, indique que le devis est personnalisé selon le projet.
CONTACT : oriente vers le bouton WhatsApp du site ou bickriserviceagency@gmail.com. Ne communique pas de numéro de téléphone.
STYLE : français par défaut, ton professionnel, chaleureux, motivant et encourageant. Encourage la personne à avancer dans son projet, sans inventer de résultats, garanties, délais, clients ou promesses.
`;

const SECURITY_HEADERS = {
  'X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'strict-origin-when-cross-origin',
  'X-Frame-Options':'SAMEORIGIN',
  'Strict-Transport-Security':'max-age=31536000; includeSubDomains',
  'X-DNS-Prefetch-Control':'off',
  'X-Permitted-Cross-Domain-Policies':'none',
  'Permissions-Policy':'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy':"default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' https: data: blob:; connect-src 'self' https://challenges.cloudflare.com; frame-src 'self' https://challenges.cloudflare.com; media-src 'self' https: blob:; worker-src 'self' blob:; upgrade-insecure-requests",
  'Cross-Origin-Opener-Policy':'same-origin-allow-popups',
  'Cross-Origin-Resource-Policy':'same-origin'
};
function json(body,status=200,extra={}){const h=new Headers({...SECURITY_HEADERS,'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...extra});return new Response(JSON.stringify(body),{status,headers:h})}
function isUuid(v){return typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)}
function getSessionId(req){const c=req.headers.get('Cookie')||'';const m=c.match(/(?:^|;\s*)bickri_ai_session=([^;]+)/i);return m&&isUuid(m[1])?m[1]:null}
async function supabaseRequest(path,key,opt={}){if(!key)return null;const h=new Headers(opt.headers||{});h.set('apikey',key);h.set('Authorization',`Bearer ${key}`);h.set('Content-Type','application/json');const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...opt,headers:h});if(!r.ok)throw new Error(`Supabase ${r.status}`);return r}
async function ensureConversation(sessionId,key){if(!key||!sessionId)return null;const r=await supabaseRequest('agency_ai_conversations?on_conflict=session_id',key,{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify({session_id:sessionId,updated_at:new Date().toISOString()})});const rows=await r.json().catch(()=>[]);return rows?.[0]?.id||null}
async function loadConversationHistory(id,key){if(!key||!id)return[];const r=await supabaseRequest(`agency_ai_messages?conversation_id=eq.${encodeURIComponent(id)}&select=role,content&order=created_at.desc&limit=8`,key,{method:'GET'});const rows=await r.json().catch(()=>[]);return Array.isArray(rows)?rows.reverse().filter(x=>(x?.role==='user'||x?.role==='assistant')&&typeof x?.content==='string').map(x=>({role:x.role,content:x.content.slice(0,2000)})):[]}
async function saveConversationExchange(id,key,user,assistant){if(!key||!id)return;await supabaseRequest('agency_ai_messages',key,{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify([{conversation_id:id,role:'user',content:user.slice(0,4000)},{conversation_id:id,role:'assistant',content:assistant.slice(0,4000)}])});await supabaseRequest(`agency_ai_conversations?id=eq.${encodeURIComponent(id)}`,key,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({updated_at:new Date().toISOString()})})}
function secureCookie(id){return `bickri_ai_session=${id}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`}

const partnerSubmissionBuckets = globalThis.__bsaPartnerSubmissionBuckets || new Map();
globalThis.__bsaPartnerSubmissionBuckets = partnerSubmissionBuckets;
const partnerClickBuckets = globalThis.__bsaPartnerClickBuckets || new Map();
globalThis.__bsaPartnerClickBuckets = partnerClickBuckets;

function checkPartnerLimit(request, buckets, max, windowMs) {
  const ip = request.headers.get('CF-Connecting-IP') ||
    String(request.headers.get('X-Forwarded-For') || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const current = buckets.get(ip);
  if (!current || now - current.startedAt >= windowMs) {
    buckets.set(ip, {startedAt: now, count: 1});
    return {allowed: true, retryAfter: Math.ceil(windowMs / 1000)};
  }
  current.count += 1;
  if (buckets.size > 5000) {
    for (const [key, value] of buckets) {
      if (now - value.startedAt >= windowMs) buckets.delete(key);
    }
  }
  return {
    allowed: current.count <= max,
    retryAfter: Math.max(1, Math.ceil((windowMs - (now - current.startedAt)) / 1000))
  };
}

function partnerSlug(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 65) || 'partenaire';
}

function safePartnerLinks(value) {
  let input = value;
  if (typeof input === 'string') {
    try { input = JSON.parse(input || '{}'); } catch { input = {}; }
  }
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const result = {};
  for (const key of ['website','facebook','instagram','linkedin','whatsapp','tiktok','x','telegram']) {
    const raw = input[key];
    if (typeof raw !== 'string' || !raw.trim()) continue;
    try {
      const u = new URL(raw.trim());
      if (u.protocol === 'https:' && !u.username && !u.password) result[key] = u.href.slice(0, 500);
    } catch {}
  }
  return result;
}

function safePartnerUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const u = new URL(value.trim());
    return (u.protocol === 'https:' || u.protocol === 'http:') && !u.username && !u.password ? u.href.slice(0, 500) : '';
  } catch { return ''; }
}

async function partnerAuthUser(request, env) {
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  const authorization = request.headers.get('Authorization') || '';
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!key) return {error: partnerJson(request,{error:'Le service de compte partenaire n’est pas configuré.',code:'PARTNER_AUTH_UNCONFIGURED'},503)};
  if (!token || token.length > 8192) return {error: partnerJson(request,{error:'Connectez-vous pour accéder à cet espace.',code:'AUTH_REQUIRED'},401)};
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {apikey:key, Authorization:`Bearer ${token}`}
    });
    const user = await r.json().catch(() => ({}));
    if (!r.ok || !user?.id || !user?.email) return {error: partnerJson(request,{error:'Votre session a expiré. Reconnectez-vous.',code:'AUTH_INVALID'},401)};
    return {user,key};
  } catch {
    return {error: partnerJson(request,{error:'Le service d’authentification est momentanément indisponible.',code:'AUTH_UNAVAILABLE'},503)};
  }
}

async function partnerIsAdmin(userId, key) {
  const path = `profiles?id=eq.${encodeURIComponent(userId)}&select=role&limit=1`;
  try {
    const r = await supabaseRequest(path,key,{method:'GET'});
    const rows = await r.json().catch(() => []);
    if (Array.isArray(rows) && rows.some(row => row.role === 'admin')) return true;
  } catch {}
  for (const table of ['bickri_admin_users']) {
    try {
      const r = await supabaseRequest(`${table}?user_id=eq.${encodeURIComponent(userId)}&select=user_id&limit=1`,key,{method:'GET'});
      const rows = await r.json().catch(() => []);
      if (Array.isArray(rows) && rows.length) return true;
    } catch {}
  }
  return false;
}

async function partnerCount(resource, key) {
  try {
    const separator=String(resource).includes('?')?'&':'?';
    const r = await supabaseRequest(`${resource}${separator}select=id`,key,{
      method:'GET',
      headers:{Prefer:'count=exact',Range:'0-0'}
    });
    const range = r.headers.get('Content-Range') || '';
    const total = Number(range.split('/').pop());
    return Number.isFinite(total) ? total : 0;
  } catch { return 0; }
}

async function recordPartnerAdminEvent(key, adminUserId, action, applicationId=null, partnerId=null, details={}) {
  const response=await supabaseRequest('agency_partner_admin_events',key,{
    method:'POST',headers:{Prefer:'return=minimal'},
    body:JSON.stringify({
      admin_user_id:adminUserId,action,
      application_id:applicationId||null,partner_id:partnerId||null,
      details:details&&typeof details==='object'&&!Array.isArray(details)?details:{}
    })
  });
  return Boolean(response);
}

function publicPartner(row) {
  return {
    id:row.id, name:row.name, slug:row.slug, description:row.description || '',
    logoUrl:row.logo_url || '', founder:row.founder || '', mission:row.mission || '',
    country:row.country || 'Niger', city:row.city || '', partnerType:row.partner_type || '',
    category:row.category || row.partner_type || '', websiteUrl:row.website_url || '',
    socialLinks:safePartnerLinks(row.social_links || {}),
    badgeLevel:row.badge_level || 'green', badgeLabel:row.badge_label || 'Partenaire vérifié',
    badgeVerified:Boolean(row.badge_verified), verifiedAt:row.verified_at || null,
    publicId:row.public_id || '', referralCode:row.referral_code || ''
  };
}
function fallbackAnswer(message){
  const q=message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
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
  if (url.pathname.startsWith('/api/partner') && request.headers.get('Origin') && !isAllowedOrigin(request)) {
    return json({error:'Origine non autorisée'},403);
  }
  if (url.pathname.startsWith('/api/partner') && request.method === 'OPTIONS') {
    if (!isAllowedOrigin(request)) return json({error:'Origine non autorisée'},403);
    return partnerJson(request,{},204);
  }
  // Candidatures partenaires : envoi natif avec Cloudflare Email Service, sans Resend ni Google.
  
  if (url.pathname === '/api/partners' && request.method === 'GET') {
    const key = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) return partnerJson(request,{error:'Le répertoire des partenaires est momentanément indisponible.'},503);
    try {
      const params = new URLSearchParams({
        active:'eq.true',
        select:'id,name,slug,description,logo_url,founder,mission,country,city,partner_type,category,website_url,social_links,badge_level,badge_label,badge_verified,verified_at,public_id,referral_code',
        order:'name.asc',
        limit:'300'
      });
      const slug = (url.searchParams.get('slug') || '').trim();
      if (slug) params.set('slug',`eq.${slug.slice(0,90)}`);
      const r = await supabaseRequest(`agency_partners?${params.toString()}`,key,{method:'GET'});
      const rows = await r.json().catch(() => []);
      const partners = Array.isArray(rows) ? rows.map(publicPartner) : [];
      if (slug) return partners.length ? json({partner:partners[0]}) : json({error:'Partenaire introuvable.'},404);
      return partnerJson(request,{partners, total:partners.length, verified:partners.filter(p=>p.badgeVerified).length, version:SITE_VERSION});
    } catch (error) {
      console.error('Partner directory read failed:',error?.message||'unknown error');
      return partnerJson(request,{error:'Impossible de charger le répertoire pour le moment.'},503);
    }
  }

  if (url.pathname === '/api/partners/metrics' && request.method === 'GET') {
    const key = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) return partnerJson(request,{error:'Statistiques temporairement indisponibles.'},503);
    try {
      const r = await supabaseRequest('agency_partners?active=eq.true&select=id,badge_verified',key,{method:'GET'});
      const rows = await r.json().catch(() => []);
      const partners = Array.isArray(rows) ? rows : [];
      const clicks = await partnerCount('agency_partner_clicks',key);
      return partnerJson(request,{
        partners:partners.length,
        verified:partners.filter(p=>p.badge_verified===true).length,
        trackedEvents:clicks,
        levels:3
      });
    } catch (error) {
      console.error('Partner metrics read failed:',error?.message||'unknown error');
      return partnerJson(request,{error:'Statistiques temporairement indisponibles.'},503);
    }
  }

  if (url.pathname === '/api/partner/click') {
    if (!isAllowedOrigin(request)) return partnerJson(request,{error:'Origine non autorisée'},403);
    if (request.method !== 'POST') return partnerJson(request,{error:'Méthode non autorisée'},405,{'Allow':'POST'});
    const rate = checkPartnerLimit(request,partnerClickBuckets,60,60*1000);
    if (!rate.allowed) return partnerJson(request,{error:'Trop de clics. Réessayez dans un instant.'},429,{'Retry-After':String(rate.retryAfter)});
    let body;
    try { body = await request.json(); } catch { return partnerJson(request,{error:'Requête JSON invalide.'},400); }
    const allowedEvents = new Set(['profile_view','share_click','website_click','contact_click']);
    const eventType = allowedEvents.has(body?.eventType) ? body.eventType : 'profile_view';
    const slug = typeof body?.slug === 'string' ? body.slug.trim().slice(0,90) : '';
    const inputReferral = typeof body?.referralCode === 'string' ? body.referralCode.trim().slice(0,80) : '';
    const key = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) return partnerJson(request,{ok:false,tracking:false},200);
    try {
      let partner = null;
      if (slug) {
        const found = await supabaseRequest(`agency_partners?slug=eq.${encodeURIComponent(slug)}&active=eq.true&select=id,referral_code&limit=1`,key,{method:'GET'});
        const rows = await found.json().catch(()=>[]);
        if (Array.isArray(rows)) partner = rows[0] || null;
      }
      let attributedPartnerId = partner?.id || null;
      let referralCode = '';
      if (inputReferral) {
        const ref = await supabaseRequest(`agency_partners?referral_code=eq.${encodeURIComponent(inputReferral)}&active=eq.true&select=id,referral_code&limit=1`,key,{method:'GET'});
        const refs = await ref.json().catch(()=>[]);
        if (Array.isArray(refs) && refs.length) {
          referralCode = refs[0].referral_code;
          attributedPartnerId = refs[0].id;
        }
      }
      const landingPath = typeof body?.landingPath === 'string' && body.landingPath.startsWith('/') ? body.landingPath.slice(0,300) : '/partenaires/';
      const source = typeof body?.source === 'string' ? body.source.replace(/[^a-zA-Z0-9_-]/g,'').slice(0,50) : '';
      const medium = typeof body?.medium === 'string' ? body.medium.replace(/[^a-zA-Z0-9_-]/g,'').slice(0,50) : '';
      const campaign = typeof body?.campaign === 'string' ? body.campaign.replace(/[^a-zA-Z0-9_-]/g,'').slice(0,80) : '';
      await supabaseRequest('agency_partner_clicks',key,{
        method:'POST',
        headers:{Prefer:'return=minimal'},
        body:JSON.stringify({partner_id:attributedPartnerId,referral_code:referralCode || null,event_type:eventType,source:source || null,medium:medium || null,campaign:campaign || null,landing_path:landingPath})
      });
      return partnerJson(request,{ok:true,tracking:true},202);
    } catch (error) {
      console.error('Partner click tracking failed:',error?.message||'unknown error');
      return partnerJson(request,{ok:false,tracking:false},200);
    }
  }

  if (url.pathname === '/api/partner/status' && request.method === 'GET') {
    const code = (url.searchParams.get('code') || '').trim().toUpperCase();
    const email = (url.searchParams.get('email') || '').trim().toLowerCase();
    if (!/^BPA-[A-F0-9]{10}$/.test(code) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return partnerJson(request,{error:'Saisissez un code de dossier et une adresse e-mail valides.'},400);
    }
    const key = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) return partnerJson(request,{error:'Le suivi des candidatures est momentanément indisponible.'},503);
    try {
      const path = `agency_partner_applications?application_code=eq.${encodeURIComponent(code)}&email=eq.${encodeURIComponent(email)}&select=application_code,company_name,status,created_at,reviewed_at&limit=1`;
      const r = await supabaseRequest(path,key,{method:'GET'});
      const rows = await r.json().catch(()=>[]);
      if (!Array.isArray(rows) || !rows.length) return partnerJson(request,{error:'Aucun dossier trouvé avec ces informations.'},404);
      const a=rows[0];
      const labels={pending:'En attente',under_review:'En cours d’examen',approved:'Approuvée',rejected:'Refusée'};
      return partnerJson(request,{application:{code:a.application_code,companyName:a.company_name,status:a.status,statusLabel:labels[a.status]||a.status,submittedAt:a.created_at,reviewedAt:a.reviewed_at}});
    } catch (error) {
      console.error('Partner application status lookup failed:',error?.message||'unknown error');
      return partnerJson(request,{error:'Impossible de vérifier votre dossier pour le moment.'},503);
    }
  }

  if (url.pathname === '/api/partner/me') {
    if (!['GET','PATCH'].includes(request.method)) return partnerJson(request,{error:'Méthode non autorisée'},405,{'Allow':'GET, PATCH'});
    const auth = await partnerAuthUser(request,env);
    if (auth.error) return auth.error;
    const {user,key} = auth;
    if (request.method === 'GET') {
      if (!user.email_confirmed_at) return partnerJson(request,{error:'Confirmez votre adresse e-mail avant d’accéder à vos candidatures.',code:'EMAIL_NOT_CONFIRMED'},403);
      try {
        const safeEmail = encodeURIComponent(String(user.email).toLowerCase());
        const appsR = await supabaseRequest(`agency_partner_applications?email=eq.${safeEmail}&select=id,application_code,company_name,partner_type,country,city,status,email_status,created_at,reviewed_at&order=created_at.desc&limit=50`,key,{method:'GET'});
        const applications = await appsR.json().catch(()=>[]);
        const safeApps = Array.isArray(applications)?applications.map(a=>({
          id:a.id,code:a.application_code,companyName:a.company_name,partnerType:a.partner_type,
          country:a.country,city:a.city,status:a.status,emailStatus:a.email_status,
          submittedAt:a.created_at,reviewedAt:a.reviewed_at
        })):[];
        const partnerR = await supabaseRequest(`agency_partners?owner_user_id=eq.${encodeURIComponent(user.id)}&select=id,name,slug,description,mission,country,city,logo_url,category,partner_type,website_url,social_links,badge_level,badge_label,badge_verified,verified_at,public_id,referral_code&active=eq.true&limit=1`,key,{method:'GET'});
        let partners = await partnerR.json().catch(()=>[]);
        if (!Array.isArray(partners)) partners=[];
        if (!partners.length && user.email_confirmed_at) {
          const approved = safeApps.find(a=>a.status==='approved');
          if (approved) {
            const appR = await supabaseRequest(`agency_partner_applications?id=eq.${encodeURIComponent(approved.id)}&select=id,owner_user_id&limit=1`,key,{method:'GET'});
            const appRows = await appR.json().catch(()=>[]);
            const app = Array.isArray(appRows)?appRows[0]:null;
            const profileR = await supabaseRequest(`agency_partners?application_id=eq.${encodeURIComponent(approved.id)}&select=id,owner_user_id&active=eq.true&limit=1`,key,{method:'GET'});
            const profileRows = await profileR.json().catch(()=>[]);
            const profile = Array.isArray(profileRows)?profileRows[0]:null;
            if (profile && !profile.owner_user_id) {
              await supabaseRequest(`agency_partners?id=eq.${encodeURIComponent(profile.id)}&owner_user_id=is.null`,key,{
                method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({owner_user_id:user.id,updated_at:new Date().toISOString()})
              });
              const refresh = await supabaseRequest(`agency_partners?owner_user_id=eq.${encodeURIComponent(user.id)}&select=id,name,slug,description,mission,country,city,logo_url,category,partner_type,website_url,social_links,badge_level,badge_label,badge_verified,verified_at,public_id,referral_code&active=eq.true&limit=1`,key,{method:'GET'});
              partners=await refresh.json().catch(()=>[]);
            }
          }
        }
        const partner = Array.isArray(partners) && partners[0] ? publicPartner(partners[0]) : null;
        let clickStats={total:0,last7Days:0};
        if (partner?.id) {
          clickStats.total=await partnerCount(`agency_partner_clicks?partner_id=eq.${encodeURIComponent(partner.id)}`,key);
          clickStats.last7Days=await partnerCount(`agency_partner_clicks?partner_id=eq.${encodeURIComponent(partner.id)}&created_at=gte.${encodeURIComponent(new Date(Date.now()-7*86400000).toISOString())}`,key);
        }
        return partnerJson(request,{user:{id:user.id,email:user.email,emailConfirmed:Boolean(user.email_confirmed_at)},applications:safeApps,partner,clickStats});
      } catch (error) {
        console.error('Partner dashboard read failed:',error?.message||'unknown error');
        return partnerJson(request,{error:'Impossible de charger votre espace partenaire.'},503);
      }
    }
    let body;
    try { body=await request.json(); } catch { return partnerJson(request,{error:'Requête JSON invalide.'},400); }
    try {
      const partnerR = await supabaseRequest(`agency_partners?owner_user_id=eq.${encodeURIComponent(user.id)}&active=eq.true&select=id,name,slug,description,mission,country,city,logo_url,category,website_url,social_links&limit=1`,key,{method:'GET'});
      const rows=await partnerR.json().catch(()=>[]);
      const partner=Array.isArray(rows)?rows[0]:null;
      if (!partner) return partnerJson(request,{error:'Aucun profil partenaire actif n’est associé à votre compte.'},403);
      const description=typeof body.description==='string'?body.description.trim().slice(0,500):partner.description;
      const mission=typeof body.mission==='string'?body.mission.trim().slice(0,1500):partner.mission;
      const country=typeof body.country==='string'?body.country.trim().slice(0,80):partner.country;
      const city=typeof body.city==='string'?body.city.trim().slice(0,100):partner.city;
      const category=typeof body.category==='string'?body.category.trim().slice(0,100):partner.category;
      const websiteUrl=body.websiteUrl===undefined?partner.website_url:safePartnerUrl(body.websiteUrl);
      const logoUrl=body.logoUrl===undefined?partner.logo_url:safePartnerUrl(body.logoUrl);
      if (body.logoUrl!==undefined && String(body.logoUrl||'').trim() && (!logoUrl || !/^https:\/\//i.test(String(body.logoUrl).trim()))) return partnerJson(request,{error:'Le logo doit utiliser une URL HTTPS valide.'},400);
      if (body.websiteUrl!==undefined && String(body.websiteUrl||'').trim() && !websiteUrl) return partnerJson(request,{error:'Le site web doit être une URL valide.'},400);
      const socialLinks=body.socialLinks===undefined?safePartnerLinks(partner.social_links):safePartnerLinks(body.socialLinks);
      await supabaseRequest(`agency_partners?id=eq.${encodeURIComponent(partner.id)}&owner_user_id=eq.${encodeURIComponent(user.id)}`,key,{
        method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({description,mission,country,city,category:category||null,logo_url:logoUrl||null,website_url:websiteUrl||null,social_links:socialLinks,updated_at:new Date().toISOString()})
      });
      return partnerJson(request,{ok:true,message:'Profil partenaire mis à jour.'});
    } catch (error) {
      console.error('Partner profile update failed:',error?.message||'unknown error');
      return partnerJson(request,{error:'Impossible d’enregistrer vos modifications.'},503);
    }
  }

  if (url.pathname === '/api/partner/admin' && request.method === 'GET') {
    const auth = await partnerAuthUser(request,env);
    if (auth.error) return auth.error;
    const {user,key}=auth;
    if (!(await partnerIsAdmin(user.id,key))) return partnerJson(request,{error:'Accès réservé à l’administration.'},403);
    try {
      const [appsR,partnersR,eventsR,clicks] = await Promise.all([
        supabaseRequest('agency_partner_applications?select=id,application_code,full_name,email,company_name,website_url,logo_url,public_description,public_mission,public_profile_consent,country,city,category,partner_type,social_links,message,referral_code,status,email_status,email_error_code,reviewer_notes,created_at,reviewed_at&order=created_at.desc&limit=150',key,{method:'GET'}),
        supabaseRequest('agency_partners?select=id,name,slug,description,logo_url,country,city,category,partner_type,active,badge_level,badge_label,badge_verified,public_id,referral_code,verified_at&order=name.asc&limit=300',key,{method:'GET'}),
        supabaseRequest('agency_partner_admin_events?select=id,admin_user_id,action,application_id,partner_id,details,created_at&order=created_at.desc&limit=40',key,{method:'GET'}),
        partnerCount('agency_partner_clicks',key)
      ]);
      const applications=await appsR.json().catch(()=>[]);
      const partners=await partnersR.json().catch(()=>[]);
      const events=await eventsR.json().catch(()=>[]);
      const safeApplications=Array.isArray(applications)?applications:[];
      const safePartners=Array.isArray(partners)?partners:[];
      const safeEvents=Array.isArray(events)?events:[];
      const counts={pending:safeApplications.filter(a=>a.status==='pending').length,underReview:safeApplications.filter(a=>a.status==='under_review').length,approved:safeApplications.filter(a=>a.status==='approved').length,rejected:safeApplications.filter(a=>a.status==='rejected').length};
      return partnerJson(request,{applications:safeApplications,partners:safePartners,events:safeEvents,stats:{applications:safeApplications.length,...counts,partners:safePartners.filter(p=>p.active).length,verified:safePartners.filter(p=>p.active&&p.badge_verified).length,trackedEvents:clicks}});
    } catch (error) {
      console.error('Partner admin read failed:',error?.message||'unknown error');
      return partnerJson(request,{error:'Impossible de charger le tableau de bord administrateur.'},503);
    }
  }

  if (url.pathname === '/api/partner/admin/partner') {
    if (!isAllowedOrigin(request)) return partnerJson(request,{error:'Origine non autorisée'},403);
    if (request.method !== 'POST') return partnerJson(request,{error:'Méthode non autorisée'},405,{'Allow':'POST'});
    const auth=await partnerAuthUser(request,env);
    if(auth.error) return auth.error;
    const {user,key}=auth;
    if(!(await partnerIsAdmin(user.id,key))) return partnerJson(request,{error:'Accès réservé à l’administration.'},403);
    let body;
    try { body=await request.json(); } catch { return partnerJson(request,{error:'Requête JSON invalide.'},400); }
    const action=body?.action;
    const allowedActions=new Set(['create','suspend','activate','set_badge']);
    if(!allowedActions.has(action)) return partnerJson(request,{error:'Action partenaire invalide.'},400);
    const allowedBadges=new Set(['green','blue','gold','construction']);
    const badgeLevel=allowedBadges.has(body.badgeLevel)?body.badgeLevel:'green';
    const labelForBadge=(level)=>level==='gold'?'Partenaire Premium':level==='blue'?'Partenaire certifié':level==='construction'?'Partenaire BTP vérifié':'Partenaire vérifié';
    const now=new Date().toISOString();
    try {
      if(action==='create') {
        const name=typeof body.name==='string'?body.name.trim():'';
        const country=typeof body.country==='string'?body.country.trim().slice(0,80):'Niger';
        const city=typeof body.city==='string'?body.city.trim().slice(0,100):'';
        const category=typeof body.category==='string'?body.category.trim().slice(0,100):'';
        const description=typeof body.description==='string'?body.description.trim().slice(0,500):'';
        const mission=typeof body.mission==='string'?body.mission.trim().slice(0,1500):'';
        const websiteUrl=safePartnerUrl(body.websiteUrl);
        const logoUrl=safePartnerUrl(body.logoUrl);
        const websiteUrlInput=typeof body.websiteUrl==='string'?body.websiteUrl.trim():'';
        const logoUrlInput=typeof body.logoUrl==='string'?body.logoUrl.trim():'';
        const publicConsent=body.publicConsent===true;
        const verificationConfirmed=body.verificationConfirmed===true;
        if(name.length<2||name.length>160||!publicConsent||!verificationConfirmed||
          (websiteUrlInput&&!websiteUrl)||(logoUrlInput&&!/^https:\/\//i.test(logoUrlInput))||
          (logoUrlInput&&!logoUrl)||typeof body.partnerType!=='string'||body.partnerType.trim().length>120) {
          return partnerJson(request,{error:'Vérifiez le nom, les liens, le consentement et les contrôles de vérification avant de publier.'},400);
        }
        let slug=typeof body.slug==='string'&&body.slug.trim()?partnerSlug(body.slug):partnerSlug(name);
        const collisionR=await supabaseRequest(`agency_partners?slug=eq.${encodeURIComponent(slug)}&select=id&limit=1`,key,{method:'GET'});
        const collisionRows=await collisionR.json().catch(()=>[]);
        if(Array.isArray(collisionRows)&&collisionRows.length) slug=slug+'-'+crypto.randomUUID().replace(/-/g,'').slice(0,4).toLowerCase();
        const generated=crypto.randomUUID().replace(/-/g,'').toUpperCase();
        const inputSocial=body.socialLinks&&typeof body.socialLinks==='object'&&!Array.isArray(body.socialLinks)?body.socialLinks:{};
        const profile={
          name,slug,description:description||'Partenaire du réseau Bickri Service Agency.',
          mission:mission||description||'',founder:null,logo_url:logoUrl||null,
          country:country||'Niger',city:city||null,category:category||null,
          website_url:websiteUrl||null,social_links:safePartnerLinks(inputSocial),
          partner_type:body.partnerType.trim().slice(0,120),active:true,badge_level:badgeLevel,
          badge_label:labelForBadge(badgeLevel),badge_verified:true,verified_at:now,
          public_id:'BSP-'+generated.slice(0,8),referral_code:'REF-'+generated.slice(0,10)
        };
        const insertR=await supabaseRequest('agency_partners',key,{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(profile)});
        const inserted=await insertR.json().catch(()=>[]);
        const partner=Array.isArray(inserted)?inserted[0]||null:null;
        if(!partner) return partnerJson(request,{error:'Le profil n’a pas été créé.'},503);
        await recordPartnerAdminEvent(key,user.id,'partner_created',null,partner.id,{badgeLevel,slug:partner.slug,publicId:partner.public_id,publicConsent:true,verificationConfirmed:true});
        return partnerJson(request,{ok:true,partner:publicPartner(partner),message:'Partenaire ajouté à l’annuaire.'},201);
      }
      const partnerId=typeof body.partnerId==='string'?body.partnerId:'';
      if(!isUuid(partnerId)) return partnerJson(request,{error:'Identifiant de partenaire invalide.'},400);
      const foundR=await supabaseRequest(`agency_partners?id=eq.${encodeURIComponent(partnerId)}&select=id,name,slug,active,badge_level,badge_label,badge_verified,public_id,referral_code&limit=1`,key,{method:'GET'});
      const found=await foundR.json().catch(()=>[]);
      const current=Array.isArray(found)?found[0]||null:null;
      if(!current) return partnerJson(request,{error:'Partenaire introuvable.'},404);
      let patch={},auditAction='partner_badge_updated';
      if(action==='suspend'){
        patch={active:false,badge_verified:false,badge_label:'Profil suspendu',updated_at:now};
        auditAction='partner_suspended';
      } else if(action==='activate'){
        patch={active:true,badge_verified:false,badge_label:'Profil actif — non vérifié',verified_at:null,updated_at:now};
        auditAction='partner_activated';
      } else {
        const verified=body.badgeVerified===true;
        patch={
          badge_level:badgeLevel,
          badge_label:verified?labelForBadge(badgeLevel):'Profil non vérifié',
          badge_verified:verified,
          verified_at:verified?now:null,
          updated_at:now
        };
      }
      await supabaseRequest(`agency_partners?id=eq.${encodeURIComponent(partnerId)}`,key,{
        method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify(patch)
      });
      await recordPartnerAdminEvent(key,user.id,auditAction,null,partnerId,{active:action==='suspend'?false:action==='activate'?true:current.active,badgeLevel:patch.badge_level||current.badge_level,badgeVerified:patch.badge_verified});
      const freshR=await supabaseRequest(`agency_partners?id=eq.${encodeURIComponent(partnerId)}&select=id,name,slug,description,logo_url,founder,mission,country,city,partner_type,category,website_url,social_links,badge_level,badge_label,badge_verified,verified_at,public_id,referral_code,active&limit=1`,key,{method:'GET'});
      const freshRows=await freshR.json().catch(()=>[]);
      return partnerJson(request,{ok:true,partner:Array.isArray(freshRows)&&freshRows[0]?publicPartner(freshRows[0]):null,message:'Partenaire mis à jour.'});
    } catch(error) {
      console.error('Partner administration mutation failed:',error?.message||'unknown error');
      return partnerJson(request,{error:'La modification n’a pas pu être terminée. Actualisez la page puis vérifiez le résultat.'},503);
    }
  }

  if (url.pathname === '/api/partner/admin/review') {
    if (!isAllowedOrigin(request)) return partnerJson(request,{error:'Origine non autorisée'},403);
    if (request.method !== 'POST') return partnerJson(request,{error:'Méthode non autorisée'},405,{'Allow':'POST'});
    const auth = await partnerAuthUser(request,env);
    if (auth.error) return auth.error;
    const {user,key}=auth;
    if (!(await partnerIsAdmin(user.id,key))) return partnerJson(request,{error:'Accès réservé à l’administration.'},403);
    let body;
    try { body=await request.json(); } catch { return partnerJson(request,{error:'Requête JSON invalide.'},400); }
    const id=typeof body?.applicationId==='string'?body.applicationId:'';
    const action=body?.action;
    const allowedStatuses=new Set(['under_review','approve','reject']);
    if (!isUuid(id)||!allowedStatuses.has(action)) return partnerJson(request,{error:'Action de validation invalide.'},400);
    const notes=typeof body.reviewerNotes==='string'?body.reviewerNotes.trim().slice(0,2000):'';
    const badgeLevel=['green','blue','gold','construction'].includes(body.badgeLevel)?body.badgeLevel:'green';
    try {
      const appR=await supabaseRequest(`agency_partner_applications?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,key,{method:'GET'});
      const found=await appR.json().catch(()=>[]);
      const app=Array.isArray(found)?found[0]:null;
      if (!app) return partnerJson(request,{error:'Candidature introuvable.'},404);
      const existingR=await supabaseRequest(`agency_partners?application_id=eq.${encodeURIComponent(id)}&select=id,slug,owner_user_id,public_id,referral_code,active&limit=1`,key,{method:'GET'});
      const existingRows=await existingR.json().catch(()=>[]);
      const existing=Array.isArray(existingRows)?existingRows[0]||null:null;
      if (action==='approve' && app.public_profile_consent !== true) {
        return partnerJson(request,{error:'Impossible de publier ce profil : le consentement de publication n’a pas été enregistré.',code:'PUBLIC_PROFILE_CONSENT_REQUIRED'},409);
      }
      const status=action==='approve'?'approved':action==='reject'?'rejected':'under_review';
      const updatedAt=new Date().toISOString();
      const patch={status,reviewer_notes:notes||null,reviewed_by:user.id,reviewed_at:updatedAt,updated_at:updatedAt};
      const updateR=await supabaseRequest(`agency_partner_applications?id=eq.${encodeURIComponent(id)}`,key,{
        method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(patch)
      });
      await updateR.json().catch(()=>[]);
      let partner=null;
      if (action !== 'approve') {
        // A rejected or re-opened application must not leave a stale public profile visible.
        if (existing) {
          await supabaseRequest(`agency_partners?id=eq.${encodeURIComponent(existing.id)}&application_id=eq.${encodeURIComponent(id)}`,key,{
            method:'PATCH',headers:{Prefer:'return=minimal'},
            body:JSON.stringify({active:false,badge_verified:false,updated_at:updatedAt})
          });
        }
        await recordPartnerAdminEvent(key,user.id,action==='reject'?'application_rejected':'application_under_review',id,existing?.id||null,{status});
        return partnerJson(request,{ok:true,status,partner:null});
      }
      let slug=existing?.slug || partnerSlug(app.company_name);
      if (!existing) {
        const existingSlugR=await supabaseRequest(`agency_partners?slug=eq.${encodeURIComponent(slug)}&select=id,application_id&limit=1`,key,{method:'GET'});
        const existingSlugs=await existingSlugR.json().catch(()=>[]);
        if (Array.isArray(existingSlugs)&&existingSlugs[0]&&existingSlugs[0].application_id!==id) slug=`${slug}-${app.application_code.slice(-4).toLowerCase()}`;
      }
      const partnerTypeLabel={technical:'Partenaire technologique',referral:'Apporteur d’affaires',integrator:'Intégrateur',other:'Autre partenariat'}[app.partner_type]||'Partenaire';
      const profile={
        application_id:id,name:app.company_name,slug,
        description:(app.public_description||'Partenaire du réseau Bickri Service Agency.').slice(0,500),
        founder:null,mission:(app.public_mission||app.public_description||'').slice(0,1500),
        logo_url:safePartnerUrl(app.logo_url)||null,
        country:app.country||'Niger',city:app.city||null,website_url:safePartnerUrl(app.website_url)||null,
        category:app.category||null,social_links:safePartnerLinks(app.social_links||{}),
        partner_type:partnerTypeLabel,active:true,badge_level:badgeLevel,
        badge_label:badgeLevel==='gold'?'Partenaire Premium':badgeLevel==='blue'?'Partenaire certifié':badgeLevel==='construction'?'Partenaire BTP vérifié':'Partenaire vérifié',
        badge_verified:true,verified_at:updatedAt,
        owner_user_id:existing?.owner_user_id||app.owner_user_id||null,
        public_id:existing?.public_id||('BSP-'+app.application_code.replace(/[^A-Z0-9]/g,'').slice(-8)),
        referral_code:existing?.referral_code||('REF-'+app.application_code.replace(/[^A-Z0-9]/g,'').slice(-10))
      };
      const upsertR=await supabaseRequest('agency_partners?on_conflict=application_id',key,{
        method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(profile)
      });
      const upsertRows=await upsertR.json().catch(()=>[]);
      partner=Array.isArray(upsertRows)?upsertRows[0]||null:null;
      if (!partner) {
        const readBack=await supabaseRequest(`agency_partners?application_id=eq.${encodeURIComponent(id)}&select=id,name,slug,description,logo_url,founder,mission,country,city,partner_type,category,website_url,social_links,badge_level,badge_label,badge_verified,verified_at,public_id,referral_code&limit=1`,key,{method:'GET'});
        const readRows=await readBack.json().catch(()=>[]);
        partner=Array.isArray(readRows)?readRows[0]||null:null;
      }
      if (!partner) return partnerJson(request,{error:'Le profil partenaire n’a pas pu être publié. Réessayez cette approbation.',code:'PARTNER_PROFILE_NOT_CREATED'},503);
      await recordPartnerAdminEvent(key,user.id,'application_approved',id,partner.id,{status,badgeLevel});
      return partnerJson(request,{ok:true,status,partner:publicPartner(partner)});
    } catch (error) {
      console.error('Partner application review failed:',error?.message||'unknown error');
      return partnerJson(request,{error:'La mise à jour n’a pas pu être terminée. Vérifiez le dossier et réessayez.'},503);
    }
  }

  if (url.pathname === '/api/partner') {
    if (!isAllowedOrigin(request)) return partnerJson(request,{error:'Origine non autorisée'},403);
    if (request.method !== 'POST') return partnerJson(request,{error:'Méthode non autorisée'},405,{'Allow':'POST'});
    const contentLength = Number(request.headers.get('Content-Length') || 0);
    if (Number.isFinite(contentLength) && contentLength > 32 * 1024) return partnerJson(request,{error:'Requête trop volumineuse'},413);
    const rate=checkPartnerLimit(request,partnerSubmissionBuckets,5,10*60*1000);
    if (!rate.allowed) return partnerJson(request,{error:'Trop de candidatures depuis cet accès. Réessayez dans quelques minutes.'},429,{'Retry-After':String(rate.retryAfter)});
    let body;
    try { body = await request.json(); } catch { return partnerJson(request,{error:'Requête JSON invalide.'},400); }
    const {fullName,email,companyName,websiteUrl='',logoUrl='',publicDescription='',publicMission='',publicProfileConsent='',partnerType,message,website='',country='Niger',city='',category='',socialLinks={},socialFacebook='',socialInstagram='',socialLinkedIn='',socialWhatsApp='',referralCode=''} = body || {};
    if (website) return partnerJson(request,{ok:true,message:'Demande reçue.'},201);
    const allowedTypes = new Set(['technical','referral','integrator','other']);
    if (typeof fullName !== 'string' || fullName.trim().length < 2 || fullName.trim().length > 120 ||
        typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.trim().length > 254 ||
        typeof companyName !== 'string' || companyName.trim().length < 2 || companyName.trim().length > 160 ||
        typeof message !== 'string' || message.trim().length < 10 || message.trim().length > 5000 ||
        !allowedTypes.has(partnerType) || publicProfileConsent !== 'yes' ||
        (websiteUrl && !safePartnerUrl(websiteUrl)) || (logoUrl && (!safePartnerUrl(logoUrl) || !/^https:\/\//i.test(logoUrl.trim()))) ||
        (typeof publicDescription !== 'string' || publicDescription.length > 500) ||
        (typeof publicMission !== 'string' || publicMission.length > 1500) ||
        (country && (typeof country!=='string'||country.trim().length>80)) ||
        (city && (typeof city!=='string'||city.trim().length>100)) ||
        (category && (typeof category!=='string'||category.trim().length>100))) {
      return partnerJson(request,{error:'Vérifiez les champs du formulaire puis réessayez.'},400);
    }
    const key=env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) {
      console.error('Bickri Mail partner submission has no Supabase persistence key.');
      return partnerJson(request,{error:'Le formulaire est temporairement indisponible. Réessayez plus tard.'},503);
    }
    const cleanEmail=email.trim().toLowerCase();
    const rawLinks=socialLinks && typeof socialLinks==='object' && !Array.isArray(socialLinks) ? socialLinks : {};
    const links=safePartnerLinks({
      ...rawLinks,
      facebook:typeof socialFacebook==='string'&&socialFacebook.trim()?socialFacebook:rawLinks.facebook,
      instagram:typeof socialInstagram==='string'&&socialInstagram.trim()?socialInstagram:rawLinks.instagram,
      linkedin:typeof socialLinkedIn==='string'&&socialLinkedIn.trim()?socialLinkedIn:rawLinks.linkedin,
      whatsapp:typeof socialWhatsApp==='string'&&socialWhatsApp.trim()?socialWhatsApp:rawLinks.whatsapp
    });
    const refInput=typeof referralCode==='string'?referralCode.trim().slice(0,80):'';
    try {
      let validRef=null;
      if (refInput) {
        const refR=await supabaseRequest(`agency_partners?referral_code=eq.${encodeURIComponent(refInput)}&active=eq.true&select=referral_code&limit=1`,key,{method:'GET'});
        const refRows=await refR.json().catch(()=>[]);
        if (Array.isArray(refRows)&&refRows[0]) validRef=refRows[0].referral_code;
      }
      const insertR=await supabaseRequest('agency_partner_applications',key,{
        method:'POST',headers:{Prefer:'return=representation'},
        body:JSON.stringify({
          full_name:fullName.trim(),email:cleanEmail,company_name:companyName.trim(),
          website_url:safePartnerUrl(websiteUrl)||null,logo_url:safePartnerUrl(logoUrl)||null,
          public_description:publicDescription.trim()||null,public_mission:publicMission.trim()||null,
          public_profile_consent:true,public_profile_consented_at:new Date().toISOString(),
          country:(country||'Niger').trim().slice(0,80),
          city:typeof city==='string'?city.trim().slice(0,100)||null:null,
          category:typeof category==='string'?category.trim().slice(0,100)||null:null,
          partner_type:partnerType,social_links:links,message:message.trim(),
          referral_code:validRef,status:'pending',email_status:env.PARTNER_EMAIL?'pending':'not_configured'
        })
      });
      const inserted=await insertR.json().catch(()=>[]);
      const application=Array.isArray(inserted)?inserted[0]:null;
      if (!application?.id||!application?.application_code) {
        console.error('Bickri Mail application persistence returned no application identifier.');
        return partnerJson(request,{error:'La candidature n’a pas pu être enregistrée. Réessayez plus tard.'},503);
      }
      let emailStatus='not_configured';
      let emailErrorCode=null;
      if (env.PARTNER_EMAIL && typeof env.PARTNER_EMAIL.send==='function') {
        try {
          await sendPartnerApplication(env.PARTNER_EMAIL,{
            fullName:fullName.trim(),email:cleanEmail,companyName:companyName.trim(),
            websiteUrl:safePartnerUrl(websiteUrl),partnerType,message:message.trim(),
            country:(country||'Niger').trim(),city:typeof city==='string'?city.trim():'',
            category:typeof category==='string'?category.trim():'',socialLinks:links,referralCode:validRef||'',
            logoUrl:safePartnerUrl(logoUrl),publicDescription:publicDescription.trim(),publicMission:publicMission.trim()
          });
          emailStatus='sent';
        } catch (error) {
          emailStatus='failed';
          emailErrorCode=typeof error?.code==='string'&&/^[A-Z0-9_]{3,80}$/.test(error.code)?error.code:'BICKRI_MAIL_SEND_FAILED';
          console.error('Bickri Mail notification failed for saved application:',emailErrorCode,error?.message||'unknown error');
        }
      } else {
        console.error('Bickri Mail Email Service binding PARTNER_EMAIL is not configured; application was saved.');
      }
      try {
        await supabaseRequest(`agency_partner_applications?id=eq.${encodeURIComponent(application.id)}`,key,{
          method:'PATCH',headers:{Prefer:'return=minimal'},
          body:JSON.stringify({email_status:emailStatus,email_error_code:emailErrorCode,updated_at:new Date().toISOString()})
        });
      } catch (error) {
        console.error('Could not update partner email status:',error?.message||'unknown error');
      }
      return partnerJson(request,{
        ok:true,saved:true,applicationCode:application.application_code,emailStatus,
        message:'Votre candidature a été enregistrée. Conservez votre code de dossier pour suivre son état.'
      },201);
    } catch (error) {
      console.error('Partner application storage failed:',error?.message||'unknown error');
      return partnerJson(request,{error:'Impossible d’enregistrer la candidature. Le service de données est momentanément indisponible.'},503);
    }
  }

  if (url.pathname === '/api/turnstile-sitekey') {
    if (request.method !== 'GET') return json({error:'Method not allowed'},405);
    return json({siteKey: env.TURNSTILE_SITE_KEY || '0x4AAAAAAFSQKBE9BhCCTI8Qc1vlZ_sojAI'},200,{'Cache-Control':'no-store'});
  }
  if (url.pathname === '/api/turnstile-verify') {
    if (!isAllowedOrigin(request)) return json({success:false,error:'Origine non autorisée'},403);
    if (request.method === 'OPTIONS') return json({},204);
    if (request.method !== 'POST') return json({success:false,error:'Method not allowed'},405);
    const contentLength = Number(request.headers.get('Content-Length') || 0);
    if (Number.isFinite(contentLength) && contentLength > 16 * 1024) return json({success:false,error:'Requête trop volumineuse'},413);
    const rate = checkTurnstileRateLimit(request);
    if (!rate.allowed) return json({success:false,error:'Trop de requêtes. Veuillez réessayer plus tard.'},429,{'Retry-After':String(rate.retryAfter)});
    let body;
    try { body = await request.json(); } catch { return json({success:false,error:'Requête JSON invalide'},400); }
    const captcha = await verifyWorkerTurnstile(request, body?.token, env, null);
    if (!captcha.ok) return json({success:false,error:captcha.configured?'Vérification Turnstile refusée':'Service de vérification indisponible'},captcha.configured?403:503);
    return json({success:true},200,{'Cache-Control':'no-store'});
  }
  if(url.pathname==='/api/bickri-ai'){
    if (!isAllowedOrigin(request)) return json({error:'Origine non autorisée'},403);
    if(request.method==='OPTIONS')return json({},204);
    if(request.method!=='POST')return json({error:'Method not allowed'},405);
    const contentLength = Number(request.headers.get('Content-Length') || 0);
    if (Number.isFinite(contentLength) && contentLength > 256 * 1024) return json({error:'Requête trop volumineuse'},413);
    const rate = checkAiRateLimit(request);
    if (!rate.allowed) return json({error:'Trop de requêtes. Veuillez réessayer dans quelques instants.'},429,{'Retry-After':String(rate.retryAfter)});
    let body;try{body=await request.json()}catch{return json({error:'Invalid JSON body'},400)}
    const message=typeof body?.message==='string'?body.message.trim():'';
    if(!message)return json({error:'Message required'},400);
    if(message.length>2000)return json({error:'Message too long'},400);
    const captcha = await verifyWorkerTurnstile(request, body?.turnstileToken, env, 'bickri-ai');
    if (!captcha.ok) return json({error:captcha.configured?'Vérification anti-robot requise ou invalide.':'Service de vérification anti-robot non configuré.',code:captcha.configured?'TURNSTILE_INVALID':'TURNSTILE_UNCONFIGURED'},captcha.configured?403:503);
    const apiKey=env.OPENAI_API_KEY || env.AI_API_KEY, endpoint=env.AI_API_URL || 'https://api.openai.com/v1/responses', model=env.OPENAI_MODEL || env.AI_MODEL || 'gpt-4.1-mini';
    if(!apiKey)return json({answer:fallbackAnswer(message),version:SITE_VERSION,mode:'local'});
    const clientHistory=Array.isArray(body?.history)?body.history.slice(-8).filter(x=>x&&(x.role==='user'||x.role==='assistant')&&typeof x.content==='string').map(x=>({role:x.role,content:x.content.slice(0,2000)})):[];
    let sessionId=getSessionId(request),conversationId=null,storedHistory=[];
    const supabaseKey=env.SUPABASE_SERVICE_ROLE_KEY;
    if(!sessionId&&supabaseKey)sessionId=crypto.randomUUID();
    if(supabaseKey&&sessionId){try{conversationId=await ensureConversation(sessionId,supabaseKey);storedHistory=await loadConversationHistory(conversationId,supabaseKey)}catch(e){console.error('Supabase persistence read failed',e)}}
    const history=storedHistory.length?storedHistory:clientHistory;
    try{
      const isResponses=/\/responses(?:$|\?)/i.test(endpoint);
      const payload = isResponses
        ? {model,instructions:SYSTEM_PROMPT,input:[...history.map(x=>({role:x.role,content:x.content})),{role:'user',content:message}]}
        : {model,temperature:.2,messages:[{role:'system',content:SYSTEM_PROMPT},...history,{role:'user',content:message}]};
      const upstream=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},body:JSON.stringify(payload)});
      const data=await upstream.json().catch(()=>({}));
      if(!upstream.ok){console.error('Bickri AI provider error',upstream.status,data?.error?.code||data?.error?.type||'unknown');return json({answer:fallbackAnswer(message),version:SITE_VERSION,mode:'fallback'});}
      const answer=isResponses
        ? (typeof data?.output_text==='string'?data.output_text:data?.output?.flatMap(item=>Array.isArray(item?.content)?item.content:[]).map(item=>item?.text||'').filter(Boolean).join('\n'))
        : (data?.choices?.[0]?.message?.content||data?.output_text||data?.response);
      if(typeof answer!=='string'||!answer.trim())return json({answer:fallbackAnswer(message),version:SITE_VERSION,mode:'fallback'});
      const finalAnswer=answer.trim();
      if(ctx?.waitUntil&&supabaseKey&&conversationId)ctx.waitUntil(saveConversationExchange(conversationId,supabaseKey,message,finalAnswer).catch(e=>console.error('Supabase persistence write failed',e)));
      const headers={};if(sessionId&&!getSessionId(request))headers['Set-Cookie']=secureCookie(sessionId);
      return json({answer:finalAnswer,version:SITE_VERSION,persistence:Boolean(supabaseKey&&conversationId)},200,headers);
    }catch(error){console.error('Bickri AI request failed',error?.message||error);return json({answer:fallbackAnswer(message),version:SITE_VERSION,mode:'fallback'})}
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
        '<button type="button" onclick="navigator.clipboard.writeText(this.previousElementSibling.href).then(()=>{this.textContent=&quot;Lien copié ✓&quot;;setTimeout(()=>this.textContent=&quot;Copier le lien&quot;,1600)}).catch(()=>{window.prompt(&quot;Copiez ce lien :&quot;,this.previousElementSibling.href)})" style="padding:13px;border:1px solid #d9a441;background:#d9a441;color:#08101f;border-radius:10px;font-weight:800;cursor:pointer">Copier le lien</button>' +
        '<a href="https://wa.me/?text=' + encodeURIComponent('Découvrez ' + String(service.name || 'ce service') + ' — ' + shortUrl) + '" target="_blank" rel="noopener" style="padding:13px;border-radius:10px;background:#fff;color:#111827;text-decoration:none;font-weight:800">Partager sur WhatsApp</a>' +
        '<a href="' + esc(appUrl) + '" style="padding:13px;border-radius:10px;background:#d9a441;color:#08101f;text-decoration:none;font-weight:800">Ouvrir le service</a>' +
        '</div></div>' +
        '</main></body></html>';
      return new Response(html,{status:200,headers:{...SECURITY_HEADERS,'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0','Vary':'User-Agent'}});
    } catch (e) {
      console.error('Short service Open Graph page failed', e);
      return new Response('Service link error',{status:500,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
    }
  }

  // Social preview for dynamic partner profiles: bots receive server-rendered Open Graph metadata.
  if (request.method === 'GET' && url.pathname === '/partenaires/profil/' &&
      /(WhatsApp|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|TelegramBot|Slackbot|Discordbot|SkypeUriPreview)/i.test(request.headers.get('User-Agent') || '')) {
    const slug=(url.searchParams.get('slug')||'').trim().slice(0,90);
    const key=env.SUPABASE_SERVICE_ROLE_KEY;
    const escapeHtml=(value)=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    if(!slug||!key) return new Response('Profil partenaire introuvable',{status:404,headers:{...SECURITY_HEADERS,'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
    try {
      const params=new URLSearchParams({slug:`eq.${slug}`,active:'eq.true',select:'name,slug,description,mission,logo_url,country,city,partner_type,category,badge_label,public_id',limit:'1'});
      const profileResponse=await supabaseRequest(`agency_partners?${params.toString()}`,key,{method:'GET'});
      const profileRows=await profileResponse.json().catch(()=>[]);
      const p=Array.isArray(profileRows)?profileRows[0]:null;
      if(!p) return new Response('Profil partenaire introuvable',{status:404,headers:{...SECURITY_HEADERS,'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
      const basePath='/partenaires/profil/?slug='+encodeURIComponent(p.slug);
      const canonical=new URL(basePath,url.origin).href;
      const link=new URL(basePath,url.origin);
      const referral=(url.searchParams.get('ref')||'').trim();
      if(referral) link.searchParams.set('ref',referral);
      const sharedUrl=link.href;
      const slugLogos={'impact-afriq':'/assets/partners/impact-afriq.svg','egan-btp':'/assets/partners/egan-btp.svg'};
      const image=safePartnerUrl(p.logo_url)||new URL(slugLogos[p.slug]||'/assets/bickri-b-logo.svg',url.origin).href;
      const title=(p.name||'Partenaire')+' — Partenaire Bickri Service Agency';
      const description=String(p.description||p.mission||'Découvrez ce partenaire du réseau Bickri Service Agency.').slice(0,300);
      const html='<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
        '<title>'+escapeHtml(title)+'</title><meta name="description" content="'+escapeHtml(description)+'"><link rel="canonical" href="'+escapeHtml(canonical)+'">'+
        '<meta property="og:type" content="profile"><meta property="og:site_name" content="Bickri Service Agency"><meta property="og:locale" content="fr_FR">'+
        '<meta property="og:url" content="'+escapeHtml(canonical)+'"><meta property="og:title" content="'+escapeHtml(title)+'"><meta property="og:description" content="'+escapeHtml(description)+'">'+
        '<meta property="og:image" content="'+escapeHtml(image)+'"><meta property="og:image:secure_url" content="'+escapeHtml(image)+'"><meta property="og:image:alt" content="'+escapeHtml(p.name||'Partenaire')+'">'+
        '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="'+escapeHtml(title)+'"><meta name="twitter:description" content="'+escapeHtml(description)+'"><meta name="twitter:image" content="'+escapeHtml(image)+'">'+
        '</head><body><main><h1>'+escapeHtml(p.name||'Partenaire')+'</h1><p>'+escapeHtml(description)+'</p><a href="'+escapeHtml(sharedUrl)+'">Voir le profil partenaire</a></main></body></html>';
      return new Response(html,{status:200,headers:{...SECURITY_HEADERS,'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store, no-cache, must-revalidate, max-age=0','Vary':'User-Agent'}});
    } catch(error) {
      console.error('Partner Open Graph rendering failed:',error?.message||'unknown error');
      return new Response('Profil partenaire indisponible',{status:503,headers:{...SECURITY_HEADERS,'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
    }
  }

  const response=await env.ASSETS.fetch(request);
  const headers=new Headers(response.headers);
  for (const [key,value] of Object.entries(SECURITY_HEADERS)) if (!headers.has(key)) headers.set(key,value);
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