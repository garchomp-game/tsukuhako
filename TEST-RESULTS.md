# 0.4.2 検証結果

以下は製品修正時点の検証です。同日後刻に取得したLinux初回操作・全6構成・再接続/Rebuildは [別集計の網羅表](validation/onboarding-0.4.2/20261021T0919-JST/coverage.md) を参照してください。ここにある50件の自動テストを再実行した件数には含めていません。

実行日：2026-10-21。Linux Mint 22.3 x64、Node 24.19.0、VS Code 1.142.0、Dev Containers 0.470.0。

| 確認 | 結果 | 証拠 |
|---|---|---|
| generator | 27/27 PASS、skip 0。6構成の編集対象・場所・順序・コマンド／URL、生成ガイドと静的教材を検査 | [ログ](validation/ux-0.4.2/core-tests.txt) |
| generator-desktop | 23/23 PASS、skip 0。S2診断→Windows章→追加準備の経路も検査 | [ログ](validation/ux-0.4.2/desktop-tests.txt) |
| TypeScript/Vite | PASS | [ログ](validation/ux-0.4.2/renderer-build.txt) |
| 最終LinuxアプリGUI | 4グループ PASS。学ぶS2→ヘルプ3回→元の章・scroll、作るF2→ヘルプ再押下→作る、F2生成ガイド、Windows S2 fixture | [結果](validation/ux-0.4.2/gui.json) |
| F2実起動・変更・復元 | PASS。日本語保存先、ポート43055、実VS CodeのDev Container、統合ターミナルのnpm run dev、エディタで変更・復元保存、ブラウザHMRと表示復元 | [結果](validation/ux-0.4.2/vscode-f2.json) / [起動画面](validation/ux-0.4.2/screenshots/vscode-f2-start.png) |
| Linux同梱helper | 6構成生成・取消・実行先の結び付け・終了 PASS。WSL名はfixture、Windows transportは未実施 | [結果](validation/ux-0.4.2/helper-linux-tests.json) / [診断中終了](validation/ux-0.4.2/helper-shutdown.json) |
| 配布物整合性・保存 | PASS。GUI/F2で使った実行版のSHAと配布版が一致。教材50章・画像1件、旧テンプレートZIP7件、0.4.1配布物を照合 | [結果](validation/ux-0.4.2/release-check.json) |
| 後片付け | PASS。検証用コンテナのみ終了・削除、ボリューム保持、元ソースへ復元。既存2コンテナのStartedAt不変 | [結果](validation/ux-0.4.2/cleanup.json) |

Windows S2のGUI試験はLinux上のIPC fixtureです。curl/timeout不足からWindows章→S2追加準備→作る→同じdistro・S2を3回診断し、入力保持と自動インストール呼出し0を確認しました。fixtureの観測値を利用可能へ切り替えても、明示的に再確認するまで画面の未導入状態は維持されます。Windows/WSL対応済みという意味ではありません。

今回未実施：Windows/macOS実機と0.4.2実行配布物、初心者による無補足試験、スクリーンリーダー、クリーンPC導入、F2以外の実起動、編集後Rebuild・再接続、ホスト全体のオフライン、購入・受取・課金。過去0.4.1の広いGUI試験を今回の再実行件数へ含めていません。

F2操作の自動化はVS Codeの検索・置換UIと保存操作を使用しました。初回の試験用操作は入力欄のDOM差異と自動インデントを受けて調整し、最後に変更・復元の一連を通して確認しています。製品の障害としては扱っていません。

再実行には `tools/verify-ux-042.mjs`、`tools/launch-vscode-042.mjs`、`tools/vscode-edit-restore-042.mjs` を使用します。VS Codeの信頼・Dev Container接続・統合ターミナル起動は実UIで行い、エディタでapp/page.tsxを開いてから編集試験を実行します。各試験は新しい専用profileと保存先を使用してください。
