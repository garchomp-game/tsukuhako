# F1 実測記録

## 0.1.1 — 自作教材の再現試験

2026-10-20、改訂したBUILD-YOUR-OWNの明示ファイル32個だけを、記載した段階と順番で新しい空フォルダへ追加しました。完成フォルダ全体のコピーはしていません。依存とアプリ実装は0.1.0から変更していません。

Dev Containerの新規依存volumeで `npm ci`、各段階のcheck、入力の即時反映・クリア・再読み込みによる状態初期化を確認しました。最終のcheck、HTTP 1件、ブラウザ 2件、buildはすべてPASS。F1/S1の画面はホストの実Chromeでも操作しました。F1にはPostCSS設定を追加していません。

[0.1.1実測JSON](docs/VALIDATION-0.1.1.json) に、教材と配置ファイルのSHA-256、元ファイル、段階別一覧、実行日時・コマンド・終了コード・観察結果を同梱しています。全体配布物の証拠は `validation/revision-0.1.1/learning/` です。VS Codeを使う段階はDev Container CLIで検証しており、VS Code実画面・Windows/WSL・実GitHub Actions・初学者の試用はNOT_RUNのままです。

## 0.1.0 の実測記録（保持）

版 0.1.0 / 検証日 2026-10-20。Linux Mint 22.3・x86_64、Docker 29.9.1、Compose 5.6.0、Dev Container CLI 0.89.0。コンテナはNode 24.22.0 / npm 11.17.0。

固定依存の復元、check、build、HTTP 1件、Chromiumでのブラウザ操作 2件がPASS。ソース変更の自動反映、停止・再開、コンテナ再作成後の編集保持、ZIP新規展開、日本語と空白を含むパス、別コピーの同時利用も実測しました。

新しい依存volumeを使いました。Dockerの共有イメージキャッシュは利用しており、ホストキャッシュを全削除した試験ではありません。

|確認|結果|
|---|---|
|A01 別フォルダへZIP展開・単独起動|PASS|
|A02 設定欠落・Docker未接続・不正ポートの診断|PASS|
|A03 固定Node/npmとlockfileから新規volumeにnpm ci|PASS|
|A04 Dev Container CLIで作成・接続・check実行。VS Code UIは別の未実測項目|PASS|
|A05 実HTTP契約と構成固有の主要操作|PASS|
|A06 ソース変更が開発サーバー再起動なしで反映|PASS|
|A07 CLIによる停止・再開と編集保持はPASS。VS Code再接続の実操作はNOT_RUN。|NOT_RUN|
|A08 compose down（volume保持）→up後も編集と主要動作を保持|PASS|
|A09 DBなしのステートレス構成のためmigration/seed/DB resetは対象外。|対象外（PASSに数えない）|
|A10 同一テンプレートの別ZIPコピーを異なるproject/port/volumeで同時利用|PASS|
|A11 固定のHTTP契約・ブラウザ操作テストを実行|PASS|
|A12 workflow同梱、同じcheck/test/buildはローカルPASS。GitHubへのpush/実CIは依頼範囲外でNOT_RUN。|NOT_RUN|
|A13 実.env・資格情報パターン・制作者パスを除外しloopback公開を確認|PASS|
|A14 日本語教材のconfigure/doctor/依存復元/起動/変更/復旧はCLIで実測。教材のVS Code操作と未導入PC・初学者による試用はNOT_RUN。|NOT_RUN|
|A15 環境・未検証OS・CLIとVS Code実操作の区別を記録|PASS|
|A16 この構成のソース・教材・実測・試験ZIPは完了。全体catalog/REPORT/最終配布は統合担当の確認対象。|NOT_RUN|

詳しい実行日時、コマンド、終了コード、所要時間、A01〜A16判定は [実測JSON](docs/VALIDATION.json) に同梱しています。ログのIDは全体配布物のvalidation/frontend-api配下に対応します。単独配布でもこの要約とJSONだけで判定を確認できます。

画面の自動操作とエージェントによるスクリーンショット確認は、本人の目視や初学者の試用と区別します。VS Code実操作・実CI・Windows/WSL・macOS・ARMはNOT_RUNです。Linuxの成功からこれらを推定しません。

npmはESLint 9.39.5にサポート終了の警告を出します。F1はVite構成で、固定理由は実測したESLint 9.39.5と@eslint/js 9.39.5の組をlockfileから再現するためです。F1のlockfileにあるtypescript-eslint 8.72.0、eslint-plugin-react-hooks 7.1.1、eslint-plugin-react-refresh 0.5.7のpeer範囲はいずれもESLint 10を含みます。今回の教材改訂では依存を変更せず、ESLint 10への更新と動作確認は別版の作業とします。
