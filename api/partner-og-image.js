const SITE='https://bickriservice-agency.org';
const DB='https://okdohokhlkxrmxpevees.supabase.co';
const KEY='sb_publishable_EiTruyR5fwwHpS_PzO5_iA_d1i4iMCP';
const SAHELIA='https://d2ol7oe51mr4n9.cloudfront.net/user_3Bt4xGygQGBZTOweEVrhbZ4s65k/053dc7b0-1a6c-4685-84a3-08595451a656.png';
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
module.exports=async(req,res)=>{
 const slug=String(req.query?.slug||'').toLowerCase();
 if(!/^[a-z0-9-]{1,100}$/.test(slug)){res.status(400).end('Invalid slug');return;}
 let p=slug==='sahelia-fresh'?{name:'Sahelia Fresh',logo_url:SAHELIA,badge_level:'premium'}:null;
 try{
  const endpoint=DB+'/rest/v1/agency_partners?slug=eq.'+encodeURIComponent(slug)+'&select=name,logo_url,badge_level&limit=1';
  const r=await fetch(endpoint,{headers:{apikey:KEY,Authorization:'Bearer '+KEY}});
  if(r.ok){const rows=await r.json();if(rows[0])p={...p,...rows[0]};}
 }catch(e){}
 if(!p){res.status(404).end('Partner not found');return;}
 if(slug==='sahelia-fresh')p.logo_url=SAHELIA;
 const name=String(p.name||'Partenaire').slice(0,65);
 const certified=slug==='sahelia-fresh'||/premium|verified|certifi/i.test(String(p.badge_level||''));
 let logo='';
 try{
  const u=new URL(p.logo_url);
  if(u.protocol==='https:'){
   const r=await fetch(u,{signal:AbortSignal.timeout(6000)});
   const mime=(r.headers.get('content-type')||'').split(';')[0];
   const b=Buffer.from(await r.arrayBuffer());
   if(r.ok&&/^image\/(png|jpeg|webp)$/.test(mime)&&b.length<2000000)logo='data:'+mime+';base64,'+b.toString('base64');
  }
 }catch(e){}
 const fontSize=name.length>28?49:66;
 const badge=certified?'<g transform="translate(0,0)"><rect x="590" y="340" width="460" height="76" rx="38" fill="#fff3cc" stroke="#d6a52e" stroke-width="2"/><circle cx="634" cy="378" r="23" fill="#d6a52e"/><path d="M622 378l8 8 16-19" fill="none" stroke="white" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><text x="674" y="391" fill="#785516" font-size="30" font-weight="700">Partenaire Premium</text></g>':'';
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#0b1c35"/><rect x="48" y="54" width="1104" height="522" rx="32" fill="#132b49" stroke="#d6a52e" stroke-opacity=".45" stroke-width="3"/><rect x="92" y="172" width="392" height="310" rx="30" fill="#ffffff"/>'+(logo?'<image href="'+logo+'" x="108" y="184" width="360" height="285" preserveAspectRatio="xMidYMid meet"/>':'')+'<text x="590" y="204" fill="#d6a52e" font-family="Arial,sans-serif" font-size="26" font-weight="700">RÉSEAU PROFESSIONNEL BICKRI</text><text x="590" y="308" fill="#ffffff" font-family="Arial,sans-serif" font-size="'+fontSize+'" font-weight="700">'+esc(name)+'</text>'+badge+'<text x="590" y="489" fill="#dce5f0" font-family="Arial,sans-serif" font-size="24">Bickri Service Agency · Niger</text></svg>';
 res.setHeader('Content-Type','image/svg+xml; charset=utf-8');
 res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=600');
 res.status(200).end(svg);
};