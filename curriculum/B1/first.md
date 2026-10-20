# B1：最初の一歩

![ツクハコの目印](asset:learning-cycle)

## この章の進め方

生成完了画面の保存先とポートを使います。下のコマンドは標準ポートの例です。秘密値はアプリに貼り付けず、生成先の.envで管理してください。

[開発準備](lesson:setup/overview)を確認し、プロジェクトをVS Codeで開きます。Windowsでは選択したWSLの通常ユーザーで操作してください。

## 1. 準備と、このプロジェクトの設定を確認する

場所：開発ホストのターミナル（Windowsは選択したWSL内。PowerShellでは実行しません）。このプロジェクトのフォルダで行います。

確認できる結果：診断OK と、このプロジェクトのURLが表示されます。

不足があれば、次の準備手順を確認してください。生成済みの.envを最初から作り直す必要はありません。

```sh
'bash' 'scripts/doctor-host.sh'
```

[docs/SETUP.md](docs/SETUP.md)

## 2. VS Codeでフォルダを開き、Dev Containers: Reopen in Containerを実行する

場所：VS Codeの編集画面。このプロジェクトのフォルダで行います。

確認できる結果：VS Code左下にDev Containerへの接続が表示され、/workspaceのファイルが開きます。

生成完了画面の「VS Codeで開く」を押します。VS CodeでCtrl+Shift+P（macOSはCmd+Shift+P）を押し、Dev Containers: Reopen in Containerを検索して選びます。自身が生成したフォルダを確認して信頼します。初回のイメージ・依存取得を待ちます。

## 3. 開発サーバーを起動する

場所：VS CodeのDev Container内ターミナル。/workspaceで行います。

確認できる結果：Ready が表示されます。ブラウザでは下記のホスト側URLを使います。

Dev Containerへの接続後、VS Codeの「ターミナル」→「新しいターミナル」で実行します。pwd が /workspace であることを確認します。このターミナルを起動したまま、次の確認・編集へ進みます。

```sh
'npm' 'run' 'dev'
```

## 4. 変更前のJSONを確認する

場所：開発ホストのターミナル（Windowsは選択したWSL内。PowerShellでは実行しません）。このプロジェクトのフォルダで行います。

```sh
'curl' '-i' 'http://localhost:3002/api/health'
```

## 5. 一か所変える

場所：VS Codeの編集画面。このプロジェクトのフォルダで行います。

Response.jsonの { status: "ok" } を { status: "ok", lesson: "preview" } に変えて保存します。この一時変更中は、元の応答を要求する既存の契約テストが失敗します。初回は応答を元へ戻すところまで行います。

[app/api/health/route.ts](app/api/health/route.ts)

## 6. 変化を自分で確認する

場所：開発ホストのターミナル（Windowsは選択したWSL内。PowerShellでは実行しません）。このプロジェクトのフォルダで行います。

JSONに lesson: "preview" が増えます。 開発サーバーを動かしたまま確かめます。 反映されない場合は復旧手順へ進みます。

```sh
'curl' '-i' 'http://localhost:3002/api/health'
```

[docs/RECOVERY.md](docs/RECOVERY.md)

## 7. 元の内容に戻して保存する

場所：VS Codeの編集画面。このプロジェクトのフォルダで行います。

追加した lesson: "preview" を削除し、{ status: "ok" } へ戻して保存します。

[app/api/health/route.ts](app/api/health/route.ts)

## 8. 復元した結果を確認する

場所：開発ホストのターミナル（Windowsは選択したWSL内。PowerShellでは実行しません）。このプロジェクトのフォルダで行います。

上のcurlコマンドで再取得し、JSONが { status: "ok" } に戻り、lessonがないことを確認します。

```sh
'curl' '-i' 'http://localhost:3002/api/health'
```

## 9. 次の教材へ進む（最初の変更は第1項）

場所：VS Codeの編集画面。このプロジェクトのフォルダで行います。

できたところを確認してから、次の練習を選びましょう。

[docs/EXERCISES.md](docs/EXERCISES.md)

## 10. 全体の使い方

場所：開発ホストのターミナル（Windowsは選択したWSL内。PowerShellでは実行しません）。このプロジェクトのフォルダで行います。

[README.md](README.md)

## 11. 空から組み立てる

場所：開発ホストのターミナル（Windowsは選択したWSL内。PowerShellでは実行しません）。このプロジェクトのフォルダで行います。

[docs/BUILD-YOUR-OWN.md](docs/BUILD-YOUR-OWN.md)

## 12. 停止・復旧

場所：開発ホストのターミナル（Windowsは選択したWSL内。PowerShellでは実行しません）。このプロジェクトのフォルダで行います。

[docs/RECOVERY.md](docs/RECOVERY.md)

## 振り返り

変更前・変更後・復元後の3つを確認できれば、この章は完了です。

[練習を続ける](docs/EXERCISES.md)
