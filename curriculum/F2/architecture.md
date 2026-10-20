# 構成を理解する

ホストにあるソースを `/workspace` にbind mountします。コンテナにはNode/npmなどの実行道具が入り、ブラウザはホスト側で動きます。ブラウザの `http://localhost:3001` は `127.0.0.1:HOST_PORT → app:3000` に接続します。コンテナ内のlocalhostはそのコンテナ自身です。

`compose.yaml` は起動単位・ポート・volumeを定義し、`.devcontainer/devcontainer.json` はVS Codeの接続先・ユーザー・初回処理を定義します。Dockerfileは道具を固定し、package-lock.jsonはnpm依存の具体的な版を固定します。初回は `npm ci` の完了を待ち、その後に利用者が開発サーバーを起動します。再接続だけでサーバーを重複起動しません。

|保存対象|場所|停止・再構築|削除の影響|
|---|---|---|---|
|ソース・教材|ホストの展開フォルダ|保持|フォルダを消すと失う|
|npm依存|プロジェクト別dependencies volume|保持、npm ciで復元|再取得できる|
|取得キャッシュ|プロジェクト別npm-cache volume|保持|再取得が必要|
|ブラウザ試験用Chromium|コンテナの/home/node/.cache|停止では保持、再作成で消える|npm run test:setupで再取得|
|ビルド結果|.next またはdist|再生成可能|ソースは失われない|

この構成の入力状態はブラウザまたはリクエスト内だけで保持します。永続DBは含めません。ソースのGit管理は任意ですが、演習前にバックアップすると戻しやすくなります。
