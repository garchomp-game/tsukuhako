# 本体＋ガイド同梱パッケージ b1：完成報告

2026-10-23 JST実施。**Windows x64・Linux x64の同梱パッケージ作成完了。一般配布・販売は保留です。** 配布先の新設、公開、予約投稿、実メール、課金、main統合は行っていません。

## 成果物と版

| 項目 | 採用値 |
|---|---|
| アプリ本体 | 0.4.4。再ビルド・機能変更なし |
| アプリ製品ソース | `2b141f7c583d796e1ba75ad312c6ab199056c7de` |
| OS別Aセット | `2026-10-22-A`。各4ファイルをバイト列不変で利用 |
| ガイド | `2026-10-25-r2`。既存5原稿の受取説明を同梱版へ変更 |
| 同梱パッケージ | `2026-10-25-b1`。10月25日は候補の識別日で、公開予約ではない |
| 包装ソースcommit | `15c5ed611b5c09bdd7cdd7dc47408bab0ab2ac0a`。ZIP内manifestもこの値 |
| 統合branch | `codex/sunday-bundle-20261025` |
| 原稿担当branch / commit | `codex/sunday-bundle-copy-20261023` / `b657e0cb97710cf9c049a31cf3cba78fa99c6e6d`。統合側は `f956fda` |
| 引継ぎ元 | `codex/sunday-pack-20261025` / `7af82d97e31a4c1ff33007b4d4f38fb2d17396ca` |

包装後のcommitは検証ハーネス・証拠・この報告を追加したものです。包装入力の11ソースは上記commitに固定しており、完成ZIPの内容は変わりません。最終報告を含むHEADのSHAとremote一致はpush後の回答に示します。

実在する保存先は `/home/garchomp-game/workspace/meikyo/tsukuhako-sunday-bundle-20261025/dist/sunday-bundle-2026-10-25-b1/` です。大型ZIPはGit対象外です。以下は完成ZIPから実測した値です。

| 対象・ファイル | bytes | SHA-256 |
|---|---:|---|
| Windows：`tsukuhako-0.4.4-windows-x64-pack-2026-10-25-b1.zip` | 145012342 | `86b480a1c29c7f6dd61fedae84334704b7043ad9df9643cfe882f58c33fe6f56` |
| Linux：`tsukuhako-0.4.4-linux-x64-pack-2026-10-25-b1.zip` | 168349392 | `bf4adb88132b7802583b9f8a24ace1d40229d869300b87c8fa971a6c0ef89bc8` |

約145.0MB / 168.3MB（十進）です。[サイズ・SHA・全入力・展開先](delivery/artifacts.json)、[外側SHA](delivery/SHA256SUMS)、[Windows manifest](delivery/windows/manifest.json)、[Linux manifest](delivery/linux/manifest.json)をGitに保存しました。外部のダウンロードURLはまだありません。

正本Aセットの入力は `/home/garchomp-game/workspace/meikyo/tsukuhako-task-a-release-review-20261022/dist/delivery-0.4.4-A/`。制作用CLIの引数で指定し、ツールへ絶対パスを固定していません。[採用一覧](../release-0.4.4-followup/delivery/upload-files.json)で8ファイルを照合しました。

補助のMarkdown単独ZIPは `dist/guide-supplement-2026-10-25-r2/tsukuhako-f2-guide-2026-10-25-r2.zip`（13271 bytes、SHA `74f5715ccb3444f45e8675bd78d23efea9f2c4e7f721285108438bb5147407c0`）です。商品一式の受取先にはせず、同梱ZIPの中へも入れていません。

## 受取人の入口と完成フォルダ

**ZIP全体を展開 → `00_START_HERE.html` → `app/START_HERE.txt` で本体を起動 → `guide/index.html` の「F2の初回手順」** の順です。初期処理の「準備完了」と正常終了を見てから、生成先に記録されたURLで最初の画面を開きます。変更・復元は任意の次の練習です。

各ZIPにはZIP名から拡張子を除いた親フォルダが一つあり、以下の13ファイルが入っています。アプリ内教材・F1/F2/B1/S1/S2/I1を維持し、F2専用の製品へ縮小していません。

```text
<ZIP名と対応する親フォルダ>/
├── 00_START_HERE.html
├── app/
│   ├── START_HERE.txt
│   ├── manifest.json
│   ├── SHA256SUMS
│   └── tsukuhako-windows-x64-0.4.4-setup.exe  # Windowsのみ
│       または tsukuhako-linux-x64-0.4.4.tar.gz # Linuxのみ
├── guide/
│   ├── index.html
│   ├── START_HERE.md
│   ├── FIRST-RUN.md
│   ├── TROUBLESHOOTING.md
│   ├── NEXT-STEP.md
│   └── FEEDBACK.md
├── manifest.json
└── SHA256SUMS
```

`guide/START_HERE.md` はHTMLの原稿です。生成したプロジェクトのSTART_HERE.mdは、その人の保存先・ポート・起動方法を記録する別の案内です。入口で役割を区別しました。Linuxのtar.gzはそのまま収め、展開済みElectronをZIPへ詰め直していません。

## 検証結果

| 種別 | 実施内容 | 結果・証拠 |
|---|---|---|
| STATIC / 実ファイル | 両ZIPの単一親フォルダ、13ファイル、対象OSだけの本体、パス安全性・通常ファイル、CRC・全ハッシュ | PASS。[一覧](delivery/artifacts.json) / [最終照合](logs/final-integrity.json) |
| STATIC / A不変 | 入力4点×2OSと最終ZIP展開後のbytes/SHA一致。app内SHAも実行 | PASS。Linux tar `deace519…`、Windows exe `a5e2cd8f…`。完全値は一覧内 |
| STATIC / 自己参照 | manifestは11本文ファイル、ルートSHAはmanifestを含む12ファイルを対象。appのmanifest/SHAも照合 | PASS。root自身のハッシュ循環なし |
| FIXTURE | A不足・改変・symlink、危険/重複/他OS/余分なZIPメンバー、リンク欠落、HTML内スクリプト無効化 | 5/5 PASS。[試験ログ](logs/package-tests.txt) |
| LOCAL_BROWSER / 自動 | 完成ZIPの日本語・空白入り新規展開先をfile://で閲覧。Chromeをoffline設定し、導入案内の別タブとF2/復旧/任意練習/記録票/入口へ往復 | 両OS内容ともPASS。各44ローカルリンク、HTTP要求0・JSエラー0。[ブラウザ記録](logs/offline-browser.json) |
| LOCAL_BROWSER / 内容・表示 | 正本Markdownの179インライン本文・7コードブロックを各OSでHTMLと照合。コマンド選択、1280/360/320px表示、表・コマンド・本文の横はみ出しなし | PASS。[入口](screenshots/linux-entry-wide.png) / [狭幅の表](screenshots/linux-guide-table-narrow.png) / [コマンド](screenshots/linux-commands-narrow.png) |
| REAL_HOST / 自動 | 同梱Linux tarから本体を展開。実GUIでF2生成→生成先START_HEREの保存先/URL一致→ホスト診断→VS Code接続→準備完了・正常終了→初回画面 | 実施記録は下記。実機とfixtureを混同しない |
| STATIC / 原稿 | 紹介・無償検証協力・購入後を分離したまま、Brain2本と公開startの受取2段落を修正 | 同梱照合20件・読了5件、既存内容検査79/79 PASS。[原稿監査](../../docs/launch/sunday-copy/evidence/content-audit-b1.json) |
| STATIC / B取込 | `npm --prefix web run content`。公開startと正本一致、5メール・他3ガイド・webコード・配信条件は基点から不変 | PASS。[取込記録](logs/content-import.json)。実送信なし |
| 独立レビュー / 読み取り | 別担当が両ZIPの実体・ソース・原稿・範囲を確認 | 重大問題・未解決指摘なし。[レビュー](logs/independent-review.json) |

HTMLは既存アプリと同じmarkdown-it 15.0.3で5原稿から生成しています。外部JavaScript・フォント・画像・CDN・ログイン・サーバーは不要です。公式準備先リンクは保持し、外部閲覧と初回構築にはネットが必要と説明しています。コード実行ボタンはありません。最終ZIP内の読者用ファイルには作者の絶対パス・private repo必須リンク・未確定変数・開発サーバーURLはありません。

### Linux実機の範囲

Linux Mint 22.3 x86_64、kernel 7.0.0-31-generic、Docker 29.9.1、Compose 5.6.0、VS Code 1.142.0、Dev Containers 0.470.0、Chrome 155.0.8059.84。[環境記録](logs/environment.json)。既存のDocker・Code・イメージキャッシュがあるPCです。専用Xephyrデスクトップとアプリ/Code profile、CDPによる自動GUI操作を使い、製品IPCの差替えはありません。通常起動の既存A確認と、今回の計測用起動は区別します。

Linux ZIP→既存tar→実行ファイルの対応は[入力記録](logs/runtime-input.json)に残しました。日本語・空白入りの新規保存先 `F2 日曜 はじめの画面`、ホストポート `38317` を使用しています。

**PASS。** [F2生成](logs/generation.json)と[生成画面](screenshots/01-generated.png)、[初期構成の正常終了](screenshots/02-initialized.png)、[初期化記録](logs/initialization.json)、[初回画面](screenshots/03-first-page.png)と[画面記録](logs/first-page.json)を保存しました。構成処理は `npm ci --no-audit --no-fund && node scripts/doctor.mjs`、コンテナ内 `/workspace` から `npm run dev` を実行。Ready・HTTP 200・見出し「小さく変えて、動きを確かめよう。」を確認し、生成ソースは未変更です。初期構成終了の観察と初回表示は今回の実機証拠です。

VS Code初回案内はサインインせず進み、Workspace Trustの表示を閉じてから操作しています。コマンド候補の順位・強調spanによる誤一致と、正常終了した構成ターミナルがキー操作で閉じることに対し、検証ハーネスを修正しました。観察済みの正常終了は画像・本文記録に基づくcheckpointとして引き継ぎ、構成処理を重ねて実行していません。[操作調整記録](logs/harness-adjustments.json)。この補助操作を、人による補足なし完走の証拠にはしていません。

初回表示後の編集・復元・停止再開は案内・アプリ・生成内容を変えていないため、[以前の日曜実機記録](../sunday-pack-2026-10-25/REPORT.md)を継承します。今回それらの全試験を繰り返してはいません。Windows ZIPの照合・HTML確認はLinuxで実施しており、Windows上の展開・インストール・実WSLの実機PASSではありません。今回CIは起動していません。検証後は開発サーバー・今回のコンテナ・アプリ・Code・専用デスクトップを停止し、生成先とvolumeは保持しました。計測用本体はSIGTERM後もCDPプロセスが残ったため、実行ファイルと専用process groupを照合して終了させました。今回の片付けを通常終了の合格にはしていません。既存の別用途2コンテナはhealthyのままです。[片付け記録](logs/cleanup.json)。

## 変更範囲と再現

[制作メモ](../../docs/launch/SUNDAY-PACK.md)、5ガイド、受取原稿、既存Brainの矛盾箇所、[包装ツール](../../tools/package-delivery-bundle.mjs)と検証を追加・更新しました。製品コード、テンプレート、メール配信処理、投稿ネタ帳、旧レポート/監査は不変です。過去の別梱包を当時から同梱だったようには修正していません。

Node 24、固定済みgenerator-desktop依存、zip/unzip/sha256sumを用意し、包装ソースをcommitしてから実行します。

```sh
node --test tools/delivery-bundle/bundle.test.mjs
node tools/package-delivery-bundle.mjs \
  --input "$A_SET_ROOT" \
  --output dist/<新しい出力ディレクトリ> \
  --evidence validation/<新しい証拠ディレクトリ>/delivery
node tools/delivery-bundle/browser-check.mjs validation/<新しい証拠ディレクトリ>
```

`A_SET_ROOT` は制作者が指定するAセットの親ディレクトリです。Windows/Linuxの不足・改変がある場合、出力前に失敗します。既存候補・既存証拠がある出力先は上書きしません。外部へ渡した候補を変更するときはrevisionを進めます。大容量の実行環境・ZIP・実際の.envはGitへ追加しません。

## 未確認事項と次の一操作

**NOT_RUN：** Windows 11通常ユーザー＋実WSL/F2、未準備PC、実際の一般受取URL・権限からの取得、人による補足なし試用。macOS/ARMは対象外です。署名・全環境保証・所要時間保証は追加していません。

**本人の次の一操作：** 自分のOS用ZIPを別の新規フォルダへ展開し、`00_START_HERE.html` を開いてください。まずこの一つの入口から案内を確認できます。

一般配布に進む際は、対象OS・試用か販売か・窓口/提供範囲を決め、実際の受取URL/権限で取得・展開・照合・開始を確認します。Windowsを対象にする場合は[Win11実WSL/F2試験票](../sunday-pack-2026-10-25/WINDOWS-F2-TRIAL.md)を実施します。販売の場合の価格・利用/サポート/更新/返金条件、初心者単独完走の説明に必要な試用はまだ確定・実証していません。メルマガや会員認証の本番化を、今回の梱包完成の条件にはしていません。
