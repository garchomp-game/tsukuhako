# F1：最初の一歩

プロジェクトのファイルができました。コンテナはまだ起動していません。
起動して、一か所変えた結果を自分で確かめ、元へ戻すところまで進めましょう。

## このプロジェクトの設定

- 構成：F1 / 版 0.1.3
- 識別名：otoka-f1-2892242950
- ポート：app=34429
- .envは作成済みです。READMEの既定ポートと異なる場合は上の設定を使います。

保存先：

    /home/garchomp-game/workspace/meikyo/tsukuhako-starters-0.4.1/validation/onboarding-0.4.2/20261021T0919-JST/runs/projects/F1 日本語 起動の記録

生成時のネット接続は不要です。初回起動でイメージや依存を取得する際はネット接続が必要です。

## 最初に作業フォルダを開く

開発ホストのターミナル（Windowsは選択したWSL内、Linux/macOSはそのOSのターミナル）で次をコピーして実行します。

```sh
cd -- '/home/garchomp-game/workspace/meikyo/tsukuhako-starters-0.4.1/validation/onboarding-0.4.2/20261021T0919-JST/runs/projects/F1 日本語 起動の記録'
```

pwd で上の保存先が表示されれば準備完了です。以降のホスト用コマンドはここで実行します。

[開発準備](docs/SETUP.md)に不足がある場合は、先にその手順を確認します。

## 起動して、最初の変更を試す

### 1. 準備と、このプロジェクトの設定を確認する

場所：開発ホストのターミナル（Windowsは選択したWSL内。PowerShellでは実行しません）。このプロジェクトのフォルダで行います。

不足があれば、次の準備手順を確認してください。生成済みの.envを最初から作り直す必要はありません。

```sh
'bash' 'scripts/doctor-host.sh'
```

確認できる結果：診断OK と、このプロジェクトのURLが表示されます。

[docs/SETUP.md](docs/SETUP.md)

### 2. VS Codeでフォルダを開き、Dev Containers: Reopen in Containerを実行する

場所：VS Codeの編集画面。このプロジェクトのフォルダで行います。

生成完了画面の「VS Codeで開く」を押します。VS CodeでCtrl+Shift+P（macOSはCmd+Shift+P）を押し、Dev Containers: Reopen in Containerを検索して選びます。自身が生成したフォルダを確認して信頼します。初回のイメージ・依存取得を待ちます。

確認できる結果：VS Code左下にDev Containerへの接続が表示され、/workspaceのファイルが開きます。

### 3. 開発サーバーを起動する

場所：VS CodeのDev Container内ターミナル。/workspaceで行います。

Dev Containerへの接続後、VS Codeの「ターミナル」→「新しいターミナル」で実行します。pwd が /workspace であることを確認します。このターミナルを起動したまま、次の確認・編集へ進みます。

```sh
'npm' 'run' 'dev'
```

確認できる結果：VITE と Local のURLが表示されます。ブラウザでは下記のホスト側URLを使います。

### 4. 変更前の画面を確認する

場所：OSのブラウザのアドレス欄。下記URLを開きます。

ブラウザのアドレス欄：`http://localhost:34429/`

### 5. 一か所変える

場所：VS Codeの編集画面。このプロジェクトのフォルダで行います。

入力ラベル「表示することば」を「今日のことば」に変えて保存します。

[src/App.tsx](src/App.tsx)

### 6. 変化を自分で確認する

場所：OSのブラウザのアドレス欄。下記URLを開きます。

入力ラベルが「今日のことば」に変わります。 開発サーバーを動かしたまま確かめます。 反映されない場合は復旧手順へ進みます。

ブラウザのアドレス欄：`http://localhost:34429/`

[docs/RECOVERY.md](docs/RECOVERY.md)

### 7. 元の内容に戻して保存する

場所：VS Codeの編集画面。このプロジェクトのフォルダで行います。

入力ラベルを「表示することば」に戻して保存します。

[src/App.tsx](src/App.tsx)

### 8. 復元した結果を確認する

場所：OSのブラウザのアドレス欄。下記URLを開きます。

開発サーバーを動かしたまま下記URLを開き、入力ラベルが「表示することば」に戻ったことを確認します。

ブラウザのアドレス欄：`http://localhost:34429/`

### 9. 次の教材へ進む（最初の変更は第1項）

場所：VS Codeの編集画面。このプロジェクトのフォルダで行います。

できたところを確認してから、次の練習を選びましょう。

[docs/EXERCISES.md](docs/EXERCISES.md)

### 10. 全体の使い方

場所：開発ホストのターミナル（Windowsは選択したWSL内。PowerShellでは実行しません）。このプロジェクトのフォルダで行います。

[README.md](README.md)

### 11. 空から組み立てる

場所：開発ホストのターミナル（Windowsは選択したWSL内。PowerShellでは実行しません）。このプロジェクトのフォルダで行います。

[docs/BUILD-YOUR-OWN.md](docs/BUILD-YOUR-OWN.md)

### 12. 停止・復旧

場所：開発ホストのターミナル（Windowsは選択したWSL内。PowerShellでは実行しません）。このプロジェクトのフォルダで行います。

[docs/RECOVERY.md](docs/RECOVERY.md)

## うまく進まないとき・次の学び

[停止・復旧](docs/RECOVERY.md)で今の操作に合う項目を確認します。アプリの「作る画面へ戻る」で生成結果へ戻れます。再起動後は、VS Codeでこの START_HERE.md を開いて再開してください。

変更前・変更後・復元後を確認できたら、最初の一歩は完了です。「空から組み立てる」は仕組みを学びながら自作する次の教材です。

生成前の診断はその時点の観察です。ポートや起動成功の保証ではありません。秘密値は.envだけに保存し、この案内には載せません。
