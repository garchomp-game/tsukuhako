// Render reviewed evidence. Read-only with respect to product projects and raw media.
import {fs,path,out,runtime,json,sha,command} from './onboarding-evidence.mjs';
const read=n=>JSON.parse(fs.readFileSync(out+'/'+n));
const review=read('review.json'),artifact=read('artifact.json'),provenance=read('capture-provenance.json');
const raw=fs.readFileSync(out+'/steps.ndjson','utf8').trim().split('\n').map(JSON.parse);
const escape=s=>String(s??'').replace(/\u001b\[[0-9;]*m/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\|/g,'&#124;').replace(/\r?\n/g,'<br>');
const link=(name,target)=>`[${name}](<${target}>)`;
const mm=s=>`${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toFixed(2).padStart(5,'0')}`;
const steps=raw.map((r,i)=>{
 const s={...r,record:i+1,rawStatus:r.status,classification:review.failureKinds[r.id]||'OBSERVATION',...review.overrides[r.id]};
 if(s.log==='runs/code-invocations.log')s.log='logs/code-invocations.log';
 if(!s.log&&s.attempt&&fs.existsSync(out+'/attempts/'+s.attempt+'/result.json'))s.log='attempts/'+s.attempt+'/result.json';
 if(!s.log)s.log=review.coverage.find(c=>c.sceneIds.includes(s.id))?.log||'steps.json';
 if(s.privateRawScreenshot)s.privateRawScreenshot=out+'/'+s.privateRawScreenshot;
 if(s.status==='FAIL')s.expected='この場面の対象画面・操作結果を確認できること';
 if(s.screenshot&&!fs.existsSync(out+'/'+s.screenshot))throw Error('Missing screenshot '+s.screenshot);
 if(s.log&&!fs.existsSync(out+'/'+s.log)&&s.log!=='steps.json')throw Error('Missing log '+s.log);
 if(s.video){if(!fs.existsSync(s.video.path))throw Error('Missing video '+s.video.path);s.video.approximate=true;}
 return s;
});
json(out+'/steps.json',{note:'Reviewed view. steps.ndjson preserves provisional results verbatim. See review.json for corrections. Offsets are approximate action times; still images follow by about 0.7 seconds.',steps});
const counts=Object.fromEntries(['PASS','FAIL','BLOCKED','NOT_RUN'].map(k=>[k,review.coverage.filter(c=>c.status===k).length]));
const failures=steps.filter(s=>s.status==='FAIL');
json(out+'/coverage.json',{counting:'49 requested acceptance rows: M01–M23, six template rows, E01–E09, C01–C07 and four explicitly excluded contexts. Capture attempts and supplemental endpoint case are counted separately.',counts,executed:{REAL_HOST:37,REAL_VM:0,FIXTURE:0},supplemental:review.supplemental,attemptFailures:{count:failures.length,operationTiming:failures.filter(s=>s.classification==='OPERATION_TIMING').length,capture:failures.filter(s=>s.classification!=='OPERATION_TIMING').length},rows:review.coverage});
const selected=id=>steps.filter(s=>s.id===id);
for(const c of review.coverage)for(const id of c.sceneIds)if(!selected(id).length)throw Error('Missing scene '+id);
function evidence(c){return c.sceneIds.flatMap(id=>selected(id).map(s=>link(s.id,'steps.md#record-'+s.record))).join(' / ')||'未実施';}
function table(rows){return '| ID | 結果・場所 | 期待結果 | 実結果・限界 | 場面（画像・動画位置） | ログ |\n|---|---|---|---|---|---|\n'+rows.map(c=>`| ${c.id} | ${c.status}<br>${c.executionType}${c.interaction==='AUTOMATED'?'<br>自動操作':''} | ${escape(c.expected)} | ${escape(c.actual)} | ${evidence(c)} | ${c.log?link('記録',c.log):'—'} |`).join('\n')+'\n';}
const summary=`依頼の49項目は **PASS ${counts.PASS} / FAIL ${counts.FAIL} / BLOCKED ${counts.BLOCKED} / NOT_RUN ${counts.NOT_RUN}**。PASSはLinux実ホストの自動操作。VM実行0・fixture実行0。E05の代替「実CLIの接続先不通→復旧」1件は補足PASSとして別集計。途中の失敗は消しておらず、最終未解決FAIL 0と失敗試行${failures.length}件は別の数字です。`;
const intro=`# ツクハコ 0.4.2 — Linux初回操作の記録\n\n最初に ${link('短いレポート','REPORT.md')}、詳細は ${link('網羅表','coverage.md')} を参照してください。\n\n${summary}\n\n製品ソース: ${link(artifact.productCommit,'https://github.com/garchomp-game/tsukuhako/commit/'+artifact.productCommit)}。撮影スクリプト初期: ${provenance.captureBaseCommit}、最終: ${provenance.finalCaptureCommit}。証拠コミットを製品ビルド元とは扱いません。\n\n取得: 2026-10-21 JST。実ホストの専用Xephyr画面（1600×900 / 12fps / 無音）。Docker等の既存導入・キャッシュを保持したA/B条件です。全操作はエージェントのUI操作／スクリプトであり、初心者本人の試験ではありません。\n\n${link('配布物・SHA','artifact.json')} / ${link('実行環境','environment.json')} / ${link('来歴','capture-provenance.json')} / ${link('再取得手順・道具','tooling.md')} / ${link('停止とデータ保全','cleanup.json')}\n\n## 動画を見る\n\nF2-main.mp4は **18分24.5秒の連続原本**。失敗・待ち時間を含みます。${link('media-index.md','media-index.md')} に原本と4分割の絶対パス、時刻、サイズ、SHAを掲載しています。動画・traceはローカル保存で、GitHubにはありません。各場面の時刻は概算で、静止画はその約0.7秒後です。\n\n短く見る場合は F2-main の 01:33（通常起動）、09:19（起動を急いだ失敗）、12:56（Ready）、13:14〜13:19（変更・復元）、18:06以降（再接続・Rebuild）から。${link('全試行の時系列','steps.md')} には失敗も含めて画像とログを対応付けています。\n\n信頼画面M14cに既存の別フォルダのパスが現れたため、その画像はローカル原本のみです。F2原本動画と信頼操作traceにも同じ画面が短く含まれます。共有する際はこの範囲を確認してください。\n\n`;
let index=intro;
for(const [name,filter] of [['F2主経路',r=>r.id.startsWith('M')],['全6構成',r=>r.id.startsWith('T-')],['復旧・表示',r=>r.id.startsWith('E')],['VMと今回の対象外',r=>r.id.startsWith('C')||r.id.startsWith('O-')]])index+=`## ${name}\n\n`+table(review.coverage.filter(filter))+'\n';
index+=`## 記録の品質\n\n${link('全動画・画像のデコード検査','logs/media-validation.json')} / ${link('実ブラウザでの動画再生','logs/video-playback-validation.json')} / ${link('Trace Viewer確認','logs/trace-viewer-validation.json')} / ${link('画像の目視点検','logs/visual-review.json')}。traceの操作履歴と本文は開けますが、3種類のDOM再生はいずれも装飾が一部欠落します。見た目はPNGとデスクトップ録画を参照してください。\n\n${link('正規化した操作一覧','steps.json')} / ${link('撮影時の原記録','steps.ndjson')} / ${link('暫定記録の訂正','review.json')}。製品・教材は撮影中に変更していません。\n`;
fs.writeFileSync(out+'/INDEX.md',index);
fs.writeFileSync(out+'/coverage.md',`# 実施範囲\n\n${summary}\n\nM/F2とT-F2は別の要求行として数えています。同じ操作の重複計上で品質を推定する数字ではありません。Cは隔離Linux Mint VMを計画した項目であり、実VMを動かした件数は0です。\n\n`+table(review.coverage)+`\n## E05補足\n\n実ホスト上でこのアプリのDOCKER_HOSTだけを存在しない専用ソケットへ向け、実Docker CLIの接続失敗→Linux教材→指定解除→実診断で利用可能を確認しました。IPCの差し替えやfixtureはありません。未導入・サービス停止・権限拒否の3状態には該当しないためE05本体はNOT_RUNです。${link('補足の実測','logs/recovery-summary.json')}\n\n## 失敗した試行\n\n記録のFAIL ${failures.length}件のうち、実操作のタイミング ${failures.filter(s=>s.classification==='OPERATION_TIMING').length}件、撮影操作・入力・フレーム不足 ${failures.filter(s=>s.classification!=='OPERATION_TIMING').length}件。これらは同じ不具合の重複画像を含み、製品不具合件数ではありません。${link('失敗の詳細と再試行','steps.md')}、${link('訂正理由','review.json')}。\n\nE04の診断取消、E07の意図的な通信断、S2の画面からの削除は今回未実施です。S2削除を含むDB権限・制約は同梱のrollback型CRUD試験で別に確認しました。S3クラウド参考構成の実装・起動は対象外です。\n`);
let timeline='# 全試行の時系列\n\n全行の実行場所はLinux Mint実ホストの専用Xephyr画面、操作はエージェントの自動操作です。端末内コマンドは表示中のホスト／Dev Container端末に入力しています。製品の状態をfixtureへ置き換えていません。初回試し撮りT01〜T04の失敗とT11〜T14の再試行も保持しています。\n\n';
for(const s of steps){timeline+=`<a id="record-${s.record}"></a>\n\n## ${s.record}. ${escape(s.id)} — ${s.status}\n\n| 項目 | 内容 |\n|---|---|\n| 時刻 | ${s.time} |\n| 場所・操作 | REAL_HOST / AUTOMATED / ${escape(s.place)} |\n| 操作 | ${escape(s.action)} |\n| 期待結果 | ${escape(s.expected)} |\n| 実結果 | ${escape(s.actual)} |\n| 画像 | ${s.screenshot?link('画像',s.screenshot):'ローカル原本のみ（media-index参照）'} |\n| 動画 | ${s.video?escape(path.basename(s.video.path))+' **'+mm(s.video.offsetSeconds)+'**（[取得先](media-index.md)）':'該当なし'} |\n| ログ | ${link(s.log,s.log)} |\n`;if(s.rawStatus!==s.status||s.reviewNote||review.overrides[s.id])timeline+=`\n点検: 撮影時=${s.rawStatus}、分類=${s.classification}。${s.reviewNote||'原記録との差分はreview.jsonを参照。'}\n`;}
fs.writeFileSync(out+'/steps.md',timeline);
const media=[];
for(const file of fs.readdirSync(runtime+'/media').sort()){if(!/\.(mp4|zip)$/.test(file))continue;const full=runtime+'/media/'+file,meta=fs.existsSync(full+'.json')?JSON.parse(fs.readFileSync(full+'.json')):null;media.push({file,path:full,kind:file.endsWith('.mp4')?'video':'trace',bytes:fs.statSync(full).size,sha256:sha(full),startJST:meta?.startJST,endJST:meta?.endJST,durationSeconds:meta?Number(meta.probe.format.duration):null});}
for(const file of ['app-trace.zip','browser-trace.zip']){const full=runtime+'/trial/'+file;if(fs.existsSync(full))media.push({file:'trial/'+file,path:full,kind:'trace',bytes:fs.statSync(full).size,sha256:sha(full)});}
const parts=fs.readFileSync(runtime+'/media/shared/F2-parts.csv','utf8').trim().split('\n').map(line=>{const [file,start,end]=line.split(',');const full=runtime+'/media/shared/'+file;return {file,path:full,bytes:fs.statSync(full).size,sha256:sha(full),originalStartSeconds:Number(start),originalEndSeconds:Number(end)}});
const rawPrivate=runtime+'/raw-private/M14c.png';
json(out+'/media-index.json',{storage:'LOCAL_ONLY; not uploaded to GitHub',retention:'No expiry or automatic deletion configured. Local disk is not an off-machine backup.',media,parts,privateScreenshot:{path:rawPrivate,bytes:fs.statSync(rawPrivate).size,sha256:sha(rawPrivate)}});
let mi='# 動画・traceの取得先\n\nGitに含めず、このLinux Mint PCのローカル原本を保持しています。既存の非公開成果物共有先がなく、GitHub Release一覧も空だったため、新しい共有サービスは作成していません。GitHub上の相対リンクから動画を取得することはできません。下記の絶対パスをこのPCで開くか、利用中のファイル転送手段で取得してください。保持期限・自動削除は設定していません。別PCへのバックアップは未実施です。\n\n保存先: `'+runtime+'/media`\n\n## 原本動画\n\n動画は1600×900・12fps・H.264・無音、カットなし。待機と撮影操作の修正も含みます。F2主経路の後に別構成、復旧、必要箇所の補足を取得しています。\n\n| 原本 | 開始 JST | 終了 JST | 秒 | bytes | SHA-256 |\n|---|---|---|---|---|---|\n';
for(const v of media.filter(m=>m.kind==='video'))mi+=`| ${escape(v.file)+'<br><code>'+escape(v.path)+'</code>'} | ${v.startJST} | ${v.endJST} | ${v.durationSeconds} | ${v.bytes} | \`${v.sha256}\` |\n`;
mi+='\n## F2の共有用4分割\n\n原本をキーフレーム境界でstream copyした分割です。短縮・成功場面のつなぎ合わせはしていません。ファイル内時刻は0へ戻り、索引の原本時刻から下表の開始秒を引いて参照します。全区間を連続してカバーします。F2原本・part-01にはM14cの既存信頼パスの表示が含まれます。\n\n| ファイル | 原本の区間（秒） | bytes | SHA-256 |\n|---|---|---|---|\n';
for(const v of parts)mi+=`| ${escape(v.file)+'<br><code>'+escape(v.path)+'</code>'} | ${v.originalStartSeconds}–${v.originalEndSeconds} | ${v.bytes} | \`${v.sha256}\` |\n`;
mi+='\n## Trace\n\nPlaywright Trace Viewerで開けることをElectron／Code／ブラウザ各1件で確認しました。全ZIPは整合性検査済み。DOM再生の装飾は不完全なので、操作履歴・本文確認に使用してください。主経路の見た目とOS画面は動画が根拠です。\n\n```sh\nnode tools/node_modules/playwright/cli.js show-trace --host 127.0.0.1 --port 9437 \\\n  "'+runtime+'/media/F2-editor-trace-02.zip"\n```\n\n| Trace | bytes | SHA-256 |\n|---|---|---|\n';
for(const v of media.filter(m=>m.kind==='trace'))mi+=`| ${escape(v.file)+'<br><code>'+escape(v.path)+'</code>'} | ${v.bytes} | \`${v.sha256}\` |\n`;
mi+='\n## ローカルのみの画像\n\nM14c: `'+rawPrivate+'`。SHA-256 `'+sha(rawPrivate)+'`。既存の別フォルダの信頼パスを含むため、リポジトリには追加していません。原記録steps.ndjsonの旧相対パスは点検後ここへ移しました。steps.jsonに移動先を保持しています。\n';
fs.writeFileSync(out+'/media-index.md',mi);
console.log(JSON.stringify({counts,attemptFailures:failures.length,steps:steps.length,media:media.length,parts:parts.length}));
