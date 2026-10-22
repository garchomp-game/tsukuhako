# 最終Linux配布物の実機確認

2026-10-22 JST、REAL_HOST。Linux Mint 22.3 Zena x64、kernel 7.0.0-31-generic、Docker 29.9.1、Compose 5.6.0、VS Code 1.142.0、専用profileのDev Containers 0.469.0。[環境記録](logs/linux-environment.json)。既存Docker Engine/イメージキャッシュを利用し、OSパッケージ変更やDocker全体のリセットはしていません。

製品はREPORT記載のCI tar.gz（SHA `deace519c6ac6cb7a91de304491edd6a0676995eb386fa0be93fb541f43430b4`）。`tools/release-linux-044.mjs`、`tools/verify-reader-044.mjs`、`tools/onboarding-f2-exercise-044.mjs`を使用しました。専用Xephyrの実ウィンドウをPlaywright/CDPとネイティブキーで操作しています。モックや開発サーバーを製品起動に代用していません。

| 順序 | 観測した結果 | 証拠 |
|---|---|---|
| 1 | 日本語/空白を含む別の展開先から引数なしで起動。CWD /tmp、一般ユーザー、ホストNodeを含まないPATH。ウィンドウ表示→通常終了 | [ログ](logs/normal-launch.json)、[画像](screenshots/L01-normal.png) |
| 2 | 広幅/狭幅/200%、目次/見出し/前後章/ヘルプ復帰、F2入力とS2学習の独立、終了/再開、観測引数なしの再確認。11グループPASS | [Reader](logs/reader-final.json)、[通常起動200%](screenshots/UX-normal-no-debug.png) |
| 3 | 同梱教材と生成完了画面が、初期構成の正常終了を待つよう案内。実際の保存先とポートでF2を生成 | [教材](screenshots/L02-lesson.png)、[完了](screenshots/L03-completion.png)、[生成情報](logs/F2-project.json) |
| 4 | 実VS CodeからReopen in Container。新規の依存/npm-cacheボリューム2件。「準備完了」＋Done、Dev ContainersログのpostCreate終了を確認 | [構成画面](screenshots/L06-ready.png)、[ログ抜粋](logs/F2-postcreate-excerpt.log)、[結果](logs/F2-startup.json) |
| 5 | 正常終了後、新しい統合ターミナルでnpm run dev。HTTP 200、localhost:41915にF2が表示 | [ターミナル](screenshots/L07-server.png)、[ブラウザ](screenshots/M18.png) |
| 6 | エディタの検索/置換→保存で見出しを変更、ブラウザHMR確認。元へ戻して保存、表示と元SHA一致 | [変更保存](screenshots/M19-editor.png)、[表示](screenshots/M19.png)、[復元保存](screenshots/M20-editor.png)、[表示](screenshots/M20.png)、[ハッシュ](logs/F2-exercise.json) |
| 7 | ツクハコ終了/再開、生成済みSTART_HERE.mdを実Codeで開く。ガイドSHA不変 | [再開](screenshots/L08-restart.png)、[生成ガイド](screenshots/L09-project-resume.png)、[保持確認](logs/cleanup.json) |

F2ソースの復元SHAは `c519464d586ca774fbc969aeca14418aa10e837948cf22322317e3c61a5fd43e`。生成ガイドは `95e7b5ce5d66f3bb21e198c4e3b46824a13862eed66fd216ff8f6b1102e492e6`。

初回の検証操作ではCodeにネイティブのフォーカスがないためF1が開かず、製品操作の前に検証コードがタイムアウトしました。専用Codeウィンドウを前面にしてから操作するよう直し、初期構成から正常終了まで確認しました。npm ciにはunrs-resolverのallow-scripts未承認警告とnpm新版通知がありましたが、設定変更や更新は行わず、doctor/postCreateの正常終了とF2の表示・編集・復元を確認しています。全依存の全機能検証ではありません。

検証後は専用ウィンドウ、Xephyr、F2コンテナだけを停止し、生成物とボリュームを保持しました。既存2コンテナは起動時刻も変えていません。長期保存用のプロジェクトはホーム配下に新しく生成してください。今回の `/var/tmp` は試用用です。

共有ログでは個人のホーム/作業パス/ホスト名を置き換え、接続トークン等を含むCodeの生ログを除外しました。postCreate抜粋は成功だけでなく警告も保持しています。未加工ログ・trace・実行依存はGit対象外のruns/にあります。画像は専用デスクトップの元の画面です。
