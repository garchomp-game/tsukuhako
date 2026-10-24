# ツクハコ 0.4.6 初回利用の改訂と検証

対象依頼は `docs/requests/onboarding-2026-10-24/tsukuhako-onboarding-revision-request-2026-10-24.md`。添付ZIPの背景資料は設計の根拠として読み、依頼書のP0・P1を今回の実装範囲とした。前版24e3b85から専用worktreeで継続し、既存の通常インストール0.4.5は変更していない。

状態：検証中。利用者本人による確認は **利用者確認待ち**。

## 修正結果

| ID | 変更 | 利用者の操作への影響 |
| --- | --- | --- |
| R01 | 表示名・初回目標・成功の目印を `presentation.mjs` へ集約 | 「はじめてのWeb画面」で始め、実際のサンプル見出しを確認したら初回完了。文字の変更・復元は任意。API・SQLなどは固有の目標を保持 |
| R02 | 作成完了の主ボタンを今回の情報を使うReaderへ統一 | 今回の保存先・ポート・URLが入り、該当位置からVS Codeを開ける。コピーとREADMEは補助。作成結果・ヘルプを往復しても保持 |
| R03 | ファイル生成、PCの道具、生成後の起動を別々に説明 | Linuxでは起動用の不足があっても生成可能。状態別の不足カードから該当準備見出しへ直接移動。Windowsの選択WSL・ヘルパー条件は維持 |
| R04 | 正本5章と生成ガイドを操作場所・操作・結果・復帰先中心に再編集 | Linuxの初回経路から旧検証経緯・別OSの詳細・導入前説明を分離。「準備完了」と初期処理の正常終了の両方を確認してからサーバーを起動 |
| R05 | 症状リンク・見出し移動・現プロジェクトへの復帰を接続 | 動的ガイドには同文書の症状節と実在する相対ファイルリンクを収録。アプリ終了後も保存済みSTART_HEREで同じフォルダーから再開。生成済み.envを作り直さない |
| R06 | 共通生成コア・原稿・教材生成器を更新し、55章を再生成 | 原稿と同梱教材のハッシュを再計算。OS準備本文は `docs/desktop-setup` を正本として生成。旧報告・旧配布物を保持し、新debを別途作成 |

関連する現行Brain・受取・ガイド原稿も同じ呼称へ更新。メール3本はrevision 2へ改稿し、5本すべてdraftのまま。実データ取込・配信予定の変更・実送信・課金・公開は行っていない。[原稿の監査](../../docs/launch/ONBOARDING-CONTENT-REVIEW.md)を参照。

## 実装と配布物

- 統合branch：`codex/onboarding-046-20261024`
- 製品ビルド元：`69bbe3b8b1eca89f4506e6a7a1ad11a62eedf812`（clean）
- アプリ：0.4.6、ガイド：2026-10-24-r4
- 生成対象：6構成。参考資料を含むテンプレート7件、教材55章、bundle検査126ファイル。
- mainへの統合、公開Release、公開アップロードは行っていない。
- 最終deb・SHA・保存場所：最終検査後に追記。

原稿と画面は別worktreeで分担し、統合branchへcherry-pickした。主要担当commitはcore `13b4a3e`、UI `64b9898` / `3e6a6ad`、原稿 `599ddcd` / `8929504` / `b56f003`。通常利用のアプリ・設定・他プロジェクトのDockerコンテナーを変更していない。

## 受入条件

REAL_HOSTは対象Linux Mint上の実ファイル・実Docker・実VS Code・実ブラウザー、EXTRACTED_DEBは最終debを別領域へ展開した本体、FIXTUREは模擬IPC/状態、STATICは文書・コード・ハッシュ照合を意味する。自動操作での結果を利用者本人の成功としない。

| ID | 結果 | 確認方法と証拠 |
| --- | --- | --- |
| A01 | STATIC/FIXTURE PASS、実機確認中 | 共通表示名、通常経路、技術詳細の管理IDを確認。`logs/content-check.json`、`logs/ui-fixture.json` |
| A02 | STATIC/FIXTURE PASS、実機確認中 | 6構成のrequiredはverifyまで、optionalを分離。`logs/generator-tests.txt`、`logs/source-conformance.json` |
| A03 | PASS / FIXTURE | missing/stopped/setup/restart/unknown、Linux生成可、Windows選択ヘルパー一致を検査。`logs/desktop-tests.txt`、不足画像 |
| A04 | FIXTURE PASS、実機確認中 | 作成後の主入口1件、本文内のCode操作、失敗と再試行。`logs/ui-fixture.json` |
| A05 | FIXTURE PASS、実機確認中 | 日本語・空白・引用符を含む値、コピー、ヘルプ往復、新生成での対象切替。`logs/content-check.json`、`logs/ui-fixture.json` |
| A06 | STATIC PASS、実機確認中 | 全構成の成功メッセージを実ソース照合。`logs/source-conformance.json` |
| A07 | STATIC/FIXTURE PASS、実機確認中 | 255内部リンク・見出し、生成先の相対ファイル、ヘルプ復帰。`logs/content-check.json` |
| A08 | STATIC PASS、deb確認中 | 再生成で同一manifest、55章のハッシュ、stage改ざん/欠落拒否。`logs/content-check.json`、`logs/packaging-tests.txt` |
| A09 | PASS / FIXTURE・STATIC | 全6構成生成、API/SQLの目標、Windows専用保存/表示、選択WSL条件。Windows実機はNOT_RUN |
| A10 | 確認中 | 最終debでの一巡を記録予定 |

## シナリオ

| ID | 結果・方法 | 記録 |
| --- | --- | --- |
| T01 | 実機確認中 | 最終deb→生成→VS Code→初期処理正常終了→実ブラウザー表示 |
| T02 | FIXTURE PASS、実機確認中 | 実保存先・変更ポート・全コピー・保存MD・実URLを照合 |
| T03 | FIXTURE PASS、実機確認中 | ヘルプ往復と二つ目の生成で旧パス・URL・Code対象が残らないこと |
| T04 | PASS / FIXTURE | 不足/停止/拡張設定不足/unknown。実PCから依存は削除していない |
| T05 | STATIC/FIXTURE PASS、実機確認中 | 待機と失敗を正常終了と分離。回復先・動的ヘルプ・アンカーフォーカスを確認 |
| T06 | 実機確認中 | オフライン内蔵ガイド、アプリ終了後の保存MDからの再開とサンプル再表示 |
| T07 | PASS / FIXTURE・STATIC | 全6構成の生成案内とリンク。Windows実機はNOT_RUN |

## 検査記録

- generator：30/30 PASS（安全な保存先、生成の再検証、全構成、OS別案内を含む）。
- desktop：32/32 PASS（状態・安全境界・WSL・教材・ヘルプを含む）。
- 実レンダラー＋モックIPC：7シナリオPASS。390px長パスと目次のキーボード操作、初回Markdown遅延読み込みのアンカー、Windowsの現プロジェクトヘルプも確認。
- 内容照合：55章ハッシュ、255内部リンク、6構成の保存MD/生成元一致、再生成同一性PASS。
- 関連原稿：86/86 STATIC PASS、既存メールimporterの隔離fixture 6/6 PASS。旧監査の上書き拒否も確認。
- 同梱検査：clean stageの126ファイル、55章、7テンプレート、同梱helper整合。独立cwd・日本語空白パス・欠落/改ざん拒否PASS。

ユーザー提供の依頼資料は出典保全のため原本バイトを維持している。Markdownの意図的な行末空白も保持し、SHAはprovenance.jsonで追跡する。製品・新規原稿の差分は別に確認した。

## 利用者による確認と残る範囲

今回の自動試験は初心者による操作観察ではない。本人確認は **利用者確認待ち**。

修正版を開いたら、次の課題で確認してもらう。操作前に管理IDやボタン順を教え込まない。

> ツクハコを使って、新しいプロジェクトを作り、サンプル画面をブラウザーに表示してください。普段どおり、画面やマニュアルを見ながら進めてください。

迷った場合は、画面・押した操作・表示文言・どこまで完了したと思ったかを記録する。助言なし/助言あり/未完了を区別し、初回表示後に任意練習へ進まず終了してよいと分かったかも確認する。時間の上限は合格条件にしない。

未確認：所有者の通常インストールを0.4.6へ更新してメニューから起動する経路、初めてのPCへの準備、Windows 11/実WSL、macOS/ARM/他Linux、制限の異なるAppArmor環境、外部購入者の受取、本人の助言なし完了。これらの対応保証は拡大していない。
