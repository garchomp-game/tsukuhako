# 0.4.0 OS / CPU / Docker / template 検証表

2026-10-21。G=ファイル生成、R=依存・サンプル実起動と変更/復元、V=実VS Code操作。版はF1 0.1.3、F2 0.1.1、B1/S1/S2 0.1.2、I1 0.1.0。S3は参考資料で生成対象外です。

|OS / CPU|Docker方式|アプリ配布|F1|F2|B1|S1|S2|I1|
|---|---|---|---|---|---|---|---|---|
|Linux Mint 22.3 / x64|Engine 29.9.1 + Compose|展開・起動PASS|G/R PASS|G/R/V PASS|G/R PASS|G/R PASS|G/R PASS|G/R PASS|
|Ubuntu / x64|Engine + Compose|NOT_RUN|NOT_RUN|NOT_RUN|NOT_RUN|NOT_RUN|NOT_RUN|NOT_RUN|
|Linux / x64|Desktop|NOT_RUN|NOT_RUN|NOT_RUN|NOT_RUN|NOT_RUN|NOT_RUN|NOT_RUN|
|Linux / x64|rootless|NOT_RUN|NOT_RUN|NOT_RUN|NOT_RUN|NOT_RUN|NOT_RUN|NOT_RUN|
|Windows 11 / x64 + Ubuntu WSL 2|Desktop WSL Integration|PACKAGED / NOT_RUN|NOT_RUN|NOT_RUN|NOT_RUN|NOT_RUN|NOT_RUN|NOT_RUN|
|macOS / Apple Silicon arm64|Desktop|PACKAGED / NOT_RUN|NOT_RUN|NOT_RUN|NOT_RUN|NOT_RUN|NOT_RUN・Linux補助のみ|NOT_RUN|
|macOS / Intel x64|Desktop|PACKAGED / NOT_RUN|NOT_RUN|NOT_RUN|NOT_RUN|NOT_RUN|NOT_RUN・Linux補助のみ|NOT_RUN|
|Windows ARM64 / Linux ARM64 / 他OS|各方式|対象外 / NOT_RUN|NOT_RUN|NOT_RUN|NOT_RUN|NOT_RUN|NOT_RUN|NOT_RUN|

macOS両行は全6構成が実機未確認で、既存bash/GNUホストスクリプトの適合も未完了です。特にS2の起動補助はLinux専用です。実機がないためDesktopを既存Linux Engineの代わりに導入したり、ユーザーの環境を変更して代用していません。Windows 11/Ubuntu LTS/macOSの具体的な実機OS版は、今後実施した時に記録します。

F2のVはVS Code 1.142.0 / Dev Containers 0.470.0でReopen、統合ターミナル、エディター編集、HMR、復元、window reload再接続、Rebuildを確認した結果です。その他のRはDev Container CLI 0.89.0とブラウザ/API/SQLでの確認です。S2はSupabase CLI 2.121.0の依存サービスと初期データ2件、作成・更新・再読込・削除を含みます。

LinuxパッケージはこのMint端末のGUI、libc/GTK/NSS等の既存ランタイムを使用して起動しました。新規PCでの必要システムパッケージ一式のインストール試験はNOT_RUNです。Windows/macOSはUNSIGNED / NOT_NOTARIZED。保護設定を無効化して合格にする操作は行っていません。

Linux Nodeヘルパーの自動試験ではWSL_DISTRO_NAMEのみfixtureで与えています。Windowsのwsl.exe、Desktop連携、VS Code WSL接続が成功した証拠ではありません。
