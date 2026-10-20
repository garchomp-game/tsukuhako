# S1 — Next.js + Route Handlers + Tailwind

画面から同じアプリのAPIを呼び、送信中・成功・入力エラー・通信失敗を確かめる練習です。入力と応答は保存せず、DB・認証・クラウド接続は含みません。

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

5. http://localhost:3003 を開き、「練習画面へ」→ことばを入力→「プレビューを送信」と進みます。空白を除いた入力と文字数が出ます。空欄を送ると理由が表示されます。

初回にランダム生成やサンプル再生成はしません。配布物の固定版・lockfileを復元します。コンテナはNode 24.22.0 / npm 11.17.0です。版は [VERSION.json](VERSION.json)、全依存はpackage-lock.jsonで確認します。初回生成ツールは使わず、このソースを手書きで作成しました。

## 日常の操作

開発サーバーのターミナルでCtrl+Cを押すと停止します。同じコンテナで `npm run dev` を実行すれば再開します。ソースを保存すると自動反映されます。コンテナ全体を止める場合は **ホスト** のこのフォルダで `bash scripts/compose.sh stop`、再開はVS Codeの「Reopen in Container」です。Dockerfileを変更した場合は **Dev Containers: Rebuild Container** を選びます。ソースはホストに保持されます。

別コピーを同時に開くときは、元の.envをコピーせず、先に `bash scripts/configure.sh --port 3103` を実行します。識別名とポートは別々に分離されます。既存.envは上書きしません。設定後の変更は.envを編集して再構築します。

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

npm testは正常入力、前後空白、不正JSON、入力型、空文字、200/201コードポイント、Content-Type、未対応メソッド、HEAD/OPTIONSを実HTTPで確認します。

CIは同じcheck/test/buildを呼びます。workflowの同梱と、GitHub Actionsの実行成功は別です。[実測記録](VALIDATION.md)を確認してください。ホストのループバックだけにポートを公開する開発用サンプルであり、本番向け認証やデプロイ設定は含みません。

## 構成と教材

app/page.tsx: トップ / app/practice/page.tsx: 練習画面 / components/PreviewForm.tsx: ブラウザの操作 / app/api/: APIの入口 / lib/preview.ts: 入力検証

- [構成と保存先](docs/ARCHITECTURE.md)
- [変更の演習](docs/EXERCISES.md)
- [空フォルダから組み立てる](docs/BUILD-YOUR-OWN.md)
- [停止・再開、設定不足やポート競合の復旧](docs/RECOVERY.md)
- [実測結果と未確認の環境](VALIDATION.md)
- [API契約・呼び出し例](docs/API.md)
