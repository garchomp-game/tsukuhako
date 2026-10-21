# 実施範囲

依頼の49項目は **PASS 37 / FAIL 0 / BLOCKED 7 / NOT_RUN 5**。PASSはLinux実ホストの自動操作。VM実行0・fixture実行0。E05の代替「実CLIの接続先不通→復旧」1件は補足PASSとして別集計。途中の失敗は消しておらず、最終未解決FAIL 0と失敗試行18件は別の数字です。

M/F2とT-F2は別の要求行として数えています。同じ操作の重複計上で品質を推定する数字ではありません。Cは隔離Linux Mint VMを計画した項目であり、実VMを動かした件数は0です。

| ID | 結果・場所 | 期待結果 | 実結果・限界 | 場面（画像・動画位置） | ログ |
|---|---|---|---|---|---|
| M01 | PASS<br>REAL_HOST<br>自動操作 | 受取アーカイブの版・サイズ・SHAを固定 | ローカルビルドのコピー。123,927,962 bytes、SHA一致。 | [M01](<steps.md#record-9>) | [記録](<artifact.json>) |
| M02 | PASS<br>REAL_HOST<br>自動操作 | 利用者向けの操作で展開し実行ファイルを確認 | NemoのExtract Here、展開先のファイルを選択。入力失敗と再試行を原本に保持。 | [M02b](<steps.md#record-11>) / [M02d-retry](<steps.md#record-14>) | [記録](<logs/normal-launch.json>) |
| M03 | PASS<br>REAL_HOST<br>自動操作 | 通常ユーザー・通常入口で初回起動 | Nemoから引数なしで起動。UID 1000、窓表示まで2,329ms。以後は観測ポート付き。 | [M03](<steps.md#record-15>) / [M03b-observation](<steps.md#record-16>) | [記録](<logs/normal-launch.json>) |
| M04 | PASS<br>REAL_HOST<br>自動操作 | 初期説明と実診断を確認 | Docker利用可能、専用の空の拡張領域は不足と表示。 | [M04](<steps.md#record-17>) / [E06a](<steps.md#record-18>) | [記録](<environment.json>) |
| M05 | PASS<br>REAL_HOST<br>自動操作 | Linux準備教材と戻り先を確認 | 準備教材をアプリ内で開く。実インストールCとは別。 | [M05](<steps.md#record-19>) | [記録](<logs/main-app-capture.txt>) |
| M06 | PASS<br>REAL_HOST<br>自動操作 | 戻って同じ構成を再診断 | F2を保持して再診断。拡張導入後には利用可能へ更新。 | [M06](<steps.md#record-20>) / [E06](<steps.md#record-36>) | [記録](<logs/main-app-capture.txt>) |
| M07 | PASS<br>REAL_HOST<br>自動操作 | 用途からF2を選択 | 画面を作る / Next.js / F2を確認。 | [M07](<steps.md#record-21>) | [記録](<F2-project.json>) |
| M08 | PASS<br>REAL_HOST<br>自動操作 | 日本語・空白の新規先と空きポートを入力 | F2 日本語 はじめの練習、ホスト35409を設定。 | [M08](<steps.md#record-22>) | [記録](<F2-project.json>) |
| M09 | PASS<br>REAL_HOST<br>自動操作 | 作成前に戻って修正し再確認 | 仮のフォルダ名を修正、生成前の出力なしを確認。 | [M09a](<steps.md#record-23>) / [M09](<steps.md#record-24>) | [記録](<logs/main-app-capture.txt>) |
| M10 | PASS<br>REAL_HOST<br>自動操作 | 生成中から完了まで記録 | 短時間の状態変化をMutationObserver時刻と連続動画に記録。 | [M10](<steps.md#record-25>) | [記録](<logs/M10-generation.json>) |
| M11 | PASS<br>REAL_HOST<br>自動操作 | ファイル生成とコンテナ未起動を区別 | 完了画面と次の操作、教材の「まだ起動していません」を確認。 | [M11](<steps.md#record-26>) / [M12](<steps.md#record-27>) | [記録](<logs/main-app-capture.txt>) |
| M12 | PASS<br>REAL_HOST<br>自動操作 | 今回の設定を教材とSTART_HEREで確認 | パス・F2版0.1.1・ポート35409が一致。 | [M12](<steps.md#record-27>) | [記録](<logs/F2-START_HERE.md>) |
| M13 | PASS<br>REAL_HOST<br>自動操作 | 生成先でホストdoctorを実行 | pwdで生成先を確認し、doctorの診断OKを表示。 | [M13](<steps.md#record-30>) | [記録](<logs/M13-host-final.typescript>) |
| M14 | PASS<br>REAL_HOST<br>自動操作 | アプリから同じプロジェクトをCodeで開く | 実Code入口、初回説明、信頼、Marketplace拡張導入を通過。信頼画面だけローカル原本。 | [M14a](<steps.md#record-31>) / [M14b](<steps.md#record-32>) / [M14c](<steps.md#record-33>) / [E06b](<steps.md#record-34>) / [E06c](<steps.md#record-35>) | [記録](<logs/code-invocations.log>) |
| M15 | PASS<br>REAL_HOST<br>自動操作 | Reopenと初回構成処理の完了を確認 | Reopen→接続表示は約16秒。Docker/VS Code Serverに既存キャッシュあり。npm準備完了は別に確認。 | [M15-command-02](<steps.md#record-39>) / [M15-progress-02](<steps.md#record-40>) / [M15-postcreate](<steps.md#record-60>) | [記録](<logs/F2-postcreate-complete.txt>) |
| M16 | PASS<br>REAL_HOST<br>自動操作 | 接続表示とコンテナ内pwdを確認 | Dev Container: ツクハコ F2、/workspaceを表示。 | [M16](<steps.md#record-41>) | [記録](<logs/F2-connection.json>) |
| M17 | PASS<br>REAL_HOST<br>自動操作 | 実Code端末でサーバーを起動 | 依存準備後にnpm run dev、ReadyとHTTP 200を確認。途中の失敗・入力修正あり。 | [E07-F2-early-dev](<steps.md#record-42>) / [E07-F2-recovered-02](<steps.md#record-48>) / [M17](<steps.md#record-49>) | [記録](<logs/F2-terminal-ready.txt>) |
| M18 | PASS<br>REAL_HOST<br>自動操作 | 教材のホストURLで初期画面を表示 | http://localhost:35409/ でF2画面を確認。 | [M18](<steps.md#record-50>) | [記録](<logs/F2-exercise.json>) |
| M19 | PASS<br>REAL_HOST<br>自動操作 | 実エディタで編集保存し画面変化を確認 | 見出しを「わたしの練習室」へ変更、ブラウザへ反映。 | [M19-editor](<steps.md#record-51>) / [M19](<steps.md#record-52>) | [記録](<logs/F2-exercise.json>) |
| M20 | PASS<br>REAL_HOST<br>自動操作 | 元へ復元保存し画面とハッシュを確認 | 元の見出しとソースSHA-256が一致。 | [M20-editor](<steps.md#record-53>) / [M20](<steps.md#record-54>) | [記録](<logs/F2-exercise.json>) |
| M21 | PASS<br>REAL_HOST<br>自動操作 | 生成F2・学習S2でヘルプを複数回往復 | 各3回押下、戻り先と教材選択・読書位置を保持。 | [M21-F2](<steps.md#record-55>) / [M21-S2](<steps.md#record-56>) | [記録](<logs/F2-reading-capture.txt>) |
| M22 | PASS<br>REAL_HOST<br>自動操作 | アプリ再起動後の読書位置と標準教材を確認 | 非ゼロ420pxを保持。生成情報は永続化しない仕様。START_HEREをCodeで開いて再開。 | [M22](<steps.md#record-58>) / [M22-scroll-before](<steps.md#record-61>) / [M22-scroll-restored](<steps.md#record-62>) / [M22-resume](<steps.md#record-59>) | [記録](<logs/M22-reading-nonzero.json>) |
| M23 | PASS<br>REAL_HOST<br>自動操作 | 自分のF2だけ停止して再開 | 通常停止後に同じコンテナへ再接続、元画面・元ソースを保持。 | [M23-stop](<steps.md#record-63>) / [M23](<steps.md#record-65>) | [記録](<logs/F2-lifecycle.json>) |
| T-F1 | PASS<br>REAL_HOST<br>自動操作 | Vite・入力・ラベル編集復元 | 起動、入力と表示の一致、今日のことばへの変更と復元。 | [F1-generated](<steps.md#record-70>) / [F1-doctor](<steps.md#record-72>) / [F1-postcreate](<steps.md#record-75>) / [F1-server](<steps.md#record-76>) / [F1-first](<steps.md#record-77>) / [F1-input](<steps.md#record-78>) / [F1-changed](<steps.md#record-80>) / [F1-restored](<steps.md#record-81>) / [F1-stop](<steps.md#record-82>) | [記録](<logs/F1-exercise.json>) |
| T-F2 | PASS<br>REAL_HOST<br>自動操作 | Next.jsの主経路・編集復元 | M01〜M23、通常再接続とRebuild、ソースSHA一致。 | [M17](<steps.md#record-49>) / [M18](<steps.md#record-50>) / [M19](<steps.md#record-52>) / [M20](<steps.md#record-54>) / [M23](<steps.md#record-65>) / [E09](<steps.md#record-68>) | [記録](<logs/F2-exercise.json>) |
| T-B1 | PASS<br>REAL_HOST<br>自動操作 | API JSONの成功・編集・復元 | status:ok→lesson:preview追加→元のJSON。ブラウザとcurlで確認。 | [B1-generated](<steps.md#record-84>) / [B1-doctor](<steps.md#record-86>) / [B1-postcreate](<steps.md#record-89>) / [B1-server](<steps.md#record-90>) / [B1-first](<steps.md#record-91>) / [B1-curl-changed](<steps.md#record-94>) / [B1-curl-restored](<steps.md#record-96>) / [B1-stop](<steps.md#record-97>) | [記録](<logs/B1-exercise.json>) |
| T-S1 | PASS<br>REAL_HOST<br>自動操作 | UIからAPIへ送信し教材の変更復元 | こんにちはを送信し空白除去・5コードポイント。見出し変更と復元。 | [S1-generated](<steps.md#record-99>) / [S1-doctor](<steps.md#record-101>) / [S1-postcreate](<steps.md#record-104>) / [S1-server](<steps.md#record-105>) / [S1-api](<steps.md#record-107>) / [S1-changed](<steps.md#record-109>) / [S1-restored](<steps.md#record-110>) / [S1-stop](<steps.md#record-111>) | [記録](<logs/S1-exercise.json>) |
| T-S2 | PASS<br>REAL_HOST<br>自動操作 | ローカルDB起動・保存・見出し変更復元・非破壊停止 | CLI取得、保存/編集/再読込、見出し変更復元。停止後データ保持とCRUD rollback試験。UI削除は未実施。 | [S2-generated](<steps.md#record-113>) / [S2-doctor](<steps.md#record-115>) / [S2-postcreate](<steps.md#record-120>) / [S2-db-start](<steps.md#record-116>) / [S2-db-ready](<steps.md#record-117>) / [S2-database](<steps.md#record-123>) / [S2-database-edit](<steps.md#record-124>) / [S2-heading-changed](<steps.md#record-165>) / [S2-heading-restored](<steps.md#record-166>) / [S2-retention](<steps.md#record-143>) / [S2-db-test](<steps.md#record-144>) / [S2-heading-stop](<steps.md#record-167>) | [記録](<logs/S2-exercise.json>) |
| T-I1 | PASS<br>REAL_HOST<br>自動操作 | migration・SQL・変更復元・再実行 | migration 001適用、2行のサンプル、lessonの変更と復元を再実行。 | [I1-generated](<steps.md#record-130>) / [I1-doctor](<steps.md#record-132>) / [I1-postcreate](<steps.md#record-135>) / [I1-first](<steps.md#record-136>) / [I1-changed](<steps.md#record-140>) / [I1-restored](<steps.md#record-141>) / [I1-stop](<steps.md#record-142>) | [記録](<logs/I1-exercise.json>) |
| E01 | PASS<br>REAL_HOST<br>自動操作 | 存在しない親でエラーと入力保持 | 自動作成せずエラー。正しい親へ修正して後続の生成に到達。 | [E01](<steps.md#record-146>) / [E03](<steps.md#record-150>) | [記録](<logs/recovery-summary.json>) |
| E02 | PASS<br>REAL_HOST<br>自動操作 | 既存先を変更しない | 上書き拒否、keep.txtのSHAを保持。 | [E02](<steps.md#record-147>) | [記録](<logs/recovery-summary.json>) |
| E03 | PASS<br>REAL_HOST<br>自動操作 | 試験所有ポートの競合→変更→生成 | 元の待受を止めず空き番号へ変更して成功。警告画像を別試行で補足。 | [E03-warning-detail](<steps.md#record-159>) / [E03-conflict](<steps.md#record-148>) / [E03](<steps.md#record-150>) | [記録](<logs/recovery-summary.json>) |
| E04 | PASS<br>REAL_HOST<br>自動操作 | 生成前に戻って入力・出力を確認 | 戻る→入力保持→まだ出力なし→再確認・生成。診断取消は未実施。 | [E04](<steps.md#record-149>) / [E03](<steps.md#record-150>) | [記録](<logs/recovery-summary.json>) |
| E05 | NOT_RUN<br>NOT_EXECUTED | Docker未導入・サービス停止・権限不足を隔離環境で再現 | 該当3状態は未実施。代替でこのアプリだけ無効なDOCKER_HOSTを指定し、実CLI接続失敗→案内→復旧を記録したが本項の合格には数えない。 | [E05-unavailable](<steps.md#record-156>) / [E05-guide](<steps.md#record-157>) / [E05](<steps.md#record-158>) | [記録](<logs/vm-readiness.json>) |
| E06 | PASS<br>REAL_HOST<br>自動操作 | 専用Code領域の拡張不足→実導入→再確認 | 空の拡張領域からMarketplaceの0.469.0を取得し、アプリ診断が利用可能に変化。VS Code本体の新規導入はC。 | [E06a](<steps.md#record-18>) / [E06b](<steps.md#record-34>) / [E06c](<steps.md#record-35>) / [E06](<steps.md#record-36>) | [記録](<logs/F2-connection.json>) |
| E07 | PASS<br>REAL_HOST<br>自動操作 | 発生した接続・依存関連の失敗と復旧を記録 | 依存導入完了前のnext:not foundを保存。完了待ちと端末入力の修正でReady/HTTP 200。意図的な通信断は未実施。 | [E07-F2-early-dev](<steps.md#record-42>) / [M15-postcreate](<steps.md#record-60>) / [M17](<steps.md#record-49>) | [記録](<logs/E07-F2-early-dev.txt>) |
| E08 | PASS<br>REAL_HOST<br>自動操作 | 通常・狭幅・200%・キーボードの主要操作 | 860px幅・200%で本文/コマンド/戻るを確認。Tab/Enterで準備教材と準備画面を往復。多重スクロールあり。 | [E08-normal](<steps.md#record-151>) / [E08-narrow](<steps.md#record-152>) / [E08-200-body](<steps.md#record-160>) / [E08-200-command](<steps.md#record-161>) / [E08-200-return](<steps.md#record-162>) / [E08-keyboard-guide](<steps.md#record-154>) / [E08](<steps.md#record-155>) | [記録](<logs/recovery-detail.json>) |
| E09 | PASS<br>REAL_HOST<br>自動操作 | 再接続とRebuildを区別しデータを保持 | 通常再接続は同じコンテナ、Rebuildはb4fd89a5377f→7b933089119e。元ファイルと依存volumeを保持。 | [M23](<steps.md#record-65>) / [E09-rebuild-start](<steps.md#record-66>) / [E09-postcreate](<steps.md#record-67>) / [E09](<steps.md#record-68>) | [記録](<logs/F2-lifecycle.json>) |
| C01 | BLOCKED<br>NOT_EXECUTED | 未導入状態の実診断 | 利用可能なハイパーバイザー・既存VMなし。KVMと資源は利用可能だがsudo -nは認証必須。ホスト削除による再現は行わず。 | 未実施 | [記録](<logs/vm-readiness.json>) |
| C02 | BLOCKED<br>NOT_EXECUTED | 未導入状態からガイド | 利用可能なハイパーバイザー・既存VMなし。KVMと資源は利用可能だがsudo -nは認証必須。ホスト削除による再現は行わず。 | 未実施 | [記録](<logs/vm-readiness.json>) |
| C03 | BLOCKED<br>NOT_EXECUTED | Docker/Compose実導入 | 利用可能なハイパーバイザー・既存VMなし。KVMと資源は利用可能だがsudo -nは認証必須。ホスト削除による再現は行わず。 | 未実施 | [記録](<logs/vm-readiness.json>) |
| C04 | BLOCKED<br>NOT_EXECUTED | 権限・再ログイン境界 | 利用可能なハイパーバイザー・既存VMなし。KVMと資源は利用可能だがsudo -nは認証必須。ホスト削除による再現は行わず。 | 未実施 | [記録](<logs/vm-readiness.json>) |
| C05 | BLOCKED<br>NOT_EXECUTED | VS Code本体・拡張実導入 | 利用可能なハイパーバイザー・既存VMなし。KVMと資源は利用可能だがsudo -nは認証必須。ホスト削除による再現は行わず。 | 未実施 | [記録](<logs/vm-readiness.json>) |
| C06 | BLOCKED<br>NOT_EXECUTED | 不足→完了の診断 | 利用可能なハイパーバイザー・既存VMなし。KVMと資源は利用可能だがsudo -nは認証必須。ホスト削除による再現は行わず。 | 未実施 | [記録](<logs/vm-readiness.json>) |
| C07 | BLOCKED<br>NOT_EXECUTED | キャッシュなしの最初の取得 | 利用可能なハイパーバイザー・既存VMなし。KVMと資源は利用可能だがsudo -nは認証必須。ホスト削除による再現は行わず。 | 未実施 | [記録](<logs/vm-readiness.json>) |
| O-Windows | NOT_RUN<br>NOT_EXECUTED | Windows実機 | 今回のLinux実ホスト・エージェント自動操作の対象外。 | 未実施 | — |
| O-macOS | NOT_RUN<br>NOT_EXECUTED | macOS実機 | 今回のLinux実ホスト・エージェント自動操作の対象外。 | 未実施 | — |
| O-Brain | NOT_RUN<br>NOT_EXECUTED | Brain購入手続き | 今回のLinux実ホスト・エージェント自動操作の対象外。 | 未実施 | — |
| O-Beginner | NOT_RUN<br>NOT_EXECUTED | 初心者本人の無介助完走 | 今回のLinux実ホスト・エージェント自動操作の対象外。 | 未実施 | — |

## E05補足

実ホスト上でこのアプリのDOCKER_HOSTだけを存在しない専用ソケットへ向け、実Docker CLIの接続失敗→Linux教材→指定解除→実診断で利用可能を確認しました。IPCの差し替えやfixtureはありません。未導入・サービス停止・権限拒否の3状態には該当しないためE05本体はNOT_RUNです。[補足の実測](<logs/recovery-summary.json>)

## 失敗した試行

記録のFAIL 18件のうち、実操作のタイミング 1件、撮影操作・入力・フレーム不足 17件。これらは同じ不具合の重複画像を含み、製品不具合件数ではありません。[失敗の詳細と再試行](<steps.md>)、[訂正理由](<review.json>)。

E04の診断取消、E07の意図的な通信断、S2の画面からの削除は今回未実施です。S2削除を含むDB権限・制約は同梱のrollback型CRUD試験で別に確認しました。S3クラウド参考構成の実装・起動は対象外です。
