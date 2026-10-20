# I1 — PostgreSQL の作業用 Dev Container

SQL を実行し、テーブル・制約・migration・seed・データ保持を学ぶスターターです。Web 画面はありません。PostgreSQL 18.6 と `psql` を含む作業コンテナを使います。ホストへの Node.js、npm、PostgreSQL のインストールは不要です。

## 最短起動

前提は Linux、または Windows の WSL2 上の Bash、Docker と Compose、VS Code と Dev Containers 拡張です。初めての場合は [導入](docs/setup.md) を先に読みます。Windows/macOS・VS Code の実操作は、[実測記録](docs/validation.md) の確認済み範囲と分けて扱ってください。

1. ZIP を展開し、そのフォルダを VS Code で開きます。**ホスト側ターミナル**で実行します。

   ```bash
   bash scripts/configure.sh
   bash scripts/doctor.sh
   ```

   `PASS: Docker / Compose / 設定` が目印です。既定のホストポートは `127.0.0.1:55432` です。2 個目のコピーは最初に `bash scripts/configure.sh --port 55433` を使います。各コピーの名前はフォルダから別々に作成します。

2. VS Code のコマンドパレットで **Dev Containers: Reopen in Container** を選びます。初回は固定したイメージを取得し、作業用イメージを自動ビルドします。再接続・再構築は Docker のビルドキャッシュを使います。左下が Dev Container になったらターミナルを開きます。作業場所は `/workspace`、作業ユーザーは `vscode` です。

3. **コンテナ内ターミナル**で、空の DB に構造と架空のデータを入れます。

   ```bash
   bash scripts/db.sh setup
   bash scripts/db.sh check
   bash scripts/db.sh query sql/practice.sql
   ```

   `PASS: SQL CRUD ...` と、架空のノート・鉛筆の 2 行が表示されます。`setup` は再実行できます。適用済み migration はスキップされ、既存の seed 行は上書きされません。

4. 対話的に SQL を実行します。

   ```bash
   bash scripts/db.sh dev
   ```

   ```sql
   SELECT code, name, quantity FROM sample_items ORDER BY code;
   UPDATE sample_items SET quantity = quantity + 1 WHERE code = 'notebook';
   SELECT * FROM sample_items WHERE code = 'notebook';
   \q
   ```

VS Code を使わず試す場合は、**ホスト側**で `bash scripts/project.sh start` → `bash scripts/project.sh db setup` → `bash scripts/project.sh db check` を実行できます。これは Compose の確認であり、VS Code の操作確認とは別です。

## 毎日の操作

|目的|実行場所|コマンド|
|---|---|---|
|前提診断|ホスト|`bash scripts/doctor.sh`|
|起動・再開|ホスト|`bash scripts/project.sh start`|
|通常停止（データ保持）|ホスト|`bash scripts/project.sh stop`|
|コンテナ削除（データ保持）|ホスト|`bash scripts/project.sh down`|
|接続確認|コンテナ|`bash scripts/db.sh doctor`|
|対話 SQL / 開発|コンテナ|`bash scripts/db.sh dev`|
|migration / seed|コンテナ|`bash scripts/db.sh migrate` / `bash scripts/db.sh seed`|
|意味のある SQL 検証|コンテナ|`bash scripts/db.sh check` または `test`|
|再構築|VS Code|**Dev Containers: Rebuild Container**|
|Compose のみで再構築|ホスト|`bash scripts/project.sh rebuild`|
|資源と識別子の確認|ホスト|`bash scripts/project.sh resources`|

VS Code を閉じると `shutdownAction: stopCompose` によりこの構成を停止します。明確に停止するにはホストで `stop` を実行します。再接続は Reopen in Container、設定を変えたときは Rebuild Container を使います。

DB 初期化は通常操作に含めません。[停止・初期化](docs/recovery.md) の対象確認と確認文字列が必要です。

## 次に読むもの

- [導入と接続先](docs/setup.md)：ホストとコンテナの違い、Windows の準備
- [構成を理解して変更する](docs/learning.md)：SQL 演習、列の追加、自分で組み立てる
- [停止・再構築・初期化](docs/recovery.md)：データ保持とこのコピーだけのリセット
- [困ったとき](docs/troubleshooting.md)：ポート、Docker、migration の診断
- [採用版と設計](docs/versions.md) / [実測記録](docs/validation.md)

この構成は架空データのローカル学習用です。DB ロール `otoka` は DDL 演習のため管理権限を持ちます。認証・本番権限設計・公開サーバーの設定は含みません。`.env` にはこのコピー用のローカルパスワードがあるため、Git や配布 ZIP に入れないでください。
