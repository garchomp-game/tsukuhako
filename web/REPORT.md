# B：登録・確認・配信予定・解除のローカル試作

2026-10-22。branch：`codex/task-b-mail-flow-20261022`。A完了commit `3b0b954` を引き継ぎ、変更は `web/` だけです。C原稿は `e513825` の成果を直接取り込みました。

登録→確認メール→本人POST→初回3通→定期便候補→解除を、架空読者と仮想時計で試せる状態まで完成しました。実メール・公開・課金・main統合は行っていません。アプリ本体とAの確認済み経路は変更・再試験していません。

## 成果物

| 成果 | 内容 |
|---|---|
| 利用者画面 | 商品の要約、4公開ガイド、任意登録、未着/再送、確認/期限切れ/使用済み/解除済み、解除完了 |
| ローカル運営試用 | `/preview` の原稿・共通フッター・設定確認、ローカルreview/active、仮想時計、予約、Mock受信箱、unknown照合、取消/全体停止 |
| 永続化 | ローカルD1の購読/同意/確認token hash/原稿revision/配送一意性/日次枠/providerイベント。再起動後も保持 |
| 原稿連携 | Cの5メール＋2フッター＋4ガイド＋画面文言をallowlistで直接取込。paid本文/非公開DL設定は取込対象外 |
| 配信条件 | 0/2/5日、JST19:00、定期便の7×24hと初回未処理除外、JST暦日1通、許容遅延48h、未承認版停止 |
| 例外 | 連打/同時要求の重複抑止、期限切れ再送、再登録時の本人再確認、苦情/恒久バウンス抑止、unknownを再送せず照合 |
| 公開準備 | `.env.example`、型/静的ビルド/混入検査、本番書き出し拒否。起動と接続手順はREADME/PROVIDER-SETUPに統合 |

`npm run dev` は原稿取込とローカルmigrationを自動実行します。既定のURLは `http://127.0.0.1:5173`、APIは8787。`.test` / `.invalid` / `example.com` の架空アドレスだけを受理します。送信者や本番URLはnullのままです。共有する顧客データはありません。

## 検証結果

| 区分 | 結果 | 証跡 |
|---|---|---|
| 自動試験 | **24/24 PASS**（JST計算1件＋Miniflare/Workers/D1のfixture23件） | [mail-tests.log](evidence/mail-tests.log) |
| 型・公開UIビルド | **PASS**。preview管理、有料DLキー、メール原稿、秘密キーを静的成果物へ含めない | [build.log](evidence/build.log) |
| 本番出力拒否 | **PASS**。未設定8リンク、送信元2項目、draft原稿、実adapterなしで終了1 | [release-gate.log](evidence/release-gate.log) |
| ローカル起動・停止 | **PASS**。Vite proxy→Worker health、所有プロセス終了後5173/8787のlistenerなし | [start-stop.log](evidence/start-stop.log) |
| ブラウザ操作 | 統合担当がC本文と照合して360px/キーボード/実200%等を確認。Bの自動試験と区分 | 統合レポート参照 |
| 実配信 | **NOT_RUN / 送信0件**。Provider adapterは存在せず、試験時は外向きfetchを拒否 | [verification.json](evidence/verification.json) |

固定の「24通を送れた」という意味ではありません。架空データを作る試験で、D1の状態・Mock受付・重複しないこと・例外で止まることを確認しています。acceptedは到達・開封の証明ではありません。意図的にevent処理へ失敗を注入する試験の `local-preview-operation-failed Error` は、rollbackと再試行を確認する想定内の出力です。

## 独立レビューから修正した点

同時登録で確認メールが二重になる競合を、発行batch内の条件付き書き込みで防ぎました。確認GETは購読を変えず、本人POSTと配送作成はD1 batchと一意制約で一度にまとめています。

イベントの記録だけが先に残り抑止に失敗する問題を、イベント・抑止・処理済み印の同一batch化で修正しました。重複と順不同でも購読を復活させません。苦情と恒久バウンスはフォーム再入力では解除しません。

予約の取得後でも、最終Mock受付時に購読・抑止・enrollment・原稿current/revision・全体停止を再確認します。claimしたrevisionとattemptを固定し、旧dispatcherが改稿後のメールを旧本文で送り、または新処理を取り消す競合を防ぎました。

全体停止は未受付のplanned/submitting/failedと予約中の定期号を取り消します。停止中の確認発行/購読確定もbatch内で拒否し、遅れて戻った失敗結果が取消を上書きしません。再開のみで旧予約が復活しないことを試験しました。

改稿・リンク設定・対象条件・フッター・参照ガイドの変更は新revisionのdraftになります。影響した旧予約を止め、共通原稿は再確認/有効化、定期号は再確認/予約の後に明示振替します。本文を過去の内容へ戻しても新revisionです。Cのdraftファイルをactiveへ書き換えることはありません。

画面では未設定ガイドリンクを非リンクの「設定待ち」にし、確認状態を取得できない場合も再試行へ進めます。メールHTMLの確認・解除リンクはsandboxを緩めず親画面へ移動します。

## 本番との境界・未確認事項

実装は**ローカルpreview専用**です。非localhostと `MAIL_MODE != preview` は拒否します。`/api/mail-events` はローカルfixture入口で、実provider署名検証はありません。APIキーを足しても実配信へ切り替わるコードはありません。公開するときは本番のsender adapter、認証、署名webhook、データ保持/削除、停止運用を別に実装・試験します。

確認tokenの照合テーブルにはhashだけを保存します。クリック試験用のMock受信箱には架空の受信者URLが保存されるため、`.wrangler/` はGit/公開物に含めません。通常の解除GETと、追加画面なしの `List-Unsubscribe=One-Click` POSTを分けています。これはローカル契約の試験であり、実メール上のHTTPS/DKIMを含むRFC 8058対応完了ではありません。

本番URL、価格、販売条件、提供OS、一般購入者の取得権限、送信元、窓口、Resend利用可能機能/プラン/費用、ドメイン認証、実メールの到達は未確定/未確認です。Windows 11実機と実WSLの確認範囲はAのNOT_RUNを維持します。

次に依頼者が行うことは、統合版の `/preview` で原稿と一周の導線を確認し、販売条件・公開URL・窓口・提供OSの判断をそろえることです。その後、公開や実メール試験を別の実施工程として進めます。詳細は統合版の `PROVIDER-SETUP.md` と `PUBLISH-CHECKLIST.md` を参照してください。
