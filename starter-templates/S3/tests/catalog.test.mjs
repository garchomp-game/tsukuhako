import test from 'node:test';
import assert from 'node:assert/strict';
import { settings, loadCatalog } from '../lib/catalog.ts';
const publicKey='sb_publishable_fixture_only_123';
const ready=settings('https://example.supabase.co',publicKey);
const jwt=role=>`eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({role})).toString('base64url')}.fixture`;
test('missing, invalid and privileged settings are rejected without network calls', async()=>{
 for(const config of [settings(undefined,undefined),settings('https://example.supabase.co','sb_secret_forbidden'),settings('https://example.supabase.co',jwt('service_role')),settings('https://example.supabase.co','not-a-key'),settings('http://example.com',publicKey),settings('https://user:pass@example.com',publicKey),settings('https://example.com/path',publicKey)]){
  assert.notEqual(config.state,'ready');
  await loadCatalog(config,()=>{throw Error('must not fetch');});
 }
 assert.equal(settings('https://example.supabase.co',jwt('anon')).state,'ready');
 assert.equal(ready.state,'ready');
});
test('read-only fetch selects exact fields with public key; returns valid and empty lists',async()=>{
 const products=[{id:'sample',name:'架空のノート',price_yen:300}];
 const result=await loadCatalog(ready,async(url,options)=>{
  assert.equal(options.method,'GET');assert.equal(options.headers.apikey,publicKey);
  assert.equal(options.headers.Authorization,undefined);
  assert.ok(url.includes('select=id,name,price_yen'));
  return Response.json(products);
 });
 assert.deepEqual(result,{state:'ready',products});
 assert.deepEqual(await loadCatalog(ready,async()=>Response.json([])),{state:'ready',products:[]});
});
test('upstream error, unavailable network and malformed schema have safe messages',async()=>{
 for(const fetcher of [async()=>new Response('private debug trace',{status:403}),async()=>{throw Error('private network credentials');},async()=>Response.json([{id:1,name:'x',price_yen:'10'}])]){
  const result=await loadCatalog(ready,fetcher);assert.equal(result.state,'error');assert.ok(!result.message.includes('private'));
 }
});
