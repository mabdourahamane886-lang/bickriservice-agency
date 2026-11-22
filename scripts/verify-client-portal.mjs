import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { handleClientApi } from '../lib/agency-client.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const client=read('espace-client/index.html'),admin=read('admin-clients/index.html');
const js=read('client-portal.js'),css=read('client-portal.css'),sql=read('supabase/migrations/20261122143000_agency_client_portal.sql');
for(const id of ['authForm','requestForm','clientTurnstile','myRequests','myNotifications'])assert.ok(client.includes('id="'+id+'"'),id);
for(const id of ['authForm','adminDashboard','adminRequests','adminFilter'])assert.ok(admin.includes('id="'+id+'"'),id);
assert.ok(!/<script[^>]*src=['"]https?:\/\//.test(client),'No third-party app scripts in markup');
assert.ok(css.includes('var(--navy')&&css.includes('var(--gold'),'Existing brand colors reused');
assert.ok(js.includes("'/api/client/requests'"),'Client submits to secure API');
assert.ok(sql.includes('enable row level security'),'RLS enabled');
assert.ok(sql.includes('revoke all on public.agency_client_requests from anon, authenticated'),'No public access to data');
const response=await handleClientApi(new Request('https://bickriservice-agency.org/api/client/requests',{headers:{Origin:'https://evil.example'}}),{SUPABASE_SERVICE_ROLE_KEY:'dummy'},{
  allowedOrigin:()=>false,json:(_req,body,status)=>({status,body})
});
assert.equal(response.status,403);
const noConfig=await handleClientApi(new Request('https://bickriservice-agency.org/api/client/requests'),{},{
  allowedOrigin:()=>true,json:(_req,body,status)=>({status,body})
});
assert.equal(noConfig.status,503);
assert.equal(await handleClientApi(new Request('https://bickriservice-agency.org/'),{},{}),null);
console.log('Client portal: pages, API guards, palette and private data checks OK.');
