# ツクハコ 0.4.6 初回利用の改訂と検証

追記（2026-10-24）：後続レビューで、開始ボタン後の案内と生成前ヘルプの2点に不整合が見つかった。以下の当時のPASS記録は、その不整合がないことまで保証するものではない。A06・A07・A09に関する追加修正と直接再確認は、[0.4.7のレビュー対応報告](../onboarding-0.4.7/REPORT.md)を参照。元の証拠は保持している。

対象依頼は `docs/requests/onboarding-2026-10-24/tsukuhako-onboarding-revision-request-2026-10-24.md`。添付ZIPの背景資料は設計の根拠として読み、依頼書のP0・P1を今回の実装範囲とした。前版24e3b85から専用worktreeで継続し、既存の通常インストール0.4.5は変更していない。

状態：**P0・P1の実装・検証完了**。A01〜A10を下記の方法で確認した。利用者本人による確認は **利用者確認待ち**。

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
- privateリポジトリ：[garchomp-game/tsukuhako](https://github.com/garchomp-game/tsukuhako/tree/codex/onboarding-046-20261024)。`garchomp-game`でpush。
- 製品ビルド元：`1d0a0441e3aa8d1003f3e104fc71bf95d3212d0c`（clean）
- アプリ：0.4.6、ガイド：2026-10-24-r4
- 生成対象：6構成。参考資料を含むテンプレート7件、教材55章、bundle検査126ファイル。
- mainへの統合、公開Release、公開アップロードは行っていない。
- 最終deb：`/home/garchomp-game/ダウンロード/ツクハコ-0.4.6-Linux/tsukuhako-linux-amd64-0.4.6.deb`
- サイズ：133,497,424 bytes
- SHA-256：`937f77998b1f190811750b959cd270d4eb513bb310797c1798b12a54731b54c8`
- 同じフォルダーにINSTALL.txt、SHA256SUMS、manifest.jsonを配置。実行にソースZIPは不要。
- Webサンプル上の管理IDも削除し、F1 0.1.4 / F2 0.1.2 / S1 0.1.3 / S2 0.1.3へ更新。依存版や機能は変更していない。旧ZIPは保持。今回実起動した構成は推奨Webのみで、他構成の今回変更は生成・ソース/ZIP一致で確認。

原稿と画面は別worktreeで分担し、統合branchへcherry-pickした。主要担当commitはcore `13b4a3e`、UI `64b9898` / `3e6a6ad`、原稿 `599ddcd` / `8929504` / `b56f003`。通常利用のアプリ・設定・他プロジェクトのDockerコンテナーを変更していない。

## 受入条件

REAL_HOSTは対象Linux Mint上の実ファイル・実Docker・実VS Code・実ブラウザー、EXTRACTED_DEBは最終debを別領域へ展開した本体、FIXTUREは模擬IPC/状態、STATICは文書・コード・ハッシュ照合を意味する。自動操作での結果を利用者本人の成功としない。

| ID | 結果 | 確認方法と証拠 |
| --- | --- | --- |
| A01 | PASS / REAL_HOST・STATIC | 最終debの画面から実サンプル表示まで確認。通常の案内とサンプルのバッジから管理IDを削除。実パスと技術詳細は保持。final/screenshots/00-first-screen.png、03-first-page.png |
| A02 | PASS / REAL_HOST・STATIC | 変更・復元を行わずサンプル表示で完了。全6構成のrequiredはverifyまで。final/logs/first-page.json、logs/content-check.json |
| A03 | PASS / FIXTURE | missing/stopped/setup/restart/unknown、Linux生成可、Windows選択ヘルパー一致、実行方式適合未確認を検査。logs/desktop-tests.txt、logs/ui-fixture.json |
| A04 | PASS / REAL_HOST・FIXTURE | 作成後の主入口1件、動的本文内のCode操作、失敗と再試行。final/logs/generation.json、logs/ui-fixture.json |
| A05 | PASS / REAL_HOST・FIXTURE | 長い日本語・空白の実パス、変更ポート、実クリップボードと保存MDのSHA一致、ヘルプ往復、新生成での対象切替。final/logs/current-project.json、second-project.json |
| A06 | PASS / REAL_HOST・STATIC | 最終debから初期処理の「準備完了」＋Doneを確認してサーバー起動。Chromeの実描画を検査。final/logs/initialization.json、first-page.json |
| A07 | PASS / REAL_HOST・STATIC | 255内部リンクと見出し、実ファイル参照を検査。オフラインの症状→工程復帰、アプリ終了後の保存MDプレビュー→同じプロジェクト再開。final/logs/ui-guide.json、saved-guide-preview.json、stop-resume.json |
| A08 | PASS / STATIC・EXTRACTED_DEB | 再生成で同一manifest、55章ハッシュ、改ざん/欠落拒否、最終debの同梱物、helper、配布先コピーのSHA一致。logs/content-check.json、final/logs/deb-inspection.json、delivery.json |
| A09 | PASS / FIXTURE・STATIC | 全6構成の生成と実リンク、API/SQLの目標、Windows用保存/表示・選択WSL条件。logs/generator-tests.txt、desktop-tests.txt、source-conformance.json、source-archives.json。Windows実機NOT_RUN |
| A10 | PASS / EXTRACTED_DEB_ON_REAL_HOST | Linux Mint 22.3 x64で最終debを展開して一巡・再開。final/logs/first-page.json、stop-resume.json。通常インストール更新・メニュー起動とは別 |

## シナリオ

| ID | 結果・方法 | 記録 |
| --- | --- | --- |
| T01 | PASS / REAL_HOST | 最終deb→生成→実VS Code→初期処理正常終了→Chromeの実サンプル見出しを確認。final/logs/initialization.json、first-page.json |
| T02 | PASS / REAL_HOST | 長い日本語・空白の保存先、非既定ポート。主ガイド・実クリップボード・保存MD・実際のURLが一致。final/logs/current-project.json、generation.json |
| T03 | PASS / REAL_HOST・FIXTURE | ヘルプ往復後も今回の値を保持。二つ目の生成後に旧パス/URLが消え、実Codeウィンドウも新しいフォルダー。final/logs/second-project.json |
| T04 | PASS / FIXTURE | 未導入・停止・拡張設定不足・検出不能の表示/対処/生成条件。実PCから依存は削除していない。logs/ui-fixture.json、screenshots/preparation-*-fixture.png |
| T05 | PASS / 方法別に確認 | 実機：初期処理の進行・正常終了と停止/再開。STATIC/FIXTURE：処理中に別コマンドを重ねない案内、失敗時の症状リンク・復帰先。実環境での初期処理失敗の意図的再現はNOT_RUN |
| T06 | PASS / REAL_HOST | オフラインで5章と準備/症状リンクを閲覧。アプリ終了後、保存MDのプレビューに実保存先と再開見出しが描画され、同じフォルダー・同じコンテナーでサンプル再表示。final/logs/ui-guide.json、saved-guide-preview.json、stop-resume.json |
| T07 | PASS / FIXTURE・STATIC | 全6構成の案内生成・リンク、API応答/SQL接続とクエリ等の目標を維持。Windows分岐fixture確認、Windows実機NOT_RUN |

## 検査記録

- generator：30/30 PASS（安全な保存先、生成の再検証、全構成、OS別案内を含む）。
- desktop：32/32 PASS（状態・安全境界・WSL・教材・ヘルプを含む）。
- 実レンダラー＋モックIPC：7シナリオPASS。390px長パスと目次のキーボード操作、初回Markdown遅延読み込みのアンカー、Windowsの現プロジェクトヘルプも確認。
- モックIPC試験で使ったレンダラー4ファイルは、最終deb内の同じ4ファイルとSHAが一致（final/logs/renderer-fixture-match.json）。
- 内容照合：55章ハッシュ、255内部リンク、6構成の保存MD/生成元一致、再生成同一性PASS。
- 関連原稿：86/86 STATIC PASS、既存メールimporterの隔離fixture 6/6 PASS。旧監査の上書き拒否も確認。
- 同梱検査：clean stageの126ファイル、55章、7テンプレート、同梱helper整合。独立cwd・日本語空白パス・欠落/改ざん拒否PASS。
- GitHub Actions：この作業branchの実行履歴は0件。CI成功とは扱わず、上記は保存したローカル検査の結果。mainは`55d3b051935df80d24f988719b52a4937f2f559b`のまま。

ユーザー提供の依頼資料は出典保全のため原本バイトを維持している。Markdownの意図的な行末空白も保持し、SHAはprovenance.jsonで追跡する。隔離導入の生ログ2本（container-run.log / container/commands.log）も端末出力のCRを保持し、final/EVIDENCE-MANIFEST.jsonでSHAを記録した。これら以外の製品・新規原稿・記録は差分の空白検査を通過している。

## 画面と実機検証の証拠

- [起動直後](final/screenshots/00-first-screen.png)
- [準備不足・模擬状態](screenshots/preparation-missing-fixture.png) / [検出不能・模擬状態](screenshots/preparation-unknown-fixture.png)
- [生成完了](final/screenshots/01-generation-complete.png)
- [今回の保存先とURLを含む手順](final/screenshots/02-current-project-guide.png) / [狭い幅と長いパス](final/screenshots/03-long-path-narrow.png)
- [初期処理の正常終了](final/screenshots/02-initialized.png)
- [実際のサンプル表示](final/screenshots/03-first-page.png)
- [二つ目のプロジェクト](final/screenshots/05-second-project.png)
- [保存済み案内のプレビュー](final/screenshots/06-saved-guide-resume.png) / [再開後のサンプル](final/screenshots/07-resumed-sample.png)

最終debの実機証拠は **final/** のみ。階層直下の実機記録はサンプルのバッジ修正前の先行検査で、最終版の証拠には読み替えない（PRE-FINAL.md）。初回の検証コードのリンク選択・非同期コピー待ち・異常終了後の計測プロセス残留は logs/test-runner-adjustments.md に記録した。製品は通常のウィンドウ終了で閉じ、再起動後の読書位置も復帰した。

最終debの隔離Ubuntu 24.04試験では、下位版fixture→更新→削除→再導入→purge、依存解決、権限、設定/生成プロジェクト/旧tar/模擬Dockerデータの保全がPASS（final/isolated-container/result.json）。下位版は同じpayloadのパッケージ版だけを変更したfixtureであり、実在した旧版すべてからの更新保証ではない。Mintの通常GUI導入とは別の検査。

検証後は専用のVS Code・デスクトップ・サーバーを終了し、検証対象コンテナーを停止した。生成フォルダーとボリュームは保持。通常インストール0.4.5と他プロジェクトの稼働コンテナー2件は維持している（final/logs/cleanup.json）。

## 利用者による確認と残る範囲

手元の0.4.5はそのまま残している。通常のツクハコを閉じ、上記フォルダーの0.4.6 debをファイルマネージャーから開いて更新し、メニューから起動する。導入手順は同じフォルダーのINSTALL.txtにある。更新後、画面上部が0.4.6であることを確認する。

今回の自動試験は初心者による操作観察ではない。本人確認は **利用者確認待ち**。

修正版を開いたら、次の課題で確認してもらう。操作前に管理IDやボタン順を教え込まない。

> ツクハコを使って、新しいプロジェクトを作り、サンプル画面をブラウザーに表示してください。普段どおり、画面やマニュアルを見ながら進めてください。

迷った場合は、画面・押した操作・表示文言・どこまで完了したと思ったかを記録する。助言なし/助言あり/未完了を区別し、初回表示後に任意練習へ進まず終了してよいと分かったかも確認する。時間の上限は合格条件にしない。

未確認：所有者の通常インストールを0.4.6へ更新してメニューから起動する経路、初めてのPCへの準備、Windows 11/実WSL、macOS/ARM/他Linux、制限の異なるAppArmor環境、外部購入者の受取、本人の助言なし完了。これらの対応保証は拡大していない。
