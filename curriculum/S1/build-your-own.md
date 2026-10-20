# S1を空フォルダから組み立てる

元のS1を参照用に残し、別の**空フォルダ**を作ります。以下に列挙したファイルを、その都度同じ相対パスへ一つずつ読み写してください。ファイル単位のコピーでも構いませんが、完成フォルダ全体や `.env`、`node_modules`、ビルド出力はコピーしません。親ディレクトリは必要に応じて作成します。版は0.1.2、依存版は同梱lockfileのまま使います。

APIを先に確認し、そのAPIへ送信するフォームとページを組み立てます。 ホストの準備は参照元の [SETUP.md](SETUP.md) で確認し、Node/npmの操作は段階2以降、コンテナ内で行います。

## 1. 作業環境と保存場所を用意する

<!-- assembly-stage: 1 -->
```text
.devcontainer/Dockerfile
compose.yaml
.devcontainer/devcontainer.json
.dockerignore
.gitignore
.gitattributes
.env.example
.npmrc
.nvmrc
VERSION.json
scripts/configure.sh
scripts/doctor-host.sh
scripts/compose.sh
scripts/doctor.mjs
scripts/initialize.sh
docs/SETUP.md
docs/RECOVERY.md
```

Dockerfileの固定Node/npm、Composeの `/workspace` へのbind mountと依存用volumeを確認します。ホストの新しいフォルダで `bash scripts/configure.sh --port 3403`、続いて `bash scripts/doctor-host.sh` を実行します。3403が使用中なら未使用ポートを指定します。作成済み `.env` を変える場合は直接編集してください。

**次へ進む条件:** 診断OKになり、このコピー固有のPROJECT_NAMEと `http://localhost:3403` が表示されること。ソースはホストの新しいフォルダに保存されると説明できること。

## 2. 固定依存を復元する

<!-- assembly-stage: 2 -->
```text
package.json
package-lock.json
```

VS Codeで新しいフォルダを開き、**Dev Containers: Reopen in Container** を選びます。初回処理が `npm ci` と診断を実行します。

**次へ進む条件:** 「準備完了」が表示され、コンテナ内の `node --version` が `v24.22.0`、`npm --version` が `11.17.0` になること。依存取得エラーがあれば [RECOVERY.md](RECOVERY.md) へ戻ります。

## 3. TypeScript・Next.js・Tailwindの設定を置く

<!-- assembly-stage: 3 -->
```text
tsconfig.json
next-env.d.ts
next.config.ts
eslint.config.mjs
postcss.config.mjs
```

`package.json` の `check` がESLintと型検査を呼ぶこと、PostCSS設定がTailwindを読み込むことを確認します。コンテナ内で `node --check eslint.config.mjs` と `node --check postcss.config.mjs` を実行します。全体のcheckはAPI追加後に実行します。

**次へ進む条件:** 5ファイルが揃い、2つの構文検査が終了コード0で終わること。

## 4. 入力処理とAPIを先に確認する

<!-- assembly-stage: 4 -->
```text
lib/preview.ts
app/api/health/route.ts
app/api/preview/route.ts
docs/API.md
```

最初に `lib/preview.ts` を追加します。Content-Type、JSON、文字列、空白、200コードポイント上限の順に確認する処理です。続いてhealthのRoute Handler、最後に入力処理をimportするpreviewのRoute Handlerを追加します。`app/api/preview/route.ts` の `../../../lib/preview` が段階の先頭で作ったファイルを指すことを確認してください。この段階はAPIのURLで動作を確認します。

コンテナ内で `npm run check`、続いて `npm run dev` を実行します。別のコンテナ内ターミナルで確認します。

```bash
curl -i http://localhost:3000/api/health
curl -i http://localhost:3000/api/preview -H 'Content-Type: application/json' --data '{"text":"  こんにちは  "}'
curl -i http://localhost:3000/api/preview -H 'Content-Type: application/json' --data '{"text":"   "}'
```

**次へ進む条件:** checkが成功し、healthは200と `{"status":"ok"}`、previewは200と `{"text":"こんにちは","length":5}`、空白だけの入力は400と `INVALID_INPUT` を返すこと。確認後、開発サーバーをCtrl+Cで止めます。

## 5. フォームからページを組み立てる

<!-- assembly-stage: 5 -->
```text
app/globals.css
app/layout.tsx
components/PreviewForm.tsx
app/practice/page.tsx
app/page.tsx
```

CSSを先に追加し、それを読み込む共通layoutを追加します。次に `components/PreviewForm.tsx` を追加します。ここが入力、送信中、成功、失敗の状態を持ち、`/api/preview` にPOSTするClient Componentです。

フォームを作ってから、それを `../../components/PreviewForm` で読み込む練習ページを追加します。最後にトップページと練習ページへのリンクを追加します。`lib/preview.ts` はサーバー側の検証、`components/PreviewForm.tsx` は画面側の状態と通信という役割の違いを確認します。

コンテナ内で `npm run check`、続いて `npm run dev`。ホストのブラウザで **http://localhost:3403** を開きます。Next.jsの開発画面は `localhost` を使ってください。

**次へ進む条件:** 「練習画面へ」から移動でき、前後に空白を付けた「こんにちは」を送信すると「こんにちは」と「5 コードポイント」が表示されること。空欄の送信ではエラーが表示され、入力を直して再送信できること。「クリア」で入力と結果が消え、トップへ戻れること。

## 6. APIとブラウザ操作をテストする

<!-- assembly-stage: 6 -->
```text
tests/server.mjs
tests/api.test.mjs
playwright.config.ts
tests/browser/preview.spec.ts
```

起動中の `npm run dev` をCtrl+Cで止めます。コンテナ内で `npm run check`、`npm test`、`npm run test:setup`、`npm run test:browser`、`npm run build` を順に実行します。APIテストとブラウザテストは、それぞれ専用サーバーを起動して終了します。

**次へ進む条件:** 各コマンドが終了コード0で終わり、HTTPテスト10件、ブラウザテスト5件が成功すること。ブラウザ試験には実APIへの送信、入力エラーからの復旧、二重送信防止、通信失敗と再試行、script形の文字列を文字として表示する確認があります。通信失敗や500応答は試験内で再現します。

## 7. エディターとCIに同じ入口を置く

<!-- assembly-stage: 7 -->
```text
.vscode/tasks.json
.github/workflows/check.yml
```

**完了条件:** tasksとworkflowが、ここまで実行したcheck/test/buildを呼ぶと確認できること。ファイルの配置やローカル成功だけで実GitHub Actionsも成功したとは扱いません。作成日時、使った版、コマンドと結果を自分の学習メモに残してください。

停止はホストの新しいフォルダで `bash scripts/compose.sh stop`。再開はReopen in Container後に `npm run dev` です。

次の演習ではAPIの入力制限とフォームの案内を揃えて変更し、関連テストと [API.md](API.md) にも反映します。
