# A・B・C：販売・学習メール導線の統合準備

2026-10-22。**Aの完了成果を引き継ぎ、CのBrain本文・メール・ガイド、Bの登録・本人確認・配信予定・解除を、ローカルで試せる状態まで完成しました。** ZIPの00〜08を読み、追加依頼に従って全担当をこのセッション内で分担しました。Aの成功済み製品試験や配布ビルドは繰り返していません。

公開・実メール送信・課金・mainへの統合は行っていません。価格・本番URL・送信元は未確定のままです。C原稿はdraftを維持し、ローカルの確認操作は試作DBだけに適用します。

## 成果物

| 担当 | 完成したもの | 入口 |
|---|---|---|
| A（引継ぎ） | アプリレビュー、終了検証の修正、採用するOS別4点セット、商品事実、受取・Win11試験手順 | [Aレポート](../release-0.4.4-followup/REPORT.md)、[商品事実](../release-0.4.4-followup/PRODUCT-FACTS.md)、[配布チェック](../release-0.4.4-followup/DELIVERY-CHECKLIST.md) |
| C | Brain無料/購入済み本文、確認1通・初回3通・定期便1通、共通フッター、公開ガイド4本、画面文言、公開待ち表 | [Cレポート](../../docs/launch/REPORT.md)、[無料部](../../docs/launch/brain-free.md)、[購入済み本文](../../docs/launch/brain-paid.md)、[メール](../../docs/launch/mail)、[ガイド](../../docs/launch/guides) |
| B | Reactの画面、Workers/ローカルD1、仮想時計・Mock受信箱、承認/版管理・停止・例外処理、回帰テスト | [起動・試用手順](../../web/README.md)、[Bレポート](../../web/REPORT.md)、[接続準備](../../web/PROVIDER-SETUP.md)、[公開前チェック](../../web/PUBLISH-CHECKLIST.md) |
| 統合 | C原稿とB取込の一致確認、実ブラウザの一周、狭幅/実ズーム、独立レビューと修正確認 | [レビュー記録](REVIEW.md)、[原稿照合](logs/content-contract.json)、[ブラウザ](logs/browser-flow.json)、[画面回復](logs/ui-boundaries.json) |

製品ソースは`2b141f7c583d796e1ba75ad312c6ab199056c7de`、配布バイナリは0.4.4のままです。Aの大きな配布ファイルはA専用worktreeの`dist/delivery-0.4.4-A/{linux,windows}/`に保持しています。[全8ファイルとSHA一覧](../release-0.4.4-followup/delivery/upload-files.json)がGitにあります。今回ソースZIPや新しい配布物は作成していません。

## Branchとcommit

各担当は別worktreeを使用し、成果を統合branchへcherry-pickしました。表の担当commitは元branch、右端は統合branch上の対応commitです。

| Branch | 成果のcommit | 統合側 |
|---|---|---|
| `codex/task-a-release-review-20261022` | `3b0b9547f6895684bf4735d70af644ee164c7ddb`（修正`b64ac929`） | 共通基点 |
| `codex/task-c-launch-content-20261022` | `e513825ea7e9cf12467281954d83af293af23846` | `31b7c3159842ae5a55d2c9efdb61db938bb1728c` |
| `codex/task-b-mail-flow-20261022` | `3406b50bbefe8e7cd8eca66a7f5bebb86edcf202`（先行`448b6a3`・`22af32d`を含む） | `b7be31b`（先行`d3771be`・`b575425`を含む） |
| `codex/task-b-mail-docs-20261022` | `191cf99b95e676328c206db45a6cb3d0d907bdd2` | `8ff534b2af44567b6ce6789f21170ed47ad4e636` |
| `codex/abc-launch-preparation-20261022` | 上記全成果と、この統合レポート・追加証跡 | 実装/担当文書の確定点は`8ff534b2af44567b6ce6789f21170ed47ad4e636`。以降はroot案内・統合証跡のみ |

元checkoutとremoteのmainは`55d3b051935df80d24f988719b52a4937f2f559b`です。統合branchはmainへmergeしていません。検証対象のwebコードはB最終commitと一致し、C原稿も元commitのままです。private repo `garchomp-game/tsukuhako`へ担当branchと統合branchをpushして共有します。

## 動作と原稿の一致

任意の登録フォームは同意チェックなしから始まります。確認メールのGETは状態を変えず、本人のPOSTで初回3通の予定を作ります。確認直後、確認日の2/5日後19:00 JSTが初回の予定です。定期便は確認後7×24時間以上かつ初回未処理なし、号の承認と予約が必要です。初回と定期の合計はJSTの同一暦日1通までで、確認メールは別枠です。

Cの5原稿・2フッター・4公開ガイド・画面文言をBが直接取り込み、本文の二重管理を避けています。取込hashは`7e0ec65318e051e490c7c7fefe0afefe3e33f4db4030c0653e85f69b0b698cc7`です。welcome-01は公開の使い始めガイドへ進み、購入済みとは断定しません。購入者向け本文とOS別ダウンロード設定は、公開UIやメールへ取り込みません。

未設定のBrain等のリンクはクリックできない「設定待ち」になります。確認期限切れは新しい要求と新しいtokenで復旧します。学習メールの解除リンクはGETで画面を開き、POSTで未受付の予定を止めます。解除後の古い確認リンクでは再開しません。再登録には新しい同意・本人確認が必要です。

同時登録、重複/順不同イベント、停止直前の処理、旧revisionと新版の並行処理で見つかった7件を修正・再確認しました。[詳細](REVIEW.md)。全体停止で取り消した便は、再開や古い失敗結果で復活しません。本文・対象・リンク・フッター・参照ガイドの変更は承認を失効させます。受付不明は照合まで保留し、再送して成功扱いにはしません。

## 検証結果と限界

| 区分 | 結果 | 検証対象・証拠 |
|---|---|---|
| 既存A / FIXTURE・REAL_HOST | 6/6、Linux通常終了PASSを引継ぎ | Aで実施済み。終了code 0・signalなし・強制終了なし。[Aの記録](../release-0.4.4-followup/REPORT.md) |
| 既存CI | Windows Server 2022とUbuntu 24.04成功を引継ぎ | [run 39695492170](https://github.com/garchomp-game/tsukuhako/actions/runs/39695492170)。51件の自動試験はLinux jobの内訳。新しいWindows実機実績へ読み替えない |
| C / STATIC | 79/79 PASS | [原稿監査](../../docs/launch/evidence/content-audit.json)。確認済み仕様、変数、リンク、F2実ファイル、公開/購入済みの境界 |
| 統合 / STATIC | 26/26 PASS | [取込照合](logs/content-contract.json)。C原稿・設定・フッター・ガイド・画面文言とB取込が一致 |
| B / LOCAL_FIXTURE | 24/24 PASS | [最終回帰ログ](../../web/evidence/mail-tests.log)。JST計算1＋Miniflare/Workers/D1 fixture23。実宛先への送信ではない |
| 独立レビュー / FIXTURE | 7指摘解消、未解決なし | [レビュー](REVIEW.md)。実装担当とは別のメモリ内fixtureで再現・再確認。最後の3経路はB最終`3406b50`で確認 |
| 統合 / LOCAL_BROWSER_FIXTURE | 10グループPASS | [一周ログ](logs/browser-flow.json)。`b575425`時点で登録→HTMLメール→本人確認→予定→解除、期限切れ、狭幅、キーボード、実200% |
| 統合 / LOCAL_BROWSER_FIXTURE | 追加3グループPASS | [回復ログ](logs/ui-boundaries.json)。最終コード`b7be31b`で未設定リンク、通信503からの再試行、未処理例外なし |
| 型・静的ビルド・混入検査 | PASS | [Bログ](../../web/evidence/build.log)。統合でも既定のC取込先で成功。preview管理・有料DLキー・メール原稿等をdistから除外 |
| 本番出力拒否 | 期待どおりexit 1 | [ログ](../../web/evidence/release-gate.log)。8リンク・送信者2項目・draft・実adapterなし等で拒否 |
| ローカルの永続化・後片付け | PASS | Bの[起動停止](../../web/evidence/start-stop.log)、統合の[専用デスクトップ終了](logs/desktop-cleanup.json)。統合previewは最新launcherで再起動し架空状態を保持 |

ブラウザはChrome 155.0.8059.84、ローカルはNode 24.19.0です。画像は [360px](screenshots/mail-360.png)、[Chrome実200%](screenshots/mail-browser-200.png)、[予定一覧](screenshots/reader-schedule.png)、[期限切れ](screenshots/expired-confirmation.png)。200%はCSS擬似拡大ではなく実ブラウザ操作で、横幅635 CSS px・DPR 2・横はみ出しなしを確認しました。[記録](logs/browser-zoom.json)。画像4枚を目視確認しています。

各担当の成果と統合側の内容一致、統合ビルド、mainの不変、文書内の相対リンク132件とJSONも確認しました。[統合確認の記録](logs/integration-checks.json)。

通し試験後の変更は停止/版の競合処理と画面の設定待ち等です。最終版では対応する自動試験・独立fixture・追加UI確認を行い、無関係なAの製品試験は繰り返していません。異なる分類を合算して「全OS・本番で全件成功」とは扱いません。既存workflowは手動起動だけであり、今回のbranch pushで新しいDesktop CIは実行しません。B/Cの検証は今回ローカルで実施しました。

## ローカルで確認する

統合worktreeは `/home/garchomp-game/workspace/meikyo/tsukuhako-abc-launch-20261022` です。このセッション終了時は [運営試用](http://127.0.0.1:5183/preview) と [登録画面](http://127.0.0.1:5183/mail) を起動しています。DBには解除済み1人・購読中1人の架空読者だけがあり、仮想時計は2026-10-23 19:00:01 JSTです。Mock受信箱や既存予定をそのまま確認できます。実時計の配信は走りません。

新しいcheckoutでは、統合branchを選び、リポジトリ直下から次を実行します。

```sh
npm ci --prefix web
cd web
npm run dev
```

既定は`http://127.0.0.1:5173/preview`です。架空アドレスは `reader@example.test` 等を使います。仮想時計の進め方、初回0/2/5日・定期7日・予約後解除の順序、再送、再起動、試用DBの退避は [README](../../web/README.md) にまとめています。`.env` をコピーするだけでdev用ポート等が設定されるとは扱わず、必要な値は起動時の環境変数で渡します。

## 未確認事項と、本人が次に行うこと

1. **ローカルの一周と原稿を読む。** 上のpreviewとCのBrain本文で、伝え方・提供物・任意購読の扱いを確認する。
2. **販売条件を決める。** 価格、開始日、提供OS、利用/返金条件、サポート・更新範囲、窓口を確定する。Windows 11通常ユーザー・実WSL/F2/S2はNOT_RUNなので、[Win11記録票](../release-0.4.4-followup/WINDOWS-TRIAL.md)で確認するか初回の提供範囲を限定する。
3. **受取方法と公開先を決める。** 購入者用保管先、アクセス方式、期限/再取得、本番のガイド・登録・問い合わせ・プライバシーURL、送信者を確定する。一般購入者の権限で取得→SHA照合→起動する試験は未実施。
4. **本番に進む際の範囲を指定する。** Resend等の利用可否/費用、DNS認証、本番adapter、運営認証、署名webhook、保持/削除、許可した実宛先での到達・解除・停止試験が別途必要。[接続準備](../../web/PROVIDER-SETUP.md)の順に進める。

本番Brain画面、購入者権限の実取得、Win11実機、実メールの到達/見た目/解除、provider署名・アカウント権限・料金、DNS認証は**NOT_RUN**です。ローカルのacceptedはMock受付で、配信到達の証拠ではありません。現実装には実メールadapterがなく、APIキーを足すだけで送信へ切り替わる機能はありません。

未確定事項があっても進められる草稿・mock・統合検証は完了しています。
