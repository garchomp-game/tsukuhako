# C担当へ渡す商品事実：0.4.4 / 担当A

2026-10-22。製品ソースは `2b141f7c583d796e1ba75ad312c6ab199056c7de`、従来の証跡は `55d3b051935df80d24f988719b52a4937f2f559b`。今回の変更は検証ツールと受取案内で、製品の機能追加・バイナリ更新ではありません。原稿のsourceRefsにはこの表のIDとリンク先を利用できます。

| ID | 引用できる事実・必要な条件 | 根拠・証拠の種類 |
|---|---|---|
| PF-01 | ツクハコは独自の学習用開発環境生成アプリ。明鏡の公式アプリ・教材再販売として説明しない | [Desktop README@55d3b05](https://github.com/garchomp-game/tsukuhako/blob/55d3b051935df80d24f988719b52a4937f2f559b/generator-desktop/README.md)（STATIC） |
| PF-02 | 0.4.4のLinux x64 tar.gzとWindows x64 NSIS exeが存在。今回も実ファイルのサイズ・SHAを再計算して一致を確認した | [今回のartifact照合](logs/artifact-audit.json)、[Linux manifest](delivery/linux/manifest.json)、[Windows manifest](delivery/windows/manifest.json)（STATIC） |
| PF-03 | 生成対象はF1/F2/B1/S1/S2/I1の6構成。S3 cloud Supabaseは参考資料で生成対象外 | [catalog@製品SHA](https://github.com/garchomp-game/tsukuhako/blob/2b141f7c583d796e1ba75ad312c6ab199056c7de/catalog.json) のgeneratorEligible（STATIC） |
| PF-04 | 同梱教材は50章、テンプレート資材は参考用S3を含む7件。収録数を全構成実機完走・学習効果の証明としない | [curriculum manifest@製品SHA](https://github.com/garchomp-game/tsukuhako/blob/2b141f7c583d796e1ba75ad312c6ab199056c7de/curriculum/manifest.json)、[今回のbundle照合](logs/linux-delivery.json)（STATIC） |
| PF-05 | 教材閲覧とファイル生成にはアカウント登録・ホストNode・ネット接続が不要。初回の開発環境構築にはネット、Docker、VS Code等が必要 | [Desktop README@55d3b05](https://github.com/garchomp-game/tsukuhako/blob/55d3b051935df80d24f988719b52a4937f2f559b/generator-desktop/README.md)（仕様/STATIC）。今回の追補でオフライン全機能を再試験した意味ではない |
| PF-06 | 最終Linux配布物はMint 22.3 x64の既存開発環境で、通常起動・教材操作・F2生成→初期構成正常終了→表示→編集→復元→再開まで確認された記録がある | [従来のLinux証跡@55d3b05](https://github.com/garchomp-game/tsukuhako/blob/55d3b051935df80d24f988719b52a4937f2f559b/validation/release-0.4.4/LINUX.md)（既存REAL_HOST）。今回の追加は[通常終了code 0](logs/normal-exit.json)（新規REAL_HOST） |
| PF-07 | 狭幅で目次を切り替え、200%表示、キーボード、ヘルプ復帰、読書位置/章の再開を確認した11グループの記録がある | [Reader結果@55d3b05](https://github.com/garchomp-game/tsukuhako/blob/55d3b051935df80d24f988719b52a4937f2f559b/validation/release-0.4.4/logs/reader-final.json)（既存REAL_HOST）。今回はUIを変更せず、全経路の再実行はしていない |
| PF-08 | Windowsは未署名。Server 2022 CIの管理者トークンで同じexeの導入・導入先からの教材表示・削除・隔離reading.json保持を補助確認した | [Windows結果@55d3b05](https://github.com/garchomp-game/tsukuhako/blob/55d3b051935df80d24f988719b52a4937f2f559b/validation/release-0.4.4/logs/windows-installer-smoke.json)、[現在観測したCI状態](logs/ci-run-observed.json)（既存CI） |
| PF-09 | Win11通常ユーザー・初回警告・既定導入先/スタートメニュー/APPDATA保持、実WSL/Docker/CodeのF2/S2完走・実DB保持は未確認 | [従来Windowsの範囲](../release-0.4.4/WINDOWS.md)、[協力者用記録票](WINDOWS-TRIAL.md)（NOT_RUN） |
| PF-10 | macOS/ARM、deb/AppImage、自動更新は今回の配布対象外。Mac教材の存在はMac実行版の提供を意味しない | [Desktop README@55d3b05](https://github.com/garchomp-game/tsukuhako/blob/55d3b051935df80d24f988719b52a4937f2f559b/generator-desktop/README.md)（STATIC / NOT_RUN） |
| PF-11 | 今回採用する受取セットはOS別4ファイル。一般購入者の配布URL・受取人権限での取得は未設定/未確認。private Actionsは制作側の保管先 | [採用セットと公開待ち](DELIVERY-CHECKLIST.md)、[アップロード一覧](delivery/upload-files.json)（STATIC / NOT_RUN） |
| PF-12 | 従来CIの51テストはLinux jobのcore 27＋desktop 23＋package 1。両OSそれぞれ51件ではない。今回追加は終了検証の6件 | [workflow@製品SHA](https://github.com/garchomp-game/tsukuhako/blob/2b141f7c583d796e1ba75ad312c6ab199056c7de/.github/workflows/desktop-validation.yml)（既存CI）、[追加試験](logs/process-exit-tests.log)（FIXTURE） |

## 6構成の呼び方

| ID | 原稿で使う名前 | テンプレート版 |
|---|---|---|
| F1 | React + Vite + TypeScript | 0.1.3 |
| F2 | Next.js + TypeScript + Tailwind | 0.1.1 |
| B1 | Next.js Route Handlers API | 0.1.2 |
| S1 | Next.js + Route Handlers | 0.1.2 |
| S2 | Next.js + ローカルSupabase | 0.1.2 |
| I1 | PostgreSQLの作業環境 | 0.1.0 |

構成と版の根拠はPF-03のcatalog。製品の0.4.4と各テンプレート版は異なります。catalogのsupportingToolsには0.3.0、過去のvalidationScope/notRunには歴史的な値が残っています。これらを一括で「0.4.4検証済み」または「現在の全機能一覧」に読み替えず、環境・操作の実績には上の版別証跡を使用してください。

## 原稿へ使える短い説明

ツクハコは、6種類の学習用開発環境を生成し、同梱教材で起動・最初の変更・復元まで進むためのアプリです。開発を始めるにはDockerやVS Code等の準備が必要です。0.4.4のLinux Mint 22.3でF2の一連の操作を確認しています。Windows版は未署名でCIによる補助検証まで進んでおり、Windows 11の実機とWSLでの開発経路は確認が残っています。

この説明はPF-01〜09の範囲です。初心者の無補足試用、全PC保証、全章の学習効果、0.4.4の全構成実機完走、任意の既存プロジェクトへの自動最適化は含めません。

## 公開前の判断とB/Cへの引き継ぎ

価格・販売日・利用/返金条件・窓口・サポート/更新期間は未決定。新しい保証を原稿から作らないでください。Windowsを初回販売へ含める範囲は、実機確認または明示的な対象限定の判断が必要です。

購入者の受取手順は [DELIVERY-CHECKLIST](DELIVERY-CHECKLIST.md) の本文案を利用できます。ダウンロード先のlinuxDownload/windowsDownloadは購入済み本文専用の未設定値であり、公開記事や任意購読メールへ転記しません。メール登録を受取条件にしない、購読確認を購入権限にしない方針は添付02/03の仕様です。今回のアプリレビューがメール基盤の実装完了を証明するものではありません。
