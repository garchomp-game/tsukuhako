# F1を空フォルダから組み立てる

元のF1を参照用に残し、別の**空フォルダ**を作ります。以下に列挙したファイルを、その都度同じ相対パスへ一つずつ読み写してください。ファイル単位のコピーでも構いませんが、完成フォルダ全体や `.env`、`node_modules`、ビルド出力はコピーしません。親ディレクトリは必要に応じて作成します。版は0.1.3、依存版は同梱lockfileのまま使います。

F1はReactとViteで入力を画面に表示する構成です。CSSは通常のCSSファイルとして読み込みます。TailwindやPostCSS設定を作る段階はありません。 ホストの準備は参照元の [SETUP.md](SETUP.md) で確認し、Node/npmの操作は段階2以降、コンテナ内で行います。

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

Dockerfileの固定Node/npm、Composeの `/workspace` へのbind mountと依存用volumeを確認します。ホストの新しいフォルダで `bash scripts/configure.sh --port 3400`、続いて `bash scripts/doctor-host.sh` を実行します。3400が使用中なら未使用ポートを指定します。作成済み `.env` を変える場合は直接編集してください。

**次へ進む条件:** 診断OKになり、このコピー固有のPROJECT_NAMEと `http://localhost:3400` が表示されること。ソースはホストの新しいフォルダに保存されると説明できること。

## 2. 固定依存を復元する

<!-- assembly-stage: 2 -->
```text
package.json
package-lock.json
```

VS Codeで新しいフォルダを開き、**Dev Containers: Reopen in Container** を選びます。初回処理が `npm ci` と診断を実行します。

**次へ進む条件:** 「準備完了」が表示され、コンテナ内の `node --version` が `v24.22.0`、`npm --version` が `11.17.0` になること。依存取得エラーがあれば [RECOVERY.md](RECOVERY.md) へ戻ります。

## 3. TypeScript・ESLint・Viteを設定する

<!-- assembly-stage: 3 -->
```text
tsconfig.json
eslint.config.mjs
vite.config.ts
```

`package.json` の `check` がESLintと型検査を呼ぶこと、Vite設定がReactプラグインを使うことを確認します。コンテナ内で `node --check eslint.config.mjs` を実行します。

**次へ進む条件:** 3ファイルが揃い、ESLint設定の構文検査が終了コード0で終わること。

## 4. CSS、コンポーネント、画面の入口を追加する

<!-- assembly-stage: 4 -->
```text
src/style.css
src/App.tsx
src/main.tsx
index.html
```

まず見た目のCSSと入力状態を持つAppを作ります。次に両方をimportしてReactを描画する `src/main.tsx`、最後にその入口を読み込む `index.html` を追加します。`src/main.tsx` のimport先2つと、HTMLの `#root` が存在することを確かめます。

コンテナ内で `npm run check`、続いて `npm run dev`。ホストのブラウザで **http://localhost:3400** を開きます。

**次へ進む条件:** checkが成功し、「表示することば」に書いた内容が同時に「いまの表示」へ反映されること。「クリア」で入力が消え、再読み込みでも入力が消えること。この入力はブラウザ内の状態として扱われます。

## 5. HTTPとブラウザ操作をテストする

<!-- assembly-stage: 5 -->
```text
tests/server.mjs
tests/http.test.mjs
playwright.config.ts
tests/browser/input.spec.ts
```

起動中の `npm run dev` をCtrl+Cで止めます。コンテナ内で `npm run check`、`npm test`、`npm run test:setup`、`npm run test:browser`、`npm run build` を順に実行します。テスト用サーバーの補助ファイルと設定を、それを使うテストより先に追加します。

**次へ進む条件:** 各コマンドが終了コード0で終わり、HTTPテスト1件、ブラウザテスト2件が成功すること。入力・クリア・再読み込みと、script形の文字列を文字として表示する動作を確かめられます。

## 6. エディターとCIに同じ入口を置く

<!-- assembly-stage: 6 -->
```text
.vscode/tasks.json
.github/workflows/check.yml
```

**完了条件:** tasksとworkflowが、ここまで実行したcheck/test/buildを呼ぶと確認できること。ファイルの配置やローカル成功だけで実GitHub Actionsも成功したとは扱いません。作成日時、使った版、コマンドと結果を自分の学習メモに残してください。

停止はホストの新しいフォルダで `bash scripts/compose.sh stop`。再開はReopen in Container後に `npm run dev` です。

次の演習では `src/App.tsx` の表示と関連テストを一緒に変更します。
