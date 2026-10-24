import {useEffect,useRef,useState} from 'react';
import type {Preparation as Prep,Problem} from './types';
import {canCreateFiles,preparationItem,selectDistro} from './flow';
const osName=(p?:string)=>p==='win32'?'Windows / WSL 2':p==='darwin'?'macOS':'Linux';
export function Preparation({onContinue,continueLabel,continueDisabled,templateId,storageTemplateName,onResult,onGuide,disabled,distro,onDistro,result,onBusy}:{onContinue?:()=>void;continueLabel?:string;continueDisabled?:boolean;templateId:string;storageTemplateName?:string;onResult:(p:Prep)=>void;onGuide:(chapter:string,heading?:string)=>void;disabled:boolean;distro?:string;onDistro:(id:string)=>void;result?:Prep;onBusy:(busy:boolean)=>void}){
 const [platform,setPlatform]=useState<Prep>(),[busy,setBusy]=useState(false),[problem,setProblem]=useState<Problem>(),[log,setLog]=useState(''),[note,setNote]=useState('');
 const active=useRef(false),cancelled=useRef(false);
 useEffect(()=>{void check(false,true)},[]);
 useEffect(()=>{setLog(result?.checkedAt?JSON.stringify(result,null,2).replace(/(?:[A-Za-z]:\\Users\\|\/home\/|\/Users\/)[^\s/\\"<>]+/g,'<HOME>').replace(/"user":\s*"[^"]*"/g,'"user": "<USER>"'):'')},[result]);
 async function check(install=false,initial=false){
  if(active.current||disabled)return;active.current=true;cancelled.current=false;setBusy(true);onBusy(true);setProblem(undefined);setNote('');if(platform)onResult(platform);
  try{
   // Re-enumerate after installation, and never send a disappeared selection to diagnosis.
   const listed=await window.tsukuhako.getPreparation();if(cancelled.current)return;
   if(!listed.ok){setProblem(listed.error);if(platform)onResult({...platform,checks:[],dockerReady:undefined,helperReady:false,target:undefined});return}
   const fresh=listed.value;setPlatform(fresh);let selected=distro;
   if(fresh.platform==='win32'){selected=selectDistro(fresh.distros||[],distro);if(selected!==(distro||''))onDistro(selected)}
   onResult(fresh);
   if(fresh.platform==='win32'&&(initial||!selected)){
    setNote(selected?'選んだWSLで「もう一度確認」を押してください。':fresh.distros?.length?'開発するWSLを選んで、もう一度確認してください。':'WSLの候補がありません。準備手順で導入したあと、この画面で「もう一度確認」を押してください。');return;
   }
   const payload={templateId,...(selected?{distroId:selected}:{})};
   const r=await(install?window.tsukuhako.prepareWSL(payload):window.tsukuhako.checkPreparation(payload));if(cancelled.current)return;
   if(!r.ok){setProblem(r.error);return}onResult(r.value);
  }catch{setProblem({code:'PREPARATION_FAILED',message:'準備を確認できませんでした。',nextAction:'このOSの準備手順を確認し、もう一度確認してください。',details:{}})}
  finally{if(cancelled.current)setNote('診断を中断しました。必要なときにもう一度確認できます。');active.current=false;setBusy(false);onBusy(false)}
 }
 const guide=platform?.platform==='win32'?'windows':platform?.platform==='darwin'?'macos':'linux';
 return <section className="preparation" aria-labelledby="preparation-title"><div className="prep-heading"><div><p className="eyebrow">動かす前の準備</p><h2 id="preparation-title" tabIndex={-1}>準備を確認する</h2><p>{platform?`${osName(platform.platform)} / ${platform.arch}`:'OSを確認しています…'} · 教材は未準備でも読めます</p></div><button className="secondary" onClick={()=>onGuide(guide)}>このOSの準備手順</button></div>
 {platform?.platform==='win32'&&<><p className="notice">Windows / WSL 2は実機未確認です。診断で選択したLinuxが起動する場合があります。</p><label htmlFor="wsl-distro">開発するWSL</label><select id="wsl-distro" disabled={busy||disabled} value={distro||''} onChange={e=>{onDistro(e.target.value);onResult(platform);setProblem(undefined);setNote('WSLを変更しました。もう一度確認してください。')}}><option value="">選択してください</option>{platform.distros?.map(d=><option value={d.id} key={d.id}>{d.name} / WSL {d.generation} / {d.state}</option>)}</select>{!platform.distros?.length&&<p>通常のLinuxディストリビューションを確認できません。準備手順から導入してください。</p>}</>}
 {platform?.platform==='darwin'&&<p className="notice">macOSは実機未確認です。「{storageTemplateName||'メモを保存するWeb画面'}」の起動手順はLinux専用です。</p>}
 <div className="creation-readiness"><h3>① フォルダーを作る準備</h3><p>{!platform?'OSを確認しています。':canCreateFiles(platform.platform,result,distro)?platform.platform==='win32'?'選択したWSLにファイルを作る準備ができています。保存先は後で確認します。':'DockerやVS Codeの準備が終わっていなくても、ファイルを作成できます。保存先は後で確認します。':'選択したWSLの通常ユーザーと、WSL用ファイルの準備を先に確認します。'}</p></div>
 <h3>② サンプルを動かす前の準備</h3><p className="hint">Dockerはサンプルの実行環境、VS Codeは操作する場所です。以下はこのパソコンの診断結果です。</p>
 <div className="prep-actions"><button className="primary" disabled={busy||disabled} onClick={()=>void check()}>もう一度確認</button>{busy&&<button className="secondary" onClick={()=>{cancelled.current=true;void window.tsukuhako.cancelPreparation()}}>診断を中断</button>}{platform?.platform==='win32'&&distro&&<button className="secondary" disabled={busy||disabled} onClick={()=>void check(true)}>WSL用ファイルを準備</button>}</div>
 <p role="status">{busy?'確認しています。教材も引き続き読めます。':note}</p>
 {problem&&<div className="error" role="alert"><strong>{problem.message}</strong><p>{problem.nextAction}</p><button className="lesson-link" onClick={()=>onGuide(guide)}>このOSの準備手順を読む</button><small> {problem.code}</small></div>}
 {result?.checkedAt&&<><p className="hint">確認日時：{new Date(result.checkedAt).toLocaleString('ja-JP')}。この時点の結果です。再開時は再確認してください。{result.target&&` 対象：${result.target.distro} / ${result.target.user}`}</p><div className="preparation-items">{result.checks?.filter(c=>c.state!=='ready').map(c=>{const item=preparationItem(c,storageTemplateName);return <article key={c.id} className="preparation-item"><div><h4>{item.title}</h4><span className={'state '+item.state}>{item.label}</span></div><p className="hint">{item.purpose}</p><p>{item.action}</p><button className="lesson-link" onClick={()=>onGuide(item.chapter,item.heading)}>この項目の準備手順へ</button></article>})}</div>{result.checks?.length&&!result.checks.some(c=>c.state!=='ready')?<p className="checked-note">診断した道具は利用可能です。実際の起動は作成後の手順で確かめます。</p>:null}<details className="prep-details"><summary>すべての診断結果・詳しい理由</summary><ul>{result.checks?.map(c=><li key={c.id}><span className={'state '+c.state}>{c.label}</span><div><strong>{c.message}</strong><p className="hint">{c.reason}</p><p>{c.nextAction}</p><small>項目：{c.id}</small></div></li>)}</ul></details>
 <details className="log-preview"><summary>容量・診断ログの確認・書き出し</summary>{result.capacity&&<p className="hint">OSメモリ：{(result.capacity.totalMemoryBytes/1073741824).toFixed(1)} GiB / HOMEの空き：{result.capacity.availableBytes===null?'確認不可':(result.capacity.availableBytes/1073741824).toFixed(1)+' GiB'}。Docker割当・必要量は別です。</p>}<p className="hint">パス・ユーザー名を伏せ字化しています。共有前に内容を確認し、必要なら編集してください。環境変数一覧や秘密ファイルは収集しません。</p><textarea aria-label="共有する診断ログ" value={log} onChange={e=>setLog(e.target.value)} maxLength={65536}/><button className="secondary" onClick={async()=>{const r=await window.tsukuhako.exportDiagnostic({text:log});setNote(r.ok?(r.value.saved?'ログを書き出しました。':'書き出しを中止しました。'):r.error.message)}}>ログを書き出す</button></details></>}
 <div className="after-creation"><h3>③ 作成した後に起動を確認する</h3><p className="hint">フォルダーができたら、次の手順でVS Codeを開き、実行環境の準備とサンプルの動作を確かめます。この診断だけでは起動の成功は判断しません。</p></div><button className="secondary" disabled={busy||disabled||continueDisabled} onClick={()=>onContinue?onContinue():document.getElementById('generator-title')?.focus()}>{onContinue?continueLabel:'構成を選ぶ ↓'}</button></section>
}
