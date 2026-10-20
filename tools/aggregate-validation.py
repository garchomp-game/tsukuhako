"""個別の実測記録を統合する。未実施GUI/クラウドを推定しない。"""
from pathlib import Path
import json,datetime
ROOT=Path(__file__).resolve().parents[1]
catalog=json.loads((ROOT/'catalog.json').read_text())
entries={entry['id']:entry for entry in catalog['templates']}
names=['単独配布','前提診断','固定依存の復元','実Dev Container','主要機能','ソース変更の反映','停止・再開とVS Code再接続','再構築・保持','DB初期構築・リセット','資源分離','意味のある自動チェック','CIへの移植','公開境界','教材手順の再現','環境表記','引渡し']
sources={'F1':'validation/frontend-api/F1-acceptance.json','F2':'validation/root/F2-acceptance.json','B1':'validation/frontend-api/B1-acceptance.json','S1':'validation/frontend-api/S1-acceptance.json','I1':'validation/i1/results.json','S2':'validation/s2/summary.json','S3':'validation/s3/summary.json'}
allrows=[]
for tid,source in sources.items():
    original=json.loads((ROOT/source).read_text())
    rows=original.get('criteria',original.get('results',[]))
    mapped={row['id']:row for row in rows if isinstance(row,dict) and 'id' in row}
    if tid in ['S2','S3']:
        doc=(ROOT/'starter-templates'/tid/'VALIDATION.md').read_text()
        for line in doc.splitlines():
            if not line.startswith('|A'): continue
            cells=line.strip('|').split('|')
            aid=cells[0].split()[0]
            note=' / '.join(cells[1:])
            status='BLOCKED' if tid=='S3' and aid in ['A05','A09'] else ('NOT_RUN' if 'NOT_RUN' in note and 'PASS' not in note else 'PASS')
            mapped[aid]={'id':aid,'applicable':True,'status':status,'observation':note,'evidence':[source,'starter-templates/'+tid+'/VALIDATION.md']}
    final=[]
    for n,label in enumerate(names,1):
        aid=f'A{n:02d}'
        row=dict(mapped.get(aid,{'id':aid,'applicable':True,'status':'NOT_RUN','observation':'個別実測の追加証拠なし'}))
        row['title']=label
        row['status']=row.get('status',row.get('result','NOT_RUN'))
        row['source']=source
        if aid=='A07':
            row['status']='NOT_RUN'
            row['observation']='CLIの起動/停止は個別記録どおり。必須のVS Code GUI再接続を実施していないため全体合格にしない。'
        if aid=='A12':
            row['status']='PASS'
            row['observation']='同梱workflowがローカルで実測したコマンドを呼ぶ。GitHub上の実行は別項目でNOT_RUN。'
        if aid=='A14':
            row['status']='NOT_RUN'
            row['observation']='記載コマンドのローカル再現は実施。VS Code GUIを含む全手順、未導入PC、初学者の試用は未実施。S3実クラウド手順はBLOCKED。' if tid=='S3' else '記載コマンドのローカル再現は実施。VS Code GUIを含む全手順、未導入PC、初学者の試用は未実施。'
        if aid=='A15':
            row['status']='PASS';row['observation']='実測環境と未実施環境を分離し、REPORT・catalogに記載。'
        if aid=='A16':
            row['status']='PASS';row['observation']='独立ソース・教材・固定版・catalog・個別ZIP・実測証拠・既知制約を統合。最終ファイル照合はpackage-audit.json。';row['evidence']=['validation/package-audit.json','REPORT.md','catalog.json']
        if tid=='S3' and aid in ['A06','A08','A10']:
            row['status']='NOT_RUN';row['observation']='S3専用のHMR/再作成保持/同一コピー同時共存の当該試験は未実施。ローカルSQL権限試験や設定なし起動と区別。'
        final.append(row)
    manifest=json.loads((ROOT/entries[tid]['packagePath']).with_suffix('.manifest.json').read_text())
    allrows.append({'template':tid,'version':manifest['version'],'baseObservationVersion':'0.1.0','packageSha256':manifest['sha256'],'scope':'Linux Mint 22.3 x86_64 / Docker29.9.1 / Compose5.6.0 / DevCLI0.89.0','criteria':final})
result={'recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'precedence':'Final integration scope is here; individual records preserve earlier observations and command logs.','templates':allrows,'adapter':'validation/adapter/results.json','generator':'validation/root/generator-tests-final/result.json','notRun':['VS Code GUI','Windows + WSL actual machine','macOS / ARM','fresh-PC installation','GitHub-hosted CI','novice trial'],'blocked':['S3 dedicated live cloud connection']}
if catalog['packageVersion']=='0.1.1':
    revisions={
        'adapter':'validation/revision-0.1.1/adapter/summary.json',
        'learning':'validation/revision-0.1.1/learning/summary.json',
        's2':'validation/revision-0.1.1/s2/summary.json',
    }
    for source in [*revisions.values(),'validation/revision-0.1.1/generator/result.json']:
        if not (ROOT/source).is_file(): raise ValueError(f'Missing revision evidence: {source}')
        evidence=json.loads((ROOT/source).read_text())
        if evidence.get('result')!='PASS': raise ValueError(f'Revision evidence is not PASS: {source}')
    result['reviewRevision']='0.1.1'
    result['reviewEvidence']=revisions
    result['adapter']=revisions['adapter']
    result['generator']='validation/revision-0.1.1/generator/result.json'
    for template in result['templates']:
        tid=template['template']
        if tid in ['F1','B1','S1']:
            template['revisionEvidence']=revisions['learning']
            for row in template['criteria']:
                if row['id']=='A14':
                    row['observation']='0.1.1の構成別教材に列挙したファイルだけを空フォルダへ配置しcheckと主要機能を実測。VS Code GUI/未導入PC/初学者試用は未実施のため全体はNOT_RUN。'
                    row.setdefault('evidence',[]).append(revisions['learning'])
        if tid=='S2':
            template['revisionEvidence']=revisions['s2']
            for row in template['criteria']:
                if row['id'] in ['A01','A03','A05','A09','A11','A12','A14']:
                    row.setdefault('evidence',[]).append(revisions['s2'])
                if row['id']=='A12':
                    row['observation']='CI相当の環境と順序でHTTP→ブラウザ→サーバー終了/ポート解放→buildを実測。GitHub上の実CIはNOT_RUN。'
(ROOT/'validation/acceptance.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print('Integrated',len(allrows),'templates /',sum(len(x['criteria']) for x in allrows),'criteria')
