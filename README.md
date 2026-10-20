# ツクハコ 0.4.1

学習用の開発環境を作り、同梱教材で起動・最初の変更・復元まで進むアプリです。React/Electron＋共有Nodeコア、ローカル教材の構成です。

今回の変更は操作と教材のUX改善です。[UX-REVIEW.md](UX-REVIEW.md) → [UX-FLOWS.md](UX-FLOWS.md) → [TEST-RESULTS.md](TEST-RESULTS.md) → [NEXT-ACTIONS.md](NEXT-ACTIONS.md) の順に確認してください。

- Linux実行版：`dist/tsukuhako-linux-x64-0.4.1.tar.gz`。展開して `tsukuhako` を通常ユーザーで起動します。ホストのNodeは不要です。
- レビュー資料：`dist/tsukuhako-ux-review-0.4.1-2026-10-21.zip`。製品ランタイムを含まない、ソースと検証記録です。
- Linux Mint 22.3 x64で確認。Windows/WSL 2とmacOSの実機確認はNOT_RUN。0.4.1のWindows/macOS実行版は未作成です。
- F1/F2/B1/S1/S2/I1が生成対象。S3は参考資料です。テンプレート実装版とZIPは0.4.0から変更していません。

制作側の操作：

```sh
npm ci --prefix generator
npm ci --prefix generator-desktop
npm ci --prefix tools
npm test --prefix generator
npm test --prefix generator-desktop
npm run build --prefix generator-desktop
python3 tools/package-desktop-041.py
```

教材再構築は `node tools/build-curriculum-041.mjs`、Windows用helperの再構築は `python3 tools/build-helper-041.py` です。helperの作成だけではWindows対応済みになりません。

ソース管理先はプライベートリポジトリ [garchomp-game/tsukuhako](https://github.com/garchomp-game/tsukuhako) の `main` です。0.4.1からGit管理を開始しています。カタログが参照する7つのテンプレートZIPと検証記録は同梱しています。製品の実行版・レビューZIP・依存パッケージ・一時実行環境はGit管理対象外です。クローン後は上記の制作側の手順でLinux実行版を再構築できます。レビューZIPの再作成には、別途0.4.0の比較用ソースと実機検証の成果物が必要です。

新規プロジェクトだけへ生成します。作成済みフォルダの自動更新、独自アカウント登録、認証メール、外部公開、会員サイトはこのアプリの操作に含みません。価格・配布先・更新期間・サポートは未確定です。
