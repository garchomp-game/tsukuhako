from pathlib import Path
import json,statistics
R=Path(__file__).resolve().parents[1];V=R/'validation/learning-0.4.0';g=json.loads((V/'gui-results.json').read_text());c=json.loads((V/'coexist-memory.json').read_text());hz=g['conditions']['clockTicksPerSecond']
def stats(xs):
 return {'n':len(xs),'min':round(min(xs),2),'median':round(statistics.median(xs),2),'max':round(max(xs),2)} if xs else None
def cpu(rows,key=None):
 values=[]
 for a,b in zip(rows,rows[1:]):
  old={r['pid']:r['ticks'] for r in a[key or 'rows']};dt=(b['at']-a['at'])/1000
  if dt>0:values.append(sum(max(0,r['ticks']-old[r['pid']]) for r in b[key or 'rows'] if r['pid'] in old)/hz/dt*100)
 return stats(values)
phases=[]
for name in dict.fromkeys(s['phase'] for s in g['samples']):
 rows=[s for s in g['samples'] if s['phase']==name];phases.append({'phase':name,'pssMiB':stats([s['pssKb']/1024 for s in rows]),'rssMiB':stats([s['rssKb']/1024 for s in rows]),'cpuPercentOneLogicalCore':cpu(rows),'spanSeconds':round((rows[-1]['at']-rows[0]['at'])/1000,2)})
coexist=[]
for o in c['observations']:
 row={'version':o['version'],'samples':len(o['samples']),'processRemaining':o['remaining'],'codeAlive':o['codeAlive'],'sampleAlive':o['sampleStillAlive']}
 for name in ['app','code']:
  row[name]={'pssMiB':stats([sum(r['pssKb'] for r in s[name])/1024 for s in o['samples']]),'rssMiB':stats([sum(r['rssKb'] for r in s[name])/1024 for s in o['samples']]),'cpuPercentOneLogicalCore':cpu(o['samples'],name)}
 coexist.append(row)
latencies=next(r['latenciesMs'] for r in g['records'] if r['id']=='L10-chapter-switches')
result={'artifactSha256':g['artifact'],'phases':phases,'coexist':coexist,'chapterSwitchLatencyMs':stats(latencies),'cpuMethod':'CPU ticks delta for PIDs present in both samples / CLK_TCK / wall seconds *100. 100%=one logical core. New/exited PIDs can be undercounted; test tooling excluded.','finiteObservationOnly':True,'standaloneBaselineCaveat':'baseline-030.json is initial app.getAppMetrics (not all zygotes). Compare whole-tree coexist records separately.'}
(V/'measurement-summary.json').write_text(json.dumps(result,indent=2)+'\n')
lines=['# CPU・メモリ・操作応答の測定','', '2026-10-21 / Linux Mint 22.3 x86_64 / Intel i7-10750H・12論理CPU / RAM約23.23 GiB。Docker Engine29.9.1、実VS Code1.142.0のF2 Dev Containerとnpm devを併用。ブラウザの既存タブは変更せず、測定用アプリは別プロファイル。共有端末の背景処理と測定処理の負荷は残ります。','',f'最終Linux tar SHA256: `{g["artifact"]}`。配布容量は実行中の使用メモリとは別です。','', '## 最終配布GUIの観測','', 'mainを起点に/procから子孫PIDを列挙し、smaps_rollupのPSS/RSSを合計。CPUはstatのutime+stime。100msごとにサンプルを取りました。ツール自身は集計対象外です。PSSは共有ページを按分します。CPU100%は1論理コアで、プロセス出入りをまたぐCPU量は過小評価する場合があります。','', '|場面|標本数|PSS中央値 MiB|PSS min–max MiB|RSS中央値 MiB|CPU中央値 %|CPU観測最大 %|','|---|---|---|---|---|---|---|']
for r in phases:
 p=r['pssMiB'];u=r['cpuPercentOneLogicalCore'];lines.append(f'|{r["phase"]}|{p["n"]}|{p["median"]}|{p["min"]}–{p["max"]}|{r["rssMiB"]["median"]}|{u["median"] if u else "—"}|{u["max"] if u else "—"}|')
launch=next(r for r in g['records'] if r['id']=='P01-L05-linux-launch');lines+=['',f'操作可能な初期画面まで約{launch["startupMs"]}ms。240回の章切替応答は中央値{statistics.median(latencies):.1f}ms、観測最大{max(latencies):.1f}ms。60回ごとに5秒休止し、最後は30秒待機。手前に10秒の生成画面待機も含みます。','', 'generation欄は短いGUI生成と6構成IPC生成を含む観測期間の最大値です。100ms間隔の間に生じた真のピークを保証しません。chapter-switchesは複数ブロックをまとめています。CPU差分の一部には間の休止時間も含むため、ブロック別の詳細は生のJSONを参照してください。','', 'DOMと本文キャッシュの上限を実装し、反復測定しましたが、途中のPSSはGC・画像・コード読込などで変動しています。この短時間試験だけで長時間のリーク不在や上限値は断定しません。','', '## VS Code + Docker併用時の比較','', '|版と場面|ツクハコPSS中央値 MiB|min–max MiB|VS Code PSS中央値 MiB|ツクハコCPU中央値 %|終了後の所有PID残存|','|---|---|---|---|---|---|']
for r in coexist:
 p=r['app']['pssMiB'];lines.append(f'|{r["version"]} {"生成画面待機" if r["version"]=="0.3.0" else "教材待機"}|{p["median"]}|{p["min"]}–{p["max"]}|{r["code"]["pssMiB"]["median"]}|{r["app"]["cpuPercentOneLogicalCore"]["median"]}|{len(r["processRemaining"])}|')
lines+=['', '同じF2プロジェクト・実VS Code・Docker・ブラウザの下で、各30回、1秒間隔で全プロセスツリーを測定しました。0.3.0は生成画面、0.4.0は教材表示なので活動は同一ではありません。削減量の宣伝や厳密な性能比較には使いません。両版の終了後もCodeとサンプルHTTPの生存を確認しました。','',f'DockerのF2コンテナ観測: `{c["dockerStats"]["MemUsage"] if c.get("dockerStats") else "未取得"}`。これはcgroupの使用量で、PSSとは定義が違います。足し合わせて全体PSSと呼びません。','', '初期baseline-030.jsonは変更前に採ったElectron app.getAppMetricsの参考値で、zygote等を網羅しません。上表の/proc全ツリー測定と直接比較しません。Windows/macOSは測定用実機がなくNOT_RUNです。','', '終了中の診断では、SIGTERMを無視する所有コマンドの停止を待ち、約1秒で終了しました（app-diagnosis-shutdown.json、固定待機700msを含む）。ヘルパーactive jobの終了も別途確認しました。','', '再測定する場合は専用プロファイル・生成先を新しくし、CPU/OS/常駐アプリ/開く教材/同時コンテナを記録してください。測定のためにユーザーのプロジェクトや既存Docker資源を削除しないでください。']
(V/'MEASUREMENTS.md').write_text('\n'.join(lines)+'\n')
print(json.dumps({'phases':phases,'coexist':coexist,'chapterSwitchLatencyMs':stats(latencies)},indent=2))
