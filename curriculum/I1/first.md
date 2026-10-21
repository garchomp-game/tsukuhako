# I1：最初の一歩

![ツクハコの目印](asset:learning-cycle)

## この章の進め方

生成完了画面の保存先とポートを使います。下のコマンドは標準ポートの例です。秘密値はアプリに貼り付けず、生成先の.envで管理してください。

[開発準備](lesson:setup/overview)を確認し、プロジェクトをVS Codeで開きます。Windowsでは選択したWSLの通常ユーザーで操作してください。

## 1. 準備と、このプロジェクトの設定を確認する

場所：開発ホストのターミナル（Windowsは選択したWSL内。PowerShellでは実行しません）。このプロジェクトのフォルダで行います。

確認できる結果：PASS: Docker / Compose / 設定 が表示されます。

不足があれば、次の準備手順を確認してください。生成済みの.envを最初から作り直す必要はありません。

```sh
'bash' 'scripts/doctor.sh'
```

[README.md](README.md)

## 2. VS Codeでフォルダを開き、Dev Containers: Reopen in Containerを実行する

場所：VS Codeの編集画面。このプロジェクトのフォルダで行います。

確認できる結果：VS Code左下にDev Containerへの接続が表示され、/workspaceのファイルが開きます。

生成完了画面の「VS Codeで開く」を押します。VS CodeでCtrl+Shift+P（macOSはCmd+Shift+P）を押し、Dev Containers: Reopen in Containerを検索して選びます。自身が生成したフォルダを確認して信頼します。初回のイメージ・依存取得を待ちます。VS Codeの初回サインインは、このローカル学習には不要です。信頼するのは今生成したフォルダだけにします。コマンドがない場合は左側の拡張画面で Microsoft の Dev Containers（ms-vscode-remote.remote-containers）を導入します。

## 3. migrationとサンプルデータを準備する

場所：VS CodeのDev Container内ターミナル。/workspaceで行います。

```sh
'bash' 'scripts/db.sh' 'setup'
```

## 4. SQLの主要操作を確認する

場所：VS CodeのDev Container内ターミナル。/workspaceで行います。

```sh
'bash' 'scripts/db.sh' 'check'
```

## 5. 変更前の結果を確認する

場所：VS CodeのDev Container内ターミナル。/workspaceで行います。

```sh
'bash' 'scripts/db.sh' 'query' 'sql/practice.sql'
```

## 6. 一か所変える

場所：VS Codeの編集画面。このプロジェクトのフォルダで行います。

SELECTの「SQLの練習」を「在庫を調べる」に変えて保存します。保存だけでは結果は変わりません。

[sql/practice.sql](sql/practice.sql)

## 7. 変化を自分で確認する

場所：VS CodeのDev Container内ターミナル。/workspaceで行います。

再実行するとlesson列が「在庫を調べる」に変わります。 保存後は必ず再実行してください。 反映されない場合は復旧手順へ進みます。

```sh
'bash' 'scripts/db.sh' 'query' 'sql/practice.sql'
```

[docs/recovery.md](docs/recovery.md)

## 8. 元の内容に戻して保存する

場所：VS Codeの編集画面。このプロジェクトのフォルダで行います。

文字列を「SQLの練習」に戻して保存します。

[sql/practice.sql](sql/practice.sql)

## 9. 復元した結果を確認する

場所：VS CodeのDev Container内ターミナル。/workspaceで行います。

上のSQLコマンドをもう一度実行し、lesson列が「SQLの練習」に戻ったことを確認します。

```sh
'bash' 'scripts/db.sh' 'query' 'sql/practice.sql'
```

## 10. 次の教材へ進む（最初の変更は演習1）

場所：VS Codeの編集画面。このプロジェクトのフォルダで行います。

できたところを確認してから、次の練習を選びましょう。

[docs/learning.md](docs/learning.md)

## 11. 全体の使い方

場所：開発ホストのターミナル（Windowsは選択したWSL内。PowerShellでは実行しません）。このプロジェクトのフォルダで行います。

[README.md](README.md)

## 12. 停止・復旧

場所：開発ホストのターミナル（Windowsは選択したWSL内。PowerShellでは実行しません）。このプロジェクトのフォルダで行います。

[docs/recovery.md](docs/recovery.md)

## 振り返り

変更前・変更後・復元後の3つを確認できれば、この章は完了です。

[練習を続ける](docs/learning.md)
