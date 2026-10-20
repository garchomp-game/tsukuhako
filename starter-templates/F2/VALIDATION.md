# F2 実測記録 — 0.1.0

2026-10-20、Linux Mint 22.3 x86_64、Docker 29.9.1、Compose5.6.0、Dev Container CLI0.89.0で検証しました。コンテナ内はNode24.22.0/npm11.17.0、Next16.4.2です。VS Code1.142.0のインストールは確認しましたが、GUI操作は行っていません。

|確認|結果|内容|
|---|---|---|
|実Dev Container作成・依存復元|PASS|初回43.617秒。base image取得済み、OS依存とnpm取得を含む|
|check / HTTP / build|PASS|型・ESLint、2ページと404、本番ビルド。build5.589秒|
|ブラウザ操作|PASS|Playwright1.64.1/Chromium156。遷移、入力、clear、再読込、script文字列|
|自動反映|PASS|同じブラウザdocumentで見出し変更が反映、手動reloadなし|
|停止・再開 / 再作成|PASS（CLI）|プロセス/Composeをそれぞれ停止再開。コンテナID変更後に編集ソース保持|
|単独ZIP・別コピー|PASS|日本語+空白path、別project、3001/3301、異なるvolume。新規復元24.876秒|
|診断|PASS|設定欠落、Docker未接続、port/name衝突、既存設定保持、symlink拒否|
|DB|対象外|DBを含めない。入力は再読込で消える|
|画像確認|PASS（自動画像をAI確認）|ホストChrome155、1200px/390px、日本語表示・横幅を確認|
|VS Code実操作 / Windows+WSL / macOS / ARM|NOT_RUN|Linux CLIの結果から推定しない|
|実GitHub Actions / 未導入PC / 初学者試用|NOT_RUN|同梱workflowとローカルチェックは実CI成功とは別|

詳細なA01〜A16の適用範囲は [docs/VALIDATION.json](docs/VALIDATION.json) に記録しています。所要時間はこのPCとその時点のcache条件での実測であり、最小要件や所要時間の保証ではありません。キャッシュ全消去は行っていません。

初回にComposeとDevCLIの生成Dockerfileの互換問題を検出し、initializeCommandの通常docker buildへ変更して解消しました。安全チェックは無効化していません。Next.jsの開発用アクセスをlocalhostへ揃えてブラウザ試験を修正しました。

ESLint9.39.5はサポート終了警告が出ます。Next側プラグインのpeer互換性のためこの版を固定しています。npm11.17でunrs-resolverのinstall script未承認警告も出ますが、既定の制限を維持した状態でcheck/buildは成功しました。依存更新時に再検証してください。
