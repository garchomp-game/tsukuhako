import imported from '../.generated/content.json';
export const content = imported;
export type EditionSource = {
 id: string; type: string; revision: number; status: string; subject: string;
 audience: string; links: string[]; sourceRefs: string[]; bodyMarkdown: string;
};
export type Edition = {
 id: string; type: string; revision: number; source_revision: number; subject: string;
 body_markdown: string; link_keys: string; source_refs: string; audience_rule: string;
 status: string; reviewed_at: string | null; reviewed_by: string | null;
 content_hash: string; current: number; scheduled_at: string | null;
};
export const localPaths: Record<string, string> = {
 startGuide:'/start',setupGuide:'/guides/setup-check',exerciseGuide:'/guides/first-change',
 updateNotes:'/guides/one-less-step',subscribe:'/mail'
};
export const consentVersion = content.screenCopy.consentVersion || '2026-10-22-v1';
export const runtimeKeys = ['confirmUrl','unsubscribeUrl','confirmationExpiresAtJST','senderName','senderContact'];
export async function hash(value: string) {
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), v=>v.toString(16).padStart(2,'0')).join('');
}
export function randomToken() { return Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join(''); }
export function jstDay(value: string) { return new Date(Date.parse(value) + 9*3600000).toISOString().slice(0,10); }
export function stepTime(confirmed: string, step: number) {
 if (step === 1) return confirmed;
 const day = jstDay(confirmed);
 return new Date(Date.parse(`${day}T10:00:00.000Z`) + (step === 2 ? 2 : 5)*86400000).toISOString();
}
export function nextJstEvening(value: string) { return new Date(Date.parse(`${jstDay(value)}T10:00:00.000Z`) + 86400000).toISOString(); }
export function jstDisplay(value: string) { return new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',dateStyle:'medium',timeStyle:'short'}).format(new Date(value)) + '（日本時間）'; }
export function replaceVariables(text: string, variables: Record<string,string>, origin: string) {
 return text.replace(/{{\s*([^{}]+?)\s*}}/g, (_,key:string) => {
  if (key.startsWith('links.')) {
   const name = key.slice(6);
   const fixed = (content.settings.publicLinks as Record<string,string|null>)[name];
   return fixed || (localPaths[name] ? origin + localPaths[name] : `［設定待ち：${name}］`);
  }
  return variables[key] || (key === 'senderName' ? '［ローカル試作：送信者名は設定待ち］' : key === 'senderContact' ? '［ローカル試作：連絡先は設定待ち］' : `［未解決：${key}］`);
 });
}
export function renderMail(edition: Edition, variables: Record<string,string>, origin: string) {
 const footer = edition.type === 'transactional' ? content.transactionalFooter : content.footer;
 const allVariables = { senderName: content.settings.senderName || '', senderContact: content.settings.senderContact || '', ...variables };
 const markdown = replaceVariables(edition.body_markdown + '\n\n' + footer,allVariables,origin);
 if (/［未解決：/.test(markdown)) throw new Error('Unknown or missing runtime variable');
 const escape = (s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
 const text = markdown.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1\n$2');
 const htmlBody = escape(markdown).replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" rel="noreferrer" target="_top">$1</a>');
 return {subject:replaceVariables(edition.subject,allVariables,origin),text,html:`<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="referrer" content="no-referrer"><body><div style="white-space:pre-wrap;font:16px/1.8 sans-serif">${htmlBody}</div></body></html>`};
}
export function releaseBlockers(editions: Edition[]) {
 const blockers: string[] = [];
 for (const [key,value] of Object.entries(content.settings.publicLinks)) if (!value) blockers.push(`links.${key} is unset`);
 if (!content.settings.senderName) blockers.push('senderName is unset');
 if (!content.settings.senderContact) blockers.push('senderContact is unset');
 for (const edition of editions) {
  // The local preview review is deliberately never an approval to distribute publicly.
  if (edition.current && !['active','scheduled','completed'].includes(edition.status)) blockers.push(`${edition.id}: local revision is not active`);
 }
 if ((content.editions as EditionSource[]).some(e=>e.status !== 'active')) blockers.push('Source drafts have no production approval');
 blockers.push('Production sender adapter is intentionally unavailable');
 return blockers;
}
