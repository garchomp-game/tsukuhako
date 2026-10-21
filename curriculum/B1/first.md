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

生成完了画面の「VS Codeで開く」を押します。VS CodeでCtrl+Shift+P（macOSはCmd+Shift+P）を押し、Dev Containers: Reopen in Containerを検索して選びます。自身が生成したフォルダを確認して信頼します。初回のイメージ・依存取得を待ちます。VS Codeの初回サインインは、このローカル学習には不要です。信頼するのは今生成したフォルダだけにします。コマンドがない場合は左側の拡張画面で Microsoft の Dev Containers（ms-vscode-remote.remote-containers）を導入します。

## 3. 初期構成の正常終了を待つ

場所：VS Codeの編集画面。このプロジェクトのフォルダで行います。

確認できる結果：構成ターミナル本文に「準備完了」が表示され、初期構成処理が正常終了しています。

VS Codeの構成ターミナル（Configuring... など）を開き、本文の「準備完了」と、初期構成処理がエラーなく正常終了したことの両方を確認します。接続バッジ・node_modulesの存在・タブ名だけでは完了と判断しません。処理中は別の npm ci を実行せず、そのまま待ちます。失敗した場合は構成ターミナルのログと復旧手順を確認してください。

[docs/RECOVERY.md](docs/RECOVERY.md)

## 4. 開発サーバーを起動する

場所：VS CodeのDev Container内ターミナル。/workspaceで行います。

確認できる結果：Ready が表示されます。ブラウザでは下記のホスト側URLを使います。

前の手順で初期構成の正常終了を確認してから、VS Codeの「ターミナル」→「新しいターミナル」で実行します。pwd が /workspace であることを確認します。このターミナルを起動したまま、次の確認・編集へ進みます。早く実行して next: not found などが出た場合は、構成ターミナルの「準備完了」と正常終了を確認した後で npm run dev をもう一度実行します。初期構成が失敗していたら、そのログと docs/RECOVERY.md を確認してください。

```sh
'npm' 'run' 'dev'
```

## 5. 変更前のJSONを確認する

場所：開発ホストのターミナル（Windowsは選択したWSL内。PowerShellでは実行しません）。このプロジェクトのフォルダで行います。

```sh
'curl' '-i' 'http://localhost:3002/api/health'
```

## 6. 一か所変える

場所：VS Codeの編集画面。このプロジェクトのフォルダで行います。

Response.jsonの { status: "ok" } を { status: "ok", lesson: "preview" } に変えて保存します。この一時変更中は、元の応答を要求する既存の契約テストが失敗します。初回は応答を元へ戻すところまで行います。

[app/api/health/route.ts](app/api/health/route.ts)

## 7. 変化を自分で確認する

場所：開発ホストのターミナル（Windowsは選択したWSL内。PowerShellでは実行しません）。このプロジェクトのフォルダで行います。

JSONに lesson: "preview" が増えます。 開発サーバーを動かしたまま確かめます。 反映されない場合は復旧手順へ進みます。

```sh
'curl' '-i' 'http://localhost:3002/api/health'
```

[docs/RECOVERY.md](docs/RECOVERY.md)

## 8. 元の内容に戻して保存する

場所：VS Codeの編集画面。このプロジェクトのフォルダで行います。

追加した lesson: "preview" を削除し、{ status: "ok" } へ戻して保存します。

[app/api/health/route.ts](app/api/health/route.ts)

## 9. 復元した結果を確認する

場所：開発ホストのターミナル（Windowsは選択したWSL内。PowerShellでは実行しません）。このプロジェクトのフォルダで行います。

上のcurlコマンドで再取得し、JSONが { status: "ok" } に戻り、lessonがないことを確認します。

```sh
'curl' '-i' 'http://localhost:3002/api/health'
```

## 10. 次の教材へ進む（最初の変更は第1項）

場所：VS Codeの編集画面。このプロジェクトのフォルダで行います。

できたところを確認してから、次の練習を選びましょう。

[docs/EXERCISES.md](docs/EXERCISES.md)

## 11. 全体の使い方

場所：開発ホストのターミナル（Windowsは選択したWSL内。PowerShellでは実行しません）。このプロジェクトのフォルダで行います。

[README.md](README.md)

## 12. 空から組み立てる

場所：開発ホストのターミナル（Windowsは選択したWSL内。PowerShellでは実行しません）。このプロジェクトのフォルダで行います。

[docs/BUILD-YOUR-OWN.md](docs/BUILD-YOUR-OWN.md)

## 13. 停止・復旧

場所：開発ホストのターミナル（Windowsは選択したWSL内。PowerShellでは実行しません）。このプロジェクトのフォルダで行います。

[docs/RECOVERY.md](docs/RECOVERY.md)

## 振り返り

変更前・変更後・復元後の3つを確認できれば、この章は完了です。

[練習を続ける](docs/EXERCISES.md)
