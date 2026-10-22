# 原稿の事実確認

2026-10-22 / 担当C。対象は製品0.4.4、製品ソース `2b141f7c583d796e1ba75ad312c6ab199056c7de`、既存証跡 `55d3b051935df80d24f988719b52a4937f2f559b`、A追補 `3b0b9547f6895684bf4735d70af644ee164c7ddb`。新しい実機試験は行わず、既存の確認範囲を本文に反映しました。このファイルは編集用で、公開本文に含めません。

主な根拠は [Aの商品事実PF-01〜12](../../validation/release-0.4.4-followup/PRODUCT-FACTS.md)、[Aレポート](../../validation/release-0.4.4-followup/REPORT.md)、[採用配布セット](../../validation/release-0.4.4-followup/DELIVERY-CHECKLIST.md) です。

| 記述・原稿 | 根拠 | 判定と制限 |
|---|---|---|
| 独自の学習用開発環境生成アプリ | PF-01、[desktop README](../../generator-desktop/README.md) | STATIC。明鏡の文章・ブランドを商品本文に転用していない |
| 6構成を生成、S3は参考資料 | PF-03、[catalog](../../catalog.json) のgeneratorEligible | STATIC。brain-freeの6行はF1/F2/B1/S1/S2/I1。S3を生成対象に数えていない |
| 教材50章 | PF-04、[教材manifest](../../curriculum/manifest.json)、[A同梱照合](../../validation/release-0.4.4-followup/logs/linux-delivery.json) | STATIC。収録数のみ。学習効果・全章完走の実績にしていない |
| 閲覧/生成はアカウント・PC側Node・ネット不要 | PF-05、[開発準備の全体像](../../curriculum/setup/overview.md) | 仕様/STATIC。初回の開発環境構築はDocker・VS Code等とネットが必要。完全オフライン開発とは書かない |
| Linux 0.4.4でF2の起動・変更・復元・再開 | PF-06、[Linux記録](../../validation/release-0.4.4/LINUX.md) | 既存REAL_HOST。Mint 22.3 x64の既存環境。全Linux/初めてのPC/全6構成の0.4.4試験へ広げない |
| Windowsの補助確認 | PF-08/09、[Windows記録](../../validation/release-0.4.4/WINDOWS.md) | 既存CI。Server 2022、管理者トークン、未署名。Win11通常ユーザー、実WSL/F2/S2、既定APPDATA/DB保持はNOT_RUN |
| 対象外 | PF-10、desktop README | macOS/ARM、自動更新を提供に含めない。Mac教材の存在をMac版としない |
| OS別の4ファイルと入口 | PF-11、[Linux案内](../../validation/release-0.4.4-followup/delivery/linux/START_HERE.txt)、[Windows案内](../../validation/release-0.4.4-followup/delivery/windows/START_HERE.txt) | STATIC。案内revision2026-10-22-A。一般購入者の取得試験はNOT_RUN。private Actionsを購入者へ案内しない |
| ハッシュの説明 | AのSHA照合はファイル一致の確認 | 発行者認証が保証されるとは説明しない。brain-paidで区別 |
| F2の「準備完了」＋初期構成正常終了を待つ | [F2最初の一歩](../../curriculum/F2/first.md)、[共有next-steps](../../generator/src/core/next-steps.mjs) | STATIC＋既存REAL_HOST。setup-checkは接続表示だけで開始しない。処理中のnpm ci重複を勧めない |
| F2のapp/page.tsxの見出し変更/復元 | [F2実ファイル](../../starter-templates/F2/app/page.tsx)、[F2練習](../../curriculum/F2/exercises.md)、[既存実機の変更結果](../../validation/release-0.4.4/logs/F2-exercise.json) | STATIC＋既存REAL_HOST。h1/classNameを残し内側のみ変更。別構成やDBへ同じ操作を適用しない |
| 生成時に.envを作成し設定をSTART_HEREへ渡す | [apply](../../generator/src/core/apply.mjs)、[configuration](../../generator/src/core/configuration.mjs)、[next-steps](../../generator/src/core/next-steps.mjs) | STATIC。one-less-stepの記事。生成後の手動編集でSTART_HEREが自動更新されるとは書かない |
| 原作者の動機 | 提供ZIP `06-TASK-C-CONTENT.md` の確認済み発言 | ユーザー提供の記述。環境構築を好きで続ける、同じ準備を減らしたい、という範囲。職歴・私生活・効果・実績を追加していない |
| メールは登録へのお礼 | 提供ZIP02/03/06/08 | 購入認証なし。welcome-01を公開startGuideに変更し、購入済みの場合のみBrainの受取へ。確認メールへ販売リンクを入れていない |
| 登録と受取は独立 | 提供ZIP02/03 | 任意登録・解除後も購入済み商品の受取を妨げない。公開ガイド・メールへ有料受取先を含めない |

教材・生成コードだけでなく、既存0.4.4実機試験が生成した `START_HERE.md` も読み、保存先・選んだポート・準備完了の順番を照合しました。既存フォルダを読むだけで、生成やDocker起動をやり直していません。旧0.4.2の生成例は履歴として区別し、0.4.4で加わった初期構成の正常終了待ちは現行コードと教材を基準にしています。

## sourceRefsの読み方

- `PRODUCT-FACTS@3b0b954...#PF-xx` はA追補の商品事実IDです。ブラウザの見出しアンカーではありません。
- `path@2b141f7...` は製品commitのファイルです。現在の教材・生成コアはその製品と同じものを参照しています。
- `docs/launch/...` は今回の原稿・行き先記事です。本文とともに承認する対象です。
- `handoff/...` は、ユーザー提供の `tsukuhako-codex-handoff-2026-10-22.zip` 内の原稿・要求資料です。外部の公開URLではありません。[Aの入力記録](../../validation/release-0.4.4-followup/logs/scope.json)も参照できます。

## 表現と導線の監査

購入前→購入後→任意登録→確認→初回3通→定期便→解除の順で原稿を読みました。購入済み本文だけに購入へのお礼を置き、メールは登録へのお礼です。どのメールも受講完了や進捗を推測しません。各メールの主なリンクは一つ、連絡先・解除は共通フッターです。

「7構成すべて生成」「Windows実機確認済み」「全PC保証」「インストールだけで準備不要」「永久無料更新」「無期限/無制限サポート」「購入直後に自動キー発行」、架空の購入者の声・短縮時間・販売実績・期間限定施策は入れていません。

初回19:00はメールシステムの設定として管理し、本文へ固定日付を焼き込みません。確認メールは事務的な確認のみ。0/2/5日・定期便7×24時間・初回未送信除外・同一JST日1通のルールは、[原稿引継ぎ](REPORT.md)に条件をまとめ、Bの試験で実装を確認します。

## Aからの更新待ちと未確認

Aの作業待ちはありません。完了済みAの確認範囲を反映しました。将来Win11実機や受取人試験の結果が増えた場合は、先にA側の事実表を更新し、この表と本文・メールを再確認して新revisionにします。

価格、販売開始日、提供OS、利用/返金条件、サポート/更新、連絡先、URLは未確定です。[公開前チェック](PUBLISH-CHECKLIST.md)へまとめています。Bの画面との統合検証・実メール到達・Brain実画面での掲載はC単体では未実施であり、原稿完成を公開/配信承認として扱いません。
