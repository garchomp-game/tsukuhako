# F2 — Next.jsで画面をつくる

2ページの移動と、入力を表示する練習です。Next.js App Router、TypeScript、Tailwindを使います。このサンプルには独自APIやDBを含めません。Next.jsはAPIやサーバー処理も扱えるフレームワークですが、F2では画面の学習に絞ります。

## 最短起動

前提はDocker/Compose、VS CodeとDev Containers拡張、ホストのbashです。初回導入は [docs/SETUP.md](docs/SETUP.md)。ホストNode/npmやクラウドアカウントは不要です。

1. ZIPを新しいフォルダへ展開し、そのフォルダをホストのターミナルで開きます。`bash scripts/configure.sh`、続いて `bash scripts/doctor-host.sh`。診断OKとURLが出れば次へ。ポートを変える場合は初回に `bash scripts/configure.sh --port 3301` とします。
2. VS Codeでそのフォルダを開き、コマンドパレットから **Dev Containers: Reopen in Container**。初回の依存復元が終わり「準備完了」と表示されるまで待ちます。
3. **コンテナ内のVS Codeターミナル**で `npm run dev`。Readyが出たらホストのブラウザで **http://localhost:3001**（変更時は.envのHOST_PORT）を開きます。
4. 「練習画面へ」を選び「つくりたいもの」に入力します。下のカードが同時に変われば成功です。「クリア」で消え、再読込でも入力は消えます。
5. `app/page.tsx` の見出しを一つ変更して保存します。サーバーを再起動せずトップページに変更が反映されることを確かめます。

## 検証と日常操作

コンテナ内で `npm run check` はESLintと型確認、`npm test` はHTTPで2ページと404を確認、`npm run build` は本番向けビルドです。画面試験は初回・コンテナ再作成後に `npm run test:setup` の後 `npm run test:browser`。テストは別サーバーを起動するので、先に開発サーバーをCtrl+Cで止めます。診断は `npm run doctor`。VS Codeのタスクにも同じ入口があります。

停止・再開・再構築は [docs/RECOVERY.md](docs/RECOVERY.md)、構成は [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)、変更演習は [docs/EXERCISES.md](docs/EXERCISES.md)、空フォルダからの組立ては [docs/BUILD-YOUR-OWN.md](docs/BUILD-YOUR-OWN.md) を参照してください。

別コピーは.envを含めず別フォルダへ展開し、例として `bash scripts/configure.sh --port 3301`。識別名とホストポートの両方を分けます。内部portは3000です。ホスト公開は127.0.0.1のみで、リモート接続基盤はここでは構築しません。

版はVERSION.json、検証範囲はVALIDATION.md。GitHub Actions設定は同じコマンドを呼びますが、実際のGitHub上の実行は別の検証項目です。
