module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({success:false,error:'Method not allowed'});
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return res.status(500).json({success:false,error:'TURNSTILE_SECRET_KEY manquante'});
  const token = String((req.body||{}).token||'').trim();
  if (!token) return res.status(400).json({success:false,error:'Token Turnstile manquant'});
  try {
    const ip = String(req.headers['x-forwarded-for']||'').split(',')[0].trim();
    const body = new URLSearchParams({secret,response:token});
    if (ip) body.set('remoteip',ip);
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body});
    const data = await r.json().catch(()=>({success:false}));
    if (!r.ok || !data.success) return res.status(403).json({success:false,error:'Vérification Turnstile refusée'});
    return res.status(200).json({success:true});
  } catch (error) {
    console.error('Turnstile verification failed:',error);
    return res.status(502).json({success:false,error:'Service de vérification indisponible'});
  }
};
