# プレビューAPIの契約

このAPIは状態を保存しません。B1はAPI専用、S1は同一オリジンの画面から呼びます。このフォルダだけで動き、別テンプレートへ参照しません。

## コンテナ内から呼ぶ

`npm run dev` を動かし、別のコンテナ内ターミナルで実行します。

```bash
curl -i http://localhost:3000/api/health
curl -i http://localhost:3000/api/preview \
  -H 'Content-Type: application/json' \
  -d '{"text":"  こんにちは  "}'
```

GET healthは200と `{"status":"ok"}`。POST previewは200と `{"text":"こんにちは","length":5}` を返します。ホストから呼ぶときはREADMEのホスト用ポートに変更します。

`text.trim()` に相当する前後の空白除去後、`Array.from(text).length` でUnicodeコードポイントを数えます。1〜200を許可します。例えば `😀` は1、結合文字付きの `é` は2で、見た目の一文字の数とは異なる場合があります。余分なJSON項目は結果へ反映しません。

|入力・操作|HTTP|JSON応答・動作|
|---|---|---|
|正常なtext|200|`{"text":"整えた文字列","length":数値}`|
|壊れたJSON|400|`{"error":{"code":"INVALID_JSON","message":"JSONを確認してください"}}`|
|text欠落・文字列以外|400|`INVALID_INPUT` / textには文字列を指定してください|
|trim後の空文字|400|`INVALID_INPUT` / 空白以外の文字を入力してください|
|trim後201コードポイント以上|400|`INVALID_INPUT` / 200コードポイント以内で入力してください|
|Content-Typeがapplication/json以外|415|`UNSUPPORTED_MEDIA_TYPE` / Content-Typeはapplication/jsonにしてください|
|定義のないメソッド|405|本文形式はフレームワークに委ねる|
|HEAD /api/health|200|Next.jsがGETから生成、本文なし|
|HEAD /api/preview|405|GETを定義していないため|
|OPTIONS|204|Next.jsがAllowヘッダーを返す。health: GET, HEAD, OPTIONS / preview: POST, OPTIONS|

エラーJSONは共通して `{"error":{"code":"...","message":"..."}}`。JSONのContent-Typeパラメータ（`application/json; charset=utf-8`）は許可します。メディアタイプ判定がJSON構文判定より先です。ヘルスチェックは秘密やホストの詳細を返しません。

## 失敗を自分で確認する

```bash
# 構文エラー → INVALID_JSON / 400
curl -i http://localhost:3000/api/preview -H 'Content-Type: application/json' -d '{"text":'
# 型エラー → INVALID_INPUT / 400
curl -i http://localhost:3000/api/preview -H 'Content-Type: application/json' -d '{"text":42}'
# メディアタイプ → UNSUPPORTED_MEDIA_TYPE / 415
curl -i http://localhost:3000/api/preview -H 'Content-Type: text/plain' -d 'こんにちは'
# 未対応メソッド → 405
curl -i http://localhost:3000/api/preview
```

エラー本文に例外やスタックを入れず、画面は利用者が直せる理由を示します。`<script>` を送っても文字列として扱い、HTMLとして実行しません。S1の入力中の状態はClient Component、検証処理はサーバーのRoute Handlerで行います。
