# ツクハコ 0.4.4

学習用の開発環境を作り、同梱教材で起動・最初の変更・復元まで進むReact/Electronアプリです。明鏡の公式アプリではありません。

初回配布対象は **Windows 11 x64（NSIS exe）とLinux x64（tar.gz）** です。Windowsは未署名で、Server 2022 CIの導入・教材表示・削除・隔離読書データ保持を確認済み。Win11通常ユーザーと実WSLの開発経路は未確認です。Linux Mint 22.3で最終配布物の通常起動・教材UX・F2の初回準備・表示・編集・復元・再開を確認しました。macOS・ARMは対象外です。

0.4.4では、狭い画面や200%表示の目次を折りたたみ、本文と操作が画面内に収まるようにしました。読書位置・キーボード操作・ヘルプ復帰も最終配布物で確認しています。配布はOS別の製品・START_HERE.txt・manifest・SHA256SUMSの4ファイルです。一般受取人向けの保管先・窓口は未設定のため、案内はドラフトです。

開発を始める際は、構成ターミナル本文の「準備完了」と初期構成の正常終了を確認してから `npm run dev` へ進みます。生成先のSTART_HERE.mdに具体的な保存先・ポートがあります。I1はDB用の別手順で、生成済みプロジェクトは自動更新しません。

- 配布手順、署名、Windowsのインストール・削除の扱い: [Desktop README](generator-desktop/README.md)
- OS別の検証結果と配布物: [0.4.4レポート](validation/release-0.4.4/REPORT.md) / [5〜10分の試用](validation/release-0.4.4/TRY-5-10-MIN.md)
- 受取先の判断とアップロード下書き: [配布経路](validation/release-0.4.4/DELIVERY.md)
- 旧0.4.2の6構成実機記録: [Linux初回操作](validation/onboarding-0.4.2/20261021T0919-JST/REPORT.md)。新版やWindowsの合格へ読み替えません。
- F1/F2/B1/S1/S2/I1が生成対象、S3は参考資料。テンプレートZIP自体は変更していません。

制作側はDesktop READMEのコマンド、または手動の [Desktop validation artifacts](.github/workflows/desktop-validation.yml) で作成します。OS別のprivate Actions artifactとして取得でき、公開Releaseへ自動公開しません。製品commitと各成果物のSHA-256はmanifestへ記録します。

ソース管理は [garchomp-game/tsukuhako](https://github.com/garchomp-game/tsukuhako)（private）。依存フォルダ・製品ランタイム・大容量配布物・実際の.envはGitに追加しません。公開販売・課金・公開ストレージへのアップロードは行っていません。
