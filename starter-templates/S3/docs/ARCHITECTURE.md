# 読取りと権限の構成

ホストのブラウザ → 127.0.0.1:3000 → Dev ContainerのNext.js:3000 → 設定したSupabase RESTの順で接続します。localhostはホストとコンテナで異なります。SupabaseのクラウドURLはHTTPSで外部へ接続する宛先です。ローカル検証ではlocalhost HTTPも受け付けます。

page.tsxはServer Componentで、設定・取得・安全なエラー表示を担当します。lib/catalog.tsはキー/URLの検証とGETだけの読取りを行います。実キーをクライアントpropsやNEXT_PUBLIC変数に入れません。ブラウザに届くのは公開商品の表示と案内だけです。公開キーでSELECTできない場合も強いキーに切り替えません。

SQLはlearning_productsにRLSを有効化し、anonへSELECTだけをgrantします。SELECT policyはis_public=trueの行だけを許可します。INSERT/UPDATE/DELETEはgrantもpolicyもありません。S2のローカル匿名CRUD設定を流用していません。

|保存対象|場所|停止/再構築|
|---|---|---|
|ソース・教材|ホストの展開フォルダ|保持|
|依存・npmキャッシュ|プロジェクト別named volume|保持しnpm ciで復元|
|接続設定|.env.local（配布対象外）|保持|
|クラウドの公開データ|利用者の専用プロジェクト|このアプリの停止/再構築では変更しない|
|SQL試験データ|一時コンテナのtmpfs|試験終了で消える|

Cloudの疎通が未提供でもローカルの型・ビルド・入力設定・失敗分岐・SQL権限の試験は可能です。ローカル成功を実クラウド接続の成功とは数えません。
