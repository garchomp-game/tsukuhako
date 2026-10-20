# fixture の作成方針

`tests/adapter.test.mjs` がテストごとに OS の一時ディレクトリへ架空の fixture を作り、終了時に自分の一時ディレクトリだけを削除します。実プロジェクトのコピーや秘密情報を同梱しません。

E01〜E11 は package/lock の最小メタデータ fixture です。これは npm install できる実アプリを装うものではなく、判定・保護・差分・取り消しの試験です。各テスト名に受入条件IDを付けています。

E12 は新規テンプレート F2 のアプリ部分を `validation/adapter/runs/` の専用作業フォルダへ複製し、そこへ adapter を適用して実際の Dev Container 作成・依存復元・HTTP利用・ソース変更反映を確認します。F2 の元フォルダや利用者の既存プロジェクトには適用しません。

## 0.1.1 の追加fixture

`tests/revision.test.mjs` はoptional依存と記録追記の回帰試験です。registry/OS限定/同名上書き、file/link/workspace/git/URL、解決情報不足を区別します。`.adapter-record.json` の userNote・整形変更・pending記録、通常の生成設定の編集保持を確認します。

完全lockを使うCLI試験は `validation/revision-0.1.1/adapter/` に分離しました。以前のE12で対応したNext/npmメタデータを用いた複製と、架空の兄弟helperを持つ複製です。fixture作成時だけnpmのpackage-lock-onlyを実行し、その後のinspect/preview/apply前後のhashを照合します。作業用runsや絶対パス付きplanは配布しません。
