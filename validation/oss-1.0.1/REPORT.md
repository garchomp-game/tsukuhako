# ツクハコ 1.0.1 — OSS公開

## 変更

- MITライセンスを追加。本体、WSLヘルパー、7テンプレートのZIPにライセンスを同梱。
- READMEを無料ダウンロード・インストール・初回操作の順に変更。GitHub Releasesの単体debを入口にする。
- 1.0.0の動作を引き継ぎ、配布案内・ライセンス・バージョンを更新。生成時のポート自動選択などの新機能は追加していない。
- 過去の販売案は履歴として保持。個人用Starlight資料・ライブラリは公開対象に含めていない。

## ソース検証

- generator: 47/47 PASS。
- desktop: 34/34 PASS。
- TypeScript・Viteビルド: PASS。
- 現行の教材検査: 6構成の生成、317リンク、61章のハッシュと再生成一致 PASS。
- 7テンプレート: ZIPとソースの全ファイル一致、MITライセンス同梱 PASS。
- 過去のGit履歴、追跡されたZIP、Actionsログの公開前確認は `publication-audit.json` を参照。

旧 `check-content-links-040.mjs` は見出し付きのlessonリンクを章名として判定するため失敗した。旧検証結果は書き換えず復元し、現行UIのリンク解決・見出しまで検査する `tools/onboarding-revision/content-check.mjs` で確認した。

## 配布確認

- Linux debビルド、ステージ検査、パッケージ回帰1/1、ヘルパー検査、最終deb静的検査、配布先コピーとハッシュ一致: PASS。
- 最終debから抽出したコードで6構成を実際に生成し、LICENSE・注意事項・ガイドの同梱を確認: PASS（GUI実機操作ではない）。
- 10個のnpm実行時依存のライセンスを元ファイルと照合: PASS。従来漏れていたSchedulerも追加。
- 最終配布ファイル: `tsukuhako-linux-amd64-1.0.1.deb`
- サイズ: 133,506,292 bytes。
- SHA-256: `6790144899e469cd8c1720155f0235d43d26a44960b74516a4b47cdd23cbccf8`。
- 製品ソース: `2c6b61d2533bf4b7821a3aa6297ff44fc81dda0c`、`dirty: false`。タグには、このビルド後の検証レポートの追記も含める。
- 公開先: [v1.0.1 Release](https://github.com/garchomp-game/tsukuhako/releases/tag/v1.0.1)。公開済み。ログインなしのHTTP取得でリポジトリ・README・5つのRelease asset・検証レポートのリンクを確認し、debを全量ダウンロードしてSHA-256とサイズの一致を確認した（`public-download.json`）。

## 未確認の範囲

この版での所有者のGUIインストール・メニュー起動、Dev Containerからサンプル表示までの通し操作、Windows・macOS・ARM・新規PCは未実施。1.0.0以前の実機結果は過去の証拠であり、この版の結果とは区別する。インストール済みアプリは変更しない。

## 公開後の記録

GitHubのvisibilityはpublic、既定ブランチはmain、認識されたライセンスはMIT。READMEの直接ダウンロード先はv1.0.1のdeb。配布manifestの検証レポート参照先を実在するOSSレポートへ補正し、配布ツールも実在するレポートを選ぶようにした。公開済みdebのバイト列は変更していない。
