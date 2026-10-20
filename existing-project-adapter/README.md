# 既存 Next.js プロジェクトへの Dev Container 設定追加 0.1.1（限定試作）

既存構成を読み取り、根拠を示して `.devcontainer/` だけへ設定を追加します。初版の自動適用は、単一の Next.js 16.4.x、整合する npm lockfile、Node 24.22.0 / npm 11.17.0 を使える構成に限定しています。実際の利用者プロジェクトを変更する試験は行っていません。

判定器の実行には **ホスト Node.js 24 系**が必要です。この機械では nvm を利用します。外部 npm 依存はないので `npm install` は不要で、`node cli.mjs` で実行できます。生成された環境を使う段階は Bash と Docker / Compose、VS Code Dev Containers で成立します。

## 読み取りと提案

adapter フォルダのターミナルで実行します。対象パスに空白がある場合は引用符で囲みます。

```bash
node cli.mjs inspect "/path/to/project"
node cli.mjs recommend "/path/to/project"
node cli.mjs preview "/path/to/project" --out "/path/to/review/next-plan.json" --port 3091
```

`inspect` は detected（何を検出したか）と applySupported（自動適用に対応するか）を別に返します。React だけの構成を Vite と決めつけません。対象外なら reasons に根拠と次の手動手順を示します。`recommend` は適合する候補、`preview` は追加する全ファイル、固定版、ポート、後の起動時に実行される内容を表示します。

ここまでは対象プロジェクトへ書き込みません。提案の保存先はプロジェクトの外に指定します。保存済みファイルは上書きしません。提案にはパス・hash・生成内容が含まれるため、公開する場合は個人のパスを除いてください。

`package.json` と lockfile は JSON として読み、Next/Vite の設定は存在と hash を確認します。JS/TS 設定を import/eval したり、npm install、npx、build、コンテナ起動を判定のために実行したりしません。`.env` は Compose の予約キー名の有無だけを確認し、値や値の hash は収集・出力しません。認証情報、node_modules、.git、ビルド出力は走査・収集しません。

## 内容を確認して適用する

preview のファイル内容と起動時の処理を確認し、対象と提案を指定して実行します。

```bash
node cli.mjs apply "/path/to/project" --plan "/path/to/review/next-plan.json"
```

`applied` が成功です。追加一覧と次の手順を返します。適用はファイル追加だけで、依存取得や開発サーバー起動は行いません。アプリコード、package scripts、lockfile、Next/Vite/TypeScript 設定、CI、`.env` は変更しません。

判定に使ったファイル、存在状態、rootの位置が提案後に変わった場合は停止します。既存 `.devcontainer/`、追加先の出現、symlink、パス改変も拒否します。手動選択や `force` で検査を迂回する導線はありません。同じ提案・同じ入力・同じ生成物なら、再適用は `unchanged` で終了します。

## 追加した環境を使う

1. 対象プロジェクトの `.devcontainer/README.md` を読みます。
2. VS Code で対象フォルダを開き、**Dev Containers: Reopen in Container**。
3. 初回は固定イメージの作業環境をビルドし、コンテナ内で `npm ci --no-audit --no-fund` を実行します。既存プロジェクト・依存パッケージの install lifecycle script が動く場合があります。
4. コンテナ内で `npm run dev -- --hostname 0.0.0.0 --port 3000` を実行します。ホストの `http://localhost:3091`（提案したポート）で確認します。
5. ソースを変更して保存し、反映を確認します。静的確認・テスト・build は元プロジェクトの手順に従います。

Linux 上で CLI による実起動を確認します。VS Code 実操作と Windows/WSL/macOS は独立した未検証項目です。Next.js や npm lifecycle が通常の起動処理で生成・更新するファイルは、adapter の適用時の変更とは分けて確認してください。

## 取り消す

対象プロジェクトのホスト端末で `bash .devcontainer/manage.sh stop` により作業コンテナを停止した後、実行します。起動と停止/削除の入口は project と Compose ファイルを固定し、`COMPOSE_ENV_FILES` を含む予約 Compose 環境変数や、相反する `COMPOSE_PROJECT_NAME` / `PROJECT_NAME` / `HOST_PORT` を引き継いだ場合は拒否します。

```bash
node cli.mjs undo "/path/to/project"
```

追加したファイルのうち、適用時の内容と一致するものだけを削除します。利用者の編集・追記・新しいファイルは保持し、`partial-preserved` と残したパスを表示します。取り消しのために既存のアプリを巻き戻したり、Docker の volume や image を削除したりしません。適用記録が壊れている場合は自動削除を停止します。0.1.1 では `.adapter-record.json` / `.adapter-pending.json` 自体にも内容 hash を付け、`userNote` の追記や改行・整形の変更があれば記録をそのまま保持し、残したパスを表示します。パス・生成物の hash 等の管理情報が変わった場合は削除全体を停止します。通常の生成設定の編集保護も継続します。記録の hash は変更検出用で、電子署名ではありません。

0.1.0 の提案・記録は0.1.1で自動移行・削除しません。以前の設定を保存し、所有者が確認したうえで新しく提案してください。既存の `.devcontainer/` を上書きする操作はありません。

## 対応範囲と制約

|検出した構成・問題|初版の扱い|
|---|---|
|単一 Next.js 16.4.x + package-lock v2/3 + 既知の dev script|静的検査を通れば提案可能|
|Vite、Reactのみ、一般Node|検出のみ。F1 または手動構成を案内|
|monorepo / workspaces、ローカル・git等の直接依存（optionalを含む）|自動適用対象外。対象アプリと依存関係を整理|
|既存Docker / Compose / Dev Container|既存ファイルを保護し、再利用の手動確認へ|
|複数lockfile、package/lock不整合、Node/npm矛盾|利用者が方針を整理してから再提案|
|独自 dev script、未対応版・複雑な版範囲・runtime alias|推測せず手動確認|
|symlinkのroot/入力/出力|実体パスへ整理するまで拒否|

認識する dev script は `next dev` と、固定された少数の hostname/turbopack 形です。Node/npm の版指定は exact、major、3要素が揃った比較・caret/tilde 等の小さな文法で判定します。`>24` や `<=24.22` など省略された比較子は npm の意味を推測せず対象外にします。未知の構文も同じ扱いです。lockfile の直接依存と宣言は比較しますが、全 transitive dependency の完全検証は npm ci で別に行います。設定 JS の実行結果や独自の npm 設定まで静的に保証するものではありません。


`dependencies` / `devDependencies` / `optionalDependencies` の直接依存を確認します。同名の `dependencies` は npm の仕様に従って `optionalDependencies` が上書きするため、有効な optional 宣言と lock の解決版を検査します。npm が lock の root dependencies から上書きされた項目を除く形にも対応します。optional と dev の同名重複は初版では手動確認へ回します。

通常の registry 版指定で、lock に整合する解決版があれば、optional であることや `os` / `cpu` 制限だけを理由に拒否しません。対象OSで省略された場合にアプリが動くかは、利用者の起動確認が必要です。lock の解決版が欠ける optional は手動確認へ回します。file/link/workspace/git/直接URL等の参照、lock の link やローカル解決先は対象外です。判定のために兄弟フォルダを読み込んだり mount を追加したり、package/lock を修正することはありません。

適用時は生成物を同じファイルシステムの一時ディレクトリで完成させます。排他的に `.devcontainer/` を確保し、上書きしない hard link で配置して記録します。単純な directory rename は同時作成された空ディレクトリを置換しうるため採用していません。複数ファイルが全体で原子的になるとは扱わず、途中失敗を検出したら作成済みの未変更ファイルを戻します。強制終了時に pending 記録が残った場合は、内容を確認して undo で復旧できます。適用・取り消しの間は対象設定を別プロセスで編集しないでください。

## 検証

```bash
npm run check
```

Node の標準テストランナーで E01〜E11 の fixture を作成して確認します。生成環境の E12 は別の専用 Next.js fixture で実行し、判定処理に依存取得を混ぜません。[検証記録](VALIDATION.md) と全体パックの `validation/revision-0.1.1/adapter/` に今回のコマンド・終了コード・hash・結果があります。0.1.0 の証拠は `validation/adapter/` に残しています。

公式資料の確認日: 2026-10-20。

- [npm semver の範囲比較](https://github.com/npm/node-semver/blob/main/classes/range.js)
- [npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/)
- [optionalDependencies と同名依存の優先関係](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#optionaldependencies)
- [package-lock の解決情報と OS/CPU 制限](https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json/#packages)
- [npm の package spec](https://docs.npmjs.com/cli/v11/using-npm/package-spec/)
- [Node.js file system API](https://nodejs.org/api/fs.html)
- [Dev Container の作成](https://code.visualstudio.com/docs/devcontainers/create-dev-container)
