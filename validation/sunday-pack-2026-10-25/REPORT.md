# 10月25日向けF2配布候補の統合レポート

2026-10-23 JST。A/B/C統合成果 `cd8f8f8fd09b08a27ef7b1e9ee9e157a2a61d663` を引き継ぎ、日曜候補の5ガイド、小さいZIP、投稿ネタ帳、用途別の原稿を作成しました。製品は0.4.4のままです。

**検証協力者向け候補の準備・ローカル検証は完了しました。一般向け配布・販売は未完了条件があり公開保留です。** Win11通常ユーザー・実WSL/F2、未準備PC、一般受取人のダウンロードは未確認です。Linux既存環境の成功をこれらへ一般化せず、Windows専用・Linux専用への商品変更、100円等の価格決定もしていません。

## 成果物と採用した体験

既存アプリでF2を一つ選び、初期処理の正常終了を確かめ、Next.jsの最初の画面を表示する一経路です。変更・復元は任意に分離しました。生成済みプロジェクトを直接渡す案は、保存先由来の設定やポート、復旧経路の持ち運び確認が増えるため採用しません。[制作メモ](../../docs/launch/SUNDAY-PACK.md)。

- [START_HERE](../../docs/launch/sunday-pack/START_HERE.md)、[FIRST-RUN](../../docs/launch/sunday-pack/FIRST-RUN.md)、[TROUBLESHOOTING](../../docs/launch/sunday-pack/TROUBLESHOOTING.md)、[NEXT-STEP](../../docs/launch/sunday-pack/NEXT-STEP.md)、[FEEDBACK](../../docs/launch/sunday-pack/FEEDBACK.md)。
- [ガイドZIP](delivery/tsukuhako-f2-guide-2026-10-25-r1.zip)：**13,087 bytes**。ガイドrevision **2026-10-25-r1**。上の5本＋manifest＋SHA256SUMSの7ファイルで、アプリ本体・生成済みプロジェクト・ソース一式を含みません。[内訳とサイズ](delivery/artifact.json)。
- [ZIPチェックサム](delivery/SHA256SUMS)：SHA-256 `8c9b6a85d014bf172bdcceb2968696329b96769b5954117cc05ff3d337906f69`。
- [POST-IDEAS](../../docs/launch/POST-IDEAS.md)：P001はdraft、P002〜P006はidea。投稿日時・URL・反応は未記録。本人の動機・想定・実機記録・見聞を分け、顧客の声や学習効果は創作していません。
- [紹介・無償試用・購入後の別原稿](../../docs/launch/sunday-copy/README.md)。3本文とも未公開draft。販売・試用の採用条件は[編集用判断表](../../docs/launch/sunday-copy/DECISIONS.md)に分離しています。
- [Win11・実WSL/F2試験票](WINDOWS-F2-TRIAL.md)：すべてNOT_RUNを維持。S2まで今回の必須へ広げていません。

アプリはA採用revision **2026-10-22-A** のOS別4点セットを再利用します。同じバイナリを複数ZIPへ重複同梱していません。製品sourceは `2b141f7c583d796e1ba75ad312c6ab199056c7de`、再ビルドなしです。

| OS | 別途渡すファイル | bytes |
|---|---|---:|
| Linux | tsukuhako-linux-x64-0.4.4.tar.gz | 168,272,243 |
| Linux | START_HERE.txt | 4,567 |
| Linux | manifest.json | 1,898 |
| Linux | SHA256SUMS | 260 |
| Windows | tsukuhako-windows-x64-0.4.4-setup.exe | 144,935,062 |
| Windows | START_HERE.txt | 4,692 |
| Windows | manifest.json | 1,721 |
| Windows | SHA256SUMS | 265 |

実ファイルはA専用worktree `tsukuhako-task-a-release-review-20261022/dist/delivery-0.4.4-A/{linux,windows}/` に保持。[全8ファイルの実測照合](logs/input-artifact-audit.json)はGitの[採用一覧](../release-0.4.4-followup/delivery/upload-files.json)と一致します。

## 再利用と変更範囲

Aの商品事実・採用配布物、Cのstart/setup-check/first-change・Brain本文、既存試用票の構成を再利用しました。変更は日曜用ガイド、文案、包装/確認ツール、証跡と入口リンクだけです。アプリ・テンプレート・B mock・既存C本文やメールに差分はありません。

任意登録の本番URLは未設定なので、読者案内へ載せていません。メール基盤の本番化をF2試用の条件にせず、実メールadapter・決済・会員認証を追加していません。前提は当日のMicrosoft/Docker/VS Code公式資料とコードで照合しました。[参照資料と範囲](../../docs/launch/SUNDAY-PACK.md#前提情報の確認)。公式情報の確認を製品の実機合格とは扱いません。

## 検証結果

Linux Mint 22.3 x64の既存開発環境で実施。Docker 29.9.1 / Compose 5.6.0 / VS Code 1.142.0 / Dev Containers 0.470.0 / Chrome 155.0.8059.84。既存Docker・イメージを使い、専用デスクトップとCodeプロファイルへ既存拡張をコピーしました。新規PCや人による無補足試用ではありません。実アプリ・実VS Codeを自動操作し、製品IPCは置換していません。通常の未計測起動はAの成功記録を引き継ぎました。

| 区分 | 結果 | 範囲と証拠 |
|---|---|---|
| REAL_HOST / AUTOMATED | PASS | 新しい日本語・空白付きフォルダへF2生成。非標準の空きポートで生成案内・ホスト診断の保存先とURLが一致。[生成](logs/generation.json) |
| REAL_HOST / AUTOMATED | PASS | 構成本文の「準備完了」と正常終了のDone表示を両方確認。/workspaceからnpm run dev、ReadyとHTTP 200。[初期処理](logs/initialization.json)、[ログ抜粋](logs/postcreate-completion.log) |
| REAL_HOST / AUTOMATED | PASS | ブラウザの初期見出し→VS Codeで変更・保存→表示変化→復元・保存→元の表示。ファイルSHAも一致。[任意練習](logs/first-page-and-optional.json) |
| REAL_HOST / AUTOMATED | PASS | Ctrl+C→コンテナ停止→同じフォルダから接続→再表示。接続画面を観察してから次の段階を実行。同じコンテナ・依存volume・ソースSHAを保持し、未保存編集0件。[停止再開](logs/stop-resume.json) |
| STATIC | PASS | 最終ZIPを新規フォルダへ展開。7ファイルの正本一致、manifest、内側6チェックサム、ZIP外側SHA、Aの8ファイル一覧を照合。[最終包装照合](logs/final-package-audit.json) |
| STATIC | PASS | C原稿6ファイルのSHA維持、試用/購入後本文が参照する5ガイド実体と一致。読者案内に未解決変数・作者パス・固定localhostポート・private repoリンクなし |
| STATIC / 読了 | PASS | Cの16機械照合＋7読了項目は[担当記録](../../docs/launch/sunday-copy/evidence/content-audit.json)を引継ぎ。[独立レビュー](logs/independent-review.json)で案内補足・梱包・3原稿の境界に要修正事項なし |
| 既存CI / FIXTURE | 引継ぎ | [A/B/C統合レポート](../launch-abc-2026-10-22/REPORT.md)参照。今回Aの全製品試験やBの成功済み試験は再実行していません。新しいCI合格と数えません |
| NOT_RUN | 未実施 | Win11通常ユーザー・実WSL/F2、未準備PC、一般受取人の公開URL/権限での取得、対象に近い人の補足なし試用 |

画像は [生成](screenshots/01-generated.png)、[初期処理終了](screenshots/02-initialized.png)、[最初の画面](screenshots/03-first-page.png)、[任意変更](screenshots/04-optional-change.png)。4枚を目視確認しました。制作者のローカル記録を外部受取人の証拠へ置き換えません。

案内修正前の初期ZIP記録より、最終バイト列を照合した **final-package-audit.json** を優先します。案内修正後に全てを再生成したとは主張せず、実操作に合わせた補足と最終ZIPを照合しました。

## 一周で加えた補足

FIRST-RUNに、生成先START_HEREの引用符付き `cd --` をコピーする方法、Restricted ModeのManageから現在の生成フォルダだけTrustする操作、正常終了のDone表示の実例を追加しました。表示文言は版・言語で変わるため、準備完了と処理終了の両方を見る方針です。ガイドとZIPへ反映済みです。

確認用操作は、信頼画面、似た名前のコマンド、再接続時の画面切り替えで途中停止しました。接続表示の後にもCodeの読み込みが続き、コマンド文字列がエディターの未保存バッファへ入った試行がありました。保存済み生成ファイルは初期SHAと一致し、製品変更はありません。中断時に専用CodeのBackupsをignoredのruns/paused-code-backupsへ退避しています。[中断時記録](logs/pause-project-state.json)。

確認補助ツールは、再起動と操作継続をresume / resume-finishの段階に分け、間で準備済みの画面を観察する形に修正しました。リモート開始処理の終了待ち、CDP再接続、パレットの表示・フォーカス・選択項目、未保存編集0件も確認します。この手順で停止から再表示までPASSです。完全無人の一括回帰テストとは扱いません。読者が操作する製品経路・ガイドの変更は不要でした。

終了時に開発サーバー、専用Code、専用デスクトップ、今回のF2コンテナを停止しました。生成ソースとvolumeを保持し、元の2コンテナはhealthyです。[終了記録](logs/final-cleanup.json)。OSパッケージ変更・Docker全体のリセットはありません。[統合静的確認](logs/integration-checks.json)に文書リンク、JSON、製品・既存A/B/Cコードの不変を記録しました。

## Branch / commit

| 内容 | branch / commit |
|---|---|
| 引継ぎ固定点 | codex/abc-launch-preparation-20261022 / `cd8f8f8fd09b08a27ef7b1e9ee9e157a2a61d663` |
| C日曜原稿 | codex/sunday-copy-20261023 / `c1f12c6eef75c2cffcf819b24c0cd3e1183f2a03` |
| C取り込み | codex/sunday-pack-20261025 / `c997590` |
| ガイド・包装・途中証跡の保存点 | codex/sunday-pack-20261025 / `e179f6d49df3c27e2f2375ddbf75ea8573a362e6` |
| 確認補助ツール・停止再開・独立レビューの確定点 | codex/sunday-pack-20261025 / `4f1b5c25da9b8da98bae9e9e7f897ff3540d0666` |

このレポートは確定点の次の文書commitです。保存先はprivate `garchomp-game/tsukuhako`、利用アカウントはgarchomp-game。上の2つの日曜branchをpushし、送付時にremoteのSHAと一致を確認します。レポートを含む最終commitは完了メッセージに記載します。mainは `55d3b051935df80d24f988719b52a4937f2f559b` のままで統合しません。

## 本人が次に行うこと

1. 入口ガイドと紹介文を確認し、検証協力募集・無償試用・販売のどれを採用するか決める。
2. 対象OS、受取方法・期限、窓口を決める。配布先を設定した後、一般受取人の権限で取得・SHA照合・起動を確認する。
3. Windowsを完成した提供対象とする前に、Win11/F2試験票で通常ユーザーの実機経路を確認する。可能なら対象に近い一人の停止箇所も記録する。依頼・送信は本人の指示後に行う。
4. 有料の場合は、価格、利用・サポート・更新・返金条件を確定して購入前説明と購入後案内を合わせる。100円は決定値ではない。

公開・予約投稿、実メール送信、本番デプロイ、課金、mainへの統合は実行していません。
