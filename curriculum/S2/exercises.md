# 変更して確かめる

## 1. 画面の見出しを変える

コンテナで`npm run dev`を起動したまま`app/page.tsx`の「ローカル学習メモ」を変えて保存します。ブラウザの見出しが自動で変われば成功です。コンテナを再起動する必要はありません。ブラウザテストの見出しの期待値も合わせます。

## 2. 保存先まで追いかける

ブラウザの開発者ツールのNetworkを開き、本文「　こんにちは📝　」を保存します。POST `/api/notes`の応答が201、返されたbodyの前後空白がないことを確かめます。GET一覧にも同じidがあります。Studioの`notes`と比較します。`lib/note-input.ts`がアプリの入力制約、migration内のCHECKがDBの制約です。

200個の📝は保存でき、201個は入力エラーになります。DBに直接空文字をINSERTした場合も拒否されます。`bash scripts/db.sh test`は管理者で接続した後、`SET LOCAL ROLE anon`で実際の匿名権限を使って試験します。管理者での成功だけをRLSの確認としません。

## 3. メモにカテゴリーを一つ増やす

演習前にソースをバックアップします。新しい`supabase/migrations/20261021000000_add_category.sql`に、`category text not null default '練習'`列を追加するSQLを書きます。既存migrationを書き換えるだけでは、既存DBへ変更が適用されないことを理解します。

ローカルCLIで新規migrationを適用する場合はホストで `.cache/supabase/supabase migration up --local` を実行します。現在のフォルダの`supabase/config.toml`が対象です。クラウドへlink/pushしません。アプリがcategoryを書き込むなら、column grantのINSERT/UPDATE、入力検証、RESTのselect一覧、画面、型、SQL/APIテストも順に変更します。

保存・更新・再読み込みを確認し、`npm run check`、`npm test`、`npm run test:api`、`npm run test:browser`、ホストのDBテストを通します。結果だけでなく、なぜ各層を変更したかを一言ずつメモしましょう。

## 4. 停止と初期化を比べる

架空のメモを1件追加しIDを控えます。通常停止→再開ではそのIDが残ります。Dev Containerの再構築でも残ります。明示resetでは学習メモが消え、架空のseed2件へ戻ります。resetは復旧の最初の手段にしません。通常はエラーと接続設定を確認します。
