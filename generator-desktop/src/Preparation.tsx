import {useEffect,useRef,useState} from 'react';
import type {Preparation as Prep,Problem} from './types';
import {selectDistro} from './flow';
const osName=(p?:string)=>p==='win32'?'Windows / WSL 2':p==='darwin'?'macOS':'Linux';
export function Preparation({templateId,onResult,onGuide,disabled,distro,onDistro,result,onBusy}:{templateId:string;onResult:(p:Prep)=>void;onGuide:(chapter:string)=>void;disabled:boolean;distro?:string;onDistro:(id:string)=>void;result?:Prep;onBusy:(busy:boolean)=>void}){
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
 return <section className="preparation" aria-labelledby="preparation-title"><div className="prep-heading"><div><p className="eyebrow">1 · 準備する</p><h2 id="preparation-title" tabIndex={-1}>開発準備チェック</h2><p>{platform?`${osName(platform.platform)} / ${platform.arch}`:'OSを確認しています…'} · 教材は未準備でも読めます</p></div><button className="secondary" onClick={()=>onGuide(guide)}>このOSの準備手順</button></div>
 {platform?.platform==='win32'&&<><p className="notice">Windows / WSL 2は実機未確認です。診断で選択したLinuxが起動する場合があります。</p><label htmlFor="wsl-distro">開発するWSL</label><select id="wsl-distro" disabled={busy||disabled} value={distro||''} onChange={e=>{onDistro(e.target.value);onResult(platform);setProblem(undefined);setNote('WSLを変更しました。もう一度確認してください。')}}><option value="">選択してください</option>{platform.distros?.map(d=><option value={d.id} key={d.id}>{d.name} / WSL {d.generation} / {d.state}</option>)}</select>{!platform.distros?.length&&<p>通常のLinuxディストリビューションを確認できません。準備手順から導入してください。</p>}</>}
 {platform?.platform==='darwin'&&<p className="notice">macOSは実機未確認です。S2の起動手順はLinux専用です。</p>}
 <div className="prep-actions"><button className="primary" disabled={busy||disabled} onClick={()=>void check()}>もう一度確認</button>{busy&&<button className="secondary" onClick={()=>{cancelled.current=true;void window.tsukuhako.cancelPreparation()}}>診断を中断</button>}{platform?.platform==='win32'&&distro&&<button className="secondary" disabled={busy||disabled} onClick={()=>void check(true)}>WSL用ファイルを準備</button>}</div>
 <p role="status">{busy?'確認しています。教材も引き続き読めます。':note}</p>
 {problem&&<div className="error" role="alert"><strong>{problem.message}</strong><p>{problem.nextAction}</p><button className="lesson-link" onClick={()=>onGuide(guide)}>このOSの準備手順を読む</button><small> {problem.code}</small></div>}
 {result?.checkedAt&&<><p className="hint">確認日時：{new Date(result.checkedAt).toLocaleString('ja-JP')}。この時点の結果です。再開時は再確認してください。{result.target&&` 対象：${result.target.distro} / ${result.target.user}`}</p><div className="prep-summary"><span>Docker：{result.dockerReady?'利用可能':'準備・確認が必要'}</span><span>Dev Container起動：未確認</span></div><details className="prep-details" open={result.checks?.some(c=>c.state!=='ready')}><summary>項目別の結果と次の操作</summary><ul>{result.checks?.map(c=><li key={c.id}><span className={'state '+c.state}>{c.label}</span><div><strong>{c.message}</strong><p className="hint">{c.reason}</p>{c.state!=='ready'&&<><p>{c.nextAction}</p><button className="lesson-link" onClick={()=>onGuide(c.guide)}>公式導入先・手順を読む</button><button className="text-button" disabled={busy||disabled} onClick={()=>void check()}>もう一度確認</button></>}</div></li>)}</ul></details>
 <details className="log-preview"><summary>容量・診断ログの確認・書き出し</summary>{result.capacity&&<p className="hint">OSメモリ：{(result.capacity.totalMemoryBytes/1073741824).toFixed(1)} GiB / HOMEの空き：{result.capacity.availableBytes===null?'確認不可':(result.capacity.availableBytes/1073741824).toFixed(1)+' GiB'}。Docker割当・必要量は別です。</p>}<p className="hint">パス・ユーザー名を伏せ字化しています。共有前に内容を確認し、必要なら編集してください。環境変数一覧や秘密ファイルは収集しません。</p><textarea aria-label="共有する診断ログ" value={log} onChange={e=>setLog(e.target.value)} maxLength={65536}/><button className="secondary" onClick={async()=>{const r=await window.tsukuhako.exportDiagnostic({text:log});setNote(r.ok?(r.value.saved?'ログを書き出しました。':'書き出しを中止しました。'):r.error.message)}}>ログを書き出す</button></details></>}
 <p className="hint">次は下の「何から作り始めますか？」で構成を選びます。Docker待ちでもファイルは生成できます。WindowsはWSLの通常ユーザーと同梱ファイルの準備が先です。</p><button className="secondary" disabled={busy||disabled} onClick={()=>document.getElementById('generator-title')?.focus()}>構成を選ぶ ↓</button></section>
}
