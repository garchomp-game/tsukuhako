import { content, consentVersion, hash, randomToken, jstDay, stepTime, nextJstEvening, jstDisplay, renderMail, releaseBlockers } from './content';
import type { Edition, EditionSource } from './content';

export class ApiError extends Error { constructor(public status:number, message:string, public extra:Record<string,unknown> = {}) { super(message); } }
type Subscriber = {id:string;email:string;email_verified_at:string|null;subscription_status:string;consent_version:string;consent_at:string;unsubscribed_at:string|null;suppression_reason:string|null;confirmed_at:string|null;enrollment_id:string|null};
type Delivery = {id:string;subscriber_id:string;edition_id:string;revision:number;enrollment_id:string;step:number|null;planned_at_utc:string;originally_planned_at:string;status:string;provider_id:string|null;attempts:number;last_error:string|null;accepted_at:string|null};
export class MailService {
 constructor(readonly db:D1Database,readonly origin:string) {}
 q(sql:string,...params:(string|number|null)[]) { return this.db.prepare(sql).bind(...params); }
 async now() { return (await this.q("SELECT value FROM settings WHERE key='clock'").first<{value:string}>())!.value; }
 async stopped() { return (await this.q("SELECT value FROM settings WHERE key='stopped'").first<{value:string}>())!.value === 'true'; }
 async current(id:string) { return this.q('SELECT * FROM editions WHERE id=? AND current=1',id).first<Edition>(); }
 async syncContent() {
  for (const source of content.editions as EditionSource[]) {
   const footer = source.type === 'transactional' ? content.transactionalFooter : content.footer;
   const guideKeys:Record<string,string>={startGuide:'start',setupGuide:'setup-check',exerciseGuide:'first-change',updateNotes:'one-less-step'};
   const linkedGuides=Object.fromEntries(source.links.filter(k=>guideKeys[k]).map(k=>[k,(content.guides as Record<string,string>)[guideKeys[k]]]));
   const basis = JSON.stringify({source,footer,settings:content.settings,linkedGuides});
   const old = await this.current(source.id);
   if (old && old.content_hash === await hash(basis + ':revision:' + old.revision)) continue;
   const revision = (old?.revision || 0) + 1;
   const contentHash = await hash(basis + ':revision:' + revision);
   // A reverted text still gets a fresh revision; concurrent imports of the same revision are harmless.
   await this.db.batch([
    this.q("UPDATE deliveries SET status='cancelled',last_error='revision_changed' WHERE edition_id=? AND status IN ('planned','submitting') AND NOT EXISTS(SELECT 1 FROM mock_outbox WHERE delivery_id=deliveries.id) AND EXISTS(SELECT 1 FROM editions WHERE id=? AND current=1 AND content_hash!=?)",source.id,source.id,contentHash),
    this.q("UPDATE editions SET current=0,status=CASE WHEN status IN ('active','reviewed','scheduled','sending') THEN 'retired' ELSE status END WHERE id=? AND current=1 AND content_hash!=?",source.id,contentHash),
    this.q('INSERT OR IGNORE INTO editions(id,revision,source_revision,type,subject,body_markdown,link_keys,source_refs,audience_rule,content_hash,current) VALUES(?,?,?,?,?,?,?,?,?,?,1)',source.id,revision,source.revision,source.type,source.subject,source.bodyMarkdown,JSON.stringify(source.links),JSON.stringify(source.sourceRefs),source.audience,contentHash)
   ]);
  }
 }
 async consumeLimit(email:string, source:string) {
  const now = await this.now();
  const addressHash = await hash(email);
  const sourceHash = await hash(source);
  const addressBucket = `email:${jstDay(now)}`;
  const sourceBucket = `source:${now.slice(0,13)}`;
  const counts = await this.db.batch([
   this.q('INSERT INTO rate_limits VALUES (?,?,1) ON CONFLICT(bucket,key_hash) DO UPDATE SET count=count+1 RETURNING count',addressBucket,addressHash),
   this.q('INSERT INTO rate_limits VALUES (?,?,1) ON CONFLICT(bucket,key_hash) DO UPDATE SET count=count+1 RETURNING count',sourceBucket,sourceHash)
  ]);
  if ((counts[0].results[0] as {count:number}).count > content.settings.rules.confirmationDailyLimit || (counts[1].results[0] as {count:number}).count > content.settings.rules.sourceHourlyLimit) throw new ApiError(429,'送信が続いています。時間をおいて、もう一度お試しください。',{retryAfter:3600});
 }
 async subscribe(input:Record<string,unknown>,source:string,resend=false) {
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new ApiError(400,'メールアドレスを確認してください。');
  // A preview must never collect real customer addresses.
  if (!/@(?:[^@]+\.(?:test|invalid)|example\.com)$/.test(email)) throw new ApiError(400,'ローカル試作では reader@example.test などの架空アドレスを使ってください。');
  if (!resend && (input.newsletterConsent !== true || input.consentVersion !== consentVersion)) throw new ApiError(400,'内容・頻度を確認し、同意のチェックを入れてください。');
  await this.consumeLimit(email,source);
  const now = await this.now();
  let subscriber = await this.q('SELECT * FROM subscribers WHERE email=?',email).first<Subscriber>();
  if (resend && !subscriber) return {accepted:true};
  if (subscriber?.subscription_status === 'subscribed' || (subscriber?.suppression_reason && subscriber.suppression_reason !== 'unsubscribed')) return {accepted:true};
  const confirm = await this.current('confirm');
  if (await this.stopped()) throw new ApiError(503,'現在、受付をお休みしています。');
  if (!confirm || confirm.status !== 'active') throw new ApiError(503,'現在、案内を準備しています。ローカル確認画面で原稿を確認してください。');
  if (subscriber) {
   const latest = await this.q('SELECT created_at FROM confirmation_tokens WHERE subscriber_id=? ORDER BY created_at DESC LIMIT 1',subscriber.id).first<{created_at:string}>();
   if (latest && Date.parse(now) - Date.parse(latest.created_at) < content.settings.rules.confirmationCooldownSeconds*1000) throw new ApiError(429,'続けて送信されています。60秒おいてから、もう一度お試しください。',{retryAfter:60});
  } else {
   const id = crypto.randomUUID();
   await this.q('INSERT OR IGNORE INTO subscribers(id,email,consent_version,consent_at,unsubscribe_hash) VALUES(?,?,?,?,?)',id,email,consentVersion,now,await hash(randomToken())).run();
   subscriber = (await this.q('SELECT * FROM subscribers WHERE email=?',email).first<Subscriber>())!;
  }
  const token = randomToken(), tokenHash = await hash(token), enrollment = crypto.randomUUID();
  const expiresAt = new Date(Date.parse(now)+content.settings.rules.confirmationTtlHours*3600000).toISOString();
  const deliveryId = `confirmation:${tokenHash}`;
  const mail = renderMail(confirm,{confirmUrl:`${this.origin}/mail/confirm?token=${token}`,confirmationExpiresAtJST:jstDisplay(expiresAt)},this.origin);
  const cutoff = new Date(Date.parse(now)-content.settings.rules.confirmationCooldownSeconds*1000).toISOString();
  const issued = await this.db.batch([
   this.q('INSERT INTO confirmation_tokens(hash,subscriber_id,enrollment_id,expires_at,created_at) SELECT ?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM confirmation_tokens WHERE subscriber_id=? AND created_at>?)',tokenHash,subscriber.id,enrollment,expiresAt,now,subscriber.id,cutoff),
   this.q('UPDATE confirmation_tokens SET invalidated_at=? WHERE subscriber_id=? AND hash!=? AND used_at IS NULL AND invalidated_at IS NULL AND EXISTS(SELECT 1 FROM confirmation_tokens WHERE hash=?)',now,subscriber.id,tokenHash,tokenHash),
   this.q('UPDATE subscribers SET consent_version=?,consent_at=? WHERE id=? AND EXISTS(SELECT 1 FROM confirmation_tokens WHERE hash=?)',consentVersion,now,subscriber.id,tokenHash),
   this.q('INSERT INTO mock_outbox(delivery_id,subscriber_id,subject,body_text,body_html,created_at,provider_id,kind) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM confirmation_tokens WHERE hash=?)',deliveryId,subscriber.id,mail.subject,mail.text,mail.html,now,`mock:${deliveryId}`,'transactional',tokenHash)
  ]);
  if (!issued[0].meta.changes) throw new ApiError(429,'続けて送信されています。60秒おいてから、もう一度お試しください。',{retryAfter:60});
  return {accepted:true};
 }
 async tokenStatus(token:string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return {state:'invalid'};
  const row = await this.q(`SELECT t.*,s.subscription_status,s.suppression_reason FROM confirmation_tokens t JOIN subscribers s ON s.id=t.subscriber_id WHERE hash=?`,await hash(token)).first<{hash:string;subscriber_id:string;enrollment_id:string;expires_at:string;used_at:string|null;invalidated_at:string|null;subscription_status:string;suppression_reason:string|null}>();
  if (!row) return {state:'invalid'};
  // Current suppression wins over an old used confirmation link.
  if (row.suppression_reason && row.suppression_reason !== 'unsubscribed') return {state:'suppressed'};
  if (row.used_at) return {state:row.subscription_status === 'unsubscribed' ? 'unsubscribed' : 'used'};
  if (row.invalidated_at) return {state:'invalidated'};
  if (Date.parse(row.expires_at) <= Date.parse(await this.now())) return {state:'expired'};
  return {state:'valid',expiresAt:row.expires_at};
 }
 async confirm(token:string) {
  const state = await this.tokenStatus(token);
  if (state.state === 'used') return {state:'used'};
  if (state.state !== 'valid') throw new ApiError(409,'このリンクからは登録できません。新しい確認メールを受け取ってください。',state);
  if (await this.stopped()) throw new ApiError(503,'現在、受付をお休みしています。');
  const tokenHash = await hash(token), now = await this.now();
  const row = (await this.q('SELECT subscriber_id,enrollment_id FROM confirmation_tokens WHERE hash=?',tokenHash).first<{subscriber_id:string;enrollment_id:string}>())!;
  const statements = [
   this.q(`UPDATE subscribers SET subscription_status='subscribed',email_verified_at=?,confirmed_at=?,enrollment_id=?,unsubscribed_at=NULL,suppression_reason=NULL
    WHERE id=? AND (suppression_reason IS NULL OR suppression_reason='unsubscribed')
    AND EXISTS(SELECT 1 FROM confirmation_tokens WHERE hash=? AND used_at IS NULL AND invalidated_at IS NULL AND expires_at>?)`,now,now,row.enrollment_id,row.subscriber_id,tokenHash,now),
   this.q(`UPDATE confirmation_tokens SET used_at=? WHERE hash=? AND used_at IS NULL AND invalidated_at IS NULL
    AND EXISTS(SELECT 1 FROM subscribers WHERE id=? AND enrollment_id=? AND subscription_status='subscribed')`,now,tokenHash,row.subscriber_id,row.enrollment_id)
  ];
  for (const step of [1,2,3]) {
   const edition = (await this.current(`welcome-0${step}`))!;
   const when = stepTime(now,step);
   statements.push(this.q(`INSERT OR IGNORE INTO deliveries(id,subscriber_id,edition_id,revision,enrollment_id,step,planned_at_utc,originally_planned_at)
    SELECT ?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM subscribers WHERE id=? AND enrollment_id=? AND subscription_status='subscribed')`,crypto.randomUUID(),row.subscriber_id,edition.id,edition.revision,row.enrollment_id,step,when,when,row.subscriber_id,row.enrollment_id));
  }
  await this.db.batch(statements);
  return {state:(await this.tokenStatus(token)).state === 'used' ? 'confirmed' : 'unsubscribed'};
 }
 async unsubscribe(token:string) {
  if (!/^[a-f0-9]{64}$/.test(token)) throw new ApiError(400,'解除リンクを確認してください。');
  const match = await this.q('SELECT subscriber_id FROM unsubscribe_tokens WHERE hash=?',await hash(token)).first<{subscriber_id:string}>();
  if (!match) throw new ApiError(400,'解除リンクを確認してください。');
  await this.suppress(match.subscriber_id,'unsubscribed');
  return {state:'unsubscribed'};
 }
 async suppress(subscriberId:string,reason:string) {
  const now = await this.now();
  await this.db.batch([
   this.q(`UPDATE subscribers SET subscription_status='unsubscribed',unsubscribed_at=?,suppression_reason=CASE WHEN suppression_reason IN ('complaint','hard_bounce') THEN suppression_reason ELSE ? END WHERE id=?`,now,reason,subscriberId),
   this.q("UPDATE deliveries SET status='suppressed',last_error=? WHERE subscriber_id=? AND status IN ('planned','submitting') AND NOT EXISTS(SELECT 1 FROM mock_outbox WHERE delivery_id=deliveries.id)",reason,subscriberId),
   this.q('UPDATE confirmation_tokens SET invalidated_at=? WHERE subscriber_id=? AND used_at IS NULL',now,subscriberId)
  ]);
 }
 async review(id:string,action:string,revision:number) {
  const edition = await this.current(id);
  if (!edition || edition.revision !== revision) throw new ApiError(409,'原稿の版が変わりました。再読み込みして確認してください。');
  if (action === 'review') {
   if (edition.status !== 'draft') throw new ApiError(409,'下書きの版を確認してください。');
   await this.q("UPDATE editions SET status='reviewed',reviewed_at=?,reviewed_by='local-preview-operator' WHERE id=? AND revision=? AND status='draft'",await this.now(),id,revision).run();
  } else if (action === 'activate') {
   if (edition.type === 'broadcast' || edition.status !== 'reviewed') throw new ApiError(409,'確認済みの共通原稿だけを有効にできます。');
   await this.q("UPDATE editions SET status='active' WHERE id=? AND revision=? AND status='reviewed'",id,revision).run();
  } else throw new ApiError(400,'操作を確認してください。');
  return {ok:true};
 }
 async rebind(id:string) {
  const edition = await this.current(id);
  if (!edition || edition.status !== 'active') throw new ApiError(409,'新しい版の確認と有効化を先に行ってください。');
  if (await this.stopped()) throw new ApiError(409,'全体停止中です。');
  // Only revision-related cancellations; unsubscribe/global-stop cancellations never revive.
  await this.q(`UPDATE deliveries SET revision=?,status='planned',last_error=NULL WHERE edition_id=? AND status='cancelled' AND last_error='revision_changed'
   AND EXISTS(SELECT 1 FROM subscribers s WHERE s.id=deliveries.subscriber_id AND s.subscription_status='subscribed' AND s.suppression_reason IS NULL AND s.enrollment_id=deliveries.enrollment_id)`,edition.revision,id).run();
  return {ok:true};
 }
 async schedule(id:string,at:string) {
  const now = await this.now(), edition = await this.current(id);
  if (!edition || edition.type !== 'broadcast' || edition.status !== 'reviewed') throw new ApiError(409,'定期便は号ごとの確認が必要です。');
  if (!Number.isFinite(Date.parse(at)) || Date.parse(at)<Date.parse(now)) throw new ApiError(400,'仮想時計より後の日時を指定してください。');
  if (await this.stopped()) throw new ApiError(409,'全体停止中です。');
  await this.q("UPDATE editions SET status='scheduled',scheduled_at=? WHERE id=? AND revision=?",new Date(at).toISOString(),id,edition.revision).run();
  await this.planBroadcasts();
  return {ok:true};
 }
 async planBroadcasts() {
  const editions = (await this.q("SELECT * FROM editions WHERE type='broadcast' AND current=1 AND status='scheduled'").all<Edition>()).results;
  for (const edition of editions) {
   const at = edition.scheduled_at!;
   const cutoff = new Date(Date.parse(at)-7*86400000).toISOString();
   // A completed/skipped introduction is a separate condition from the seven-day threshold.
   const audience = (await this.q(`SELECT * FROM subscribers s WHERE subscription_status='subscribed' AND suppression_reason IS NULL AND confirmed_at<=?
    AND (SELECT COUNT(*) FROM deliveries d WHERE d.subscriber_id=s.id AND d.enrollment_id=s.enrollment_id AND step IS NOT NULL)=3
    AND NOT EXISTS(SELECT 1 FROM deliveries d WHERE d.subscriber_id=s.id AND d.enrollment_id=s.enrollment_id AND step IS NOT NULL AND status NOT IN ('accepted','delivered','skipped'))`,cutoff).all<Subscriber>()).results;
   for (const subscriber of audience) await this.q(`INSERT OR IGNORE INTO deliveries(id,subscriber_id,edition_id,revision,enrollment_id,step,planned_at_utc,originally_planned_at) VALUES(?,?,?,?,?,NULL,?,?)`,crypto.randomUUID(),subscriber.id,edition.id,edition.revision,subscriber.enrollment_id!,at,at).run();
  }
 }
 async dispatch(outcome='accepted') {
  if (!['accepted','timeout','failed'].includes(outcome)) throw new ApiError(400,'Mock結果を確認してください。');
  if (await this.stopped()) return {processed:0,stopped:true};
  const now = await this.now();
  await this.planBroadcasts();
  const candidates = (await this.q("SELECT * FROM deliveries WHERE status='planned' AND planned_at_utc<=? ORDER BY planned_at_utc,step",now).all<Delivery>()).results;
  let processed = 0;
  for (const delivery of candidates) {
   const subscriber = (await this.q('SELECT * FROM subscribers WHERE id=?',delivery.subscriber_id).first<Subscriber>())!;
   const edition = (await this.q('SELECT * FROM editions WHERE id=? AND revision=?',delivery.edition_id,delivery.revision).first<Edition>())!;
   if (subscriber.subscription_status !== 'subscribed' || subscriber.suppression_reason || subscriber.enrollment_id !== delivery.enrollment_id) {
    await this.q("UPDATE deliveries SET status='suppressed',last_error='subscription_stopped' WHERE id=? AND status='planned'",delivery.id).run(); continue;
   }
   if (Date.parse(now)-Date.parse(delivery.originally_planned_at)>content.settings.rules.maxLatenessHours*3600000) {
    await this.q("UPDATE deliveries SET status='skipped',last_error='max_lateness_exceeded' WHERE id=? AND status='planned'",delivery.id).run(); continue;
   }
   if (!edition.current || !['active','scheduled','sending'].includes(edition.status)) {
    await this.q("UPDATE deliveries SET last_error='unapproved_revision' WHERE id=? AND status='planned'",delivery.id).run();continue;
   }
   if (edition.type === 'broadcast') {
    const unresolved = await this.q("SELECT COUNT(*) AS n FROM deliveries WHERE subscriber_id=? AND enrollment_id=? AND step IS NOT NULL AND status NOT IN ('accepted','delivered','skipped')",subscriber.id,subscriber.enrollment_id!).first<{n:number}>();
    if (!subscriber.confirmed_at || Date.parse(now)-Date.parse(subscriber.confirmed_at)<7*86400000 || unresolved!.n>0) continue;
   }
   // The claim and subscription/stop recheck are atomic; concurrent runners cannot submit twice.
   const claims = await this.db.batch([
    this.q(`INSERT OR IGNORE INTO daily_claims(subscriber_id,jst_day,delivery_id)
     SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM deliveries WHERE id=? AND status='planned')
     AND EXISTS(SELECT 1 FROM subscribers WHERE id=? AND subscription_status='subscribed' AND suppression_reason IS NULL)
     AND (SELECT value FROM settings WHERE key='stopped')='false'`,subscriber.id,jstDay(now),delivery.id,delivery.id,subscriber.id),
    this.q(`UPDATE deliveries SET status='submitting',attempts=attempts+1,last_error=NULL WHERE id=? AND status='planned'
     AND EXISTS(SELECT 1 FROM daily_claims WHERE delivery_id=? AND jst_day=?)
     AND EXISTS(SELECT 1 FROM subscribers WHERE id=? AND subscription_status='subscribed' AND suppression_reason IS NULL)
     AND (SELECT value FROM settings WHERE key='stopped')='false' RETURNING id`,delivery.id,delivery.id,jstDay(now),subscriber.id)
   ]);
   if (!claims[1].results.length) {
    await this.q("UPDATE deliveries SET planned_at_utc=?,last_error='daily_limit' WHERE id=? AND status='planned'",nextJstEvening(now),delivery.id).run();continue;
   }
   processed++;
   if (outcome === 'failed') {
    await this.db.batch([
     this.q("UPDATE deliveries SET status='failed',last_error='mock_rejected_before_acceptance' WHERE id=?",delivery.id),
     this.q('DELETE FROM daily_claims WHERE delivery_id=?',delivery.id)
    ]);continue;
   }
   const unsubscribeToken = randomToken();
   const unsubscribeUrl = `${this.origin}/mail/unsubscribe?token=${unsubscribeToken}`;
   const mail = renderMail(edition,{unsubscribeUrl},this.origin);
   const providerId = `mock:${delivery.id}`;
   const guard = "EXISTS(SELECT 1 FROM deliveries d JOIN subscribers s ON s.id=d.subscriber_id JOIN editions e ON e.id=d.edition_id AND e.revision=d.revision WHERE d.id=? AND d.status='submitting' AND s.subscription_status='subscribed' AND s.suppression_reason IS NULL AND s.enrollment_id=d.enrollment_id AND e.current=1 AND e.status IN ('active','scheduled','sending')) AND (SELECT value FROM settings WHERE key='stopped')='false'";
   await this.db.batch([
    this.q('INSERT INTO unsubscribe_tokens SELECT ?,? WHERE '+guard,await hash(unsubscribeToken),subscriber.id,delivery.id),
    this.q('INSERT OR IGNORE INTO mock_outbox(delivery_id,subscriber_id,subject,body_text,body_html,created_at,provider_id,kind,headers) SELECT ?,?,?,?,?,?,?,?,? WHERE '+guard,delivery.id,subscriber.id,mail.subject,mail.text,mail.html,now,providerId,edition.type,JSON.stringify({'List-Unsubscribe':`<${this.origin}/api/unsubscribe?token=${unsubscribeToken}>`,'List-Unsubscribe-Post':'List-Unsubscribe=One-Click'}),delivery.id),
    this.q(`UPDATE deliveries SET status=?,provider_id=?,accepted_at=?,last_error=? WHERE id=? AND status='submitting' AND EXISTS(SELECT 1 FROM mock_outbox WHERE delivery_id=deliveries.id)`,outcome==='timeout'?'unknown':'accepted',outcome==='timeout'?null:providerId,outcome==='timeout'?null:now,outcome==='timeout'?'mock_timeout_after_acceptance':null,delivery.id),
    this.q("UPDATE deliveries SET status='cancelled',last_error='acceptance_blocked' WHERE id=? AND status='submitting' AND NOT EXISTS(SELECT 1 FROM mock_outbox WHERE delivery_id=deliveries.id)",delivery.id),
    this.q("DELETE FROM daily_claims WHERE delivery_id=? AND NOT EXISTS(SELECT 1 FROM mock_outbox WHERE delivery_id=?)",delivery.id,delivery.id)
   ]);
  }
  // Scheduled editions finish after their due audience is processed; no backlog flood for late joiners.
  await this.q(`UPDATE editions SET status='completed' WHERE type='broadcast' AND status IN ('scheduled','sending') AND scheduled_at<=?
   AND NOT EXISTS(SELECT 1 FROM deliveries d WHERE d.edition_id=editions.id AND d.revision=editions.revision AND status IN ('planned','submitting','unknown','failed'))`,now).run();
  return {processed,stopped:false};
 }
 async reconcile(id:string) {
  const delivery = await this.q('SELECT * FROM deliveries WHERE id=?',id).first<Delivery>();
  if (!delivery || delivery.status !== 'unknown') throw new ApiError(409,'照合する受付不明の配送を選んでください。');
  const receipt = await this.q('SELECT provider_id,created_at FROM mock_outbox WHERE delivery_id=?',id).first<{provider_id:string;created_at:string}>();
  if (receipt) await this.q("UPDATE deliveries SET status='accepted',provider_id=?,accepted_at=?,last_error='mock_receipt_reconciled' WHERE id=? AND status='unknown'",receipt.provider_id,receipt.created_at,id).run();
  return {state:receipt?'accepted':'unknown',resent:false};
 }
 async retryFailed(id:string) {
  const now = await this.now();
  const delivery = await this.q('SELECT * FROM deliveries WHERE id=?',id).first<Delivery>();
  if (!delivery || delivery.status !== 'failed' || delivery.last_error !== 'mock_rejected_before_acceptance') throw new ApiError(409,'受付前の失敗が確認された配送だけを再予約できます。');
  if (Date.parse(now)-Date.parse(delivery.originally_planned_at)>content.settings.rules.maxLatenessHours*3600000) throw new ApiError(409,'許容遅延を超えています。');
  if (await this.stopped()) throw new ApiError(409,'全体停止中です。');
  await this.q(`UPDATE deliveries SET status='planned',last_error=NULL WHERE id=? AND status='failed'
   AND EXISTS(SELECT 1 FROM subscribers s WHERE s.id=deliveries.subscriber_id AND s.subscription_status='subscribed' AND s.suppression_reason IS NULL AND s.enrollment_id=deliveries.enrollment_id)`,id).run();
  return {ok:true};
 }
 async event(input:Record<string,unknown>) {
  const {eventId,type,subscriberId,deliveryId} = input;
  if (typeof eventId !== 'string' || eventId.length>120 || !['delivered','complaint','hard_bounce','unsubscribe'].includes(String(type)) || typeof subscriberId !== 'string') throw new ApiError(400,'Mockイベントを確認してください。');
  const now = await this.now();
  const pending = 'EXISTS(SELECT 1 FROM provider_events WHERE event_id=? AND processed_at IS NULL AND type=?)';
  const statements=[this.q('INSERT OR IGNORE INTO provider_events(event_id,type,received_at) VALUES(?,?,?)',eventId,String(type),now)];
  if(type==='delivered' && typeof deliveryId==='string') statements.push(this.q("UPDATE deliveries SET status='delivered' WHERE id=? AND subscriber_id=? AND status IN ('accepted','unknown') AND "+pending,deliveryId,subscriberId,eventId,String(type)));
  if(type!=='delivered') {
   const reason=type==='unsubscribe'?'unsubscribed':String(type);
   statements.push(
    this.q("UPDATE subscribers SET subscription_status='unsubscribed',unsubscribed_at=?,suppression_reason=CASE WHEN suppression_reason IN ('complaint','hard_bounce') THEN suppression_reason ELSE ? END WHERE id=? AND "+pending,now,reason,subscriberId,eventId,String(type)),
    this.q("UPDATE deliveries SET status='suppressed',last_error=? WHERE subscriber_id=? AND status IN ('planned','submitting') AND NOT EXISTS(SELECT 1 FROM mock_outbox WHERE delivery_id=deliveries.id) AND "+pending,reason,subscriberId,eventId,String(type)),
    this.q('UPDATE confirmation_tokens SET invalidated_at=? WHERE subscriber_id=? AND used_at IS NULL AND '+pending,now,subscriberId,eventId,String(type))
   );
  }
  statements.push(this.q('UPDATE provider_events SET processed_at=? WHERE event_id=? AND processed_at IS NULL AND type=?',now,eventId,String(type)));
  const result=await this.db.batch(statements);
  return {accepted:true,duplicate:result[result.length-1].meta.changes===0};
 }
 async setClock(value:string) {
  if (!Number.isFinite(Date.parse(value)) || Date.parse(value)<Date.parse(await this.now())) throw new ApiError(400,'仮想時計は現在より後へ進めてください。');
  await this.q("UPDATE settings SET value=? WHERE key='clock'",new Date(value).toISOString()).run(); return {now:await this.now()};
 }
 async stop(value:boolean) {
  const statements = [this.q("UPDATE settings SET value=? WHERE key='stopped'",String(value))];
  if (value) statements.push(
   this.q("UPDATE deliveries SET status='cancelled',last_error='global_stop' WHERE status IN ('planned','submitting') AND NOT EXISTS(SELECT 1 FROM mock_outbox WHERE delivery_id=deliveries.id)"),
   this.q("UPDATE editions SET status='retired' WHERE type='broadcast' AND status IN ('scheduled','sending')")
  );
  await this.db.batch(statements); return {stopped:value};
 }
 async cancel(id:string) { await this.q("UPDATE deliveries SET status='cancelled',last_error='operator_cancelled' WHERE id=? AND status='planned'",id).run();return {ok:true}; }
 async snapshot() {
  const [subscribers,editions,deliveries,outbox,events] = await Promise.all([
   this.q('SELECT id,email,email_verified_at,subscription_status,consent_version,consent_at,confirmed_at,enrollment_id,suppression_reason,unsubscribed_at FROM subscribers ORDER BY consent_at').all(),
   this.q('SELECT * FROM editions ORDER BY id,revision DESC').all<Edition>(),
   this.q('SELECT * FROM deliveries ORDER BY planned_at_utc').all(),
   this.q('SELECT * FROM mock_outbox ORDER BY created_at DESC').all(),
   this.q('SELECT * FROM provider_events ORDER BY received_at').all()
  ]);
  return {mode:'preview',now:await this.now(),stopped:await this.stopped(),subscribers:subscribers.results,editions:editions.results,deliveries:deliveries.results,outbox:outbox.results,events:events.results,releaseBlockers:releaseBlockers(editions.results),sourceHash:content.sourceHash};
 }
}
