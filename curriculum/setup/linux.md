# Linuxの準備

初期目標はUbuntu系 x86_64です。Linux Mintの結果をUbuntu実機合格に置き換えません。

## Docker Engine + Compose

[Docker公式Ubuntu手順](https://docs.docker.com/engine/install/ubuntu/)で対象ディストリビューションを確認し、EngineとComposeプラグインを導入します。Mint等の派生版では公式対象と差があります。既存環境は消さず、提供元の案内と合わせて確認してください。EngineにDesktopのVM・KVMは不要です。

[Linux導入後の設定](https://docs.docker.com/engine/install/linux-postinstall/)を読み、普段の一般ユーザーでDockerへ接続します。dockerグループは高い権限を与えます。ツクハコはグループを変更しません。常時sudoやchmod 666によるソケット開放を解決策にしません。設定後にログアウト・ログインが必要な場合は、戻って再診断します。

rootlessやDocker Desktopを使っている場合は自動置換しません。テンプレート適合性は別途未確認として扱います。[接続先とcontext](https://docs.docker.com/engine/manage-resources/contexts/)を確認してください。

## VS Code

[Dev Containers公式ガイド](https://code.visualstudio.com/docs/devcontainers/containers)に沿ってVS Codeと拡張を用意します。生成後にReopen in Containerを選び、初回ダウンロード完了を待ちます。

アプリ左の「準備チェックへ戻る」→「もう一度確認」で結果を更新します。

[再確認と復旧](lesson:setup/trouble)
