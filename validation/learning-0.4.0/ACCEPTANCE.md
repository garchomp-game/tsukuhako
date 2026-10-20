# L01–L10 / P01–P12

2026-10-21。PASSは記載した範囲の合格です。PARTIALは仕様全体の完了ではありません。実機がない対象はNOT_RUNとして残します。

|ID|結果|根拠・制限|
|---|---|---|
|L01|PARTIAL|配布Linux GUIでrendererをofflineに設定し、章・画像・コードコピー・内部リンクを確認。host回線切断はNOT_RUN|
|L02|PASS / Linux|生成完了→正しい教材、見出し・コードコピー・内部リンク。外部アプリ不要|
|L03|PASS / Linux|所有プロセス全体の終了。併用VS Code・ブラウザ・Docker生存。診断実行中の終了も確認|
|L04|PASS / Linux|実GUIで生成中close拒否・二重生成・既存先拒否。coreで失敗時rollback/変更済みファイル保護|
|L05|PASS / 自動試験＋Linux GUI|送信元/main frame/URL、教材ID、path逸脱、symlink、hash、HTML、危険URL、任意commandの拒否|
|L06|PARTIAL|Linux全プロセスツリーPSS/RSS/CPUを計測。短い生成は観測最大値。Windows/macOSはNOT_RUN|
|L07|PASS / Linux F2|実VS Code Reopen→起動→編集→HMR→復元。window reload再接続とRebuildを別記録。他構成のVS Code GUIはNOT_RUN|
|L08|PASS / 整合検査|app/教材0.4.0、F1 0.1.3ほか対象版、配布manifest/hash。review ZIPは製品と別|
|L09|PASS / Linux|入力・生成結果・読書位置の画面間保持、再起動再開、旧章IDの目次fallback|
|L10|PARTIAL|生成中教材read・二重生成拒否、240回の章切替と待機を計測。有限時間の観測で長期リーク不在は断定しない|
|P01|PARTIAL|Linux x64起動/ガイド。Win/macはパッケージのみ、実機NOT_RUN|
|P02|NOT_RUN / Windows実機|fixtureで代表的WSLエラー/WSL世代を分類。実OS再起動、仮想化、初回ユーザー設定は未実施|
|P03|PARTIAL|UTF-16/日本語/空白/Stopped/内部distro除外/root既定拒否をfixture確認。実選択distro・一般ユーザーはNOT_RUN|
|P04|PARTIAL|Linux Engine実接続。timeout/不在/停止/権限/Windows containers/remote contextはfixture確認。実Desktop WSL連携は未実施|
|P05|PARTIAL|Linux/helperで日本語・空白・ドット・記号の生成と注入拒否。Windows→WSL→Code全経路はNOT_RUN|
|P06|PARTIAL|Linux6構成の依存・サンプル起動。macOS両CPUはNOT_RUN、S2ホスト補助はLinux専用の既知制限|
|P07|PARTIAL|Linux実VS Codeと拡張、既知導入場所の探索。Windows起動アダプターの実機接続、各OSの全欠落状態は未実施|
|P08|PARTIAL|Linuxの終了/キャンセル/生成保護、Linux helperの子処理停止。実WSL中断・再起動はNOT_RUN|
|P09|PARTIAL|Linux再診断、教材移動、timeout/abort/出力制限、伏せ字fixture。ログ保存ダイアログの全経路と実OS再起動は未実施|
|P10|PASS / 結果の区別|OS×CPU×Docker×template表、生成/packaging/実起動の区別、S2実DB/CRUD|
|P11|PARTIAL|Linux tarを別の日本語/空白パスへ展開して通常ユーザーで起動。初めてのPC/Win警告/mac署名公証はNOT_RUN|
|P12|PARTIAL|同梱Linux Node/manifest、対象binding、cancel、active診断shutdownを実Linuxで検証。WSL実配置・不完全配置復旧は未実施|

主要記録：gui-results.json、core-tests.txt、unit-tests.txt、security-extra.json、app-diagnosis-shutdown.json、helper-linux-tests.json、helper-shutdown.json、vscode-f2.json、vscode-reconnect.json、vscode-rebuild.json、linux-template-startup.json、s2-startup.json、startup/S2-browser.json、coexist-memory.json、release-check.json。
