# Linuxの準備

この章はツクハコを開いたあと、サンプルを動かす準備が不足していたときに使います。Linux x64向けです。Debian・Ubuntu系にはdeb、Fedora・Rocky Linux系にはrpmを使います。パッケージの導入検査と実際のデスクトップでの動作確認は別です。確認したOS・範囲は配布ページで確認してください。

ファイルは先に作れます。生成される `.devcontainer` は開発環境の設定ファイルです。PC本体のDocker・VS Code・拡張機能は別に用意します。初回の環境作成と依存ファイルの取得にはインターネット接続が必要です。

## Dockerを使えるようにする

操作する場所：PCの通常のターミナル。プロジェクトの中でなくても構いません。

1. Dockerが未導入の場合は、Docker公式の[Ubuntu](https://docs.docker.com/engine/install/ubuntu/)・[Debian](https://docs.docker.com/engine/install/debian/)・[Fedora](https://docs.docker.com/engine/install/fedora/)・[RHEL](https://docs.docker.com/engine/install/rhel/)からOSに合う手順を選び、必要なEngineとComposeプラグインを確認します。Linux Mintは派生版で公式サポート対象外のため、Mintの版と既存環境に合う案内も確認してから導入します。
2. 導入済みで停止中の場合は、使っているDockerを起動します。接続先や権限の設定不足は未導入とは別です。[Linux導入後の設定](https://docs.docker.com/engine/install/linux-postinstall/)で一般ユーザーからの接続を確認します。
3. 次の2つをそれぞれ実行します。

```sh
docker version
docker compose version
```

確認する結果：最初のコマンドでClientとServerが表示され、次のコマンドでComposeの版が表示されること。

できないとき：診断の理由を読み、[準備で困ったとき](lesson:setup/trouble#dockerへ接続できない)へ進みます。グループの設定後はログアウト・ログインが必要な場合があります。Dockerグループは高い権限を与えるため、設定内容を理解してから行います。ソケットを誰でも書けるようにしたり、常にsudoでツクハコを動かしたりしないでください。既存Dockerの入れ替え・削除はこの手順では行いません。

## VS Codeを使えるようにする

操作する場所：PC本体。

1. 未導入なら[VS CodeのLinux向け案内](https://code.visualstudio.com/docs/setup/linux)を開き、PCに合うパッケージを導入します。
2. アプリ一覧からVisual Studio Codeを開きます。ローカルのサンプルを動かすためのサインインは不要です。

確認する結果：VS Codeの編集画面が開くこと。

できないとき：導入先と起動時の表示を確認し、ツクハコへ戻って「もう一度確認」を押します。診断が「確認できない」の場合は未導入と決めつけず、詳細の理由を確認します。

## VS Codeへ必要な機能を追加する

操作する場所：PC本体のVS Code。

1. 左側の「拡張機能」を押します。キーボードでは `Ctrl+Shift+X` で開けます。
2. 検索欄に `Dev Containers` を入力します。
3. 発行元がMicrosoft、識別子が `ms-vscode-remote.remote-containers` の拡張機能を選び、「Install」（インストール）を押します。
4. インストールが終わるまで待ちます。再読み込みを求められた場合はVS Codeの案内に従います。

確認する結果：拡張機能の画面でインストール済みになり、「Install」の代わりに無効化・アンインストールの操作が表示されること。

できないとき：[VS Code公式の拡張機能ガイド](https://code.visualstudio.com/docs/configure/extensions/extension-marketplace)で接続や組織の制限を確認します。

**ここまでできたら**、ツクハコ上部の「準備チェックへ戻る」を押し、「もう一度確認」で状態を更新します。手順を読んだだけでは診断結果は変わりません。

## メモを保存する画面の追加準備

この構成を選んだ場合だけ、Linuxホストで使う追加コマンドを診断します。未導入と表示されたコマンド名を診断の詳細で確認し、[この構成の準備手順](lesson:S2/setup)を読みます。導入する場所はPC本体のLinuxで、開発コンテナーの中ではありません。教材から戻ったら同じ構成で「もう一度確認」を押してください。

## 次に行うこと

生成済みなら「今回の起動手順へ戻る」から、今回の保存先が入った手順に戻ります。まだ生成していなければ作る画面へ戻ります。準備チェックの成功は、コンテナーの起動やサンプル表示の成功とは別です。

[準備で困ったとき](lesson:setup/trouble) · [サンプル表示の流れ](lesson:guide/first-run)
