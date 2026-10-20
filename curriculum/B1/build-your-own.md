# B1を空フォルダから組み立てる

元のB1を参照用に残し、別の**空フォルダ**を作ります。以下に列挙したファイルを、その都度同じ相対パスへ一つずつ読み写してください。ファイル単位のコピーでも構いませんが、完成フォルダ全体や `.env`、`node_modules`、ビルド出力はコピーしません。親ディレクトリは必要に応じて作成します。版は0.1.2、依存版は同梱lockfileのまま使います。

この教材はNext.jsのAPIだけの構成です。 ホストの準備は参照元の [SETUP.md](SETUP.md) で確認し、Node/npmの操作は段階2以降、コンテナ内で行います。

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

Dockerfileの固定Node/npm、Composeの `/workspace` へのbind mountと依存用volumeを確認します。ホストの新しいフォルダで `bash scripts/configure.sh --port 3402`、続いて `bash scripts/doctor-host.sh` を実行します。3402が使用中なら未使用ポートを指定します。作成済み `.env` を変える場合は直接編集してください。

**次へ進む条件:** 診断OKになり、このコピー固有のPROJECT_NAMEと `http://localhost:3402` が表示されること。ソースはホストの新しいフォルダに保存されると説明できること。

## 2. 固定依存を復元する

<!-- assembly-stage: 2 -->
```text
package.json
package-lock.json
```

VS Codeで新しいフォルダを開き、**Dev Containers: Reopen in Container** を選びます。初回処理が `npm ci` と診断を実行します。

**次へ進む条件:** 「準備完了」が表示され、コンテナ内の `node --version` が `v24.22.0`、`npm --version` が `11.17.0` になること。依存取得エラーがあれば [RECOVERY.md](RECOVERY.md) へ戻ります。

## 3. TypeScriptとNext.jsの設定を置く

<!-- assembly-stage: 3 -->
```text
tsconfig.json
next-env.d.ts
next.config.ts
eslint.config.mjs
```

`package.json` の `check` がESLintと型検査を呼ぶことを確認します。コンテナ内で `node --check eslint.config.mjs` を実行します。Next.jsの型生成を含む全体のcheckは、APIを追加した次の段階で実行します。

**次へ進む条件:** 4ファイルが揃い、ESLint設定の構文検査が終了コード0で終わること。

## 4. 入力処理からAPIを組み立てる

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

ホストからは `http://localhost:3402/api/health` へ接続します。B1には画面、CSS、PostCSS設定を追加しません。

## 5. API契約をテストする

<!-- assembly-stage: 5 -->
```text
tests/server.mjs
tests/api.test.mjs
```

テスト用サーバーを起動・終了する `tests/server.mjs` を先に追加し、それを使うAPI契約テストを追加します。開発サーバーが止まっていることを確認し、コンテナ内で `npm run check`、`npm test`、`npm run build` を順に実行します。

**次へ進む条件:** 3コマンドが終了コード0で終わり、HTTPテスト10件が成功すること。不正JSON、型、空白、Unicodeの200/201境界、Content-Type、HTTPメソッドもテストで確かめられます。

## 6. エディターとCIに同じ入口を置く

<!-- assembly-stage: 6 -->
```text
.vscode/tasks.json
.github/workflows/check.yml
```

**完了条件:** tasksとworkflowが、ここまで実行したcheck/test/buildを呼ぶと確認できること。ファイルの配置やローカル成功だけで実GitHub Actionsも成功したとは扱いません。作成日時、使った版、コマンドと結果を自分の学習メモに残してください。

停止はホストの新しいフォルダで `bash scripts/compose.sh stop`。再開はReopen in Container後に `npm run dev` です。

次の演習では `lib/preview.ts` と対応するテストを一緒に変更し、API契約が変わる場合は [API.md](API.md) にも反映します。
