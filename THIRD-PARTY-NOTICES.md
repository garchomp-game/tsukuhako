# ライセンスと第三者のソフトウェア

ツクハコのオリジナルのコード・教材・テンプレートには、リポジトリ直下の `LICENSE`（MIT）を適用します。リンク先のサービス・資料、依存ソフトウェアの権利をこのライセンスで変更するものではありません。

Linuxインストーラーには次のライセンスを同梱しています。

- ツクハコ：`resources/app/LICENSE`
- React / React DOM / Scheduler、Markdown処理の依存、fflate：`resources/app/third-party/`
- Electron：`LICENSE.electron.txt`
- Chromiumとその依存：`LICENSES.chromium.html`
- WSL用ヘルパー内のNode.jsとその依存：`resources/app/wsl-helper/helper.tar` 内の `Node-LICENSE`
- ヘルパーのオリジナルコード：同アーカイブ内の `LICENSE`
- 各テンプレートのオリジナルコード・教材：テンプレートZIP内、および生成したプロジェクト直下の `LICENSE` と `LICENSE-NOTES.md`

テンプレートのnpm依存やコンテナーOSは、開発環境を初めて起動した際に取得します。版は各テンプレートのlockfileやDockerfileに記録しています。これらの依存は各権利者のライセンスに従います。生成したアプリを配布する際には、そのアプリに含める依存のライセンス・表示義務も確認してください。
