# ツクハコ 1.0.0

ユーザー指定により、0.4.8の機能を **1.0.0** として版確定した。本体、生成処理、同梱ヘルパー、教材、現行配布案内の番号を揃え、Linux debを再作成。機能・依存パッケージ・テンプレート固有版・生成済みプロジェクトは変更していない。

- branch: `codex/onboarding-046-20261024`
- 製品sourceCommit: `ca7f39584c8452479fc2d8b299b206a06269739d`
- タグ `v1.0.0` には、ビルド後の検証ツール修正・証跡・レポート追記を含める。製品ソースは上記commitと同じ。
- ビルド時: clean (`dirty:false`)
- 教材: 61章、初回ガイド2026-10-24-r8
- 版変更前の詳しいUI・実VS Code検証：[0.4.8レポート](../onboarding-0.4.8/REPORT.md)

## 今回の検証

| 対象 | 結果 |
| --- | --- |
| 生成処理 / アプリ | [47/47](logs/generator-tests.txt) / [34/34](logs/desktop-tests.txt) PASS |
| 型検査・画面ビルド | [PASS](logs/build.txt) |
| 生成ガイド・教材・原稿 | [6構成・317リンク・61章](logs/content-check.json)、[原稿86/86](logs/content-audit.json) PASS |
| 配布資材・同梱ヘルパー | [欠落/破損検出1/1](logs/package-tests.txt)、[資材](logs/stage.json)、[ヘルパー](logs/helper-verify.json) PASS |
| 最終debの静的検査・配布コピー | [PASS](logs/delivery.json) |
| 最終debを展開してLinux実機で起動 | [3項目 PASS](logs/version-smoke.json)：0.4.8の設定保持、内蔵ガイドの1.0.0表示、実F2生成と既定3000。描画エラー0、正常終了 |

[版表示と旧設定の保持](screenshots/01-version-and-preference.png) / [生成後の画面](screenshots/02-generated-project.png)。元の0.4.8設定ファイルは変更していない。初回の検証ツールは「LOCAL EDITION」を含む要素全体を版番号として比較していたため、版番号部分を対象に直して再確認した。製品側の修正は不要だった。

配布物：[tsukuhako-linux-amd64-1.0.0.deb](/home/garchomp-game/ダウンロード/ツクハコ-1.0.0-Linux/tsukuhako-linux-amd64-1.0.0.deb)（133,504,832 bytes）。同じフォルダーにINSTALL.txt、SHA256SUMS、manifest.json。

SHA-256: `f7a767aa6ae9102fcc33aab18f2e0b3dd9e01a785182f04540d77efb589c5f87`

## 確認範囲

Linux Mint向けのローカル配布物。通常インストール・本人操作、Dockerからサンプル表示までの全工程、Windows実機は今回未実施。旧Windows配布物は0.4.4のまま。ポート自動選択など、0.4.8レポート記載の残件も引き継ぐ。

外部公開、main統合、通常利用アプリの更新は未実施。GitHub Actionsは手動起動専用で、この版では未実行。次は1.0.0インストーラーの導入・操作確認。
