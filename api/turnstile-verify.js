const buckets = globalThis.__bickriTurnstileBuckets || new Map();
globalThis.__bickriTurnstileBuckets = buckets;
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 20;

function getClientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || String(req.headers['x-real-ip'] || '').trim() || 'unknown';
}

function allowedOrigin(origin) {
  return !origin || /^https:\/\/([^/]+\.)?bickriservice-agency\.org$/i.test(origin) || /^https:\/\/bickriservice-agency\.vercel\.app$/i.test(origin);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', 'https://bickriservice-agency.org');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }
  if (req.method !== 'POST') return res.status(405).json({success:false,error:'Method not allowed'});

  const origin = String(req.headers.origin || '');
  if (!allowedOrigin(origin)) return res.status(403).json({success:false,error:'Origine non autorisée'});

  const ip = getClientIp(req);
  const now = Date.now();
  const current = buckets.get(ip);
  if (!current || now - current.startedAt >= WINDOW_MS) {
    buckets.set(ip, {startedAt: now, count: 1});
  } else {
    current.count++;
    if (buckets.size > 5000) {
      for (const [key, value] of buckets) {
        if (now - value.startedAt >= WINDOW_MS) buckets.delete(key);
      }
    }
    if (current.count > MAX_REQUESTS) {
      res.setHeader('Retry-After', '60');
      return res.status(429).json({success:false,error:'Trop de requêtes. Veuillez réessayer plus tard.'});
    }
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return res.status(500).json({success:false,error:'Service de vérification indisponible'});
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return res.status(400).json({success:false,error:'Requête invalide'});

  const token = String(req.body.token || '').trim();
  if (!token || token.length > 2048) return res.status(400).json({success:false,error:'Token Turnstile invalide'});

  try {
    const body = new URLSearchParams({secret,response:token});
    if (ip !== 'unknown') body.set('remoteip', ip);
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body
    });
    const data = await r.json().catch(()=>({success:false}));
    if (!r.ok || !data.success) return res.status(403).json({success:false,error:'Vérification Turnstile refusée'});
    return res.status(200).json({success:true});
  } catch (error) {
    console.error('Turnstile verification failed:', error?.message || error);
    return res.status(502).json({success:false,error:'Service de vérification indisponible'});
  }
};
