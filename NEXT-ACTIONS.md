# 次に確認すること

0.4.3の[配布物と証跡](validation/release-0.4.3/REPORT.md)を用意しました。初回対象はWindows 11 x64とLinux x64です。

1. Windows実機で未署名NSISを普段のユーザーとして導入し、署名状態・初回警告・スタートメニューからの通常起動を記録する。OS保護を無効化しない。
2. Windows F2を、選択WSL 2の通常ユーザー→helper→生成→Windows版Code→Dev Container→初期構成正常終了→起動→編集→復元まで確認する。日本語・空白のユーザーパス/生成先、任意CWDも含める。
3. Windows S2で選択WSLのツール・Docker Desktop Integration・Supabase・通常停止後のデータ保持を確認し、最後にアンインストールしてプロジェクト・DB・WSL・設定・helperが残ることを確認する。
4. Linuxの未導入実機または隔離VMで導入を確認する。既存開発PCのDockerやVS Codeを削除して再現しない。
5. 初心者本人が案内だけでF2を一周する。Linux Mintの自動操作合格と分け、迷った箇所を記録する。
6. 一般配布前にWindows署名・受取先・価格・更新期間・サポート条件を決める。macOS、ARM、200%表示の多重スクロール改善は後続。

Windowsの全6構成を対応済みと案内する前に、F1/B1/S1/I1も実機範囲を揃えてください。Linuxの旧0.4.2の全6構成記録は [当時のエビデンス](validation/onboarding-0.4.2/20261021T0919-JST/INDEX.md) として保持しています。
