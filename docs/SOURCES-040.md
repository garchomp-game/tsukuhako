# 0.4.0 実装判断の一次資料

確認日：2026-10-21 JST。以下の仕様・手順を参照した。公式文書はツクハコの動作保証ではない。版・実機合否はREPORTと検証記録で管理する。

- [Electron Performance](https://www.electronjs.org/docs/latest/tutorial/performance)：必要時の読込、mainを塞がない処理、計測。
- [Electron Security](https://www.electronjs.org/docs/latest/tutorial/security)：sandbox・contextIsolation・送信元/URL検査を保持。
- [WSL basic commands](https://learn.microsoft.com/en-us/windows/wsl/basic-commands)：版・状態・distroとユーザーを明示した起動。通常操作で全WSLのshutdownを使わない。
- [WSL filesystems](https://learn.microsoft.com/en-us/windows/wsl/filesystems)：Linux開発先をWSLのLinuxファイルシステムへ置く。
- [VS Code WSL](https://code.visualstudio.com/docs/remote/wsl)：Windows版CodeとWSL拡張、remote / folder-uri、初回Server取得。
- [VS Code CLI](https://code.visualstudio.com/docs/configure/command-line)：本体・拡張の確認とフォルダ起動。
- [Docker WSL backend](https://docs.docker.com/desktop/features/wsl/)：WSL 2連携、Linux containers、Docker側の前提条件。
- [Docker contexts](https://docs.docker.com/engine/manage-resources/contexts/)：DOCKER_CONTEXT / DOCKER_HOSTを考慮した有効接続先の確認。
- [Docker macOS](https://docs.docker.com/desktop/setup/install/mac-install/)：CPU別配布、サポートOS、利用条件と初回起動。
- [Docker Ubuntu](https://docs.docker.com/engine/install/ubuntu/)：UbuntuとMint等の派生版を同一の公式対応と扱わない。
- [Docker Linux postinstall](https://docs.docker.com/engine/install/linux-postinstall/)：一般ユーザー、dockerグループの権限。
- [Node 24.19.0公式配布](https://nodejs.org/dist/v24.19.0/SHASUMS256.txt)：WSL用Linux x64 runtimeのアーカイブSHA256照合。Node同梱LICENSEも配布。
- markdown-it 15.0.3の公式npm配布ソースと型定義を検査。html:falseでtokenをReact要素へ変換し、HTML文字列をDOMへ流し込まない。npm auditで0 vulnerabilities（取得時点）。

Brainは[公式サイト](https://brain-market.com/)の検索結果を確認したが、販売者の有料本文編集画面は接続ブラウザがなく未確認。旧FAQ・第三者記事を現行の編集機能の確認証拠にしない。
