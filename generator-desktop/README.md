# ツクハコ Desktop 1.0.2

開発環境のファイルを作り、同梱教材でサンプルの動作確認まで進む。文字の変更・復元は任意で続けられるアプリです。明鏡の公式アプリではありません。

## 配布対象

主な配布対象はWindows 11 x64です。`tsukuhako-windows-x64-1.0.2-setup.exe` を通常ユーザーで導入し、スタートメニューから起動します。開発先にはWSL 2の通常ユーザーを使います。未署名で、Windows Server CIとWindows 11・実WSLの確認範囲は区別します。[Windowsの案内](https://github.com/garchomp-game/tsukuhako/releases/download/v1.0.2/INSTALL-windows.txt)

Linux x64は `tsukuhako-linux-amd64-1.0.2.deb` と `tsukuhako-linux-x86_64-1.0.2.rpm` を提供します。debはDebian・Ubuntu系、rpmはFedora・Rocky LinuxなどRed Hat系向けです。[debの案内](../docs/linux-deb/INSTALL.txt) / [rpmの案内](../docs/linux-rpm/INSTALL.txt)。確認したOSと未確認範囲は[版別レポート](../validation/oss-1.0.2/REPORT.md)に記録します。

## Linuxの保存場所

本体は `/opt/tsukuhako`、メニューは `tsukuhako.desktop`、パッケージ・実行ファイル名は `tsukuhako`、appIdは `jp.tsukuhako.desktop` です。導入時の管理者認証はシステムへの配置に必要です。普段は通常ユーザーで起動します。Node.js・npm・Python・ビルドツールは利用者のPCへ要求しません。OSの実行時ライブラリはdebの依存で取得するため、初回導入時には通信が必要な場合があります。

設定は従来の `appData/tsukuhako`（通常 `~/.config/tsukuhako`）に保存します。生成先はユーザーのフォルダです。インストール先へログ・設定・プロジェクトを書きません。本体とメニューをパッケージ管理画面で削除しても、読書設定、生成プロジェクト、Dockerデータは残します。新debでの更新・再導入でも保全します。旧tar版を自動で探して削除しません。

Electron sandboxとウィンドウのsandboxを有効に保ちます。electron-builderの標準保守スクリプトが実行ファイルの登録、chrome-sandboxの権限、必要時にアプリ固有のAppArmor profileを扱います。OS全体の保護を無効にせず、Docker・VS Code・グループ権限を変更しません。実際に生成したスクリプトと隔離試験結果はレポートへ記録します。

## はじめて使う・教材

最初の「作る」画面で「はじめてのWeb画面で始める」を選びます。静的ガイドは「全体の流れを読む」または上部の「ガイド」から読めます。生成後は「サンプル画面を表示する手順へ」から今回の値が入った手順へ進みます。START_HERE / FIRST-RUN / TROUBLESHOOTING / NEXT-STEP / FEEDBACKの5正本を既存の教材ビューアへ収め、ダウンロードしたdebを移動・削除した後もオフラインで読めます。登録・任意アンケート・コミュニティ参加は必須ではありません。

本体の導入と開発準備は別です。最初の候補は「はじめてのWeb画面」。「準備チェック」でDocker・VS Code・拡張を確認します。診断は起動成功を保証するものではなく、実際のDev Container構築と画面表示は別途確認します。VS Codeのサインインはローカル学習には不要です。今生成したフォルダだけを信頼してください。

F1/F2/B1/S1/S2はReopen in Containerのあと、構成ターミナルの「準備完了」と初期構成の正常終了を確認してから `npm run dev` を実行します。接続バッジやタブ名だけでは完了と判断しません。I1はDB専用手順です。生成先のSTART_HERE.mdには具体的な保存先とポートがあります。

目次は狭い画面で折りたため、Escで本文に戻れます。読書位置はヘルプ往復・再起動で保持します。Ctrlと+ / -で拡大縮小、Ctrlと0で100%へ戻せます。

## Windowsの保存場所

Windowsの本体はNSISでユーザー領域へ導入します。読書設定は `%APPDATA%/tsukuhako`、プロジェクトは選択したWSLのHOME配下です。同梱Linux x64ヘルパーは `~/.tsukuhako-helper/1.0.2-linux-x64` へ展開し、ハッシュを照合します。アンインストールでWSL・Docker・プロジェクト・読書設定は削除しません。

## 制作側の再現手順

Linuxビルド環境はNode 24.19.0（nvm）、Python 3.12（uv）、dpkg-deb、tar。Electron 44.9.1 / electron-builder 26.15.3はlockfile固定です。ビルダーが必要な補助ツールをキャッシュへ取得します。利用者側ではこの手順を実行しません。

```sh
npm ci --prefix generator
npm ci --prefix generator-desktop
node generator-desktop/node_modules/electron/install.js
node tools/build-curriculum.mjs
uv run --no-project --python 3.12 python tools/build-helper.py
npm run build --prefix generator-desktop
npm test --prefix generator
npm test --prefix generator-desktop
```

生成済み教材・helperのmetadataを含めて製品ソースをcommitし、作業ツリーをcleanにしてから実行します。テスト用の `--allow-dirty` で作ったステージは配布検査が拒否します。

```sh
node tools/stage-desktop.mjs
npm run test:package --prefix generator-desktop
uv run --no-project --python 3.12 python tools/verify-helper-archive.py dist/desktop-app
npm run package:linux --prefix generator-desktop
node tools/linux-deb/inspect.mjs dist/linux-deb/tsukuhako-linux-amd64-1.0.2.deb
node tools/linux-deb/deliver.mjs dist/linux-deb/tsukuhako-linux-amd64-1.0.2.deb dist/delivery-linux-deb-1.0.2
# RPMはホストにビルドツールを入れず、Docker内で作成
node tools/linux-rpm/build.mjs
```

隔離環境の更新・削除試験はtools/linux-debの検証ツールを使います。詳しい引数・条件はその冒頭と検証レポートを参照してください。所有者のPCへは先回りしてインストールしません。

手動の `Desktop validation artifacts` workflowはOSを選択し、既定でWindowsを生成します。Windows runnerでNSISを作成し、インストール・起動・教材表示・終了・削除を検査します。ビルド用artifactを14日保持します。このworkflow自体はReleaseを作りません。一般利用者にはGitHub Releasesのexe・deb・rpmをOSに合わせて案内します。

deb設定はelectron-builder.linux.json、rpm設定はelectron-builder.rpm.json、Windows設定はelectron-builder.jsonです。共通ステージはASARを使用せず、worker・教材・テンプレート・ライセンスをresources/appへ配置します。Nodeのライセンスはhelper.tar、ElectronとChromiumはアプリ配布ルート、React/Markdown/fflateはthird-party、テンプレートの注意事項は各ZIPへ含めます。オリジナルのコード・教材・テンプレートにはMITライセンスを適用し、本体・ヘルパー・生成プロジェクトにもLICENSEを同梱します。

build-info.jsonとbundle-files.jsonに版・ソースcommit・ファイルのSHA-256を記録します。配布先はGitHub Releasesです。docs/linux-deb/UPLOAD.mdに公開手順を用意しています。

## 1.0.2の案内モード

開始前と生成後の手順で「手順を見ながら進める」「必要な操作だけ進める」を選べます。選択をローカルに保存します。必須操作、保存先、接続先は共通です。生成後のVS Codeボタンは接続先カード直下にあります。簡潔な表示から詳細の見出しを開いた場合も、元の表示へ戻れます。設計はdocs/ux-startup-modes.mdを参照してください。
