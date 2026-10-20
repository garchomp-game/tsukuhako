# 実装判断

2026-10-20 / 要件0.3 / 試作0.1.0。実装・検証で採用した判断を記録する。

- 本体は新しい `otoka-devcontainer-starters/` に作成する。他プロジェクト、既存Docker資源、OS設定を変更しない。添付資料の並行制作指定に従い、F2共通・F1/B1/S1・S2・I1で所有範囲を分ける。
- npm registryで実行開始時の版とpeerDependenciesを照合した。Nodeは現行24系LTSの24.22.0、npm11.17.0を固定。Next16.4.2、React19.3.1、Tailwind4.3.3、ESLint9.39.5、TypeScript5.9.3。TypeScript最新7系はtypescript-eslint8.72.0の `<6.1.0` 範囲外なので採用しない。
- Node公式イメージ `24.22.0-bookworm-slim` をmulti-architecture index digestで固定する。ARM実測を意味しない。コンテナ内OSパッケージはDebian repositoryから取得するため全OSパッケージのbit単位再現までは保証しない。ホストのAPTは操作しない。
- npmの直接依存はexact、配布時package-lockを同梱、初回 `npm ci`。制作専用CLI0.89.0とPlaywright1.64.1をtoolsに固定する。利用者のホストNodeは前提にしない。Dev ContainerにはDocker socketや特権を渡さない。
- ホストbashのconfigureでパス由来の識別子とポートを `.env` に生成する。Composeのproject名とホストポートを別々に分離し、localhostにだけpublishする。ソースbind mountと依存volumeを分け、サーバー起動は初回処理の後に利用者が実行する。
- 共通部は制作専用 `tools/scaffold.py` で各フォルダへ実体として展開する。配布フォルダはtoolsや親を参照しない。最終ZIPの再展開で確かめる。
- Supabaseはstable CLI 2.121.0をホストで実行する方式を採用し、実stackと2コピー共存を検証した。公式バイナリをchecksum照合してプロジェクト内cacheへ保存し、ホストNodeを不要にする。アプリへDocker socketは渡さない。socket共有方式と一時CLIコンテナ方式は設計比較のみで実測していない。experimental stackは使わない。
- UIは外部フォント・画像に依存しない日本語の小さな学習画面とする。UI状態、API入力検証、DB制約をそれぞれ検証し、型確認のみで機能合格にしない。
- テンプレートのコード・教材の外部配布ライセンスは未決。販売・公開・クラウド作成・GitHub pushはしない。ローカルZIPと報告を返す。

## 参照した公式資料

- 実測でCompose5.6/DevCLI0.89の生成DockerfileがBakeの範囲外ファイル検査に拒否された。[上流報告](https://github.com/microsoft/vscode-remote-release/issues/11896)と一致。安全チェック無効化や追加権限は使わず、initializeCommand内でプロジェクト内Dockerfileを通常のdocker buildで作成し、Composeはそのimageを参照する。I1/F2の実DevCLI upで解消を確認。F2で43.617秒（base image取得済み、OS依存・npm取得を含む）。
- ESLint9.39.5は取得時点でサポート終了警告が出る。最新10.13.0に対してNext側eslint-plugin-reactのpeerDependenciesが9系までのため、互換性が確認できる9.39.5を初版の開発用チェックに固定した。Next設定の10系対応時に再検証する。TypeScript7系も同様に無条件更新しない。

確認日2026-10-20。依存版は実行時npm registryのmetadataで確認。

- [Next.js installation](https://nextjs.org/docs/app/getting-started/installation) — Node最低要件、App Router構成。
- [Vite guide](https://vite.dev/guide/) — Node互換範囲。
- [Dev Container作成](https://code.visualstudio.com/docs/devcontainers/create-dev-container) — Compose、postCreate、再構築。
- [metadata reference](https://containers.dev/implementors/json_reference/) — remoteUserと設定。
- [Supabase local development](https://supabase.com/docs/guides/local-development) — CLI、Docker、localhost binding network。
- [複数ローカルプロジェクト](https://supabase.com/docs/guides/local-development/running-multiple-local-projects) — 固定portとexperimental stackの区別。

## 最終統合で確定した点

- 起動と停止の両方でプロジェクト境界を検査する。外部から引き継いだCompose変数、.env内の予約キー、同名の別フォルダを拒否する。停止helperはproject / file / env-fileを明示する。特にDevCLIは.env内COMPOSE_PROJECT_NAMEも読んで識別するため、シェルだけの検査では不十分だった。
- Next開発画面のURLはlocalhostに統一し、allowedDevOriginsを広げない。F2のdev/startは内部3000を明示し、二重起動時の自動ポート移動を防ぐ。[公式の開発origin設定](https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins)も参照した。
- adapterのNode/npm版範囲は小さい既知の文法だけを受理する。省略比較子を独自に0埋めするとnpm semverと異なるため、`>24` などは手動確認にする。既存.envは予約キー名だけを判定し、値は収集しない。
- generatorは必須6構成の検証と単独配布・catalogの準備後に追加した。ホストNode>=22を使う任意の補助CLIで、直接ZIPを使う場合のホストNode不要を維持する。fflate0.8.3を固定し、カタログSHA256とZIPパスを検査して、新規出力先だけへ展開する。
- 新規作成とadapter適用は完成したstageを作ってから排他的に配置する。directory renameだけでは競合した空フォルダを置換できるため、上書きしないmkdir/hardlinkと、作成内容に限定したrollbackを使う。複数ファイルの配置全体を原子的とは表記しない。
- ZIP manifestはZIPへ書き込んだ同一bytesから作り、後からソースを再読込してhashを作らない。全体ZIPは凍結した単独ZIPをそのまま内包する。配布する検証証拠から制作者のホームパスを置換する。

## 実物レビュー対応 — パック0.1.1

- レビュー対象の0.1.0全体ZIPと単独ZIPは変更しない。修正対象のF1/B1/S1/S2、adapter/generatorを0.1.1とし、F2/I1/S3は同一の0.1.0 ZIPを再利用する。runtime依存と基底Docker imageの固定版は更新しない。
- 個別ZIPの版は各テンプレートのVERSION.json（I1はtemplate.json）から取得し、全体パックはcatalogの版とpackagePathに従う。同梱ソースとZIPのファイル集合・bytes・版を照合する。
- R1のoptionalDependenciesは、通常依存との重複を含めnpmの意味に合わせて検査する。判定は読み取りだけで行い、対応外の依存参照を修復しない。
- R2のHTTP/ブラウザ試験は専用の管理サーバーで行い、終了とポート解放を待ってからbuildへ進む。既存サーバーの無条件再利用を解決策にしない。
- R3の自作教材は構成別に必要ファイルと成功条件を列挙する。空フォルダからその一覧に従って組み立てる試験を、配布済みフォルダの起動試験と区別する。完成版教材を初期scaffoldで上書きしないよう、scaffoldは既存出力先を拒否する。
- S2最終ZIPは新規パス・新規project ID・未作成volumeから検証する。以前の試行DBは利用せず、共有image/npmキャッシュだけ再利用できる。クラウド作成・公開・pushは行わない。

## ジェネレーター 0.2.0

- 基点は0.1.1全体ZIP（SHA256 `7113c3b50c95dbd7f59201c17a8af6a4bb9ad8d13262247ad1463c7c3f5aaf6a`）。別の`otoka-devcontainer-starters-0.2.0/`へ展開して作業した。7個のテンプレートZIP、テンプレートソース、adapterを維持し、パック・generator・desktopだけ0.2.0へ進める。
- planは入力・親のdev/ino・catalogとZIPのSHA・ファイル一覧・案内を安定順序でhash化する。時刻・診断・秘密値を除き、applyは同じ関数で再計算する。ZIPは展開前にもcentral directoryの重複・ファイル種別・容量を検査する。START_HEREは予約パスで、元ZIPとの競合を拒否する。
- I1秘密値の生成はapply内だけ。stageと新規先へ排他的に配置し、失敗時はinode・内容・親が変わっていない今回の所有物だけを戻す。完全な原子性や強制終了後の自動復旧とは説明しない。
- 既存createの同期APIとキーを維持。wizardはTTY必須で、戻る・中止・SIGINTを実PTYで確認した。診断のnullは未確認とし、Docker／Code不在を生成失敗にしない。引数なしdoctorは保存先が未確認になる。診断は固定の実行ファイルと引数だけを使い、timeoutとプロセス群の終了を管理する。
- GUIはElectron 44.9.1＋React/React DOM19.3.1＋TypeScript5.9.3＋Vite8.3.4＋React plugin6.1.2をexact固定し、lockとpeerを確認した。テンプレートの依存更新は行わない。大きなmonorepo基盤や別言語のcore実装を増やさず、既存ESM coreをutility processから使う。
- Linux配布はElectronの展開型tar.gz。runtime、core、fflate、catalog、7 ZIPをresources/app内へ含める。署名・installer・更新機能は今回の要件外。CLIは別ZIPへ同じcore・fflate・catalog・7 ZIPを含める。GUIのPATHをcksum/bash/試験用Codeだけに制限し、ホストNode/Dockerなしでも実生成できることを確認する。
- rendererには6 APIだけを公開し、mainで送信元webContents・main frame・URLと入力項目を検査する。workerが現在のplanを保持し、rendererはplanIdだけをapplyへ送る。reload・入力変更・worker再起動後は再確認が必要。同時applyはmainでBUSYとし、ファイルシステム上の競合検査も維持する。
- 配信はapp://meikyoの同梱ビルド一覧だけ。初回試験で、内部file取得もネットワーク拒否規則にかかり空画面になったため、一覧にある静的ファイルをmainが読みContent-Type/CSP付きで返す方式に修正した。Node integrationを無効、contextIsolation・sandboxを有効にし、別origin・新規window・webview・権限要求を拒否する。sandboxを解除する起動引数やOS変更は使わない。
- 最初のGUI操作試験で、画面切替時にReactが再利用したボタンの既定submitが走った。ボタンのtypeと段階別keyを明示して修正した。生成ボタン以外から生成を開始しない。後続の実ウィンドウ試験で、書込みなしのpreview/back、既存先エラー、worker停止後の再試行、二重apply拒否を確認した。
- VS Codeは成功結果の保存先だけをmainに保持し、明示ボタンから`spawn('code', ['--', destination], {shell:false})`で渡す。引数の安全性は専用launcherで実測し、実VS Code UIの受入とは分ける。READMEとSTART_HEREは同梱UI内のテキストとして表示できる。
- CLIとGUIのarchive由来bytesは全6構成で比較し、同じパス・設定から作った.env／START_HEREも比較する。I1のランダム秘密値だけは比較から除く。F2/S2の実起動は最終CLI配布ZIPから生成した専用フォルダと新規volumeで確認する。初回image層の既存cache利用を許容し、未導入PCの導入成功とは扱わない。
- 失敗試行もvalidation/rootとgui-attemptの記録へ残す。PTY試験のcleanup順、GUI試験の評価関数へのPID引数渡し、F2試験のボタン文言は試験側の修正。製品の修正と混同しない。

確認日2026-10-20。実装時に参照した一次資料：

- [Electron process model](https://www.electronjs.org/docs/latest/tutorial/process-model)
- [Electron security](https://www.electronjs.org/docs/latest/tutorial/security)
- [utilityProcess](https://www.electronjs.org/docs/latest/api/utility-process)
- [custom protocol](https://www.electronjs.org/docs/latest/api/protocol)
- [Vite guide](https://vite.dev/guide/)
- バージョンとpeerはnpm registryの各固定版metadataおよび同梱package-lockで確認。解決した依存一覧は`validation/generator-0.2.0/desktop-dependencies.json`に保存する。


## レビューR1対応 — ジェネレーター0.2.1

- 0.2.0全体ZIP（SHA256 `c2c5b1a2583334a717d85bbe9dd1cdcc78689d374d48f5d52247c52e7f30bb0b`）から別フォルダを作成した。旧全体ZIP・CLI・GUIおよび配布済みソースは変更しない。固定7テンプレートZIPとテンプレートソース・adapterも同一bytesを維持する。
- 修正前の実PTYで、詳細設定がnへ戻るR1に加え、SQL用途が画面作成へ戻る経路、ViteがNextへ戻る2経路を再現した。製品変更はwizardの現在値を使う既定値と、同じ用途で互換な構成を維持する処理に絞る。新しい用途を明示選択し、旧構成がその用途にない場合は新用途の先頭構成へ切り替える。
- 詳細設定nは生成requestから追加値を除く。stateの入力値は保持し、再びyを選んだ際の既定値に使う。空入力は現在値の保持として統一し、明示的なnを妨げない。
- 0.2.1へ版を揃えたため、catalog、共有コアの版定数、GUIの版表示・package metadataも更新する。GUIの操作ロジック・依存グラフは維持し、更新した実配布物で版・隔離設定・6構成plan一致・F2生成の影響確認を行う。0.2.0の全GUI受入やDev Container試験を今回の実行実績に含めない。
- planはgeneratorVersionとcatalog hashも検査するため、0.2.0で保存したplanを0.2.1へ持ち越す操作は再planが必要になる。版をまたぐplanIdの一致は要件にしない。同じ0.2.1内ではGUIとCLIのplan全体の一致を確認する。
- ソース版と別パスへ展開したCLI ZIPで、同じ8ケースを通常のPTY・通常の診断処理で実行する。F2の保持後の.env・START_HERE、S2の全ポート、n/y切替、目的変更、中止の無書込み、SIGINT130を確認。既存21試験とIPC2試験も再実行する。
- 最終配布には試験済みのCLI ZIPと固定テンプレートZIPの同一bytesを含める。GUIバイナリはローカルdistで保持し、全体ZIPにはmanifestを含める。全体ZIP自身のhashと読戻し検査結果を外側へ置き、自己参照を避ける。

## ツクハコ 0.3.0

- 基点は0.2.1全体ZIP（SHA256 `ae3eb21fdfcb3fe696e96d7bec9e0eace5d0abc90544fe828d5160a3dc544e24`）。別の`tsukuhako-starters-0.3.0/`へ展開して作業した。旧版の3配布物・配布ソース394ファイル、継承した検証資料952ファイルを比較し、同一bytesを確認する。全体パック用の現行`validation/package-audit.json`だけは新版の集計へ更新する。旧REPORTは`validation/brand-0.3.0/BASELINE-REPORT.txt`へ保持する。
- アプリ、実行ファイル、package、preload、IPC、app URL、worker、stage prefixをセットで変更した。CLIの既存契約と6 APIの境界を維持し、案内文のための任意ファイル読出しAPIを追加しない。改名のためのログインや通信も追加しない。
- Electronの名前は`ツクハコ`、通常プロファイルはappData下の`tsukuhako`に揃える。明示された`--user-data-dir`は尊重し、sessionDataも対応する場所にする。旧アプリや旧プロファイルは削除しない。公式の[app API](https://www.electronjs.org/docs/latest/api/app)で名前とパス設定を確認し、実配布GUIのapp名・userData・sessionDataを実測した。
- 開いた箱とブロックのSVGをコードで作り、同じマークからローカルでPNGアイコンを作成した。外部画像・フォントを取り込まず、4画面に指定コピー、配色、16px本文、14px補足を適用する。860×680では縦スクロールと折返しを使う。[BrowserWindow](https://www.electronjs.org/docs/latest/api/browser-window)と[nativeImage](https://www.electronjs.org/docs/latest/api/native-image)の公式仕様も参照した。
- 用途説明は実際の同梱内容に合わせる。F2に業務API・DB、S2にクラウド公開・利用者認証が付属するとは書かない。F2を初期候補にしつつ、同じ用途を再選択しても利用者のVite選択を戻さない。完成画面は保存先を一度大きく示し、「起動手順を見る」を主操作にした。
- 6構成の案内を準備、起動、変更前、編集、反映、復元、既存教材の順で作る。選択したポートをURLへ反映し、実際のソースと第1演習へ相対リンクする。B1は返却JSONの契約試験が復元前に失敗する点、I1はSQLファイルの保存後に再実行する点を明記する。
- F1/B1/S1/S2を0.1.2、F2/S3を0.1.1にした。F2の実画面で旧フッター版を見つけ、0.1.1へ修正したうえでF2 ZIP、CLI、GUIを再作成し、最終配布から生成・起動を再確認した。変更前の途中結果は`pre-footer/`へ分ける。I1 ZIP・ソース28ファイル、adapter10ファイルは維持する。依存グラフ、Docker/Supabase識別子、.envのキー、固定runtime imageタグは変更しない。
- 初回のテンプレート試験は裸のNode imageのnpm11.19.1で版確認に失敗した。実際のテンプレートDockerfileを使って固定npm11.17.0で再実行し、製品側の固定条件は緩めなかった。別の初回試験で、既存先エラーの日本語変更により古い正規表現だけが不一致になった。既存試験を構造化エラーコードの検査へ改め、21件すべてを確認した。
- F2/S2の初回起動はホストのDockerアドレスプール枯渇で失敗した。利用者から全体リセット・再構築の許可を受け、資源を調査して停止済みコンテナ35個と不要ネットワーク27個を削除した。稼働DB2件と既存volume76個、イメージ、Docker設定は保持。復旧用メタデータは配布外の所有者専用ディレクトリに保存した。その後は通常の自動割当ネットワークで起動でき、独自subnetの回避策は不要になった。製品の通常手順へ全体削除を加えない。
- 最終GUIのPATHにはcksumだけを置き、ホストNode/Docker/Codeなしで実ウィンドウの生成を確認。sandbox、contextIsolation、送信元検査、静的配信allowlistを維持する。テスト側もChromium sandboxを有効にして起動する。
- T10の実動確認は最終GUIから生成したF2の同一フォルダ・同一START_HEREを使用し、Dev Container CLIと実ブラウザで見出し変更、HMR反映、元のbytesへの復元まで実行した。S2は最終CLIから別識別ラベルで生成し、新規DB volume・seed2件の表示を確認。実VS Code UIでのReopen・再接続・Rebuild、他OS、初学者試用、実クラウドはこの成功から推定しない。
- 全体ZIPは検証済みの7テンプレートZIPと単独CLIの同一bytesを含む。GUI tarはローカル保持し、全体ZIPにはmanifestを含める。最終の全体ZIP hashと読戻し検査を外側に置き自己参照を避ける。秘密設定、DBデータ、node_modules、生成用runs、cacheは含めない。古い記録・画像・スクリプトと現行成果を区別した残存一覧を同梱する。
- 試用記録と提供条件の下書きを用意した。開発者の技術検証、本人に役立つかの試用、購入の成立を別の確認として扱う。価格・支援条件・外部配布条件は未決定のままで、外部公開、利用者への連絡、購入、販売、npm公開は実施しない。

## 2026-10-21 / 0.4.0

最新依頼の0節のみを現在仕様とし、React/ElectronとNode共有コアを継続。教材を同じウィンドウに統合し、本文の必要時読込・3章キャッシュ・読書再開を採用。外部ブラウザ中心案と会員Webサイト案は今回の実装から除外した。

Windows/WSL 2、macOS、Linuxの実行境界と準備診断を追加し、実機と自動fixtureを区別する。Windows/macOSのクロス配布物はUNVERIFIED。macOSの既存ホストスクリプト、とくにS2に残るLinux依存を対応済みと扱わない。原本0.3.0は保持し、0.4.0へR1のCLI README補足を適用する。

Brainへの公開・購入・会員サイト・メール送信・ドメイン操作は行わない。現行販売者画面と配布先は未確認/未決として、ローカル配布方式の掲載案のみ作る。

0.4.0追加検証でF1 HTTPテストの改名前タイトルを発見。アプリ・依存を変えず期待値を修正し、F1 0.1.3の新しいZIPを発行する。旧0.3.0配布と旧F1 0.1.2は保持する。診断中の終了はbefore-quitも含め所有子処理の停止を待つ。
