# ツクハコ 0.4.1 作業結果

UX点検、修正、再検証を完了しました。0.4.0の配布物は保持し、別ディレクトリで0.4.1を作成しています。

WSLの案内先と再列挙、開けないファイル参照、生成結果のポートに合う教材、準備・復旧との往復、次の新規生成、ポート見直し、WSL選択解除後の読書保存を改善しました。

- [UX-REVIEW.md](UX-REVIEW.md)：問題・影響・修正・証拠・残課題
- [UX-FLOWS.md](UX-FLOWS.md)：操作とガイドの往復
- [TEST-RESULTS.md](TEST-RESULTS.md)：実機／自動／fixture／NOT_RUN
- [NEXT-ACTIONS.md](NEXT-ACTIONS.md)：本人が次に試す5件
- [レビューZIP](dist/tsukuhako-ux-review-0.4.1-2026-10-21.zip)：修正ソース・差分・検証記録・画面。製品ランタイムは含みません
- [Linux実行版](dist/tsukuhako-linux-x64-0.4.1.tar.gz)：レビューZIPと別配布

自動試験43件、配布GUIの14グループ、拡大表示、生成中の安全性、Linux helper試験を通過しました。F2は実VS CodeのDev Containerで起動し、見出し変更・ブラウザ反映・バイト一致の復元まで確認しました。

Windows/macOS実機、未導入PC、本当の初心者による利用試験、販売・受取画面は未実施です。販売公開は行っていません。
