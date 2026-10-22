# 採用する配布セットと受取人試験：公開待ち

**状態：ローカルの採用セット確定。公開ストレージへの配置・購入者権限での受取はNOT_RUN。** 2026-10-22、担当A。バケット・実URL・購入者アクセス方式は未設定です。

## 採用版を一つにする

今回以降のアップロード元はこのworktreeの `dist/delivery-0.4.4-A/linux/` または `dist/delivery-0.4.4-A/windows/`。案内revisionは **2026-10-22-A**（manifestのdeliveryReview）。片方のOSの4ファイルを同じセットとして使います。

- 製品バイナリは両OSともCI #39695492170 / source `2b141f7c583d796e1ba75ad312c6ab199056c7de` と同一。
- Linuxは、Mint実機結果を追記した従来の最終ローカル案内/manifestを採用。CI時点の案内を一般配布には使いません。
- Windowsは従来の最終案内/manifestを基準に採用。
- 両OSの受取案内からGitHub Actions固有の説明を外しました。制作者の取得手順と購入者の受取手順を分けています。
- 両manifestへ今回の採用revision/レビュー参照を追記し、SHA256SUMSを再生成しました。旧4点セットと混ぜません。旧証跡や旧パックは変更していません。

既存CI→旧最終Linuxで変わっていたのはSTART_HERE.txt・manifest.json・SHA256SUMSの3件で、manifest差はruntimeVerification追補です。Windowsにはその差がありませんでした。[今回再計算した比較](logs/artifact-audit.json)。今回A版の小さい3ファイルは [Linux](delivery/linux/manifest.json) / [Windows](delivery/windows/manifest.json) と同じ内容をGitに保存しています。製品本体はGitにありません。

## 配置するファイル

| OS | 製品 | bytes | 製品SHA-256 |
|---|---|---:|---|
| Linux x64 | tsukuhako-linux-x64-0.4.4.tar.gz | 168272243 | `deace519c6ac6cb7a91de304491edd6a0676995eb386fa0be93fb541f43430b4` |
| Windows x64 | tsukuhako-windows-x64-0.4.4-setup.exe | 144935062 | `a5e2cd8fbfc80815e1cd87b5eefc5af1bc873e35ecfcc81762462617266bd103` |

各OSで上の製品1件に `START_HERE.txt`、`manifest.json`、`SHA256SUMS` を加えた4件です。**全8ファイルのサイズ・SHA・ローカル相対パス・object key案は [upload-files.json](delivery/upload-files.json)** に確定値を記録しました。keyは `tsukuhako/0.4.4/2026-10-22-A/<OS>/<ファイル名>` の案で、R2への作成済みキーや公開URLではありません。

日本語/空白を含む別の受取先へコピーして全チェックサムを再検査し、Linuxはtar展開・同梱資材も照合済みです。[Linux STATIC](logs/linux-delivery.json) / [Windows STATIC](logs/windows-delivery.json)。Windows exeのLinux上での起動試験ではありません。

## 制作側の配置手順（まだ実行しない）

1. 配布先の所有アカウント、バケット、受取人に必要な権限、署名URL等を使う場合の有効期限/再取得方法、容量・費用を決める。現時点でR2の設定・契約条件は確認していません。
2. upload-files.jsonと採用版4ファイルを照合する。案内やmanifestを編集した場合は、そのOSのSHA256SUMSとupload-files.jsonも再生成し、revisionを更新する。
3. 決定した保管先へOS別に4ファイルを配置する。バイナリの再ビルドや全OS一括ZIPは不要。フォルダを取得しやすくする包装が必要なら、その仕様と外箱ハッシュを別に記録し、製品を二重に入れない。
4. 配布サービスから取得したファイルをSHA-256で再照合する。objectのETagだけを製品SHAとして扱わない。
5. 決定した受取人の権限で下の試験を実行する。制作者のログイン・gh認証を流用しない。実URLと期限を購入済み本文へ反映し、制作者向けメモを削除して公開版を確認する。

制作側の元バイナリは [既存private CI](https://github.com/garchomp-game/tsukuhako/actions/runs/39695492170) から取得できますが、これは購入者用リンクではありません。GitHub read権限が必要で、現時点のAPI期限はLinuxが2026-11-05 08:47:07 JST、Windowsが同08:49:43 JST。[API記録](logs/ci-artifacts-observed.json)。削除・権限変更でそれ以前に取得できなくなる場合があります。再構成する場合も、CIの古い案内ではなく、このA版3ファイルと一致するバイナリを組み合わせてください。

## Brain購入済み本文へ渡す受取手順案

以下は配布先・提供OS・窓口の確定後に使う本文案です。リンク未設定のまま公開しません。

> 使うPCでBrainの購入済み記事を開き、PCに合うOSの受取先へ進んでください。Linux x64とWindows x64の提供範囲は購入前の説明をご確認ください。
>
> 受取セットの4ファイルを同じフォルダに保存し、最初にSTART_HERE.txtを開いてください。Linuxはtar.gzを展開し、中のtsukuhako実行ファイルを起動します。Windowsは未署名のexeです。OS保護を無効化せず、警告で止まった場合は内容を記録して案内された窓口へ確認してください。
>
> 開発準備と生成を進めた後は、生成先のSTART_HERE.mdが、そのプロジェクトの保存先・ポート・最初の変更/復元を案内します。メール登録は任意で、受取条件ではありません。

制作側が挿入する値：Linux受取先＝未設定、Windows受取先＝未設定、受取期限/再取得方法＝未設定、問い合わせ先＝未設定。Windowsを初回提供しない判断なら該当行を掲載しません。B/C担当のURLを推測して埋めないでください。

## 受取人試験・記録欄

| 確認 | 記入欄（初期値NOT_RUN） |
|---|---|
| 日時・OS/CPU・担当者識別名 | 未実施。実名やメールアドレスをこのrepoへ書かない |
| 購入済み本文から受取先へ到達 | NOT_RUN／実URLは非公開記録へ |
| 制作者のGitHub認証なしで取得 | NOT_RUN／必要アカウント・権限を記録 |
| OS別4ファイルの取得 | NOT_RUN／名前・サイズ・案内revision |
| SHA256SUMSの3項目が一致 | NOT_RUN／Linuxは `sha256sum -c SHA256SUMS`、Windowsは下のPowerShell |
| Linux展開/通常起動、またはWindows導入/通常起動 | NOT_RUN／警告と停止箇所 |
| 教材の最初の一歩へ到達 | NOT_RUN |
| リンク期限と再取得 | NOT_RUN／期限がない場合は確認した設定を記録 |
| メール登録/解除と無関係に再取得 | NOT_RUN |

PowerShellで受取フォルダを開き、3項目を照合します。

```powershell
Get-Content .\SHA256SUMS | ForEach-Object {
  $expected, $name = $_ -split '  ', 2
  $actual = (Get-FileHash -LiteralPath (Join-Path (Get-Location) $name) -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($actual -ne $expected) { throw "SHA256 differs: $name" }
  "OK $name"
}
```

本人確認や購入権限を、メール購読済みだけで成立させないでください。一般配布先が未設定の現段階では、購入者の受取が完了したとは結論づけません。
