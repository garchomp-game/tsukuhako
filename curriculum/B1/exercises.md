# APIとテストを一緒に変更する

コンテナ内で `npm run dev` を起動し、別ターミナルから `docs/API.md` のcurlを実行します。

1. `app/api/health/route.ts` の応答へ `"lesson":"preview"` を一時的に追加します。保存後、再起動せずcurlを再実行し、新項目が返ることを確かめます。
2. 開発サーバーを止めて `npm test`。既存のhealth契約テストが失敗する理由を読みます。応答を変えたので、期待値の契約も更新する必要があります。
3. `tests/api.test.mjs` のhealth期待値を更新し、`npm test`、`npm run check`、`npm run build` を実行します。`docs/API.md` の契約も同じ内容に更新します。
4. `lib/preview.ts` へ入力を大文字化した `upperText` を追加する演習に進みます。正常応答の型・HTTPテストを合わせて変え、日本語と英字で違いを確かめます。元の文字列をHTMLとして解釈する処理は追加しません。

JSONの形、HTTPステータス、利用者向けエラーの三つを対応させます。APIだけの構成にはReactの画面やTailwindの設定は不要です。Next.jsは画面とAPIの両方を扱えますが、ここではRoute Handlersの役割に絞っています。

演習を戻すときは変更したソース・テスト・教材だけを元に戻します。DBがないので、コンテナ再構築で消すべき学習データはありません。
