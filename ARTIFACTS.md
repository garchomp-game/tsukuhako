# 配布物 0.4.0

SHA256は整合確認用です。GUIはこの表のファイルを別途使用します。レビューZIPにはGUI本体を含みません。

|ファイル|容量 MiB|種類・実行確認|SHA256|
|---|---|---|---|
|F1-0.1.3.zip|0.06|template / catalog記載の範囲|`12fe4bc2bf113e006a7bb7f68ed595920e9a8aa435e55bcf51a990d1464b0d8a`|
|F2-0.1.1.zip|0.07|template / catalog記載の範囲|`7a093c2bf9292bfbdcb1fc06178bdd0c14ac5e14b3ef6b51bf5676b7ce1ba0fe`|
|B1-0.1.2.zip|0.08|template / catalog記載の範囲|`98e0add9dbca84ce3f9a153840158d874e860dac50fb68cb40e9b6e12cbb56c6`|
|S1-0.1.2.zip|0.09|template / catalog記載の範囲|`94e55d547b8971e3263eabd99da386018e7a9cd9662872ba46515900c088f714`|
|S2-0.1.2.zip|0.10|template / catalog記載の範囲|`04266262b25b930a586558856457ec8a36f0c6f7127533cb05fa68d56de29e8e`|
|I1-0.1.0.zip|0.03|template / catalog記載の範囲|`2861fea034ced0baf1dd484f78c19be8bbfbb2ccc8ac8c880e0ec3f5e989e398`|
|S3-0.1.1.zip|0.08|template / catalog記載の範囲|`67d957665a0ab61b26390c3b4bd79e346f3a9acb31cf041997c0f61e256c7891`|
|tsukuhako-generator-cli-0.4.0-linux.zip|0.69|CLI / PASS (Linux Mint x64)|`557e0ad6d4c8d571eca717652c37491d84a87240c0829a9664802b5a0f67741c`|
|tsukuhako-linux-x64-0.4.0.tar.gz|118.18|GUI / PASS (Linux Mint x64)|`7c95597a3113e5ab5ca1e1bbd8061856f4c5e05083cc1d0cbeada9db9ad89b48`|
|tsukuhako-win32-x64-0.4.0-UNVERIFIED.zip|194.86|GUI / NOT_RUN|`b0af4bc7086a03be0947dc09765dd3fe8c0ca5c4f259f1f9d6b04ac6aa508817`|
|tsukuhako-darwin-x64-0.4.0-UNVERIFIED.zip|128.84|GUI / NOT_RUN|`6202f62aea9b6b9ff71b5a358a1abe5bfa771962227a5bc9642c75d72fee600a`|
|tsukuhako-darwin-arm64-0.4.0-UNVERIFIED.zip|125.12|GUI / NOT_RUN|`288cd40c7d24488c40d0e3f5e74f2bc403a41a6e1b2ae770d82cebc221d2e689`|

Windows配布はLinux x64用Node 24.19.0＋共有core＋テンプレートを約121.8 MiBのtarで同梱（ZIP圧縮後の全容量は上表）。Node LICENSEとElectron/React/Markdown依存ライセンスを保持しています。更新は新しい配布物を受け取り、ヘルパーを版別領域へ置く方式です。常駐自動更新はありません。

ソースZIPとレビューZIP自身のhashは外側のmanifestとSHA256SUMS-0.4.0.txtに記録します。自己参照するhashを文書内へ埋め込みません。
