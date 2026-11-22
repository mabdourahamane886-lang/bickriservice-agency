// API privée de l'espace client. Fonctions existantes du Worker réutilisées
// afin de conserver ses règles CORS, Turnstile, authentification et Supabase.
const LIMITS = globalThis.__bsaClientLimits || new Map();
globalThis.__bsaClientLimits = LIMITS;
const FIELDS = 'id,request_code,kind,full_name,company,phone,service_slug,budget,description,preferred_at,payment_preference,status,quote_amount_xof,admin_message,created_at,updated_at';
const STATUSES = ['new','reviewing','quoted','in_progress','completed','cancelled'];
const str = (v, n) => typeof v === 'string' ? v.trim().slice(0,n) : '';
const validUuid = value => typeof value==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
function rateLimit(request) {
  const ip=request.headers.get('CF-Connecting-IP') || 'unknown';
  const now=Date.now(), old=LIMITS.get(ip);
  if(!old || now-old.start>3600000) LIMITS.set(ip,{start:now,count:1});
  else old.count+=1;
  if(LIMITS.size>4000) for(const [k,v] of LIMITS) if(now-v.start>3600000) LIMITS.delete(k);
  return LIMITS.get(ip).count<=8;
}
async function readBody(request, max=18000) {
  if(Number(request.headers.get('content-length')||0)>max) throw new Error('BODY_SIZE');
  const raw=await request.text();
  if(raw.length>max) throw new Error('BODY_SIZE');
  try { return JSON.parse(raw); } catch { throw new Error('BODY_JSON'); }
}
async function records(db,key,path) {
  const r=await db(path,key,{method:'GET'});
  return r.json();
}
export async function handleClientApi(request,env,helpers) {
  const url=new URL(request.url);
  if(!url.pathname.startsWith('/api/client/')) return null;
  const {allowedOrigin,requireAuth,db,isAdmin,verifyTurnstile,json}=helpers;
  const reply=(data,status=200,extra={})=>json(request,data,status,extra);
  if(!allowedOrigin(request)) return reply({error:'Origine non autorisée.'},403);
  if(request.method==='OPTIONS') return reply({},204);
  if(!env.SUPABASE_SERVICE_ROLE_KEY) return reply({error:'Espace client indisponible : configuration serveur incomplète.'},503);
  const auth=await requireAuth(request,env);
  if(auth.error)return auth.error;
  const {user,key}=auth;
  if(url.pathname==='/api/client/me' && request.method==='GET') {
    let admin=false;
    try {
      const rows=await records(db,key,`bickri_admin_users?user_id=eq.${encodeURIComponent(user.id)}&select=user_id&limit=1`);
      admin=Array.isArray(rows)&&rows.length>0;
    }catch{}
    return reply({email:user.email,isAdmin:admin});
  }
  if(url.pathname==='/api/client/requests') {
    if(request.method==='GET') {
      try {
        const rows=await records(db,key,`agency_client_requests?user_id=eq.${encodeURIComponent(user.id)}&select=${FIELDS}&order=created_at.desc&limit=100`);
        return reply({requests:rows});
      }catch(error){console.error('client requests get',error.message);return reply({error:'Impossible de charger vos demandes.'},503)}
    }
    if(request.method==='POST') {
      if(!rateLimit(request))return reply({error:'Limite de demandes atteinte. Réessayez plus tard.'},429);
      let p;try{p=await readBody(request)}catch{return reply({error:'Données invalides ou trop volumineuses.'},400)}
      const name=str(p.full_name,120), description=str(p.description,5001);
      const slug=str(p.service_slug,100),kind=str(p.kind,20);
      if(p.consent!==true || name.length<2 || description.length<10 || description.length>5000 || !/^[a-z0-9-]{2,100}$/.test(slug) || !['devis','rendezvous'].includes(kind)){
        return reply({error:'Complétez le nom, le service, la description et le consentement.'},400);
      }
      let preferred=null;
      if(p.preferred_at) {
        const d=new Date(p.preferred_at);
        if(!Number.isFinite(d.valueOf()) || d.getTime()<Date.now()-3600000 || d.getTime()>Date.now()+366*86400000) return reply({error:'Date souhaitée invalide.'},400);
        preferred=d.toISOString();
      }
      if(kind==='rendezvous'&&!preferred)return reply({error:'Choisissez une date et une heure souhaitées.'},400);
      const captcha=await verifyTurnstile(request,p.turnstileToken,env,null);
      if(!captcha.ok)return reply({error:captcha.configured?'Vérification anti-robot invalide.':'Vérification anti-robot indisponible.'},captcha.configured?403:503);
      const record={
        request_code:'BSA-'+new Date().toISOString().slice(0,10).replace(/-/g,'')+'-'+crypto.randomUUID().slice(0,8).toUpperCase(),
        user_id:user.id,kind,full_name:name,company:str(p.company,150),phone:str(p.phone,40),
        service_slug:slug,budget:str(p.budget,100),description,preferred_at:preferred,
        payment_preference:str(p.payment_preference,50)
      };
      try{
        const r=await db('agency_client_requests',key,{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(record)});
        const saved=(await r.json())[0];
        return reply({ok:true,request:{id:saved.id,code:saved.request_code,status:saved.status}},201);
      }catch(error){console.error('client request save',error.message);return reply({error:'Enregistrement indisponible. Votre demande n’a pas été enregistrée.'},503)}
    }
    return reply({error:'Méthode non autorisée.'},405);
  }
  if(url.pathname==='/api/client/notifications') {
    if(request.method==='GET'){
      try{
        const items=await records(db,key,`agency_client_notifications?user_id=eq.${encodeURIComponent(user.id)}&select=id,request_id,title,message,read_at,created_at&order=created_at.desc&limit=60`);
        return reply({notifications:items});
      }catch(error){console.error('client notifications get',error.message);return reply({error:'Notifications indisponibles.'},503)}
    }
    if(request.method==='PATCH'){
      let p;try{p=await readBody(request,1000)}catch{return reply({error:'Données invalides.'},400)}
      if(!validUuid(p.id))return reply({error:'Identifiant invalide.'},400);
      try{
        await db(`agency_client_notifications?id=eq.${encodeURIComponent(p.id)}&user_id=eq.${encodeURIComponent(user.id)}`,key,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({read_at:new Date().toISOString()})});
        return reply({ok:true});
      }catch{return reply({error:'Impossible de marquer cette notification.'},503)}
    }
    return reply({error:'Méthode non autorisée.'},405);
  }
  if(url.pathname==='/api/client/admin/requests') {
    let admin=false;
    try{
      const rows=await records(db,key,`bickri_admin_users?user_id=eq.${encodeURIComponent(user.id)}&select=user_id&limit=1`);
      admin=Array.isArray(rows)&&rows.length>0;
    }catch{}
    if(!admin)return reply({error:'Accès réservé à l’administration.'},403);
    if(request.method==='GET'){
      try {
        const rows=await records(db,key,`agency_client_requests?select=${FIELDS},user_id&order=created_at.desc&limit=150`);
        return reply({requests:rows});
      }catch(error){console.error('admin requests get',error.message);return reply({error:'Impossible de charger les dossiers.'},503)}
    }
    if(request.method==='PATCH'){
      let p;try{p=await readBody(request,5000)}catch{return reply({error:'Données invalides.'},400)}
      if(!validUuid(p.id)||!STATUSES.includes(p.status))return reply({error:'Identifiant ou statut invalide.'},400);
      if(p.quote_amount_xof!==null&&p.quote_amount_xof!==undefined&&(!Number.isSafeInteger(p.quote_amount_xof)||p.quote_amount_xof<0||p.quote_amount_xof>1000000000))return reply({error:'Montant invalide.'},400);
      if(typeof p.admin_message!=='string'||p.admin_message.length>2500)return reply({error:'Message invalide.'},400);
      try{
        const before=await records(db,key,`agency_client_requests?id=eq.${encodeURIComponent(p.id)}&select=id,user_id,status&limit=1`);
        if(!before.length)return reply({error:'Dossier introuvable.'},404);
        const patch={status:p.status,admin_message:p.admin_message.trim(),quote_amount_xof:p.quote_amount_xof??null,updated_at:new Date().toISOString()};
        await db(`agency_client_requests?id=eq.${encodeURIComponent(p.id)}`,key,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify(patch)});
        try{
          await db('agency_client_notifications',key,{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({
            user_id:before[0].user_id,request_id:p.id,title:'Mise à jour de votre demande',
            message:'Votre demande a été mise à jour. Connectez-vous à votre espace client pour consulter son statut et la réponse de l’agence.'
          })});
        }catch(error){console.error('notification failed',error.message)}
        return reply({ok:true});
      }catch(error){console.error('admin request patch',error.message);return reply({error:'La mise à jour a échoué.'},503)}
    }
    return reply({error:'Méthode non autorisée.'},405);
  }
  return reply({error:'API inconnue.'},404);
}
