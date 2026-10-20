# 検証記録 — 0.4.1

2026-10-21。PASSは下記の条件内の結果です。Windowsを模した応答をLinux上の画面へ渡した試験を、Windows実機の合格に読み替えません。

## 環境

Linux Mint 22.3 / x64、kernel 7.0.0-31、Docker Engine 29.9.1 / Compose 5.6.0、VS Code 1.142.0 / Dev Containers 0.470.0。制作側Node 24.19.0、Electron 44.9.1。GUI、VS Code、ブラウザはそれぞれ試験専用プロファイルを使用しました。既存Dockerの2コンテナの起動時刻・稼働状態を維持しています。

## 実機での操作（開発者による自動操作）

|対象|結果|実施内容／境界|証拠|
|---|---|---|---|
|0.4.0事前点検|再現|ファイル参照ボタンのエラー、生成結果と教材のポート違い、次の新規生成入口なし。WSL一覧不更新はfixtureで確認|before.json、before-*画像|
|配布Linux GUI|PASS|tarを日本語・空白パスに展開。sandbox/contextIsolation有効、nodeIntegration無効。6構成を用途選択から生成し、各教材・復旧へ往復|gui.json（全体14グループ。fixtureを含むため内訳に注意）|
|入力／保存先／取消|PASS|不存在の親→入力保持→修正→成功。確認前の戻るは出力を作らない。別プロジェクト作成で以前の出力が残る|gui.json|
|ポート競合|PASS|試験所有の127.0.0.1:3891待受に対して警告。戻って3892へ変更。待受は自分の試験分だけ終了|gui.json|
|教材／アクセシビリティ|PASS（範囲限定）|見出しフォーカス、コピーした文字列とクリップボード一致、入力保持、復旧から元の章へ復帰、860×680の200%でキーボード・次章・戻る・ページ幅|gui.json、reader-zoom.json、zoom.json、画像。スクリーンリーダー実機は未実施|
|読書再開|PASS|WSL候補消失fixtureの後も位置保存に成功。同一プロファイルで再起動して500px超の読書位置を再開。今回の生成結果は永続化せず、標準教材だと表示|gui.json|
|F2初回の一周|PASS|GUIで作った日本語フォルダ／3892を使用。ホストdoctor成功→専用VS Codeで同じフォルダを開く→自分の生成物の信頼確認→Reopen in Container→内蔵ターミナルでpwd=/workspace、npm run dev→Ready→app/page.tsxのh1編集→ブラウザHMR→元に戻して保存→元の表示|f2-doctor.txt、vscode-f2.json、vscode-f2-start.png、f2-before/changed/restored.png|

F2ではVS Codeの隔離プロファイルを起動するためテスト用ランチャーを使い、同梱ガイドにあるフォルダを開きました。コンテナ起動と編集は実際のVS Code UIで操作しています。ソース復元後のSHA256は `c519464d586ca774fbc969aeca14418aa10e837948cf22322317e3c61a5fd43e` です。今回はF2のRebuild／再接続試験を繰り返していません。旧0.4.0の記録は今回の結果とは分けます。

## 自動回帰試験

- `npm test --prefix generator`：**21/21 PASS**。新規生成、入力不正、ZIP整合、保存先競合、rollback、利用者変更の保護など。
- `npm test --prefix generator-desktop`：**22/22 PASS**。従来15件に、WSL案内、再列挙時の選択、リンク分類、全教材の参照、現在教材の復旧、生成値の反映、選択解除後の読書保存の7件を追加。
- `npm run build --prefix generator-desktop`：TypeScript／Vite成功。新しい外部依存は追加していません。
- 最終配布物の画面試験：`tools/verify-ux-041.mjs`、補足拡大試験：`tools/verify-ux-final-041.mjs`。
- 生成中のUI／安全性：教材へ移動しても進行表示を保持。二重applyはBUSY、終了は拒否。生成後に作る画面へ戻れる。危険なMarkdownからHTML・URL・ファイル操作を起動しない。`security.json`。

文言の完全一致だけを目的にした試験は増やしていません。状態遷移、出力先、ポート、ID、リンク種別、クリップボード内容、復元したファイルの内容を確認しています。

## Fixture／Linux上のhelper試験

|項目|結果|代替できない範囲|
|---|---|---|
|Docker停止|PASS|応答を置き換えて「未起動」、OS教材、ファイル生成可を確認。実Dockerサービスは停止していない|
|WSL候補なし→導入後再取得→再確認→消失|PASS|Windows用画面の応答fixture。実wsl.exe・再起動・権限・通常ユーザー作成は未実施|
|WSL内Docker→Windows教材|PASS|Windows向け変換関数の単体試験＋画面fixture。実Desktop連携は未実施|
|診断取消／遅延結果|PASS|中断後の遅れて届く成功を採用しない|
|生成BUSY／終了拒否|PASS|自分のutility processだけをSIGSTOPし、UI操作と二重要求を観測。SIGCONTして実生成を完了|
|アプリ終了時の診断停止|PASS|自分の診断コマンドがTERMを無視するfixture。1063msで終了し残存なし（計測に固定待ちを含む）|
|同梱helper|PASS / Linux|全6構成生成、対象binding、中断、実行中診断のshutdown。Windowsからの配置・通信はNOT_RUN|

## NOT_RUN

Windows / WSL 2実機、macOS両CPU実機、Windows/macOSの0.4.1実行配布物作成、未導入PCでの全導入、初回のOS警告・署名・公証、実ユーザーの初心者試験、スクリーンリーダー、ホスト回線を切断した完全オフライン試験、今回のF1/B1/S1/S2/I1の実サーバー再起動、購入・受取・出品画面の実操作。S2のmacOS起動補助はLinux依存が残ります。

## 保全と再現

既存0.4.0のソースZIP・レビューZIP・Linux実行版のハッシュが既知の値と一致しました。新しい作業は別ディレクトリです。試験F2のコンテナ／ネットワークのみ `compose.sh down` し、volumeとソースを保持しました。試験VS Codeも終了済みです。`preservation.json`、`cleanup.json` を参照してください。

レビューZIPでは `runs`、node_modules、生成した.env、プロファイル、巨大なランタイムを除外しています。試験を再現する場合はNode 24でgenerator、generator-desktop、toolsの依存をnpm ciし、ビルド後に `tools/package-desktop-041.py` を実行します。GUI試験にはLinuxの表示セッション、F2一周にはDockerとVS Codeが必要です。GUI試験は新しい `UX_RUN` 名で実施してください。

試験途中には旧ラベルを使ったセレクター、非同期コピー完了を待たない検査、Windows fixtureの無効な仮IDなど、テスト手順側の失敗も修正しました。製品側の失敗（詳細設定の閉鎖、選択解除後の読書保存）はUX-REVIEWに記載しています。最終PASSは修正後の記録だけを採用しています。
