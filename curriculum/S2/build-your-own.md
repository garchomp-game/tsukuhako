# 空フォルダから組み立てる

元のフォルダを残し、別フォルダで学ぶ演習です。配布版の最短起動とは区別します。

1. `.devcontainer/Dockerfile`を読み、Node/npmとブラウザ試験ライブラリの役割を確認します。`compose.yaml`はソース・依存volume・localhostポート・Supabase専用networkを結びます。
2. `.devcontainer/devcontainer.json`と`scripts/configure.sh`、`initialize.sh`、`doctor-host.sh`、`check-settings.sh`、`doctor.mjs`、`app.sh`を追加します。`initialize.sh`がホストでimageを作り、`postCreateCommand`がコンテナでnpm ciを行う場所の違いを説明してみましょう。doctorが呼ぶ設定検証のファイルも必要です。
3. `supabase/config.template.toml`、migration、seed、`scripts/db.sh`、`.env.example`を加えます。configureで別IDと別ポートを準備し、db startが新しいDBだけを作ることを確認します。
4. `package.json`・lockfile・TypeScript/ESLint/PostCSS設定を加え、Dev Containerを開きます。固定版から依存が復元されたら準備完了です。
5. `lib/note-input.ts`から入力規則を作り、単体テストを加えます。`lib/database.ts`はサーバー専用接続、`lib/http.ts`はHTTP入力と安全なエラー応答を担当します。`app/api/notes/route.ts`と`app/api/notes/[id]/route.ts`を追加して一覧・作成・更新・削除へつなぎます。匿名キー以上の権限が不要な理由をSQLのgrantと比較します。
6. layout/page/notes/CSSを加え、画面→API→DB→一覧を動かします。見出し変更の自動反映と、再読込でデータが残ることを確かめます。
7. `tests/database.sql`、`tests/input.test.mjs`、`tests/api.test.mjs`、`tests/browser/notes.spec.ts`と`playwright.config.ts`を追加します。`scripts/managed-server.mjs`、`scripts/test-integration.mjs`、`tests/managed-server.test.mjs`も加えて、`npm test`と`npm run test:integration`が成功し、終了ログにprocessGroupTerminated/portBindableがtrueと出ることを確認します。続いてCI定義を加え、HTTP→画面試験→終了確認→buildの順を読みます。CIファイルの存在と実CI実行は別です。
8. 通常停止、再構築、最後に専用試行DBの明示リセットを比べます。ソースとDBの寿命を別々に説明できれば、この演習の到達点です。
