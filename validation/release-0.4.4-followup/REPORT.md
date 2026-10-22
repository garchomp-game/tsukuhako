# 担当A：0.4.4最終レビューと限定修正

| 判断 | 結論 |
|---|---|
| アプリ修正済みか | 今回、新たに断定できるP0/P1の製品不具合は見つからず、本体は変更していない。通常終了の**検証コード**と受取案内を修正済み |
| 公開できるか | 配布候補と採用する4点セットは整合。一般購入者の取得経路・権限試験・販売条件が残り、販売公開可能とは判断しない |
| Windows利用確認済みか | 既存Server 2022 CIの範囲は確認済み。Win11通常ユーザー・実WSL/F2/S2はNOT_RUNを維持 |

2026-10-22。担当branch **`codex/task-a-release-review-20261022`**。開始時のorigin/mainは指定証跡 `55d3b051935df80d24f988719b52a4937f2f559b` と同一で、固定版との差はありませんでした。[作業範囲とmainの確認](logs/scope.json)。専用worktreeで作業し、main、root README/REPORT、web/、docs/launch/、過去証跡は編集していません。

**修正commit：[`b64ac929041f30c25c0977c30189dc2d63fd9438`](https://github.com/garchomp-game/tsukuhako/commit/b64ac929041f30c25c0977c30189dc2d63fd9438)**。製品ソースは従来どおり `2b141f7c583d796e1ba75ad312c6ab199056c7de`。本体の版上げ・全OS再ビルド・新しいCI起動は行っていません。以下の実機追加試験は、ハッシュを再確認した従来0.4.4バイナリの終了を、新しい検証コードで観測したものです。

## 発見事項と対応

| ID / 優先度 | ファイル・根拠 | 影響・対応 |
|---|---|---|
| A-01 / P3 検証 | [verify-reader-044.mjs](../../tools/verify-reader-044.mjs) の通常起動終了待ちが終了要求後にlistenerを登録し、code/signalを判定しなかった | 異常終了をPASSにする余地。要求前に登録、code 0かつsignalなしのみ成功、早期終了/timeout/要求失敗を区別。timeoutは所有ChildProcessだけSIGTERM→必要時SIGKILL。実際の製品クラッシュがあったという指摘ではない |
| A-02 / 配布整合 | 旧Linux最終パックにはCI後の実機結果が追補され、CIパックと小さい3ファイルが異なる | [照合ログ](logs/artifact-audit.json)でバイナリ同一を確認。旧最終案内を基準にA版を一意に採用。案内からActions固有の説明を外し、採用revision追記とSHA再生成 |
| A-03 / 表示整合 | catalogのsupportingTools=0.3.0、過去validationScope/notRun、notYetImplementedのWindows native GUI表記は歴史的な値 | packageVersionだけで全情報が0.4.4検証済みとはいえない。既存catalogを一括書換えせず、C担当用[商品事実](PRODUCT-FACTS.md)に版別の根拠と使用範囲を整理 |
| A-04 / 販売前条件 | private Actions、未設定の受取URL、Win11実機、価格/窓口/サポート等 | [配布チェックリスト](DELIVERY-CHECKLIST.md)と[Win11記録票](WINDOWS-TRIAL.md)へ分離。公開・配信・新規契約・権限変更は実行していない |

レビューでは、指定版のReaderの非同期読込・フォーカス/非表示領域・scroll保存、mainのsandbox/終了処理、Windows installed smokeと失敗伝播、配布スクリプト/manifest、版別証跡と画像、実配布ファイルを照合しました。この範囲で別の確実な製品不具合は見つかっていません。アプリ全体の無欠陥や一般販売可の保証ではありません。

## 今回の検証

| 試験 | 結果 | 種類・証拠 |
|---|---|---|
| 正常・非zero・signal・終了済み・timeout・終了要求失敗 | 6/6 PASS。timeoutでは別の子プロセスが生存。失敗条件を成功にしない | FIXTURE。[テスト](../../tools/tests/owned-process-exit.test.mjs) / [実行ログ](logs/process-exit-tests.log) |
| 最終Linux通常起動→ウィンドウ終了 | PASS。新規専用profile、引数なし、CWD /tmp。**exitCode=0、signal=null、timeout=false、強制終了なし** | REAL_HOST。[ログ](logs/normal-exit.json) / [起動画面](screenshots/A-normal-launch.png) / [後片付け](logs/cleanup.json) |
| 製品SHA/サイズ/CI ZIP/案内の一致 | PASS。ローカル実ファイルと既取得CI ZIPを再ハッシュし、現在のAPI digestと照合 | STATIC。[比較](logs/artifact-audit.json) |
| 採用A版4点セットの別パス照合 | 両OS PASS。日本語/空白パス、3チェックサム、Linuxの120ファイル/教材50章/7テンプレート/helper46ファイル | STATIC。[Linux](logs/linux-delivery.json) / [Windows](logs/windows-delivery.json) |
| 指定CIの状態・ソース | 既存run #39695492170の両job SUCCESSと製品SHA一致をAPIで再確認 | CIの既存結果の再照合。[run](logs/ci-run-observed.json) / [artifact](logs/ci-artifacts-observed.json) |
| Win11実機・一般購入者の取得 | NOT_RUN。利用可能なWin11通常ユーザー実機と、設定済み購入者受取先がない | [記録票](WINDOWS-TRIAL.md) / [受取人試験](DELIVERY-CHECKLIST.md) |

正常終了の判定はNodeのexit code/signalを区別しています。[Node v24公式資料](https://github.com/nodejs/node/blob/v24.x/doc/api/child_process.md#event-exit)。実行はNode 24.19.0、Mint 22.3 x64。今回の新規6件を、既存CIの51件やReader 11グループへ足して「全経路を再試験した」とは扱いません。UI・生成コアは無変更なので、既存PASSのF2完走・狭幅/200%等は再実行していません。

## 採用配布物とB/Cへの成果

製品ファイルは次のままで、案内revisionだけを **2026-10-22-A** にしています。

| ファイル | bytes | SHA-256 |
|---|---:|---|
| tsukuhako-linux-x64-0.4.4.tar.gz | 168272243 | `deace519c6ac6cb7a91de304491edd6a0676995eb386fa0be93fb541f43430b4` |
| tsukuhako-windows-x64-0.4.4-setup.exe | 144935062 | `a5e2cd8fbfc80815e1cd87b5eefc5af1bc873e35ecfcc81762462617266bd103` |

- **C担当向け：** [PRODUCT-FACTS](PRODUCT-FACTS.md)。引用可能な12項目、6構成の名前と版、未確認範囲、言ってはいけない保証を根拠付きで整理。
- **受取準備：** [DELIVERY-CHECKLIST](DELIVERY-CHECKLIST.md)。Brain購入済み本文へ渡す手順案、R2等への配置順、受取人試験。[全8ファイルの配置一覧とSHA](delivery/upload-files.json)。実URLは未設定。
- **協力者向け：** [Win11の短い手順と記録票](WINDOWS-TRIAL.md)。既定APPDATA/WSL/DBの保持を別々に記録。
- **統合担当向け：** [INTEGRATION](INTEGRATION.md)。rootへの[提案差分](ROOT-DOCS.patch)は未適用。mainへ自動統合しない。

大きな製品ファイルはこの専用worktreeの `dist/delivery-0.4.4-A/<OS>/` に置いています。Git内のdelivery/には小さい案内/manifest/SHAだけがあります。既存private CIは制作側の取得先で、一般購入者へ案内するURLではありません。

## 次に本人が決めること

1. 購入者向け保管先とアクセス方式・再取得期限・窓口を決め、購入者の権限で取得試験を行う。
2. Windowsを実機確認してから提供するか、初回の提供範囲を限定するか決める。
3. 価格・販売開始日・利用/返金条件・更新/サポート期間を確定し、B/Cの原稿と導線を統合する。

製品修正・検証ツール修正・販売公開条件を混同せず、今回Aで独立して進められる範囲は完了しています。
