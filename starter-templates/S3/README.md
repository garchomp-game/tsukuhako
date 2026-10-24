# S3 — Supabaseの公開カタログを読む

専用の学習用Supabaseクラウドから、架空の商品名と価格を読取り専用で表示する追加テンプレートです。書き込み、ログイン、アカウント/プロジェクト自動作成は含みません。**実クラウド接続は接続先未提供のためBLOCKED**。設定なしでも起動・型・ビルド・安全な失敗表示・ローカルSQL権限試験を確認できます。

## 設定なしで起動する

前提はLinux/WSLのbash・Docker/Compose、VS CodeとDev Containers拡張です。[初期導入の案内](docs/SETUP.md)を確認してください。ホストNode/npmは不要です。

1. 新しいフォルダへ展開し、ホストで `bash scripts/configure.sh` → `bash scripts/doctor-host.sh`。
2. VS Codeでこのフォルダを開き、**Dev Containers: Reopen in Container**。初回の依存復元を待ちます。
3. コンテナ内で `npm run dev`。ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。
4. 「接続設定から始めましょう」が表示されれば、クラウドなしの初回起動は成功です。設定不足を接続成功と扱いません。

## 専用クラウドへ接続する（利用者が行う）

既存の本番DBや個人データが入ったプロジェクトには、このSQLを適用しません。新しい空の学習用プロジェクトを利用者が用意した場合だけ、次を行います。この試作作業ではアカウント・クラウドプロジェクトを作成していません。

1. `sql/public-catalog.sql`を読み、選択中のプロジェクトが専用の空DBであることを確認して、そのSQL Editorで実行します。同名tableがある場合はエラーで止まり、上書きしません。
2. DashboardのConnectまたはSettings > API Keysから **Project URLとpublishableキー** を確認します。既存のanonキーも対応します。secret/service_roleキーは使用せず、アプリも拒否します。
3. このフォルダの`.env.local`に次の2項目を設定します。例は`.env.example`にもあります。実値をGitやZIPへ入れません。

   ```dotenv
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_PUBLIC_KEY=sb_publishable_replace_me
   ```

4. コンテナで開発サーバーをCtrl+Cで止め、`npm run doctor` → `npm run dev`。公開の架空商品2件が表示されることを確認します。3件目はRLSで非表示です。
5. 読取りに失敗したら、URL・公開キー・table名・SELECT grant・RLS policyを順に確認します。強いキーへ置き換えて解決しません。

キーはNextサーバーだけで読み、ブラウザへ渡しません。それでも匿名相当の公開キーだけを採用し、権限の確認を省略しません。公開キーは利用者の認証ではありません。[Supabase公式API keys](https://supabase.com/docs/guides/getting-started/api-keys)と[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)を参照してください。

## 操作と検証

|場所|コマンド|目的|
|---|---|---|
|ホスト|`bash scripts/doctor-host.sh`|Docker・ポート・識別子・シェル環境の競合を診断|
|コンテナ|`npm run doctor`|ツールと設定を確認。未設定は案内、強いキーは拒否|
|コンテナ|`npm run check`|Route型生成・TypeScript・ESLint|
|コンテナ|`npm test`|公開キー制限、設定不足、GET限定、取得成功/空/通信失敗/形式違い|
|ホスト|`bash scripts/test-sql.sh`|隔離した一時PostgreSQLでanon SELECT許可・I/U/D拒否、RLSを別々に確認|
|コンテナ、dev停止後|`npm run build`|接続設定なしでもビルド。公開/デプロイしない|
|ホスト|`bash scripts/app.sh stop`|このフォルダのappを通常停止|

SQL試験は固定PostgreSQL 18.6 imageを使い、ホストポート・永続volume・ホストmountを持たない一時コンテナを作ります。初回だけimage取得が必要です。終了時にその試験コンテナを停止・削除します。クラウドへの操作や本番DBのresetは行いません。Supabase 17.11の隔離DBでも同じ権限試験を実測しています。

[構成](docs/ARCHITECTURE.md) → [変更演習](docs/EXERCISES.md) → [組立演習](docs/BUILD-YOUR-OWN.md) → [停止・復旧](docs/RECOVERY.md)。採用版はVERSION.json、実測と未確認はVALIDATION.md。クラウドのAuth付きCRUDはこの構成とは別の仕様です。
