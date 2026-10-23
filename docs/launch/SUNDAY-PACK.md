# 10月25日向け：本体＋ガイド同梱候補（制作メモ）

2026-10-23 JST。起点は`codex/abc-launch-preparation-20261022` / `cd8f8f8fd09b08a27ef7b1e9ee9e157a2a61d663`。開始時にローカルの変更なし、remoteの同branchも同SHA、mainは`55d3b051935df80d24f988719b52a4937f2f559b`と確認しました。このメモは読者用ZIPへ入れません。

## 今回採用した体験

**既存アプリ0.4.4でF2を選び、初期処理の正常終了を確認し、Next.jsの最初の画面を表示する。** 達成条件は初期見出しの表示です。一箇所変更・復元は任意に分離します。初回に全6構成の比較や詳細なDocker理論を要求しません。既存の構成・教材・アプリ機能は保持します。

生成済みF2を直接渡す案は採用しません。生成元パスに基づくPROJECT_NAMEとポートが`.env`に入り、`configure.sh`は既存設定を上書きしません。生成先START_HEREにも元の絶対パス・設定が載ります。別PCの保存先・競合・再開を確認する経路が増えるため、今回確認する既存アプリ経路を使います。根拠は[設定生成](../../generator/src/core/configuration.mjs)、[案内生成](../../generator/src/core/next-steps.mjs)、[F2復旧](../../starter-templates/F2/docs/RECOVERY.md)です。

Windows専用への商品変更、Linux専用への変更、価格・ライセンス・販売開始日は決定していません。100円は決定値ではありません。日程は準備の目安であり、予約投稿や予約販売ではありません。

## 正式な梱包方針：OS別の本体＋ガイドZIP

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

## 配布候補の生成と照合

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

## 日曜の判断と残る条件

- **現段階の候補：検証協力者向け。** ガイドと既存アプリを使うF2一経路。Win11通常ユーザー/実WSL/F2と未準備PCは未確認です。
- **一般向け配布・販売：公開保留。** 配布先・受取権限・対象OS・窓口等が未確定です。Linux既存環境の成功だけでWindowsや未準備PCへ一般化しません。
- **本人が選ぶこと：** 検証協力募集か試用か販売か、対象OS、配布方法/期限、利用条件と窓口。販売の場合は価格・サポート/更新・返金条件も確定し、文案と配布画面を合わせます。
- 対象に近い一人による補足なしの試用は未実施です。依頼や送信は本人の指示がある場合だけ行います。[Windows F2試験票](../../validation/sunday-pack-2026-10-25/WINDOWS-F2-TRIAL.md)でS2へ範囲を広げず記録できます。

今回の実測結果、サイズ、branch/commitは[同梱候補レポート](../../validation/sunday-bundle-2026-10-25/REPORT.md)にまとめます。[従来の日曜候補レポート](../../validation/sunday-pack-2026-10-25/REPORT.md)は変更・復元・再開の再利用する証拠です。梱包作成の完了と一般公開の可否を分け、main統合、公開投稿、実メール送信、本番デプロイ、課金は行いません。
