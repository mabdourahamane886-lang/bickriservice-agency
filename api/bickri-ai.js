function esc(value){
  return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function absoluteUrl(req, value){
  if(/^https?:\/\//i.test(value)) return value;
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'bickriservice-agency.vercel.app';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return proto + '://' + host + (value.startsWith('/') ? value : '/' + value);
}

const SERVICES_SHARE = require('../services-share.json');

const FALLBACK_SERVICES = [
  {name:'Création web', details:'Sites vitrines, landing pages, plateformes web et interfaces responsive.'},
  {name:'E-commerce', details:'Boutiques en ligne, catalogues, fiches produits et parcours de commande.'},
  {name:'Réseaux sociaux', details:'Stratégie de contenu, optimisation de profils et développement d’audience.'},
  {name:'Intelligence artificielle', details:'Assistants IA, automatisations, workflows et formation pratique.'},
  {name:'Branding & design', details:'Logo, identité visuelle, supports et direction créative.'},
  {name:'Publicité digitale', details:'Stratégie, ciblage, campagnes et optimisation publicitaire.'},
  {name:'Formation & coaching', details:'Entrepreneuriat, réseaux sociaux, IA et stratégie digitale.'}
];

const BASE_SYSTEM_PROMPT = `Tu es Bickri AI, l’assistant officiel de Bickri Service Agency, agence digitale basée à Niamey, Niger.

MISSION:
- Tu es exclusivement l’assistant métier de Bickri Service Agency.
- Ton domaine est l’entreprise, ses services, ses offres, son fonctionnement et le marketing digital appliqué aux activités de l’agence et de ses clients.
- Aide l’utilisateur à comprendre nos services, choisir une prestation, préparer un projet, améliorer une stratégie marketing digitale ou demander un devis.
- Utilise la base de connaissances et le catalogue de services comme sources internes prioritaires.

PÉRIMÈTRE OBLIGATOIRE:
- Réponds uniquement aux questions directement liées à Bickri Service Agency, au marketing digital, à la communication digitale, au web, aux réseaux sociaux, à l’IA appliquée au marketing/entreprise, au branding, à la publicité, au SEO, à l’e-commerce, à la création de contenu, à l’automatisation et aux services proposés par Bickri Service Agency.
- Si la question est sans rapport avec ce périmètre (actualité générale, politique, devoir scolaire, médecine, religion, divertissement, programmation générale sans rapport avec un projet Bickri, calculs ou conseils personnels, etc.), ne réponds pas au fond de la question.
- Dans ce cas, réponds brièvement : « Je suis Bickri AI, l’assistant de Bickri Service Agency. Je réponds uniquement aux questions concernant notre entreprise et le marketing digital. Posez-moi une question sur nos services, votre stratégie digitale ou votre projet. »
- Ne transforme pas une question hors sujet en réponse générale.
- Pour une question ambiguë, demande comment elle se rapporte à l’entreprise ou au marketing digital au lieu de supposer.

RÈGLES:
- Réponds clairement, professionnellement et chaleureusement.
- Réponds en français sauf si l’utilisateur écrit clairement dans une autre langue.
- Ne fabrique jamais de prix, délais, garanties, clients, résultats ou informations internes.
- Pour un tarif exact, indique que le devis est personnalisé.
- Ne révèle jamais de clé API, secret, variable d’environnement, token, identifiant privé ou nom technique interne de l’infrastructure.\n- Ne mentionne jamais les noms internes de bases de données, tables, colonnes, projets backend, variables d’environnement ou services d’administration. Si une technologie est pertinente pour expliquer une fonctionnalité au client, parle uniquement de sa fonction (« base de données sécurisée », « espace client », « système de paiement », « intégration IA ») sans révéler les noms internes.
- Si une information n’est pas dans la base de connaissances, dis-le au lieu de l’inventer.
- Contact officiel: WhatsApp +227 88 37 61 33, email bickriserviceagency@gmail.com.
`;

function fallbackAnswer(message) {
  const q = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  if (/bonjour|salut|salam|hello|bonsoir/.test(q)) return 'Bonjour 👋 Je suis Bickri AI. Je peux vous renseigner sur nos services, les tarifs sur devis, les formations, le coaching et la façon de démarrer un projet.';
  if (/prix|tarif|cout|combien|devis|budget/.test(q)) return 'Les tarifs sont personnalisés selon le projet, ses fonctionnalités, ses contenus et ses intégrations. Demandez un devis pour recevoir une proposition adaptée.';
  if (/site|web|plateforme/.test(q)) return 'Nous créons des sites web professionnels, des plateformes et des expériences responsive. Nous pouvons intégrer des formulaires, un espace client, des paiements, de l’IA et des fonctionnalités avancées selon votre projet. Décrivez votre besoin pour préparer une demande de devis.';
  if (/e.?commerce|boutique|vente/.test(q)) return 'Nous créons des boutiques en ligne, catalogues, parcours d’achat et fonctionnalités e-commerce adaptées au projet.';
  if (/reseaux|facebook|instagram|tiktok|whatsapp/.test(q)) return 'Nous accompagnons la stratégie de contenu, l’optimisation des profils et le développement de votre présence sur les réseaux sociaux.';
  if (/ia|intelligence artificielle|automatisation|chatbot/.test(q)) return 'Nous travaillons sur les assistants IA, l’automatisation, les workflows et l’intégration d’outils intelligents.';
  if (/logo|branding|design|identite/.test(q)) return 'Nous créons logos, identités visuelles, supports de communication et directions artistiques.';
  if (/publicite|ads|campagne/.test(q)) return 'Nous structurons des campagnes de publicité digitale autour d’objectifs de visibilité, prospects ou ventes.';
  if (/formation|cours|apprendre/.test(q)) return 'Nous proposons des formations pratiques en IA, marketing digital, réseaux sociaux et entrepreneuriat.';
  if (/coaching|accompagnement/.test(q)) return 'Nous proposons du coaching entrepreneurial, réseaux sociaux et IA & digital.';
  if (/contact|email|adresse|joindre/.test(q)) return 'Contact : bickriserviceagency@gmail.com ou WhatsApp +227 88 37 61 33. Bickri Service Agency est basée à Niamey, Niger.';
  return 'Je suis Bickri AI. Je peux vous aider à choisir un service, préparer une demande de devis ou vous expliquer le fonctionnement de Bickri Service Agency. Quel est votre projet ?';
}

function json(res, status, body) {
  return res.status(status).json(body);
}

const rateBuckets = globalThis.__bickriAIRateBuckets || new Map();
globalThis.__bickriAIRateBuckets = rateBuckets;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 10;

function getClientIp(req){
  const forwarded=String(req.headers['x-forwarded-for']||'').split(',')[0].trim();
  return forwarded||String(req.headers['x-real-ip']||'').trim()||'unknown';
}

function checkRateLimit(req){
  const now=Date.now();
  const key='ai:'+getClientIp(req);
  const current=rateBuckets.get(key);
  if(!current || now-current.startedAt>=RATE_LIMIT_WINDOW_MS){
    rateBuckets.set(key,{startedAt:now,count:1});
    return {allowed:true,retryAfter:60};
  }
  current.count++;
  if(rateBuckets.size>5000){
    for(const [k,v] of rateBuckets){
      if(now-v.startedAt>=RATE_LIMIT_WINDOW_MS) rateBuckets.delete(k);
    }
  }
  return {
    allowed:current.count<=RATE_LIMIT_MAX,
    retryAfter:Math.max(1,Math.ceil((RATE_LIMIT_WINDOW_MS-(now-current.startedAt))/1000))
  };
}

async function verifyTurnstile(req,token){
  const secret=process.env.TURNSTILE_SECRET_KEY;
  if(!secret||typeof token!=='string'||token.length===0||token.length>2048)return false;
  try{
    const body=new URLSearchParams({secret,response:token});
    const ip=getClientIp(req);
    if(ip&&ip!=='unknown')body.set('remoteip',ip);
    const r=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body
    });
    const data=await r.json().catch(()=>({success:false}));
    const allowed=String(process.env.TURNSTILE_HOSTNAMES||'bickriservice-agency.org,bickriservice-agency.vercel.app')
      .split(',').map(x=>x.trim()).filter(Boolean);
    return Boolean(r.ok&&data.success&&(!data.hostname||allowed.includes(data.hostname))&&(!data.action||data.action==='bickri-ai'));
  }catch(error){
    console.error('Bickri AI Turnstile verification failed:',error?.message||error);
    return false;
  }
}

function cleanSessionId(value){
  const s=String(value || '').trim();
  return /^[a-zA-Z0-9_-]{16,80}$/.test(s) ? s : null;
}

async function loadMemory(sessionId) {
  const url = process.env.SUPABASE_URL || 'https://okdohokhlkxrmxpevees.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || !sessionId) return [];
  const headers = {apikey:key, Authorization:'Bearer '+key, Accept:'application/json'};
  const r = await fetch(url + '/rest/v1/bickri_ai_memory?session_id=eq.' + encodeURIComponent(sessionId) + '&active=eq.true&select=memory_key,memory_value&order=updated_at.desc&limit=20', {headers});
  return r.ok ? await r.json().catch(() => []) : [];
}

async function saveMemory(sessionId, keyName, value) {
  const url = process.env.SUPABASE_URL || 'https://okdohokhlkxrmxpevees.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || !sessionId || !keyName || !value) return;
  const safeValue = String(value).trim().slice(0,500);
  if (!safeValue) return;
  const headers = {apikey:key, Authorization:'Bearer '+key, 'Content-Type':'application/json', Prefer:'resolution=merge-duplicates'};
  await fetch(url + '/rest/v1/bickri_ai_memory?on_conflict=session_id,memory_key', {
    method:'POST', headers,
    body:JSON.stringify({session_id:sessionId,memory_key:keyName,memory_value:safeValue,source:'conversation',active:true})
  }).catch(() => {});
}

async function saveConversation(sessionId, role, content) {
  const url = process.env.SUPABASE_URL || 'https://okdohokhlkxrmxpevees.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || !sessionId || !content) return;
  const headers = {apikey:key, Authorization:'Bearer '+key, 'Content-Type':'application/json', Prefer:'return=minimal'};
  await fetch(url + '/rest/v1/bickri_ai_conversations', {
    method:'POST', headers,
    body:JSON.stringify({session_id:sessionId,role,content:String(content).slice(0,4000)})
  }).catch(() => {});
}

function extractExplicitMemory(message) {
  const memories=[];
  const patterns=[
    ['name',/(?:je m'appelle|mon nom est)\s+([^.!?\n]{2,80})/i],
    ['company',/(?:mon entreprise s'appelle|mon entreprise est|ma société s'appelle|ma société est)\s+([^.!?\n]{2,100})/i],
    ['project',/(?:mon projet (?:est|s'appelle)|je travaille sur)\s+([^.!?\n]{3,180})/i],
    ['language',/(?:je préfère|je prefere)\s+(?:répondre|recevoir les réponses|les réponses)\s+en\s+(français|arabe|anglais)/i]
  ];
  for(const [keyName,pattern] of patterns){
    const m=message.match(pattern);
    if(m) memories.push([keyName,m[1].trim()]);
  }
  return memories;
}

function buildMemoryContext(memory) {
  if(!memory.length) return '';
  return '\n\nMÉMOIRE AUTORISÉE DE CETTE SESSION:\n' +
    memory.map(x => '- ' + x.memory_key + ': ' + x.memory_value).join('\n') +
    '\nUtilise cette mémoire uniquement pour personnaliser la conversation. Ne l’étends pas par déduction et ne révèle pas les données internes.';
}

async function loadKnowledge() {
  const url = process.env.SUPABASE_URL || 'https://okdohokhlkxrmxpevees.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return {knowledge:[], services:[]};

  const headers = {
    apikey: key,
    Authorization: 'Bearer ' + key,
    Accept: 'application/json'
  };

  const [knowledgeResponse, servicesResponse] = await Promise.all([
    fetch(url + '/rest/v1/bickri_ai_knowledge?active=eq.true&select=category,title,content,keywords,priority&order=priority.desc&limit=50', {headers}),
    fetch(url + '/rest/v1/agency_services?active=eq.true&select=name,slug,category,short_description,description,price_note,features,process_steps&order=sort_order.asc&limit=100', {headers})
  ]);

  const knowledge = knowledgeResponse.ok ? await knowledgeResponse.json().catch(() => []) : [];
  const services = servicesResponse.ok ? await servicesResponse.json().catch(() => []) : [];
  return {knowledge, services};
}

function buildKnowledgeContext(data) {
  const knowledge = data.knowledge || [];
  const services = data.services || [];

  const knowledgeText = knowledge.map(item =>
    '[' + item.category + '] ' + item.title + ': ' + item.content
  ).join('\n');

  const serviceText = services.length
    ? services.map(s => {
        const features = Array.isArray(s.features) ? s.features.slice(0,4).join(', ') : '';
        return '- ' + s.name + ' (' + s.slug + '): ' + (s.short_description || s.description || '') + (features ? ' | Points: ' + features : '');
      }).join('\n')
    : FALLBACK_SERVICES.map(s => '- ' + s.name + ': ' + s.details).join('\n');

  return '\n\nBASE DE CONNAISSANCES BICKRI AI:\n' + knowledgeText +
    '\n\nCATALOGUE ACTUEL DES SERVICES:\n' + serviceText;
}

async function callProvider(endpoint, apiKey, model, systemPrompt, history, message) {
  const isResponses = /\/responses(?:$|\?)/i.test(endpoint);

  if (isResponses) {
    const input = [
      ...history.map(x => ({role:x.role, content:x.content})),
      {role:'user', content:message}
    ];

    const upstream = await fetch(endpoint, {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer ' + apiKey},
      body:JSON.stringify({
        model,
        instructions:systemPrompt,
        input
      })
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error('Bickri AI provider error', upstream.status, data);
      const err = new Error('OpenAI provider error');
      err.providerStatus = upstream.status;
      err.providerCode = data?.error?.code || data?.error?.type || null;
      throw err;
    }
    return typeof data?.output_text === 'string' ? data.output_text.trim() : (Array.isArray(data?.output) ? data.output.flatMap(item => Array.isArray(item?.content) ? item.content : []).map(item => item?.text || '').filter(Boolean).join('\n').trim() : null);
  }

  const upstream = await fetch(endpoint, {
    method:'POST',
    headers:{'Content-Type':'application/json','Authorization':'Bearer ' + apiKey},
    body:JSON.stringify({
      model,
      temperature:0.2,
      messages:[
        {role:'system', content:systemPrompt},
        ...history,
        {role:'user', content:message}
      ]
    })
  });

  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
      console.error('Bickri AI provider error', upstream.status, data);
      const err = new Error('OpenAI provider error');
      err.providerStatus = upstream.status;
      err.providerCode = data?.error?.code || data?.error?.type || null;
      throw err;
    }

  const content = data?.choices?.[0]?.message?.content || data?.output_text || data?.response;
  return typeof content === 'string' ? content.trim() : null;
}

module.exports = async function handler(req, res) {
  if (req.method === 'GET' && req.query?.code) {
    const code = String(req.query.code).trim().toUpperCase();
    const service = SERVICES_SHARE.find(item => item.code === code);
    if (!service) return res.status(404).send('Service introuvable');

    const publicUrl = absoluteUrl(req, '/s/' + encodeURIComponent(service.code));
    const imageUrl = absoluteUrl(req, service.img);
    const title = service.name + ' — Bickri Service Agency';
    const description = service.desc;
    const html = '<!doctype html><html lang="fr"><head>' +
      '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<meta name="description" content="' + esc(description) + '">' +
      '<meta property="og:type" content="website"><meta property="og:site_name" content="Bickri Service Agency">' +
      '<meta property="og:title" content="' + esc(title) + '"><meta property="og:description" content="' + esc(description) + '">' +
      '<meta property="og:url" content="' + esc(publicUrl) + '"><meta property="og:image" content="' + esc(imageUrl) + '">' +
      '<meta property="og:image:alt" content="' + esc(title) + '"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">' +
      '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="' + esc(title) + '">' +
      '<meta name="twitter:description" content="' + esc(description) + '"><meta name="twitter:image" content="' + esc(imageUrl) + '">' +
      '<link rel="canonical" href="' + esc(publicUrl) + '"><title>' + esc(title) + '</title></head><body>' +
      '<h1>' + esc(service.name) + '</h1><p>' + esc(description) + '</p><p>Référence : ' + esc(service.code) + '</p>' +
      '<script>location.replace("/?service=" + encodeURIComponent(' + JSON.stringify('CODE_PLACEHOLDER') + '));</script>' +
      '</body></html>';

    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Cache-Control','public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(html.replace('CODE_PLACEHOLDER', service.code));
  }

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') return json(res, 405, {error:'Method not allowed'});

  const origin = String(req.headers.origin || '');
  if (origin && !/^https:\/\/([^/]+\.)?bickriservice-agency\.org$/i.test(origin) && !/^https:\/\/bickriservice-agency\.vercel\.app$/i.test(origin)) {
    return json(res, 403, {error:'Origine non autorisée.', code:'ORIGIN_BLOCKED'});
  }

  const limit = checkRateLimit(req);
  res.setHeader('X-RateLimit-Limit', String(RATE_LIMIT_MAX));
  res.setHeader('X-RateLimit-Remaining', limit.allowed ? String(Math.max(0, RATE_LIMIT_MAX - (rateBuckets.get('ai:' + getClientIp(req))?.count || 0))) : '0');
  res.setHeader('Retry-After', String(limit.retryAfter));
  if (!limit.allowed) return json(res, 429, {error:'Trop de requêtes. Veuillez réessayer dans quelques instants.', code:'RATE_LIMITED'});

  const turnstileToken = typeof req.body?.turnstileToken === 'string' ? req.body.turnstileToken.trim() : '';
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  if (!turnstileSecret || !turnstileToken) return json(res, 403, {error:'Vérification anti-robot requise.', code:'TURNSTILE_REQUIRED'});
  try {
    const verifyBody = new URLSearchParams({secret:turnstileSecret,response:turnstileToken});
    const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    if (forwarded) verifyBody.set('remoteip', forwarded);
    const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:verifyBody});
    const verifyData = await verifyResponse.json().catch(() => ({}));
    if (!verifyResponse.ok || !verifyData.success) return json(res, 403, {error:'Vérification anti-robot refusée.', code:'TURNSTILE_INVALID'});
  } catch (error) {
    console.error('Bickri AI Turnstile error:', error);
    return json(res, 503, {error:'Service de vérification temporairement indisponible.', code:'TURNSTILE_UNAVAILABLE'});
  }

  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!message) return json(res, 400, {error:'Message required'});
  if (message.length > 2000) return json(res, 400, {error:'Message too long'});

  const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
  const endpoint = process.env.AI_API_URL || 'https://api.openai.com/v1/responses';
  const model = process.env.OPENAI_MODEL || process.env.AI_MODEL || 'gpt-6-luna';
  const cookie = String(req.headers.cookie || '');
  const cookieMatch = cookie.match(/(?:^|;\\s*)bickri_ai_session=([a-zA-Z0-9_-]{16,80})/);
  let sessionId = cleanSessionId(req.body?.sessionId) || cleanSessionId(cookieMatch?.[1]);
  if (!sessionId) {
    sessionId = 'bsa_' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().replace(/-/g,'') : (Date.now().toString(36) + Math.random().toString(36).slice(2))).slice(0,60);
    res.setHeader('Set-Cookie','bickri_ai_session=' + sessionId + '; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax');
  }

  const history = Array.isArray(req.body?.history) ? req.body.history.slice(-8) : [];
  const safeHistory = history
    .filter(x => x && (x.role === 'user' || x.role === 'assistant') && typeof x.content === 'string')
    .map(x => ({role:x.role, content:x.content.slice(0, 2000)}));

  const [db, memory] = await Promise.all([
    loadKnowledge().catch(error => {
      console.error('Bickri AI knowledge load failed', error);
      return {knowledge:[], services:[]};
    }),
    loadMemory(sessionId).catch(error => {
      console.error('Bickri AI memory load failed', error);
      return [];
    })
  ]);

  for (const [keyName, value] of extractExplicitMemory(message)) {
    await saveMemory(sessionId, keyName, value);
  }

  if (sessionId) await saveConversation(sessionId, 'user', message);

  const systemPrompt = BASE_SYSTEM_PROMPT + buildKnowledgeContext(db) + buildMemoryContext(memory);

  if (!apiKey) {
    console.error('Bickri AI configuration error: OPENAI_API_KEY/AI_API_KEY is missing');
    return json(res, 503, {
      error:'Service IA temporairement indisponible.',
      code:'AI_KEY_MISSING',
      knowledgeLoaded:db.knowledge.length > 0
    });
  }

  if (!model) {
    console.error('Bickri AI configuration error: model is missing');
    return json(res, 503, {
      error:'Service IA temporairement indisponible.',
      code:'AI_MODEL_MISSING',
      knowledgeLoaded:db.knowledge.length > 0
    });
  }

  try {
    const answer = await callProvider(endpoint, apiKey, model, systemPrompt, safeHistory, message);
    if (!answer) {
      console.error('Bickri AI provider returned an empty response');
      return json(res, 502, {
        error:'Le fournisseur IA n’a pas retourné de réponse.',
        code:'AI_EMPTY_RESPONSE',
        knowledgeLoaded:db.knowledge.length > 0
      });
    }

    res.setHeader('Cache-Control','no-store');
    if (sessionId) await saveConversation(sessionId, 'assistant', answer);
    return json(res, 200, {
      answer,
      mode:'openai',
      knowledgeLoaded:db.knowledge.length > 0,
      servicesLoaded:db.services.length
    });
  } catch (error) {
    console.error('Bickri AI request failed', {
      message:error?.message,
      providerStatus:error?.providerStatus,
      providerCode:error?.providerCode
    });
    return json(res, 502, {
      error:'Le service IA est temporairement indisponible. Vérifiez la configuration du fournisseur IA.',
      code:'AI_PROVIDER_ERROR',
      providerStatus: Number.isInteger(error?.providerStatus) ? error.providerStatus : undefined,
      providerCode: error?.providerCode || undefined,
      knowledgeLoaded:db.knowledge.length > 0
    });
  }
};
