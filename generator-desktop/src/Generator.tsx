import { useEffect, useRef, useState } from 'react';

import type { Catalog, Created, Plan, Problem, Report, Reply, Request } from './types';
import './style.css';
import {canCreateFiles} from './flow';
const stages = ['何を作るか', 'どこへ作るか', '内容の確認', '作成完了'];
function value<T>(reply:Reply<T>):T { if (!reply.ok) throw reply.error; return reply.value; }
const unknownProblem:Problem = {code:'CONNECTION_FAILED',message:'処理との接続を確認できませんでした。',nextAction:'入力へ戻り、内容を確認し直してください。',details:{}};
export function Generator({onBusy,onLearn,onTemplate,parentOverride,platform,preparation,distroId,onPreparation,onCreated,onHelp,externalBusy,onCatalog,startRequest}:{onBusy:(v:string)=>void;onCatalog:(c:Catalog)=>void;startRequest:number;onCreated:(p:Created|undefined)=>void;onHelp:()=>void;externalBusy:boolean;onLearn:(id:string)=>void;onTemplate:(id:string)=>void;parentOverride?:string;platform?:string;onPreparation:(p:import('./types').Preparation)=>void;distroId?:string;preparation?:import('./types').Preparation}) {
  const [catalog,setCatalog] = useState<Catalog>();
  const [goal,setGoal] = useState('screen'), [id,setId] = useState('F2');
  const [parent,setParent] = useState(''), [folder,setFolder] = useState('my-app');
  const [name,setName] = useState(''), [port,setPort] = useState(''), [dbBase,setDbBase] = useState('');
  const [advancedOpen,setAdvancedOpen]=useState(false);
  const [step,setStep] = useState(1), [busy,setBusy] = useState('');
  const busyRef = useRef(false);
  const [plan,setPlan] = useState<Plan>(), [report,setReport] = useState<Report>(), [created,setCreated] = useState<Created>();
  const [problem,setProblem] = useState<Problem>(), [note,setNote] = useState(''), [document,setDocument] = useState('');
  const heading = useRef<HTMLHeadingElement>(null), alert = useRef<HTMLDivElement>(null);
  const parentField = useRef<HTMLInputElement>(null), folderField = useRef<HTMLInputElement>(null);
  const template = catalog?.templates.find(t=>t.id===id);
  useEffect(()=>{ window.tsukuhako.getTemplates().then(value).then(c=>{setCatalog(c);onCatalog(c);setParent(parentOverride||c.defaultParent)}).catch(fail); },[]);
  useEffect(()=>{onBusy(busy)},[busy]);
  useEffect(()=>{onTemplate(id)},[id]);
  useEffect(()=>{if(platform==='win32'){invalidate();updateCreated(undefined);setParent('');setStep(1)}},[distroId]);
  useEffect(()=>{if(startRequest){invalidate();setGoal('screen');setId('F2');setPort('');setDbBase('');setStep(1);requestAnimationFrame(()=>window.document.getElementById('preparation-title')?.focus())}},[startRequest]);
  useEffect(()=>{if(parentOverride){setParent(p=>!p||p===catalog?.defaultParent?parentOverride:p)}},[parentOverride]);
  useEffect(()=>{ heading.current?.focus(); },[step]);
  useEffect(()=>{ if(problem) alert.current?.focus(); },[problem]);
  function updateCreated(next:Created|undefined){setCreated(next);onCreated(next)}
  function fail(error:unknown) { setProblem(error && typeof error==='object' && 'code' in error ? error as Problem : unknownProblem); }
  async function action(label:string, fn:()=>Promise<void>) {
    if(busyRef.current||externalBusy)return; busyRef.current=true;setBusy(label);setProblem(undefined);setNote('');
    try {await fn();} catch(error){fail(error)} finally{busyRef.current=false;setBusy('');}
  }
  function invalidate() {if(plan)void window.tsukuhako.plan(null).catch(fail);setPlan(undefined);setReport(undefined);setProblem(undefined);}
  function chooseGoal(next:string, templateId:string){if(next===goal||busyRef.current||externalBusy)return;invalidate();setGoal(next);setId(templateId);setPort('');setDbBase('');}
  async function back(){await action('入力へ戻っています',async()=>{value(await window.tsukuhako.plan(null));invalidate();setStep(step-1)});}
  async function preview(){
    if(!parent.trim()){parentField.current?.focus();return}
    if(!folder.trim()){folderField.current?.focus();return}
    await action('内容と準備を確認しています',async()=>{
      const ready=value(await window.tsukuhako.checkPreparation({templateId:id,...(distroId?{distroId}:{})}));onPreparation(ready);
      const request:Request={templateId:id,parent,folder,...(name?{name}:{}),...(port?{port:Number(port)}:{}),...(id==='S2'&&dbBase?{dbBase:Number(dbBase)}:{})};
      const next=value(await window.tsukuhako.plan(request));if(!next)throw unknownProblem;
      setPlan(next);const diagnosis=value(await window.tsukuhako.diagnose({planId:next.planId}));setReport(diagnosis);setStep(3);
    });
  }
  async function generate(){if(!plan)return;await action('ファイルを作成しています',async()=>{const result=value(await window.tsukuhako.apply({planId:plan.planId}));updateCreated(result);setStep(4);setDocument('')});}
  async function copy(text:string){
    try{await navigator.clipboard.writeText(text)}catch{
      const previous=window.document.activeElement;const field=window.document.createElement('textarea');field.value=text;field.className='copy-field';window.document.body.append(field);field.select();const copied=window.document.execCommand('copy');field.remove();if(previous instanceof HTMLElement&&previous.isConnected)previous.focus({preventScroll:true});if(!copied){setNote('コピーできませんでした。表示された文字列を選択してコピーしてください。');return}
    }setNote('コピーしました。');
  }
  return <div className="shell" inert={externalBusy}>
    <div className="layout"><aside><p className="eyebrow">フォルダーを作る · 4段階</p><h2>まずは、<br/>動くところまで。</h2><ol className="steps">{stages.map((s,i)=><li key={s} aria-current={step===i+1?'step':undefined} className={step===i+1?'active':step>i+1?'done':''}><span>{step>i+1?'✓':String(i+1).padStart(2,'0')}</span>{s}</li>)}</ol><div className="aside-note">生成するのは、新しいプロジェクトのファイルです。<br/>起動の手順は、作成後にご案内します。</div><small>{platform==='win32'?'Windows → 選択したWSL':platform==='darwin'?'macOS · ローカルで作成':'Linux · ローカルで作成'}</small></aside>
    <main aria-busy={!!busy}>
      <p className="eyebrow">STEP {String(step).padStart(2,'0')} / 04</p>
      <h1 id="generator-title" tabIndex={-1} ref={heading}>{step===1?'何から作り始めますか？':step===2?'プロジェクトの置き場所を決めます。':step===3?'この内容でプロジェクトを作成します。':'プロジェクトのファイルができました。'}</h1>
      <p className="intro">{step===1?'作りたいものに近い構成を選んでください。あとから自分で変更するための教材も入っています。':step===2?'親フォルダを選び、新しく作るフォルダの名前を入力してください。':step===3?'構成と保存先を確認してください。作成後に、環境の起動へ進みます。':`次は「${template?.firstGoal||'サンプルを動かす'}」へ進みます。`}</p>
      {problem&&<div className="error" role="alert" tabIndex={-1} ref={alert}><strong><span aria-hidden="true">! </span>{problem.code==='PARTIAL_PRESERVED'?'作成途中のファイルが残っています。':problem.message}</strong><p>{problem.nextAction}</p><button className="lesson-link" onClick={onHelp}>困ったときの手順を読む</button><details><summary>詳細ログを確認</summary><pre>{JSON.stringify(problem,null,2)}</pre></details>{step===2&&<button type="button" className="text-button" onClick={()=>problem.code==='UNSAFE_DESTINATION'?parentField.current?.focus():folderField.current?.focus()}>入力欄へ移動</button>}</div>}
      {!catalog&&!problem&&<p role="status">構成を読み込んでいます…</p>}
      {step===1&&catalog&&<>
        <p className="concept">作りたい気持ちを、環境構築で止めない。</p>
        <p className="choice-hint">迷ったら「{catalog.templates.find(t=>t.id==='F2')?.name||'はじめてのWeb画面'}」がおすすめです。最初のゴールはサンプルを表示することです。</p>
        <div className="goals" role="group" aria-label="作りたいもの">{catalog.goals.map((g,i)=><button type="button" className={`goal ${goal===g.id?'selected':''}`} aria-pressed={goal===g.id} key={g.id} onClick={()=>chooseGoal(g.id,g.templates[0])}><span className="goal-number">0{i+1}</span><span><strong>{g.title}</strong><small>{g.summary}</small></span><span className="radio" aria-hidden="true">{goal===g.id?'●':'○'}</span></button>)}</div>
        {goal==='screen'&&<fieldset className="framework"><legend>画面づくりの構成</legend>{['F2','F1'].map(t=><label key={t}><input type="radio" name="framework" checked={id===t} onChange={()=>{setId(t);setPort('');invalidate()}}/>{catalog.templates.find(item=>item.id===t)?.name}{t==='F2'?'（おすすめ）':''}</label>)}</fieldset>}
        <div className="reference"><span>参考資料</span> クラウドSupabaseの資料は新規作成の対象外です。</div>
      </>}
      {step===2&&<form id="destination" onSubmit={e=>{e.preventDefault();void preview()}}><fieldset disabled={!!busy} className="inputs">
        <label htmlFor="parent">親フォルダ</label><div className="folder-row"><input id="parent" ref={parentField} value={parent} onChange={e=>{setParent(e.target.value);invalidate()}} required autoComplete="off"/><button type="button" className="secondary" disabled={platform==='win32'} onClick={()=>void action('親フォルダを選んでいます',async()=>{const selected=value(await window.tsukuhako.chooseParentDirectory());if(selected){setParent(selected);invalidate()}})}>親フォルダを選ぶ</button></div><p className="hint">{platform==='win32'?'選択したWSL内の /home/… または ~/ を入力します。WindowsのCドライブは使いません。':'手入力では ~/ を使えます。'}実在する親フォルダを指定してください。</p>
        <label htmlFor="folder">新しいフォルダ名</label><input id="folder" ref={folderField} value={folder} onChange={e=>{setFolder(e.target.value);invalidate()}} required autoComplete="off"/><p className="hint">日本語・空白を使えます。既にあるフォルダは選べません。</p>
        <details className="advanced" open={advancedOpen} onToggle={e=>setAdvancedOpen(e.currentTarget.open)}><summary>詳細設定 <span>通常はそのままで使えます</span></summary><label htmlFor="name">識別ラベル（任意）</label><input id="name" value={name} placeholder="study" onChange={e=>{setName(e.target.value);invalidate()}} pattern="[a-z][a-z0-9-]{0,24}"/><p className="hint">フォルダ名とは別の、英小文字・数字・ハイフンの短いラベル。</p><label htmlFor="port">ホストポート</label><input id="port" type="number" min="1024" max="65535" placeholder={String(template?.defaultPort)} value={port} onChange={e=>{setPort(e.target.value);invalidate()}}/>{id==='S2'&&<><label htmlFor="dbBase">DB開始ポート</label><input id="dbBase" type="number" min="1024" max="65532" placeholder={String(template?.dbBase)} value={dbBase} onChange={e=>{setDbBase(e.target.value);invalidate()}}/><p className="hint">shadow・API・DB・Studioに連続4ポートを使います。</p></>}</details>
      </fieldset></form>}
      {template&&step<3&&<section className="selection"><div><strong>{template.name}</strong><span className="muted">v{template.version}</span></div><p>{template.summary}</p><p><strong>最初のゴール：</strong>{template.firstGoal}</p><p className="hint">使用する技術：{template.technology}</p><p className="hint">同梱：{template.includedFeatures.join(' / ')}</p><p className="hint">含まないもの：{template.notIncluded.join(' / ')}</p><details><summary>技術情報・確認済みの範囲</summary><p>管理ID：{template.id}</p><ul>{template.prerequisites.map(x=><li key={x}>{x}</li>)}</ul><p>検証：{template.validationScope}</p><p>未実施：{template.notRun.join(' / ')}</p></details></section>}
      {step===3&&plan&&<>
        <dl className="preview"><div><dt>構成</dt><dd>{template?.name}<small>テンプレート v{plan.templateVersion}</small></dd></div><div><dt>保存先</dt><dd className="path">{plan.destination}</dd></div><div><dt>ポート</dt><dd>{Object.entries(plan.ports).map(([k,v])=><span className="port" key={k}>{k} <b>{v}</b></span>)}</dd></div><div><dt>作成内容</dt><dd>{plan.files.length}ファイル <small>サンプル・教材・テスト・CI設定・この構成の案内</small></dd></div></dl>
        <div className="diagnosis"><Diagnostic label="ファイルを作る準備" ready={report?.generationReady??null}/></div>
        <p className="hint">Docker・VS Codeの準備は上のチェックで確認できます。ファイルを作成した後、ガイドに沿って環境を開き、{template?.firstGoal||'起動の確認'}まで進めます。</p>
        {report?.checks.some(c=>c.scope==='runtime'&&c.status==='FAIL')&&<div className="notice"><strong>起動前に確認する項目があります。</strong><ul>{report.checks.filter(c=>c.scope==='runtime'&&c.status==='FAIL').map(c=><li key={c.id}>{c.message} {c.nextAction}</li>)}</ul><button className="secondary" onClick={async()=>{await back();setAdvancedOpen(true);requestAnimationFrame(()=>window.document.getElementById('port')?.focus())}}>保存先・ポートを見直す</button></div>}<details className="checks"><summary>診断の詳細を見る</summary><ul>{report?.checks.map(c=><li key={c.id}><b>{c.status}</b><span>{c.message}{c.nextAction&&<small>{c.nextAction}</small>}</span></li>)}</ul></details><p className="hint">診断は現在の状態です。ポートの予約や実起動の保証ではありません。</p>
      </>}
      {step===4&&created&&<>
        <div className="success"><span aria-hidden="true">✓</span><div><strong>{template?.name}</strong><p className="path">{created.destination}</p><small>このフォルダに START_HERE.md と README.md があります。</small></div></div>
        <div className="created-actions"><button type="button" className="primary" onClick={()=>onLearn(created.templateId)}>{template?.guideAction||'このプロジェクトを動かす手順へ'}</button></div>
        <p className="hint">完了したのはファイルの作成です。次の手順でVS Codeを開き、動作を確かめます。サンプルの表示や応答はまだ確認していません。</p>
        <p>確認する結果：{template?.success}</p>
        <details className="supplementary"><summary>保存した案内・技術情報</summary><p>同じ手順を保存先の START_HERE.md に保存しました。アプリを閉じた後も、VS Codeでこのファイルを開けば続けられます。</p><button type="button" className="text-button" onClick={()=>void copy(created.guide)}>手順全体をコピー</button><button type="button" className="text-button" onClick={()=>setDocument(d=>d?'':'readme')}>READMEを確認</button><p className="hint">管理ID：{created.templateId} / テンプレート v{created.templateVersion}</p></details>
        <button type="button" className="secondary" disabled={!!busy} onClick={()=>void action('次の作成を準備しています',async()=>{value(await window.tsukuhako.plan(null));setPlan(undefined);setReport(undefined);updateCreated(undefined);setDocument('');setFolder('my-app');setStep(1)})}>別のプロジェクトを作る</button><p className="hint">作成済みのフォルダは残ります。アプリを再起動した後は、保存先の START_HERE.md から再開できます。</p>{document&&<section className="document" aria-label="README"><h2>README.md</h2><p className="hint">ファイル内の教材リンクはVS CodeのMarkdownプレビューで開けます。ここでは相対パスと案内を表示します。</p><pre>{created.readmeText}</pre></section>}
      </>}
      <div role="status" className="status">{busy||note}</div>
      {step<4&&<footer className="actions"><span>{step>1&&<button type="button" className="secondary" disabled={!!busy} onClick={()=>void back()}>← 戻る</button>}</span>{step===1?<button type="button" key="purpose" className="primary" disabled={!catalog||!!busy||!canCreateFiles(platform,preparation,distroId)} onClick={()=>{invalidate();setStep(2)}}>保存先を決める</button>:step===2?<button type="submit" key="confirm" form="destination" className="primary" disabled={!!busy}>作成内容を確認</button>:<button type="button" key="apply" className="primary" disabled={!!busy||report?.generationReady!==true||!!problem} onClick={()=>void generate()}>プロジェクトを作成</button>}</footer>}
    </main></div><footer className="bottom">ツクハコ · 提供：おとか<span>生成時のネット接続は不要です。</span></footer>
  </div>;
}
function Diagnostic({label,ready}:{label:string;ready:boolean|null}){return <div className={`diagnostic ${ready===true?'pass':'pending'}`}><span>{ready===true?'✓':ready===false?'!':'—'}</span><div><strong>{label}</strong><small>{ready===true?'確認済み':ready===false?'準備が必要':'未確認'}</small></div></div>}

