# 担当Aの統合メモ

branch：`codex/task-a-release-review-20261022`。基点：`55d3b051935df80d24f988719b52a4937f2f559b`。検証/配布ツールの修正commit：`b64ac929041f30c25c0977c30189dc2d63fd9438`。REPORTと追加証跡は後続commitです。

担当範囲はtools/の限定修正とvalidation/release-0.4.4-followup/。既存製品ソース・web/・docs/launch/・root README/REPORT・過去証跡は無変更。mainへの統合はしていません。

統合担当はbranch差分を確認し、Aの[商品事実](PRODUCT-FACTS.md)をCへ、採用配布セットのファイル名/用途をB/Cへ反映してください。メール本文や公開サイトへ購入者用ダウンロードURLを自動コピーしない方針です。AはB/Cの実装・原稿を書き換えていません。

[ROOT-DOCS.patch](ROOT-DOCS.patch)はroot README/REPORTへ追補レポートの入口を加える**提案差分**です。`git apply --unidiff-zero --check`で適用可能性のみ確認しています。B/Cとの最終統合後に担当者が必要な案内へ調整してください。

## 実行した主な検証コマンド

専用worktreeのルートで実行。Node 24.19.0。GUI用のtools依存は既存の同じlockfileのnode_modulesを一時参照し、終了後にリンクを除去しました。再現時は `npm ci --prefix tools` で用意できます。OSパッケージの変更は不要でした。

```sh
node --test tools/tests/owned-process-exit.test.mjs
node --check tools/verify-reader-044.mjs
node tools/verify-delivery-044.mjs dist/delivery-0.4.4-A/linux linux
node tools/verify-delivery-044.mjs dist/delivery-0.4.4-A/windows windows
```

実機の終了試験は新しい専用Xephyr desktopを `tools/onboarding-desktop.sh` で起動し、tar.gzを日本語/空白の別パスへ展開して実行しました。ONBOARDING_OUTはこの追補のruns/normal-capture、TSUKUHAKO_EXECUTABLEはその展開先の実ファイルです。

```sh
ONBOARDING_OUT="$PWD/validation/release-0.4.4-followup/runs/normal-capture" \
TSUKUHAKO_EXECUTABLE="$PWD/validation/release-0.4.4-followup/runs/normal-capture/runs/受取物 日本語/tsukuhako-linux-x64-0.4.4/tsukuhako" \
node tools/verify-reader-044.mjs --normal-only
```

再試験時は新しいcaptureディレクトリを使ってください。過去の記録を上書きしません。`--normal-only`は通常起動と終了判定だけを行い、Reader全経路の再実行には使いません。今回の通常終了はcode 0/signalなしで、強制cleanupを使っていません。

## 採用パックを再構成する場合

製品ソースの再ビルドは不要です。REPORTのSHAと一致する製品を各OSの空のフォルダへコピーし、このbranchの `validation/release-0.4.4-followup/delivery/<OS>/` にある小さい3ファイルを合わせて4点セットにします。`verify-delivery-044.mjs`で版・名前・ハッシュを照合してください。新旧案内の混在を避けます。

入力ZIPはgit対象外のruns/handoffへ展開しました。個人設定・実行依存・バイナリ・生ログはGitへ追加しません。CI/受取物の照合は既存ダウンロードを再ハッシュしたもので、新たな購入者ダウンロード実績ではありません。
