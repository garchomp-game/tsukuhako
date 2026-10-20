# F1：最初の一歩

![ツクハコの目印](asset:learning-cycle)

## この章の進め方

生成完了画面の保存先とポートを使います。下のコマンドは標準ポートの例です。秘密値はアプリに貼り付けず、生成先の.envで管理してください。

[開発準備](lesson:setup/overview)を確認し、プロジェクトをVS Codeで開きます。Windowsでは選択したWSLの通常ユーザーで操作してください。

## 1. 準備と、このプロジェクトの設定を確認する

場所：開発ホスト（WindowsはWSL内）。生成したフォルダで行います。

確認できる結果：診断OK と、このプロジェクトのURLが表示されます。

不足があれば、次の準備手順を確認してください。生成済みの.envを最初から作り直す必要はありません。

```sh
'bash' 'scripts/doctor-host.sh'
```

[docs/SETUP.md](docs/SETUP.md)

## 2. VS Codeでフォルダを開き、Dev Containers: Reopen in Containerを実行する

場所：VS Code。生成したフォルダで行います。

確認できる結果：VS Code左下にDev Containerへの接続が表示され、/workspaceのファイルが開きます。

生成完了画面の「VS Codeで開く」を押します。VS CodeでCtrl+Shift+P（macOSはCmd+Shift+P）を押し、Dev Containers: Reopen in Containerを検索して選びます。自身が生成したフォルダを確認して信頼します。初回のイメージ・依存取得を待ちます。

## 3. 開発サーバーを起動する

場所：Dev Container内。/workspaceで行います。

確認できる結果：VITE と Local のURLが表示されます。ブラウザでは下記のホスト側URLを使います。

Dev Containerへの接続後、VS Codeの「ターミナル」→「新しいターミナル」で実行します。pwd が /workspace であることを確認します。このターミナルを起動したまま、次の確認・編集へ進みます。

```sh
'npm' 'run' 'dev'
```

## 4. 変更前の画面を確認する

場所：開発ホスト（WindowsはWSL内）。生成したフォルダで行います。

ブラウザのアドレス欄：`http://localhost:3000/`（ポートは生成結果に合わせます）

## 5. 一か所変える

場所：VS Code。生成したフォルダで行います。

入力ラベル「表示することば」を「今日のことば」に変えて保存します。

[src/App.tsx](src/App.tsx)

## 6. 変化を自分で確認する

場所：開発ホスト（WindowsはWSL内）。生成したフォルダで行います。

入力ラベルが「今日のことば」に変わります。 開発サーバーを動かしたまま確かめます。 反映されない場合は復旧手順へ進みます。

ブラウザのアドレス欄：`http://localhost:3000/`（ポートは生成結果に合わせます）

[docs/RECOVERY.md](docs/RECOVERY.md)

## 7. 元へ戻して、もう一度確認する

場所：開発ホスト（WindowsはWSL内）。生成したフォルダで行います。

入力ラベルを「表示することば」に戻して保存します。

ブラウザのアドレス欄：`http://localhost:3000/`（ポートは生成結果に合わせます）

## 8. 次の教材へ進む（最初の変更は第1項）

場所：VS Code。生成したフォルダで行います。

できたところを確認してから、次の練習を選びましょう。

[docs/EXERCISES.md](docs/EXERCISES.md)

## 9. 全体の使い方

場所：開発ホスト（WindowsはWSL内）。生成したフォルダで行います。

[README.md](README.md)

## 10. 空から組み立てる

場所：開発ホスト（WindowsはWSL内）。生成したフォルダで行います。

[docs/BUILD-YOUR-OWN.md](docs/BUILD-YOUR-OWN.md)

## 11. 停止・復旧

場所：開発ホスト（WindowsはWSL内）。生成したフォルダで行います。

[docs/RECOVERY.md](docs/RECOVERY.md)

## 振り返り

変更前・変更後・復元後の3つを確認できれば、この章は完了です。

[練習を続ける](docs/EXERCISES.md)
