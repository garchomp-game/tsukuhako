# 構成を理解して変更する

## ファイルの役割

|ファイル|役割|
|---|---|
|`compose.yaml`|作業用 `app` と DB、接続先、localhost の公開ポート、永続 volume|
|`.devcontainer/devcontainer.json`|VS Code の接続先、ユーザー、初回の接続診断|
|`.devcontainer/Dockerfile`|固定版の psql を持つ非 root 作業環境|
|`migrations/001_create_sample_items.sql`|テーブル、空文字・長さ・個数・重複の制約|
|`sql/seed.sql`|架空の初期データ。重複を作らず既存行を保持|
|`sql/practice.sql`|保存して繰り返し実行する練習用 SQL|
|`tests/semantics.sql`|取得・更新・削除・制約違反を確認し、テスト変更を rollback|
|`scripts/`|設定、診断、起動停止、migration と検証の入口|

## 演習 1: 保存した SQL を変更する

1. コンテナ内で `bash scripts/db.sh query sql/practice.sql` を実行します。
2. `sql/practice.sql` の `SQLの練習` を `在庫を調べる` に変えて保存します。
3. 同じコマンドをもう一度実行します。`lesson` 列に新しい文字列が出れば、ソース変更が反映されています。

SQL ファイルは実行時に読み込まれるため、Web の自動再読込やアプリの再起動はありません。学習者が保存して再実行する仕様です。

## 演習 2: 制約を確かめる

`bash scripts/db.sh dev` で psql を開きます。

```sql
UPDATE sample_items SET quantity = 10 WHERE code = 'notebook';
SELECT name, quantity FROM sample_items ORDER BY code;
INSERT INTO sample_items (code, name, quantity) VALUES ('bad', '失敗例', -1);
\q
```

負数の INSERT は `check constraint` のエラーになります。既存の正しい行は残ります。名前は前後の通常の空白を除いて 1〜80 文字、code は英小文字から始まる英小文字・数字・ハイフンの 1〜40 文字です。PostgreSQL の `char_length` は絵文字の組合せ等で見た目の一文字と異なることがあります。

## 演習 3: 列を migration として追加する

適用済みの `001_...sql` を編集せず、`migrations/002_add_note.sql` を作ります。

```sql
ALTER TABLE public.sample_items
ADD COLUMN note text NOT NULL DEFAULT '';
```

コンテナ内で次を実行します。

```bash
bash scripts/db.sh migrate
bash scripts/db.sh dev
```

```sql
UPDATE sample_items SET note = '列を追加できた' WHERE code = 'notebook';
SELECT code, note FROM sample_items ORDER BY code;
\q
```

`migrate` をもう一度実行しても列は重複追加されません。`schema_migrations` にファイル名と SHA-256 が記録されます。適用済みファイルの変更はエラーにし、追加の migration で履歴を残します。検証へ note の保存確認を追加し、`bash scripts/db.sh check` で確認します。例の追加列は NOT NULL DEFAULT 付きなので既存行を失いません。

## 空フォルダから組み立てる順番

1. `compose.yaml` に PostgreSQL の固定イメージ、DB 名、健康確認、named volume を定義します。18 系では volume を `/var/lib/postgresql` に付けます。
2. 同じイメージを基にした Dockerfile で作業ユーザーを作り、`app` のコマンドを `sleep infinity` にします。SQL の実行場所と DB の保存場所を分けます。
3. ソースの bind mount と `PGHOST=db` を追加します。ホストに公開する DB ポートは `127.0.0.1` に限定します。
4. Dev Container 設定に `service: app`、`workspaceFolder: /workspace`、非 root ユーザーを指定します。
5. 設定生成と診断、migration、seed、意味のある SQL テストを順に加えます。作った構成をこのテンプレートと比較します。

この順で小さく動かし、接続ができてから DB の構造を増やします。型チェックとアプリビルドは SQL 作業基盤では対象外で、代わりに DB への実接続と SQL の結果・制約を確認します。
