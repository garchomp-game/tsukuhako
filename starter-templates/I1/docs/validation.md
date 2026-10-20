# 実測記録

検証日: 2026-10-20。テンプレート: I1 0.1.0。Linux Mint 22.3 / x86_64、kernel 7.0.0-31-generic、Docker 29.9.1、Compose 5.6.0、Buildx 0.38.0、Dev Container CLI 0.89.0 で実測しました。メモリ 23 GiB、検証開始時の空きディスク約 335 GiB。制作側 CLI の実行にはホスト Node 24.19.0 を使用しましたが、配布物の起動は Bash と Docker で成立します。

## 確認したこと

|項目|結果|実測内容|
|---|---|---|
|A01 単独配布|PASS|ZIP を日本語・空白の別フォルダへ新規展開し、configure → doctor → 実CLI up → setup/check/query を実行|
|A02 前提不足|PASS|Docker 接続不可、設定欠落、無効ポート、別コピーの .env を日本語で診断|
|A03 固定依存|PASS|PostgreSQL 18.6 の固定 digest を取得し、同版 psql を実行。npm lockfile は SQL 基盤のため対象外|
|A04 Dev Container|PASS|実 CLI up / exec、vscode uid=1000、作業フォルダ書込、psql 接続|
|A05 SQL 機能|PASS|架空データ 2 行、CRUD、日本語・絵文字・文字列保持、各制約違反|
|A06 変更|PASS|SQL のラベル変更を再実行で反映。002 migration で列追加・値保存|
|A07 停止・再開|PASS|Compose stop/start と CLI 再接続。VS Code 操作は別欄で未確認|
|A08 再構築・保持|PASS|両コンテナを削除して CLI で再作成。追加行・追加列・編集SQLを保持|
|A09 初期構築・reset|PASS|空DBから構築、seed再実行、明示reset、空DBへの再構築。別コピーの行は保持|
|A10 プロジェクト分離|PASS（同一構成）|日本語・空白を含む別フォルダ、別volume、55432/55433で同時稼働。異種代表共存は全体レポート参照|
|A11 意味のある検証|PASS|CRUD、境界80/81文字、空文字、NULL、重複、負数、SQL rollback、migration改変拒否・失敗時atomic rollback|
|A12 CI移植|PASS（設定・ローカル同等実行）|workflow YAML を解析し、同じ setup ×2 / check を実行。GitHub上の実行は未実施|
|A13 公開情報|PASS|DB公開は127.0.0.1のみ。Dockerソケット未共有。配布物に実.envなし。ログのローカルパスワードを除去|
|A14 教材|PASS（CLIでの手順確認）|起動・SQL変更・migration追加・停止・復旧を記載手順で実行。初学者の理解度は未評価|
|A15 環境表記|PASS|実測Linuxと、未確認のVS Code/Windows/macOSを分離|
|A16 引き渡し|PASS|独立ソース、教材、固定版、SQLテスト、CI、template.json、詳細証拠を作成|

## 測定範囲

初回のイメージ取得は約20秒、その後の修正版 Dev Container 作成は約11秒、コンテナ削除後の再作成は約7.4秒でした。ネットワーク・Docker キャッシュを完全に空にした比較試験ではありません。共有 Docker の prune は行っていません。Docker が報告した基底イメージの Size は 635,321,281 bytes（ネットワーク転送量の実測ではありません）。一時点のメモリは作業用約0.7 MiB、DB約29〜34 MiBで、最低必要メモリの保証ではありません。

## 残っている確認

|項目|状態|
|---|---|
|VS Code の実画面で Reopen / Rebuild / 再接続|NOT_RUN|
|Windows + WSL2 実機|NOT_RUN|
|macOS / arm64 実機|NOT_RUN|
|未導入PCでのDocker/WSL導入|NOT_RUN|
|GitHub Actionsの実実行|NOT_RUN（push・公開は依頼範囲外）|
|初学者の試用|NOT_RUN|
|ブラウザ操作・UI目視、型チェック、アプリbuild|対象外（SQL作業基盤）|

## 検出して直した問題

- Compose build と CLI が生成する context 外 Dockerfile の組合せで起動失敗。プロジェクト内 Dockerfile を先行ビルドし Compose がその image を使う構成へ変更し、実 up / exec で合格。権限変更はしていません。
- psql の `\quit 3` は終了コードを受け取らず0を返したため、migration 改変時に SQL の明示的エラーを発生させる実装へ修正。終了コード3と transaction rollback を再確認しました。

全体パックの `validation/i1/commands.ndjson` に日時・コマンド・終了コード・所要時間、`logs/` に結果、`resources.json` に作成した資源を記録します。失敗した旧実装のログも区別して残しています。単独 ZIP には要約を同梱し、詳細証拠は全体パックに含めます。
