const allowed=/^https:\/\/([^/]+\.)?bickriservice-agency\.org$|^https:\/\/bickriservice-agency\.vercel\.app$/i;
const attempts=new Map();
function clientIp(req){return String(req.headers['x-forwarded-for']||'').split(',')[0].trim()||String(req.headers['x-real-ip']||'').trim()||'unknown';}
function rate(req){const k=clientIp(req),n=Date.now(),v=attempts.get(k);if(!v||n-v.t>60000){attempts.set(k,{t:n,c:1});return true;}v.c++;return v.c<=30;}
const buckets = globalThis.__bickriTurnstileBuckets || new Map();
globalThis.__bickriTurnstileBuckets = buckets;

function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (req.method !== 'POST') return res.status(405).json({success:false,error:'Method not allowed'});
const origin=String(req.headers.origin||'');
if(origin&&!allowed.test(origin))return res.status(403).json({success:false,error:'Origine non autorisée'});
if(!rate(req))return res.status(429).json({success:false,error:'Trop de tentatives'});
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return res.status(500).json({success:false,error:'TURNSTILE_SECRET_KEY manquante'});
  const origin = String(req.headers.origin || '');
  if (origin && !/^https:\/\/([^/]+\.)?bickriservice-agency\.org$/i.test(origin) && !/^https:\/\/bickriservice-agency\.vercel\.app$/i.test(origin)) return res.status(403).json({success:false,error:'Origine non autorisée'});
  const ip = clientIp(req);
  const now = Date.now();
  const current = buckets.get(ip);
  if (!current || now - current.startedAt >= 60000) buckets.set(ip, {startedAt:now,count:1});
  else { current.count += 1; if (current.count > 20) return res.status(429).json({success:false,error:'Trop de requêtes'}); }
  const token = String((req.body||{}).token||'').trim();
  if (!token) return res.status(400).json({success:false,error:'Token Turnstile manquant'});
  try {
    const body = new URLSearchParams({secret,response:token});
    if (ip) body.set('remoteip',ip);
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body});
    const data = await r.json().catch(()=>({success:false}));
    const allowed = String(process.env.TURNSTILE_HOSTNAMES || 'bickriservice-agency.org,bickriservice-agency.vercel.app').split(',').map(x => x.trim()).filter(Boolean);
    if (!r.ok || !data.success || (data.hostname && !allowed.includes(data.hostname))) return res.status(403).json({success:false,error:'Vérification Turnstile refusée'});
    return res.status(200).json({success:true});
  } catch (error) {
    console.error('Turnstile verification failed:',error);
    return res.status(502).json({success:false,error:'Service de vérification indisponible'});
  }
};
