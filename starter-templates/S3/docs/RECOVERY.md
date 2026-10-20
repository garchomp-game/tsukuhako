# 停止・再開と復旧

開発サーバーはコンテナ内でCtrl+C、通常停止はホストで`bash scripts/app.sh stop`です。このhelperは.envの識別子・Composeファイルに対象を固定し、別プロジェクトの環境変数が上書きする場合は拒否します。再開はVS CodeのReopen in Container後、`npm run dev`。Dockerfileの変更時はRebuild Containerです。ソースと.env.localはホスト側に残ります。クラウドデータを自動初期化しません。

|症状|確認と次の操作|
|---|---|
|Docker接続失敗|ホストのdoctor-host.sh。Dockerの起動・正規の利用権限を確認|
|ポート使用中|.envのHOST_PORTを変更して再構築。別コピーはPROJECT_NAMEも別にする|
|別案件の環境変数を検出|PROJECT_NAME/HOST_PORT/COMPOSE_PROJECT_NAME/COMPOSE_FILE/COMPOSE_ENV_FILESのexportを解除して再診断|
|設定案内が出る|.env.localのURLと公開キーを確認し、devを再起動|
|secret/service_roleを拒否|公開可能なpublishable/anonキーへ変更。強いキーをこのアプリに渡さない|
|接続できない|ネット接続とProject URLを確認。コンテナのlocalhostをクラウドURLと混同しない|
|権限エラー・空の一覧|専用プロジェクトのtable/seed/SELECT grantとRLS policyを確認。管理者権限での成功を匿名の成功と扱わない|
|依存不整合|devを止めnpm ci。lockfileは削除しない|
|SQL試験失敗|ホストのDockerを確認。表示された試験IDだけを診断し、共有資源をpruneしない|

設定・キーの実値、DB内容、Docker inspectのEnvironment全体は質問用ログへ含めません。診断エラー、実行場所、コマンド、OSとツール版、期待した表示を共有します。
