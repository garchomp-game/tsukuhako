# ツクハコ Desktop 0.4.5

開発環境のファイルを作り、同梱教材で起動・変更・復元まで進むアプリです。明鏡の公式アプリではありません。

## Linuxの導入と保存場所

主配布物は `tsukuhako-linux-amd64-0.4.5.deb`。最初の対象候補はLinux Mint 22.3 x64です。ファイルマネージャーからdebを開き、標準の「パッケージインストーラー」（Captain）で導入して、メニューの「ツクハコ」から起動します。所有者による通常GUI経路は確認待ちです。短い導入案内は配布フォルダのINSTALL.txt、検証結果はソース側のvalidation/linux-deb-0.4.5/REPORT.mdを参照してください。

本体は `/opt/tsukuhako`、メニューは `tsukuhako.desktop`、パッケージ・実行ファイル名は `tsukuhako`、appIdは `jp.tsukuhako.desktop` です。導入時の管理者認証はシステムへの配置に必要です。普段は通常ユーザーで起動します。Node.js・npm・Python・ビルドツールは利用者のPCへ要求しません。OSの実行時ライブラリはdebの依存で取得するため、初回導入時には通信が必要な場合があります。

設定は従来の `appData/tsukuhako`（通常 `~/.config/tsukuhako`）に保存します。生成先はユーザーのフォルダです。インストール先へログ・設定・プロジェクトを書きません。本体とメニューをパッケージ管理画面で削除しても、読書設定、生成プロジェクト、Dockerデータは残します。新debでの更新・再導入でも保全します。旧tar版を自動で探して削除しません。

Electron sandboxとウィンドウのsandboxを有効に保ちます。electron-builderの標準保守スクリプトが実行ファイルの登録、chrome-sandboxの権限、必要時にアプリ固有のAppArmor profileを扱います。OS全体の保護を無効にせず、Docker・VS Code・グループ権限を変更しません。実際に生成したスクリプトと隔離試験結果はレポートへ記録します。

## はじめて使う・教材

最初の「作る」画面で「はじめて使う」を選びます。上部の「ガイド」からも読めます。START_HERE / FIRST-RUN / TROUBLESHOOTING / NEXT-STEP / FEEDBACKの5正本を既存の教材ビューアへ収め、ダウンロードしたdebを移動・削除した後もオフラインで読めます。登録・任意アンケート・コミュニティ参加は必須ではありません。

本体の導入と開発準備は別です。最初の候補はF2。「準備チェック」でDocker・VS Code・拡張を確認します。診断は起動成功を保証するものではなく、実際のDev Container構築と画面表示は別途確認します。VS Codeのサインインはローカル学習には不要です。今生成したフォルダだけを信頼してください。

F1/F2/B1/S1/S2はReopen in Containerのあと、構成ターミナルの「準備完了」と初期構成の正常終了を確認してから `npm run dev` を実行します。接続バッジやタブ名だけでは完了と判断しません。I1はDB専用手順です。生成先のSTART_HERE.mdには具体的な保存先とポートがあります。

目次は狭い画面で折りたため、Escで本文に戻れます。読書位置はヘルプ往復・再起動で保持します。Ctrlと+ / -で拡大縮小、Ctrlと0で100%へ戻せます。

## Windows候補

既存のWindows成果物は0.4.4の未署名NSISです。今回のLinux修正に伴う再生成は行いません。Windows Server CIの補助検証と、Windows 11通常ユーザー・実WSLの確認待ちを区別してください。既存候補の再現にはその版のcommitを使います。

現在のソースで将来Windows版を作る場合、同じ0.4.5ステージとLinux x64 WSLヘルパーを使います。`~/.tsukuhako-helper/0.4.5-linux-x64` へ展開し、ハッシュを照合します。これはWindows 0.4.5の動作確認済みという意味ではありません。Windows用NSIS設定は変更していません。

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
node tools/linux-deb/inspect.mjs dist/linux-deb/tsukuhako-linux-amd64-0.4.5.deb
node tools/linux-deb/deliver.mjs dist/linux-deb/tsukuhako-linux-amd64-0.4.5.deb dist/delivery-linux-deb-0.4.5
```

隔離環境の更新・削除試験はtools/linux-debの検証ツールを使います。詳しい引数・条件はその冒頭と検証レポートを参照してください。所有者のPCへは先回りしてインストールしません。

手動の `Desktop validation artifacts` workflowはOSを選択し、既定でLinuxだけを生成します。private artifactを14日保持し、公開Releaseは作りません。ActionsのZIPは制作側の輸送用です。購入者の主入口は取り出した単体debにします。

Linux設定はelectron-builder.linux.json、Windows設定はelectron-builder.jsonです。共通ステージはASARを使用せず、worker・教材・テンプレート・ライセンスをresources/appへ配置します。Nodeのライセンスはhelper.tar、ElectronとChromiumはアプリ配布ルート、React/Markdown/fflateはthird-party、テンプレートの注意事項は各ZIPへ含めます。商品本文・ブランドの利用条件をOSSライセンスと混同しません。

build-info.jsonとbundle-files.jsonに版・ソースcommit・ファイルのSHA-256を記録します。購入者向けの受取先は未設置で、docs/linux-deb/UPLOAD.mdにアップロード手順を用意しています。
