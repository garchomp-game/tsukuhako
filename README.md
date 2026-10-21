# ツクハコ 0.4.2

学習用の開発環境を作り、同梱教材で起動・最初の変更・復元まで進むReact/Electronアプリです。共有Nodeコアとローカル教材を使います。

0.4.1レビューの3件を修正しました。変更点とエビデンスは [REPORT.md](REPORT.md)、確認範囲は [TEST-RESULTS.md](TEST-RESULTS.md) を参照してください。

2026-10-21のLinux初回操作を追加取得しました。[短い取得レポート](validation/onboarding-0.4.2/20261021T0919-JST/REPORT.md) / [操作別INDEX](validation/onboarding-0.4.2/20261021T0919-JST/INDEX.md)。同じ0.4.2配布物でF2の連続録画、6構成の実起動・変更・復元、再接続・Rebuildを確認し、VM導入と未実施項目を分けています。

ソース管理先は [garchomp-game/tsukuhako](https://github.com/garchomp-game/tsukuhako)（private）。完了した変更をpushし、簡潔なレポートとエビデンスを渡します。ソース一式のレビューZIPは別途依頼があった場合だけ作成します。

- Linux実行版はローカルの `dist/tsukuhako-linux-x64-0.4.2.tar.gz`。展開して `tsukuhako` を通常ユーザーで起動します。利用者側のNodeは不要です。
- Linux Mint 22.3 x64で確認。Windows/WSL 2・macOSの実機確認と0.4.2の実行配布物作成は未実施です。
- F1/F2/B1/S1/S2/I1が生成対象、S3は参考資料です。カタログが参照する7つのテンプレートZIPはGitに含め、内容は0.4.1から変更していません。
- 依存パッケージ、製品ランタイム、検証用実行フォルダ、実際の `.env` はGit管理対象外です。

制作側の操作（今回の確認環境はNode 24.19.0）：

```sh
npm ci --prefix generator
npm ci --prefix generator-desktop
npm ci --prefix tools
node tools/build-curriculum-042.mjs
npm test --prefix generator
npm test --prefix generator-desktop
npm run build --prefix generator-desktop
uv run --no-project python tools/package-desktop-042.py
```

Windows向けhelperの再構築は `uv run --no-project python tools/build-helper-042.py` です。helperを作っただけではWindows実機確認済みにはなりません。

生成済みプロジェクトは自動更新しません。今回の修正は新規生成するSTART_HERE.mdと同梱教材へ反映されます。出品・公開・課金・会員サイト作成は行っていません。

過去のUX点検は [0.4.1のレビュー](UX-REVIEW.md) に残しています。次に本人が試すことは [NEXT-ACTIONS.md](NEXT-ACTIONS.md) を参照してください。
