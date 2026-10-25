> 過去の開発・配布計画の記録です。現在はMITライセンスのOSSとして無料配布しています。最新の入口は[リポジトリのREADME](https://github.com/garchomp-game/tsukuhako#readme)です。

# 10月25日向け：Linux debと内蔵ガイド（制作メモ）

## 現行方針：2026-10-24 / Linux版1.0.0

`tsukuhako-onboarding-revision-request-2026-10-24.md` と基点 `24e3b852f8357c05e59814bec9ee9a7c9f4a2dca` を引き継ぎます。ツール本体と教材・ガイドを一緒に届ける方針を維持し、**Linux Mint x64の通常受取は単体deb**へ変更します。Linuxで外側ZIP→内側tarを順に展開する旧経路は主経路から外します。このメモは制作者用で、アプリの読者用本文へ混ぜません。

| 内容 | 現行の扱い |
|---|---|
| Linux本体 | 1.0.0 / `tsukuhako-linux-amd64-1.0.0.deb`。Mint 22.3 x64が最初の実機確認対象 |
| [入口](sunday-pack/START_HERE.md) / [初回](sunday-pack/FIRST-RUN.md) / [復旧](sunday-pack/TROUBLESHOOTING.md) / [任意練習](sunday-pack/NEXT-STEP.md) / [記録票](sunday-pack/FEEDBACK.md) | ガイド2026-10-24-r8。5本のMarkdownを正本とし、本体の既存Readerへ同梱 |
| 本体への取込 | `tools/build-curriculum.mjs` がlesson `guide` を生成。章IDは `start / first-run / troubleshooting / next-step / feedback`、sourceは元の大文字MD名を保持 |
| 現行ガイドの整合 | `tools/refresh-guide-checksums.mjs` で5正本・manifest・SHA256SUMSを更新。ガイド版は正本manifestと本文、同梱アプリ版はcurriculumの版で区別 |
| Windows | 既存0.4.4・ガイドr2・同梱ZIP2026-10-25-b1を維持。今回Windows新版を生成した意味ではない |
| [投稿ネタ帳](POST-IDEAS.md)・[用途別原稿](sunday-copy/README.md) | 未公開のまま。紹介・無償試用・購入後を分離し、Linux1.0.0の操作名・到達点へそろえる |

Linux利用者は **単体debを開く → OS標準のパッケージインストーラー（このMintはCaptain）→ メニュー「ツクハコ」→「全体の流れを読む」→ サンプル画面を表示する** の順に進みます。通常利用中も「ガイド」navから同じReaderを開けます。既存IPCを使い、読書設定に任意の案内モードを追加して、インストーラーの保存場所へ依存しません。

本体の起動・ガイドの読了・開発準備チェック・実Dev Container起動は別の進捗です。「はじめてのWeb画面」の初期処理正常終了とサンプル表示が初回到達点で、変更・復元は任意です。生成済みプロジェクトを配る方式や、推奨構成だけの商品への縮小は採用しません。旧tarコピー、生成プロジェクト、Dockerデータ、読書設定を勝手に削除しません。

### 現行の制作順序

統合後のリポジトリで、既存の固定済み開発依存を使います。以下は制作・静的検査の手順で、利用者のPCにNode/npm等を要求するものではありません。

```sh
node tools/refresh-guide-checksums.mjs
npm --prefix generator-desktop run curriculum
npm --prefix generator-desktop run build
npm --prefix generator-desktop run stage
npm --prefix generator-desktop run package:linux
node tools/linux-deb/inspect.mjs dist/linux-deb/tsukuhako-linux-amd64-1.0.0.deb
```

パッケージの検査後は、`tools/linux-deb/deliver.mjs` へ最終debと**新しい**出力先を指定し、単体deb、SHA256SUMS、INSTALL.txt、manifestを用意します。入力・既存配布物を削除せず、最終コピー後のバイト列を照合します。詳細と最終保存先は1.0.0の統合レポートに記録します。サイズ・SHAを旧tarや旧ZIPから転記しません。

現行5正本を変えたら、チェックサム更新→curriculum生成→UI build→stage→debを作り直し、最終deb内のガイドと版を再照合します。旧r2用 `tools/package-sunday-guide.mjs` と旧b1用 `tools/package-delivery-bundle.mjs` は、現行ガイドを梱包する手順には使いません。

生成後の主入口は「サンプル画面を表示する手順へ」です。実際の保存先・URLはReaderが保持し、ヘルプから「今回の起動手順へ戻る」で続行します。初期ガイドの正本見出しは共有の `GUIDE_HEADINGS` と対応させます。準備不足は `lesson:setup/linux` の該当見出しへ直接移動します。

今回の原稿・リンク・未確認の整理は[初回導線の原稿監査](ONBOARDING-CONTENT-REVIEW.md)です。過去の証拠は上書きしません。

### 今回の公開判断

debの生成・静的検査・隔離検証は、Mintの通常GUIでの導入やメニュー起動とは区別します。本人の初回確認前にこれらを合格へ変えません。旧0.4.4のLinux実績、新debの実F2、未準備PC、一般受取人のダウンロード、人による無補足試用も別の結果です。[現行の公開前条件](PUBLISH-CHECKLIST.md)を使い、候補完成と一般公開可能の判断を分けます。

Windows 11通常ユーザー・実WSL/F2は未確認です。価格、本番受取URL、提供対象、試用/販売、窓口等は本人が決める条件として残します。メルマガ登録や会員認証の本番化を、今回のdeb作成の条件にしません。

## 以下は旧b1の制作記録・再現用メモ

以下の2026-10-23の説明とコマンドは、**旧固定点9ba2939の0.4.4/r2/b1を対象**とした記録です。再現する場合はその固定点の正本・ツール・Aセットを使います。現行r3正本で旧b1を作り直したり、既存成果物・証拠を上書きしたりしません。Linuxの現行受取方式は上の単体debが優先です。

2026-10-23 JST。起点は`codex/abc-launch-preparation-20261022` / `cd8f8f8fd09b08a27ef7b1e9ee9e157a2a61d663`。開始時にローカルの変更なし、remoteの同branchも同SHA、mainは`55d3b051935df80d24f988719b52a4937f2f559b`と確認しました。このメモは読者用ZIPへ入れません。

## 旧b1で採用した体験

**既存アプリ0.4.4でF2を選び、初期処理の正常終了を確認し、Next.jsの最初の画面を表示する。** 達成条件は初期見出しの表示です。一箇所変更・復元は任意に分離します。初回に全6構成の比較や詳細なDocker理論を要求しません。既存の構成・教材・アプリ機能は保持します。

生成済みF2を直接渡す案は採用しません。生成元パスに基づくPROJECT_NAMEとポートが`.env`に入り、`configure.sh`は既存設定を上書きしません。生成先START_HEREにも元の絶対パス・設定が載ります。別PCの保存先・競合・再開を確認する経路が増えるため、今回確認する既存アプリ経路を使います。根拠は[設定生成](../../generator/src/core/configuration.mjs)、[案内生成](../../generator/src/core/next-steps.mjs)、[F2復旧](../../starter-templates/F2/docs/RECOVERY.md)です。

Windows専用への商品変更、Linux専用への変更、価格・ライセンス・販売開始日は決定していません。100円は決定値ではありません。日程は準備の目安であり、予約投稿や予約販売ではありません。

## 旧b1の梱包方針：OS別の本体＋ガイドZIP

2026-10-23の追加依頼により、`7af82d9` 時点の「OS別アプリセット＋別のガイドZIP」から、一つのOS別ZIPへ変更します。ツールが商品本体です。制作時はAセットとガイドを別管理し、受取人にはWindows用またはLinux用の一つのZIPで渡します。過去レポートは当時の別梱包の記録として保持します。

| 内容 | 版と扱い |
|---|---|
| [F2入口](sunday-pack/START_HERE.md) / [初回](sunday-pack/FIRST-RUN.md) / [復旧](sunday-pack/TROUBLESHOOTING.md) / [任意練習](sunday-pack/NEXT-STEP.md) / [記録票](sunday-pack/FEEDBACK.md) | ガイドrevision `2026-10-25-r2`。Markdown正本5本と、そこから生成する静的HTML |
| アプリ本体 | **0.4.4のまま**。製品source `2b141f7c583d796e1ba75ad312c6ab199056c7de`。再ビルドなし |
| OS別の4点セット | A採用案内revision **2026-10-22-A**。製品・START_HERE.txt・manifest.json・SHA256SUMS。[採用一覧](../../validation/release-0.4.4-followup/delivery/upload-files.json) |
| OS別同梱パッケージ | revision **2026-10-25-b1**。Windows x64とLinux x64を別ZIPにする。Aセット4点は `app/` へバイト列不変で配置 |
| [投稿ネタ帳](POST-IDEAS.md) | P001〜P006。未公開、日時/URL/反応は未記録 |
| [日曜用の文案](sunday-copy/README.md) | 開発中の紹介、無償検証協力、購入後を別draftにする。掲載条件は制作メモで管理 |

通常の開始点は **ZIP全体を展開 → `00_START_HERE.html` → `app/START_HERE.txt` の導入手順 → `guide/index.html` の「F2の初回手順」** です。ブラウザでローカルファイルを読み、拡張・サーバー・ログインを必要としません。本文はオフラインで読めます。外部の公式準備先と初回の開発環境構築にはネット接続が必要です。生成プロジェクト内のSTART_HERE.mdは、利用者の保存先・ポートを記録した別の案内です。

ZIP名と同じ親フォルダ一つに、入口、`app/` の4点、`guide/` のHTML＋5原稿、ルートmanifest・SHA256SUMSを収めます。Windowsは既存exe、Linuxは権限・リンク等を保つ既存tar.gzを一つだけ入れます。別OS、ガイドZIPの重複、ソース、制作メモ、検証動画、生成プロジェクトは混ぜません。本体だけでもWindows約145MB・Linux約168MBあり、小容量とは説明しません。実測値は新レポートへ記録します。

ガイド単独ZIPはMarkdown原稿の補助資料としてのみ保持できます。同梱商品の主な受取先にはしません。配布URL・受取権限が未設定のため、外部からの受取は未確認です。紹介文や購入後文案はdraftのままです。

## 再利用と変更範囲

Aの[商品事実](../../validation/release-0.4.4-followup/PRODUCT-FACTS.md)と[配布チェック](../../validation/release-0.4.4-followup/DELIVERY-CHECKLIST.md)、Cのstart/setup-check/first-change・Brain本文、既存TRY-5-10-MINの記録項目を再利用しました。一時パスや固定ポートは配布案内へ転記していません。

変更は日曜用の案内・文案・包装/検証ツールと報告です。既存Brain2原稿とメールから辿る公開startガイドは、梱包と入口の矛盾箇所のみ修正します。メール5本、Bのmock・配信条件・本番送信境界は維持します。任意登録は本番登録先が未設定なので、今回読者へ渡す案内には載せません。配布候補の完成はメルマガの本番化待ちにしません。

## 前提情報の確認

2026-10-23に以下の公式資料を読み、既存コード・教材と照合しました。公式資料は製品の実機合格を意味しません。

| 資料 | 案内に反映する範囲 |
|---|---|
| [Microsoft WSL導入](https://learn.microsoft.com/windows/wsl/install) | WSL導入・再起動・通常ユーザー、一覧のVERSION 2。Windows自体とDockerの要件を分ける |
| [Docker Windows要件](https://docs.docker.com/desktop/setup/install/windows-install/) | 当日記載のWSL 2.1.5以降、対応Windows build、RAM/仮想化等。Dockerの利用条件も導入時に確認。ツクハコの全Win11合格へ拡張しない |
| [Docker WSL連携](https://docs.docker.com/desktop/features/wsl/) / [VS Code WSL](https://code.visualstudio.com/docs/remote/wsl) | 同じWSLのIntegration、Windows側Code、WSL/Dev Containers拡張。WSL内へEngineを重複導入しない |
| [Docker Ubuntu](https://docs.docker.com/engine/install/ubuntu/) / [Linux導入後](https://docs.docker.com/engine/install/linux-postinstall/) | Mint等派生版は公式サポート外。今回のMint既存環境記録と、未導入PCの導入保証を分ける |
| [VS Code Linux](https://code.visualstudio.com/docs/setup/linux) / [Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers) | OSに応じたCode導入、拡張、フォルダからReopen in Container |

製品0.4.4のWindows保存先は選択WSL内の既存HOME配下で、`/mnt`を拒否します。これは製品の制約であり、Microsoftが全WSL利用で`/mnt/c`を禁止しているという意味ではありません。Windows Server 2022 CIはインストーラー等の補助確認です。

## 旧b1固定点での生成と照合

リポジトリ直下、Node 24・zip/unzip・sha256sumと、`generator-desktop` の固定済み依存を用意した制作環境で実行します。既存アプリと同じmarkdown-itを使い、製品ビルドは行いません。包装ソースと5ガイドをcommitしてから、A採用版の親ディレクトリを指定します。以下の `A_SET_ROOT` は制作者が実在するパスへ置き換える入力です。

```sh
node --test tools/delivery-bundle/bundle.test.mjs
node tools/package-delivery-bundle.mjs \
  --input "$A_SET_ROOT" \
  --output dist/sunday-bundle-2026-10-25-b1 \
  --evidence validation/sunday-bundle-2026-10-25/delivery
```

指定入力のLinux/Windows各4ファイルを採用一覧に照合し、不足・不一致なら出力前に停止します。MarkdownからHTMLを生成し、manifestと内側SHA、ZIP、外側SHA・実測サイズ、最終ZIPの新規展開と全ファイル照合まで行います。入力パスはツールへ固定しません。既存の出力・証拠ディレクトリがあれば上書きせず停止します。ZIPはGit対象外の `dist/`、一覧・ルートmanifest・SHAは `validation/` に残します。

manifestのファイル一覧は自身とルートSHAを除外し、ルートSHAはmanifestを含み自身だけを除外します。`app/manifest.json` と `app/SHA256SUMS` はどちらもルート側の照合対象です。包装に使ったcommitと各ソースのハッシュを記録します。ガイドを変えたら再生成・再照合が必要です。外部へ渡した候補はrevisionを進め、旧版を保持します。

補助の `node tools/package-sunday-guide.mjs` はr2のMarkdown単独ZIPを `dist/guide-supplement-2026-10-25-r2/` へ作る処理です。本体は入りません。旧r1成果物と当時の検証記録は変更しません。

## 旧b1時点の日曜の判断と残る条件

- **現段階の候補：検証協力者向け。** ガイドと既存アプリを使うF2一経路。Win11通常ユーザー/実WSL/F2と未準備PCは未確認です。
- **一般向け配布・販売：公開保留。** 配布先・受取権限・対象OS・窓口等が未確定です。Linux既存環境の成功だけでWindowsや未準備PCへ一般化しません。
- **本人が選ぶこと：** 検証協力募集か試用か販売か、対象OS、配布方法/期限、利用条件と窓口。販売の場合は価格・サポート/更新・返金条件も確定し、文案と配布画面を合わせます。
- 対象に近い一人による補足なしの試用は未実施です。依頼や送信は本人の指示がある場合だけ行います。[Windows F2試験票](../../validation/sunday-pack-2026-10-25/WINDOWS-F2-TRIAL.md)でS2へ範囲を広げず記録できます。

今回の実測結果、サイズ、branch/commitは[同梱候補レポート](../../validation/sunday-bundle-2026-10-25/REPORT.md)にまとめます。[従来の日曜候補レポート](../../validation/sunday-pack-2026-10-25/REPORT.md)は変更・復元・再開の再利用する証拠です。梱包作成の完了と一般公開の可否を分け、main統合、公開投稿、実メール送信、本番デプロイ、課金は行いません。
