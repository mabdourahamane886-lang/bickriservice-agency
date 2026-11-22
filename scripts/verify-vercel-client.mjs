import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import handler from '../lib/vercel-client-adapter.js';
const root=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
for(const path of ['api/client/me.js','api/client/requests.js','api/client/notifications.js','api/client/admin/requests.js']){
  assert.ok(root(path).includes('export default handler'),'Missing serverless API: '+path);
}
assert.ok(root('client-portal.js').includes("const API_BASE='';"),'Client API must be same-origin on Vercel.');
const buildResponse=()=>({statusCode:200,headers:{},status(n){this.statusCode=n;return this;},setHeader(k,v){this.headers[k]=v;return this;},send(data){this.body=data;return this;},json(data){this.body=JSON.stringify(data);return this;},end(){this.body='';return this;}});
process.env.SUPABASE_SERVICE_ROLE_KEY='unit-test-only';
const a=buildResponse();
await handler({url:'/api/client/requests',method:'GET',headers:{host:'bickriservice-agency.org',origin:'https://invalid.example'}},a);
assert.equal(a.statusCode,403,'Cross-site requests must be rejected');
const b=buildResponse();
await handler({url:'/api/client/requests',method:'GET',headers:{host:'bickriservice-agency.org',origin:'https://bickriservice-agency.org'}},b);
assert.equal(b.statusCode,401,'Unauthenticated access must be rejected');
console.log('Vercel Client API guards and entry points: OK.');
