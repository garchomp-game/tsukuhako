# ツクハコ 0.4.8 — Linux配布候補

## 変更

- 「今回使うフォルダーと接続先」の直下に、VS Codeで開く主ボタンを置いた。その後に教材タイトルと手順を表示する。
- 最初の画面と生成後に「手順を見ながら進める」「必要な操作だけ進める」を選べる。選択は次回も保持する。
- 簡潔表示でも必須操作・確認結果を省かず、詳しい確認・終了・再開へ移動できる。保存するSTART_HERE.mdとコピーは完全な手順を維持する。
- 用途に合った接続先を表示し、内部のポート一覧を詳細へ移した。Web/APIは既定3000。変更したポートの場合だけターミナル表示との違いを説明する。
- 通知が出ない場合、既にコンテナーへ接続済みの場合、信頼の確認が出た場合を分けて案内する。S2のDB起動順、I1のSQL手順、Windowsの生成時WSLを維持する。
- 狭い画面・キーボード・ヘルプ往復で、焦点や選択を保持する。CIのLinux配布名も版番号へ追従させた。

設計：[生成後の操作と案内モード](../../docs/ux-startup-modes.md)。前回までの開始導線と3000番統一も含む。依存パッケージとランタイムは変更していない。

## ソースと配布候補

- branch: `codex/onboarding-046-20261024`
- 製品ソース・ビルド内sourceCommit: `70137865ff26a925a7920098240558de651d68d0`
- 製品ビルド時の作業ツリー: clean (`dirty:false`)
- 本体・生成処理・同梱ヘルパー: 0.4.8
- 内蔵ガイド: 2026-10-24-r7、61章
- ビルド後のテスト・証跡・レポートのcommitは製品sourceCommitとは区別する。

配布候補：[tsukuhako-linux-amd64-0.4.8.deb](/home/garchomp-game/ダウンロード/ツクハコ-0.4.8-Linux/tsukuhako-linux-amd64-0.4.8.deb)（133,504,816 bytes）。同じフォルダーにINSTALL.txt、SHA256SUMS、manifest.jsonを置いた。

SHA-256: `5816980458c4f3b7a084fb18acc79c6057e13b382f2545711d97b59056429ce4`

## 検証

| 種別 | 結果 | 証跡 |
| --- | --- | --- |
| 生成ロジック | 47/47 PASS | [ログ](logs/generator-tests.txt) |
| アプリ・入力境界・設定 | 34/34 PASS | [ログ](logs/desktop-tests.txt) |
| 型検査・画面ビルド | PASS | [ログ](logs/build.txt) |
| 生成ガイドと教材 | 6構成・317リンク・61章 PASS | [結果](logs/content-check.json) |
| 公開準備原稿の整合 | 86/86 PASS、メールは草稿のまま | [結果](logs/content-audit.json) |
| 画面fixture | 13/13 PASS、描画エラー0 | [詳細](../ux-loop-03-startup/REPORT.md) |
| 配布資材の欠落・破損検出 | 1/1 PASS | [ログ](logs/package-tests.txt) |
| ビルド同梱資材・ヘルパー | PASS、61章・7テンプレート・ヘルパー48ファイル | [資材](logs/stage.json) / [ヘルパー](logs/helper-verify.json) |
| 最終debの静的検査 | PASS、版・ハッシュ・権限・sandbox・desktop定義・依存宣言 | [検査](logs/deb-inspect.json) / [配布先](logs/delivery.json) |
| 最終debをLinux実機で展開起動 | 5項目 PASS、描画エラー0。実生成・実VS Code・実コピー・再起動 | [結果](final/logs/startup-modes-smoke.json) |

画面fixtureは実ガイドデータと模擬ホスト操作を使う。最終debの実動確認、実VS Code、実WSLの確認とは分けて扱う。

実物はsandboxを有効にしたまま、隔離した設定と日本語・空白のある保存先で確認した。3000/3311の画面・生成.env・完全ガイドが一致し、初回のVS Codeが正しいフォルダーを受け取ったことをウィンドウ名・workspace記録・起動引数で確認。表示の切替、オフラインのヘルプ往復、実クリップボード、実プロセス再起動後の選択保持も通った。

VS Codeの撮影・2回目のウィンドウ追跡で検証ツールが停止したため、成功済みの4項目を同じdebハッシュと設定で引き継いで再起動確認だけを継続した。2回目のVS Code実開きは未確認で、生成先を切り替えた際の対象更新はfixtureの証拠に限定する。専用アプリ・Codeは全て終了済み。[終了確認](final/logs/startup-owned-process-cleanup.json)

画面：[接続先の直下に主ボタン](final/screenshots/01-default-quick-editor-action.png) / [実VS Code](final/screenshots/02-vscode-current-folder.png) / [簡潔な手順とヘルプ往復](final/screenshots/03-quick-after-help.png) / [変更ポート](final/screenshots/04-custom-port-quick.png) / [再起動後](final/screenshots/06-restarted-reference-guide.png)

## 未確認と次の操作

- この版のMint通常インストール・メニュー起動・本人の操作確認は未実施。公開前に候補debを導入して初回の導線を確認する。
- この版でのDocker接続からサンプル表示・停止・再開までの全工程は再実施していない。今回は画面と生成物、アプリからVS Codeを開く導線の確認が対象。
- Windows実機/WSLの確認とWindows 0.4.8ビルドは未実施。既存のWindows配布物を新しい版として扱わない。
- ポートの自動選択・作成済みプロジェクトのポート再設定、アプリ再起動後のプロジェクト再選択は残件。現在は競合診断・手動設定・保存先START_HERE.mdからの再開を使う。
- 外部公開、mainへの統合、実メール送信、課金、通常利用アプリの更新は実施していない。
- GitHub Actionsは手動起動専用で、この版では未実行。上の結果はローカル検証であり、CI成功とは扱わない。

今回の候補を手元で確認し、操作に問題がなければ公開対象OS・配布先・main統合を次の工程として決める。
