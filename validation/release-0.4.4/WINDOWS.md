# Windows CIで確認する範囲

Windows Server 2022 Datacenter（10.0.20348、runneradmin、管理者トークン、セッション2）の補助検証。署名はNotSigned。最終exeのSHA・元commit・結果はREPORTおよびinstaller-smoke.jsonで照合する。

| 確認 | 方法・証拠の種類 |
|---|---|
| 導入 | 同じexeを /S /currentuser /D=専用の日本語・空白パスで実行。HKCU登録、版、resources/app/build-info.json、実行ファイルSHAを照合。CI |
| 起動 | 実導入先のtsukuhako.exeを専用user-data-dirで起動。通常のアプリコードにCDPを接続し、ウィンドウハンドル/応答、renderer、F2本文、アプリ生成reading.json、rendererエラーなしを確認。モックやsandbox無効化なし。CI |
| 終了・削除 | ウィンドウのCloseMainWindowで通常終了。そのインストールのアンインストーラーを /S /currentuser で実行し、ディレクトリとHKCU登録の消失まで待つ。CI |
| 保持 | UIのPageDownから実際に作られた隔離reading.jsonのSHAを、アンインストール前後で比較。ダミーWSL/DBデータは作成しない。CI |
| 制限 | 既定APPDATAの保持、スタートメニューのクリック、既定導入先、Win11通常ユーザーの警告、WSL/Docker/VS Code/F2/S2完走、実WSL/DB保持はNOT_RUN。 |

各workflowは手動・標準runner・25分上限。smoke stepは7分、導入/削除プロセス120秒、renderer接続45秒、通常終了15秒、削除完了待ち60秒。失敗時も結果と作成済み配布物をartifactへ保存する。終了対象はこの試験のPIDと導入パス内のプロセスだけで、作成したデータはrunner破棄まで保持する。

初回は検証コードが版付き登録名を見落とした。2回目はexe消失直後の検査でNSIS子プロセスの削除完了前に失敗した。専用導入パスで登録を照合し、ディレクトリ/登録の両方の消失を待つよう修正し、3回目で導入・教材表示・削除・実読書設定のSHA保持が通った。Readerの追加キーボード補正を含む最終ソースから4回目を実行し、最終成果物はそのrunだけを配布対象とする。各試行のログはINDEXを参照。

[実機で使う最小手順](WINDOWS-TRIAL.md)。このCI結果をWindows 11の実機合格へ読み替えない。
