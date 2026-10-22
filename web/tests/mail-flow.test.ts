import {test,before} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {MailService} from '../worker/service';
import {content, hash, stepTime} from '../worker/content';
let script:string;
before(async()=>{const result=await build({entryPoints:['worker/index.ts'],bundle:true,format:'esm',platform:'browser',write:false});script=result.outputFiles[0].text;});
type S={now:string;subscribers:{id:string;subscription_status:string;confirmed_at:string|null;enrollment_id:string|null;suppression_reason:string|null}[];editions:{id:string;revision:number;status:string;current:number;content_hash:string}[];deliveries:{id:string;edition_id:string;status:string;planned_at_utc:string;revision:number;attempts:number;last_error:string|null}[];outbox:{delivery_id:string;subject:string;kind:string;body_text:string;body_html:string;headers:string}[];events:{event_id:string;processed_at:string|null}[]};
async function fixture() {
 let outbound=0;
 const mf=new Miniflare({...convertV4MiniflareOptions({modules:true,script,compatibilityDate:'2026-10-22',bindings:{MAIL_MODE:'preview'},d1Databases:{DB:'test'},outboundService:()=>{outbound++;throw new Error('External fetch forbidden');}}),telemetry:{enabled:false},logRequests:false});
 const db=await mf.getD1Database('DB');
 const sql=await readFile('migrations/0001_preview.sql','utf8');
 for(const statement of sql.split(';').map(s=>s.trim()).filter(Boolean))await db.prepare(statement).run();
 async function call<T=Record<string,unknown>>(path:string,input?:Record<string,unknown>,expected=200,headers:Record<string,string>={}) {
  const response=await mf.dispatchFetch('http://localhost'+path,{method:input?'POST':'GET',headers:{...(input?{'Content-Type':'application/json'}:{}),...headers},body:input?JSON.stringify(input):undefined});
  const value=await response.json();assert.equal(response.status,expected,JSON.stringify(value));assert.equal(response.headers.get('cache-control'),'no-store');return value as T;
 }
 const state=()=>call<S>('/api/preview/state');
 async function activate(){for(const e of (await state()).editions.filter(e=>e.current)){await call('/api/preview/review',{id:e.id,revision:e.revision,action:'review'});if(e.id!=='broadcast-001')await call('/api/preview/review',{id:e.id,revision:e.revision,action:'activate'});}}
 async function subscribe(email='reader@example.test'){await call('/api/subscriptions',{email,newsletterConsent:true,consentVersion:'2026-10-22-v1'},202);const s=await state();return s.outbox[0].body_text.match(/token=([a-f0-9]{64})/)![1];}
 async function enroll(){const token=await subscribe();await call('/api/confirm',{token});return token;}
 async function clock(now:string){await call('/api/preview/clock',{now});}
 const service=new MailService(db,'http://localhost');
 return {mf,db,call,state,activate,subscribe,enroll,clock,service,async close(){assert.equal(outbound,0);await mf.dispose();}};
}

test('GET prefetch is read-only; duplicate registration/confirm and concurrent dispatch remain unique',async()=>{
 const f=await fixture();try{await f.activate();const token=await f.subscribe();assert.equal((await f.call('/api/confirm/status?token='+token)).state,'valid');let s=await f.state();assert.equal(s.subscribers[0].subscription_status,'pending');assert.equal(s.deliveries.length,0);
 await f.call('/api/subscriptions',{email:'reader@example.test',newsletterConsent:true,consentVersion:'2026-10-22-v1'},429);
 await Promise.all([f.call('/api/confirm',{token}),f.call('/api/confirm',{token})]);s=await f.state();assert.equal(s.deliveries.length,3);assert.equal(s.subscribers[0].subscription_status,'subscribed');
 await Promise.all([f.call('/api/preview/dispatch',{}),f.call('/api/preview/dispatch',{})]);s=await f.state();assert.equal(s.outbox.filter(m=>m.kind==='step').length,1);assert.equal(s.deliveries.find(d=>d.edition_id==='welcome-01')!.attempts,1);
 const stored=await f.db.prepare('SELECT hash FROM confirmation_tokens').all<{hash:string}>();assert.equal(stored.results[0].hash,await hash(token));assert.notEqual(stored.results[0].hash,token);
 assert.match(s.outbox[0].body_html,/<a href="http:\/\/localhost\/mail\//);assert.match(s.outbox[0].body_html,/target="_top"/);
 }finally{await f.close();}
});

test('simultaneous subscribe requests issue only one confirmation and preserve the usable token',async()=>{
 const f=await fixture();try{await f.activate();const results=await Promise.all([1,2,3].map(()=>f.mf.dispatchFetch('http://localhost/api/subscriptions',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'race@example.test',newsletterConsent:true,consentVersion:'2026-10-22-v1'})})));assert.equal(results.filter(r=>r.status===202).length,1);assert.equal(results.filter(r=>r.status===429).length,2);const s=await f.state();assert.equal(s.outbox.length,1);const token=s.outbox[0].body_text.match(/token=([a-f0-9]{64})/)![1];assert.equal((await f.call('/api/confirm/status?token='+token)).state,'valid');}finally{await f.close();}
});

test('JST calendar-day schedules cross the UTC boundary independently of elapsed hours',()=>{
 assert.equal(stepTime('2026-10-22T14:59:00.000Z',2),'2026-10-24T10:00:00.000Z');
 assert.equal(stepTime('2026-10-22T14:59:00.000Z',3),'2026-10-27T10:00:00.000Z');
 assert.equal(stepTime('2026-10-22T15:01:00.000Z',2),'2026-10-25T10:00:00.000Z');
 assert.equal(stepTime('2026-10-22T15:01:00.000Z',3),'2026-10-28T10:00:00.000Z');
});

test('initial days 0/2/5, seven elapsed days and introduction completion govern broadcast audience',async()=>{
 const f=await fixture();try{await f.activate();await f.enroll();await f.call('/api/preview/dispatch',{});await f.clock('2026-10-24T09:59:59.000Z');await f.call('/api/preview/dispatch',{});assert.equal((await f.state()).outbox.filter(m=>m.kind==='step').length,1);await f.clock('2026-10-24T10:00:00.000Z');await f.call('/api/preview/dispatch',{});await f.clock('2026-10-27T10:00:00.000Z');await f.call('/api/preview/dispatch',{});let s=await f.state();assert.equal(s.outbox.filter(m=>m.kind==='step').length,3);
 await f.call('/api/preview/schedule',{id:'broadcast-001',at:'2026-10-29T10:00:00.000Z'});await f.clock('2026-10-29T09:59:59.000Z');await f.call('/api/preview/dispatch',{});assert.equal((await f.state()).outbox.filter(m=>m.kind==='broadcast').length,0);await f.clock('2026-10-29T10:00:00.000Z');await f.call('/api/preview/dispatch',{});s=await f.state();assert.equal(s.outbox.filter(m=>m.kind==='broadcast').length,1);assert.equal(s.editions.find(e=>e.id==='broadcast-001'&&e.current)!.status,'completed');
 }finally{await f.close();}
});

test('daily cap holds accepted and unknown mail; unknown is reconciled without re-send',async()=>{
 const f=await fixture();try{await f.activate();await f.enroll();await f.clock('2026-10-24T10:00:00.000Z');await f.call('/api/preview/dispatch',{outcome:'timeout'});let s=await f.state();assert.equal(s.deliveries.find(d=>d.edition_id==='welcome-01')!.status,'unknown');assert.equal(s.deliveries.find(d=>d.edition_id==='welcome-02')!.planned_at_utc,'2026-10-25T10:00:00.000Z');assert.equal(s.outbox.filter(m=>m.kind==='step').length,1);await f.call('/api/preview/dispatch',{});s=await f.state();assert.equal(s.outbox.filter(m=>m.kind==='step').length,1);const unknown=s.deliveries.find(d=>d.status==='unknown')!;await f.call('/api/preview/retry',{id:unknown.id},409);await f.call('/api/preview/reconcile',{id:unknown.id});s=await f.state();assert.equal(s.deliveries.find(d=>d.id===unknown.id)!.status,'accepted');assert.equal(s.deliveries.find(d=>d.id===unknown.id)!.attempts,1);
 }finally{await f.close();}
});

test('unsubscribe cancels queued steps; GET and machine POST stay separate',async()=>{
 const f=await fixture();try{await f.activate();const old=await f.enroll();await f.call('/api/preview/dispatch',{});let s=await f.state();const token=s.outbox.find(m=>m.kind==='step')!.body_text.match(/unsubscribe\?token=([a-f0-9]{64})/)![1];await f.mf.dispatchFetch('http://localhost/api/unsubscribe?token='+token);assert.equal((await f.state()).subscribers[0].subscription_status,'subscribed');
 const response=await f.mf.dispatchFetch('http://localhost/api/unsubscribe?token='+token,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:'List-Unsubscribe=One-Click'});assert.equal(response.status,200);await f.call('/api/unsubscribe',{token});s=await f.state();assert.equal(s.subscribers[0].subscription_status,'unsubscribed');assert.equal(s.deliveries.filter(d=>d.status==='suppressed').length,2);assert.equal((await f.call('/api/confirm/status?token='+old)).state,'unsubscribed');await f.call('/api/confirm',{token:old},409);
 await f.clock('2026-10-22T10:01:00.000Z');const renewed=await f.subscribe();assert.equal((await f.state()).subscribers[0].subscription_status,'unsubscribed');await f.call('/api/confirm',{token:renewed});assert.equal((await f.state()).subscribers[0].subscription_status,'subscribed');
 }finally{await f.close();}
});

test('expired confirmation recovers by resend; newer token invalidates old token',async()=>{
 const f=await fixture();try{await f.activate();const old=await f.subscribe();await f.clock('2026-10-23T10:00:00.000Z');assert.equal((await f.call('/api/confirm/status?token='+old)).state,'expired');await f.call('/api/confirm',{token:old},409);await f.call('/api/resend-confirmation',{email:'reader@example.test'},202);const s=await f.state();const token=s.outbox[0].body_text.match(/token=([a-f0-9]{64})/)![1];assert.notEqual(token,old);assert.equal((await f.call('/api/confirm/status?token='+old)).state,'invalidated');await f.call('/api/confirm',{token});assert.equal((await f.state()).deliveries.length,3);
 }finally{await f.close();}
});

test('complaint/bounce/unsubscribe events are idempotent, order-safe, and failure rolls back for retry',async()=>{
 const f=await fixture();try{await f.activate();await f.enroll();await f.call('/api/preview/dispatch',{});let s=await f.state();const subscriberId=s.subscribers[0].id;const deliveryId=s.deliveries[0].id;
 await f.db.prepare("CREATE TRIGGER fail_suppression BEFORE UPDATE OF suppression_reason ON subscribers BEGIN SELECT RAISE(ABORT,'injected'); END").run();await f.call('/api/mail-events',{eventId:'fixture-1',type:'complaint',subscriberId},500);assert.equal((await f.state()).events.length,0);await f.db.prepare('DROP TRIGGER fail_suppression').run();await f.call('/api/mail-events',{eventId:'fixture-1',type:'complaint',subscriberId});await f.call('/api/mail-events',{eventId:'fixture-1',type:'complaint',subscriberId});await f.call('/api/mail-events',{eventId:'fixture-2',type:'delivered',subscriberId,deliveryId});await f.call('/api/mail-events',{eventId:'fixture-3',type:'unsubscribe',subscriberId});await f.clock('2026-10-22T10:01:00.000Z');await f.call('/api/subscriptions',{email:'reader@example.test',newsletterConsent:true,consentVersion:'2026-10-22-v1'},202);s=await f.state();assert.equal(s.subscribers[0].suppression_reason,'complaint');assert.equal(s.subscribers[0].subscription_status,'unsubscribed');assert.equal(s.outbox.filter(m=>m.kind==='transactional').length,1);assert.equal(s.events.length,3);
 }finally{await f.close();}
});

test('final mock acceptance rechecks unsubscribe after scheduler claim',async()=>{
 const f=await fixture();try{await f.activate();await f.enroll();let injected=false;
 const original=f.db.batch.bind(f.db);const proxied=new Proxy(f.db,{get(target,key){if(key==='batch')return async(statements:Parameters<typeof original>[0])=>{const result=await original(statements);if(!injected && (await f.state()).deliveries.some(d=>d.status==='submitting')){injected=true;await f.service.suppress((await f.state()).subscribers[0].id,'unsubscribed');}return result;};const value=Reflect.get(target,key);return typeof value==='function'?value.bind(target):value;}});
 await new MailService(proxied,'http://localhost').dispatch();const s=await f.state();assert.equal(injected,true);assert.equal(s.outbox.filter(m=>m.kind==='step').length,0);assert.equal(s.subscribers[0].subscription_status,'unsubscribed');assert.equal(s.deliveries[0].status,'suppressed');
 }finally{await f.close();}
});

test('global stop retires an empty scheduled broadcast and never revives old reservations',async()=>{
 const f=await fixture();try{await f.activate();await f.call('/api/preview/schedule',{id:'broadcast-001',at:'2026-10-29T10:00:00.000Z'});await f.call('/api/preview/stop',{stopped:true});await f.call('/api/preview/stop',{stopped:false});await f.enroll();await f.call('/api/preview/dispatch',{});await f.clock('2026-10-24T10:00:00.000Z');await f.call('/api/preview/dispatch',{});await f.clock('2026-10-27T10:00:00.000Z');await f.call('/api/preview/dispatch',{});await f.clock('2026-10-29T10:00:00.000Z');await f.call('/api/preview/dispatch',{});const s=await f.state();assert.equal(s.editions.find(e=>e.id==='broadcast-001'&&e.current)!.status,'retired');assert.equal(s.outbox.filter(m=>m.kind==='broadcast').length,0);
 }finally{await f.close();}
});

test('edits invalidate approval, pending deliveries require explicit rebind, reverting still creates a new revision',async()=>{
 const f=await fixture();const original=content.editions.find(e=>e.id==='welcome-02')!.subject;try{await f.activate();await f.enroll();content.editions.find(e=>e.id==='welcome-02')!.subject=original+'（修正fixture）';await f.service.syncContent();let e=await f.service.current('welcome-02');assert.equal(e!.revision,2);assert.equal(e!.status,'draft');assert.equal((await f.db.prepare("SELECT status FROM deliveries WHERE edition_id='welcome-02'").first<{status:string}>())!.status,'cancelled');await assert.rejects(()=>f.service.rebind('welcome-02'));await f.service.review('welcome-02','review',2);await f.service.review('welcome-02','activate',2);await f.service.rebind('welcome-02');content.editions.find(e=>e.id==='welcome-02')!.subject=original;await f.service.syncContent();e=await f.service.current('welcome-02');assert.equal(e!.revision,3);assert.equal(e!.status,'draft');assert.equal(e!.reviewed_at,null);
 }finally{content.editions.find(e=>e.id==='welcome-02')!.subject=original;await f.close();}
});

test('linked guide changes invalidate its mail approval even when the URL stays the same',async()=>{
 const f=await fixture();const original=content.guides['first-change'];try{await f.activate();content.guides['first-change']=original+'\nFixture revision.';await f.service.syncContent();const e=await f.service.current('welcome-03');assert.equal(e!.revision,2);assert.equal(e!.status,'draft');}finally{content.guides['first-change']=original;await f.close();}
});

test('overdue mail is skipped rather than burst-sent; unapproved templates cannot dispatch',async()=>{
 const f=await fixture();try{await f.state();const e=await f.service.current('confirm');await f.service.review('confirm','review',e!.revision);await f.service.review('confirm','activate',e!.revision);await f.enroll();await f.call('/api/preview/dispatch',{});assert.equal((await f.state()).outbox.filter(m=>m.kind==='step').length,0);await f.clock('2026-10-30T10:00:00.000Z');await f.call('/api/preview/dispatch',{});assert.equal((await f.state()).deliveries.filter(d=>d.status==='skipped').length,3);
 }finally{await f.close();}
});

test('real addresses, cross-origin access, nonlocal hosts and production mode are blocked',async()=>{
 const f=await fixture();try{await f.activate();await f.call('/api/subscriptions',{email:'real@gmail.com',newsletterConsent:true,consentVersion:'2026-10-22-v1'},400);await f.call('/api/subscriptions',{email:'reader@example.test',newsletterConsent:false,consentVersion:'2026-10-22-v1'},400);await f.call('/api/preview/state',undefined,403,{'origin':'https://outside.example'});const remote=await f.mf.dispatchFetch('https://outside.example/api/preview/state');assert.equal(remote.status,403);assert.equal((await f.state()).subscribers.length,0);const changed=await f.mf.setOptions({...convertV4MiniflareOptions({modules:true,script,compatibilityDate:'2026-10-22',bindings:{MAIL_MODE:'live'},d1Databases:{DB:'test'}}),telemetry:{enabled:false},logRequests:false});void changed;const live=await f.mf.dispatchFetch('http://localhost/api/health');assert.equal(live.status,403);
 }finally{await f.close();}
});

test('queued broadcast is suppressed by unsubscribe before its scheduled time',async()=>{
 const f=await fixture();try{await f.activate();await f.enroll();await f.call('/api/preview/dispatch',{});await f.clock('2026-10-24T10:00:00.000Z');await f.call('/api/preview/dispatch',{});await f.clock('2026-10-27T10:00:00.000Z');await f.call('/api/preview/dispatch',{});await f.call('/api/preview/schedule',{id:'broadcast-001',at:'2026-10-29T10:00:00.000Z'});let s=await f.state();assert.equal(s.deliveries.find(d=>d.edition_id==='broadcast-001')!.status,'planned');const token=s.outbox.find(m=>m.kind==='step')!.body_text.match(/unsubscribe\?token=([a-f0-9]{64})/)![1];await f.call('/api/unsubscribe',{token});await f.clock('2026-10-29T10:00:00.000Z');await f.call('/api/preview/dispatch',{});s=await f.state();assert.equal(s.deliveries.find(d=>d.edition_id==='broadcast-001')!.status,'suppressed');assert.equal(s.outbox.filter(m=>m.kind==='broadcast').length,0);
 }finally{await f.close();}
});

test('broadcast excludes unverified and incomplete introductions after seven days',async()=>{
 const f=await fixture();try{await f.activate();await f.enroll();await f.subscribe('pending@example.test');await f.clock('2026-10-29T10:00:00.000Z');await f.call('/api/preview/schedule',{id:'broadcast-001',at:'2026-10-29T10:00:00.000Z'});assert.equal((await f.state()).deliveries.filter(d=>d.edition_id==='broadcast-001').length,0);
 }finally{await f.close();}
});

test('global stop cancels existing steps and restart keeps stored state without restoring them',async()=>{
 const f=await fixture();try{await f.activate();await f.enroll();await f.call('/api/preview/stop',{stopped:true});await f.call('/api/preview/stop',{stopped:false});await f.mf.setOptions({...convertV4MiniflareOptions({modules:true,script,compatibilityDate:'2026-10-22',bindings:{MAIL_MODE:'preview'},d1Databases:{DB:'test'}}),telemetry:{enabled:false},logRequests:false});await f.call('/api/preview/dispatch',{});const s=await f.state();assert.equal(s.subscribers.length,1);assert.equal(s.deliveries.filter(d=>d.status==='cancelled').length,3);assert.equal(s.outbox.filter(m=>m.kind==='step').length,0);
 }finally{await f.close();}
});

test('explicit pre-acceptance failure can retry once with the same delivery identity',async()=>{
 const f=await fixture();try{await f.activate();await f.enroll();await f.call('/api/preview/dispatch',{outcome:'failed'});let s=await f.state();const d=s.deliveries.find(d=>d.edition_id==='welcome-01')!;assert.equal(d.status,'failed');assert.equal(s.outbox.filter(m=>m.kind==='step').length,0);await f.call('/api/preview/retry',{id:d.id});await f.call('/api/preview/dispatch',{});s=await f.state();assert.equal(s.deliveries.find(x=>x.id===d.id)!.status,'accepted');assert.equal(s.deliveries.find(x=>x.id===d.id)!.attempts,2);assert.equal(s.outbox.filter(m=>m.kind==='step').length,1);
 }finally{await f.close();}
});

test('address limits and resend preserve original consent evidence',async()=>{
 const f=await fixture();try{await f.activate();await f.subscribe();const consent=(await f.db.prepare('SELECT consent_at FROM subscribers').first<{consent_at:string}>())!.consent_at;for(let n=1;n<=4;n++){await f.clock(`2026-10-22T10:0${n}:00.000Z`);await f.call('/api/resend-confirmation',{email:'reader@example.test'},202);}await f.clock('2026-10-22T10:05:00.000Z');await f.call('/api/resend-confirmation',{email:'reader@example.test'},429);assert.equal((await f.state()).outbox.length,5);assert.equal((await f.db.prepare('SELECT consent_at FROM subscribers').first<{consent_at:string}>())!.consent_at,consent);
 }finally{await f.close();}
});

test('hard bounce keeps suppression after later delivery and re-registration',async()=>{
 const f=await fixture();try{await f.activate();const token=await f.enroll();await f.call('/api/preview/dispatch',{});const s=await f.state(),subscriberId=s.subscribers[0].id,deliveryId=s.deliveries[0].id;await f.call('/api/mail-events',{eventId:'bounce-1',type:'hard_bounce',subscriberId});await f.call('/api/mail-events',{eventId:'bounce-2',type:'delivered',subscriberId,deliveryId});await f.clock('2026-10-22T10:01:00.000Z');await f.call('/api/subscriptions',{email:'reader@example.test',newsletterConsent:true,consentVersion:'2026-10-22-v1'},202);assert.equal((await f.state()).subscribers[0].suppression_reason,'hard_bounce');assert.equal((await f.call('/api/confirm/status?token='+token)).state,'suppressed');
 }finally{await f.close();}
});

test('stop at confirmation issuance and enrollment transaction prevents new mail and reservations',async()=>{
 const f=await fixture();try{await f.activate();let batches=0;const original=f.db.batch.bind(f.db);
 const proxy=new Proxy(f.db,{get(target,key){if(key==='batch')return async(statements:Parameters<typeof original>[0])=>{batches++;if(batches===2)await f.service.stop(true);return original(statements);};const value=Reflect.get(target,key);return typeof value==='function'?value.bind(target):value;}});
 await assert.rejects(()=>new MailService(proxy,'http://localhost').subscribe({email:'stop@example.test',newsletterConsent:true,consentVersion:'2026-10-22-v1'},'fixture'),/受付をお休み/);assert.equal((await f.state()).outbox.length,0);await f.service.stop(false);const token=await f.subscribe();let stopped=false;
 const confirmProxy=new Proxy(f.db,{get(target,key){if(key==='batch')return async(statements:Parameters<typeof original>[0])=>{if(!stopped){stopped=true;await f.service.stop(true);}return original(statements);};const value=Reflect.get(target,key);return typeof value==='function'?value.bind(target):value;}});
 await assert.rejects(()=>new MailService(confirmProxy,'http://localhost').confirm(token),/受付をお休み/);assert.equal((await f.state()).deliveries.length,0);assert.equal((await f.call('/api/confirm/status?token='+token)).state,'valid');await f.service.stop(false);await f.service.dispatch();assert.equal((await f.state()).deliveries.length,0);
 }finally{await f.close();}
});

test('global-stop cancellation cannot be overwritten by a stale pre-acceptance failure',async()=>{
 const f=await fixture();try{await f.activate();await f.enroll();let stopped=false;const original=f.db.batch.bind(f.db);
 const proxy=new Proxy(f.db,{get(target,key){if(key==='batch')return async(statements:Parameters<typeof original>[0])=>{const result=await original(statements);if(!stopped&&(await f.state()).deliveries.some(d=>d.status==='submitting')){stopped=true;await f.service.stop(true);}return result;};const value=Reflect.get(target,key);return typeof value==='function'?value.bind(target):value;}});
 await new MailService(proxy,'http://localhost').dispatch('failed');await f.service.stop(false);const s=await f.state();const d=s.deliveries.find(d=>d.edition_id==='welcome-01')!;assert.equal(d.status,'cancelled');assert.equal(d.last_error,'global_stop');await assert.rejects(()=>f.service.retryFailed(d.id));await f.service.dispatch();assert.equal((await f.state()).outbox.filter(m=>m.kind==='step').length,0);
 }finally{await f.close();}
});

test('stale dispatcher cannot submit old content or cancel another claimed revision',async()=>{
 const f=await fixture();const source=content.editions.find(e=>e.id==='welcome-01')!,oldSubject=source.subject;let releaseNew=()=>{},newRunning:Promise<unknown>|undefined;try{await f.activate();await f.enroll();const original=f.db.batch.bind(f.db);let injected=false,newHeld=false;let signalNew=()=>{};const newClaimed=new Promise<void>(resolve=>{signalNew=resolve;});const holdNew=new Promise<void>(resolve=>{releaseNew=resolve;});
 const nextProxy=new Proxy(f.db,{get(target,key){if(key==='batch')return async(statements:Parameters<typeof original>[0])=>{const result=await original(statements);const row=await f.db.prepare("SELECT status,revision FROM deliveries WHERE edition_id='welcome-01'").first<{status:string;revision:number}>();if(!newHeld&&row?.status==='submitting'&&row.revision===2){newHeld=true;signalNew();await holdNew;}return result;};const value=Reflect.get(target,key);return typeof value==='function'?value.bind(target):value;}});
 const oldProxy=new Proxy(f.db,{get(target,key){if(key==='batch')return async(statements:Parameters<typeof original>[0])=>{const result=await original(statements);const row=await f.db.prepare("SELECT status FROM deliveries WHERE edition_id='welcome-01'").first<{status:string}>();if(!injected&&row?.status==='submitting'){injected=true;source.subject='改稿後の承認済み件名';await f.service.syncContent();await f.service.review('welcome-01','review',2);await f.service.review('welcome-01','activate',2);await f.service.rebind('welcome-01');newRunning=new MailService(nextProxy,'http://localhost').dispatch();await newClaimed;}return result;};const value=Reflect.get(target,key);return typeof value==='function'?value.bind(target):value;}});
 await new MailService(oldProxy,'http://localhost').dispatch();const held=await f.db.prepare("SELECT status,revision FROM deliveries WHERE edition_id='welcome-01'").first<{status:string;revision:number}>();assert.equal(held!.status,'submitting');assert.equal(held!.revision,2);releaseNew();await newRunning;const mail=await f.db.prepare("SELECT subject FROM mock_outbox WHERE kind='step'").first<{subject:string}>();assert.equal(mail!.subject,'改稿後の承認済み件名');assert.equal((await f.db.prepare("SELECT COUNT(*) AS n FROM mock_outbox WHERE kind='step'").first<{n:number}>())!.n,1);
 }finally{releaseNew();if(newRunning)await newRunning;source.subject=oldSubject;await f.close();}
});

test('a revised scheduled broadcast stays cancelled until explicitly rebound to its reviewed revision',async()=>{
 const f=await fixture();const source=content.editions.find(e=>e.id==='broadcast-001')!,old=source.subject;try{await f.activate();await f.enroll();await f.call('/api/preview/dispatch',{});await f.clock('2026-10-24T10:00:00.000Z');await f.call('/api/preview/dispatch',{});await f.clock('2026-10-27T10:00:00.000Z');await f.call('/api/preview/dispatch',{});await f.service.schedule('broadcast-001','2026-10-29T10:00:00.000Z');source.subject=old+'（改稿fixture）';await f.service.syncContent();await f.service.review('broadcast-001','review',2);await f.service.schedule('broadcast-001','2026-10-29T10:00:00.000Z');assert.equal((await f.db.prepare("SELECT status FROM deliveries WHERE edition_id='broadcast-001'").first<{status:string}>())!.status,'cancelled');await f.service.rebind('broadcast-001');await f.service.setClock('2026-10-29T10:00:00.000Z');await f.service.dispatch();const mail=await f.db.prepare("SELECT subject FROM mock_outbox WHERE kind='broadcast'").first<{subject:string}>();assert.equal(mail!.subject,source.subject);
 }finally{source.subject=old;await f.close();}
});
