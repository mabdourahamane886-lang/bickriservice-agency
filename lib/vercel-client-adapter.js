import { handleClientApi } from './agency-client.js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://okdohokhlkxrmxpevees.supabase.co';

const secureJson = (_request, payload, status=200, extra={}) => new Response(
  status===204 ? null : JSON.stringify(payload),
  {status,headers:{
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff',
    'Referrer-Policy':'strict-origin-when-cross-origin',
    ...extra
  }}
);

function allowedOrigin(request){
  const origin=request.headers.get('Origin');
  if(!origin)return true;
  try{
    const o=new URL(origin);
    const u=new URL(request.url);
    return o.protocol==='https:' && o.hostname===u.hostname && o.port===u.port;
  }catch{return false}
}

async function requireAuth(request,env){
  const key=env.SUPABASE_SERVICE_ROLE_KEY;
  const match=(request.headers.get('Authorization')||'').match(/^Bearer\s+(.+)$/i);
  if(!match||match[1].length>8192)return {error:secureJson(request,{error:'Connectez-vous pour accéder à cet espace.'},401)};
  try{
    const r=await fetch(SUPABASE_URL+'/auth/v1/user',{
      headers:{apikey:key,Authorization:'Bearer '+match[1]}
    });
    const user=await r.json().catch(()=>({}));
    if(!r.ok||!user.id||!user.email)return {error:secureJson(request,{error:'Session invalide ou expirée.'},401)};
    return {user,key};
  }catch{
    return {error:secureJson(request,{error:'Authentification temporairement indisponible.'},503)};
  }
}

async function db(path,key,options={}){
  const headers=new Headers(options.headers||{});
  headers.set('apikey',key);
  headers.set('Authorization','Bearer '+key);
  headers.set('Content-Type','application/json');
  const r=await fetch(SUPABASE_URL+'/rest/v1/'+path,{...options,headers});
  if(!r.ok)throw new Error('Supabase HTTP '+r.status);
  return r;
}

async function verifyTurnstile(request,token,env){
  if(!env.TURNSTILE_SECRET_KEY)return {ok:false,configured:false};
  if(typeof token!=='string'||!token||token.length>2048)return {ok:false,configured:true};
  try{
    const body=new URLSearchParams({secret:env.TURNSTILE_SECRET_KEY,response:token});
    const ip=request.headers.get('x-vercel-forwarded-for')||request.headers.get('x-forwarded-for');
    if(ip)body.set('remoteip',String(ip).split(',')[0].trim());
    const r=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
      method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body
    });
    const data=await r.json().catch(()=>({success:false}));
    const target=new URL(request.url).hostname.toLowerCase();
    const allow=String(env.TURNSTILE_HOSTNAMES||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
    return {ok:Boolean(r.ok&&data.success&&data.hostname?.toLowerCase()===target&&(!allow.length||allow.includes(target))),configured:true};
  }catch{return {ok:false,configured:true}}
}

function makeRequest(req){
  const host=String(req.headers.host||'bickriservice-agency-bickri-service-agency.vercel.app').replace(/[^A-Za-z0-9.:-]/g,'');
  const url='https://'+host+req.url;
  const headers=new Headers();
  for(const [name,value] of Object.entries(req.headers||{})){
    if(value===undefined)continue;
    try{headers.set(name,Array.isArray(value)?value.join(', '):String(value));}catch{}
  }
  let body;
  if(req.method!=='GET'&&req.method!=='HEAD'&&req.method!=='OPTIONS')body=typeof req.body==='string'?req.body:JSON.stringify(req.body??{});
  // Content-Length and transfer-encoding are set by the platform; don't forward them
  // into the synthesized Fetch Request (their values may differ from serialized body).
  headers.delete('content-length');headers.delete('transfer-encoding');
  return new Request(url,{method:req.method,headers,body});
}

export default async function vercelClientHandler(req,res){
  try{
    const request=makeRequest(req);
    const env={SUPABASE_SERVICE_ROLE_KEY:process.env.SUPABASE_SERVICE_ROLE_KEY,TURNSTILE_SECRET_KEY:process.env.TURNSTILE_SECRET_KEY,TURNSTILE_HOSTNAMES:process.env.TURNSTILE_HOSTNAMES};
    const out=await handleClientApi(request,env,{allowedOrigin,requireAuth,db,verifyTurnstile,json:secureJson});
    if(!out)return res.status(404).json({error:'Route introuvable.'});
    for(const [key,value] of out.headers.entries())res.setHeader(key,value);
    if(out.status===204)return res.status(204).end();
    return res.status(out.status).send(await out.text());
  }catch(error){
    console.error('Vercel client endpoint:',error?.message||'unknown');
    return res.status(500).json({error:'Une erreur serveur est survenue.'});
  }
}
