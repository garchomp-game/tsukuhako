# ツクハコ 0.4.3 — Windows/Linux初回配布準備

2026-10-21 JST。Windows x64 NSISとLinux x64 tar.gzを作成し、privateリポジトリへソース・設定・教材・小さな証跡をpushしました。一般公開・販売・自動更新は行っていません。

製品は [5bcd435a44ded8de2f19f3e2de5b7861e16ef90f](https://github.com/garchomp-game/tsukuhako/commit/5bcd435a44ded8de2f19f3e2de5b7861e16ef90f)。この後のレポート・画像・取得ツール追加はエビデンス側のcommitで、製品バイナリはこの製品commitから変更していません。

| 到達点 | Windows | Linux |
|---|---|---|
| 配布物の作成・内容検査 | PASS / CI＋取得後の内容検査 | PASS / CI＋取得後の内容検査 |
| そのOSでの通常起動 | NOT_RUN | PASS / REAL_HOST・Mint 22.3 |
| 開発環境の完走 | F2/S2ともNOT_RUN | F2 PASS / REAL_HOST・初期構成→表示→編集→復元 |
| 未導入PC・初心者本人の完走 | NOT_RUN | NOT_RUN |

[Windowsの短い確認レポート](WINDOWS.md) / [Linuxの短い確認レポート](LINUX.md)。Windowsの署名状態は **NotSigned（検証用）** です。Windows実機・適切なVMがないため、導入・警告・WSL/Docker Desktop・アンインストール保持の確認は残っています。macOS・ARMは今回の配布対象外です。

## 個別の配布物

| 配布物 | bytes | SHA-256 |
|---|---:|---|
| [Windows x64 exe](https://github.com/garchomp-game/tsukuhako/actions/runs/39537520939/artifacts/12318223039) | 144935238 | `31c106f46f9c348b07fffc6dfb9a1aa59b022c2e81092c77fec351bce1b51c18` |
| [Linux x64 tar.gz](https://github.com/garchomp-game/tsukuhako/actions/runs/39537520939/artifacts/12317908431) | 168270353 | `45ea32ae9c341b6bfa908aa2eda7072e966f58597cce4b80ef905baa1c0c73d1` |

GitHubログインとprivateリポジトリへのアクセスが必要です。OSごとのActions artifactは14日保持で、展開すると各配布物を取得できます。ローカルの `dist/` にも同じファイルを置きました。版・元commit・署名・確認OSは [Windows manifest](manifests/tsukuhako-windows-x64-0.4.3-setup.exe.manifest.json) / [Linux manifest](manifests/tsukuhako-linux-x64-0.4.3.tar.gz.manifest.json)。CI内のmanifestはビルド時点、ここにある同SHAのmanifestは実機確認の追補です。

## 変更と確認

F1/F2/B1/S1/S2の案内を共有コアから統一し、「構成ターミナル本文の準備完了」＋「初期構成の正常終了」を待って開発サーバーを起動する手順にしました。早過ぎる起動への復旧、失敗ログの確認、初回Codeのサインイン・フォルダの信頼・Microsoft Dev Containersも補足しました。I1はDBの別手順です。テンプレート本体7件は変更していません。

electron-builder 26.15.3を固定し、通常権限・ユーザー単位のNSISを追加しました。ASARなしの実ファイル配置で、worker・共有コア・実行時依存・50章・7 ZIP・ライセンス・Linux x64 Node入りhelperを同梱しています。Windowsのインストール先へプロジェクトを書かず、削除時もWSL・Docker・生成先・設定・helperを自動掃除しない設定です。この動作のWindows実機確認は未実施です。

- 既存テスト **50/50 PASS**、同梱資材の欠落・改変・日本語/空白パス・任意CWDを検査する追加テスト **1/1 PASS**。CIでも同じ51件を確認。[core](logs/tsukuhako-043-core-tests.log) / [desktop](logs/tsukuhako-043-desktop-tests.log) / [package](logs/tsukuhako-043-package-tests.log)
- Linuxで同梱Node/helperを実行し6構成の生成・中断・終了を確認。WSL名を与える **FIXTURE** を含み、Windows/WSL実機の代用ではありません。[helper](logs/helper-linux-tests.json) / [終了](logs/helper-shutdown.json)
- 配布exeから展開したWindows資材と、実機起動したLinux資材はそれぞれハッシュ検査済み。両OSのhelper SHAも一致しました。
- 新Linux配布物のF2は **REAL_HOST** で新規依存ボリュームを使用。「準備完了」と正常終了の後に起動し、編集・復元、教材との往復、終了後の再開を確認しました。

CIは手動のみ・標準runner・各25分上限・公開Releaseなし。[成功run](https://github.com/garchomp-game/tsukuhako/actions/runs/39537520939)。初回CIでElectron本体の取得漏れとOS間のhelperファイル順序差を検出して修正しました。続いてbuilderの既定除外で実行時依存が落ちない配置をローカル検査し、途中の古いWindowsビルドは中止して最終commitから両OSを再作成しています。署名サービスや証明書の購入はありません。

残作業はWindows 11実機のF2/S2・日本語/空白パス・削除後保持、一般配布の署名、未導入PC、初心者本人の試用です。200%表示の多重スクロールは既知の改善候補として残しています。
