const SITE_VERSION = '2026-09-18-github-rebuild-1';
const ASSET_VERSION = '2026-09-18-github-rebuild-1';
const SUPABASE_URL = 'https://okdohokhlkxrmxpevees.supabase.co';
const SERVICES = ['Création web','E-commerce','Réseaux sociaux','Intelligence artificielle','Branding & design','Publicité digitale','Formation & coaching'];

const SYSTEM_PROMPT = `Tu es Bickri AI, l'assistant officiel de Bickri Service Agency, agence digitale basée à Niamey, Niger.
MISSION: répondre clairement aux visiteurs à propos des services de l'agence et les orienter vers une demande de projet.
SERVICES: ${SERVICES.join(', ')}.
CONTACT: utilise la messagerie WhatsApp du site ou bickriserviceagency@gmail.com. Ne communique pas de numéro de téléphone.
REGLES: reste dans le périmètre de Bickri Service Agency. Ne fabrique pas de tarifs, délais, garanties, clients ou résultats non fournis. Pour un prix exact, indique que le devis est personnalisé. Réponds en français sauf si l'utilisateur écrit clairement dans une autre langue. Ton professionnel, chaleureux et concis.`;

function json(body,status=200,extra={}){const h=new Headers({'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type',...extra});return new Response(JSON.stringify(body),{status,headers:h})}
function isUuid(v){return typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)}
function getSessionId(req){const c=req.headers.get('Cookie')||'';const m=c.match(/(?:^|;\\s*)bickri_ai_session=([^;]+)/i);return m&&isUuid(m[1])?m[1]:null}
async function supabaseRequest(path,key,opt={}){if(!key)return null;const h=new Headers(opt.headers||{});h.set('apikey',key);h.set('Authorization',`Bearer ${key}`);h.set('Content-Type','application/json');const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...opt,headers:h});if(!r.ok)throw new Error(`Supabase ${r.status}`);return r}
async function ensureConversation(sessionId,key){if(!key||!sessionId)return null;const r=await supabaseRequest('agency_ai_conversations?on_conflict=session_id',key,{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify({session_id:sessionId,updated_at:new Date().toISOString()})});const rows=await r.json().catch(()=>[]);return rows?.[0]?.id||null}
async function loadConversationHistory(id,key){if(!key||!id)return[];const r=await supabaseRequest(`agency_ai_messages?conversation_id=eq.${encodeURIComponent(id)}&select=role,content&order=created_at.desc&limit=8`,key,{method:'GET'});const rows=await r.json().catch(()=>[]);return Array.isArray(rows)?rows.reverse().filter(x=>(x?.role==='user'||x?.role==='assistant')&&typeof x?.content==='string').map(x=>({role:x.role,content:x.content.slice(0,2000)})):[]}
async function saveConversationExchange(id,key,user,assistant){if(!key||!id)return;await supabaseRequest('agency_ai_messages',key,{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify([{conversation_id:id,role:'user',content:user.slice(0,4000)},{conversation_id:id,role:'assistant',content:assistant.slice(0,4000)}])});await supabaseRequest(`agency_ai_conversations?id=eq.${encodeURIComponent(id)}`,key,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({updated_at:new Date().toISOString()})})}
function secureCookie(id){return `bickri_ai_session=${id}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`}

export default {async fetch(request,env,ctx){
  const url=new URL(request.url);
  if(url.pathname==='/api/bickri-ai'){
    if(request.method==='OPTIONS')return json({},204);
    if(request.method!=='POST')return json({error:'Method not allowed'},405);
    const apiKey=env.AI_API_KEY, endpoint=env.AI_API_URL, model=env.AI_MODEL;
    if(!apiKey||!endpoint||!model)return json({error:'AI provider not configured'},503);
    let body;try{body=await request.json()}catch{return json({error:'Invalid JSON body'},400)}
    const message=typeof body?.message==='string'?body.message.trim():'';
    if(!message)return json({error:'Message required'},400);
    if(message.length>2000)return json({error:'Message too long'},400);
    const clientHistory=Array.isArray(body?.history)?body.history.slice(-8).filter(x=>x&&(x.role==='user'||x.role==='assistant')&&typeof x.content==='string').map(x=>({role:x.role,content:x.content.slice(0,2000)})):[];
    let sessionId=getSessionId(request),conversationId=null,storedHistory=[];
    const supabaseKey=env.SUPABASE_SERVICE_ROLE_KEY;
    if(!sessionId&&supabaseKey)sessionId=crypto.randomUUID();
    if(supabaseKey&&sessionId){try{conversationId=await ensureConversation(sessionId,supabaseKey);storedHistory=await loadConversationHistory(conversationId,supabaseKey)}catch(e){console.error('Supabase persistence read failed',e)}}
    const history=storedHistory.length?storedHistory:clientHistory;
    try{
      const upstream=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},body:JSON.stringify({model,temperature:.2,messages:[{role:'system',content:SYSTEM_PROMPT},...history,{role:'user',content:message}]})});
      const data=await upstream.json().catch(()=>({}));
      if(!upstream.ok)return json({error:'AI provider error'},502);
      const answer=data?.choices?.[0]?.message?.content||data?.output_text||data?.response;
      if(typeof answer!=='string'||!answer.trim())return json({error:'Empty AI response'},502);
      const finalAnswer=answer.trim();
      if(ctx?.waitUntil&&supabaseKey&&conversationId)ctx.waitUntil(saveConversationExchange(conversationId,supabaseKey,message,finalAnswer).catch(e=>console.error('Supabase persistence write failed',e)));
      const headers={};if(sessionId&&!getSessionId(request))headers['Set-Cookie']=secureCookie(sessionId);
      return json({answer:finalAnswer,version:SITE_VERSION,persistence:Boolean(supabaseKey&&conversationId)},200,headers);
    }catch{return json({error:'AI request failed'},502)}
  }
  if(url.pathname==='/api/site-version')return json({version:SITE_VERSION,assets:ASSET_VERSION,platform:'Cloudflare Workers'});
  const response=await env.ASSETS.fetch(request);
  const headers=new Headers(response.headers);
  if(url.pathname==='/'||url.pathname==='/index.html'){
    headers.set('Content-Type','text/html; charset=utf-8');
    headers.set('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    headers.set('Pragma','no-cache');headers.set('Expires','0');
  }
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}};