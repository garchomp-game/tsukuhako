# GitHub Releasesへの配布手順

公開先は [garchomp-game/tsukuhako](https://github.com/garchomp-game/tsukuhako) です。無料でダウンロードでき、購入・登録は必要ありません。期限付きActions artifactを利用者向けの入口にしません。

1. [ビルド手順](../../generator-desktop/README.md)に沿って版をそろえ、教材・テンプレート・ライセンスを含むソースをcommitします。作業ツリーがcleanの状態でステージとdebを作成します。
2. `tools/linux-deb/inspect.mjs` と配布検査を実行し、検証済みの範囲と未確認項目をレポートへ記録します。
3. `tools/linux-deb/deliver.mjs` に最終debと新しい出力先を指定します。deb、`SHA256SUMS`、`INSTALL.txt`、`manifest.json`、`LICENSE` を確認します。既存の配布物を上書きしません。
4. 公開対象のソース・履歴・Actionsログを確認し、版タグに対応するGitHub Releaseへ5ファイルをアップロードします。READMEのダウンロードリンクをその版のdebへ合わせます。
5. ログインしていない状態でもREADME・Release・debが取得できること、ダウンロードしたdebのSHA-256が同じことを確認します。

Linuxの主配布物は単体debです。外側のZIP展開を必要にしません。Windowsなどの未検証の成果物を、Linux版と同じ動作確認済みとして配布しません。配布の確認と、利用者によるGUIインストール・メニュー起動の確認は分けて記録します。
