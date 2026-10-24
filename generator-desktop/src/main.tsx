import {version as productVersion} from '../package.json';
import {useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Generator} from './Generator';
import {Reader} from './Reader';
import {Preparation} from './Preparation';
import type {Catalog,Curriculum,Reading,ReaderAnchor,Created,Preparation as Prep} from './types';
import {canCreateFiles,creationHelp,onboardingHelp,withDistro,type CreationStage} from './flow';
import './style.css';
const initial:Reading={view:'create',lessonId:'F2',chapterId:'',scroll:0};
function App(){
 const [index,setIndex]=useState<Curriculum>(),[catalog,setCatalog]=useState<Catalog>();
 const [reading,setReading]=useState<Reading>(initial),[help,setHelp]=useState<Reading>({...initial,view:'help',lessonId:'guide',chapterId:'troubleshooting'});
 const [ready,setReady]=useState(false),[busy,setBusy]=useState(''),[prepBusy,setPrepBusy]=useState(false);
 const [project,setProject]=useState<Created>(),[returnTo,setReturnTo]=useState<'create'|'learn'>('create'),[template,setTemplate]=useState('F2');
 const [prep,setPrep]=useState<Prep>(),[problem,setProblem]=useState(''),[anchor,setAnchor]=useState<ReaderAnchor>(),[startRequest,setStartRequest]=useState(0);
 const [creationStage,setCreationStage]=useState<CreationStage>('selection');
 const [preparationOpen,setPreparationOpen]=useState(false),[recommendedPending,setRecommendedPending]=useState(false);
 const started=startRequest>0;
 const canBegin=Boolean(prep?.platform)&&canCreateFiles(prep?.platform,prep,reading.distroId);
 const helpFromPreparation=useRef(false);
 const lastSaved=useRef(''),learningPosition=useRef<Reading|undefined>(undefined);
 const selected=catalog?.templates.find(t=>t.id===template),recommended=catalog?.templates.find(t=>t.id==='F2');
 useEffect(()=>{void Promise.all([window.tsukuhako.getLearningIndex(),window.tsukuhako.readSettings()]).then(([m,s])=>{
  if(!m.ok){setProblem(m.error.message);setReady(true);return}setIndex(m.value);
  if(s.ok){const saved=s.value,l=m.value.lessons.find(l=>l.id===saved.lessonId);const restored:Reading={...initial,...saved,view:saved.view==='help'?'help':saved.view==='learn'?'learn':'create',lessonId:l?.id||'F2',chapterId:l?.chapters.some(c=>c.id===saved.chapterId)?saved.chapterId!:'',scroll:Number.isFinite(saved.scroll)&&saved.scroll!>=0&&saved.scroll!<10000000?saved.scroll!:0};setReading(restored);if(restored.view==='help')setHelp(restored)}setReady(true)
 }).catch(()=>{setProblem('教材一覧を読み込めませんでした。');setReady(true)})},[]);
 useEffect(()=>{
  if(!ready)return;const record=reading.view==='help'?{...help,distroId:reading.distroId}:reading;const value=JSON.stringify(record);
  if(value===lastSaved.current)return;lastSaved.current=value;void window.tsukuhako.saveSettings(record).then(r=>{if(!r.ok)setProblem('読書位置を保存できませんでした。')})
 },[reading,help,ready]);
 function beginRecommended(){setRecommendedPending(!canBegin);setPreparationOpen(!canBegin);setStartRequest(v=>v+1);window.scrollTo(0,0)}
 function showPreparation(){setPreparationOpen(true);requestAnimationFrame(()=>{window.scrollTo(0,0);document.getElementById('preparation-title')?.focus()})}
 function continueCreation(){if(recommendedPending){beginRecommended();return}setPreparationOpen(false);requestAnimationFrame(()=>{window.scrollTo(0,0);document.getElementById('generator-title')?.focus()})}
 function returnCreate(){const lessonId=reading.view==='help'?help.lessonId:reading.lessonId;const toPreparation=lessonId==='setup'||(reading.view==='help'&&helpFromPreparation.current);setAnchor(undefined);if(started)setPreparationOpen(toPreparation);setReading(p=>({...p,view:'create'}));requestAnimationFrame(()=>{window.scrollTo(0,0);document.getElementById(toPreparation?'preparation-title':'generator-title')?.focus()})}
 function showHelp(){
  if(!index||reading.view==='help')return;
  const from=reading.view==='learn'?'learn':'create';setReturnTo(from);helpFromPreparation.current=from==='create'&&started&&preparationOpen;
  const {heading,...destination}=from==='create'&&!project?creationHelp(template,helpFromPreparation.current?'selection':creationStage):onboardingHelp(index,from==='learn'?reading:{lessonId:project!.templateId,chapterId:'first'},project,prep?.platform);
  setAnchor(heading?{...destination,heading,request:Date.now()}:undefined);
  setHelp({...initial,view:'help',...destination});
  setReading(p=>({...p,view:'help'}));
 }
 function learn(id:string,chapter='first',heading=''){
  if(reading.view==='learn'&&reading.lessonId!=='guide')learningPosition.current=reading;
  setAnchor(heading?{lessonId:id,chapterId:chapter,heading,request:Date.now()}:undefined);
  setReading(p=>({...p,view:'learn',lessonId:id,chapterId:chapter,scroll:0}));
 }
 function showLearning(){setAnchor(undefined);if(project&&reading.view==='create'){learn(project.templateId);return}setReading(p=>p.lessonId==='guide'?{...(learningPosition.current||{...initial,lessonId:project?.templateId||initial.lessonId,chapterId:'first'}),view:'learn',distroId:p.distroId}:{...p,view:'learn'})}
 const updateReading=(r:Reading)=>setReading(p=>({...r,view:p.view,distroId:p.distroId}));
 return <div className={'app-shell'+(reading.view!=='create'?' app-shell-reading':'')}>
  <header className="top"><div className="brand"><img className="mark" src="./brand-mark.svg" alt=""/><div><strong>ツクハコ</strong><span>開発環境と学びの道具箱</span></div></div><span className="version">LOCAL EDITION <b>{productVersion}</b></span></header>
  <nav className="app-nav" aria-label="ツクハコの画面">
   <button type="button" aria-current={reading.view==='create'?'page':undefined} onClick={returnCreate}>作る</button>
   <button type="button" aria-current={reading.view==='learn'&&reading.lessonId!=='guide'?'page':undefined} onClick={showLearning}>学ぶ</button>
   <button type="button" aria-current={reading.view==='learn'&&reading.lessonId==='guide'?'page':undefined} disabled={!index} onClick={()=>learn('guide','start')}>ガイド</button>
   <button type="button" aria-current={reading.view==='help'?'page':undefined} disabled={!index} onClick={showHelp}>困ったとき</button><span>教材 v{index?.version||'…'} · ローカルで読む</span>
  </nav>
  <div className="global-status" role="status" hidden={reading.view!=='create'&&!busy&&!prepBusy}>{busy||(prepBusy?'開発準備を確認しています。「作る」に戻ると結果を確認できます。':`準備を確認 → フォルダーを作る → ${selected?.firstGoal||'サンプルを表示する'}`)}</div>
  {problem&&<p role="alert" className="error">{problem}</p>}
  {ready&&<><div hidden={reading.view!=='create'}>
   {!project&&!started&&<section className="first-use" aria-labelledby="first-use-title"><div><p className="eyebrow">はじめての方におすすめ</p><h2 id="first-use-title">{recommended?.name||'はじめてのWeb画面'}</h2><p>最初のゴールはサンプル画面を表示することです。準備を確認し、フォルダーを作ったら、起動の手順へ進みます。内容の変更は、その後に試せます。</p><button type="button" className="lesson-link" disabled={!index} onClick={()=>learn('guide','start')}>全体の流れを読む</button></div><button type="button" className="primary" disabled={!catalog||!!busy||prepBusy} onClick={beginRecommended}>{recommended?.name||'はじめてのWeb画面'}で始める</button></section>}
   <div hidden={started&&!preparationOpen}>
   {started&&<div className="creation-return"><p>{recommendedPending?'保存先へ進む前に、使うWSLとファイル作成の準備を確認してください。':'入力した内容は保持しています。準備を確認したら作成へ戻れます。'}</p><button type="button" className="primary" disabled={prepBusy||!!busy||(recommendedPending&&!canBegin)} onClick={continueCreation}>{recommendedPending?'保存先へ進む':'作成に戻る'}</button></div>}
   <Preparation onContinue={started?continueCreation:undefined} continueLabel={recommendedPending?'保存先へ進む':'作成に戻る'} continueDisabled={recommendedPending&&!canBegin} result={prep} onBusy={setPrepBusy} templateId={template} storageTemplateName={catalog?.templates.find(t=>t.id==='S2')?.name} onResult={setPrep} onGuide={(chapter,heading)=>learn('setup',chapter,heading)} disabled={!!busy} distro={reading.distroId} onDistro={id=>setReading(p=>withDistro(p,id))}/>
   </div>
   <div hidden={started&&preparationOpen}>
   <Generator onShowPreparation={started?showPreparation:undefined} startRequest={startRequest} onCatalog={setCatalog} externalBusy={prepBusy} onCreated={setProject} onHelp={showHelp} onBusy={setBusy} onTemplate={setTemplate} onCreationStage={setCreationStage} onLearn={id=>learn(id)} parentOverride={prep?.target?.home} platform={prep?.platform} preparation={prep} onPreparation={setPrep} distroId={reading.distroId}/>
   </div>
  </div>
  {reading.view!=='create'&&index&&<Reader key={reading.view} platform={prep?.platform} index={index} reading={reading.view==='help'?help:reading} onReading={reading.view==='help'?setHelp:updateReading} help={reading.view==='help'} project={project} anchor={anchor} onHelp={showHelp} onCurrentProject={project?heading=>learn(project.templateId,'first',heading):undefined} returnLabel={reading.view==='help'&&returnTo==='learn'?'読んでいた手順へ戻る':undefined} onReturn={reading.view==='help'&&returnTo==='learn'?()=>{setAnchor(undefined);setReading(p=>({...p,view:'learn'}))}:returnCreate}/>}</>}
 </div>
}
createRoot(document.getElementById('root')!).render(<App/>);
