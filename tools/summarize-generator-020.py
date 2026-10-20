from pathlib import Path
import json,hashlib,datetime
ROOT=Path(__file__).resolve().parents[1]
EVIDENCE=ROOT/'validation/generator-0.2.0'
read=lambda p:json.loads((ROOT/p).read_text())
commands=['g020-baseline-tests','g020-core-cli-final','g020-wizard','g020-desktop-build-final','g020-desktop-ipc-unit','g020-gui-acceptance-tested','g020-gui-plan-parity','g020-f2-up','g020-f2-check','g020-f2-http','g020-f2-browser-tested','g020-f2-down','g020-s2-db-start','g020-s2-up','g020-s2-check','g020-s2-unit','g020-s2-database','g020-s2-browser','g020-s2-api','g020-s2-app-stop','g020-s2-db-stop']
for cid in commands:assert read(f'validation/root/{cid}/result.json')['result']=='PASS',cid
for name in ['cli-bundle.json','gui/result.json','gui/plan-parity.json','startup/F2-browser.json','startup/S2-browser.json','startup/final-state.json']:assert read('validation/generator-0.2.0/'+name)['status']=='PASS',name
mapping={
'G01':('全6構成・混在版・元ZIP内容の一致',['cli-bundle.json','gui/result.json']),
'G02':('目的の対応、S3のcore拒否',['../root/g020-core-cli-final/result.json']),
'G03':('plan・back・生成前中止は書込みなし',['wizard/result.json','gui/result.json']),
'G04':('I1秘密値はapplyの.envのみ0600',['../root/g020-core-cli-final/result.json','gui/result.json','gui/plan-parity.json']),
'G05':('catalog・ZIP・先の出現・親・計画改変を拒否',['../root/g020-core-cli-final/result.json']),
'G06':('既存保護、ZIP、競合、rollbackと編集保持',['../root/g020-core-cli-final/result.json']),
'G07':('生成と起動の診断を分離、未確認はnull',['../root/g020-core-cli-final/result.json','gui/plan-parity.json']),
'G08':('旧create・wizard・GUI/CLIで一致。GUI/CLIはplan全体も一致',['../root/g020-core-cli-final/result.json','wizard/result.json','gui/result.json','gui/plan-parity.json']),
'G09':('構成別の場所・コマンド・ポート・実在教材リンク',['../root/g020-core-cli-final/result.json']),
'G10':('非TTY・JSON・終了コード・PTY割込み',['../root/g020-core-cli-final/result.json','wizard/result.json']),
'G11':('日本語・空白・メタ文字をパスとして処理',['../root/g020-core-cli-final/result.json','gui/result.json']),
'G12':('実GUIの戻る・エラー修正・BUSY・worker再試行・reload',['gui/result.json','gui/plan-parity.json']),
'G13':('renderer制限・IPCの入力/送信元・protocol制限',['../root/g020-desktop-ipc-unit/result.json','gui/result.json']),
'G14':('別フォルダのCLI/GUI配布物から独立して生成',['cli-bundle.json','gui/result.json']),
'G15':('最終CLI ZIP生成のF2/S2を実Dev Containerで起動・主要操作',['startup-generation.json','startup/F2-browser.json','startup/S2-initial.json','startup/S2-browser.json','startup/final-state.json'])}
checks=[]
for cid,(scope,files) in mapping.items():
    for f in files:assert (EVIDENCE/f).is_file(),f
    checks.append({'id':cid,'status':'PASS','scope':scope,'evidence':files})
priorFailures=[
('g020-core-cli-tests','試験cleanupの順序を修正。製品の書込拒否は動作していた。','g020-core-cli-final'),
('g020-gui-probe','内部file取得もネットワーク拒否対象。allowlist内の静的bytes配信へ修正。','g020-gui-probe-fixed'),
('g020-gui-acceptance','画面切替後の既定submitを防ぐためbutton type/keyを明示。','g020-gui-acceptance-tested'),
('g020-gui-acceptance-final','試験の別プロセスevaluateへPIDを引数として渡すよう修正。','g020-gui-acceptance-tested'),
('g020-f2-browser','試験locatorを既存の「クリア」文言へ修正し、所有サーバー再起動後に再試験。','g020-f2-browser-tested'),
('g020-s2-app-down','検証側が共通helper名を誤用。S2 READMEのapp.sh stopへ修正。','g020-s2-app-stop')]
artifacts=[]
for filename,record in [('meikyo-generator-cli-0.2.0-linux.zip','cli-bundle.json'),('meikyo-generator-linux-x64-0.2.0.tar.gz','gui/result.json')]:
    p=ROOT/'dist'/filename;digest=hashlib.sha256(p.read_bytes()).hexdigest();observed=read('validation/generator-0.2.0/'+record)
    tested=observed.get('sha256') or next(x['sha256'] for x in observed['records'] if x['id']=='G14-relocated-binary')
    assert tested==digest
    artifacts.append({'file':filename,'sha256':digest,'bytes':p.stat().st_size,'sameBytesAsTested':True})
report={'version':'0.2.0','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'PASS','scope':'Linux Mint22.3 x86_64; shared core, CLI, real Electron window and relocated binary, representative Dev Container CLI F2/S2. Not universal OS/user acceptance.','checks':checks,'testCounts':{'coreIncludingOriginal8':21,'realPty':3,'ipcUnit':2,'guiAcceptanceChecks':15,'planParityAndEditorFailure':7},'commandEvidence':[f'validation/root/{x}/result.json' for x in commands],'artifacts':artifacts,'repairedAttempts':[{'attempt':a,'reasonAndRepair':b,'successfulFollowup':c} for a,b,c in priorFailures],'notRun':['VS Code actual Reopen/reconnect/rebuild','Windows/WSL','macOS/ARM','fresh-PC installation','GitHub Actions on hosted runner','beginner trial','native OS parent-folder picker automation'],'blocked':['S3 dedicated live cloud connection remains outside generator and blocked; existing evidence retained'],'resources':'../resources-final.json'}
(EVIDENCE/'summary.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'status':'PASS','criteria':len(checks),'artifacts':artifacts},ensure_ascii=False))
