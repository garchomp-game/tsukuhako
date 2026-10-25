# RPMのビルドと検査

利用者向けの操作は [INSTALL.txt](INSTALL.txt) を参照してください。このページは開発者向けです。

## 作成

Node.js・Dockerが動くLinux x64上で、共通の `dist/desktop-app` をclean commitから用意してから実行します。

```sh
node tools/linux-rpm/build.mjs
node tools/linux-rpm/inspect.mjs dist/linux-rpm/tsukuhako-linux-x86_64-1.0.2.rpm
```

`build.mjs` はNode 24.19.0 / Debian Bookwormベースの専用コンテナーにRPMツールを用意します。ホストへのrpmパッケージ導入は行いません。共通stage・node_modules・設定の最小コピーをread-onlyで渡し、コンテナー内でコピーして作成します。ホストのHOME、Docker socket、既存プロジェクトの設定は渡しません。出力先は `dist/linux-rpm`、既存の同名RPMは上書きしません。

検査ツールは専用コンテナーでRPMメタデータ・依存・保守スクリプト・所有者を読み、展開した本体の教材・テンプレート・ライセンスのハッシュを照合します。デスクトップを起動する検査ではありません。

## ディストリビューション別の導入確認

```sh
node tools/linux-rpm/container-check.mjs --rpm dist/linux-rpm/tsukuhako-linux-x86_64-1.0.2.rpm --image rockylinux:9 --evidence validation/oss-1.0.2/rpm/rocky9
node tools/linux-rpm/container-check.mjs --rpm dist/linux-rpm/tsukuhako-linux-x86_64-1.0.2.rpm --image registry.fedoraproject.org/fedora:44 --evidence validation/oss-1.0.2/rpm/fedora44
```

それぞれ隔離コンテナー内で依存の取得、導入、ELF共有ライブラリ解決、簡易旧版fixtureからの更新、削除、再導入を確認します。ユーザーデータ保持は試験用ファイルによる確認です。実際の旧版データ移行、GUI起動、実機SELinux、Dev Container起動の代わりにはなりません。コンテナーは検査後に削除し、OSイメージのdigest・結果を保存します。

RPMの `%postun` は更新中にも呼ばれるため、専用削除スクリプトは最終削除（引数0）だけ実行します。これにより更新した本体の起動リンクが旧パッケージの削除処理で消されるのを防ぎます。参照：[RPM scriptlets](https://rpm-software-management.github.io/rpm/man/rpm-scriptlets.7)、[electron-builder RPM設定](https://www.electron.build/docs/api/app-builder-lib.interface.rpmoptions/)。

## 配布

```sh
node tools/linux-rpm/deliver.mjs dist/linux-rpm/tsukuhako-linux-x86_64-1.0.2.rpm dist/delivery-rpm-1.0.2
```

単体RPM、`INSTALL-linux-rpm.txt`、`manifest-linux-rpm.json`、`LICENSE`、`SHA256SUMS`を新しいフォルダーへ出します。GitHub ReleaseにはWindows・debと同じ版を並べ、全成果物をまとめた `SHA256SUMS` を生成します。署名は行っていません。
