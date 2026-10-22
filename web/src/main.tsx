import React,{lazy,Suspense,useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import Markdown from 'react-markdown';
import {api} from './api';
import './style.css';
declare const __LOCAL_PREVIEW__:boolean;
const Preview=__LOCAL_PREVIEW__?lazy(()=>import('./Preview')):null;
type Copy=typeof import('../.generated/content.json')['screenCopy'];
type PublicData={mode:string;consentVersion:string;screenCopy:Copy;guides:Record<string,string>;links:Record<string,string|null>;senderName:string|null;senderContact:string|null};
const path=location.pathname;
function Link({url,children}:{url:string|null;children:React.ReactNode}) {return url?<a href={url}>{children}</a>:<span className="waiting">{children}（設定待ち）</span>;}
function MarkdownBody({text}:{text:string}){return <div className="prose"><Markdown urlTransform={url=>/^(https?:\/\/|\/[^/])/.test(url)?url:''}>{text}</Markdown></div>;}
function App(){
 const [data,setData]=useState<PublicData|null>(null),[error,setError]=useState('');
 useEffect(()=>{void api<PublicData>('/api/public').then(setData).catch(e=>setError(e.message));},[]);
 return <><a className="skip" href="#main">本文へ移動</a><header><a className="brand" href="/">ツクハコ <small>はじめるためのガイド</small></a><nav aria-label="メイン"><a href="/start">使い始める</a><a href="/mail">メールの案内</a></nav></header>
 {__LOCAL_PREVIEW__&&<aside className="local-banner">ローカル試作・実メールは送信しません。架空アドレス（reader@example.test）で試せます。<a href="/preview">原稿と配信予定を確認する</a></aside>}
 <main id="main">{error?<p role="alert">{error}</p>:!data?<p role="status">読み込み中です。</p>:path==='/preview'&&Preview?<Suspense fallback={<p>読み込み中です。</p>}><Preview/></Suspense>:<Page data={data}/>}</main>
 <footer><p>学習用開発環境をつくり、ひとつずつ試すために。</p><Link url={data?.links.privacy||null}>プライバシーについて</Link></footer></>;
}
function Page({data}:{data:PublicData}){
 if(path==='/mail')return <Subscribe data={data}/>;
 if(path==='/mail/check')return <Check data={data}/>;
 if(path==='/mail/confirm')return <Confirm data={data}/>;
 if(path==='/mail/unsubscribe')return <Unsubscribe data={data}/>;
 if(path==='/start')return <MarkdownBody text={data.guides.start}/>;
 if(path.startsWith('/guides/')){const key=path.slice('/guides/'.length);return data.guides[key]?<MarkdownBody text={data.guides[key]}/>:<Missing/>;}
 if(path!=='/')return <Missing/>;
 return <><p className="eyebrow">ツクハコ / 学習用開発環境</p><h1>準備から、<br/>最初の変更へ。</h1><p className="lead">学習用のプロジェクトをつくり、同梱の教材で起動・変更・復元まで、一つずつ進めます。</p><a className="button" href="/start">使い始めるガイドを読む</a>
 <section><h2>何から始めるかを決める</h2><div className="cards"><article><h3>準備を確認する</h3><p>DockerやVS Codeの状態と、準備が終わったかを確認します。</p><a href="/guides/setup-check">準備の確認ガイド</a></article><article><h3>一箇所を変える</h3><p>F2を例に、変更して、確かめて、元に戻す練習をします。</p><a href="/guides/first-change">最初の変更と復元</a></article></div></section>
 <section className="note"><h2>購入前に確認したいこと</h2><p>教材の閲覧とプロジェクト生成のあと、開発にはDockerやVS Code等が必要です。初回の構築はインターネットに接続して進めます。</p><p>Linux Mint 22.3の既存開発環境でF2の一連の操作を確認しています。Windows版は未署名で、CIによる補助検証まで進んでいます。Windows 11実機・WSLでの確認は残っています。macOS・ARM向け配布は対象外です。</p><Link url={data.links.brainProduct}>Brainの商品説明</Link></section>
 <section><h2>メールで少しずつ進める</h2><p>{data.screenCopy.form.optional}</p><a href="/mail">内容と頻度を確認する</a></section></>;
}
function Subscribe({data}:{data:PublicData}){
 const c=data.screenCopy.form;
 const [email,setEmail]=useState(''),[consent,setConsent]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent){e.preventDefault();setError('');setBusy(true);try{await api('/api/subscriptions',{email,newsletterConsent:consent,consentVersion:data.consentVersion});sessionStorage.setItem('preview-email',email);location.assign('/mail/check');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <div className="narrow"><p className="eyebrow">任意のメール案内</p><h1>{c.title}</h1><p>{c.description}</p><p>{c.optional}</p><p className="muted">{c.senderLabel}：{data.senderName||'設定待ち'} ／ {c.contactLabel}：{data.senderContact||'設定待ち'}</p>
 <form onSubmit={submit}><label htmlFor="email">{c.emailLabel}</label><input id="email" name="email" type="email" autoComplete="email" placeholder="reader@example.test" required value={email} onChange={e=>setEmail(e.target.value)} maxLength={254}/><label className="check"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} required/><span>{c.consentLabel}</span></label><p><Link url={data.links.privacy}>{c.privacyLabel}</Link></p>{error&&<p role="alert" className="error">{error}</p>}<button disabled={busy}>{busy?'受付中です…':c.button}</button></form></div>;
}
function Check({data}:{data:PublicData}){
 const c=data.screenCopy.check;const [email,setEmail]=useState(sessionStorage.getItem('preview-email')||''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 async function resend(e:React.FormEvent){e.preventDefault();setBusy(true);try{await api('/api/resend-confirmation',{email});setMessage(c.resendAccepted);}catch(e){setMessage((e as Error).message);}finally{setBusy(false);}}
 return <div className="narrow"><h1>{c.title}</h1><p>{c.description}</p><p>{c.missing}</p>{__LOCAL_PREVIEW__&&<p className="note">この試作ではメールボックスへの送信はありません。<a href="/preview">ローカル受信箱</a>で確認メールを開いてください。</p>}<a href="/mail">{c.correctEmail}</a><section><h2>メールが見つからないとき</h2><form onSubmit={resend}><label htmlFor="resend-email">メールアドレス</label><input id="resend-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/><button className="secondary" disabled={busy}>{c.resend}</button><p aria-live="polite">{message}</p></form></section></div>;
}
function Confirm({data}:{data:PublicData}){
 const token=new URLSearchParams(location.search).get('token')||'';
 const [state,setState]=useState('loading'),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{void api<{state:string}>('/api/confirm/status?token='+encodeURIComponent(token)).then(r=>setState(r.state)).catch(e=>{setError(e.message);setState('network_error');});},[token]);
 async function confirm(){setBusy(true);try{const r=await api<{state:string}>('/api/confirm',{token});setState(r.state==='confirmed'?'complete':r.state);}catch(e){setError((e as Error).message);try{const r=await api<{state:string}>('/api/confirm/status?token='+encodeURIComponent(token));setState(r.state);}catch{setState('network_error');}}finally{setBusy(false);}}
 if(state==='loading')return <p role="status">確認しています。</p>;
 if(state==='network_error')return <div className="narrow"><h1>確認できませんでした</h1><p role="alert">{error}</p><button onClick={()=>location.reload()}>もう一度確認する</button><p><a href="/mail">登録画面へ戻る</a></p></div>;
 const copy=state==='valid'?data.screenCopy.confirm:state==='complete'?data.screenCopy.complete:state==='expired'?data.screenCopy.expired:state==='used'?data.screenCopy.used:state==='unsubscribed'?data.screenCopy.unsubscribed:data.screenCopy.invalid;
 return <div className="narrow"><h1>{copy.title}</h1><p>{state==='suppressed'?data.screenCopy.errors.suppressed:copy.description}</p>{error&&<p role="alert" className="error">{error}</p>}{state==='valid'?<button onClick={()=>void confirm()} disabled={busy}>{data.screenCopy.confirm.button}</button>:state==='complete'?<a className="button" href="/start">{data.screenCopy.complete.button}</a>:['expired','invalid','invalidated','unsubscribed'].includes(state)?<a className="button" href="/mail">{state==='expired'?data.screenCopy.expired.button:'登録画面へ戻る'}</a>:<a href="/start">使い始めるガイドへ</a>}{state==='complete'&&__LOCAL_PREVIEW__&&<p><a href="/preview">初回の配信予定を確認する</a></p>}</div>;
}
function Unsubscribe({data}:{data:PublicData}){
 const c=data.screenCopy.unsubscribe;const token=new URLSearchParams(location.search).get('token')||'';
 const [complete,setComplete]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function stop(){setBusy(true);try{await api('/api/unsubscribe',{token});setComplete(true);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <div className="narrow"><h1>{complete?c.completeTitle:c.title}</h1><p>{complete?c.completeDescription:c.description}</p>{error&&<p role="alert" className="error">{error}</p>}{complete?<a href="/start">ガイドへ戻る</a>:<button onClick={()=>void stop()} disabled={busy||!token}>{c.button}</button>}</div>;
}
function Missing(){return <><h1>ページが見つかりません</h1><a href="/">ガイドの入口へ</a></>;}
createRoot(document.getElementById('root')!).render(<App/>);
