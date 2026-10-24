# ツクハコ 0.4.5 Linux deb候補 — 検証レポート

対象はLinux Mint 22.3 x64。単体deb・内蔵ガイド・初回入口を実装した候補です。所有者が自分でインストールする予定のため、通常PCへのパッケージ導入・削除は実施していません。**標準GUIの導入とメニュー起動は確認待ち**です。ビルドや自動試験の成功を、初心者本人が迷わず操作できた結果とは扱いません。

## 最初に開くファイル

[tsukuhako-linux-amd64-0.4.5.deb](/home/garchomp-game/ダウンロード/ツクハコ-0.4.5-Linux/tsukuhako-linux-amd64-0.4.5.deb)

同じフォルダにINSTALL.txt、SHA256SUMS、manifest.jsonがあります。外側ZIPの展開は不要です。お手元のPCに通常インストールされたツクハコは見つからなかったため、アンインストールも行っていません。[最終確認](logs/host-install-state.json)

## 成果物と来歴

- 作業ブランチ：`codex/linux-deb-045-20261024`
- 基点：`9ba29399d707e75b0da8a656ef386c81169eab58`。mainへの統合なし。
- 製品版：0.4.5。ガイド正本：2026-10-24-r3。
- パッケージ名・実行ファイル：`tsukuhako`。appId：`jp.tsukuhako.desktop`。
- 製品ソースcommit：`bd006beb3dac5db2c18c1cf28e436cfc0dc3f643`、dirty=false。
- サイズ：133,466,152 bytes（約133.5 MB）。SHA-256：`665991ee388c71e9893f0f0da61b83eeacd1ce785f2ef7470dbcb7651c9c304a`。
- [成果物metadataと保存先](artifact.json)、[実debの検査](logs/deb-inspection.json)、[同梱helper検査](logs/deb-helper-inspection.json)。コピーした配布フォルダの実体もSHA照合済み。
- 原稿統合：`55a149e`、隔離検証ツール取り込み：`24a28dc`、隔離証拠取り込み：`ff1992d`。製品ビルド元と後続の証拠・原稿commitを区別する。
- 公開配布先・購入者権限・実メール送信・課金は未実施。

## 実装

既存Electron 44.9.1 / electron-builder 26.15.3と共通ステージを使い、Linux専用設定からdeb/amd64を生成。メニュー名は「ツクハコ」、既存ブランドアイコンを含めます。本体は`/opt/tsukuhako`、教材・worker・テンプレート・ライセンスは同梱、ユーザー設定は従来のappData/tsukuhakoのままです。

「作る」に「はじめて使う」を置き、常設「ガイド」から5つの正本を既存Readerで開きます。全55章です。F2が初期候補で、本体導入・生成・開発準備を分けて説明します。正本Markdown、同梱教材、Brain/受取原稿のLinux入口を単体debへ揃えています。

OSライブラリはDependsへ指定しました。GTK/AT-SPIのt64名を優先し、音声のlibasound2t64と描画のlibgbm1も含めます。sandbox無効化・root起動・ホストsysctl変更は行いません。保守スクリプトはbuilder標準で、alternatives、desktop DB、chrome-sandboxの0755/4755分岐、アプリ専用AppArmor profileを扱います。Docker/VS Code/グループ設定や利用者HOMEの削除処理は追加していません。

Windows用NSIS設定・既存0.4.4配布バイナリ・テンプレートZIPは変更していません。共通ステージを検査し、手動CIはOS選択式で既定Linuxだけを生成する形に更新しました。Windows 0.4.5バイナリの再生成と実機動作はNOT_RUNです。

## 検証の区分

- **STATIC / REGRESSION**：ソース、ステージ、実debを読み取り検査。
- **ISOLATED_CONTAINER / AUTOMATED**：Ubuntu 24.04、アプリ依存を先入れしない環境。debだけをreadonly mount。ホストHOME・Docker socket・AppArmorを共有せず、privilegedなし。
- **EXTRACTED_DEB_ON_REAL_HOST / AUTOMATED**：最終debから取り出したアプリをMint 22.3の専用Xephyr画面・隔離設定で操作。ホストにパッケージを導入した試験ではありません。
- **FIXTURE**：更新用下位版はcontrolのVersionのみを下げた同一アプリ内容。保持試験の読書・生成・旧tar・Docker相当データはsentinelです。実Dockerボリュームや過去版の移行試験ではありません。
- **NOT_RUN**：所有者による通常導入、外部受取、実施していない経路。

ホストのAppArmor user namespace制限値は観測時0です。変更していません。このホストから制限値1の環境でのsandbox互換を証明しません。profileの構文検査と、実機でのprofile適用は分けます。

## 受入項目

| ID | 結果・範囲 |
| --- | --- |
| L01 パッケージ | **PASS / STATIC**：実debの形式・Depends・配置・menu/icon・保守script・license。Mintの読取専用APTシミュレーションも解決成功 |
| L02 同梱物 | **PASS / STATIC**：実debの125ファイルhash、55章、7テンプレート、worker/helper。ガイド正本と章リンクを検査 |
| L03 GUI導入 | **NOT_RUN**：所有者のMint/Captainで認証を含めて確認待ち |
| L04 メニュー起動 | **NOT_RUN**：本物のメニューから通常ユーザーで確認待ち |
| L05 初回導線 | **PASS / EXTRACTED_DEB_ON_REAL_HOST**：初回ボタン、常設ガイド、初期F2、5章を確認。初心者本人・メニュー経由はNOT_RUN |
| L06 独立性 | **PASS / EXTRACTED_DEB_ON_REAL_HOST**：書込みビットを除いた抽出deb、cwd=/tmp、オフライン5章、HOME配下へのworker生成。実インストールの配置先は隔離環境で非特権write不可を確認 |
| L07 F2開発体験 | **PASS / EXTRACTED_DEB_ON_REAL_HOST**：新規F2→VS Code→Dev Container→初期構成終了→HTTP 200・画面表示。任意の編集・復元も確認。Mintメニューからの一続きの経路はNOT_RUN |
| L08 未準備 | 既存回帰のmissing/stopped/setup/unknownとガイドの分離をPASS。ホストのDocker等を削除した実機試験はNOT_RUN |
| L09 失敗・中断 | **NOT_RUN**：Captainの認証取消・依存取得失敗。再試行案内はINSTALL.txtに収録 |
| L10 終了・再起動 | **PASS / EXTRACTED_DEB_ON_REAL_HOST**：通常ウィンドウ終了と再起動、guide/first-runとscroll=450を復元。メニュー経由はNOT_RUN |
| L11 更新 | **PASS / ISOLATED_CONTAINER + FIXTURE**：下位fixture 0.4.5~upgrade-test1→0.4.5、4sentinel保持 |
| L12 削除・再導入 | **PASS / ISOLATED_CONTAINER + FIXTURE**：remove→再導入→purge、本体・desktop・icon・alternative除去、4sentinel保持 |
| L13 購入者受取 | **NOT_RUN**：外部配布先未設置。UPLOAD.mdまで用意 |
| L14 回帰 | generator 27/27、desktop 26/26、型検査/UI build、共通stage破損検査1/1、helper archive検査PASS。新Windows実機試験とActions実行はNOT_RUN |

## 証拠

- [環境](environment.json) / [AppArmorの構文検査](logs/apparmor-syntax.json) / [MintのAPTシミュレーション](logs/mint-apt-simulation.txt)（導入しない読取専用確認）
- [初回画面](screenshots/00-first-screen.png) / [オフラインのガイド](screenshots/01-offline-guide.png) / [再起動後の読書位置](screenshots/02-reading-restored.png) / [UI結果](logs/ui-guide.json)
- [F2生成](screenshots/01-generated.png) / [初期構成の正常終了](screenshots/02-initialized.png) / [最初の画面](screenshots/03-first-page.png) / [任意の変更](screenshots/04-optional-change.png)
- [生成結果](logs/generation.json) / [構成完了とHTTP 200](logs/initialization.json) / [変更とハッシュ復元](logs/first-page-and-optional.json)
- [隔離環境の14項目と詳細](ISOLATED-CONTAINER.md) / [最終結果](isolated-container-final/result.json)
- [後片付け](cleanup.json)：専用F2サーバー・コンテナを停止。生成プロジェクトとボリュームは保管。既存2コンテナはrunning/healthy。専用デスクトップとデバッグ用ポートも終了。

各画像は最終debから抽出したアプリ、またはそのアプリで生成したF2の結果です。Captain・Mintメニューの画像はありません。画像の目視確認も行いました。

## 操作と待ち時間

通常経路として案内するのは、debを開く→導入ボタン→必要時の管理者認証→メニューでツクハコ→はじめて使う、です。CaptainやMintメニューの実操作数は未測定です。自動操作の回数・時間を初学者の所要時間へ読み替えません。Dockerイメージ・拡張・依存の取得や初回build待ちは操作時間と別に扱います。

初期構成画面ではnpmの依存取得が13秒と表示されました。生成の撮影は14:01:34、構成正常終了の撮影は14:04:22 JSTです。間にガイドの再試験・環境確認を挟んでおり、この差を利用者の所要時間とはしません。GUIの手数・迷う箇所・実際の通信待ちは所有者の初回試用で別途記録します。

## 検出した問題と修正

最初のbuildで、余分なextraMetadata指定がpackage.json末尾を再整形し、ステージのハッシュと不一致になることを検出しました。重複指定を取り除き、メタデータを共通ステージへ集約しました。初回成果物は不採用です。さらに準備教材の配布対象をLinux 0.4.5とWindows既存0.4.4へ明確化してから再生成しています。過去成果物は新版の証拠として流用していません。

検査器がdpkgのowner表示をroot/rootだけと仮定していたため、同じroot所有を表す0/0も認めるよう修正しました。隔離検証のroot-group writeを過剰に拒否した判定も、通常ユーザーの実効権限とworld-writeへ修正しています。deb自体は変更していません。

画面試験では専用Xephyr終了による接続失敗と、検査用CDPポートの競合を記録しました。専用デスクトップを独立起動し、ガイド再試験には別ポート9432を使って全手順を再実施しました。最終UI結果はPASS、作業ディレクトリは/tmpです。通常利用にはCDPや端末を要求しません。

## 所有者が次に確認すること

1. 最終debをファイルマネージャーから開き、Captainで名前・版・依存表示を確認する。
2. 必要な管理者認証で導入し、メニューの「ツクハコ」が一件表示されることを確認する。
3. 起動して「はじめて使う」を開き、迷った位置と表示文言を記録する。端末や特別なフラグが必要になったらそこで止めて状況を記録する。
4. 準備チェックからF2を生成し、初期構成の正常終了を待って画面表示まで進む。
5. 閉じてメニューから再起動し、ガイドの読書位置が戻るか確認する。
6. 削除・再導入を試す場合はINSTALL.txtに従い、生成プロジェクトと読書設定が残ることを確認する。

外部配布はこの初回確認後に判断してください。アップロード手順はdocs/linux-deb/UPLOAD.mdです。privateリポジトリを一般購入者用の受取先とは案内しません。

## 一次資料

設定は導入済み26.15.3のschema/実装で確認しました。[electron-builder Linux v26](https://www.electron.build/v26/docs/linux/)、[Linux Mint Captain](https://github.com/linuxmint/captain)も参照しています。これらの説明とツクハコ実物の検証は別です。
