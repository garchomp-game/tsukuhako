# 停止・再開と復旧

開発サーバーだけ止めるにはコンテナ内の実行ターミナルでCtrl+C。再開は `npm run dev` です。VS Codeのウィンドウを閉じ、再度「Reopen in Container」で接続した後も明示的に実行します。

全サービスの通常停止はホストの展開フォルダで `bash scripts/compose.sh stop`。再開はVS Codeの「Reopen in Container」。Dockerfileの変更は「Dev Containers: Rebuild Container」で反映します。ソースはホストにあり保持されます。依存は初回処理の `npm ci` がlockfileから復元します。

|症状|確認場所と戻し方|
|---|---|
|Docker接続失敗|ホストで `bash scripts/doctor-host.sh`。Dockerの起動・許可を確認。docs/SETUP.mdへ戻る|
|設定なし|ホストで `bash scripts/configure.sh`。既存.envは上書きしない|
|ポート使用中|ホストの.envのHOST_PORTを空き番号に変更し再構築。自動で別ポートへ移動しない|
|別コピーと混ざる|コピーには.envを持ち込まずconfigureを実行。PROJECT_NAMEとHOST_PORTの両方を分ける。使用中の識別名を変更しても旧資源は移動しない|
|依存が壊れた|コンテナ内でサーバーを止め `npm ci`。package-lock.jsonを削除して解決しない|
|古い画面|起動ターミナルのエラー、保存したファイルとURLを確認。ソース変更は自動反映される|
|ブラウザ試験の実行ファイルなし|コンテナ内で `npm run test:setup`、その後 `npm run test:browser`|

コンテナだけ破棄するにはホストで `bash scripts/compose.sh down`。依存volumeは残ります。`bash scripts/compose.sh down --volumes` はこのPROJECT_NAMEの依存キャッシュを消します。別プロジェクトやDBを含むComposeへこの操作を流用しないでください。ホスト全体のpruneは使いません。

質問用には、操作した場所（ホスト/コンテナ）、コマンド、期待結果、診断のエラー文、VERSION.json、OS、Docker/Composeの版を添えます。.envの中身やDocker inspectの環境変数全体は送らないでください。

停止・削除も同梱のcompose.shを使います。設定と環境変数の競合、同じ識別名を使う別フォルダを拒否し、このフォルダのCompose・設定・識別名を明示して実行します。
