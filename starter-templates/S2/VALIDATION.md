# S2 0.1.1 検証記録

0.1.1ではレビューR2の終了管理を修正しました。回帰試験は、常駐する子サーバーを持つ親を起動し、試験が失敗しても専用プロセスグループ全体とポートが終了すること、使用中ポートを再利用・停止しないことを確認します。

修正版の受入手順は、最終ZIPを日本語・空白入りの**新規フォルダ、新規PROJECT_NAME、事前にvolumeが存在しないDB**から起動し、migration/seed、画面CRUD・再読込、通常stop/start後の保持を確認するものです。以前の試験用DBやvolumeは使いません。image/npm取得キャッシュの利用は許容します。

CI相当のLinux環境で `CI=true npm run test:integration` → `npm run build` を連続実行し、HTTP→画面試験→プロセスグループ終了→ポート解放→buildの順をログで確認します。最終ZIPのSHA-256・実行コマンド・実測結果・初期volume不存在の証拠・停止台帳は、全体成果物の `validation/revision-0.1.1/s2/summary.json` と各ログに記録します。GitHubへのpushと実GitHub Actionsは行わず、実CIは引き続きNOT_RUNです。

## 0.1.0で完了した範囲（履歴）

実測日: 2026-10-20。Linux Mint 22.3 / x86_64 / kernel 7.0.0-31-generic、Docker Engine 29.9.1、Compose 5.6.0、Dev Container CLI 0.89.0。実コンテナはNode 24.22.0 / npm 11.17.0。Supabase CLI 2.121.0、PostgreSQL 17.11.0.004。ブラウザ自動操作はPlaywright 1.64.1 / Chromium 156、画像確認はホストGoogle Chrome 155.0.8059.84。

|項目|適用|結果・証拠の要点|
|---|---|---|
|A01 単独配布|対象|PASS: 単独ZIPを日本語・空白入り新規パスへ展開、README順で実Dev Container/CRUD起動|
|A02 前提診断|対象|PASS: .env不足、未知/重複キー、同名別フォルダ、使用中ポートを拒否。Compose関連のexport競合時は起動診断と停止を拒否。NodeのないPATHでホスト診断/DB status成功|
|A03 依存固定|対象|PASS: 新規Dev Containerでlockfileからnpm ci、固定Node/npm確認|
|A04 実Dev Container|対象|PASS: CLIで作成・exec・doctor成功。VS Code UI操作はNOT_RUN|
|A05 主要操作|対象|PASS: 画面CRUD/再読込、実API正常・不正入力・存在しないID、SQL/RLS/grant|
|A06 変更反映|対象|PASS: 保存後、同じブラウザで見出し変更が自動反映。明示reload/サーバー再起動なし|
|A07 停止・再開|対象|PASS: DBとappの停止・CLI再接続・再開、メモ保持。VS Code UIでの再接続はNOT_RUN|
|A08 再構築保持|対象|PASS: appコンテナ削除→再作成後もソース変更と学習メモIDを保持|
|A09 初期構築/リセット|対象|PASS: 空DBのmigration/seed、seed再適用で3→3件。対象確認なしreset拒否、明示reset後seed2件|
|A10 資源分離|対象|PASS: 別コピーと二つのSupabase/アプリを同時起動し、別ID/全ポート/データを分離。F2代表構成とも共存|
|A11 意味テスト|対象|PASS: 単体3、HTTP2、画面2のテストと実SQL。200/201コードポイント、markup文字列表示、通信失敗を確認|
|A12 CI|対象|PASS: 同梱コマンドをworkflowから実行する定義を用意。GitHub実CIはNOT_RUN（push/公開なし）|
|A13 公開境界|対象|PASS: ホスト公開ポート127.0.0.1、appにDocker socketなし、ブラウザassetsに匿名キーなし。強いキーをアプリへ渡さない|
|A14 手順再現|対象|PASS: ZIP新規展開でconfigure→host診断→DB start→Dev Container→dev→画面CRUD|
|A15 環境表記|対象|PASS: 上記実測を記載。Windows/WSL、macOS、ARM、未導入PCのセットアップはNOT_RUN|
|A16 引渡し|対象|PASS: 個別ソース・教材・版情報・試験・単独ZIPを整備。全体カタログ/報告は統合側で管理|

最初のlint失敗は初期読取りのeffect構造を修正。最初の画面試験の失敗はNextの標準route announcerとのalert selector競合を解消し再実行PASS。DB停止時は安全な503メッセージで、内部例外を画面へ出しません。

コンテナ内Chromiumの画像では日本語フォント不足があるため、日本語の視覚確認は利用者と同じホストブラウザで別に実施し、desktop/mobile表示と横溢れなしを確認しました。UI自動操作とホスト画像の確認は、人間の初心者による教材試用の代替ではありません。

Docker image/layerとnpm取得キャッシュを利用しています。ホスト全体のキャッシュ削除試験は実施していません。ホストCLI方式は実stack起動を検証しましたが、socket共有Dev Container内CLI/一時CLIコンテナ方式は設計比較のみです。詳細ログは全体成果物のvalidation/s2にあります。このフォルダの起動は全体成果物への参照を必要としません。

ZIP確認の初回補助スクリプトは保存応答を待つ前にreloadして失敗しました。実APIのPATCH完了を待つよう補助試験を修正し、同じ配布コードで再実行PASSです。配布物の画面テストは元から成功状態を待っています。

最終配布の識別子ガードと停止helperを追加後、同じ最終ZIPを既存の試験コピーへ再展開し、Dev Container起動・CRUD・設定ガードを再確認しています。元の新規展開試験と最終ZIPの再試験を分け、配布SHA-256と詳細は全体成果物のvalidation/s2に記録します。

最終再試験で、空白入りパスにあるキャッシュ済みCLIの版確認に引用不足を検出しました。不要なCLI再取得が発生するため、パスを引用するよう修正し、再取得せず起動・停止できることを確認しています。
