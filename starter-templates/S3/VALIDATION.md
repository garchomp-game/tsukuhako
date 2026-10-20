# S3 0.1.0 検証記録

実測日: 2026-10-20。Linux Mint 22.3 / x86_64、Docker Engine 29.9.1、Compose 5.6.0、Dev Container CLI 0.89.0。コンテナはNode 24.22.0 / npm 11.17.0、ブラウザはPlaywright 1.64.1によるホストGoogle Chrome 155.0.8059.84。接続先未提供のため、**実クラウド接続はBLOCKED**です。アカウント作成や外部DBへのSQL実行は行っていません。

|項目|結果・範囲|
|---|---|
|A01 単独配布|PASS: ソース/lockfile/教材を単独ZIP化し、別フォルダから設定なしで起動|
|A02 前提診断|PASS: .envの未知/重複/欠落キー、Compose関連exportの上書きを拒否。停止helperも同じガードを通す|
|A03 依存固定|PASS: 新規Dev Containerでnpm ci、固定Node/npmを確認|
|A04 実Dev Container|PASS: CLIで実up/exec/doctor。VS Code画面からの操作はNOT_RUN|
|A05 主要操作|PASS: 未設定案内とローカル通信失敗の画面。実クラウドの商品一覧はBLOCKED|
|A06 保存反映|NOT_RUN: ソース編集のHMR専用試験は未実施|
|A07 停止・再開|PASS: 作成したappを対象指定helperで停止、ZIPコピーでup。クラウドの状態変化は未確認|
|A08 再構築保持|NOT_RUN: 永続クラウドデータを伴う再構築試験は未実施|
|A09 SQL/初期データ|PASS（ローカル）: 専用の一時DBでsample SQL・架空seed・RLS/grantを実行。クラウド適用はBLOCKED|
|A10 資源分離|PASS: 専用Compose識別子・ポート、SQL試験はポート/永続volume/host mountなしで自分のコンテナだけを片付ける|
|A11 意味テスト|PASS: 3件のNodeテストで設定不足/秘密キー拒否/GET限定/正常/空/取得失敗/形式違い。SQLでanon SELECT/IUD拒否とRLSを別々に確認|
|A12 CI|定義を同梱。check/test/ローカルSQL/buildを実測。GitHub上の実行はNOT_RUN|
|A13 公開境界|PASS: appはlocalhost公開、server-only読取り、secret/service_role拒否、安全なエラー文。SQLに書込みgrant/policyなし|
|A14 手順再現|PASS: 最終ZIPの別フォルダでconfigure/doctor/up/check/案内画面。クラウド設定手順の実施はBLOCKED|
|A15 環境表記|Windows/WSL、macOS、ARM、Docker未導入PC、初心者本人による試用はNOT_RUN|
|A16 引渡し|追加候補として教材・版・試験・ZIPを用意。必須6構成と実クラウド検証済み構成とは区別する|

ローカルSQLはSupabase PostgreSQL 17.11の隔離した一時DBと、固定PostgreSQL 18.6の一時コンテナで実測しました。SELECTは架空の公開2件を許可、非公開1件はRLSで見えません。通常の匿名INSERT/UPDATE/DELETEはgrantで拒否。試験トランザクション内だけで一時的にgrantを付けた場合も、INSERTはRLS拒否、UPDATE/DELETEは対象0件となり、rollbackで試験用grantを戻しています。

初回lintは同一ページへのa要素を指摘し、GET再読込フォームへ修正して再実行PASS。初回ブラウザ補助試験はNextの開発用ボタンを数えて失敗したため、アプリのmain内へ範囲を絞りました。またNextの環境変数はファイルを消すだけでは解除されないため、READMEどおりdevを再起動して設定なしの状態を確認しています。通信失敗試験は存在しないコンテナ内loopback endpointと公開形式のダミーキーだけで行い、外部サービスへ送信していません。

詳細ログ、画像、最終配布SHA-256は全体成果物のvalidation/s3にあります。このフォルダ自体の起動・ローカル試験に全体成果物は不要です。初回のimage/npm取得にはネット接続が必要で、ホストの既存キャッシュは全削除していません。
