# debの隔離検証

`container-check.mjs` は所有者のPCへインストールせず、専用のUbuntu 24.04コンテナだけでパッケージの導入・更新・削除を確認します。既存コンテナは操作しません。Dockerイメージ取得とコンテナ内のAPT依存取得には通信が必要です。

```sh
node tools/linux-deb/container-check.mjs \
  --deb dist/linux-deb/tsukuhako-linux-amd64-0.4.5.deb \
  --evidence validation/linux-deb-0.4.5/isolated-container
```

証拠ディレクトリは新規のものを指定します。debは一つのファイルだけを読み取り専用でマウントします。hostのHOME、Docker socket、AppArmor設定を共有せず、privilegedや追加capabilityを使いません。テスト対象コンテナと固有イメージタグは終了後に除去します。PC本体で`apt install`、`dpkg -i`、保護設定変更は実行しません。

UbuntuのbaseにElectronの依存ライブラリを先入れしません。最初のAPT操作はパッケージ一覧取得と、deb自身のDependsを使った`--no-install-recommends`導入です。Node/npm/PythonやGUI環境の追加もしません。

確認する順序は次のとおりです。

1. debのSHA・識別子・版・amd64、制御ファイルを記録する。
2. 同じアプリ内容のままパッケージのVersionだけを`~upgrade-test1`へ下げた試験用debを作る。
3. 試験用下位版を導入し、0.4.5の実debで更新する。
4. remove、実debの再導入、purgeを行う。
5. 各段階でdpkgの状態、実行ファイルとdesktop/icon/alternative、sandboxのroot所有とモード、非特権ユーザーによる配置先書込み不可、`ldd`に未解決ライブラリがないことを確認する。
6. 読書設定・生成プロジェクト・旧tar相当・Docker保存先相当の4つのfixtureファイルが保全されることをハッシュで確認する。

`result.json`のinput SHAが、最終配布manifestのdeb SHAと一致することを統合時に確認します。ソースcommitと検証ツールのハッシュ、Ubuntu環境、導入前後のパッケージ版、保守スクリプト、APT実行ログも残ります。fixtureのdeb本体は証拠へ持ち出しません。

この試験の分類は **ISOLATED_CONTAINER / AUTOMATED** です。下位版fixtureは過去製品の再現ではなく、読書設定ファイルもデータ形式の互換試験ではありません。Docker相当のファイルは位置を模したsentinelで、実Docker engine/volumeは使いません。AppArmorの実機ロード・Electron sandbox起動・Captainの管理者認証や取消・Mintメニューからの起動・F2完走はこの試験から合格にしません。所有者の通常PCへ先回りしてインストールしません。
