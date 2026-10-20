# F1 — React + Vite + TypeScript

ブラウザの入力をそのまま画面へ映す、フロントの小さな練習です。API・DB・認証は含みません。入力はブラウザの状態だけにあり、再読み込みで消えます。

## 最短起動

前提はDocker Engine/Compose、VS Code + Dev Containers拡張、bashと標準Unixコマンドです。WindowsはWSL内のフォルダを使います。**ホストのNode/npmは不要です。** 未導入なら [導入案内](docs/SETUP.md) を読みます。初回のイメージ・npm依存取得にはネット接続が必要です。

1. このフォルダ全体を新しい作業場所へ展開します。ホストのターミナルで、そのフォルダへ移動します。
2. ホストで以下を実行します。

```bash
bash scripts/configure.sh
bash scripts/doctor-host.sh
code .
```

3. VS Codeのコマンドパレットで **Dev Containers: Reopen in Container** を選びます。イメージ構築と `npm ci` が完了し、「準備完了」が出るまで待ちます。
4. **コンテナ内** のVS Codeターミナルで実行します。

```bash
npm run doctor
npm run dev
```

5. http://localhost:3000 を開き、ことばを入力して表示とクリアを確かめます。

初回にランダム生成やサンプル再生成はしません。配布物の固定版・lockfileを復元します。コンテナはNode 24.22.0 / npm 11.17.0です。版は [VERSION.json](VERSION.json)、全依存はpackage-lock.jsonで確認します。初回生成ツールは使わず、このソースを手書きで作成しました。

## 日常の操作

開発サーバーのターミナルでCtrl+Cを押すと停止します。同じコンテナで `npm run dev` を実行すれば再開します。ソースを保存すると自動反映されます。コンテナ全体を止める場合は **ホスト** のこのフォルダで `bash scripts/compose.sh stop`、再開はVS Codeの「Reopen in Container」です。Dockerfileを変更した場合は **Dev Containers: Rebuild Container** を選びます。ソースはホストに保持されます。

別コピーを同時に開くときは、元の.envをコピーせず、先に `bash scripts/configure.sh --port 3100` を実行します。識別名とポートは別々に分離されます。既存.envは上書きしません。設定後の変更は.envを編集して再構築します。

## 確認する（コンテナ内）

開発サーバーをCtrl+Cで止めてから、順番に実行します。テストは必要なサーバーを起動し、終了時に停止します。

```bash
npm run check       # ESLint + TypeScript
npm test            # 実際のHTTP応答
npm run test:setup   # 初回・コンテナ再作成後にChromium取得（ネット接続が必要）
npm run test:browser # 画面の実操作
npm run build       # 配布用ビルド
```

起動中のサーバーに試験する場合、コンテナ内で `TEST_BASE_URL=http://localhost:3000 npm test` と指定できます。このURLにある対象を試験するため、自分の開発サーバーであることを確認します。画面付き構成の `test:browser` も同じ環境変数を使います。

通常のnpm testはHTMLとJavaScript入口の疎通です。入力・クリア・再読み込み・HTML文字扱いはtest:browserで実測します。

CIは同じcheck/test/buildを呼びます。workflowの同梱と、GitHub Actionsの実行成功は別です。[実測記録](VALIDATION.md)を確認してください。ホストのループバックだけにポートを公開する開発用サンプルであり、本番向け認証やデプロイ設定は含みません。

## 構成と教材

src/App.tsx: 入力と表示 / src/main.tsx: Reactの入口 / src/style.css: 見た目 / vite.config.ts: Viteの設定

- [構成と保存先](docs/ARCHITECTURE.md)
- [変更の演習](docs/EXERCISES.md)
- [空フォルダから組み立てる](docs/BUILD-YOUR-OWN.md)
- [停止・再開、設定不足やポート競合の復旧](docs/RECOVERY.md)
- [実測結果と未確認の環境](VALIDATION.md)
