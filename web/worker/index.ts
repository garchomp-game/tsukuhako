import { MailService, ApiError } from './service';
import { content, consentVersion, localPaths, replaceVariables } from './content';

function local(url:string) { try { return ['localhost','127.0.0.1','[::1]'].includes(new URL(url).hostname); } catch { return false; } }
function response(value:unknown,status=200) {
 return new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'"}});
}
async function boundedText(request:Request,limit:number) {
 if(Number(request.headers.get('content-length')||0)>limit) throw new ApiError(413,'入力が長すぎます。');
 if(!request.body)return '';
 const reader=request.body.getReader();const chunks:Uint8Array[]=[];let length=0;
 while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>limit){await reader.cancel();throw new ApiError(413,'入力が長すぎます。');}chunks.push(value);}
 const all=new Uint8Array(length);let offset=0;for(const chunk of chunks){all.set(chunk,offset);offset+=chunk.byteLength;}return new TextDecoder().decode(all);
}
async function body(request:Request):Promise<Record<string,unknown>> {
 if (!request.headers.get('content-type')?.includes('application/json')) throw new ApiError(415,'入力内容を確認してください。');
 const text = await boundedText(request,8192);
 try { const value:unknown=JSON.parse(text); if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(); return value as Record<string,unknown>; } catch { throw new ApiError(400,'入力内容を確認してください。'); }
}
export default {
 async fetch(request:Request,env:Env):Promise<Response> {
  const url = new URL(request.url);
  // This Worker is a LOCAL prototype. There is deliberately no production send path.
  if (env.MAIL_MODE !== 'preview' || !local(url.origin)) return response({error:'Local preview only; production adapter is unavailable.'},403);
  const forwarded = request.headers.get('x-preview-origin');
  const origin = forwarded && local(forwarded) ? forwarded : url.origin;
  const requestOrigin = request.headers.get('origin');
  if (requestOrigin && requestOrigin !== origin && requestOrigin !== url.origin) return response({error:'Origin is not allowed.'},403);
  if (request.headers.get('sec-fetch-site') === 'cross-site') return response({error:'Cross-site requests are not allowed.'},403);
  try {
   const service = new MailService(env.DB,origin);
   if (url.pathname === '/api/health') return response({mode:'preview',externalMailCalls:0});
   await service.syncContent();
   if (request.method === 'GET') {
    if (url.pathname === '/api/public') return response({mode:'preview',consentVersion,screenCopy:content.screenCopy,
     guides:Object.fromEntries(Object.entries(content.guides).map(([key,value])=>[key,replaceVariables(value,{},origin)])),
     links:Object.fromEntries(Object.entries(content.settings.publicLinks).map(([key,value])=>[key,value || localPaths[key] || null])),
     senderName:content.settings.senderName,senderContact:content.settings.senderContact});
    if (url.pathname === '/api/confirm/status') return response(await service.tokenStatus(url.searchParams.get('token') || ''));
    if (url.pathname === '/api/preview/state') return response(await service.snapshot());
    return response({error:'ページが見つかりません。'},404);
   }
   if (request.method !== 'POST') return response({error:'この操作は利用できません。'},405);
   if (url.pathname === '/api/unsubscribe' && request.headers.get('content-type')?.includes('application/x-www-form-urlencoded')) {
    const text = await boundedText(request,200);
    if ( new URLSearchParams(text).get('List-Unsubscribe') !== 'One-Click') throw new ApiError(400,'解除操作を確認してください。');
    return response(await service.unsubscribe(url.searchParams.get('token') || ''));
   }
   const input = await body(request);
   const source = 'loopback-preview';
   switch(url.pathname) {
    case '/api/subscriptions':return response(await service.subscribe(input,source),202);
    case '/api/resend-confirmation':return response(await service.subscribe(input,source,true),202);
    case '/api/confirm':return response(await service.confirm(String(input.token||'')));
    case '/api/unsubscribe':return response(await service.unsubscribe(String(input.token||'')));
    case '/api/mail-events':return response(await service.event(input));
    case '/api/preview/review':return response(await service.review(String(input.id),String(input.action),Number(input.revision)));
    case '/api/preview/rebind':return response(await service.rebind(String(input.id)));
    case '/api/preview/schedule':return response(await service.schedule(String(input.id),String(input.at)));
    case '/api/preview/clock':return response(await service.setClock(String(input.now)));
    case '/api/preview/dispatch':return response(await service.dispatch(String(input.outcome||'accepted')));
    case '/api/preview/reconcile':return response(await service.reconcile(String(input.id)));
    case '/api/preview/retry':return response(await service.retryFailed(String(input.id)));
    case '/api/preview/stop':return response(await service.stop(input.stopped === true));
    case '/api/preview/cancel':return response(await service.cancel(String(input.id)));
    default:return response({error:'ページが見つかりません。'},404);
   }
  } catch(error) {
   if (error instanceof ApiError) return response({error:error.message,...error.extra},error.status);
   // Do not log request URLs, confirmation tokens, addresses or provider payloads.
   console.error('local-preview-operation-failed', error instanceof Error ? error.name : 'Error');
   return response({error:'処理を続けられませんでした。入力を確認して、もう一度お試しください。'},500);
  }
 }
} satisfies ExportedHandler<Env>;
