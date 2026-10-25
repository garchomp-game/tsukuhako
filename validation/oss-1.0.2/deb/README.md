# Linux deb 1.0.2 の確認

同じ最終debを、公式のUbuntu 24.04とDebian 13の使い捨てコンテナーへ導入して確認した。両方PASS。最終ファイルのSHA-256は `9a6226a5696992c94f3731dd4f5ec7db083130c11845d1a2253cde5c5971b5f9`。製品ソースは `05b2a8f7671b6aab2ed73c80208552cf5bae4d07`、`dirty: false`。

| 確認環境 | 結果 | 証拠 |
| --- | --- | --- |
| Ubuntu 24.04 | PASS | [結果](ubuntu24/result.json) / [チェック](ubuntu24/checks.tsv) / [依存ライブラリ](ubuntu24/ldd-final.txt) |
| Debian 13 (trixie) | PASS | [結果](debian13/result.json) / [チェック](debian13/checks.tsv) / [依存ライブラリ](debian13/ldd-final.txt) |

確認したこと：パッケージ自身の依存宣言による依存取得、旧版番号fixtureから最終版への更新、削除、再導入、purge、各段階でのファイル所有者・権限・メニュー登録・ライブラリ解決、ユーザー設定・生成ファイル・旧portableコピー・Dockerデータ配置場所のfixture保持。専用コンテナーと検証イメージのタグは削除済み。ホストへパッケージを導入せず、ホストHOME・Dockerソケット・AppArmorをマウントしていない。

Debian 13ではt64の依存名が解決し、従来の非t64名との代替宣言を変更する必要はなかった。全量ログとパッケージ一覧はGit対象外の `../runs/deb-ubuntu24/` と `../runs/deb-debian13/` に保持する。

これはパッケージの導入ライフサイクル確認。デスクトップGUIからのインストール・メニュー起動、実際のAppArmor下でのsandbox、Dev Containerからサンプル表示までの通し操作は未確認。更新fixtureは版番号だけを下げた同じ最終アプリであり、過去版からの実データ移行確認ではない。Dockerデータも配置場所のfixtureであり実DBの試験ではない。

再実行例（新しい証拠保存先を指定）：

```sh
node tools/linux-deb/container-check.mjs --deb dist/linux-deb/tsukuhako-linux-amd64-1.0.2.deb --evidence validation/oss-1.0.2/runs/deb-ubuntu24-repeat --image ubuntu:24.04
node tools/linux-deb/container-check.mjs --deb dist/linux-deb/tsukuhako-linux-amd64-1.0.2.deb --evidence validation/oss-1.0.2/runs/deb-debian13-repeat --image debian:13
```

## 対象範囲の根拠

[Debian公式のrelease一覧](https://www.debian.org/releases/)で13がstableであることを確認した。[Electron 44.9.1のplatform support](https://github.com/electron/electron/blob/v44.9.1/README.md#platform-support)は、Chromiumと配布元がサポートしている主要Linuxを対象としている。パッケージ形式ごとの対象は[electron-builder v26のLinux資料](https://www.electron.build/v26/docs/linux/)を参照した。

現物のElectron 44.9.1本体をreadelfで調べた最大GLIBC要求は2.25、同梱の共有ライブラリ・crashpadは2.17以下だった。これはバイナリ要件の一部であり、Linux各版のGUI動作を保証するものではない。実際の依存解決結果は各環境のldd証拠を参照する。
