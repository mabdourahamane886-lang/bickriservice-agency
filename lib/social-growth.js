const SUPABASE_URL='https://okdohokhlkxrmxpevees.supabase.co';
const PLATFORMS=new Set(['facebook','x','instagram','youtube','tiktok']);
const GOALS=new Set(['visibility','engagement','audience','leads','sales']);
const RATE_WINDOW=60_000;
const generateBuckets=globalThis.__bickriSocialGrowthBuckets||new Map();
globalThis.__bickriSocialGrowthBuckets=generateBuckets;

function json(body,status=200,origin=''){
  const headers={
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff',
    'Referrer-Policy':'strict-origin-when-cross-origin',
    'X-Frame-Options':'SAMEORIGIN'
  };
  if(origin){headers['Access-Control-Allow-Origin']=origin;headers['Access-Control-Allow-Methods']='GET, POST, PUT, OPTIONS';headers['Access-Control-Allow-Headers']='Authorization, Content-Type, Accept';headers['Access-Control-Max-Age']='86400';headers.Vary='Origin';}
  return new Response(status===204?null:JSON.stringify(body),{status,headers});
}
function allowedOrigin(request){
  const origin=request.headers.get('Origin');if(!origin)return true;
  try{
    const u=new URL(origin),h=u.hostname.toLowerCase();
    return u.protocol==='https:'&&(h==='bickriservice-agency.org'||h.endsWith('.bickriservice-agency.org')||h==='bickriservice-agency.vercel.app'||h.endsWith('-bickri-service-agency.vercel.app')||h==='bickriservice-agency.bickriserviceagency.dev');
  }catch{return false;}
}
function originFor(request){return request.headers.get('Origin')||'';}
async function sb(path,env,options={}){
  const key=env.SUPABASE_SERVICE_ROLE_KEY;
  if(!key)throw new Error('SUPABASE_NOT_CONFIGURED');
  const headers=new Headers(options.headers||{});
  headers.set('apikey',key);headers.set('Authorization','Bearer '+key);headers.set('Content-Type','application/json');
  const response=await fetch(SUPABASE_URL+'/rest/v1/'+path,{...options,headers});
  if(!response.ok){const body=await response.text().catch(()=> '');throw new Error('SUPABASE_'+response.status+':'+body.slice(0,300));}
  if(response.status===204)return [];
  return response.json().catch(()=>[]);
}
async function partnerContext(request,env){
  const key=env.SUPABASE_SERVICE_ROLE_KEY;
  if(!key)return {error:json({error:'Le service partenaire est temporairement indisponible.',code:'SUPABASE_NOT_CONFIGURED'},503,originFor(request))};
  const token=(request.headers.get('Authorization')||'').match(/^Bearer\s+(.+)$/i)?.[1];
  if(!token||token.length>8192)return {error:json({error:'Connectez-vous à votre espace partenaire.',code:'AUTH_REQUIRED'},401,originFor(request))};
  const auth=await fetch(SUPABASE_URL+'/auth/v1/user',{headers:{apikey:key,Authorization:'Bearer '+token}});
  const user=await auth.json().catch(()=>({}));
  if(!auth.ok||!user?.id||!user?.email)return {error:json({error:'Session expirée. Reconnectez-vous.',code:'AUTH_INVALID'},401,originFor(request))};
  if(!user.email_confirmed_at)return {error:json({error:'Confirmez votre adresse e-mail avant de continuer.',code:'EMAIL_NOT_CONFIRMED'},403,originFor(request))};
  const rows=await sb('agency_partners?owner_user_id=eq.'+encodeURIComponent(user.id)+'&active=eq.true&select=id,name,slug,owner_user_id&limit=1',env);
  const partner=Array.isArray(rows)?rows[0]:null;
  if(!partner)return {error:json({error:'Aucun profil partenaire actif n’est associé à ce compte.',code:'PARTNER_NOT_FOUND'},403,originFor(request))};
  return {user,partner};
}
function bytesToBase64(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s);}
function base64ToBytes(value){const s=atob(value);return Uint8Array.from(s,c=>c.charCodeAt(0));}
function randomString(size=32){const bytes=crypto.getRandomValues(new Uint8Array(size));return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');}
async function sha256(value){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return bytesToBase64(new Uint8Array(digest)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
async function pkce(){
  const verifier=randomString(48);
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier));
  return {verifier,challenge:bytesToBase64(new Uint8Array(digest)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
}
async function encryptToken(token,env){
  const encoded=env.SOCIAL_TOKEN_ENCRYPTION_KEY;
  if(!encoded)throw new Error('SOCIAL_TOKEN_ENCRYPTION_KEY_MISSING');
  const raw=base64ToBytes(encoded);
  if(raw.byteLength!==32)throw new Error('SOCIAL_TOKEN_ENCRYPTION_KEY_INVALID');
  const key=await crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['encrypt']);
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(token));
  const combined=new Uint8Array(iv.length+cipher.byteLength);combined.set(iv);combined.set(new Uint8Array(cipher),iv.length);
  return bytesToBase64(combined);
}
async function decryptToken(value,env){
  const raw=base64ToBytes(env.SOCIAL_TOKEN_ENCRYPTION_KEY||'');
  if(raw.byteLength!==32)throw new Error('SOCIAL_TOKEN_ENCRYPTION_KEY_INVALID');
  const combined=base64ToBytes(value),iv=combined.slice(0,12),cipher=combined.slice(12);
  const key=await crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['decrypt']);
  const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,cipher);
  return new TextDecoder().decode(plain);
}
function providerReady(platform,env){
  if(platform==='facebook'||platform==='instagram')return Boolean(env.META_APP_ID&&env.META_APP_SECRET&&/^v\d+\.\d+$/.test(env.META_GRAPH_API_VERSION||''));
  if(platform==='x')return Boolean(env.X_CLIENT_ID&&env.X_CLIENT_SECRET);
  if(platform==='youtube')return Boolean(env.GOOGLE_CLIENT_ID&&env.GOOGLE_CLIENT_SECRET);
  if(platform==='tiktok')return Boolean(env.TIKTOK_CLIENT_KEY&&env.TIKTOK_CLIENT_SECRET);
  return false;
}
function callbackUri(platform,request,env){
  const base=String(env.SOCIAL_GROWTH_BASE_URL||new URL(request.url).origin).replace(/\/$/,'');
  return base+'/api/social-growth/oauth/callback/'+platform;
}
function scopesFor(platform){
  if(platform==='facebook')return ['pages_show_list','pages_read_engagement','pages_manage_posts'];
  if(platform==='instagram')return ['pages_show_list','pages_read_engagement','instagram_basic','instagram_content_publish','instagram_manage_insights'];
  if(platform==='x')return ['tweet.read','tweet.write','users.read','offline.access'];
  if(platform==='youtube')return ['openid','email','profile','https://www.googleapis.com/auth/youtube.readonly','https://www.googleapis.com/auth/yt-analytics.readonly','https://www.googleapis.com/auth/youtube.upload'];
  return ['user.info.basic','user.info.profile','user.info.stats','video.list','video.publish'];
}
async function oauthStart(request,env,context,platform){
  if(!PLATFORMS.has(platform))return json({error:'Plateforme non prise en charge.'},400,originFor(request));
  if(!providerReady(platform,env))return json({error:'Configuration requise : les identifiants développeur de cette plateforme ne sont pas encore configurés dans Cloudflare.',code:'PROVIDER_NOT_CONFIGURED'},503,originFor(request));
  if(!env.SOCIAL_TOKEN_ENCRYPTION_KEY)return json({error:'Le chiffrement sécurisé des jetons doit être configuré avant toute connexion.',code:'TOKEN_ENCRYPTION_NOT_CONFIGURED'},503,originFor(request));
  const state=randomString(32),stateHash=await sha256(state),challenge=await pkce(),redirectUri=callbackUri(platform,request,env),scopes=scopesFor(platform);
  await sb('brand_social_oauth_states',env,{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({partner_id:context.partner.id,user_id:context.user.id,platform,state_hash:stateHash,code_verifier:challenge.verifier,redirect_uri:redirectUri,expires_at:new Date(Date.now()+10*60_000).toISOString()})});
  let authUrl;
  if(platform==='facebook'||platform==='instagram'){
    const u=new URL('https://www.facebook.com/'+env.META_GRAPH_API_VERSION+'/dialog/oauth');
    u.searchParams.set('client_id',env.META_APP_ID);u.searchParams.set('redirect_uri',redirectUri);u.searchParams.set('response_type','code');u.searchParams.set('state',state);u.searchParams.set('scope',scopes.join(','));
    authUrl=u.href;
  }else if(platform==='x'){
    const u=new URL('https://x.com/i/oauth2/authorize');
    u.searchParams.set('response_type','code');u.searchParams.set('client_id',env.X_CLIENT_ID);u.searchParams.set('redirect_uri',redirectUri);u.searchParams.set('scope',scopes.join(' '));u.searchParams.set('state',state);u.searchParams.set('code_challenge',challenge.challenge);u.searchParams.set('code_challenge_method','S256');authUrl=u.href;
  }else if(platform==='youtube'){
    const u=new URL('https://accounts.google.com/o/oauth2/v2/auth');
    u.searchParams.set('client_id',env.GOOGLE_CLIENT_ID);u.searchParams.set('redirect_uri',redirectUri);u.searchParams.set('response_type','code');u.searchParams.set('scope',scopes.join(' '));u.searchParams.set('access_type','offline');u.searchParams.set('prompt','consent');u.searchParams.set('state',state);u.searchParams.set('code_challenge',challenge.challenge);u.searchParams.set('code_challenge_method','S256');authUrl=u.href;
  }else{
    const u=new URL('https://www.tiktok.com/v2/auth/authorize/');
    u.searchParams.set('client_key',env.TIKTOK_CLIENT_KEY);u.searchParams.set('redirect_uri',redirectUri);u.searchParams.set('response_type','code');u.searchParams.set('scope',scopes.join(','));u.searchParams.set('state',state);authUrl=u.href;
  }
  return json({authorizationUrl:authUrl},200,originFor(request));
}
async function tokenExchange(platform,code,stateRow,env){
  const form=new URLSearchParams();
  if(platform==='facebook'||platform==='instagram'){
    const version=env.META_GRAPH_API_VERSION;
    const u=new URL('https://graph.facebook.com/'+version+'/oauth/access_token');
    u.searchParams.set('client_id',env.META_APP_ID);u.searchParams.set('client_secret',env.META_APP_SECRET);u.searchParams.set('redirect_uri',stateRow.redirect_uri);u.searchParams.set('code',code);
    const r=await fetch(u);const data=await r.json().catch(()=>({}));
    if(!r.ok||!data.access_token)throw new Error('META_TOKEN_EXCHANGE_FAILED');
    return {access_token:data.access_token,expires_in:data.expires_in||3600,scope:scopesFor(platform).join(',')};
  }
  if(platform==='x'){
    form.set('grant_type','authorization_code');form.set('code',code);form.set('redirect_uri',stateRow.redirect_uri);form.set('code_verifier',stateRow.code_verifier);
    const basic=btoa(env.X_CLIENT_ID+':'+env.X_CLIENT_SECRET);
    const r=await fetch('https://api.x.com/2/oauth2/token',{method:'POST',headers:{Authorization:'Basic '+basic,'Content-Type':'application/x-www-form-urlencoded'},body:form});
    const data=await r.json().catch(()=>({}));if(!r.ok||!data.access_token)throw new Error('X_TOKEN_EXCHANGE_FAILED');return data;
  }
  if(platform==='youtube'){
    form.set('code',code);form.set('client_id',env.GOOGLE_CLIENT_ID);form.set('client_secret',env.GOOGLE_CLIENT_SECRET);form.set('redirect_uri',stateRow.redirect_uri);form.set('grant_type','authorization_code');form.set('code_verifier',stateRow.code_verifier);
    const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:form});
    const data=await r.json().catch(()=>({}));if(!r.ok||!data.access_token)throw new Error('GOOGLE_TOKEN_EXCHANGE_FAILED');return data;
  }
  form.set('client_key',env.TIKTOK_CLIENT_KEY);form.set('client_secret',env.TIKTOK_CLIENT_SECRET);form.set('code',code);form.set('grant_type','authorization_code');form.set('redirect_uri',stateRow.redirect_uri);
  const r=await fetch('https://open.tiktokapis.com/v2/oauth/token/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:form});
  const data=await r.json().catch(()=>({}));const token=data.data||data;if(!r.ok||!token.access_token)throw new Error('TIKTOK_TOKEN_EXCHANGE_FAILED');return token;
}
async function providerProfile(platform,token,env){
  const auth={Authorization:'Bearer '+token};
  if(platform==='facebook'||platform==='instagram'){
    const version=env.META_GRAPH_API_VERSION;
    const url='https://graph.facebook.com/'+version+'/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&limit=100';
    const r=await fetch(url,{headers:auth});const data=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error('META_PROFILE_LOOKUP_FAILED');
    const pages=Array.isArray(data.data)?data.data:[];
    if(platform==='instagram'){
      const ig=pages.filter(p=>p.instagram_business_account?.id);
      return ig.map(p=>({id:String(p.instagram_business_account.id),name:p.instagram_business_account.username||p.name||'Instagram professionnel',type:'instagram_business',accessToken:p.access_token||token,metadata:{pageId:p.id,pageName:p.name}}));
    }
    if(pages.length)return pages.map(p=>({id:String(p.id),name:p.name||'Facebook Page',type:'page',accessToken:p.access_token||token,metadata:{category:p.category||null}}));
    const meR=await fetch('https://graph.facebook.com/'+version+'/me?fields=id,name',{headers:auth});const me=await meR.json().catch(()=>({}));
    if(!meR.ok||!me.id)throw new Error('META_USER_LOOKUP_FAILED');
    return [{id:String(me.id),name:me.name||'Facebook',type:'user',accessToken:token,metadata:{publishingAvailable:false}}];
  }
  if(platform==='x'){
    const r=await fetch('https://api.x.com/2/users/me?user.fields=public_metrics,profile_image_url',{headers:auth});const data=await r.json().catch(()=>({}));
    if(!r.ok||!data.data?.id)throw new Error('X_PROFILE_LOOKUP_FAILED');
    return [{id:String(data.data.id),name:data.data.name||data.data.username,type:'user',accessToken:token,metadata:{username:data.data.username,publicMetrics:data.data.public_metrics||{}}}];
  }
  if(platform==='youtube'){
    const r=await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',{headers:auth});const data=await r.json().catch(()=>({}));
    if(!r.ok||!data.items?.length)throw new Error('YOUTUBE_CHANNEL_LOOKUP_FAILED');
    return data.items.map(c=>({id:String(c.id),name:c.snippet?.title||'YouTube',type:'channel',accessToken:token,metadata:{thumbnail:c.snippet?.thumbnails?.default?.url||null,statistics:c.statistics||{}}}));
  }
  const r=await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url,follower_count,following_count,likes_count,video_count',{headers:auth});
  const data=await r.json().catch(()=>({}));const user=data.data?.user;
  if(!r.ok||!user?.open_id)throw new Error('TIKTOK_PROFILE_LOOKUP_FAILED');
  return [{id:String(user.open_id),name:user.display_name||'TikTok',type:'creator',accessToken:token,metadata:{avatarUrl:user.avatar_url||null,stats:{followers:user.follower_count??null,following:user.following_count??null,likes:user.likes_count??null,videos:user.video_count??null}}}];
}
async function saveConnectedAccount(context,platform,profile,tokenData,env){
  const encryptedAccess=await encryptToken(profile.accessToken||tokenData.access_token,env);
  const encryptedRefresh=tokenData.refresh_token?await encryptToken(tokenData.refresh_token,env):null;
  const expires=Number(tokenData.expires_in||0);
  const row={
    partner_id:context.partner.id,platform,platform_account_id:profile.id,account_name:String(profile.name||platform).slice(0,180),
    account_type:profile.type||null,scopes:String(tokenData.scope||'').split(/[ ,]+/).filter(Boolean),
    access_token_ciphertext:encryptedAccess,refresh_token_ciphertext:encryptedRefresh,
    token_expires_at:expires?new Date(Date.now()+expires*1000).toISOString():null,
    connection_status:'connected',metadata:profile.metadata||{},last_synced_at:new Date().toISOString(),updated_at:new Date().toISOString()
  };
  await sb('brand_social_accounts?on_conflict=partner_id%2Cplatform%2Cplatform_account_id',env,{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(row)});
}
async function oauthCallback(request,env,platform){
  const url=new URL(request.url),state=url.searchParams.get('state')||'',code=url.searchParams.get('code')||'';
  const base=String(env.SOCIAL_GROWTH_BASE_URL||url.origin).replace(/\/$/,'');
  const returnUrl=base+'/partenaires/espace/social-growth.html';
  if(url.searchParams.get('error'))return Response.redirect(returnUrl+'?error='+encodeURIComponent('autorisation_refusee'),303);
  if(!state||!code||!PLATFORMS.has(platform))return Response.redirect(returnUrl+'?error='+encodeURIComponent('callback_invalide'),303);
  try{
    const stateHash=await sha256(state);
    const rows=await sb('brand_social_oauth_states?state_hash=eq.'+encodeURIComponent(stateHash)+'&platform=eq.'+platform+'&select=id,partner_id,user_id,platform,code_verifier,redirect_uri,expires_at,consumed_at&limit=1',env);
    const stateRow=Array.isArray(rows)?rows[0]:null;
    if(!stateRow||stateRow.consumed_at||new Date(stateRow.expires_at).getTime()<Date.now())throw new Error('OAUTH_STATE_INVALID');
    const consumed=await sb('brand_social_oauth_states?id=eq.'+encodeURIComponent(stateRow.id)+'&consumed_at=is.null',env,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({consumed_at:new Date().toISOString()})});
    if(!Array.isArray(consumed)||!consumed.length)throw new Error('OAUTH_STATE_REPLAYED');
    const tokenData=await tokenExchange(platform,code,stateRow,env);
    const profiles=await providerProfile(platform,tokenData.access_token,env);
    if(!profiles.length)throw new Error(platform==='instagram'?'INSTAGRAM_PRO_ACCOUNT_REQUIRED':'PROVIDER_ACCOUNT_NOT_FOUND');
    const context={partner:{id:stateRow.partner_id}};
    for(const profile of profiles)await saveConnectedAccount(context,platform,profile,tokenData,env);
    await sb('brand_social_audit_logs',env,{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({partner_id:stateRow.partner_id,user_id:stateRow.user_id,platform,action:'oauth_connected',outcome:'success',details:{accounts:profiles.length}})});
    return Response.redirect(returnUrl+'?connected=1&platform='+encodeURIComponent(platform),303);
  }catch(error){
    const codeName=String(error?.message||'OAUTH_FAILED').split(':')[0].replace(/[^A-Z0-9_]/g,'').slice(0,80)||'OAUTH_FAILED';
    return Response.redirect(returnUrl+'?error='+encodeURIComponent(codeName),303);
  }
}
async function generateContent(request,env,context){
  const rateKey=context.user.id,now=Date.now(),old=generateBuckets.get(rateKey);
  if(old&&now-old.startedAt<RATE_WINDOW&&old.count>=5)return json({error:'Limite de génération atteinte. Réessayez dans une minute.'},429,originFor(request));
  if(!old||now-old.startedAt>=RATE_WINDOW)generateBuckets.set(rateKey,{startedAt:now,count:1});else old.count++;
  let body;try{body=await request.json();}catch{return json({error:'Corps JSON invalide.'},400,originFor(request));}
  const brief=typeof body?.brief==='string'?body.brief.trim().slice(0,2500):'';
  const sector=typeof body?.sector==='string'?body.sector.trim().slice(0,120):'';
  const objective=GOALS.has(body?.objective)?body.objective:'visibility';
  const platforms=Array.isArray(body?.platforms)?[...new Set(body.platforms.filter(p=>PLATFORMS.has(p)))].slice(0,5):[];
  if(brief.length<10||!platforms.length)return json({error:'Ajoutez une description et sélectionnez au moins un réseau social.'},400,originFor(request));
  const apiKey=env.OPENAI_API_KEY||env.AI_API_KEY;
  if(!apiKey)return json({error:'Bickri IA n’est pas configurée pour la génération de contenu. Le service IA doit être activé côté Cloudflare.'},503,originFor(request));
  const endpoint=env.AI_API_URL||'https://api.openai.com/v1/responses',model=env.OPENAI_MODEL||env.AI_MODEL||'gpt-4.1-mini';
  const instructions='Tu es Bickri IA, stratège social media de Bickri Service Agency. Génère un contenu marketing authentique, utile et adapté à chaque réseau demandé. Ne promets jamais la viralité, les abonnés ou les ventes. Respecte la langue française sauf indication contraire. Retourne uniquement un JSON valide avec la forme {"contents":[{"platform":"facebook|x|instagram|youtube|tiktok","platformLabel":"...","format":"...","caption":"...","hashtags":["..."],"hook":"...","cta":"..."}]}. Une entrée par plateforme. Adapte réellement la longueur, le ton et le format à chaque plateforme. N’invente pas de caractéristiques produit.';
  const input=JSON.stringify({brand:context.partner.name,sector,objective,brief,platforms});
  try{
    const isResponses=/\/responses(?:$|\?)/i.test(endpoint);
    const payload=isResponses?{model,instructions,input}:{model,temperature:0.6,messages:[{role:'system',content:instructions},{role:'user',content:input}]};
    const upstream=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},body:JSON.stringify(payload)});
    const data=await upstream.json().catch(()=>({}));
    if(!upstream.ok)throw new Error('AI_PROVIDER_'+upstream.status);
    const output=isResponses?(data.output_text||data.output?.flatMap(x=>x.content||[]).map(x=>x.text||'').filter(Boolean).join('\n')):(data.choices?.[0]?.message?.content||'');
    const parsed=JSON.parse(String(output||'').replace(/^\s*```(?:json)?/,'').replace(/```\s*$/,'').trim());
    const contents=Array.isArray(parsed.contents)?parsed.contents.filter(x=>PLATFORMS.has(x.platform)).slice(0,5):[];
    if(!contents.length)throw new Error('AI_RESPONSE_INVALID');
    for(const item of contents){
      const caption=String(item.caption||'').slice(0,4000);
      await sb('brand_social_content',env,{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({
        partner_id:context.partner.id,platform:item.platform,title:String(item.hook||'').slice(0,240),caption,
        content_type:item.platform==='youtube'?'short':item.platform==='tiktok'?'video':item.platform==='x'?'thread':'post',
        hashtags:Array.isArray(item.hashtags)?item.hashtags.map(x=>String(x).replace(/^#/,'').slice(0,60)).slice(0,20):[],
        status:'draft',created_by:context.user.id,metadata:{format:String(item.format||'').slice(0,80),cta:String(item.cta||'').slice(0,500)}
      })});
    }
    return json({contents},200,originFor(request));
  }catch(error){return json({error:'La génération de contenu a échoué. Réessayez plus tard.',code:String(error?.message||'AI_GENERATION_FAILED').slice(0,80)},502,originFor(request));}
}
async function overview(env,context,request){
  const partnerId=encodeURIComponent(context.partner.id);
  const [prefs,accounts,metrics,content,recommendations]=await Promise.all([
    sb('brand_social_preferences?partner_id=eq.'+partnerId+'&select=selected_platforms,growth_goals,target_audience,timezone,weekly_post_target,approval_required&limit=1',env),
    sb('brand_social_accounts?partner_id=eq.'+partnerId+'&select=id,platform,platform_account_id,account_name,account_type,connection_status,token_expires_at,last_synced_at,metadata&order=created_at.desc',env),
    sb('brand_social_metrics?partner_id=eq.'+partnerId+'&select=social_account_id,metric_date,followers_count,impressions,reach,engagements,video_views,profile_visits,clicks,conversions&order=metric_date.desc&limit=100',env),
    sb('brand_social_content?partner_id=eq.'+partnerId+'&select=id,platform,title,caption,content_type,status,scheduled_at,published_at,created_at&order=created_at.desc&limit=15',env),
    sb('brand_social_recommendations?partner_id=eq.'+partnerId+'&status=eq.open&select=id,platform,category,priority,title,body,created_at&order=created_at.desc&limit=10',env)
  ]);
  const latest=new Map();for(const metric of metrics||[]){if(!latest.has(metric.social_account_id))latest.set(metric.social_account_id,metric);}
  const accountRows=Array.isArray(accounts)?accounts:[];
  const publicAccounts=accountRows.map(a=>({id:a.id,platform:a.platform,accountName:a.account_name,accountType:a.account_type,connectionStatus:a.connection_status,tokenExpiresAt:a.token_expires_at,lastSyncedAt:a.last_synced_at,metadata:a.metadata||{}}));
  for(const platform of PLATFORMS){if(!publicAccounts.some(a=>a.platform===platform))publicAccounts.push({platform,connectionStatus:providerReady(platform,env)?'not_connected':'configuration_required'});}
  return json({
    partner:{id:context.partner.id,name:context.partner.name},
    preferences:Array.isArray(prefs)&&prefs[0]?{selectedPlatforms:prefs[0].selected_platforms||[],growthGoals:prefs[0].growth_goals||[],targetAudience:prefs[0].target_audience||{},timezone:prefs[0].timezone,weeklyPostTarget:prefs[0].weekly_post_target,approvalRequired:prefs[0].approval_required}:null,
    accounts:publicAccounts,metrics:[...latest.values()],content:content||[],recommendations:recommendations||[]
  },200,originFor(request));
}
async function savePreferences(request,env,context){
  let body;try{body=await request.json();}catch{return json({error:'Corps JSON invalide.'},400,originFor(request));}
  const selected=Array.isArray(body.selectedPlatforms)?[...new Set(body.selectedPlatforms.filter(x=>PLATFORMS.has(x)))].slice(0,5):[];
  const goals=Array.isArray(body.growthGoals)?[...new Set(body.growthGoals.filter(x=>GOALS.has(x)))].slice(0,5):['visibility'];
  const audience=body.targetAudience&&typeof body.targetAudience==='object'&&!Array.isArray(body.targetAudience)?{description:String(body.targetAudience.description||'').slice(0,500)}:{};
  const weekly=Number(body.weeklyPostTarget??4);
  if(!Number.isInteger(weekly)||weekly<0||weekly>50)return json({error:'Le nombre de publications doit être compris entre 0 et 50.'},400,originFor(request));
  await sb('brand_social_preferences?on_conflict=partner_id',env,{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify({
    partner_id:context.partner.id,selected_platforms:selected,growth_goals:goals.length?goals:['visibility'],target_audience:audience,
    weekly_post_target:weekly,timezone:'Africa/Niamey',approval_required:true,updated_at:new Date().toISOString()
  })});
  return json({ok:true},200,originFor(request));
}
export async function handleSocialGrowthRequest(request,env){
  const url=new URL(request.url),origin=originFor(request);
  if(!allowedOrigin(request))return json({error:'Origine non autorisée.'},403);
  if(request.method==='OPTIONS')return json({},204,origin);
  const callbackMatch=url.pathname.match(/^\/api\/social-growth\/oauth\/callback\/(facebook|x|instagram|youtube|tiktok)$/);
  if(callbackMatch&&request.method==='GET')return oauthCallback(request,env,callbackMatch[1]);
  if(!url.pathname.startsWith('/api/social-growth/'))return json({error:'Route introuvable.'},404,origin);
  const context=await partnerContext(request,env);if(context.error)return context.error;
  try{
    if(url.pathname==='/api/social-growth/overview'&&request.method==='GET')return await overview(env,context,request);
    if(url.pathname==='/api/social-growth/preferences'&&request.method==='PUT')return await savePreferences(request,env,context);
    if(url.pathname==='/api/social-growth/generate'&&request.method==='POST')return await generateContent(request,env,context);
    const start=url.pathname.match(/^\/api\/social-growth\/oauth\/start$/);
    if(start&&request.method==='GET')return await oauthStart(request,env,context,(url.searchParams.get('platform')||'').toLowerCase());
    return json({error:'Méthode ou route non prise en charge.'},404,origin);
  }catch(error){
    const code=String(error?.message||'SOCIAL_GROWTH_ERROR').split(':')[0].replace(/[^A-Z0-9_]/g,'').slice(0,80)||'SOCIAL_GROWTH_ERROR';
    console.error('Social Growth request failed:',code);
    return json({error:'Le service Social Growth a rencontré une erreur. Réessayez plus tard.',code},500,origin);
  }
}
