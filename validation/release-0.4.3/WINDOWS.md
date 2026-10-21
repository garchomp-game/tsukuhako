# Windows 0.4.3の確認

製品commit: [5bcd435](https://github.com/garchomp-game/tsukuhako/commit/5bcd435a44ded8de2f19f3e2de5b7861e16ef90f)。配布対象はWindows 11 x64、今回のビルド環境はGitHub Actions Windows Server 2022 x64です。Windows 11実機・適切なVMを利用できないため、OS上の導入・起動・開発経路は **NOT_RUN** です。

| 項目 | 結果 | 実行区分・証跡 |
|---|---|---|
| NSIS exe作成 | PASS | CI。[成功run](https://github.com/garchomp-game/tsukuhako/actions/runs/39537520939) |
| 配布exeから展開して同梱を検査 | PASS | REAL_HOST/Linux上で7z展開。Windows実行ではない。[bundle](logs/windows-bundle.json) |
| UI・worker・共有コア・7テンプレート・50章・ライセンス・版 | PASS | 120同梱ファイルのハッシュを照合。Electron/Chromiumライセンスも確認 |
| 同梱helper.tar内の全ファイル・Node・ライセンス・manifest | PASS | [46ファイルの検査](logs/windows-helper.json)。アーカイブSHAはLinux生成・Windows CI・配布exeの間で一致 |
| 権限要求・削除設定 | PASS（静的） | exeとアプリの埋込manifestはasInvoker。NSIS oneClick/perMachine:false、データ削除hookなし、deleteAppDataOnUninstall:false。[検査](logs/windows-static.json) |
| インストーラー署名 | PASS（状態確認） | CIのGet-AuthenticodeSignatureが **NotSigned**。[署名記録](logs/windows-signature.json)。署名済みという意味ではない |
| 一般ユーザーによる導入・スタートメニュー起動・初回警告 | NOT_RUN | Windows実機なし。SmartScreen等の実画面・挙動は観測していない |
| 未準備WSL→教材→再確認→通常ユーザーでhelper設置 | NOT_RUN | WSLAdapterのfixture・Linux helper検証とは区別 |
| Windows F2: WSL→生成→Windows Code→Dev Container→起動→編集→復元 | NOT_RUN | Linuxの合格から転記しない |
| Windows S2: WSLのツール・Docker Desktop・Supabase・停止・データ保持 | NOT_RUN | 選択WSL + Docker Desktopでの実確認が必要 |
| 日本語/空白Windowsユーザーパス・生成先・任意CWD | NOT_RUN | Linuxの資材パス検査、WSL引数fixtureと区別 |
| アンインストール後のプロジェクト・DB・WSL・設定保持 | NOT_RUN | 設定の静的確認だけで実動作合格にしない |
| 初心者本人による完走 | NOT_RUN | CI・自動操作とは別 |

[Windows用の個別ダウンロード](https://github.com/garchomp-game/tsukuhako/actions/runs/39537520939/artifacts/12318223039)（private、GitHubログインが必要、14日保持）。展開するとexe・manifest・署名記録を取得できます。ソースやLinux版は含めていません。[配布manifest](manifests/tsukuhako-windows-x64-0.4.3-setup.exe.manifest.json)にサイズとSHA-256があります。

普段のWindowsユーザーでインストールし、ツクハコを通常権限で起動してください。開発先は選択したWSL 2の通常ユーザーのHOME、Docker DesktopのIntegrationも同じWSLにします。インストールフォルダにプロジェクトやキャッシュを作る設計ではありません。OSの保護機能を無効化せず、警告やポリシーで停止した場合はその内容を記録します。

削除時に残す設計の対象は、生成プロジェクト、WSL distro、Dockerデータ/ボリューム、WSL内の `~/.tsukuhako-helper`、Windowsの `%APPDATA%/tsukuhako` です。自動掃除を追加していません。実機ではこの順にF2・S2を完走し、最後にアンインストールして保持を確かめてください。一般配布用の署名は後続作業で、有料証明書・サービスは購入していません。
