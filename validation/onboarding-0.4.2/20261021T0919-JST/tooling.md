# 使用した道具と再取得

このリポジトリの既存 `verify-ux-042.mjs`、`launch-vscode-042.mjs`、`vscode-edit-restore-042.mjs` のPlaywright・Code編集手順を基に、小さな `tools/onboarding-*.mjs` を追加しました。外部の自動化基盤は追加していません。今回の原本は消さず、再取得は必ず新しい `ONBOARDING_OUT` で行います。

## 使用版・導入先

| 道具 | 使用版・場所 | 追加・用途 |
|---|---|---|
| Node | nvm 24.19.0 | 既存。UI操作・索引・メタデータ |
| Playwright | tools/node_modules、lockfileの1.64.1 | 既存。CDP、Electron、trace。Electron対応はexperimental |
| Python | uv run --offline --no-project python、標準ライブラリのみ | 既存。配布アーカイブ作成・ZIP整合性 |
| FFmpeg | 6.1.1-3ubuntu5 | 既存。x11grab、H.264、probe・全編decode、stream copy分割 |
| Xephyr | 2:21.1.12-1ubuntu1.8 | 既存。実ホスト内の専用X11画面 :91 |
| Metacity | 1:3.52.0-1build1 | 既存。専用画面のウィンドウ管理 |
| Nemo / file-roller | 6.6.3+zena / 43.0+mint1+wilma | 既存。アーカイブの利用者向け展開と通常入口 |
| xdotool / wmctrl / gnome-terminal / script | ローカル導入済みコマンド | 既存。OSウィンドウ・実端末操作・ログ |
| ImageMagick identify | 導入済みコマンド | 既存。画像decode・寸法・空画像検査 |
| VS Code | 1.142.0 / /usr/bin/code | 既存。新規user-data-dirとextensions-dirを使用 |
| Dev Containers | 0.469.0 / runs/code-extensions | MarketplaceのInstallボタンで新規導入。ホストの0.470.0をコピーしていない |
| Google Chrome | /usr/bin/google-chrome | 既存。sandbox有効のheadful表示。runs/browserに専用profile |
| Firefox | 既存 | Trace ViewerのCLIが専用画面に自動起動。点検自体は専用Chromeで実施し、所有プロセスのみ終了 |
| Supabase CLI | 2.121.0 / 生成S2内の.cache | `bash scripts/db.sh start` が取得・固定checksumを確認。OSへはインストールしない |

OSパッケージの導入・更新コマンドは実行していません。`local-linux-investigation` skillと `~/.codex/docs/local-command-inventory.md`、`local-command-status.md` を参照し、変化する状態は実測しました。全環境変数のダンプ、Docker全体の削除はしていません。

## 初回条件と観測引数

アプリの新規profileは `runs/xdg-config/tsukuhako`。試し撮りは `runs/trial`、復旧は `runs/recovery*` の別profileです。Nemoから展開した実行ファイルを引数なし・UID 1000で起動したM03の後、同じprofileを `--remote-debugging-port=9430` で開き直しました。再起動後は9434です。sandbox無効化・root起動はしていません。

`runs/bin/code` は実 `/usr/bin/code` へ、専用user-data-dir・extensions-dir・CDP9431だけを付けて引き渡すPATH wrapperです。呼出引数は [code-invocations.log](logs/code-invocations.log)。IPC成功の偽装はありません。初回説明・信頼確認も実UIで行いました。ただし新規profileでも信頼設定画面には既存の別フォルダのパスが現れたため、「全OS連携状態が初期化された」とは扱いません。

Dockerイメージとbuild cacheは既存のものを保持。各生成プロジェクトの依存・npm-cache volumeは新規、VS Code Server用 `/vscode` volumeは既存共有です。「Dockerキャッシュなし」「VS Code Serverの初回download」「クリーンOS」の試験ではありません。S2はプロジェクト内CLIを新規取得しましたが、Supabaseイメージには既存cacheがあります。[開始時の状態](environment.json)

E05の補足はプロセス単位の無効な `DOCKER_HOST` です。実Docker CLIのエラーを観測し、ホストdaemonは停止していません。E08の200%はElectron観測APIで実際のzoomFactorを2にしたもので、製品内のズームメニューを操作したとの主張ではありません。

## 再取得の順序

対象は今回と同じLinux Mint/X11・0.4.2です。画面名やCodeの英語コマンド、実ポート9430〜9439、固定の撮影display :91を使うため、他OSでそのまま使える汎用ランナーではありません。コマンドはリポジトリ直下から実行します。Nodeはnvm、Pythonはuvを使います。

```sh
nvm use 24.19.0
# 依存がない別checkoutでは、まず各既存lockfileに従ってnpm ciする。
npm run build --prefix generator-desktop
uv run --offline --no-project python tools/package-desktop-042.py
export ONBOARDING_OUT="$PWD/validation/onboarding-0.4.2/$(date +%Y%m%dT%H%M%S)-JST"
mkdir -p "$ONBOARDING_OUT/logs" "$ONBOARDING_OUT/screenshots"
bash tools/onboarding-desktop.sh
```

最後のコマンドは専用DBus・Xephyrを維持するため起動したままにします。別端末でも**同じONBOARDING_OUT**を指定してください。既存の出力先を再利用すると起動を拒否します。既存の :91 や9430〜9439が使われている場合は、そのプロセスを勝手に終了せず、別番号を選んでスクリプト側も合わせます。

1. `node tools/onboarding-trial.mjs`、必要なら `onboarding-trial-retry.mjs` で約30秒の試し撮りを行い、実際に開いて確認します。初回スクリプトは冷起動の待ち時間不足があり、今回も再試行しました。試し撮り後は専用Code窓を閉じ、9430を空けます。環境・VM判定は別に実測してenvironment.jsonへ追記してください。今回のVM記録は [vm-readiness.json](logs/vm-readiness.json) です。
2. `onboarding-evidence.mjs` の `runtime` 配下に `受取物` を作り、distのアーカイブをローカルコピーします。`record-start F2-main` で記録開始。Nemoでその場所を開き、ファイルを右クリック→Extract Here→展開フォルダ→tsukuhakoを実行します。日本語パスをxdotool typeへ渡すと文字が欠落したため、フォルダを開く操作を使ってください。
3. 通常起動の窓と引数を記録してから `node tools/onboarding-main-app.mjs` を実行します。これは以下の `normal-entry.json` を必要とします。今回のNemo操作はOS入力で自動操作しましたが、再取得時はこの入口を本人が操作しても構いません。その場合interactionをMANUALへ変更し、未計測の起動時間はnullにします。

```js
// node --input-type=module から実行。Nemoで起動した専用窓を観測する。
import {runtime, command, env, json} from './tools/onboarding-evidence.mjs';
const window = command('wmctrl', ['-lp'], {env: env()})
  .split('\n').find(line => line.includes('ツクハコ | 作る'));
if (!window) throw Error('通常入口で起動した専用窓がありません');
json(runtime+'/normal-entry.json', {
  window, arguments: [], elapsedToWindowMs: null,
  method: 'Nemoから通常起動。再取得の起動時間は未計測'
});
```

4. `onboarding-main-app.mjs` は準備・生成・教材・host doctor・アプリからCodeを開くところまで操作します。新規Codeの説明を閉じ、生成したフォルダを確認して信頼し、拡張画面でMicrosoftのDev Containersを検索・Installします。実導入後、アプリへ戻って「もう一度確認」を押し、利用可能への変化を記録します。この初回Code UI部分は自動化の固定スクリプトへ閉じ込めていないため、UI操作が必要です。今回の各操作はsteps.ndjsonとF2動画、Code onboarding/trust traceに保持しています。
5. 次の順に実行します。F2の録画はlifecycle終了まで止めません。connectの最終スクリプトは撮影で分かった問題を反映し、接続表示に加え「準備完了」を待ちます。

```sh
node tools/onboarding-f2-code.mjs
node tools/onboarding-f2-exercise.mjs
node tools/onboarding-reading.mjs
node tools/onboarding-f2-lifecycle.mjs
```

6. F2のCode窓を閉じ、F2生成先で `bash scripts/compose.sh down`（volume削除なし）を実行します。その後F1、B1、S1、S2、I1について、以下の4フェーズを**一構成ずつ**実行します。別構成を同時起動しません。

```sh
# F1をB1/S1/S2/I1に替えて順に実行する
node tools/onboarding-template.mjs F1 prepare
node tools/onboarding-template.mjs F1 connect
node tools/onboarding-template.mjs F1 exercise
node tools/onboarding-template.mjs F1 stop
```

7. I1停止後に `node tools/onboarding-s2-retention.mjs`、`node tools/onboarding-recovery.mjs` でDB保持と代表的な復旧を取得します。必要な補足のみ `onboarding-recovery-detail.mjs`、`onboarding-s2-heading.mjs` を使います。I1の編集済み状態から再試行するときは、ソースhashを照合した上で `onboarding-template.mjs I1 exercise --resume-edit` を使えます。失敗後は現在の状態を確認し、機械的に全フェーズを繰り返さないでください。
8. 専用Chromeが開いている間に `node tools/onboarding-media-review.mjs` でtrace3種類とF2動画を開き、出力画像を点検します。`onboarding-media-check.mjs` は動画全編decode、PNG検査、F2の小分けを行います。同一SHAの動画decode結果は再利用します。全動画の新規検査は初回に行われ、上書きされていないかSHAで確認します。
9. 試験プロジェクトだけ停止してソースSHAを確認。専用profile／displayや保存したPID・引数で所有を確認したプロセスだけ終了し、既存containerのStartedAtと必要volumeを再確認します。`docker system prune` や全container停止は使いません。原本、生成.env、profileは `runs/` のGit除外領域に保持します。
10. `review.json` に観測事実と訂正を記入し、`node tools/onboarding-index.mjs` でsteps/coverage/INDEX/media-indexを生成します。原記録の暫定PASSをそのまま最終集計に使わず、画像・ログを照合します。今回の訂正・補足はすべてreview.jsonにあります。

## スクリプトの来歴

初期helpersコミットは `af69a545fe661e92020bfe96453cf02f1a5e3a58`。最終スクリプトコミットは [capture-provenance.json](capture-provenance.json) を参照してください。途中で端末の表示先・入力・パレット選択・読書位置待機・画像のスクロール位置を修正しています。最終commitのコードが過去の失敗試行すべてを生成したとは扱いません。保存できた後半フェーズでは `attempts/*/capture-source.json` にその時点のscript/helper SHAを記録しました。

製品ソース・教材・アーカイブは全取得を通じて同一です。最終スクリプトの再取得用の小さな待機・スクロール改善は構文検査済みですが、新たな初回一周をもう一度行ったとは数えていません。

提出用テキストログは端末のANSI制御文字と改行・行末空白を整えています。[原本の絶対パスとSHA](logs/log-normalization.json) に沿って元バイト列もローカル保持しています。`logs/*-START_HERE.md` は生成文書のコピーで、文中の相対パスは元の生成プロジェクトを基準に読みます。

公式参考: [Playwright Electron](https://playwright.dev/docs/api/class-electron)、[Trace Viewer](https://playwright.dev/docs/trace-viewer)、[FFmpeg x11grab](https://ffmpeg.org/ffmpeg-devices.html#x11grab)。実際の操作は導入済み1.64.1のCLI help・型定義とも照合しています。
