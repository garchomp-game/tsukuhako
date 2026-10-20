# 空フォルダから組み立てる演習

元のフォルダを残し、別の空フォルダで順番に試します。これは学習用です。配布版のlockfileを使う最短起動とは区別します。

1. `.devcontainer/Dockerfile`、`compose.yaml`、`.devcontainer/devcontainer.json`、`scripts/`、`.env.example` を順に読み写します。Dockerfileだけではソースの保存場所は決まらず、Composeのmountが必要であることを確かめます。
2. `package.json` と `package-lock.json` を追加します。固定版を使い、ホストでconfigure後にDev Containerを開きます。初回の `npm ci` が成功すれば道具と依存の準備が完了です。
3. `tsconfig.json` とESLint設定を加え、`app/`（F1は `src/` とindex.html、Vite設定）を一ファイルずつ加えます。各ページ/Route Handlerの役割をREADMEと照合します。
4. UI構成ではCSSとPostCSS設定を加え、B1ではAPIにUIが不要なことを確認します。`npm run dev` でブラウザ/HTTP応答を確認します。
5. `tests/` とテスト設定を追加し、`npm run check`、`npm test`、`npm run build`。不正入力テストを一度失敗させ、コードを直して合格へ戻します。
6. `.vscode/tasks.json` と `.github/workflows/check.yml` を加え、同じコマンドがエディターとCIから呼ばれる関係を確認します。workflowを置くだけでは実CIの成功にはなりません。

サンプルを自分の機能へ置き換える際は、ページ/API→関連テスト→教材の順に変更し、Docker設定とlockfileを理由なく削除しないようにします。DB付き構成へ変える場合は永続volume、migration、権限を別途設計します。
