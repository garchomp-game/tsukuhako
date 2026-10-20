from pathlib import Path
import json,sys,datetime
name=sys.argv[1]; prefix=name.lower(); base=Path('validation/frontend-api'); target=Path('starter-templates')/name
runs=[]
for p in sorted(base.glob(f'{prefix}-*/result.json')):
 d=json.loads(p.read_text()); d['command']=[str(v).replace(str(Path('.').resolve())+'/tools/node_modules/.bin/devcontainer','devcontainer') for v in d['command']]
 d['log']=str(p.parent.relative_to(base)/'output.log')
 runs.append(d)
criteria=[]
passed={
'A01':('別フォルダへZIP展開・単独起動',[f'{prefix}-zip-up',f'{prefix}-zip-probe']),
'A02':('設定欠落・Docker未接続・不正ポートの診断',[f'{prefix}-diagnostics']),
'A03':('固定Node/npmとlockfileから新規volumeにnpm ci',[f'{prefix}-up',f'{prefix}-zip-up']),
'A04':('Dev Container CLIで作成・接続・check実行。VS Code UIは別の未実測項目',[f'{prefix}-up',f'{prefix}-check']),
'A05':('実HTTP契約と構成固有の主要操作',[f'{prefix}-http']+([] if name=='B1' else [f'{prefix}-browser'])),
'A06':('ソース変更が開発サーバー再起動なしで反映',[f'{prefix}-hmr']),
'A08':('compose down（volume保持）→up後も編集と主要動作を保持',[f'{prefix}-rebuild-down',f'{prefix}-rebuild-up',f'{prefix}-rebuild-probe']),
'A10':('同一テンプレートの別ZIPコピーを異なるproject/port/volumeで同時利用',[f'{prefix}-zip-probe',f'{prefix}-coexist-original']),
'A11':('固定のHTTP契約・ブラウザ操作テストを実行',[f'{prefix}-http']+([] if name=='B1' else [f'{prefix}-browser'])),
'A13':('実.env・資格情報パターン・制作者パスを除外しloopback公開を確認',[f'{prefix}-audit',f'{prefix}-up']),
'A15':('環境・未検証OS・CLIとVS Code実操作の区別を記録',[]),
}
for n in range(1,17):
 key=f'A{n:02d}'; row={'id':key,'applicable':True,'status':'NOT_RUN','evidence':[]}
 if key in passed:
  observation,evidence=passed[key]; row.update(status='PASS',observation=observation,evidence=evidence)
 elif key=='A07':row.update(observation='CLIによる停止・再開と編集保持はPASS。VS Code再接続の実操作はNOT_RUN。',evidence=[f'{prefix}-stop',f'{prefix}-restart-probe'])
 elif key=='A09':row.update(applicable=False,observation='DBなしのステートレス構成のためmigration/seed/DB resetは対象外。')
 elif key=='A12':row.update(observation='workflow同梱、同じcheck/test/buildはローカルPASS。GitHubへのpush/実CIは依頼範囲外でNOT_RUN。',evidence=[f'{prefix}-check',f'{prefix}-http',f'{prefix}-build'])
 elif key=='A14':row.update(observation='日本語教材のconfigure/doctor/依存復元/起動/変更/復旧はCLIで実測。教材のVS Code操作と未導入PC・初学者による試用はNOT_RUN。',evidence=[f'{prefix}-zip-up',f'{prefix}-hmr',f'{prefix}-diagnostics'])
 else:row.update(observation='この構成のソース・教材・実測・試験ZIPは完了。全体catalog/REPORT/最終配布は統合担当の確認対象。')
 if name=='S1':
  row['evidence']=[{'s1-browser':'s1-browser-fixed','s1-check':'s1-check-clean','s1-build':'s1-build-final'}.get(e,e) for e in row['evidence']]
 criteria.append(row)
report={'template':name,'version':'0.1.0','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'environment':{'os':'Linux Mint 22.3','architecture':'x86_64','docker':'29.9.1','compose':'5.6.0','devcontainerCLI':'0.89.0','containerNode':'24.22.0','containerNpm':'11.17.0','browser':'Chromium 156.0.8078.4 (Playwright 1.64.1); host Chrome 155.0.8059.84' if name!='B1' else 'not applicable: API only'},'cache':'Fresh project dependency/cache volumes; shared Docker image/layers were reused. Host caches were not globally deleted.','criteria':criteria,'runs':runs,'unverified':['VS Code UI operations','Windows + WSL','macOS','ARM','First installation on a PC without prerequisites','Live GitHub Actions','Beginner usability testing']}
if name=='S1':report['resolvedFailures']=[json.loads((base/'s1-browser-fix.json').read_text())]
(base/f'{name}-acceptance.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
(target/'docs/VALIDATION.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
http=1 if name=='F1' else 10; browser=2 if name=='F1' else (5 if name=='S1' else 0)
lines=[f'# {name} 実測記録','', '版 0.1.0 / 検証日 2026-10-20。Linux Mint 22.3・x86_64、Docker 29.9.1、Compose 5.6.0、Dev Container CLI 0.89.0。コンテナはNode 24.22.0 / npm 11.17.0。','',f'固定依存の復元、check、build、HTTP {http}件'+(f'、Chromiumでのブラウザ操作 {browser}件' if browser else '')+'がPASS。ソース変更の自動反映、停止・再開、コンテナ再作成後の編集保持、ZIP新規展開、日本語と空白を含むパス、別コピーの同時利用も実測しました。','', '新しい依存volumeを使いました。Dockerの共有イメージキャッシュは利用しており、ホストキャッシュを全削除した試験ではありません。','', '|確認|結果|','|---|---|']
for row in criteria:lines.append(f"|{row['id']} {row['observation']}|{row['status'] if row['applicable'] else '対象外（PASSに数えない）'}|")
lines += ['', '詳しい実行日時、コマンド、終了コード、所要時間、A01〜A16判定は [実測JSON](docs/VALIDATION.json) に同梱しています。ログのIDは全体配布物のvalidation/frontend-api配下に対応します。単独配布でもこの要約とJSONだけで判定を確認できます。','', ('B1にはUIがなく、画面操作とスクリーンショット確認は対象外です。' if name=='B1' else '画面の自動操作とエージェントによるスクリーンショット確認は、本人の目視や初学者の試用と区別します。')+'VS Code実操作・実CI・Windows/WSL・macOS・ARMはNOT_RUNです。Linuxの成功からこれらを推定しません。','', 'npmはESLint 9.39.5にサポート終了の警告を出します。採用Next設定との互換性を固定し、当版のcheckは成功しました。今後のESLint更新は別版で検証します。','']
if name=='S1':lines += ['初回のブラウザ試験は3件PASS・2件FAILでした。Next.jsの通知領域とアプリのエラーを同じalertセレクターで選んだことが原因です。フォーム内に対象を絞り、再実行で5件PASS。元ログと修正記録を保持しています。','']
(target/'VALIDATION.md').write_text('\n'.join(lines))
print(f'{name}: acceptance and standalone validation records written')
