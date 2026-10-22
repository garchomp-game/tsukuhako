# 今の状態から、戻る場所を選ぶ

[入口](START_HERE.md) · [初回の一本道](FIRST-RUN.md) · ガイド2026-10-25-r1

最初に「最後にできた操作」「いま見ている画面」「出た表示」をメモします。分からない用語の説明を作る必要はありません。ログ全体や `.env` を送る必要もありません。[短い記録票](FEEDBACK.md)を使えます。

## 操作する場所

| 名前 | ここでの意味 |
|---|---|
| Windows PowerShell | WSLの一覧や版を確認する場所。`bash scripts/doctor-host.sh` や `npm run dev` をここへ貼り付けない |
| ホスト | Linuxの通常ターミナル。Windowsなら**アプリで選んだWSLの通常ユーザー**のターミナル |
| コンテナ内 | VS CodeがF2へ接続した後の新しいターミナル。`pwd` が `/workspace` |
| 構成ターミナル | VS Codeが初回処理を実行するタブ。新しいターミナルとは別。ここで正常終了を確認する |

## 止まった位置に戻る

| 今の状態 | 次の一操作・成功の目印 | 戻る場所 |
|---|---|---|
| アプリが足りない／チェックサムが違う | 受け取った経路でOS用4ファイルと案内revisionを確認。違うファイルを混ぜて起動しない | アプリセットのSTART_HERE.txt |
| Windowsの署名・保護警告で止まる | 警告文を記録して提供元へ確認。保護を無効化して先へ進めない | [FEEDBACK](FEEDBACK.md) |
| Dockerへ接続できない | ホストで `docker version`。ClientだけでなくServerも出るかを見る。WindowsはDesktop起動と選択WSLのIntegrationを確認 | FIRST-RUN 2番 |
| LinuxのDockerが権限エラー | [公式の導入後設定](https://docs.docker.com/engine/install/linux-postinstall/)とPC管理方針を確認。設定変更にログアウト/ログインが必要なら済ませて再診断。アプリをsudo起動したりソケットを全員に開放したりしない | FIRST-RUN 2番 |
| WSLがない／WSL 1／root | PowerShellで `wsl --list --verbose`、選んだWSLで `whoami`。通常ユーザーのWSL 2へ準備して再診断。WSLを削除して直さない | FIRST-RUN 2番 |
| 保存先へ進めない | Windowsは選択WSLと補助ファイルの準備、親フォルダは実在するかを確認。「WSL用ファイルを準備」後に再診断 | FIRST-RUN 2〜3番 |
| 同名フォルダがある | 完了済みなら中のSTART_HERE.mdから再開。作成途中ならエラー詳細と復旧手順を読み、既存ファイルを消さず別の新しい名前を選ぶ | FIRST-RUN 3番 |
| VS Codeで開けない | ホストで生成先へ移動し `code .`。Windowsでは選択WSL内から実行し、Windows版CodeとWSL拡張を確認 | FIRST-RUN 5番 |
| Reopen in Containerがない | MicrosoftのDev Containers拡張が有効かを確認。現在のフォルダに `.devcontainer/devcontainer.json` があるかを見る | FIRST-RUN 2・5番 |
| 取得中／構成処理が続いている | 構成ターミナルの進捗と最後の表示を見る。別のnpm処理を開始しない | FIRST-RUN 6番 |
| 構成処理がエラーで終わった | エラーの短い部分を記録。ネット接続・空き容量・エラー原因を解消後、VS Codeの **Dev Containers: Rebuild Container** で初期処理をやり直し、正常終了を確認 | 生成先のdocs/RECOVERY.md、FIRST-RUN 6番 |
| `next: not found` | 早く実行したサーバーを止め、構成ターミナルの「準備完了」と正常終了を確認してから実行し直す。構成失敗なら上の行へ | FIRST-RUN 6〜7番 |
| `pwd` が `/workspace` ではない | VS Codeの接続先を見て、F2のDev Container内で「新しいターミナル」を開く | FIRST-RUN 5・7番 |
| Readyなのにブラウザに出ない | 開いているURLと、生成先START_HERE.mdのホスト側URLを比較。`localhost`を使い、サーバーを実行中にしてエラーを見る | FIRST-RUN 7番 |
| 変更が反映されない | 保存したファイルがこの生成先のapp/page.tsxか、ブラウザのURLがこのプロジェクトかを確認 | [NEXT-STEP](NEXT-STEP.md) |

## ポート使用中

**生成前：** アプリの「保存先・ポートを見直す」から「詳細設定」のホストポートを未使用の番号へ変更し、再度確認します。診断時点で空いていても、後からほかのアプリが使うことがあります。

**生成後：** ホストの生成先フォルダで `bash scripts/compose.sh stop` を実行し、このプロジェクトの `.env` の `HOST_PORT` だけを未使用の番号に変更します。識別名やほかの値は変更しません。`bash scripts/doctor-host.sh` で新しいURLを確認し、VS Codeの **Dev Containers: Rebuild Container** へ進みます。初期処理の正常終了後にサーバーを再起動します。

生成済み `START_HERE.md` は自動更新されないため、変更後のURLは診断結果を使い、同ファイルのブラウザ用URLも新しい番号に合わせてメモし直します。`.env` の中身を共有する必要はありません。

## 今日の終了と、次回の再開

1. **コンテナ内の実行中ターミナル**で `Ctrl+C`。開発サーバーが終了したことを確認します。
2. コンテナも止める場合は、**ホストの生成先フォルダ**で次を実行します。ソースや依存volumeを削除するコマンドではありません。

```sh
bash scripts/compose.sh stop
```

3. 次回はアプリで再生成せず、**同じ生成先フォルダをVS Codeで開きます**。ホストでそのフォルダへ移動して `code .` でも開けます。
4. **Dev Containers: Reopen in Container**。再構成が走った場合は6番の正常終了を待ちます。新しいコンテナ内ターミナルで `pwd` → `npm run dev`、現在のホスト側URLを開きます。

アプリを閉じることと、開発サーバー・コンテナを止めることは別です。通常の停止・再開にDocker全体のリセット、volume削除、WSLの削除は不要です。
