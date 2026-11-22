import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker.js';

// Tests hors réseau : simule Supabase et les fichiers statiques Cloudflare.
const ORIGIN='https://bickriservice-agency.org';
const publishedPartner={
  name:'Agence Exemple',slug:'agence-exemple',
  description:'Expert du numérique & de la communication.',
  logo_url:'https://cdn.example.org/partenaire-logo.png',
  country:'Niger',category:'Numérique'
};
const genericIndex='<!doctype html><html><head><meta property="og:title" content="Bickri Service Agency"><meta property="og:image" content="https://bickriservice-agency.org/logo.png"><meta property="og:url" content="https://bickriservice-agency.org/"></head></html>';

async function mockPartnerData(rows,staticHtml,run){
  const originalFetch=globalThis.fetch;
  let queries=0;
  globalThis.fetch=async input=>{
    const uri=String(input);
    if(uri.startsWith('https://okdohokhlkxrmxpevees.supabase.co/rest/v1/agency_partners?')){
      queries++;
      return new Response(JSON.stringify(rows),{status:200,headers:{'Content-Type':'application/json'}});
    }
    throw new Error('Unmocked network request: '+uri);
  };
  const env={
    SUPABASE_SERVICE_ROLE_KEY:'unit-test-service-key',
    ASSETS:{
      fetch:async()=>new Response(staticHtml||genericIndex,{status:200,headers:{'Content-Type':'text/html; charset=utf-8'}})
    }
  };
  try{await run(env,()=>queries)}finally{globalThis.fetch=originalFetch}
}

test('WhatsApp reçoit une carte OG avec le nom, la description et le logo individuel',async()=>{
  await mockPartnerData([publishedPartner],genericIndex,async env=>{
    const req=new Request(ORIGIN+'/partenaires/partage/agence-exemple/?ref=BSA-X',{headers:{'User-Agent':'WhatsApp/2.24'}});
    const res=await worker.fetch(req,env,{});
    assert.equal(res.status,200);
    const html=await res.text();
    assert.match(html,/<meta property="og:title" content="Agence Exemple — Bickri Service Agency">/);
    assert.match(html,/<meta property="og:description" content="Expert du numérique &amp; de la communication\."/);
    assert.match(html,/<meta property="og:image" content="https:\/\/cdn\.example\.org\/partenaire-logo\.png">/);
    assert.match(html,/<meta property="og:url" content="https:\/\/bickriservice-agency\.org\/partenaires\/partage\/agence-exemple\/">/);
    assert.match(html,/name="twitter:card" content="summary_large_image"/);
    assert.doesNotMatch(html,/og:url" content="[^"]*\?ref=/);
  });
});

test('Un clic normal sur le lien partagé ouvre le vrai profil avec la référence',async()=>{
  await mockPartnerData([publishedPartner],genericIndex,async(env,queries)=>{
    const res=await worker.fetch(new Request(ORIGIN+'/partenaires/partage/agence-exemple/?ref=BSA-A',{headers:{'User-Agent':'Mozilla/5.0'}}),env,{});
    assert.equal(res.status,302);
    assert.equal(res.headers.get('location'),ORIGIN+'/partenaires/profil/?slug=agence-exemple&ref=BSA-A');
    assert.equal(queries(),0,'la redirection humaine ne doit pas requêter la base de données');
  });
});

test('Les robots obtiennent aussi les métadonnées de la page profil à slug',async()=>{
  await mockPartnerData([publishedPartner],genericIndex,async env=>{
    const res=await worker.fetch(new Request(ORIGIN+'/partenaires/profil/?slug=agence-exemple',{headers:{'User-Agent':'facebookexternalhit/1.1'}}),env,{});
    assert.equal(res.status,200);
    const html=await res.text();
    assert.match(html,/<meta property="og:url" content="https:\/\/bickriservice-agency\.org\/partenaires\/profil\/\?slug=agence-exemple">/);
    assert.match(html,/partenaire-logo\.png/);
  });
});

test('Un profil statique connu conserve son propre aperçu lorsque Supabase ne le renvoie pas',async()=>{
  const staticPage='<!doctype html><head>'+
    '<meta property="og:title" content="Impact Afriq — Partenaire Bickri Service Agency">'+
    '<meta property="og:description" content="Innovation africaine">'+
    '<meta property="og:url" content="'+ORIGIN+'/partenaires/partage/impact-afriq/">'+
    '<meta property="og:image" content="'+ORIGIN+'/assets/partners/impact-afriq.svg">'+
    '</head>';
  await mockPartnerData([],staticPage,async env=>{
    const res=await worker.fetch(new Request(ORIGIN+'/partenaires/partage/impact-afriq/',{headers:{'User-Agent':'Twitterbot'}}),env,{});
    assert.equal(res.status,200);
    const html=await res.text();
    assert.match(html,/Impact Afriq — Bickri Service Agency/);
    assert.match(html,/images\.weserv\.nl/);
    assert.match(html,/og:image:width" content="1200"/);
  });
});

test('Un slug inexistant ne doit jamais hériter des balises génériques de l’accueil',async()=>{
  await mockPartnerData([],genericIndex,async env=>{
    const res=await worker.fetch(new Request(ORIGIN+'/partenaires/partage/profil-fictif/',{headers:{'User-Agent':'WhatsApp'}}),env,{});
    assert.equal(res.status,404);
    const html=await res.text();
    assert.doesNotMatch(html,/<meta property="og:image"/);
  });
});
