# 0.1.1 追加レビューの検証

2026-10-20。判定器の実行は Linux Mint 22.3 / x86_64、Node 24.19.0 / npm 11.17.0。R1（optional依存）とP3（記録の編集保持）を変更前に再現し、変更後に再確認しました。前回の証拠は上書きしていません。

- E01〜E11 の既存17件と追加9件、計26件のテストが PASS。
- F2のアプリ・完全lockを複製した専用fixtureで、実npmが生成する `file:../local-helper` / `link: true` を確認。依存重複時にoptionalが優先されるlock形式も確認しました。
- 対象外fixtureの inspect は根拠付きmanual、preview/apply は拒否。CLIの前後でアプリ・package・lockと兄弟helperのhashが不変でした。
- 以前に対応していたNextのdev scriptを使うfixtureは、inspect/preview/applyと同内容の再適用が PASS。記録のuserNoteとDockerfileへの追記は undo 後も同じbytesで保持されました。
- registry optional とOS限定optionalはlockの解決版が整合すれば静的対応。file/link/workspace/git/直接URL、link解決、版不一致・解決版欠落は拒否します。optionalが実際に省略された場合のアプリ動作は別確認です。

fixture用lock作成だけに `npm install --package-lock-only --ignore-scripts --offline --engine-strict=false --no-audit --no-fund` を使いました。これはホストNodeの版差を許容してメタデータを作る専用試験で、adapterの読み取り処理や生成環境の設定には混ぜていません。依存のインストール・ライフサイクル実行はしていません。

今回の変更は判定・ファイル保護と生成imageタグ0.1.1で、基底イメージ・runtime・起動処理を変更していないため、Docker/ブラウザ実起動は再実行していません（今回 NOT_RUN）。VS Code実画面、Windows/WSL、macOS、実CI、利用者の実プロジェクトも NOT_RUN です。詳細と保護対象hashは `validation/revision-0.1.1/adapter/summary.json` にあります。

## 0.1.0 の実測記録（履歴）

2026-10-20、Linux Mint 22.3 / x86_64、Docker 29.9.1 / Compose 5.6.0 / Dev Container CLI 0.89.0 で実行しました。判定器の制作側ホストは Node 24.19.0、生成したコンテナは Node 24.22.0 / npm 11.17.0 / Next 16.4.2、node uid=1000 です。

E01〜E11 の17件の fixture テストと構文確認は PASS。対応候補の根拠、異種検出、競合、無実行・無変更、適用範囲、古い提案の拒否、再適用、編集保持、失敗時 rollback、パス改変・symlink 保護を確認しました。省略された semver 比較子、`.env` の Compose 予約キー、引き継いだ Compose 環境変数による別構成への起動・停止も拒否します。秘密の値はレポートへ含めません。

E12 は専用の Next.js fixture 複製で PASS。実 CLI up と npm ci、非 root 接続、HTTP 200、Chrome 155.0.8059.84 でページ遷移・日本語/絵文字入力・クリア操作を確認しました。ソース変更は同じ browser document のまま反映され、手動 reload や server restart はしていません。変更したソースは戻しています。初回の build/依存取得を含む up は約24.8秒、最終ガード追加後の再開は約0.82秒です。基底イメージ等のキャッシュがあり、完全な無キャッシュ比較ではありません。

明示 apply と npm ci の後、Next dev 起動前に元の20ファイルの hash が全て一致することを確認しました。Next dev 自体が `next-env.d.ts` を通常の処理で更新したため、runtime 後の差分と adapter の適用時の差分は別に記録しています。利用者の実プロジェクトには適用していません。

実 VS Code 操作、Windows+WSL、macOS、利用者の実プロジェクトへの適用は NOT_RUN。GitHub への push や実 CI 実行は行っていません。試験コンテナは停止済みで、専用 volume/image は保持しています。

詳細は全体パックの `validation/adapter/results.json`、`commands.ndjson`、`logs/`、`apply-hashes-final.json`、`resources.json` を参照してください。提案ファイルの実体は作業場所を含むため配布時は除外し、共有ログではパスを置換します。
