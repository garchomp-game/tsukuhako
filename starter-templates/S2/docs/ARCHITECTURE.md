# 構成とデータの寿命

ブラウザはホスト、Next.jsはDev Container、Supabaseは同じホストDocker上の独立したサービス群です。Supabase CLIは固定版のバイナリをホストから実行します。Docker socketをアプリへ共有していません。

```text
ブラウザ → 127.0.0.1:3000 → app:3000 /api/notes
                                 ↓ server-only fetch（anon権限）
                 supabase_kong_<PROJECT_NAME>:8000
                                 ↓ REST / PostgreSQL
                         supabase_db_<PROJECT_NAME>:5432
```

|見る場所|接続先（初期値）|役割|
|---|---|---|
|ホストのブラウザ|http://localhost:3000|学習メモ画面。キーを持たない|
|ブラウザからNext|同じオリジンの`/api/notes`|メモCRUDのJSON API|
|Nextのサーバー|`http://supabase_kong_<PROJECT_NAME>:8000`|専用Docker network内のSupabase REST|
|ホストのブラウザ|http://localhost:54323|Supabase Studio|
|ホストのHTTPクライアント|http://127.0.0.1:54321|Supabase API|
|ホストのDBクライアント|127.0.0.1:54322|PostgreSQL。アプリはこのホストポートを使わない|

`localhost`は接続元によって違います。コンテナ内のlocalhostはコンテナ自身です。ブラウザから内部Docker名へアクセスしません。ホスト公開は専用networkの`host_binding_ipv4=127.0.0.1`で限定しています。外部公開を有効にする構成ではありません。

`.env`は識別名とポート、`.env.local`はNextのサーバーだけが使う接続設定です。起動スクリプトはCLI statusから匿名キーだけを取り出します。service roleキー、強いsecretキー、NEXT_PUBLIC変数はアプリに必要ありません。`lib/database.ts`は`server-only`でブラウザへの誤importを拒否します。

|保存対象|場所|通常停止・再構築|初期化|
|---|---|---|---|
|ソースと教材|ホストの展開フォルダを/workspaceへbind mount|保持|DB resetで消えない|
|依存|Composeプロジェクト別dependencies volume|保持しnpm ciで復元|volume削除後は再取得|
|npm取得キャッシュ|プロジェクト別npm-cache volume|保持|再取得できる|
|メモ|`supabase_db_<PROJECT_NAME>` volume|Supabase stopとDev Container再構築でも保持|明示db resetで学習データを消してseedへ戻す|
|CLIバイナリ|このフォルダの.cache/supabase|保持|消しても固定版を再取得できる|
|設定/所有者記録|.env、.env.local、.local|保持|別コピーへ持ち込まない|

初回の空DBだけにmigration/seedを適用します。通常startは毎回resetしません。seedは固定UUIDとON CONFLICT DO NOTHINGにより、意図的に再適用しても重複せず既存の編集を残します。

migrationはRLSを有効にし、anonのSELECT/INSERT/UPDATE/DELETE policyを明示します。INSERT/UPDATEのgrantはbody列だけです。本文はアプリとDBの両方で空・長さ・trimを確認します。DBのchar_lengthはUTF-8のコードポイントを数えます。日本語や絵文字の「見た目の一文字」と一致しない例があります。

匿名CRUDは架空データを使うローカル演習のための設定です。クラウド読取り用のS3とは別のmigrationです。実ユーザーのデータを扱う際はAuthと所有者単位のpolicyを設計し直します。

## 起動場所を選んだ理由

固定CLI 2.121.0のLinuxバイナリを実際に取得し、checksum・init・startとDocker接続を確認しました。ホストNodeは不要です。Dev ContainerからホストDocker socketを操作する案は、アプリプロセスもDocker管理権限を持ち、ホストlocalhostへ到達する追加設定が必要になります。専用一時CLIコンテナ案もsocketとhost到達設定を必要とします。今回の実測採用はホストCLIで、コンテナ内CLI案の実stack起動は実施していません。

[Supabase公式local development](https://supabase.com/docs/guides/local-development)のstable startとlocalhost binding networkを使用します。実験的stackコマンドは採用していません。CLI版更新時は同梱サービス版・ポート・保持試験を再確認します。

## 試験サーバーの寿命

`scripts/test-integration.mjs` → `managed-server.mjs` がNextのNode CLIを直接起動し、専用プロセスグループを管理します。HTTP試験後、同じサーバーへ画面試験を行い、finallyで子プロセスを含むグループの終了と3000番の解放を確認します。その後でCIがbuildを実行します。Playwright単独起動も`reuseExistingServer: false`で新規サーバーだけを対象にし、[公式のgracefulShutdown](https://playwright.dev/docs/test-webserver)でプロセスグループを終了させます。
