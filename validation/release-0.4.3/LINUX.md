# Linux 0.4.3の確認

**PASS — Linux Mint 22.3 x64の既存開発PCで、配布tar.gzの通常起動とF2の初回構成・起動・表示・変更・復元を確認しました。** CIから取得したファイルそのものを展開して使用しています。Ubuntuや未導入PC、初心者本人の完走へ読み替えません。

実機: Linux Mint 22.3 / kernel 7.0.0-31-generic、Docker 29.9.1、Compose 5.6.0、VS Code 1.142.0、専用プロファイルのDev Containers 0.469.0。操作はCodexによる自動操作、画面は実機の専用Xephyrデスクトップです。VM/fixtureの画面ではありません。既存のDockerイメージキャッシュは使用しています。

| 項目 | 結果 | 実行区分・証跡 |
|---|---|---|
| tar.gz作成 | PASS | CI / Ubuntu 24.04。Linuxでの実機起動とは別 |
| 配布物の同梱・版・ハッシュ | PASS | REAL_HOSTで取得後に検査。[120ファイル・50章・7テンプレート](logs/linux-bundle.json) |
| 通常起動、ホストNodeなし、任意CWD、日本語/空白の展開先 | PASS | REAL_HOST / 引数なし、cwd=/tmp、Nodeが見つからないPATH。[記録](logs/normal-launch.json) / [画像](screenshots/L01-normal.png) |
| 教材→生成画面、案内の変更 | PASS | REAL_HOST / [教材](screenshots/L02-lesson.png)・[完了画面](screenshots/L03-completion.png)・生成START_HEREの共有コア |
| VS Codeへの引き渡し、サインイン省略、生成フォルダだけを信頼 | PASS | REAL_HOST / 専用プロファイル。Reopen in Containerで接続 |
| 新しい依存ボリュームで初期構成の正常終了 | PASS | REAL_HOST / dependencies・npm-cacheとも作成前の一覧に存在しない。[起動記録](logs/F2-startup.json) |
| 「準備完了」＋正常終了を待ってからnpm run dev | PASS | REAL_HOST / [構成ターミナル](screenshots/L06-ready.png)に「準備完了」と「Done. Press any key…」。[実ログ](logs/F2-postcreate-excerpt.log)は03:25:58ZにpostCreate終了。起動はその後 |
| Ready・ブラウザ表示・一か所編集・復元 | PASS | REAL_HOST / [サーバー](screenshots/L07-server.png) → [初期画面](screenshots/M18.png) → [変更](screenshots/M19.png) → [復元](screenshots/M20.png)。[元ファイルSHA一致](logs/F2-exercise.json) |
| アプリ終了後の教材・生成済みプロジェクトの再開 | PASS | REAL_HOST / [再起動](screenshots/L08-restart.png)、[VS CodeのSTART_HERE](screenshots/L09-project-resume-visible.png)。再生成なし |
| 通常停止・既存環境の保持 | PASS | REAL_HOST / [片付け](logs/cleanup.json)。生成先・2ボリュームを保持、無関係な2コンテナの起動時刻も不変 |
| 未導入PC/クリーンVMからの導入 | NOT_RUN | 利用可能な隔離VMなし。ホストのDocker/Codeを削除して再現していない |
| 0.4.3でF1/B1/S1/S2/I1を全て再録画 | NOT_RUN | 今回は変更箇所とF2を再検証。0.4.2の既存実機記録は旧版の証跡として参照 |
| 初心者本人による完走・他Linux/ARM | NOT_RUN | 自動操作・Mint x64の範囲外 |

[Linux用の個別ダウンロード](https://github.com/garchomp-game/tsukuhako/actions/runs/39537520939/artifacts/12317908431)（private・14日保持）。[検証追補manifest](manifests/tsukuhako-linux-x64-0.4.3.tar.gz.manifest.json)に配布ファイルのSHA・サイズ・製品commit・確認OSを記載しています。CI同梱manifestのNOT_RUN_AT_BUILDはビルド時点の状態です。今回の実機確認はこの追補と同じSHAに対するものです。

途中の取得・操作補助の失敗も分けています。ダウンロード完了前の展開、教材ボタンの曖昧なセレクター、初回Codeへのキーボードフォーカス、再起動時の観測ポート競合を修正して再実施しました。誤って選択したRebuildは信頼確認でキャンセルし、コンテナ作成前にReopenを選び直しました。L09の最初の画像はアプリが手前に出ていたため、Codeを前面にした画像を採用しています。これらを製品の合格で隠さず、最終の操作時刻を [steps.json](steps.json) に記録しています。
