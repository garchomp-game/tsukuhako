# ツクハコ 0.4.3

学習用の開発環境を作り、同梱教材で起動・最初の変更・復元まで進むReact/Electronアプリです。明鏡の公式アプリではありません。

初回配布対象を **Windows 11 x64（NSIS exe）とLinux x64（tar.gz）** に絞りました。macOS・ARMは後続です。Windowsは未署名の検証用で、Windows/WSL実機の開発経路は未確認です。Linux Mint 22.3で新配布物の通常起動とF2の初回準備・表示・編集・復元・再開を確認しました。他のLinuxや未導入PCの合格に広げません。

0.4.3では、F1/F2/B1/S1/S2の生成結果・START_HERE.md・教材を統一し、構成ターミナル本文の「準備完了」と初期構成の正常終了を確認してから `npm run dev` を実行する案内にしました。I1はDB用の別手順です。生成済みプロジェクトは自動更新しません。

- 配布手順、署名、Windowsのインストール・削除の扱い: [Desktop README](generator-desktop/README.md)
- OS別の検証結果と配布物: [0.4.3レポート](validation/release-0.4.3/REPORT.md)
- 旧0.4.2の6構成実機記録: [Linux初回操作](validation/onboarding-0.4.2/20261021T0919-JST/REPORT.md)。0.4.3やWindowsの合格へ読み替えません。
- F1/F2/B1/S1/S2/I1が生成対象、S3は参考資料。テンプレートZIP自体は変更していません。

制作側はDesktop READMEのコマンド、または手動の [Desktop validation artifacts](.github/workflows/desktop-validation.yml) で作成します。OS別のprivate Actions artifactとして取得でき、公開Releaseへ自動公開しません。製品commitと各成果物のSHA-256はmanifestへ記録します。

ソース管理は [garchomp-game/tsukuhako](https://github.com/garchomp-game/tsukuhako)（private）。依存フォルダ・製品ランタイム・大容量配布物・実際の.envはGitに追加しません。今回も公開販売・課金・会員サイト作成は含めません。狭い画面・200%表示の多重スクロールは改善候補として残しています。
