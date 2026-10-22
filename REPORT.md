> 最新の0.4.4（OS別配布パック・教材UX・Windows CI補助検証）は [短いレポート](validation/release-0.4.4/REPORT.md) と [5〜10分の試用](validation/release-0.4.4/TRY-5-10-MIN.md) を参照してください。以下は0.4.2の記録です。

# ツクハコ 0.4.2 修正レポート

続報（同日後刻）：[Linux初回操作の取得レポート](validation/onboarding-0.4.2/20261021T0919-JST/REPORT.md) / [INDEX](validation/onboarding-0.4.2/20261021T0919-JST/INDEX.md)。以下は製品修正時点の記録です。当時未実施だった残り5構成の起動、F2再接続・Rebuildは続報で実施済みです。

2026-10-21 / 比較元：0.4.1・Git `599d130`。レビューのR041-1〜3を修正しました。ソースは [privateリポジトリ](https://github.com/garchomp-game/tsukuhako) で確認できます。

| 指摘 | 修正・結果 |
|---|---|
| R041-1 | 全6構成で、VS Codeでの復元・保存と、ブラウザ／ターミナルでの結果確認を別ステップにした。対象ファイルを明示し、生成ガイドと静的教材で操作場所の表示を共通化した。 |
| R041-2 | ヘルプ表示中の再押下で対象教材・戻り先・読書位置を変更しない。生成対象F2／学習対象S2で3回押しても保持され、元の章へ戻ることを最終ビルドで確認した。 |
| R041-3 | Windows準備章にS2不足コマンドの説明と追加準備へのリンクを追加。同じWSL・S2・入力内容を保って再確認でき、教材を読むだけでは診断状態を変更しない。Linux上のWindows fixtureで確認した。 |

自動テスト **50/50 PASS**、TypeScript/Viteビルド成功。最終Linux実行版からF2を日本語フォルダ・空きポート43055で生成し、実VS CodeのDev Containerで起動、見出し変更、HMR、復元保存、表示復元まで確認しました。ファイルの復元前後のハッシュも一致しています。開発者による確認であり、初心者試験ではありません。

エビデンス：

- [復元ガイドの操作場所](validation/ux-0.4.2/screenshots/F2-restore-guide.png) / [ヘルプ再押下](validation/ux-0.4.2/screenshots/help-repeat-S2.png)
- [F2変更後](validation/ux-0.4.2/screenshots/f2-changed.png) / [F2復元後](validation/ux-0.4.2/screenshots/f2-restored.png)
- [GUI結果](validation/ux-0.4.2/gui.json) / [実VS Code記録](validation/ux-0.4.2/vscode-f2.json) / [整合性確認](validation/ux-0.4.2/release-check.json)

Windows/macOS実機・同OSの0.4.2実行配布物、初心者試験、F2の編集後Rebuild・再接続、F2以外の実サーバー起動は今回未実施です。[詳細な確認範囲](TEST-RESULTS.md)

Linux試用版はローカルの `dist/tsukuhako-linux-x64-0.4.2.tar.gz`（123,927,962 bytes）。SHA-256は `7946b0d7d757e7879e5bf2a44282b70e40cd649de432c52b33840a885fa819e0` です。Gitにはランタイムを含めていません。

検証用コンテナを終了・削除し、生成ソースとボリュームは保持しました。既存の別プロジェクトの2コンテナ、0.4.1配布物、テンプレート7件の内容は維持しています。OSパッケージ変更・Docker全体リセット・出品・公開・課金は行っていません。
