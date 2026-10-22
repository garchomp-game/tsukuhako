# Win11協力者用：試す順番と記録票

**未実施（NOT_RUN）**。今回のA環境はLinux Mintで、利用できるWin11通常ユーザー実機はありません。Server 2022 CIは既存の補助検証で、ここへPASSを転記しません。

最初は受取・導入・教材までを一区切りにできます。WSL/F2、S2と保持確認には別の時間を確保してください。環境構築が5〜10分で終わるという案内ではありません。

1. 制作者が確定した受取先からWindows用A版4ファイルを取得。START_HERE.txtを読み、[チェックリスト](DELIVERY-CHECKLIST.md) のPowerShellで3項目のSHAを照合する。
2. 普段のWindowsユーザーでexeを実行し、警告・署名・導入先を記録。保護を無効化しない。警告で先へ進めなければ、そこをSTOPとして残す。
3. スタートメニューの「ツクハコ」から通常起動。「学ぶ」→F2「最初の一歩」を開く。Ctrlと+で拡大→目次→本文→末尾→「困ったとき」→戻る。閉じて再起動し、章と位置を確認する。
4. WSL/Docker/Codeが用意できたら、通常ユーザーの同じWSL 2を選ぶ。準備確認→WSL用ファイルを準備→F2をWSL HOME配下の新規フォルダへ生成→Windows Codeで開く。既存プロジェクトに上書きしない。
5. Reopen in Container後、構成ターミナル本文の「準備完了」と初期構成の正常終了を確認。その後に新しいターミナルでnpm run dev。生成先START_HERE.mdのURLを表示し、教材どおり変更→保存→表示確認→復元→保存→表示確認する。
6. S2は別の新規試験プロジェクトで教材どおりに行う。実DBに試験用データを作り、通常停止/再開後に内容を比較する。普通のフォルダに置いたダミーファイルで代用しない。
7. 削除を試す前に、この試験で作った読書設定・プロジェクトのSHA、WSL/helperの存在、S2実データを記録。ツクハコを閉じ、Windowsの設定から本体をアンインストール。本体の削除と各保持対象を別々に照合する。WSLやDocker volume、既存プロジェクトを検証のために削除しない。

読書設定は通常 `%APPDATA%\tsukuhako\reading.json`。アプリを閉じてから、存在確認・SHAを記録します。専用user-data-dirではなく普段の起動の保存先を対象とします。設定の内容そのものや秘密値は共有不要です。

```powershell
$readingFile = Join-Path $env:APPDATA 'tsukuhako\reading.json'
Get-FileHash -LiteralPath $readingFile -Algorithm SHA256
```

F2の復元確認は選んだWSLで `sha256sum app/page.tsx` を変更前と復元保存後に比較します。S2のDB確認は選んだプロジェクトの教材・接続先を使い、既存DBへの操作は行いません。

| 記録 | 結果・観測値 |
|---|---|
| 日時 / Win11版・build / CPU | 未記入 |
| 標準ユーザーか管理者トークンか | 未記入 |
| exeのSHA / 案内revision | 未記入（A版の期待値はDELIVERY-CHECKLIST） |
| 取得・署名・初回警告・導入先 | NOT_RUN |
| スタートメニュー通常起動・教材・復帰 | NOT_RUN |
| WSLの版/通常ユーザー、Docker Integration | NOT_RUN（個人名は伏せる） |
| F2生成・Code・初期構成終了・表示 | NOT_RUN |
| F2変更保存/表示・復元保存/表示・SHA | NOT_RUN |
| S2起動・試験データ・通常停止/再開 | NOT_RUN |
| アンインストール後、本体/登録が消失 | NOT_RUN |
| 既定APPDATA reading.json 前SHA / 後SHA | NOT_RUN |
| F2/S2プロジェクト・helper・WSL保持 | NOT_RUN |
| S2実DB保持 | NOT_RUN |
| 止まった操作・表示された文言 | 未記入 |

成功はPASS、操作して失敗したものはFAIL、試せなかったものは理由付きNOT_RUNと記録してください。画面を返す場合は名前・個人の保存パス・キーを隠し、診断に必要な警告文を残してください。
