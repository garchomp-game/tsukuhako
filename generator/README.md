# ツクハコ generator — 0.4.0

自分のPCでWebの作品を作り始めたい人へ。目的に近い構成を選んで新しいプロジェクトを作り、起動して一か所変えるまでを`START_HERE.md`で案内します。提供：おとか。

Linux x86_64で確認した対話CLIです。Node22以上が必要です。生成に使うPOSIX cksum互換計算は共有コア内で行います。Docker・VS Code＋Dev Containers拡張は生成後の起動に必要で、初回のイメージ・依存取得にはネット接続を使います。既存テンプレートのホスト用スクリプトにはbash・GNUコマンド等が必要です。生成成功はコンテナの起動成功を意味しません。Windows/WSL、macOS/ARMの実測は未実施です。

単独CLI ZIPにはfflateとcatalog・固定ZIPを同梱し、生成時のnpm installやネット接続は不要です。全体ソースから使う場合だけ、`npm ci --prefix generator --ignore-scripts`を実行します。

```sh
node generator/cli.mjs wizard
node generator/cli.mjs list --json
node generator/cli.mjs doctor
node generator/cli.mjs plan F2 ../my-first-page --port 3409 --json
node generator/cli.mjs create F2 ../my-first-page --port 3409
```

作成後は生成先の`START_HERE.md`を開きます。F2はトップページの見出しを「わたしの練習室」に変え、ブラウザへの反映を確認して元へ戻す練習へつながります。

## 選べる構成

F1は入力と表示、F2はページの見出し・表示、B1はJSONを返すAPI、S1は画面からAPIへの送信、S2はローカルDBへのメモ保存、I1はSQLの練習です。S3は参考資料で、生成対象外です。用途・含むもの・含まないものは`list`やwizardに表示します。クラウド公開、利用者認証、個別サポートは付属機能として約束していません。

## 入力と生成の契約

wizardは目的→保存先→確認→生成の順です。`:back`で戻る、`:cancel`で生成前中止。用途・Next/Vite・詳細設定の現在値が、戻った際の既定値になります。詳細設定yは`[Y/n]`と表示され、空入力でラベル・ポート・S2のDB開始値を保持します。明示的なnで標準設定へ戻せます。再びyを選ぶと入力済みの値を使えます。同じ用途で互換な構成を保持し、別用途へ変更した場合はその用途の初期候補を使います。非TTYでは質問待ちしません。

親フォルダは実在する場所、新しい子フォルダはまだ存在しない名前にします。先頭`~/`をホームへ展開し、子フォルダは1要素です。日本語・空白を使えます。識別ラベルは英小文字開始の英小文字・数字・ハイフン1〜25文字です。空フォルダも上書きせず、symlink親には実体のパスを指定します。

ポートは1024〜65535。S2のDB開始ポートは最大65532で連続4個を使います。例：

```sh
node generator/cli.mjs create S2 ../my-notes --port 3404 --db-base 54520
node generator/cli.mjs create I1 ../my-sql --port 55440 --json
node generator/cli.mjs doctor --scope generation
```

`plan`は書込みをせず、構成・版・保存先・ポート・ファイル一覧・次の手順とplanIdを返します。`create --expect-plan <planId>`は確認済み計画との一致を要求します。通常のcreateには確認待ちを追加しません。`--json`のstdoutは1つのJSONです。版やcatalogが変わった場合はplanを作り直します。

診断は生成準備と起動準備を分け、DockerやVS Codeの未準備だけで生成を止めません。未確認は成功を意味せず、ポートを予約しません。Docker起動・依存取得・VS Code起動はCLIが自動では行いません。

I1の秘密値はapply時に作り、権限0600の.envだけへ保存します。plan・JSON・案内には出しません。plan後の配布物・親・出力先の変化を再検査し、配置失敗時は今回作った未変更ファイルだけを戻します。編集済みファイルはPARTIAL_PRESERVEDとして場所を返します。配置全体は完全に原子的ではなく、強制終了後の残存物は手動確認が必要です。

終了コード：成功・生成前中止0、入力／条件／診断NG1、内部／書込失敗2、割込み130。引数なしdoctorは保存先未確認のため生成準備がnullになり、起動準備に失敗があれば1です。

互換API `create(root,id,destination,options)`は同期と既存の戻り値キーを維持します。GUIも同じplan/applyを使います。既存利用者のプロジェクト、Docker/DBの名前、.envを改名のために変更しません。fflateのMITライセンスを単独配布物に同梱しています。

## 制作側のテスト（全体ソース版向け）

次のコマンドは、テスト一式を含む全体ソース版向けです。単独CLI ZIPは実行用で、`generator/tests`を同梱していません。単独CLI ZIPで終了コード0になっても、回帰試験が実行されたことを意味しません。実行件数も確認してください。

```sh
npm test --prefix generator
```
