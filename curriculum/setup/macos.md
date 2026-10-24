# macOSの準備

macOSは今回の初回配布対象外です。この章は後続対応の参考として保持しています。実機未確認です。

## Dockerを使えるようにする

[Docker Desktop公式導入先](https://docs.docker.com/desktop/setup/install/mac-install/)でCPUに合う版と対応macOSを確認し、Dockerを起動して利用条件を確認します。すべての利用条件で無料とは限りません。amd64エミュレーションをツクハコが強制することはありません。

## VS Codeを使えるようにする

[VS Code macOSガイド](https://code.visualstudio.com/docs/setup/mac)から導入します。

## VS Codeへ必要な機能を追加する

VS Codeの「拡張機能」でMicrosoftのDev Containers拡張を追加します。GUIのPATHにcodeがなくても既知のApplications内を調べます。シェル設定は書き換えません。

## メモを保存する画面の追加準備

生成処理はmacOS用アダプターを備えますが、既存テンプレートのホスト用bashスクリプトにはGNU coreutilsやLinux向け依存があります。特に「メモを保存するWeb画面」のSupabase起動手順はLinux専用です。macOS実起動・全依存の適合は未確認のため販売対象として合格にしません。準備画面の制限を確認してください。

アプリ上の「準備チェックへ戻る」→「もう一度確認」で結果を更新します。

[再確認と復旧](lesson:setup/trouble)
