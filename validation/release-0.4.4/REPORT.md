# ツクハコ 0.4.4：初回配布前の改善結果

| 項目 | 結果 | 証拠の種類 |
|---|---|---|
| P1 受取人向け配布 | OS別の4ファイル・案内ドラフト・ハッシュを作成、別の日本語/空白パスで照合。一般受取人向け取得経路は未設定 | STATIC、Linux展開起動はREAL_HOST |
| P2 教材の操作 | 通常幅・狭幅・200%、目次のキーボード操作、見出し/前後章、ヘルプ復帰、終了/再開がPASS。F2生成入力とS2学習対象を保持 | REAL_HOST（最終Linux配布物） |
| P3 Windows補助検証 | 同じexeの導入→導入先から起動→教材表示→通常終了→削除→実読書データのSHA保持がPASS。Win11実機は未確認 | CI（Server 2022、管理者トークン） |
| Linux F2 | 生成→Dev Container初期構成正常終了→起動→変更保存/表示→復元保存/表示→再開がPASS | REAL_HOST（Mint 22.3） |
| 回帰・同梱物 | 最終CIの51テストとビルドが成功。アプリ120ファイル、教材50章、テンプレート7件、helper 46ファイルを照合 | CI、STATIC。WSL名等の模擬検証はFIXTURE |

2026-10-22 JST。狭幅では目次と本文を切り替え、読む場所を一つにしました。上部の戻る操作と目次を保ち、本文末尾へ届きます。受取人はOS別フォルダの `START_HERE.txt` から始められます。生成後の具体的な保存先・ポートは、生成先の `START_HERE.md` に引き継ぎます。

**最初に試すもの：[帰宅後の5〜10分](TRY-5-10-MIN.md)**。画像・詳細ログは [INDEX](INDEX.md)、残る取得経路の判断は [DELIVERY](DELIVERY.md) を参照してください。

## 最終配布物

製品ソースcommitは [`2b141f7c583d796e1ba75ad312c6ab199056c7de`](https://github.com/garchomp-game/tsukuhako/commit/2b141f7c583d796e1ba75ad312c6ab199056c7de)。[最終手動CI #39695492170](https://github.com/garchomp-game/tsukuhako/actions/runs/39695492170) は両OSともSUCCESSです。以下はそのrunから取得した同一バイナリです。後続の証跡・文書commitで再ビルドしたものではありません。

| OS | 製品ファイル | bytes | manifest |
|---|---|---:|---|
| Linux x64 | `tsukuhako-linux-x64-0.4.4.tar.gz` | 168,272,243 | [最終manifest](delivery/linux/manifest.json) |
| Windows x64 | `tsukuhako-windows-x64-0.4.4-setup.exe` | 144,935,062 | [最終manifest](delivery/windows/manifest.json) |

SHA-256（[照合用ファイル](SHA256SUMS)）：

```text
deace519c6ac6cb7a91de304491edd6a0676995eb386fa0be93fb541f43430b4  tsukuhako-linux-x64-0.4.4.tar.gz
a5e2cd8fbfc80815e1cd87b5eefc5af1bc873e35ecfcc81762462617266bd103  tsukuhako-windows-x64-0.4.4-setup.exe
```

| 取得先 | 条件・期限（JST） |
|---|---|
| [Linux CI配布パック](https://github.com/garchomp-game/tsukuhako/actions/runs/39695492170/artifacts/12390855564) | GitHubログイン＋privateリポジトリread権限。2026-11-05 08:47:07まで |
| [Windows CI配布パック](https://github.com/garchomp-game/tsukuhako/actions/runs/39695492170/artifacts/12390616136) | 同上。2026-11-05 08:49:43まで |
| このPCの最終フォルダ | リポジトリ直下 `dist/delivery-0.4.4/linux/` または `windows/`。片方の4ファイルを渡す |

各フォルダは製品1個・`START_HERE.txt`・`manifest.json`・`SHA256SUMS`。Actionsの外箱ZIP以外に圧縮を重ねていません。Gitには小さい案内・manifest・証跡だけを保存しています。CIの外箱サイズ/期限/digestは [API記録](logs/ci-artifacts.json)、権限は [実際のprivate状態](logs/repository-access.json) と [取得条件](DELIVERY.md) を参照。期限前の削除や権限変更があれば取得できなくなります。

Linuxのローカル最終パックは、同じ製品SHAに対するMint実機結果を案内とmanifestへ追補しています。CIパックはビルド時点の記述です。Windowsの4ファイルはCI取得物とバイト単位で同じです。一般受取人向け配布先・窓口・受取人権限の試験は未完了で、公開販売用の確定案内ではありません。

## 確認結果と範囲

- **教材：** 200%でCSS viewport 575×426に対し、画面全体の高さは変更前774→変更後426px。本文と目次の重複スクロールを解消。[変更前](screenshots/UX-before-200percent.png) / [変更後](screenshots/UX-after-200percent.png) / [本文末尾](screenshots/UX-after-chapter-end.png)。最終アプリの11グループがPASS。[ログ](logs/reader-final.json) / [設計・拡大方法](UX.md)
- **Linux：** Mint 22.3 x64の既存開発環境。日本語/空白の展開先、一般ユーザー、任意CWD、ホストNodeのないPATH、引数なしで通常起動。F2の初期構成ログの正常終了を確認してから開発サーバーを開始し、見出し変更/復元の画面とファイルSHAを照合。[手順と環境](LINUX.md)
- **Windows：** Server 2022 Datacenter 10.0.20348、runneradmin、管理者トークン、セッション2。未署名（NotSigned）。導入先の実exeに観測用CDPと専用user-data-dirを指定し、ウィンドウ応答・教材・rendererエラーなしを確認。sandbox/OS保護の無効化なし。アンインストール後は本体ディレクトリとHKCU登録が消失し、アプリが作った隔離reading.jsonのSHAは一致。[結果](logs/windows-installer-smoke.json) / [画面](screenshots/Windows-installed-lesson.png) / [詳細](WINDOWS.md)
- **CIの失敗対応：** 初回の版付き登録名の照合、2回目のNSIS子プロセス終了待ちを検証コードで修正。3回目で全工程PASS。Readerの追加キーボード修正を含む4回目が最終版です。標準runner・手動・各job25分、smoke7分以内に制限しています。[試行記録](INDEX.md)

証拠は **REAL_HOST**＝実機上の自動操作、**CI**＝runner内、**FIXTURE**＝状態を模擬、**STATIC**＝資材/設定検査、**NOT_RUN**＝未実施。今回の自動操作を初心者本人の試用結果へ読み替えません。

## 残る確認と次の操作

1. 本人は [5〜10分の手順](TRY-5-10-MIN.md) で教材の拡大と準備済みF2を試す。F2は `/var/tmp/tsukuhako-044-d8YosG/F2 日本語 空白 044`、URLは `http://localhost:41915`。検証後は専用アプリ/Code/ChromeとF2コンテナを停止済みで、プロジェクトと2ボリュームを保持。無関係な2コンテナの起動時刻は不変です。[後片付け](logs/cleanup.json)
2. Windows 11の普段のユーザーで、初回警告・既定導入先・スタートメニュー起動・既定APPDATA保持を確認する。実WSL/Docker/VS CodeのF2/S2完走と、プロジェクト/DB/WSL保持はNOT_RUN。[最小手順](WINDOWS-TRIAL.md)
3. 受取人用の保管先、必要権限、窓口を決め、受取人自身の権限で取得→照合→起動する。[アップロード下書き](DELIVERY.md)。Brain添付可否・購入者アクセス・契約条件は未確認です。

他のLinux、未導入PC、初心者の無補足試用、スクリーンリーダーはNOT_RUN。macOS/ARM用の配布物は作成していません。旧0.4.2の全6構成実機記録を0.4.4の再実行結果には含めません。
