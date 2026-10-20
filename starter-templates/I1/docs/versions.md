# 採用版と設計

確認日: 2026-10-20。テンプレート版: 0.1.0。

|対象|固定したもの|
|---|---|
|DB / psql 作業環境|`postgres:18.6-bookworm`|
|イメージ index digest|`sha256:afc7e2d441324c0388fa80c3d24f733b4194a4eb7f47dd8ee2b08eb1a24a647c`|
|Linux amd64 manifest digest|`sha256:9551dd5bf356409a21b31248f49b33bba9bb1877365f3a7e933aecd9af3cf52d`|
|CI checkout|`actions/checkout` v4.2.2 の commit を固定|

I1 は npm 依存を持たない SQL 基盤のため、Node/npm/package-lock.json は対象外です。代わりに DB とクライアントを同一の固定イメージから復元し、SQL の実結果を検証します。イメージ内の配布物も digest で特定します。ホストへの追加 package install は行いません。

Dev Container の initializeCommand は設定診断後、プロジェクト内の Dockerfile を `docker build` で先にビルドします。Compose はそのローカルイメージを使用します。Compose 5.6.0 / Buildx 0.38.0 と CLI 0.89.0 では、Compose build が CLI の生成する context 外の Dockerfile を拒否したため、生成ファイルが不要な構成にしています。安全確認を無効にする環境変数や追加権限は使用しません。関連する [VS Code の公式 issue](https://github.com/microsoft/vscode-remote-release/issues/11896) も確認しました。

PostgreSQL のサポート方針と Docker Official Image のタグを確認し、現在の安定版 18.6 を採用しました。18 系の公式イメージの保存先に合わせて named volume を `/var/lib/postgresql` に付けます。major version の数字だけを書き換えて既存 volume を使う更新はしません。

`configure.sh` がパスの checksum を識別子に付けます。同じ表示名でも別フォルダは別 Compose project / volume です。ホストポートはコピーごとに選び、localhost にだけ公開します。`.env` にランダムなローカル用パスワードを作ります。外部サービスや秘密キーは不要です。

migration は advisory lock と一つの transaction で適用し、ファイルの SHA-256 を履歴に保存します。再適用は skip、適用後の改変はエラーです。seed は code の一意制約と `ON CONFLICT DO NOTHING` により既存行を保ちます。起動／再接続時には `doctor` だけを行い、schema やデータを初期化しません。

SQL の名前の制約は通常の前後スペースを除く 1〜80 文字、quantity は 0 以上です。これは学習用の商品という I1 独自の例で、他テンプレートの入力 API 契約とは別です。

参照した公式資料:

- [PostgreSQL versioning](https://www.postgresql.org/support/versioning/)
- [PostgreSQL Docker Official Image](https://hub.docker.com/_/postgres)
- [psql](https://www.postgresql.org/docs/18/app-psql.html)
- [Compose project name](https://docs.docker.com/compose/how-tos/project-name/)
- [Dev Container と Compose](https://code.visualstudio.com/docs/devcontainers/create-dev-container)
- [Dev Container CLI](https://code.visualstudio.com/docs/devcontainers/devcontainer-cli)

教材とスクリプトはこの試作用に作成しました。PostgreSQL、Docker、VS Code 等の第三者ソフトウェアには各ライセンスが適用されます。このパックの外部配布・販売条件は依頼者の決定事項として保留しています。
