---
id: confirm
type: transactional
revision: 1
status: draft
subject: ツクハコのメール登録を確認してください
audience: confirmation_requested
links: []
sourceRefs:
  - handoff/02-REQUIREMENTS.md#初期配信ルール
  - handoff/03-BASIC-DESIGN.md#API契約案
  - handoff/08-MAIL-DRAFTS.md#登録確認メール
---

ツクハコのメール登録のお申し込みを受け付けました。

ご自身で申し込まれた場合は、次のページを開き、「登録を確定する」を押してください。

[メール登録の確認ページを開く]({{confirmUrl}})

確認リンクの有効期限は **{{confirmationExpiresAtJST}}** です。

確認後、使い始めるための案内を初回3通、その後は週1回程度お送りします。配信をお休みする週もあります。

お申し込みに心当たりがない場合は、操作せずにこのメールを閉じてください。確認ページを開くだけでは登録は確定しません。確認しない限り、学習メールの配信は始まりません。
