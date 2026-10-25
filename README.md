# ツクハコ

**開発環境を作り、手順を読みながら最初のWeb画面を動かすための、無料のデスクトップアプリです。**

プロジェクトのファイル作成と61章の教材をひとつにまとめています。アカウント登録は不要です。ソースコード・教材・テンプレートはMITライセンスで公開しています。

## ダウンロード

### [Windows版インストーラーをダウンロード（1.0.2・exe）](https://github.com/garchomp-game/tsukuhako/releases/download/v1.0.2/tsukuhako-windows-x64-1.0.2-setup.exe)

主な対象は **Windows 11・x64（Intel / AMD）** です。開発環境にはWSL 2を使います。本体は通常ユーザーでインストールできます。未署名のためWindowsの警告が表示されることがあります。OSの保護機能を無効化する必要はありません。

| OS・形式 | ダウンロード | 導入・更新・削除の案内 |
| --- | --- | --- |
| **Windows x64** | [インストーラー（exe）](https://github.com/garchomp-game/tsukuhako/releases/download/v1.0.2/tsukuhako-windows-x64-1.0.2-setup.exe) | [Windowsの案内](https://github.com/garchomp-game/tsukuhako/releases/download/v1.0.2/INSTALL-windows.txt) |
| Debian・Ubuntu系 Linux x64 | [debパッケージ](https://github.com/garchomp-game/tsukuhako/releases/download/v1.0.2/tsukuhako-linux-amd64-1.0.2.deb) | [debの案内](docs/linux-deb/INSTALL.txt) |
| Fedora・Rocky LinuxなどRed Hat系 Linux x64 | [rpmパッケージ](https://github.com/garchomp-game/tsukuhako/releases/download/v1.0.2/tsukuhako-linux-x86_64-1.0.2.rpm) | [rpmの案内](docs/linux-rpm/INSTALL.txt) |

[リリース一覧](https://github.com/garchomp-game/tsukuhako/releases) · [ファイルの確認用SHA-256](https://github.com/garchomp-game/tsukuhako/releases/download/v1.0.2/SHA256SUMS) · [版別の検証レポート](validation/oss-1.0.2/REPORT.md)

WindowsのCI検証とWindows 11＋実WSLでの操作確認、Linuxコンテナーでの導入検証とデスクトップの操作確認は区別しています。具体的なOS・合格した項目・未確認項目は検証レポートに記録しています。RHEL実機・macOS・ARM向けの動作確認はありません。

## はじめる

1. 自分のOSに合う **インストーラーを開き、インストール**します。Windowsは `.exe`、Linuxは上の表から `.deb` または `.rpm` を選びます。
2. Windowsのスタートメニュー、またはLinuxのアプリケーションメニューから **「ツクハコ」** を起動します。
3. **「はじめてのWeb画面で始める」** を押し、画面の案内に沿って準備と保存先の選択を進めます。Windowsでは開発するWSLと同梱ヘルパーの準備を先に済ませます。
4. 作成後の手順で **「このフォルダーをVS Codeで開く」** を押します。その下の案内に沿って開発環境を起動し、表示されたURLでサンプル画面を確認します。

開発環境を動かす際にはDockerとVS Code・Dev Containers拡張が必要です。WindowsではWSL 2とVS CodeのWSL拡張も使います。アプリ内の「準備チェック」から確認できます。プロジェクト用のDev Container設定はツクハコが作成します。本体の利用のためにNode.js・npm・Pythonを別途インストールする必要はありません。

教材はアプリ内の **「学ぶ」「ガイド」「困ったとき」** からオフラインでも読めます。開発環境の初回起動には、依存ファイルを取得するためのネット接続が必要です。

## できること

- Web画面、API、データベースなどの学習用プロジェクトを作成する
- 今回の保存先と接続先が入った手順を読みながら進める
- 「手順を見ながら進める」「必要な操作だけ進める」を切り替える
- サンプルを動かし、変更・復元・停止・再開を学ぶ

Web画面・APIの標準ポートは、PC側とコンテナー内ともに3000です。使用中の場合は詳細設定で空いているポートを選びます。現在は自動で3001へ切り替える機能はありません。

## 開発に参加する

[ソースからのビルド・検証手順](generator-desktop/README.md) · [リリース手順](docs/linux-deb/UPLOAD.md) · [不具合・改善の提案](https://github.com/garchomp-game/tsukuhako/issues)

不具合の報告には、OS、ツクハコの版、行った操作、表示されたエラーを添えてください。認証情報や `.env` の内容は載せないでください。個人で開発しているため、対応時期の約束はできません。

## ライセンス

[MIT License](LICENSE)。本リポジトリのオリジナルのコード・教材・テンプレートは、ライセンスの条件に従って利用・改変・再配布できます。生成したプロジェクトにもライセンスを同梱します。依存パッケージとランタイムにはそれぞれのライセンスが適用されます。[同梱ライセンスの説明](THIRD-PARTY-NOTICES.md)

本アプリは明鏡の公式アプリではありません。過去の販売案や検証記録は開発履歴として残しています。現在の配布窓口は、このREADMEとGitHub Releasesです。
