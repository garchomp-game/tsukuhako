# 画面・API・テストをつなぐ演習

コンテナ内で `npm run dev` を起動し、練習画面を開きます。

1. `app/practice/page.tsx` の見出しを「今日の便り」に変えて保存します。サーバーを再起動せずブラウザへ反映されることを確かめます。
2. `components/PreviewForm.tsx` に「差出人」の入力欄と状態を追加します。送信JSONに `sender` を加えるだけでは、既存APIは使いません。Network表示で送信と応答を比べます。
3. 新しい契約を先に決めます。例: senderはtrim後1〜30コードポイント。`lib/preview.ts` で型・空欄・上限を検証し、成功応答へsenderを含めます。既存textの規則も保持します。
4. 画面でsenderをテキスト表示し、`tests/api.test.mjs` に正常・欠落・空欄・上限のHTTP試験を加えます。`tests/browser/preview.spec.ts` の入力と表示も合わせて変えます。`docs/API.md` を更新します。
5. 開発サーバーを止めて `npm run check`、`npm test`、`npm run test:browser`、`npm run build` を実行します。

トップと練習ページはServer Componentです。入力・送信状態・クリック処理を持つフォームだけをClient Componentにしています。同一オリジンへの `fetch("/api/preview")` が、ブラウザの処理とサーバーの検証をつなぎます。

送信中は入力とボタンを無効化し、同期的なガードでも重複リクエストを防いでいます。前の結果を消して待機状態へ移るので、古い結果を新しい応答と取り違えません。`<script>` のような値もReactのテキストとして表示します。

通信失敗を手動確認するには画面を開いた後で開発サーバーを止め、送信します。接続確認の案内が出たら、サーバーを再開して再送信します。自動ブラウザ試験では通信を中断する仕組みで同じ表示を確認します。
