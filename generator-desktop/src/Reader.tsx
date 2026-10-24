import {lazy,Suspense,useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {Curriculum,Reading,ReaderAnchor,Created} from './types';
import {resolveProjectChapter,classifyLink} from './links';
import {projectForChapter,readerContentKey} from './flow';
const Markdown=lazy(()=>import('./Markdown'));
export function Reader({index,reading,onReading,help,project,onReturn,returnLabel,anchor,onCurrentProject,onHelp}:{index:Curriculum;reading:Reading;onReading:(r:Reading)=>void;help:boolean;project?:Created;onReturn:()=>void;returnLabel?:string;anchor?:ReaderAnchor;onCurrentProject?:(heading?:string)=>void;onHelp:()=>void}){
 const activeProject=projectForChapter(project,reading),key=readerContentKey(reading,project);
 const currentKey=useRef(key);currentKey.current=key;
 const lastAnchor=useRef<number|undefined>(undefined);
 const [opening,setOpening]=useState(false),[actionNote,setActionNote]=useState(''),[actionError,setActionError]=useState('');
 const [content,setContent]=useState<{key:string;text:string;heads:{id:string;title:string}[]}>(),[error,setError]=useState(''),[heading,setHeading]=useState('');
 const [compact,setCompact]=useState(()=>matchMedia('(max-width:950px)').matches),[tocOpen,setTocOpen]=useState(false);
 const focusToc=useRef<'select'|'body'|'toggle'|null>(null),headingToc=useRef<HTMLDetailsElement>(null);
 const area=useRef<HTMLDivElement>(null),toc=useRef<HTMLElement>(null),toggle=useRef<HTMLButtonElement>(null);
 const latest=useRef(reading);latest.current=reading;const scrollRef=useRef(reading.scroll),write=useRef(onReading);write.current=onReading;
 const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),focusChapter=useRef(false);
 const lesson=index.lessons.find(l=>l.id===reading.lessonId),chapter=lesson?.chapters.find(c=>c.id===reading.chapterId),place=lesson?.chapters.findIndex(c=>c.id===reading.chapterId)??-1,isGuide=reading.lessonId==='guide';
 const body=content?.key===key?content.text:'',heads=content?.key===key?content.heads:[];
 useEffect(()=>{
  const media=matchMedia('(max-width:950px)');let focused=document.activeElement;
  const remember=(event:FocusEvent)=>{focused=event.target as Element};
  const change=()=>{if(media.matches&&toc.current?.contains(focused))focusToc.current='toggle';else if(!media.matches&&focused===toggle.current)focusToc.current='select';setCompact(media.matches);setTocOpen(false)};
  document.addEventListener('focusin',remember,true);media.addEventListener('change',change);
  return()=>{document.removeEventListener('focusin',remember,true);media.removeEventListener('change',change)}
 },[]);
 useEffect(()=>{
  let active=true;setError('');setActionError('');setActionNote('');setOpening(false);scrollRef.current=reading.scroll;focusChapter.current=true;
  if(chapter)void (async()=>{
   let text=activeProject?.guide;
   if(text===undefined){const reply=await window.tsukuhako.readChapter({lessonId:reading.lessonId,chapterId:reading.chapterId});if(!active)return;if(!reply.ok){setError([reply.error.message,reply.error.nextAction].filter(Boolean).join(' '));return}text=reply.value.text}
   const m=await import('./Markdown');if(active)setContent({key,text,heads:m.headings(text)});
  })().catch(()=>{if(active)setError('教材を読み込めませんでした。目次から章を開き直してください。')});
  return()=>{active=false;clearTimeout(timer.current)}
 },[key]);
 useEffect(()=>{if(anchor&&anchor.request!==lastAnchor.current&&anchor.lessonId===reading.lessonId&&anchor.chapterId===reading.chapterId){lastAnchor.current=anchor.request;setHeading(anchor.heading)}},[anchor,reading.lessonId,reading.chapterId]);
 function jumpToHeading(id:string){
  const target=Array.from(area.current?.querySelectorAll<HTMLElement>('[id]')||[]).find(node=>node.id===id);
  if(!target||!area.current)return false;
  area.current.scrollTop+=target.getBoundingClientRect().top-area.current.getBoundingClientRect().top;
  target.focus({preventScroll:true});focusChapter.current=false;return true;
 }
 useEffect(()=>{if(!body||!heading)return;const frame=requestAnimationFrame(()=>{if(jumpToHeading(heading))setHeading('')});return()=>cancelAnimationFrame(frame)},[body,heading]);
 useEffect(()=>()=>{clearTimeout(timer.current);write.current({...latest.current,scroll:scrollRef.current})},[]);
 function open(lessonId:string,chapterId:string,anchor=''){clearTimeout(timer.current);setHeading(anchor);scrollRef.current=0;focusChapter.current=true;setTocOpen(false);onReading({...reading,lessonId,chapterId,scroll:0});if(area.current)area.current.scrollTop=0}
 function follow(href:string){const target=resolveProjectChapter(index,reading.lessonId,reading.chapterId,href,project);if(target){if(help&&project&&target.lessonId===project.templateId&&target.chapterId==='first'&&onCurrentProject)onCurrentProject(target.heading);else open(target.lessonId,target.chapterId,target.heading);return}if(href.startsWith('https://')){void window.tsukuhako.openLessonLink({lessonId:reading.lessonId,chapterId:reading.chapterId,href}).then(r=>{if(!r.ok)setError(r.error.message)});return}setError('このリンクは実行しません。生成先の該当ファイルや対応する教材を確認してください。')}
 useLayoutEffect(()=>{if(focusChapter.current&&(!chapter||body)){const title=area.current?.querySelector<HTMLElement>('h1');if(title){title.focus({preventScroll:true});focusChapter.current=false}}if(focusToc.current==='select')document.getElementById('lesson-choice')?.focus();if(focusToc.current==='toggle')toggle.current?.focus();if(focusToc.current==='body')area.current?.focus({preventScroll:true});focusToc.current=null});
 function showToc(){if(body&&area.current){scrollRef.current=area.current.scrollTop;write.current({...latest.current,scroll:scrollRef.current})}if(compact){focusToc.current=tocOpen?'body':'select';setTocOpen(!tocOpen)}else document.getElementById('lesson-choice')?.focus()}
 function ready(){
  // A cold lazy-render may mount after the anchor effect's first animation frame.
  // Apply the requested destination here as well, before restoring chapter focus.
  if(heading){const found=jumpToHeading(heading);setHeading('');if(found)return}
  if(area.current){area.current.scrollTop=latest.current.scroll;if(focusChapter.current){area.current.querySelector<HTMLElement>('h1')?.focus({preventScroll:true});focusChapter.current=false}}
 }
 async function copyValue(text:string){
  const requestKey=key;
  try{try{await navigator.clipboard.writeText(text)}catch{const previous=document.activeElement;const field=document.createElement('textarea');field.value=text;field.className='copy-field';document.body.append(field);field.select();const copied=document.execCommand('copy');field.remove();if(previous instanceof HTMLElement&&previous.isConnected)previous.focus({preventScroll:true});if(!copied)throw new Error('copy')}if(currentKey.current===requestKey)setActionNote('コピーしました。')}
  catch{if(currentKey.current===requestKey)setActionNote('コピーできませんでした。表示された文字列を選択してコピーしてください。')}
 }
 async function openEditor(){
  if(!activeProject||opening)return;const requestKey=key;setOpening(true);setActionNote('');setActionError('');
  try{const result=await window.tsukuhako.openInVSCode();if(currentKey.current!==requestKey)return;if(!result.ok)setActionError([result.error.message,result.error.nextAction].filter(Boolean).join(' '));else setActionNote('このフォルダーをVS Codeへ渡しました。VS Codeが開いたら、下の手順で実行環境を開きます。まだサンプルの起動完了ではありません。')}
  catch{if(currentKey.current===requestKey)setActionError('VS Codeへ接続を渡せませんでした。VS Codeの「フォルダーを開く」で、下の保存先を選んでください。')}
  finally{if(currentKey.current===requestKey)setOpening(false)}
 }
 const editorHeading='vs-codeでフォルダーを開く';
 const urls=activeProject?[...new Set(activeProject.nextSteps.flatMap(step=>[...(step.url?[step.url]:[]),...(step.command?.args.filter(arg=>/^http:\/\/localhost:\d+(?:\/|$)/.test(arg))||[])]))]:[];
 const editorAction=<div className="project-editor-action"><p>今回作ったフォルダーを開きます。準備が不足している場合は、先に準備手順を確認してください。</p><p className="path">{activeProject?.destination}</p><button type="button" className="primary" disabled={opening} onClick={()=>void openEditor()}>{opening?'VS Codeを開いています…':'このフォルダーをVS Codeで開く'}</button><button type="button" className="text-button" onClick={()=>activeProject&&void copyValue(activeProject.destination)}>保存先をコピー</button><p role="status">{actionNote}</p>{actionError&&<div className="error" role="alert"><p>{actionError}</p><p>保存先：<span className="path">{activeProject?.destination}</span></p><button className="lesson-link" onClick={()=>help?open(reading.lessonId,'first','準備が足りないとき'):onHelp()}>困ったときの手順へ</button></div>}</div>;
 const tocHidden=compact&&!tocOpen,bodyHidden=compact&&tocOpen;
 return <div className={'reader-layout'+(tocOpen?' toc-open':'')}>
 <div className="reader-toolbar"><button className="secondary" onClick={onReturn}>{returnLabel||(reading.lessonId==='setup'?'準備チェックへ戻る':'作る画面へ戻る')}</button><button ref={toggle} className="secondary" aria-controls="curriculum-toc" aria-expanded={compact?tocOpen:undefined} onClick={showToc}>{compact?(tocOpen?'本文に戻る':'目次を開く'):'目次へ移動'}</button><span className="reader-current">{lesson?.title||'教材'} · {chapter?.title||'教材の目次'}</span></div>
 <aside ref={toc} id="curriculum-toc" className="curriculum-toc" aria-label="教材の目次" aria-hidden={tocHidden||undefined} inert={tocHidden} onKeyDown={e=>{if(compact&&e.key==='Escape'){setTocOpen(false);toggle.current?.focus();e.preventDefault()}}}><p className="eyebrow">{help?'困ったとき':isGuide?'ガイド':'学ぶ'}</p><label htmlFor="lesson-choice">教材・ガイドを選ぶ</label><select id="lesson-choice" value={reading.lessonId} onChange={e=>open(e.target.value,'')}>{index.lessons.map(l=><option value={l.id} key={l.id}>{l.title}</option>)}</select><button type="button" className="text-button" onClick={()=>open(reading.lessonId,'')}>{isGuide?'ガイドの目次':'この教材の目次'}</button><nav aria-label="章の一覧">{lesson?.chapters.filter(c=>!help||['trouble','recovery','troubleshooting','setup','windows','macos','linux','overview'].includes(c.id)).map(c=><button type="button" className={c.id===reading.chapterId?'current':''} key={c.id} aria-current={c.id===reading.chapterId?'page':undefined} onClick={()=>open(reading.lessonId,c.id)}>{c.title}</button>)}</nav><p className="hint">{isGuide?'ガイド '+lesson?.version:'教材 v'+lesson?.version}<br/>{isGuide?'本体の導入とサンプル画面の表示':lesson?.templateVersion?'対象テンプレート v'+lesson.templateVersion:'OS別の準備手順'}</p></aside>
 <div ref={area} className="reader-scroll" role="region" aria-label="教材本文" tabIndex={0} aria-hidden={bodyHidden||undefined} inert={bodyHidden} onScroll={()=>{if(!body)return;scrollRef.current=area.current?.scrollTop||0;clearTimeout(timer.current);timer.current=setTimeout(()=>write.current({...latest.current,scroll:scrollRef.current}),400)}}>
 {project&&!activeProject&&<div className="current-project"><strong>今回作ったプロジェクト</strong><p className="path">{project.destination}</p><button type="button" className="lesson-link" onClick={()=>onCurrentProject?onCurrentProject():open(project.templateId,'first')}>今回の起動手順へ戻る</button></div>}
 {error&&<p role="alert" className="error">{error}</p>}
 {!chapter?<section className="lesson-overview"><p className="eyebrow">目次</p><h1 tabIndex={-1}>{lesson?.title||'教材を選んでください'}</h1><p>必要な章から読めます。教材はこのアプリに同梱されています。</p><ol>{lesson?.chapters.map(c=><li key={c.id}><button type="button" className="lesson-link" onClick={()=>open(reading.lessonId,c.id)}>{c.title}</button></li>)}</ol></section>:<>
 {reading.chapterId==='first'&&<p className="notice">{activeProject?'今回作ったフォルダー・ポートに合わせた手順です。上から順番に進めます。':'標準設定の見本です。生成済みの方は「作る」にある完了画面、または保存先のSTART_HERE.mdを使ってください。'}</p>}{reading.chapterId!=='first'&&project?.templateId===reading.lessonId&&<div className="notice">この章には標準設定の例があります。今回の設定：{Object.entries(project.ports).map(([name,port])=>`${name}=${port}`).join(' / ')}。<button className="lesson-link" onClick={()=>open(reading.lessonId,'first')}>今回の起動手順に戻る</button></div>}{activeProject&&<section className="project-context" aria-label="今回のプロジェクト"><h2>今回使うフォルダーと接続先</h2><p className="path">{activeProject.destination}</p><p className="hint">ポート：{Object.entries(activeProject.ports).map(([name,port])=>`${name}=${port}`).join(' / ')}</p>{urls.map(url=><p key={url}><code>{url}</code><button type="button" className="text-button" onClick={()=>void copyValue(url)}>URLをコピー</button></p>)}<details><summary>手順を保存・コピーする</summary><p>同じ手順は保存先の START_HERE.md にあります。アプリ終了後は、このファイルをVS CodeのMarkdownプレビューで開いて続けられます。</p><button type="button" className="text-button" onClick={()=>void copyValue(activeProject.guide)}>手順全体をコピー</button><p role="status">{actionNote}</p></details></section>}<div className="chapter-meta">{lesson?.title} / {place+1} · {chapter.title}</div>
 <details key={key} ref={headingToc} className="heading-toc"><summary>この章の見出し</summary><ul>{heads.map(h=><li key={h.id}><button className="lesson-link" onClick={()=>{headingToc.current?.removeAttribute('open');setHeading(h.id)}}>{h.title}</button></li>)}</ul></details>
 <Suspense fallback={<p role="status">教材の表示を準備しています…</p>}>{body?<Markdown key={key} text={body} linkKind={href=>classifyLink(index,reading.lessonId,reading.chapterId,href)} onLink={follow} onReady={ready} afterHeading={id=>activeProject&&id===editorHeading?editorAction:null}/>:!error&&<p role="status">章を読み込んでいます…</p>}</Suspense>
 <nav className="chapter-navigation" aria-label="前後の章"><button className="secondary" disabled={place<=0} onClick={()=>open(reading.lessonId,lesson!.chapters[place-1].id)}>← 前の章</button><button className="secondary" onClick={showToc}>章の一覧へ</button><button className="secondary" disabled={!lesson||place>=lesson.chapters.length-1} onClick={()=>open(reading.lessonId,lesson!.chapters[place+1].id)}>次の章 →</button></nav></>}
 </div></div>
}
