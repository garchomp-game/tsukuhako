# S2 — Next.jsとSupabaseローカル

架空の学習メモを作成・一覧・編集・削除します。メモはこのPCのDocker volumeへ保存され、再読み込みや通常停止後も残ります。**ログインなしのローカル学習専用**です。この構成の匿名CRUD権限をクラウドへ移さないでください。

## 最短起動

前提はLinuxまたはWSL内のbash、Docker/Compose、VS CodeとDev Containers拡張、curl、tar、sha256sum、timeout、cksum、awk、sedです。ホストのNode/npmとクラウドアカウントは不要です。未導入の場合は[最初の準備](docs/SETUP.md)へ。初回はネット接続と数GBの空き容量が必要です。

1. このフォルダをWSL/Linuxの新しい作業場所へ展開します。ホストのターミナルでこのフォルダに移動します。
2. `bash scripts/configure.sh`、続いて `bash scripts/doctor-host.sh` を実行します。`.env`にコピーごとの識別名が作られます。
3. **ホストで** `bash scripts/db.sh start` を実行します。固定版のSupabase CLIをこのフォルダの`.cache`に取得します。初回のみ空DBへmigrationとseedが適用されます。「準備完了」を待ちます。
4. VS Codeでこのフォルダを開き、**Dev Containers: Reopen in Container** を実行します。依存復元とDB診断が終わるのを待ちます。
5. **コンテナ内ターミナルで** `npm run dev`。ブラウザで [http://localhost:3004](http://localhost:3004) を開きます。架空のメモ2件と入力欄が表示されます。
6. 本文を保存し、編集・削除を試します。再読み込み後も保存したメモが残ることを確かめます。

Studioは [http://localhost:54323](http://localhost:54323)。Table Editorの`notes`で同じデータを確認できます。未使用のStorage/Realtime/メール/Edge Functions/Analyticsは起動していません。

## 操作と実行場所

|場所|コマンド|目的・期待結果|
|---|---|---|
|ホスト|`bash scripts/doctor-host.sh`|前提・設定・ポート診断。秘密値を表示しない|
|ホスト|`bash scripts/db.sh start`|DBの初回作成または保存データから再開|
|ホスト|`bash scripts/db.sh status`|対象プロジェクトのサービス名・公開先を確認|
|ホスト|`bash scripts/db.sh test`|実DBで匿名権限CRUD・制約を確認し試験データはrollback|
|コンテナ|`npm run dev`|開発サーバー起動。止めるにはCtrl+C|
|コンテナ|`npm run doctor`|Node・依存・低権限キー・DB読取りを確認|
|コンテナ|`npm run check`|Route型生成・TypeScript・ESLint|
|コンテナ|`npm test`|入力規則と、試験失敗時のサーバー終了・使用中ポートの拒否を検証|
|コンテナ、dev起動中|`npm run test:api`|実APIからCRUD・エラー・メソッドを検証|
|コンテナ、dev停止後|`npm run test:setup` → `npm run test:integration`|Chromium取得、1つの管理サーバーでHTTP→画面試験→終了・ポート解放|
|コンテナ、dev停止後|`npm run test:browser`|画面試験だけを実行。既存サーバーは再利用しない|
|コンテナ、dev停止後|`npm run build`|本番形式でビルド可能か確認。公開は行わない|
|ホスト|`bash scripts/app.sh stop` と `bash scripts/db.sh stop`|アプリとDBの通常停止。データ保持|

初期化は通常停止とは別です。`.env`の`PROJECT_NAME`を確認し、**ホストで** `bash scripts/db.sh reset --confirm-local-reset=その識別名` を実行すると、その学習DBだけを空にしてmigrationとseedを再適用します。確認引数がない場合は実行しません。クラウドへの操作やホスト全体のpruneは含めていません。

CIと同じ順に確認する場合は、DBを起動し、コンテナで `CI=true npm run test:integration && npm run build` を実行します。試験スクリプトがNextを直接起動し、HTTPと画面試験の間は同じサーバーを使います。最後に専用プロセスグループの終了と3000番の再bindを確認してから成功を返します。使用中ポートでは止まり、別サーバーを借用・停止しません。実GitHub Actionsの実行結果はVALIDATION.mdで区別しています。

## 学ぶ順番

[構成・接続先](docs/ARCHITECTURE.md) → [変更の演習](docs/EXERCISES.md) → [空から組み立てる](docs/BUILD-YOUR-OWN.md) → [停止・再構築・復旧](docs/RECOVERY.md)。採用版は[VERSION.json](VERSION.json)、実測と未確認環境は[VALIDATION.md](VALIDATION.md)を確認してください。

Next.jsは画面と同じオリジンのRoute Handlerを担当し、SupabaseはPostgreSQLとREST APIを担当します。ブラウザへキーを渡さず、Nextのサーバーが匿名キーでDBへ接続します。本文はtrim後1〜200 **Unicodeコードポイント**。絵文字の組合せや結合文字は見た目の1文字と数が異なる場合があります。

同じ構成をもう一つ動かす場合は`.env`・`.env.local`・`.local`・`.cache`をコピーせず、新しいフォルダでconfigureします。`.env`の`HOST_PORT`とSupabaseの4つのポートを全て別番号にしてください。PROJECT_NAMEだけの変更ではポート競合は解消しません。
