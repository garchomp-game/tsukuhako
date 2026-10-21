# 開発準備の全体像

教材はネット接続やDockerなしでも読めます。コンテナの初回起動・依存取得にはネット接続が必要です。

1. OS・CPUに合う準備手順を読む
2. DockerとVS Codeを準備する
3. 「作る」で「もう一度確認」を押す
4. 新しいフォルダへ生成する
5. 対応教材の「最初の一歩」へ進む

[Windows / WSL 2](lesson:setup/windows) · [macOS](lesson:setup/macos) · [Linux](lesson:setup/linux)

今回の初回配布対象はWindows 11 x64とLinux x64です。macOS・ARMは対象外です。Windowsの実機開発経路は未確認、Linuxの確認範囲はMint 22.3です。

## VS Codeを初めて開くとき

サインインはローカル学習には不要です。信頼確認では自分が生成したフォルダだけを確認します。左側の「拡張機能」でMicrosoftのDev Containers（ms-vscode-remote.remote-containers）を導入します。WindowsではMicrosoftのWSL拡張も必要です。

## 状態を分けて確認

ファイル生成済み、Docker利用可能、Dev Container起動確認済みは別の状態です。準備チェックの成功だけでは起動を保証しません。古い結果は現在の準備完了として使いません。

## 容量とメモリ

診断はOSの総メモリとHOMEの空き容量を表示します。Docker Desktopの割当と実際の不足は別です。全テンプレート共通の推奨容量は未測定です。起動失敗時はDockerログ、空き容量、OSのメモリ圧迫を確認してください。
