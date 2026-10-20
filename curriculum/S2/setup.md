# 最初の準備（ホストで行う）

ここではDockerとVS Codeをまだ入れていない場合の道筋を説明します。導入済みPCでの試験と、未導入PCからの導入試験は別です。実測はVALIDATION.mdを確認してください。

1. Windowsでは管理者PowerShellで `wsl --install` を実行し、再起動とLinuxユーザー作成を終えます。[Microsoft WSL公式手順](https://learn.microsoft.com/windows/wsl/install)で要件を確認します。
2. [Docker DesktopのWindows手順](https://docs.docker.com/desktop/setup/install/windows-install/)に沿って導入し、WSL integrationを使うディストリビューションで有効にします。Docker EngineをWSL内に別途重複導入しません。利用条件は公式で確認します。
3. [VS Code](https://code.visualstudio.com/)とMicrosoftのWSL / Dev Containers拡張を入れます。WSL内の `~/projects/` に展開し、WSLターミナルから `code .` で開きます。`/mnt/c` は初版の推奨配置ではありません。
4. Linuxでは[Docker Engine公式手順](https://docs.docker.com/engine/install/)とCompose plugin、VS Code / Dev Containers拡張を準備します。ここに自動インストーラーは含めていません。dockerグループは強い権限を持つため組織・PCの方針に従ってください。
5. ホストのターミナルで `docker version` と `docker compose version` が成功することを確認し、READMEへ戻ります。ホストのNode/npmはテンプレート利用に不要です。bash、cksum、awk、sedが必要です。

初回はイメージとnpm依存をネットから取得します。完全オフライン起動は保証しません。macOS/ARM/Windows実機は検証記録に結果がある場合だけ検証済みです。

S2ではさらにcurl、tar、sha256sum、timeoutをホストで使います。Supabase CLI 2.121.0を公式GitHub releaseからこのフォルダだけに取得し、同梱checksumと照合します。システム全体にはインストールしません。補助スクリプトはLinux/WSL向けで、Linux amd64が実測対象です。Linux arm64の取得先は用意しますが実機未検証です。macOS/Windowsネイティブはこの初版の補助スクリプト対象外です。WSLの操作手順はWindows実機試験の合格を意味しません。
