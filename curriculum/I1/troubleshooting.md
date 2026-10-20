# 困ったとき

|症状|確認と復旧|
|---|---|
|`Docker に接続できません`|ホストで Docker を起動し `docker info` を確認。WSL は Docker Desktop の対象ディストリビューション連携も確認。権限を無断で変更するスクリプトは実行しません。|
|`設定がありません`|ホストで `bash scripts/configure.sh`、続いて `bash scripts/doctor.sh`。`.env.example` は参考用でコピーしません。|
|`port is already allocated`|ホストでこのコピーを `stop`。`.env` の `HOST_PORT` だけを未使用ポートへ変更し `start`。新しいコピーなら最初に `configure.sh --port 55433`。他プロジェクトを止めて解決しません。|
|`別フォルダの .env です`|新しい独立コピーなら `bash scripts/configure.sh --new-copy --port 55433`。新しい識別子と空の DB になります。元のコピーのDBはそのままです。フォルダ移動で同じDBを使い続ける移行はこの初版の自動対象外です。|
|`relation sample_items does not exist`|コンテナ内で `bash scripts/db.sh setup`。接続だけではテーブルを自動生成しません。|
|`DB接続に失敗しました`|ホストで `bash scripts/project.sh status`。`start` で DB を起動。コンテナ内の接続先は `db:5432` です。|
|`password authentication failed`|既存 DB を持つ状態で `.env` のパスワードを変えていないか確認。元の `.env` を復元します。値を相談ログへ貼りません。|
|適用済み migration の変更エラー|既存ファイルを元に戻して、新しい番号の migration を追加。学習用DBを捨ててよい場合だけ [限定reset](recovery.md) を使用。|
|migration の途中で SQL エラー|エラーのファイルを修正して `migrate`。一回の実行はトランザクションなので途中までの変更・履歴は残しません。|
|書込権限がない|Linux/WSL の自分のホーム配下へ置き、VS Code で Rebuild Container。`updateRemoteUserUID` がホストUIDに合わせます。手動 Compose のみでホストUIDが1000以外ならDev Container経由を使用。|
|`bash ... ^M` 等の改行エラー|Git では `.gitattributes` の LF を使います。エディターの改行を LF へ変更し、保存。|

## 質問するとき

OS、実行場所（ホスト／コンテナ）、実行コマンド、期待した結果、実際のエラーを共有します。ホストの `bash scripts/doctor.sh` と `bash scripts/project.sh status`、コンテナの `bash scripts/db.sh doctor` が診断の入口です。

`.env` の内容、`docker inspect` 全文、環境変数の一覧、実データをそのまま貼らないでください。診断スクリプトはパスワードを表示しません。

## Compose 環境変数が競合する

`COMPOSE_ENV_FILES` / `COMPOSE_FILE` などの予約変数や、`.env` と異なる `COMPOSE_PROJECT_NAME` / `PROJECT_NAME` / `HOST_PORT` / `POSTGRES_PASSWORD` を引き継ぐと、初期化・診断で停止します。値をログへ貼らず、シェルの設定を確認してから、該当変数を引き継がない端末でやり直します。既存 `.env` の未対応キーも拒否します。別プロジェクトの資源は操作しません。
