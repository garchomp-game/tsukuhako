# 担当C：販売原稿と学習メールの準備結果

2026-10-22。**本文・ガイド・画面文言・メール5本の草稿を完成し、Aの確認済み仕様へ合わせました。すべて公開前で、メール原稿はdraftです。** 原稿完成は販売公開・実配信の承認ではありません。

担当branch：`codex/task-c-launch-content-20261022`。Aの完了commit `3b0b9547f6895684bf4735d70af644ee164c7ddb` を基点に、専用worktreeの `docs/launch/` だけを編集しています。commitの確定値は統合レポートへ引き継ぎます。

## 成果物と掲載範囲

| 成果物 | 読み手・用途 |
|---|---|
| [brain-free.md](brain-free.md) | Brain無料部の本文素材。悩み、提供物、6構成、前提、確認範囲。販売条件を追加してから公開 |
| [brain-paid.md](brain-paid.md) | Brain購入済み本文専用。OS別の4点受取→START_HERE.txt→生成先START_HERE.md→任意登録 |
| [guides/start.md](guides/start.md) | 公開の使い始めガイド。購入済みの場合だけBrain受取へ案内。スマホからPCへ戻る入口 |
| [guides/setup-check.md](guides/setup-check.md) | F2を例に、準備の正常終了と失敗時の戻り先を確認 |
| [guides/first-change.md](guides/first-change.md) | 同梱F2と一致する見出し変更・復元。別構成へ一般化しない |
| [guides/one-less-step.md](guides/one-less-step.md) | 生成時の設定を二重入力しない工夫。定期便001の行き先 |
| [screen-copy.json](screen-copy.json) / [registration-copy.md](registration-copy.md) | Bへ渡す登録・確認・期限切れ・未着・解除の文言。JSONが表示文言の正本、Markdownは制作向けの状態説明 |
| [mail/](mail) | 確認1通・初回3通・定期便1通と共通署名fragment |
| [LINKS.example.json](LINKS.example.json) | 公開用8リンクキー。URLは全てnull、ローカルパスと用途のみ |
| [PRIVATE-LINKS.example.json](PRIVATE-LINKS.example.json) | 購入済み本文だけのLinux/Windows受取先。空値のみ。公開/メールへ読み込まない |
| [CONTENT-MANIFEST.json](CONTENT-MANIFEST.json) | 公開本文allowlist、非公開本文、メール/フッター、予約変数の一覧 |
| [FACT-CHECK.md](FACT-CHECK.md) / [PUBLISH-CHECKLIST.md](PUBLISH-CHECKLIST.md) | 編集用の出典・未確認・公開前の判断項目。読者向け本文へ含めない |

価格や本番URLの仮値は作っていません。販売条件、Windows提供範囲、受取期限・再取得方法などは公開前チェックへ集めています。brain-paidの候補OS表は、非提供OSを除き、実受取リンクを設定してから使用します。

## Bへ渡す原稿の契約

各メールは通常のYAML frontmatter付きMarkdownで、`id/type/revision/status/subject/audience/links/sourceRefs` を持ちます。初版は全て `revision: 1` / `status: draft`。`links` と `sourceRefs` は配列です。文面に固定URLや受信者tokenを埋めていません。

| 原稿ID | type / audience | 主リンク | 配送の条件（初期設定案） |
|---|---|---|---|
| [confirm](mail/confirm.md) | transactional / confirmation_requested | confirmUrl | 登録要求を受けた宛先。購読前。連打・再送制限を別に適用 |
| [welcome-01](mail/welcome-01.md) | step / subscribed | startGuide | メール確認＋同意直後、step=1を一度だけ |
| [welcome-02](mail/welcome-02.md) | step / subscribed | setupGuide | 確認日の2日後19:00、Asia/Tokyo、step=2 |
| [welcome-03](mail/welcome-03.md) | step / subscribed | exerciseGuide | 確認日の5日後19:00、Asia/Tokyo、step=3 |
| [broadcast-001](mail/broadcast-001.md) | broadcast / subscribed_after_intro | updateNotes | 確認後7×24時間以上、初回未送信分なし、号の確認済み、配信日未予約 |

確認メールには [transactional-footer.md](mail/transactional-footer.md)、学習/定期の4通には [footer.md](mail/footer.md) を一度だけ付けます。前者は送信者/窓口、後者は送信者/窓口/解除です。本文5本に署名を重複貼付していません。

予約変数は `{{links.KEY}}` と `{{confirmUrl}}` / `{{unsubscribeUrl}}` / `{{confirmationExpiresAtJST}}` / `{{senderName}}` / `{{senderContact}}` だけです。固定リンクのnullはローカルで「設定待ち」と表示し、本番書き出しでは拒否します。確認/解除URLと有効期限はBが受信者別に生成します。

学習と定期の合計はJSTの同一暦日1通まで。予約時と処理時に購読・抑止・間隔を確認し、解除や期限超過の古い便をまとめて送らない設計です。確認メールはこの上限と分離します。日付・対象条件は本文へ焼き込まず、Bの設定とテストで扱います。

`audience` は購入確認の状態ではありません。welcome-01は受取済みや購入済みを断定せず、公開startGuideへ進みます。ガイド内で、購入済みの場合にBrain購入済み本文を開く説明をしています。未購入の購読者にも意味が通り、有料配布リンクは開示しません。

承認対象は件名・本文・対象・リンク設定・フッター・対応ガイドの版です。変更後は古い承認を失効させます。このC作業は本番のreviewed/activeへの移行を実施していません。

## 検証と記録

- **STATIC：** ZIP00〜08、AGENTS、指定レポート、A事実表/採用配布案内、README、F2同梱教材、テンプレート実ファイル、生成コア、既存0.4.4生成先START_HEREを読んで照合。[FACT-CHECK](FACT-CHECK.md)に記述ごとの根拠を記録。
- **STATIC：** 購入前→購入後→任意登録→確認→初回3通→定期便→解除の順で全原稿を読了。購入へのお礼は購入済み本文だけ。6構成/S3、OS確認範囲、オフライン閲覧と初回ネット、共通フッター、未解決変数を確認。
- **STATIC：** [validate-content.mjs](validate-content.mjs) で必須ファイル、frontmatter、各メールのリンク宣言、許可変数、公開/非公開分離、同意初期値、相対リンク、実テンプレートと練習文の一致を検査。**79/79項目がPASS**。[機械監査結果](evidence/content-audit.json)を保存。
- **NOT_RUN：** 本番Brain画面、一般購入者の取得、本番URL、実メール到達、配信サービスの契約/課金/停止連携、Win11実機。Bとの画面統合確認は統合担当の記録へ分離。

再検査コマンド（リポジトリ直下、追加依存なし）：

```sh
node docs/launch/validate-content.mjs
git diff --check
```

この機械検査は表現の全意味を保証するものではないため、出典照合と通読を併用しています。アプリ/Docker/Windows/過去CIの成功試験は繰り返していません。新しい製品の実機実績や学習効果は増えたと扱いません。

## 未確認事項と次の判断

1. 本人が価格・販売日・提供OS・利用/返金条件・更新/サポート・窓口を決め、購入前の販売条件欄を完成させる。
2. 一般購入者の受取先、期限/再取得方法、アクセス方式を決め、Aの受取人試験とWindows実機/提供範囲の判断を行う。
3. 本番の公開ガイド・登録・問い合わせ・プライバシーURLと送信者を設定する。
4. Bのローカル試作で、画面・メール・行き先・解除と原稿の条件を照合する。その結果は統合レポートへまとめる。
5. 本番に進むときは、未解決設定・未承認版をなくし、Brain実画面と配信サービスで別途確認する。

原稿制作のためのA更新待ちはありません。公開・実メール送信・課金・mainへの統合は行っていません。
