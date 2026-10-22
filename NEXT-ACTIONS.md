# 次に確認すること

0.4.4の[配布物と証跡](validation/release-0.4.4/REPORT.md)を用意しました。OS別配布パック、狭幅/200%の教材UX、Windows CIの導入・教材表示・削除・隔離読書データ保持まで確認済みです。本人はまず [5〜10分の試用](validation/release-0.4.4/TRY-5-10-MIN.md) を進めてください。

1. Windows実機で未署名NSISを普段のユーザーとして導入し、署名状態・初回警告・既定導入先・スタートメニューからの通常起動・既定APPDATAの保持を記録する。OS保護を無効化しない。Server 2022の管理者トークンでのCI成功を、この結果へ読み替えない。[最小手順](validation/release-0.4.4/WINDOWS-TRIAL.md)
2. Windows F2を、選択WSL 2の通常ユーザー→helper→生成→Windows版Code→Dev Container→初期構成正常終了→起動→編集→復元まで確認する。日本語・空白のユーザーパス/生成先、任意CWDも含める。
3. Windows S2で選択WSLのツール・Docker Desktop Integration・Supabase・通常停止後のデータ保持を確認し、最後にアンインストールしてプロジェクト・DB・WSL・設定・helperが残ることを確認する。
4. Linuxの未導入実機または隔離VMで導入を確認する。既存開発PCのDockerやVS Codeを削除して再現しない。
5. 初心者本人が案内だけでF2を一周する。Linux Mintの自動操作合格と分け、迷った箇所を記録する。
6. 一般配布前にWindows署名・受取先・窓口・価格・更新期間・サポート条件を決める。4ファイルのパックとアップロード下書きは [配布経路](validation/release-0.4.4/DELIVERY.md) を参照。private Actionsはread権限が必要で、今回の成果物は2026-11-05 JSTに期限を迎える。権限のない受取人の取得・Brain添付可否は未確認。macOS/ARMは後続。

Windowsの全6構成を対応済みと案内する前に、F1/B1/S1/I1も実機範囲を揃えてください。Linuxの旧0.4.2の全6構成記録は [当時のエビデンス](validation/onboarding-0.4.2/20261021T0919-JST/INDEX.md) として保持しています。
