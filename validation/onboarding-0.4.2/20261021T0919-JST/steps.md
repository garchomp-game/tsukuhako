# 全試行の時系列

全行の実行場所はLinux Mint実ホストの専用Xephyr画面、操作はエージェントの自動操作です。端末内コマンドは表示中のホスト／Dev Container端末に入力しています。製品の状態をfixtureへ置き換えていません。初回試し撮りT01〜T04の失敗とT11〜T14の再試行も保持しています。

<a id="record-1"></a>

## 1. T01-app — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:21:13+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 撮影テスト：製品アプリ |
| 期待結果 | sandboxを無効化せず起動 |
| 実結果 | sandboxを無効化せず起動 |
| 画像 | [画像](<screenshots/T01-app.png>) |
| 動画 | trial-30s.mp4 **00:01.20**（[取得先](media-index.md)） |
| ログ | [steps.json](<steps.json>) |
<a id="record-2"></a>

## 2. T02-files — FAIL

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:21:23+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 撮影テスト：ファイル操作画面 |
| 期待結果 | この場面の対象画面・操作結果を確認できること |
| 実結果 | Nemoの起動完了前に撮影し、対象画面を取得できなかった。T12で再取得。 |
| 画像 | [画像](<screenshots/T02-files.png>) |
| 動画 | trial-30s.mp4 **00:11.00**（[取得先](media-index.md)） |
| ログ | [steps.json](<steps.json>) |

点検: 撮影時=PASS、分類=CAPTURE_SCRIPT。原記録との差分はreview.jsonを参照。
<a id="record-3"></a>

## 3. T03-code — FAIL

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:21:33+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 撮影テスト：VS Code |
| 期待結果 | この場面の対象画面・操作結果を確認できること |
| 実結果 | Codeの初回起動完了前に撮影。T13で再取得。 |
| 画像 | [画像](<screenshots/T03-code.png>) |
| 動画 | trial-30s.mp4 **00:21.27**（[取得先](media-index.md)） |
| ログ | [steps.json](<steps.json>) |

点検: 撮影時=PASS、分類=CAPTURE_SCRIPT。原記録との差分はreview.jsonを参照。
<a id="record-4"></a>

## 4. T04-browser — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:21:35+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 撮影テスト：ブラウザ |
| 期待結果 | 日本語が判読できる |
| 実結果 | 日本語が判読できる |
| 画像 | [画像](<screenshots/T04-browser.png>) |
| 動画 | trial-30s.mp4 **00:22.60**（[取得先](media-index.md)） |
| ログ | [steps.json](<steps.json>) |
<a id="record-5"></a>

## 5. T11-app — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:22:15+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 撮影再試行：アプリ |
| 期待結果 | 初期画面の文字を確認 |
| 実結果 | 初期画面の文字を確認 |
| 画像 | [画像](<screenshots/T11-app.png>) |
| 動画 | trial-retry-30s.mp4 **00:01.22**（[取得先](media-index.md)） |
| ログ | [steps.json](<steps.json>) |
<a id="record-6"></a>

## 6. T12-files — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:22:22+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 撮影再試行：Nemoへ切替 |
| 期待結果 | フォルダ画面を表示 |
| 実結果 | フォルダ画面を表示 |
| 画像 | [画像](<screenshots/T12-files.png>) |
| 動画 | trial-retry-30s.mp4 **00:08.05**（[取得先](media-index.md)） |
| ログ | [steps.json](<steps.json>) |
<a id="record-7"></a>

## 7. T13-code — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:22:29+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 撮影再試行：VS Codeへ切替 |
| 期待結果 | Codeの初期説明を表示 |
| 実結果 | Codeの初期説明を表示 |
| 画像 | [画像](<screenshots/T13-code.png>) |
| 動画 | trial-retry-30s.mp4 **00:14.89**（[取得先](media-index.md)） |
| ログ | [steps.json](<steps.json>) |
<a id="record-8"></a>

## 8. T14-browser — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:22:36+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 撮影再試行：ブラウザ |
| 期待結果 | 日本語の文字を表示 |
| 実結果 | 日本語の文字を表示 |
| 画像 | [画像](<screenshots/T14-browser.png>) |
| 動画 | trial-retry-30s.mp4 **00:22.02**（[取得先](media-index.md)） |
| ログ | [steps.json](<steps.json>) |
<a id="record-9"></a>

## 9. M01 — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:23:18+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 配布アーカイブをローカルコピーして確認 |
| 期待結果 | 0.4.2 / 123927962 bytes / SHA256 7946b0d7…一致 |
| 実結果 | 0.4.2 / 123927962 bytes / SHA256 7946b0d7…一致 |
| 画像 | [画像](<screenshots/M01.png>) |
| 動画 | F2-main.mp4 **00:01.22**（[取得先](media-index.md)） |
| ログ | [artifact.json](<artifact.json>) |
<a id="record-10"></a>

## 10. M02a — FAIL

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:23:21+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | Nemoで配布アーカイブの操作メニューを開く |
| 期待結果 | この場面の対象画面・操作結果を確認できること |
| 実結果 | 検索欄のメニューを開いてしまった。M02bでファイルのメニューを開き直した。 |
| 画像 | [画像](<screenshots/M02a.png>) |
| 動画 | F2-main.mp4 **00:04.29**（[取得先](media-index.md)） |
| ログ | [steps.json](<steps.json>) |

点検: 撮影時=PASS、分類=CAPTURE_SCRIPT。原記録との差分はreview.jsonを参照。
<a id="record-11"></a>

## 11. M02b — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:23:42+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | アーカイブを右クリック |
| 期待結果 | Nemoのファイル操作メニュー |
| 実結果 | Nemoのファイル操作メニュー |
| 画像 | [画像](<screenshots/M02b.png>) |
| 動画 | F2-main.mp4 **00:25.30**（[取得先](media-index.md)） |
| ログ | [logs/normal-launch.json](<logs/normal-launch.json>) |
<a id="record-12"></a>

## 12. M02 — FAIL

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:24:06+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | NemoのExtract Hereで展開し、実行ファイルを選択 |
| 期待結果 | この場面の対象画面・操作結果を確認できること |
| 実結果 | 展開後のパス入力で日本語が欠落し、実行ファイルの選択まで到達していない。M02d-retryで到達。 |
| 画像 | [画像](<screenshots/M02.png>) |
| 動画 | F2-main.mp4 **00:49.85**（[取得先](media-index.md)） |
| ログ | [steps.json](<steps.json>) |

点検: 撮影時=PASS、分類=CAPTURE_SCRIPT。原記録との差分はreview.jsonを参照。
<a id="record-13"></a>

## 13. M02c-input-failure — FAIL

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:24:44+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 撮影操作のパス入力を確認 |
| 期待結果 | この場面の対象画面・操作結果を確認できること |
| 実結果 | xdotool type が日本語のパス文字を入力できず、Nemoが存在しないパスを表示 |
| 画像 | [画像](<screenshots/M02c-input-failure.png>) |
| 動画 | F2-main.mp4 **01:27.83**（[取得先](media-index.md)） |
| ログ | [steps.json](<steps.json>) |
<a id="record-14"></a>

## 14. M02d-retry — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:24:46+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 表示された展開先フォルダをダブルクリック |
| 期待結果 | 実行ファイル tsukuhako を選択 |
| 実結果 | 実行ファイル tsukuhako を選択 |
| 画像 | [画像](<screenshots/M02d-retry.png>) |
| 動画 | F2-main.mp4 **01:29.69**（[取得先](media-index.md)） |
| ログ | [logs/normal-launch.json](<logs/normal-launch.json>) |
<a id="record-15"></a>

## 15. M03 — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:24:49+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | Nemoからtsukuhakoを通常ユーザーで実行 |
| 期待結果 | 初期画面。起動引数なし・sandbox無効化なし |
| 実結果 | 初期画面。起動引数なし・sandbox無効化なし |
| 画像 | [画像](<screenshots/M03.png>) |
| 動画 | F2-main.mp4 **01:32.77**（[取得先](media-index.md)） |
| ログ | [logs/normal-launch.json](<logs/normal-launch.json>) |
<a id="record-16"></a>

## 16. M03b-observation — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:26:01+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 通常起動を閉じ、観測用ポート付きで同じプロファイルを開く |
| 期待結果 | --remote-debugging-port=9430のみ追加。同一製品・同一プロファイル |
| 実結果 | --remote-debugging-port=9430のみ追加。同一製品・同一プロファイル |
| 画像 | [画像](<screenshots/M03b-observation.png>) |
| 動画 | F2-main.mp4 **02:44.42**（[取得先](media-index.md)） |
| ログ | [logs/normal-launch.json](<logs/normal-launch.json>) |
<a id="record-17"></a>

## 17. M04 — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:26:02+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 初期説明と実診断を見る |
| 期待結果 | Dockerは利用可能。新規のVS Code拡張領域ではDev Containersが設定不足 |
| 実結果 | Dockerは利用可能。新規のVS Code拡張領域ではDev Containersが設定不足 |
| 画像 | [画像](<screenshots/M04.png>) |
| 動画 | F2-main.mp4 **02:45.19**（[取得先](media-index.md)） |
| ログ | [environment.json](<environment.json>) |
<a id="record-18"></a>

## 18. E06a — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:26:02+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 専用の空の拡張領域で診断 |
| 期待結果 | Dev Containers拡張の設定不足を実検出。既存拡張のコピーなし |
| 実結果 | Dev Containers拡張の設定不足を実検出。既存拡張のコピーなし |
| 画像 | [画像](<screenshots/E06a.png>) |
| 動画 | F2-main.mp4 **02:46.00**（[取得先](media-index.md)） |
| ログ | [environment.json](<environment.json>) |
<a id="record-19"></a>

## 19. M05 — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:26:04+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | Linuxの準備教材を開く |
| 期待結果 | Docker公式手順、通常ユーザー権限、VS Code拡張、戻り先を表示 |
| 実結果 | Docker公式手順、通常ユーザー権限、VS Code拡張、戻り先を表示 |
| 画像 | [画像](<screenshots/M05.png>) |
| 動画 | F2-main.mp4 **02:47.13**（[取得先](media-index.md)） |
| ログ | [logs/main-app-capture.txt](<logs/main-app-capture.txt>) |
<a id="record-20"></a>

## 20. M06 — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:26:05+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 準備チェックへ戻り、もう一度確認 |
| 期待結果 | Linux / F2の選択を維持し実診断を更新 |
| 実結果 | Linux / F2の選択を維持し実診断を更新 |
| 画像 | [画像](<screenshots/M06.png>) |
| 動画 | F2-main.mp4 **02:48.78**（[取得先](media-index.md)） |
| ログ | [logs/main-app-capture.txt](<logs/main-app-capture.txt>) |
<a id="record-21"></a>

## 21. M07 — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:26:06+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 用途とF2の構成を確認 |
| 期待結果 | 画面を作る → Next.js / F2を選択 |
| 実結果 | 画面を作る → Next.js / F2を選択 |
| 画像 | [画像](<screenshots/M07.png>) |
| 動画 | F2-main.mp4 **02:49.56**（[取得先](media-index.md)） |
| ログ | [F2-project.json](<F2-project.json>) |
<a id="record-22"></a>

## 22. M08 — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:26:07+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 日本語と空白の保存先、未使用ポートを入力 |
| 期待結果 | 専用の新規フォルダとホストポートを指定 |
| 実結果 | 専用の新規フォルダとホストポートを指定 |
| 画像 | [画像](<screenshots/M08.png>) |
| 動画 | F2-main.mp4 **02:50.43**（[取得先](media-index.md)） |
| ログ | [F2-project.json](<F2-project.json>) |
<a id="record-23"></a>

## 23. M09a — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:26:08+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 作成前の確認へ進む |
| 期待結果 | 構成・保存先・ポートと診断結果を表示 |
| 実結果 | 構成・保存先・ポートと診断結果を表示 |
| 画像 | [画像](<screenshots/M09a.png>) |
| 動画 | F2-main.mp4 **02:52.00**（[取得先](media-index.md)） |
| ログ | [logs/main-app-capture.txt](<logs/main-app-capture.txt>) |
<a id="record-24"></a>

## 24. M09 — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:26:10+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 戻ってフォルダ名を修正し、再確認 |
| 期待結果 | 入力を保持して修正でき、まだ出力フォルダは存在しない |
| 実結果 | 入力を保持して修正でき、まだ出力フォルダは存在しない |
| 画像 | [画像](<screenshots/M09.png>) |
| 動画 | F2-main.mp4 **02:53.65**（[取得先](media-index.md)） |
| ログ | [logs/main-app-capture.txt](<logs/main-app-capture.txt>) |
<a id="record-25"></a>

## 25. M10 — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:26:11+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | プロジェクトを生成 |
| 期待結果 | 短時間の生成を動画と時刻付き状態変化で記録 |
| 実結果 | 短時間の生成を動画と時刻付き状態変化で記録 |
| 画像 | [画像](<screenshots/M10.png>) |
| 動画 | F2-main.mp4 **02:54.47**（[取得先](media-index.md)） |
| ログ | [logs/M10-generation.json](<logs/M10-generation.json>) |
<a id="record-26"></a>

## 26. M11 — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:26:12+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 生成完了と次の操作を確認 |
| 期待結果 | ファイル生成完了とコンテナ未起動を明示 |
| 実結果 | ファイル生成完了とコンテナ未起動を明示 |
| 画像 | [画像](<screenshots/M11.png>) |
| 動画 | F2-main.mp4 **02:55.23**（[取得先](media-index.md)） |
| ログ | [logs/main-app-capture.txt](<logs/main-app-capture.txt>) |
<a id="record-27"></a>

## 27. M12 — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:26:13+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | この生成結果の教材を読む |
| 期待結果 | 今回の保存先・版・ポートがSTART_HERE.mdと一致 |
| 実結果 | 今回の保存先・版・ポートがSTART_HERE.mdと一致 |
| 画像 | [画像](<screenshots/M12.png>) |
| 動画 | F2-main.mp4 **02:56.07**（[取得先](media-index.md)） |
| ログ | [logs/F2-START_HERE.md](<logs/F2-START_HERE.md>) |
<a id="record-28"></a>

## 28. M-app-capture-error — FAIL

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:26:44+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 撮影スクリプトの停止位置を保存 |
| 期待結果 | この場面の対象画面・操作結果を確認できること |
| 実結果 | Error: host terminal missing |
| 画像 | [画像](<screenshots/M-app-capture-error.png>) |
| 動画 | F2-main.mp4 **03:27.13**（[取得先](media-index.md)） |
| ログ | [steps.json](<steps.json>) |
<a id="record-29"></a>

## 29. M13a-terminal-retry-failure — FAIL

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:27:59+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 専用画面の端末起動を再確認 |
| 期待結果 | この場面の対象画面・操作結果を確認できること |
| 実結果 | 既に起動した専用DBus端末サーバーが元の画面設定を保持 |
| 画像 | [画像](<screenshots/M13a-terminal-retry-failure.png>) |
| 動画 | F2-main.mp4 **04:42.92**（[取得先](media-index.md)） |
| ログ | [steps.json](<steps.json>) |
<a id="record-30"></a>

## 30. M13 — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:28:04+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | ホストのターミナルで pwd と doctor-host.sh を実行 |
| 期待結果 | 生成先でDocker・設定・ポートのPASSを確認 |
| 実結果 | 生成先でDocker・設定・ポートのPASSを確認 |
| 画像 | [画像](<screenshots/M13.png>) |
| 動画 | F2-main.mp4 **04:47.68**（[取得先](media-index.md)） |
| ログ | [logs/M13-host-final.typescript](<logs/M13-host-final.typescript>) |
<a id="record-31"></a>

## 31. M14a — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:28:05+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | アプリの「VS Codeで開く」を押す |
| 期待結果 | 実際のCodeへ同じフォルダを渡す |
| 実結果 | 実際のCodeへ同じフォルダを渡す |
| 画像 | [画像](<screenshots/M14a.png>) |
| 動画 | F2-main.mp4 **04:48.66**（[取得先](media-index.md)） |
| ログ | [logs/code-invocations.log](<logs/code-invocations.log>) |
<a id="record-32"></a>

## 32. M14b — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:28:34+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 新規VS Codeプロファイルの初回画面を見る |
| 期待結果 | サインインを求める案内を表示 |
| 実結果 | サインインを求める案内を表示 |
| 画像 | [画像](<screenshots/M14b.png>) |
| 動画 | F2-main.mp4 **05:17.65**（[取得先](media-index.md)） |
| ログ | [logs/code-invocations.log](<logs/code-invocations.log>) |
<a id="record-33"></a>

## 33. M14c — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:28:55+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 生成したフォルダの信頼設定を見る |
| 期待結果 | 今回の試験用フォルダを確認してTrustを選択 |
| 実結果 | 今回の試験用フォルダを確認してTrustを選択 |
| 画像 | ローカル原本のみ（media-index参照） |
| 動画 | F2-main.mp4 **05:38.76**（[取得先](media-index.md)） |
| ログ | [logs/code-invocations.log](<logs/code-invocations.log>) |

点検: 撮影時=PASS、分類=OBSERVATION。信頼画面に既存の別フォルダのパスが表示されたため画像はローカル原本のみ。今回のフォルダを信頼した事実は保持し、提出用画像はM14a/M14b/E06以降を参照。
<a id="record-34"></a>

## 34. E06b — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:29:48+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 専用の拡張画面でDev Containersを検索 |
| 期待結果 | Installed 0からMicrosoft提供のDev Containersを検索 |
| 実結果 | Installed 0からMicrosoft提供のDev Containersを検索 |
| 画像 | [画像](<screenshots/E06b.png>) |
| 動画 | F2-main.mp4 **06:31.60**（[取得先](media-index.md)） |
| ログ | [logs/code-invocations.log](<logs/code-invocations.log>) |
<a id="record-35"></a>

## 35. E06c — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:29:50+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | MarketplaceのInstallを押す |
| 期待結果 | 実際に拡張を取得・導入する |
| 実結果 | 実際に拡張を取得・導入する |
| 画像 | [画像](<screenshots/E06c.png>) |
| 動画 | F2-main.mp4 **06:33.94**（[取得先](media-index.md)） |
| ログ | [logs/code-invocations.log](<logs/code-invocations.log>) |
<a id="record-36"></a>

## 36. E06 — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:30:06+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 拡張導入後にアプリへ戻って再確認 |
| 期待結果 | 同じF2・生成済みフォルダを保持し、Dev Containersが設定不足から利用可能へ変化 |
| 実結果 | 同じF2・生成済みフォルダを保持し、Dev Containersが設定不足から利用可能へ変化 |
| 画像 | [画像](<screenshots/E06.png>) |
| 動画 | F2-main.mp4 **06:49.74**（[取得先](media-index.md)） |
| ログ | [logs/main-app-capture.txt](<logs/main-app-capture.txt>) |
<a id="record-37"></a>

## 37. M15-command — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:30:42+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | コマンドパレットでReopen in Containerを選択 |
| 期待結果 | RebuildではなくReopen in Containerの行を選ぶ |
| 実結果 | RebuildではなくReopen in Containerの行を選ぶ |
| 画像 | [画像](<screenshots/M15-command.png>) |
| 動画 | F2-main.mp4 **07:25.64**（[取得先](media-index.md)） |
| ログ | [steps.json](<steps.json>) |
<a id="record-38"></a>

## 38. F2-code-capture-error — FAIL

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:30:58+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 接続撮影の失敗状態を保存 |
| 期待結果 | この場面の対象画面・操作結果を確認できること |
| 実結果 | TimeoutError: locator.click: Timeout 15000ms exceeded.<br>Call log:<br>  - waiting for locator('.quick-input-widget a').filter({ hasText: /^Dev Containers: Reopen in Container$/ })<br>    - locator resolved to &lt;a class="label-name"&gt;…&lt;/a&gt;<br>  - attempting click action<br>    2 × waiting for element to be visible, enabled and stable<br>      - element is visible, enabled and stable<br>      - scrolling into view if needed<br>      - done scrolling<br>      - &lt;p&gt;Open any folder or repository inside a Docker con…&lt;/p&gt; from &lt;div class="context-view monaco-component top left"&gt;…&lt;/div&gt; subtree intercepts pointer events<br>    - retrying click action<br>    - waiting 20ms<br>    2 × waiting for element to be visible, enabled and stable<br>      - element is visible, enabled and stable<br>      - scrolling into view if needed<br>      - done scrolling<br>      - &lt;p&gt;Open any folder or repository inside a Docker con…&lt;/p&gt; from &lt;div class="context-view monaco-component top left"&gt;…&lt;/div&gt; subtree intercepts pointer events<br>    - retrying click action<br>      - waiting 100ms<br>    28 × waiting for element to be visible, enabled and stable<br>       - element is visible, enabled and stable<br>       - scrolling into view if needed<br>       - done scrolling<br>       - &lt;p&gt;Open any folder or repository inside a Docker con…&lt;/p&gt; from &lt;div class="context-view monaco-component top left"&gt;…&lt;/div&gt; subtree intercepts pointer events<br>     - retrying click action<br>       - waiting 500ms<br> |
| 画像 | [画像](<screenshots/F2-code-capture-error.png>) |
| 動画 | F2-main.mp4 **07:41.46**（[取得先](media-index.md)） |
| ログ | [steps.json](<steps.json>) |
<a id="record-39"></a>

## 39. M15-command-02 — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:31:54+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | コマンドパレットでReopen in Containerを選択 |
| 期待結果 | RebuildではなくReopen in Containerの行を選ぶ |
| 実結果 | RebuildではなくReopen in Containerの行を選ぶ |
| 画像 | [画像](<screenshots/M15-command-02.png>) |
| 動画 | F2-main.mp4 **08:37.31**（[取得先](media-index.md)） |
| ログ | [logs/F2-postcreate-complete.txt](<logs/F2-postcreate-complete.txt>) |
<a id="record-40"></a>

## 40. M15-progress-02 — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:31:56+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 初回の接続・ビルドを待つ |
| 期待結果 | 既存Dockerキャッシュを保持し、新しいコンテナと依存領域を準備 |
| 実結果 | 既存Dockerキャッシュを保持し、新しいコンテナと依存領域を準備 |
| 画像 | [画像](<screenshots/M15-progress-02.png>) |
| 動画 | F2-main.mp4 **08:39.68**（[取得先](media-index.md)） |
| ログ | [logs/F2-postcreate-complete.txt](<logs/F2-postcreate-complete.txt>) |
<a id="record-41"></a>

## 41. M16 — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:32:09+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 接続表示とコンテナ内pwdを確認 |
| 期待結果 | Dev Container: ツクハコ F2 / /workspace |
| 実結果 | Dev Container: ツクハコ F2 / /workspace |
| 画像 | [画像](<screenshots/M16.png>) |
| 動画 | F2-main.mp4 **08:53.01**（[取得先](media-index.md)） |
| ログ | [logs/F2-connection.json](<logs/F2-connection.json>) |
<a id="record-42"></a>

## 42. E07-F2-early-dev — FAIL

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:32:35+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 接続表示直後にnpm run devを実行 |
| 期待結果 | この場面の対象画面・操作結果を確認できること |
| 実結果 | 初回の依存導入がまだ進行中で next: not found。Configuring...表示あり |
| 画像 | [画像](<screenshots/E07-F2-early-dev.png>) |
| 動画 | F2-main.mp4 **09:18.65**（[取得先](media-index.md)） |
| ログ | [logs/F2-terminal-ready.txt](<logs/F2-terminal-ready.txt>) |
<a id="record-43"></a>

## 43. M15-dependencies — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:32:50+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 初回構成のログを見る |
| 期待結果 | postCreateCommandでnpm ciが進行中 |
| 実結果 | 初回構成ログを表示した。npm ciの進行・完了をこの場面だけでは判定しない。完了メッセージはM15-postcreate。 |
| 画像 | [画像](<screenshots/M15-dependencies.png>) |
| 動画 | F2-main.mp4 **09:33.97**（[取得先](media-index.md)） |
| ログ | [steps.json](<steps.json>) |

点検: 撮影時=PASS、分類=OBSERVATION。原記録との差分はreview.jsonを参照。
<a id="record-44"></a>

## 44. E07-F2-recovered — FAIL

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:34:13+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 依存導入完了後に同じターミナルで再実行 |
| 期待結果 | この場面の対象画面・操作結果を確認できること |
| 実結果 | 非表示の端末入力先への操作でコマンドが実行されず、Ready未確認のまま暫定PASSを書いた。M17が実際の成功記録。 |
| 画像 | [画像](<screenshots/E07-F2-recovered.png>) |
| 動画 | F2-main.mp4 **10:56.38**（[取得先](media-index.md)） |
| ログ | [steps.json](<steps.json>) |

点検: 撮影時=PASS、分類=CAPTURE_SCRIPT。原記録との差分はreview.jsonを参照。
<a id="record-45"></a>

## 45. F2-code-capture-error-02 — FAIL

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:35:09+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 接続撮影の失敗状態を保存 |
| 期待結果 | この場面の対象画面・操作結果を確認できること |
| 実結果 | Error: expect(received).toBe(expected) // Object.is equality<br><br>Expected: 200<br>Received: 0<br><br>Call Log:<br>- Timeout 180000ms exceeded while waiting on the predicate |
| 画像 | [画像](<screenshots/F2-code-capture-error-02.png>) |
| 動画 | F2-main.mp4 **11:52.95**（[取得先](media-index.md)） |
| ログ | [steps.json](<steps.json>) |
<a id="record-46"></a>

## 46. F2-exercise-error — FAIL

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:35:27+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 編集・復元の失敗状態を記録 |
| 期待結果 | この場面の対象画面・操作結果を確認できること |
| 実結果 | Error: expect(locator).toContainText(expected) failed<br><br>Locator: locator('h1')<br>Timeout: 5000ms<br>- Expected substring  - 1<br>+ Received string     + 3<br><br>- 小さく変えて<br>+<br>+             このサイトにアクセスできません<br>+           <br><br>Call log:<br>  - Expect "toContainText" locator('h1') with timeout 5000ms<br>  - waiting for locator('h1')<br>    14 × locator resolved to &lt;h1&gt;…&lt;/h1&gt;<br>       - unexpected value "<br>            このサイトにアクセスできません<br>          "<br> |
| 画像 | [画像](<screenshots/F2-exercise-error.png>) |
| 動画 | F2-main.mp4 **12:10.79**（[取得先](media-index.md)） |
| ログ | [steps.json](<steps.json>) |
<a id="record-47"></a>

## 47. M17-input-retry — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:35:44+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 表示中の端末に通常のキーボード入力 |
| 期待結果 | 入力結果を確認 |
| 実結果 | 画面内の実端末への入力でNext.js Readyを確認。正式なHTTP確認・場面はM17。 |
| 画像 | [画像](<screenshots/M17-input-retry.png>) |
| 動画 | F2-main.mp4 **12:27.31**（[取得先](media-index.md)） |
| ログ | [steps.json](<steps.json>) |

点検: 撮影時=NOT_RUN、分類=CAPTURE_RECOVERY。原記録との差分はreview.jsonを参照。
<a id="record-48"></a>

## 48. E07-F2-recovered-02 — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:35:45+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 構成完了後に表示中のターミナルで再実行 |
| 期待結果 | Next.js Ready とHTTP 200。製品設定変更なし |
| 実結果 | Next.js Ready とHTTP 200。製品設定変更なし |
| 画像 | [画像](<screenshots/E07-F2-recovered-02.png>) |
| 動画 | F2-main.mp4 **12:28.36**（[取得先](media-index.md)） |
| ログ | [logs/F2-terminal-ready.txt](<logs/F2-terminal-ready.txt>) |
<a id="record-49"></a>

## 49. M17 — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:36:12+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 表示中のVS Code端末でnpm run dev |
| 期待結果 | ReadyとHTTP 200を確認。初回依存取得後に再実行 |
| 実結果 | ReadyとHTTP 200を確認。初回依存取得後に再実行 |
| 画像 | [画像](<screenshots/M17.png>) |
| 動画 | F2-main.mp4 **12:55.82**（[取得先](media-index.md)） |
| ログ | [logs/F2-terminal-ready.txt](<logs/F2-terminal-ready.txt>) |
<a id="record-50"></a>

## 50. M18 — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:36:27+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 教材のホスト側URLをブラウザで開く |
| 期待結果 | localhost:35409 にF2初期画面を表示 |
| 実結果 | localhost:35409 にF2初期画面を表示 |
| 画像 | [画像](<screenshots/M18.png>) |
| 動画 | F2-main.mp4 **13:10.14**（[取得先](media-index.md)） |
| ログ | [logs/F2-exercise.json](<logs/F2-exercise.json>) |
<a id="record-51"></a>

## 51. M19-editor — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:36:30+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | VS Codeで見出しを変更して保存 |
| 期待結果 | app/page.tsxのh1だけを変更 |
| 実結果 | app/page.tsxのh1だけを変更 |
| 画像 | [画像](<screenshots/M19-editor.png>) |
| 動画 | F2-main.mp4 **13:13.53**（[取得先](media-index.md)） |
| ログ | [logs/F2-exercise.json](<logs/F2-exercise.json>) |
<a id="record-52"></a>

## 52. M19 — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:36:31+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | ブラウザで変更を確認 |
| 期待結果 | 見出し「わたしの練習室」を表示 |
| 実結果 | 見出し「わたしの練習室」を表示 |
| 画像 | [画像](<screenshots/M19.png>) |
| 動画 | F2-main.mp4 **13:14.38**（[取得先](media-index.md)） |
| ログ | [logs/F2-exercise.json](<logs/F2-exercise.json>) |
<a id="record-53"></a>

## 53. M20-editor — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:36:34+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | VS Codeで元の見出しに戻して保存 |
| 期待結果 | 元ファイルとバイト単位で一致 |
| 実結果 | 元ファイルとバイト単位で一致 |
| 画像 | [画像](<screenshots/M20-editor.png>) |
| 動画 | F2-main.mp4 **13:17.14**（[取得先](media-index.md)） |
| ログ | [logs/F2-exercise.json](<logs/F2-exercise.json>) |
<a id="record-54"></a>

## 54. M20 — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:36:34+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | ブラウザで復元結果を確認 |
| 期待結果 | 元の見出しに戻り、元ファイルのSHA-256が一致 |
| 実結果 | 元の見出しに戻り、元ファイルのSHA-256が一致 |
| 画像 | [画像](<screenshots/M20.png>) |
| 動画 | F2-main.mp4 **13:17.95**（[取得先](media-index.md)） |
| ログ | [logs/F2-exercise.json](<logs/F2-exercise.json>) |
<a id="record-55"></a>

## 55. M21-F2 — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:37:19+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 生成F2からヘルプを3回押す |
| 期待結果 | F2の教材・戻り先・読書位置を保持 |
| 実結果 | F2の教材・戻り先・読書位置を保持 |
| 画像 | [画像](<screenshots/M21-F2.png>) |
| 動画 | F2-main.mp4 **14:02.57**（[取得先](media-index.md)） |
| ログ | [logs/F2-reading-capture.txt](<logs/F2-reading-capture.txt>) |
<a id="record-56"></a>

## 56. M21-S2 — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:37:22+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 学習S2からヘルプを3回押し、元の章へ戻る |
| 期待結果 | S2と元の読書位置を保持 |
| 実結果 | S2と元の読書位置を保持 |
| 画像 | [画像](<screenshots/M21-S2.png>) |
| 動画 | F2-main.mp4 **14:05.63**（[取得先](media-index.md)） |
| ログ | [logs/F2-reading-capture.txt](<logs/F2-reading-capture.txt>) |
<a id="record-57"></a>

## 57. M22-before — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:37:24+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | F2の読書位置を保存してアプリを終了 |
| 期待結果 | 今回の生成情報は再起動後に復元しない仕様 |
| 実結果 | 今回の生成情報は再起動後に復元しない仕様 |
| 画像 | [画像](<screenshots/M22-before.png>) |
| 動画 | F2-main.mp4 **14:07.14**（[取得先](media-index.md)） |
| ログ | [steps.json](<steps.json>) |
<a id="record-58"></a>

## 58. M22 — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:37:27+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | アプリを再起動 |
| 期待結果 | 読書位置を復元。F2は標準教材に戻り、生成情報は保存しない仕様どおり |
| 実結果 | 保存値0の読書位置と標準F2教材を復元。非ゼロ位置の保持はM22-scroll-before/restoredで別途確認。 |
| 画像 | [画像](<screenshots/M22.png>) |
| 動画 | F2-main.mp4 **14:10.07**（[取得先](media-index.md)） |
| ログ | [logs/M22-reading-nonzero.json](<logs/M22-reading-nonzero.json>) |

点検: 撮影時=PASS、分類=OBSERVATION。原記録との差分はreview.jsonを参照。
<a id="record-59"></a>

## 59. M22-resume — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:37:30+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | VS Codeで生成先START_HERE.mdを開いて再開 |
| 期待結果 | 保存済みファイルから今回の設定・起動手順を参照 |
| 実結果 | 保存済みファイルから今回の設定・起動手順を参照 |
| 画像 | [画像](<screenshots/M22-resume.png>) |
| 動画 | F2-main.mp4 **14:13.09**（[取得先](media-index.md)） |
| ログ | [logs/M22-reading-nonzero.json](<logs/M22-reading-nonzero.json>) |
<a id="record-60"></a>

## 60. M15-postcreate — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:37:51+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 初回の構成処理の完了を確認 |
| 期待結果 | npm ciとdoctorの結果を確認 |
| 実結果 | npm ciとdoctorの結果を確認 |
| 画像 | [画像](<screenshots/M15-postcreate.png>) |
| 動画 | F2-main.mp4 **14:34.74**（[取得先](media-index.md)） |
| ログ | [logs/F2-postcreate-complete.txt](<logs/F2-postcreate-complete.txt>) |
<a id="record-61"></a>

## 61. M22-scroll-before — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:38:22+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 本文を途中まで読んで終了 |
| 期待結果 | 420px付近の読書位置を保存 |
| 実結果 | 420px付近の読書位置を保存 |
| 画像 | [画像](<screenshots/M22-scroll-before.png>) |
| 動画 | F2-main.mp4 **15:05.27**（[取得先](media-index.md)） |
| ログ | [logs/M22-reading-nonzero.json](<logs/M22-reading-nonzero.json>) |
<a id="record-62"></a>

## 62. M22-scroll-restored — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:38:25+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 本文途中からのアプリ再開 |
| 期待結果 | F2標準教材と420pxの読書位置を復元 |
| 実結果 | F2標準教材と420pxの読書位置を復元 |
| 画像 | [画像](<screenshots/M22-scroll-restored.png>) |
| 動画 | F2-main.mp4 **15:08.12**（[取得先](media-index.md)） |
| ログ | [logs/M22-reading-nonzero.json](<logs/M22-reading-nonzero.json>) |
<a id="record-63"></a>

## 63. M23-stop — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:39:29+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | VS Codeを閉じ、ホストでcompose.sh stop |
| 期待結果 | このF2だけ停止。ソースとvolumeを保持 |
| 実結果 | このF2だけ停止。ソースとvolumeを保持 |
| 画像 | [画像](<screenshots/M23-stop.png>) |
| 動画 | F2-main.mp4 **16:12.08**（[取得先](media-index.md)） |
| ログ | [logs/F2-lifecycle.json](<logs/F2-lifecycle.json>) |
<a id="record-64"></a>

## 64. M23-reconnect-capture-failure — FAIL

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:40:22+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 再接続操作の停止位置を保存 |
| 期待結果 | この場面の対象画面・操作結果を確認できること |
| 実結果 | パレットの選択待ちがタイムアウト |
| 画像 | [画像](<screenshots/M23-reconnect-capture-failure.png>) |
| 動画 | F2-main.mp4 **17:05.81**（[取得先](media-index.md)） |
| ログ | [steps.json](<steps.json>) |
<a id="record-65"></a>

## 65. M23 — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:41:23+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 停止したF2へ再接続してnpm run dev |
| 期待結果 | 同じポートで初期画面に戻る。ファイルハッシュが一致 |
| 実結果 | 同じポートで初期画面に戻る。ファイルハッシュが一致 |
| 画像 | [画像](<screenshots/M23.png>) |
| 動画 | F2-main.mp4 **18:06.40**（[取得先](media-index.md)） |
| ログ | [logs/F2-lifecycle.json](<logs/F2-lifecycle.json>) |
<a id="record-66"></a>

## 66. E09-rebuild-start — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:41:24+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | コマンドパレットでRebuild Containerを実行 |
| 期待結果 | 通常の再接続と区別して再構築開始 |
| 実結果 | 通常の再接続と区別して再構築開始 |
| 画像 | [画像](<screenshots/E09-rebuild-start.png>) |
| 動画 | F2-main.mp4 **18:07.72**（[取得先](media-index.md)） |
| ログ | [logs/F2-lifecycle.json](<logs/F2-lifecycle.json>) |
<a id="record-67"></a>

## 67. E09-postcreate — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:41:36+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | Rebuild後の初期化処理の完了を待つ |
| 期待結果 | 依存復元とdoctorの準備完了を確認 |
| 実結果 | 依存復元とdoctorの準備完了を確認 |
| 画像 | [画像](<screenshots/E09-postcreate.png>) |
| 動画 | F2-main.mp4 **18:19.53**（[取得先](media-index.md)） |
| ログ | [logs/F2-lifecycle.json](<logs/F2-lifecycle.json>) |
<a id="record-68"></a>

## 68. E09 — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:41:40+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | Rebuild後に再起動して表示・保全を確認 |
| 期待結果 | コンテナIDは変更、ソースハッシュとvolume名は同じ |
| 実結果 | コンテナIDは変更、ソースハッシュとvolume名は同じ |
| 画像 | [画像](<screenshots/E09.png>) |
| 動画 | F2-main.mp4 **18:23.74**（[取得先](media-index.md)） |
| ログ | [logs/F2-exercise.json](<logs/F2-exercise.json>) |
<a id="record-69"></a>

## 69. F1-prepare — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:43:38+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 用途を選び実診断 |
| 期待結果 | 構成と前提ツールを確認 |
| 実結果 | 構成と前提ツールを確認 |
| 画像 | [画像](<screenshots/F1-prepare.png>) |
| 動画 | F1-main.mp4 **00:02.33**（[取得先](media-index.md)） |
| ログ | [attempts/F1-prepare-1792543415721/result.json](<attempts/F1-prepare-1792543415721/result.json>) |
<a id="record-70"></a>

## 70. F1-generated — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:43:40+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 配布アプリで新しいプロジェクトを生成 |
| 期待結果 | 今回のパス・版・ポートで生成 |
| 実結果 | 今回のパス・版・ポートで生成 |
| 画像 | [画像](<screenshots/F1-generated.png>) |
| 動画 | F1-main.mp4 **00:04.09**（[取得先](media-index.md)） |
| ログ | [attempts/F1-prepare-1792543415721/result.json](<attempts/F1-prepare-1792543415721/result.json>) |
<a id="record-71"></a>

## 71. F1-guide — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:43:41+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 生成したプロジェクトの教材を見る |
| 期待結果 | START_HERE.mdと一致 |
| 実結果 | START_HERE.mdと一致 |
| 画像 | [画像](<screenshots/F1-guide.png>) |
| 動画 | F1-main.mp4 **00:04.94**（[取得先](media-index.md)） |
| ログ | [attempts/F1-prepare-1792543415721/result.json](<attempts/F1-prepare-1792543415721/result.json>) |
<a id="record-72"></a>

## 72. F1-doctor — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:43:43+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | ホストで生成先と前提を確認 |
| 期待結果 | doctorが終了コード0 |
| 実結果 | doctorが終了コード0 |
| 画像 | [画像](<screenshots/F1-doctor.png>) |
| 動画 | F1-main.mp4 **00:06.81**（[取得先](media-index.md)） |
| ログ | [logs/F1-host.typescript](<logs/F1-host.typescript>) |
<a id="record-73"></a>

## 73. F1-open-code — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:43:44+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | アプリからVS Codeで開く |
| 期待結果 | この生成フォルダを実際のVS Codeへ渡す |
| 実結果 | この生成フォルダを実際のVS Codeへ渡す |
| 画像 | [画像](<screenshots/F1-open-code.png>) |
| 動画 | F1-main.mp4 **00:07.66**（[取得先](media-index.md)） |
| ログ | [attempts/F1-prepare-1792543415721/result.json](<attempts/F1-prepare-1792543415721/result.json>) |
<a id="record-74"></a>

## 74. F1-reopen — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:44:22+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | Reopen in Containerを選択 |
| 期待結果 | 既存キャッシュを保持し、今回のコンテナと依存領域を作成 |
| 実結果 | 既存キャッシュを保持し、今回のコンテナと依存領域を作成 |
| 画像 | [画像](<screenshots/F1-reopen.png>) |
| 動画 | F1-main.mp4 **00:45.71**（[取得先](media-index.md)） |
| ログ | [attempts/F1-connect-1792543459138/result.json](<attempts/F1-connect-1792543459138/result.json>) |
<a id="record-75"></a>

## 75. F1-postcreate — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:44:30+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 初回構成処理の完了を待つ |
| 期待結果 | postCreateCommandの成功結果を確認 |
| 実結果 | postCreateCommandの成功結果を確認 |
| 画像 | [画像](<screenshots/F1-postcreate.png>) |
| 動画 | F1-main.mp4 **00:54.35**（[取得先](media-index.md)） |
| ログ | [attempts/F1-connect-1792543459138/result.json](<attempts/F1-connect-1792543459138/result.json>) |
<a id="record-76"></a>

## 76. F1-server — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:44:34+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | VS Codeのコンテナ内端末で起動 |
| 期待結果 | /workspace と VITE / Local を確認 |
| 実結果 | /workspace と VITE / Local を確認 |
| 画像 | [画像](<screenshots/F1-server.png>) |
| 動画 | F1-main.mp4 **00:57.63**（[取得先](media-index.md)） |
| ログ | [attempts/F1-connect-1792543459138/result.json](<attempts/F1-connect-1792543459138/result.json>) |
<a id="record-77"></a>

## 77. F1-first — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:44:52+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 教材のホスト側URLで最初の成功を見る |
| 期待結果 | 対象構成の初期画面・応答を確認 |
| 実結果 | 対象構成の初期画面・応答を確認 |
| 画像 | [画像](<screenshots/F1-first.png>) |
| 動画 | F1-main.mp4 **01:16.02**（[取得先](media-index.md)） |
| ログ | [attempts/F1-exercise-1792543491250/result.json](<attempts/F1-exercise-1792543491250/result.json>) |
<a id="record-78"></a>

## 78. F1-input — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:44:53+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | Viteの入力を試す |
| 期待結果 | 入力と画面の表示が一致 |
| 実結果 | 入力と画面の表示が一致 |
| 画像 | [画像](<screenshots/F1-input.png>) |
| 動画 | F1-main.mp4 **01:16.83**（[取得先](media-index.md)） |
| ログ | [attempts/F1-exercise-1792543491250/result.json](<attempts/F1-exercise-1792543491250/result.json>) |
<a id="record-79"></a>

## 79. F1-editor-change — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:44:56+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | VS Codeで教材指定の一か所を変更して保存 |
| 期待結果 | src/App.tsx を変更 |
| 実結果 | src/App.tsx を変更 |
| 画像 | [画像](<screenshots/F1-editor-change.png>) |
| 動画 | F1-main.mp4 **01:20.33**（[取得先](media-index.md)） |
| ログ | [attempts/F1-exercise-1792543491250/result.json](<attempts/F1-exercise-1792543491250/result.json>) |
<a id="record-80"></a>

## 80. F1-changed — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:44:57+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | ブラウザで変更結果を確認 |
| 期待結果 | 入力ラベルが「今日のことば」に変わります。 |
| 実結果 | 入力ラベルが「今日のことば」に変わります。 |
| 画像 | [画像](<screenshots/F1-changed.png>) |
| 動画 | F1-main.mp4 **01:21.16**（[取得先](media-index.md)） |
| ログ | [attempts/F1-exercise-1792543491250/result.json](<attempts/F1-exercise-1792543491250/result.json>) |
<a id="record-81"></a>

## 81. F1-restored — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:45:00+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 元に戻して保存しブラウザで確認 |
| 期待結果 | 元の表示とソースSHA-256が一致 |
| 実結果 | 元の表示とソースSHA-256が一致 |
| 画像 | [画像](<screenshots/F1-restored.png>) |
| 動画 | F1-main.mp4 **01:23.93**（[取得先](media-index.md)） |
| ログ | [attempts/F1-exercise-1792543491250/result.json](<attempts/F1-exercise-1792543491250/result.json>) |
<a id="record-82"></a>

## 82. F1-stop — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:45:04+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 試験プロジェクトを通常停止 |
| 期待結果 | ソースと必要なvolumeを削除せず保持 |
| 実結果 | ソースと必要なvolumeを削除せず保持 |
| 画像 | [画像](<screenshots/F1-stop.png>) |
| 動画 | F1-main.mp4 **01:27.72**（[取得先](media-index.md)） |
| ログ | [attempts/F1-stop-1792543501131/result.json](<attempts/F1-stop-1792543501131/result.json>) |
<a id="record-83"></a>

## 83. B1-prepare — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:45:07+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 用途を選び実診断 |
| 期待結果 | 構成と前提ツールを確認 |
| 実結果 | 構成と前提ツールを確認 |
| 画像 | [画像](<screenshots/B1-prepare.png>) |
| 動画 | B1-main.mp4 **00:02.32**（[取得先](media-index.md)） |
| ログ | [attempts/B1-prepare-1792543504757/result.json](<attempts/B1-prepare-1792543504757/result.json>) |
<a id="record-84"></a>

## 84. B1-generated — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:45:09+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 配布アプリで新しいプロジェクトを生成 |
| 期待結果 | 今回のパス・版・ポートで生成 |
| 実結果 | 今回のパス・版・ポートで生成 |
| 画像 | [画像](<screenshots/B1-generated.png>) |
| 動画 | B1-main.mp4 **00:04.11**（[取得先](media-index.md)） |
| ログ | [attempts/B1-prepare-1792543504757/result.json](<attempts/B1-prepare-1792543504757/result.json>) |
<a id="record-85"></a>

## 85. B1-guide — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:45:10+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 生成したプロジェクトの教材を見る |
| 期待結果 | START_HERE.mdと一致 |
| 実結果 | START_HERE.mdと一致 |
| 画像 | [画像](<screenshots/B1-guide.png>) |
| 動画 | B1-main.mp4 **00:04.93**（[取得先](media-index.md)） |
| ログ | [attempts/B1-prepare-1792543504757/result.json](<attempts/B1-prepare-1792543504757/result.json>) |
<a id="record-86"></a>

## 86. B1-doctor — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:45:12+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | ホストで生成先と前提を確認 |
| 期待結果 | doctorが終了コード0 |
| 実結果 | doctorが終了コード0 |
| 画像 | [画像](<screenshots/B1-doctor.png>) |
| 動画 | B1-main.mp4 **00:06.78**（[取得先](media-index.md)） |
| ログ | [logs/B1-host.typescript](<logs/B1-host.typescript>) |
<a id="record-87"></a>

## 87. B1-open-code — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:45:13+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | アプリからVS Codeで開く |
| 期待結果 | この生成フォルダを実際のVS Codeへ渡す |
| 実結果 | この生成フォルダを実際のVS Codeへ渡す |
| 画像 | [画像](<screenshots/B1-open-code.png>) |
| 動画 | B1-main.mp4 **00:07.63**（[取得先](media-index.md)） |
| ログ | [attempts/B1-prepare-1792543504757/result.json](<attempts/B1-prepare-1792543504757/result.json>) |
<a id="record-88"></a>

## 88. B1-reopen — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:45:46+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | Reopen in Containerを選択 |
| 期待結果 | 既存キャッシュを保持し、今回のコンテナと依存領域を作成 |
| 実結果 | 既存キャッシュを保持し、今回のコンテナと依存領域を作成 |
| 画像 | [画像](<attempts/B1-connect-1792543543548/screenshots/B1-reopen.png>) |
| 動画 | B1-main.mp4 **00:41.07**（[取得先](media-index.md)） |
| ログ | [attempts/B1-connect-1792543543548/result.json](<attempts/B1-connect-1792543543548/result.json>) |
<a id="record-89"></a>

## 89. B1-postcreate — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:46:01+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 初回構成処理の完了を待つ |
| 期待結果 | postCreateCommandの成功結果を確認 |
| 実結果 | postCreateCommandの成功結果を確認 |
| 画像 | [画像](<attempts/B1-connect-1792543543548/screenshots/B1-postcreate.png>) |
| 動画 | B1-main.mp4 **00:55.84**（[取得先](media-index.md)） |
| ログ | [attempts/B1-connect-1792543543548/result.json](<attempts/B1-connect-1792543543548/result.json>) |
<a id="record-90"></a>

## 90. B1-server — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:46:04+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | VS Codeのコンテナ内端末で起動 |
| 期待結果 | /workspace と Next.js Ready を確認 |
| 実結果 | /workspace と Next.js Ready を確認 |
| 画像 | [画像](<attempts/B1-connect-1792543543548/screenshots/B1-server.png>) |
| 動画 | B1-main.mp4 **00:59.38**（[取得先](media-index.md)） |
| ログ | [attempts/B1-connect-1792543543548/result.json](<attempts/B1-connect-1792543543548/result.json>) |
<a id="record-91"></a>

## 91. B1-first — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:46:41+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 教材のホスト側URLで最初の成功を見る |
| 期待結果 | 対象構成の初期画面・応答を確認 |
| 実結果 | 対象構成の初期画面・応答を確認 |
| 画像 | [画像](<attempts/B1-exercise-1792543600584/screenshots/B1-first.png>) |
| 動画 | B1-main.mp4 **01:36.03**（[取得先](media-index.md)） |
| ログ | [attempts/B1-exercise-1792543600584/result.json](<attempts/B1-exercise-1792543600584/result.json>) |
<a id="record-92"></a>

## 92. B1-editor-change — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:46:44+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | VS Codeで教材指定の一か所を変更して保存 |
| 期待結果 | app/api/health/route.ts を変更 |
| 実結果 | app/api/health/route.ts を変更 |
| 画像 | [画像](<attempts/B1-exercise-1792543600584/screenshots/B1-editor-change.png>) |
| 動画 | B1-main.mp4 **01:39.18**（[取得先](media-index.md)） |
| ログ | [attempts/B1-exercise-1792543600584/result.json](<attempts/B1-exercise-1792543600584/result.json>) |
<a id="record-93"></a>

## 93. B1-changed — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:46:45+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | ブラウザで変更結果を確認 |
| 期待結果 | JSONに lesson: "preview" が増えます。 |
| 実結果 | JSONに lesson: "preview" が増えます。 |
| 画像 | [画像](<attempts/B1-exercise-1792543600584/screenshots/B1-changed.png>) |
| 動画 | B1-main.mp4 **01:40.09**（[取得先](media-index.md)） |
| ログ | [attempts/B1-exercise-1792543600584/result.json](<attempts/B1-exercise-1792543600584/result.json>) |
<a id="record-94"></a>

## 94. B1-curl-changed — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:46:47+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | ホストのcurlでAPIを再取得 |
| 期待結果 | JSONにlesson: previewが増える |
| 実結果 | JSONにlesson: previewが増える |
| 画像 | [画像](<attempts/B1-exercise-1792543600584/screenshots/B1-curl-changed.png>) |
| 動画 | B1-main.mp4 **01:42.12**（[取得先](media-index.md)） |
| ログ | [attempts/B1-exercise-1792543600584/result.json](<attempts/B1-exercise-1792543600584/result.json>) |
<a id="record-95"></a>

## 95. B1-restored — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:46:50+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 元に戻して保存しブラウザで確認 |
| 期待結果 | 元の表示とソースSHA-256が一致 |
| 実結果 | 元の表示とソースSHA-256が一致 |
| 画像 | [画像](<attempts/B1-exercise-1792543600584/screenshots/B1-restored.png>) |
| 動画 | B1-main.mp4 **01:44.92**（[取得先](media-index.md)） |
| ログ | [attempts/B1-exercise-1792543600584/result.json](<attempts/B1-exercise-1792543600584/result.json>) |
<a id="record-96"></a>

## 96. B1-curl-restored — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:46:52+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 復元後のAPIをホストから再取得 |
| 期待結果 | JSONがstatus: okのみへ戻る |
| 実結果 | JSONがstatus: okのみへ戻る |
| 画像 | [画像](<attempts/B1-exercise-1792543600584/screenshots/B1-curl-restored.png>) |
| 動画 | B1-main.mp4 **01:46.94**（[取得先](media-index.md)） |
| ログ | [attempts/B1-exercise-1792543600584/result.json](<attempts/B1-exercise-1792543600584/result.json>) |
<a id="record-97"></a>

## 97. B1-stop — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:46:56+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 試験プロジェクトを通常停止 |
| 期待結果 | ソースと必要なvolumeを削除せず保持 |
| 実結果 | ソースと必要なvolumeを削除せず保持 |
| 画像 | [画像](<attempts/B1-stop-1792543613098/screenshots/B1-stop.png>) |
| 動画 | B1-main.mp4 **01:50.57**（[取得先](media-index.md)） |
| ログ | [attempts/B1-stop-1792543613098/result.json](<attempts/B1-stop-1792543613098/result.json>) |
<a id="record-98"></a>

## 98. S1-prepare — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:46:59+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 用途を選び実診断 |
| 期待結果 | 構成と前提ツールを確認 |
| 実結果 | 構成と前提ツールを確認 |
| 画像 | [画像](<attempts/S1-prepare-1792543616659/screenshots/S1-prepare.png>) |
| 動画 | S1-main.mp4 **00:02.33**（[取得先](media-index.md)） |
| ログ | [attempts/S1-prepare-1792543616659/result.json](<attempts/S1-prepare-1792543616659/result.json>) |
<a id="record-99"></a>

## 99. S1-generated — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:47:01+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 配布アプリで新しいプロジェクトを生成 |
| 期待結果 | 今回のパス・版・ポートで生成 |
| 実結果 | 今回のパス・版・ポートで生成 |
| 画像 | [画像](<attempts/S1-prepare-1792543616659/screenshots/S1-generated.png>) |
| 動画 | S1-main.mp4 **00:04.13**（[取得先](media-index.md)） |
| ログ | [attempts/S1-prepare-1792543616659/result.json](<attempts/S1-prepare-1792543616659/result.json>) |
<a id="record-100"></a>

## 100. S1-guide — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:47:02+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 生成したプロジェクトの教材を見る |
| 期待結果 | START_HERE.mdと一致 |
| 実結果 | START_HERE.mdと一致 |
| 画像 | [画像](<attempts/S1-prepare-1792543616659/screenshots/S1-guide.png>) |
| 動画 | S1-main.mp4 **00:04.96**（[取得先](media-index.md)） |
| ログ | [attempts/S1-prepare-1792543616659/result.json](<attempts/S1-prepare-1792543616659/result.json>) |
<a id="record-101"></a>

## 101. S1-doctor — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:47:04+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | ホストで生成先と前提を確認 |
| 期待結果 | doctorが終了コード0 |
| 実結果 | doctorが終了コード0 |
| 画像 | [画像](<attempts/S1-prepare-1792543616659/screenshots/S1-doctor.png>) |
| 動画 | S1-main.mp4 **00:06.79**（[取得先](media-index.md)） |
| ログ | [logs/S1-host.typescript](<logs/S1-host.typescript>) |
<a id="record-102"></a>

## 102. S1-open-code — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:47:05+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | アプリからVS Codeで開く |
| 期待結果 | この生成フォルダを実際のVS Codeへ渡す |
| 実結果 | この生成フォルダを実際のVS Codeへ渡す |
| 画像 | [画像](<attempts/S1-prepare-1792543616659/screenshots/S1-open-code.png>) |
| 動画 | S1-main.mp4 **00:07.64**（[取得先](media-index.md)） |
| ログ | [attempts/S1-prepare-1792543616659/result.json](<attempts/S1-prepare-1792543616659/result.json>) |
<a id="record-103"></a>

## 103. S1-reopen — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:47:38+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | Reopen in Containerを選択 |
| 期待結果 | 既存キャッシュを保持し、今回のコンテナと依存領域を作成 |
| 実結果 | 既存キャッシュを保持し、今回のコンテナと依存領域を作成 |
| 画像 | [画像](<attempts/S1-connect-1792543655461/screenshots/S1-reopen.png>) |
| 動画 | S1-main.mp4 **00:41.11**（[取得先](media-index.md)） |
| ログ | [attempts/S1-connect-1792543655461/result.json](<attempts/S1-connect-1792543655461/result.json>) |
<a id="record-104"></a>

## 104. S1-postcreate — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:47:54+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 初回構成処理の完了を待つ |
| 期待結果 | postCreateCommandの成功結果を確認 |
| 実結果 | postCreateCommandの成功結果を確認 |
| 画像 | [画像](<attempts/S1-connect-1792543655461/screenshots/S1-postcreate.png>) |
| 動画 | S1-main.mp4 **00:56.80**（[取得先](media-index.md)） |
| ログ | [attempts/S1-connect-1792543655461/result.json](<attempts/S1-connect-1792543655461/result.json>) |
<a id="record-105"></a>

## 105. S1-server — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:47:59+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | VS Codeのコンテナ内端末で起動 |
| 期待結果 | /workspace と Next.js Ready を確認 |
| 実結果 | /workspace と Next.js Ready を確認 |
| 画像 | [画像](<attempts/S1-connect-1792543655461/screenshots/S1-server.png>) |
| 動画 | S1-main.mp4 **01:01.64**（[取得先](media-index.md)） |
| ログ | [attempts/S1-connect-1792543655461/result.json](<attempts/S1-connect-1792543655461/result.json>) |
<a id="record-106"></a>

## 106. S1-first — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:48:42+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 教材のホスト側URLで最初の成功を見る |
| 期待結果 | 対象構成の初期画面・応答を確認 |
| 実結果 | 対象構成の初期画面・応答を確認 |
| 画像 | [画像](<attempts/S1-exercise-1792543721404/screenshots/S1-first.png>) |
| 動画 | S1-main.mp4 **01:45.54**（[取得先](media-index.md)） |
| ログ | [attempts/S1-exercise-1792543721404/result.json](<attempts/S1-exercise-1792543721404/result.json>) |
<a id="record-107"></a>

## 107. S1-api — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:48:44+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 練習画面からAPIへ送信 |
| 期待結果 | 空白を除いたことばと5コードポイントを表示 |
| 実結果 | 空白を除いたことばと5コードポイントを表示 |
| 画像 | [画像](<attempts/S1-exercise-1792543721404/screenshots/S1-api.png>) |
| 動画 | S1-main.mp4 **01:46.60**（[取得先](media-index.md)） |
| ログ | [attempts/S1-exercise-1792543721404/result.json](<attempts/S1-exercise-1792543721404/result.json>) |
<a id="record-108"></a>

## 108. S1-editor-change — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:48:47+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | VS Codeで教材指定の一か所を変更して保存 |
| 期待結果 | app/practice/page.tsx を変更 |
| 実結果 | app/practice/page.tsx を変更 |
| 画像 | [画像](<attempts/S1-exercise-1792543721404/screenshots/S1-editor-change.png>) |
| 動画 | S1-main.mp4 **01:49.84**（[取得先](media-index.md)） |
| ログ | [attempts/S1-exercise-1792543721404/result.json](<attempts/S1-exercise-1792543721404/result.json>) |
<a id="record-109"></a>

## 109. S1-changed — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:48:48+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | ブラウザで変更結果を確認 |
| 期待結果 | /practiceの見出しが「今日の便り」に変わります。 |
| 実結果 | /practiceの見出しが「今日の便り」に変わります。 |
| 画像 | [画像](<attempts/S1-exercise-1792543721404/screenshots/S1-changed.png>) |
| 動画 | S1-main.mp4 **01:50.68**（[取得先](media-index.md)） |
| ログ | [attempts/S1-exercise-1792543721404/result.json](<attempts/S1-exercise-1792543721404/result.json>) |
<a id="record-110"></a>

## 110. S1-restored — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:48:50+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 元に戻して保存しブラウザで確認 |
| 期待結果 | 元の表示とソースSHA-256が一致 |
| 実結果 | 元の表示とソースSHA-256が一致 |
| 画像 | [画像](<attempts/S1-exercise-1792543721404/screenshots/S1-restored.png>) |
| 動画 | S1-main.mp4 **01:53.43**（[取得先](media-index.md)） |
| ログ | [attempts/S1-exercise-1792543721404/result.json](<attempts/S1-exercise-1792543721404/result.json>) |
<a id="record-111"></a>

## 111. S1-stop — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:48:55+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 試験プロジェクトを通常停止 |
| 期待結果 | ソースと必要なvolumeを削除せず保持 |
| 実結果 | ソースと必要なvolumeを削除せず保持 |
| 画像 | [画像](<attempts/S1-stop-1792543731577/screenshots/S1-stop.png>) |
| 動画 | S1-main.mp4 **01:57.72**（[取得先](media-index.md)） |
| ログ | [attempts/S1-stop-1792543731577/result.json](<attempts/S1-stop-1792543731577/result.json>) |
<a id="record-112"></a>

## 112. S2-prepare — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:48:58+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 用途を選び実診断 |
| 期待結果 | 構成と前提ツールを確認 |
| 実結果 | 構成と前提ツールを確認 |
| 画像 | [画像](<attempts/S2-prepare-1792543735703/screenshots/S2-prepare.png>) |
| 動画 | S2-main.mp4 **00:02.34**（[取得先](media-index.md)） |
| ログ | [attempts/S2-prepare-1792543735703/result.json](<attempts/S2-prepare-1792543735703/result.json>) |
<a id="record-113"></a>

## 113. S2-generated — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:49:00+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 配布アプリで新しいプロジェクトを生成 |
| 期待結果 | 今回のパス・版・ポートで生成 |
| 実結果 | 今回のパス・版・ポートで生成 |
| 画像 | [画像](<attempts/S2-prepare-1792543735703/screenshots/S2-generated.png>) |
| 動画 | S2-main.mp4 **00:04.11**（[取得先](media-index.md)） |
| ログ | [attempts/S2-prepare-1792543735703/result.json](<attempts/S2-prepare-1792543735703/result.json>) |
<a id="record-114"></a>

## 114. S2-guide — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:49:01+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 生成したプロジェクトの教材を見る |
| 期待結果 | START_HERE.mdと一致 |
| 実結果 | START_HERE.mdと一致 |
| 画像 | [画像](<attempts/S2-prepare-1792543735703/screenshots/S2-guide.png>) |
| 動画 | S2-main.mp4 **00:04.92**（[取得先](media-index.md)） |
| ログ | [attempts/S2-prepare-1792543735703/result.json](<attempts/S2-prepare-1792543735703/result.json>) |
<a id="record-115"></a>

## 115. S2-doctor — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:49:03+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | ホストで生成先と前提を確認 |
| 期待結果 | doctorが終了コード0 |
| 実結果 | doctorが終了コード0 |
| 画像 | [画像](<attempts/S2-prepare-1792543735703/screenshots/S2-doctor.png>) |
| 動画 | S2-main.mp4 **00:07.05**（[取得先](media-index.md)） |
| ログ | [logs/S2-host.typescript](<logs/S2-host.typescript>) |
<a id="record-116"></a>

## 116. S2-db-start — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:49:06+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | S2のホストでローカルSupabaseを起動 |
| 期待結果 | 固定版CLIの取得・DB起動を待つ |
| 実結果 | 固定版CLIの取得・DB起動を待つ |
| 画像 | [画像](<attempts/S2-prepare-1792543735703/screenshots/S2-db-start.png>) |
| 動画 | S2-main.mp4 **00:09.75**（[取得先](media-index.md)） |
| ログ | [attempts/S2-prepare-1792543735703/result.json](<attempts/S2-prepare-1792543735703/result.json>) |
<a id="record-117"></a>

## 117. S2-db-ready — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:49:39+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | Supabaseの準備完了を確認 |
| 期待結果 | API・DB・Studioが起動し、初回migrationとseedを適用 |
| 実結果 | API・DB・Studioが起動し、初回migrationとseedを適用 |
| 画像 | [画像](<attempts/S2-prepare-1792543735703/screenshots/S2-db-ready.png>) |
| 動画 | S2-main.mp4 **00:43.04**（[取得先](media-index.md)） |
| ログ | [logs/S2-host.typescript](<logs/S2-host.typescript>) |
<a id="record-118"></a>

## 118. S2-open-code — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:49:40+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | アプリからVS Codeで開く |
| 期待結果 | この生成フォルダを実際のVS Codeへ渡す |
| 実結果 | この生成フォルダを実際のVS Codeへ渡す |
| 画像 | [画像](<attempts/S2-prepare-1792543735703/screenshots/S2-open-code.png>) |
| 動画 | S2-main.mp4 **00:43.89**（[取得先](media-index.md)） |
| ログ | [attempts/S2-prepare-1792543735703/result.json](<attempts/S2-prepare-1792543735703/result.json>) |
<a id="record-119"></a>

## 119. S2-reopen — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:50:13+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | Reopen in Containerを選択 |
| 期待結果 | 既存キャッシュを保持し、今回のコンテナと依存領域を作成 |
| 実結果 | 既存キャッシュを保持し、今回のコンテナと依存領域を作成 |
| 画像 | [画像](<attempts/S2-connect-1792543810750/screenshots/S2-reopen.png>) |
| 動画 | S2-main.mp4 **01:17.36**（[取得先](media-index.md)） |
| ログ | [attempts/S2-connect-1792543810750/result.json](<attempts/S2-connect-1792543810750/result.json>) |
<a id="record-120"></a>

## 120. S2-postcreate — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:50:28+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 初回構成処理の完了を待つ |
| 期待結果 | postCreateCommandの成功結果を確認 |
| 実結果 | postCreateCommandの成功結果を確認 |
| 画像 | [画像](<attempts/S2-connect-1792543810750/screenshots/S2-postcreate.png>) |
| 動画 | S2-main.mp4 **01:32.49**（[取得先](media-index.md)） |
| ログ | [attempts/S2-connect-1792543810750/result.json](<attempts/S2-connect-1792543810750/result.json>) |
<a id="record-121"></a>

## 121. S2-server — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:50:33+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | VS Codeのコンテナ内端末で起動 |
| 期待結果 | /workspace と Next.js Ready を確認 |
| 実結果 | /workspace と Next.js Ready を確認 |
| 画像 | [画像](<attempts/S2-connect-1792543810750/screenshots/S2-server.png>) |
| 動画 | S2-main.mp4 **01:37.22**（[取得先](media-index.md)） |
| ログ | [attempts/S2-connect-1792543810750/result.json](<attempts/S2-connect-1792543810750/result.json>) |
<a id="record-122"></a>

## 122. S2-first — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:50:45+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 教材のホスト側URLで最初の成功を見る |
| 期待結果 | 対象構成の初期画面・応答を確認 |
| 実結果 | 対象構成の初期画面・応答を確認 |
| 画像 | [画像](<attempts/S2-exercise-1792543844037/screenshots/S2-first.png>) |
| 動画 | S2-main.mp4 **01:48.84**（[取得先](media-index.md)） |
| ログ | [attempts/S2-exercise-1792543844037/result.json](<attempts/S2-exercise-1792543844037/result.json>) |
<a id="record-123"></a>

## 123. S2-database — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:50:46+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | メモを保存して画面を再読込 |
| 期待結果 | 実DBに保存され、再読込後も架空メモが残る |
| 実結果 | 実DBに保存され、再読込後も架空メモが残る |
| 画像 | [画像](<attempts/S2-exercise-1792543844037/screenshots/S2-database.png>) |
| 動画 | S2-main.mp4 **01:49.90**（[取得先](media-index.md)） |
| ログ | [attempts/S2-exercise-1792543844037/result.json](<attempts/S2-exercise-1792543844037/result.json>) |
<a id="record-124"></a>

## 124. S2-database-edit — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:50:48+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 保存した架空メモを編集 |
| 期待結果 | 実DBの更新結果を表示。停止後の保全確認用に保持 |
| 実結果 | 実DBの更新結果を表示。停止後の保全確認用に保持 |
| 画像 | [画像](<attempts/S2-exercise-1792543844037/screenshots/S2-database-edit.png>) |
| 動画 | S2-main.mp4 **01:51.54**（[取得先](media-index.md)） |
| ログ | [attempts/S2-exercise-1792543844037/result.json](<attempts/S2-exercise-1792543844037/result.json>) |
<a id="record-125"></a>

## 125. S2-editor-change — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:50:51+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | VS Codeで教材指定の一か所を変更して保存 |
| 期待結果 | app/page.tsx を変更 |
| 実結果 | app/page.tsx を変更 |
| 画像 | [画像](<attempts/S2-exercise-1792543844037/screenshots/S2-editor-change.png>) |
| 動画 | S2-main.mp4 **01:54.75**（[取得先](media-index.md)） |
| ログ | [attempts/S2-exercise-1792543844037/result.json](<attempts/S2-exercise-1792543844037/result.json>) |
<a id="record-126"></a>

## 126. S2-changed — FAIL

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:50:52+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | ブラウザで変更結果を確認 |
| 期待結果 | この場面の対象画面・操作結果を確認できること |
| 実結果 | DOMでは変更後見出しを確認したが、ブラウザがメモ一覧までスクロールされていた。S2-heading-changedで補足。 |
| 画像 | [画像](<attempts/S2-exercise-1792543844037/screenshots/S2-changed.png>) |
| 動画 | S2-main.mp4 **01:55.59**（[取得先](media-index.md)） |
| ログ | [attempts/S2-exercise-1792543844037/result.json](<attempts/S2-exercise-1792543844037/result.json>) |

点検: 撮影時=PASS、分類=CAPTURE_FRAMING。原記録との差分はreview.jsonを参照。
<a id="record-127"></a>

## 127. S2-restored — FAIL

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:50:54+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 元に戻して保存しブラウザで確認 |
| 期待結果 | この場面の対象画面・操作結果を確認できること |
| 実結果 | 元のDOM見出しとファイルハッシュは一致したが、画像では見出しが画面外。S2-heading-restoredで補足。 |
| 画像 | [画像](<attempts/S2-exercise-1792543844037/screenshots/S2-restored.png>) |
| 動画 | S2-main.mp4 **01:58.31**（[取得先](media-index.md)） |
| ログ | [attempts/S2-exercise-1792543844037/result.json](<attempts/S2-exercise-1792543844037/result.json>) |

点検: 撮影時=PASS、分類=CAPTURE_FRAMING。原記録との差分はreview.jsonを参照。
<a id="record-128"></a>

## 128. S2-stop — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:51:02+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 試験プロジェクトを通常停止 |
| 期待結果 | ソースと必要なvolumeを削除せず保持 |
| 実結果 | ソースと必要なvolumeを削除せず保持 |
| 画像 | [画像](<attempts/S2-stop-1792543855527/screenshots/S2-stop.png>) |
| 動画 | S2-main.mp4 **02:05.97**（[取得先](media-index.md)） |
| ログ | [attempts/S2-stop-1792543855527/result.json](<attempts/S2-stop-1792543855527/result.json>) |
<a id="record-129"></a>

## 129. I1-prepare — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:51:06+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 用途を選び実診断 |
| 期待結果 | 構成と前提ツールを確認 |
| 実結果 | 構成と前提ツールを確認 |
| 画像 | [画像](<attempts/I1-prepare-1792543862993/screenshots/I1-prepare.png>) |
| 動画 | I1-main.mp4 **00:02.31**（[取得先](media-index.md)） |
| ログ | [attempts/I1-prepare-1792543862993/result.json](<attempts/I1-prepare-1792543862993/result.json>) |
<a id="record-130"></a>

## 130. I1-generated — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:51:07+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 配布アプリで新しいプロジェクトを生成 |
| 期待結果 | 今回のパス・版・ポートで生成 |
| 実結果 | 今回のパス・版・ポートで生成 |
| 画像 | [画像](<attempts/I1-prepare-1792543862993/screenshots/I1-generated.png>) |
| 動画 | I1-main.mp4 **00:04.05**（[取得先](media-index.md)） |
| ログ | [attempts/I1-prepare-1792543862993/result.json](<attempts/I1-prepare-1792543862993/result.json>) |
<a id="record-131"></a>

## 131. I1-guide — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:51:08+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 生成したプロジェクトの教材を見る |
| 期待結果 | START_HERE.mdと一致 |
| 実結果 | START_HERE.mdと一致 |
| 画像 | [画像](<attempts/I1-prepare-1792543862993/screenshots/I1-guide.png>) |
| 動画 | I1-main.mp4 **00:04.89**（[取得先](media-index.md)） |
| ログ | [attempts/I1-prepare-1792543862993/result.json](<attempts/I1-prepare-1792543862993/result.json>) |
<a id="record-132"></a>

## 132. I1-doctor — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:51:10+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | ホストで生成先と前提を確認 |
| 期待結果 | doctorが終了コード0 |
| 実結果 | doctorが終了コード0 |
| 画像 | [画像](<attempts/I1-prepare-1792543862993/screenshots/I1-doctor.png>) |
| 動画 | I1-main.mp4 **00:06.71**（[取得先](media-index.md)） |
| ログ | [logs/I1-host.typescript](<logs/I1-host.typescript>) |
<a id="record-133"></a>

## 133. I1-open-code — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:51:11+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | アプリからVS Codeで開く |
| 期待結果 | この生成フォルダを実際のVS Codeへ渡す |
| 実結果 | この生成フォルダを実際のVS Codeへ渡す |
| 画像 | [画像](<attempts/I1-prepare-1792543862993/screenshots/I1-open-code.png>) |
| 動画 | I1-main.mp4 **00:07.55**（[取得先](media-index.md)） |
| ログ | [attempts/I1-prepare-1792543862993/result.json](<attempts/I1-prepare-1792543862993/result.json>) |
<a id="record-134"></a>

## 134. I1-reopen — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:51:44+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | Reopen in Containerを選択 |
| 期待結果 | 既存キャッシュを保持し、今回のコンテナと依存領域を作成 |
| 実結果 | 既存キャッシュを保持し、今回のコンテナと依存領域を作成 |
| 画像 | [画像](<attempts/I1-connect-1792543901699/screenshots/I1-reopen.png>) |
| 動画 | I1-main.mp4 **00:41.00**（[取得先](media-index.md)） |
| ログ | [attempts/I1-connect-1792543901699/result.json](<attempts/I1-connect-1792543901699/result.json>) |
<a id="record-135"></a>

## 135. I1-postcreate — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:51:56+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 初回構成処理の完了を待つ |
| 期待結果 | postCreateCommandの成功結果を確認 |
| 実結果 | postCreateCommandの成功結果を確認 |
| 画像 | [画像](<attempts/I1-connect-1792543901699/screenshots/I1-postcreate.png>) |
| 動画 | I1-main.mp4 **00:52.78**（[取得先](media-index.md)） |
| ログ | [attempts/I1-connect-1792543901699/result.json](<attempts/I1-connect-1792543901699/result.json>) |
<a id="record-136"></a>

## 136. I1-first — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:52:00+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | migration・サンプル準備・SQL実行 |
| 期待結果 | SQLの練習とサンプル3件を表示 |
| 実結果 | SQLの練習とサンプル2件（notebook quantity 3、pencil quantity 8）を表示。原記録の「3件」は撮影説明の誤記。 |
| 画像 | [画像](<attempts/I1-connect-1792543901699/screenshots/I1-first.png>) |
| 動画 | I1-main.mp4 **00:56.65**（[取得先](media-index.md)） |
| ログ | [attempts/I1-connect-1792543901699/result.json](<attempts/I1-connect-1792543901699/result.json>) |

点検: 撮影時=PASS、分類=OBSERVATION。原記録との差分はreview.jsonを参照。
<a id="record-137"></a>

## 137. I1-editor-change — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:52:52+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | VS Codeで教材指定の一か所を変更して保存 |
| 期待結果 | sql/practice.sql を変更 |
| 実結果 | sql/practice.sql を変更 |
| 画像 | [画像](<attempts/I1-exercise-1792543969850/screenshots/I1-editor-change.png>) |
| 動画 | I1-main.mp4 **01:49.08**（[取得先](media-index.md)） |
| ログ | [attempts/I1-exercise-1792543969850/result.json](<attempts/I1-exercise-1792543969850/result.json>) |
<a id="record-138"></a>

## 138. I1-exercise-failure — FAIL

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:52:53+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 失敗時の到達点を保存 |
| 期待結果 | この場面の対象画面・操作結果を確認できること |
| 実結果 | Error: locator.focus: Error: strict mode violation: locator('.terminal-wrapper.active .xterm-helper-textarea') resolved to 2 elements:<br>    1) &lt;textarea tabindex="0" autocorrect="off" autocomplete="off" spellcheck="false" autocapitalize="off" aria-multiline="false" class="xterm-helper-textarea" aria-label="Terminal 2, bash↵Run the command: Toggle Screen Reader Accessibility Mode for an optimized screen reader experience↵Use Shift+Alt+F1 for terminal accessibility help"&gt;&lt;/textarea&gt; aka getByRole('textbox', { name: 'Terminal 2, bash Run the' })<br>    2) &lt;textarea tabindex="0" autocorrect="off" autocomplete="off" spellcheck="false" autocapitalize="off" aria-multiline="false" aria-label="Terminal input" class="xterm-helper-textarea"&gt;&lt;/textarea&gt; aka getByRole('textbox', { name: 'Terminal input' })<br><br>Call log:<br>  - waiting for locator('.terminal-wrapper.active .xterm-helper-textarea')<br> |
| 画像 | [画像](<attempts/I1-exercise-1792543969850/screenshots/I1-exercise-failure.png>) |
| 動画 | I1-main.mp4 **01:49.91**（[取得先](media-index.md)） |
| ログ | [attempts/I1-exercise-1792543969850/result.json](<attempts/I1-exercise-1792543969850/result.json>) |
<a id="record-139"></a>

## 139. I1-editor-change — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:54:31+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | VS Codeで教材指定の一か所を変更して保存 |
| 期待結果 | sql/practice.sql を変更 |
| 実結果 | sql/practice.sql を変更 |
| 画像 | [画像](<attempts/I1-exercise-1792544070712/screenshots/I1-editor-change.png>) |
| 動画 | I1-main.mp4 **03:27.80**（[取得先](media-index.md)） |
| ログ | [attempts/I1-exercise-1792544070712/result.json](<attempts/I1-exercise-1792544070712/result.json>) |
<a id="record-140"></a>

## 140. I1-changed — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:54:33+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 保存後にSQLを再実行 |
| 期待結果 | lesson列を「在庫を調べる」へ変更 |
| 実結果 | lesson列を「在庫を調べる」へ変更 |
| 画像 | [画像](<attempts/I1-exercise-1792544070712/screenshots/I1-changed.png>) |
| 動画 | I1-main.mp4 **03:29.33**（[取得先](media-index.md)） |
| ログ | [attempts/I1-exercise-1792544070712/result.json](<attempts/I1-exercise-1792544070712/result.json>) |

点検: 撮影時=PASS、分類=OBSERVATION。撮影入力でclearの先頭cが欠け、lear: command not foundも表示された。後続のSQLは実行され、2行の変更結果を確認。製品SQLの失敗ではない。
<a id="record-141"></a>

## 141. I1-restored — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:54:37+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 元のSQLへ戻して再実行 |
| 期待結果 | 最後の実行結果のlesson列がSQLの練習 |
| 実結果 | 最後の実行結果のlesson列がSQLの練習 |
| 画像 | [画像](<attempts/I1-exercise-1792544070712/screenshots/I1-restored.png>) |
| 動画 | I1-main.mp4 **03:33.33**（[取得先](media-index.md)） |
| ログ | [attempts/I1-exercise-1792544070712/result.json](<attempts/I1-exercise-1792544070712/result.json>) |

点検: 撮影時=PASS、分類=OBSERVATION。同じ撮影入力のlearエラー後、SQL再実行で元のlessonを確認。ソースSHAも一致。
<a id="record-142"></a>

## 142. I1-stop — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:54:40+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 試験プロジェクトを通常停止 |
| 期待結果 | ソースと必要なvolumeを削除せず保持 |
| 実結果 | ソースと必要なvolumeを削除せず保持 |
| 画像 | [画像](<attempts/I1-stop-1792544077593/screenshots/I1-stop.png>) |
| 動画 | I1-main.mp4 **03:36.91**（[取得先](media-index.md)） |
| ログ | [attempts/I1-stop-1792544077593/result.json](<attempts/I1-stop-1792544077593/result.json>) |
<a id="record-143"></a>

## 143. S2-retention — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:55:13+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 通常停止後にDBだけを再開し保存内容を確認 |
| 期待結果 | 架空メモが編集済みの状態で残る。I1は停止済み |
| 実結果 | 架空メモが編集済みの状態で残る。I1は停止済み |
| 画像 | [画像](<screenshots/S2-retention.png>) |
| 動画 | S2-retention.mp4 **00:31.05**（[取得先](media-index.md)） |
| ログ | [logs/S2-exercise.json](<logs/S2-exercise.json>) |
<a id="record-144"></a>

## 144. S2-db-test — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:55:15+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 同梱のDB試験を実行 |
| 期待結果 | 匿名権限のCRUD・制約試験が成功。試験変更はrollback |
| 実結果 | 匿名権限のCRUD・制約試験が成功。試験変更はrollback |
| 画像 | [画像](<screenshots/S2-db-test.png>) |
| 動画 | S2-retention.mp4 **00:33.28**（[取得先](media-index.md)） |
| ログ | [logs/S2-exercise.json](<logs/S2-exercise.json>) |
<a id="record-145"></a>

## 145. S2-retention-stop — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:55:19+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 再確認後もデータを消さず停止 |
| 期待結果 | DBのデータvolumeを保持 |
| 実結果 | DBのデータvolumeを保持 |
| 画像 | [画像](<screenshots/S2-retention-stop.png>) |
| 動画 | S2-retention.mp4 **00:37.56**（[取得先](media-index.md)） |
| ログ | [steps.json](<steps.json>) |
<a id="record-146"></a>

## 146. E01 — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:55:55+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 存在しない親フォルダで確認する |
| 期待結果 | エラーを表示し、入力を保持。フォルダを勝手に作らない |
| 実結果 | エラーを表示し、入力を保持。フォルダを勝手に作らない |
| 画像 | [画像](<screenshots/E01.png>) |
| 動画 | recovery.mp4 **00:02.98**（[取得先](media-index.md)） |
| ログ | [logs/recovery-summary.json](<logs/recovery-summary.json>) |
<a id="record-147"></a>

## 147. E02 — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:55:56+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 既存の試験用フォルダを指定する |
| 期待結果 | 上書きを拒否し、既存ファイルのハッシュを保持 |
| 実結果 | 上書きを拒否し、既存ファイルのハッシュを保持 |
| 画像 | [画像](<screenshots/E02.png>) |
| 動画 | recovery.mp4 **00:04.61**（[取得先](media-index.md)） |
| ログ | [logs/recovery-summary.json](<logs/recovery-summary.json>) |
<a id="record-148"></a>

## 148. E03-conflict — FAIL

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:55:58+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 試験所有の待受ポートを指定する |
| 期待結果 | この場面の対象画面・操作結果を確認できること |
| 実結果 | 競合警告をDOMで確認したが、画像では警告が画面外。E03-warning-detailで警告を補足撮影。 |
| 画像 | [画像](<screenshots/E03-conflict.png>) |
| 動画 | recovery.mp4 **00:06.26**（[取得先](media-index.md)） |
| ログ | [logs/recovery-summary.json](<logs/recovery-summary.json>) |

点検: 撮影時=PASS、分類=CAPTURE_FRAMING。原記録との差分はreview.jsonを参照。
<a id="record-149"></a>

## 149. E04 — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:55:59+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 生成前の確認から入力へ戻る |
| 期待結果 | 名前と入力を保持し、生成先はまだ存在しない |
| 実結果 | 名前と入力を保持し、生成先はまだ存在しない |
| 画像 | [画像](<screenshots/E04.png>) |
| 動画 | recovery.mp4 **00:07.10**（[取得先](media-index.md)） |
| ログ | [logs/recovery-summary.json](<logs/recovery-summary.json>) |
<a id="record-150"></a>

## 150. E03 — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:56:00+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | ポートを空き番号へ変えて再試行 |
| 期待結果 | 新規生成に成功。元の試験用待受は終了せず残したまま |
| 実結果 | 新規生成に成功。元の試験用待受は終了せず残したまま |
| 画像 | [画像](<screenshots/E03.png>) |
| 動画 | recovery.mp4 **00:08.77**（[取得先](media-index.md)） |
| ログ | [logs/recovery-summary.json](<logs/recovery-summary.json>) |
<a id="record-151"></a>

## 151. E08-normal — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:56:02+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 通常サイズで教材を見る |
| 期待結果 | 本文と戻り先を表示 |
| 実結果 | 本文と戻り先を表示 |
| 画像 | [画像](<screenshots/E08-normal.png>) |
| 動画 | recovery.mp4 **00:10.39**（[取得先](media-index.md)） |
| ログ | [logs/recovery-detail.json](<logs/recovery-detail.json>) |
<a id="record-152"></a>

## 152. E08-narrow — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:56:03+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 実ウィンドウを最小幅860pxへ縮める |
| 期待結果 | 教材・ナビゲーションを利用できる |
| 実結果 | 教材・ナビゲーションを利用できる |
| 画像 | [画像](<screenshots/E08-narrow.png>) |
| 動画 | recovery.mp4 **00:11.68**（[取得先](media-index.md)） |
| ログ | [logs/recovery-detail.json](<logs/recovery-detail.json>) |
<a id="record-153"></a>

## 153. E08-200 — FAIL

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:56:05+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | Electronの実ズームを200%に設定 |
| 期待結果 | この場面の対象画面・操作結果を確認できること |
| 実結果 | 200%の上部と戻る入口を撮影したが、本文が画面外。E08-200-body/command/returnで補足。 |
| 画像 | [画像](<screenshots/E08-200.png>) |
| 動画 | recovery.mp4 **00:13.16**（[取得先](media-index.md)） |
| ログ | [steps.json](<steps.json>) |

点検: 撮影時=PASS、分類=CAPTURE_FRAMING。原記録との差分はreview.jsonを参照。
<a id="record-154"></a>

## 154. E08-keyboard-guide — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:56:06+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | TabとEnterで準備教材へ移動 |
| 期待結果 | Linux準備教材をキーボードで開く |
| 実結果 | Linux準備教材をキーボードで開く |
| 画像 | [画像](<screenshots/E08-keyboard-guide.png>) |
| 動画 | recovery.mp4 **00:14.47**（[取得先](media-index.md)） |
| ログ | [logs/recovery-detail.json](<logs/recovery-detail.json>) |
<a id="record-155"></a>

## 155. E08 — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:56:07+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | キーボードで準備画面へ戻る |
| 期待結果 | Tab / Enterで主要な往復操作ができる |
| 実結果 | Tab / Enterで主要な往復操作ができる |
| 画像 | [画像](<screenshots/E08.png>) |
| 動画 | recovery.mp4 **00:15.29**（[取得先](media-index.md)） |
| ログ | [logs/recovery-detail.json](<logs/recovery-detail.json>) |
<a id="record-156"></a>

## 156. E05-unavailable — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:56:09+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | このアプリだけ存在しないDockerソケットを指定 |
| 期待結果 | 実Docker CLIが接続失敗を返し、UIに不足と手順を表示 |
| 実結果 | 実Docker CLIが接続失敗を返し、UIに不足と手順を表示 |
| 画像 | [画像](<screenshots/E05-unavailable.png>) |
| 動画 | recovery.mp4 **00:17.56**（[取得先](media-index.md)） |
| ログ | [logs/vm-readiness.json](<logs/vm-readiness.json>) |
<a id="record-157"></a>

## 157. E05-guide — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:56:11+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 接続失敗からLinux準備教材へ進む |
| 期待結果 | 公式の導入後設定・接続先確認・戻り先を案内 |
| 実結果 | 公式の導入後設定・接続先確認・戻り先を案内 |
| 画像 | [画像](<screenshots/E05-guide.png>) |
| 動画 | recovery.mp4 **00:19.16**（[取得先](media-index.md)） |
| ログ | [logs/vm-readiness.json](<logs/vm-readiness.json>) |
<a id="record-158"></a>

## 158. E05 — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T09:56:13+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 専用プロセスの接続先指定を外して再確認 |
| 期待結果 | 実ホストのDockerへ再接続し、利用可能へ復旧 |
| 実結果 | 実ホストのDockerへ再接続し、利用可能へ復旧 |
| 画像 | [画像](<screenshots/E05.png>) |
| 動画 | recovery.mp4 **00:21.61**（[取得先](media-index.md)） |
| ログ | [logs/vm-readiness.json](<logs/vm-readiness.json>) |
<a id="record-159"></a>

## 159. E03-warning-detail — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T10:04:07+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 競合警告まで画面をスクロール |
| 期待結果 | 使用中のポート番号と見直しボタンを画面内で確認 |
| 実結果 | 使用中のポート番号と見直しボタンを画面内で確認 |
| 画像 | [画像](<attempts/recovery-detail-1792544643837/screenshots/E03-warning-detail.png>) |
| 動画 | recovery-detail-1792544643837.mp4 **00:03.10**（[取得先](media-index.md)） |
| ログ | [logs/recovery-summary.json](<logs/recovery-summary.json>) |
<a id="record-160"></a>

## 160. E08-200-body — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T10:04:09+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 860px幅・200%で本文へスクロール |
| 期待結果 | 本文見出しと文章を読める。上部ナビから本文へ外側のスクロールが必要 |
| 実結果 | 本文見出しと文章を読める。上部ナビから本文へ外側のスクロールが必要 |
| 画像 | [画像](<attempts/recovery-detail-1792544643837/screenshots/E08-200-body.png>) |
| 動画 | recovery-detail-1792544643837.mp4 **00:05.37**（[取得先](media-index.md)） |
| ログ | [logs/recovery-detail.json](<logs/recovery-detail.json>) |
<a id="record-161"></a>

## 161. E08-200-command — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T10:04:10+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 拡大表示で最初のコマンドへ進む |
| 期待結果 | 本文内スクロールとコード欄の横スクロールで内容を参照できる |
| 実結果 | 本文内スクロールで文章とdoctorコマンド全文を表示。対象コード幅377px・内容幅377pxで横スクロール不要。原記録の横スクロールの記述は未実測。 |
| 画像 | [画像](<attempts/recovery-detail-1792544643837/screenshots/E08-200-command.png>) |
| 動画 | recovery-detail-1792544643837.mp4 **00:06.16**（[取得先](media-index.md)） |
| ログ | [logs/recovery-detail.json](<logs/recovery-detail.json>) |

点検: 撮影時=PASS、分類=OBSERVATION。原記録との差分はreview.jsonを参照。
<a id="record-162"></a>

## 162. E08-200-return — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T10:04:11+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 200%のまま戻るボタンへ移動して操作 |
| 期待結果 | 生成画面へ戻れる |
| 実結果 | 生成画面へ戻れる |
| 画像 | [画像](<attempts/recovery-detail-1792544643837/screenshots/E08-200-return.png>) |
| 動画 | recovery-detail-1792544643837.mp4 **00:06.99**（[取得先](media-index.md)） |
| ログ | [logs/recovery-detail.json](<logs/recovery-detail.json>) |
<a id="record-163"></a>

## 163. S2-heading-before — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T10:08:37+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | S2を再開し見出しを画面内に表示 |
| 期待結果 | 元の「ローカル学習メモ」を確認 |
| 実結果 | 元の「ローカル学習メモ」を確認 |
| 画像 | [画像](<attempts/S2-heading-1792544848047/screenshots/S2-heading-before.png>) |
| 動画 | S2-heading-1792544848047.mp4 **01:08.83**（[取得先](media-index.md)） |
| ログ | [steps.json](<steps.json>) |
<a id="record-164"></a>

## 164. S2-heading-editor — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T10:08:40+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 実エディタで見出しを変更して保存 |
| 期待結果 | app/page.tsxの見出しだけを変更 |
| 実結果 | app/page.tsxの見出しだけを変更 |
| 画像 | [画像](<attempts/S2-heading-1792544848047/screenshots/S2-heading-editor.png>) |
| 動画 | S2-heading-1792544848047.mp4 **01:11.47**（[取得先](media-index.md)） |
| ログ | [steps.json](<steps.json>) |
<a id="record-165"></a>

## 165. S2-heading-changed — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T10:08:41+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | ブラウザで見出し変更を確認 |
| 期待結果 | わたしの学習メモ を画面内に表示 |
| 実結果 | わたしの学習メモ を画面内に表示 |
| 画像 | [画像](<attempts/S2-heading-1792544848047/screenshots/S2-heading-changed.png>) |
| 動画 | S2-heading-1792544848047.mp4 **01:12.31**（[取得先](media-index.md)） |
| ログ | [logs/S2-exercise.json](<logs/S2-exercise.json>) |
<a id="record-166"></a>

## 166. S2-heading-restored — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T10:08:43+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 実エディタで復元してブラウザを確認 |
| 期待結果 | ローカル学習メモ に戻り、元のSHA-256も一致 |
| 実結果 | ローカル学習メモ に戻り、元のSHA-256も一致 |
| 画像 | [画像](<attempts/S2-heading-1792544848047/screenshots/S2-heading-restored.png>) |
| 動画 | S2-heading-1792544848047.mp4 **01:14.97**（[取得先](media-index.md)） |
| ログ | [logs/S2-exercise.json](<logs/S2-exercise.json>) |
<a id="record-167"></a>

## 167. S2-heading-stop — PASS

| 項目 | 内容 |
|---|---|
| 時刻 | 2026-10-21T10:08:49+09:00 |
| 場所・操作 | REAL_HOST / AUTOMATED / Linux Mint host / dedicated Xephyr X11 desktop |
| 操作 | 補足確認後にS2だけ通常停止 |
| 期待結果 | ソースとDB volumeを保持 |
| 実結果 | ソースとDB volumeを保持 |
| 画像 | [画像](<attempts/S2-heading-1792544848047/screenshots/S2-heading-stop.png>) |
| 動画 | S2-heading-1792544848047.mp4 **01:20.56**（[取得先](media-index.md)） |
| ログ | [logs/S2-exercise.json](<logs/S2-exercise.json>) |
