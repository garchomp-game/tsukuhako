# 停止・再開・再構築と復旧

**通常停止はデータを消しません。** 開発サーバーはコンテナ内ターミナルでCtrl+C。アプリの停止はホストで`bash scripts/app.sh stop`、Supabaseの停止は`bash scripts/db.sh stop`です。再開はホストで`bash scripts/db.sh start` → VS CodeでReopen in Container → コンテナで`npm run dev`です。

VS Code再接続だけで開発サーバーを重複起動しません。Dockerfile変更後はDev Containers: Rebuild Containerを使います。initializeCommandがプロジェクト内Dockerfileからimageを作り、Composeはそのimageを使います。ソースはbind mount、DBは別volumeなので保持されます。アプリの再構築はDB resetを呼びません。

|症状|確認と戻し方|
|---|---|
|Docker接続失敗|ホストの`bash scripts/doctor-host.sh`。Dockerの起動と正規の利用権限を確認。ホスト設定を自動変更しない|
|.envなし|ホストの`bash scripts/configure.sh`。既存.envは上書きしない|
|DB設定不足|ホストで`bash scripts/db.sh start`。生成された.env.localを使うため開発サーバーを再起動|
|networkがない|Supabaseを先にstart。app単体を先に起動しない|
|画面に保存先へ接続できない|ホストで`bash scripts/db.sh status`、コンテナで`npm run doctor`。DB startを確認|
|ポート使用中|.envのHOST_PORTと該当SUPABASE_*_PORTを確認。別コピーの全ポートを分離。勝手に空きポートへ移動しない|
|同じPROJECT_NAMEの別フォルダ|元のDBは保護される。新しいコピーで別IDを指定し、全ポートを分ける|
|起動中の接続設定変更を拒否|.envを元へ戻してDBを停止してから変更。既存IDを別DBへ読み替えない|
|依存が壊れた|コンテナでサーバーを止めnpm ci。lockfileを削除しない|
|Chromiumがない|コンテナでnpm run test:setup。その後npm run test:browser|
|統合試験で3000番使用中|このコンテナのdevをCtrl+Cで終了後、npm run test:integration。既存サーバーの自動借用や無差別killはしない|
|試験の後で終了/ポート解放に失敗|managed-serverのPID・エラーと実行場所を確認。その確認が通るまでbuildへ進めない|
|migration変更が反映されない|既存migrationを編集するだけでは適用済みDBは変わらない。新規migrationを追加しdocs/EXERCISES.mdを参照|

## 明示リセット

まず対象を`bash scripts/db.sh status`と.envのPROJECT_NAMEで確かめます。架空の学習データを消してよい場合だけ、ホストで`bash scripts/db.sh reset --confirm-local-reset=<PROJECT_NAMEの値>`を実行します。このフォルダで作成した対象DBに`db reset --local`を使い、migrationとseedを再適用します。確認引数がない場合は拒否します。通常停止と異なり、利用者が追加したメモは失われます。

CLIの`stop --no-backup`は通常操作に使いません。アプリ依存はnpm ciで再取得できます。Supabaseの停止/初期化はDB専用コマンドで扱います。共有Dockerのpruneや他のプロジェクトのvolume削除はしません。

## 別コピーを共存させる

配布ZIPを新しいフォルダに展開し`bash scripts/configure.sh --port 3014`を実行します。生成されたPROJECT_NAMEが別であることを確認し、.envのAPI/DB/Studio/shadowをそれぞれ54421/54422/54423/54420に変更してstartします。両方のStudioとアプリへ別URLで入り、メモが混ざらないことを確認します。停止時は対象のフォルダから操作します。

質問する際は実行場所、コマンド、期待結果、診断エラー、VERSION.json、OS/Docker/Composeの版を添えます。.env.local、CLI statusの生出力、Docker inspectのEnvironment全体、DB内容は送らないでください。

シェルのPROJECT_NAME/HOST_PORT/COMPOSE_PROJECT_NAME/COMPOSE_FILE/COMPOSE_ENV_FILESがこのフォルダの設定を上書きする場合、ホスト診断と停止は拒否します。別案件の環境変数を解除して再実行してください。ブラウザ試験のChromiumはコンテナの再作成後に npm run test:setup で再取得します。

統合試験は正常終了・テスト失敗のどちらでも自分で作ったNextのプロセスグループへSIGTERMを送り、10秒で終了しなければそのグループだけへSIGKILLを送り、終了とポート解放を待ちます。npm親のPIDだけを終了させる処理は使いません。WindowsネイティブではなくLinux/WSL内で実行してください。
