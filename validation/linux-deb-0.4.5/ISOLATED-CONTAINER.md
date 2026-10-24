# Linux deb 0.4.5：隔離環境での導入・更新・削除

2026-10-24 JST。**ISOLATED_CONTAINER / AUTOMATED：PASS**。最終debをUbuntuコンテナへ導入し、更新・削除・再導入・purgeを確認しました。所有者のPCへはインストールしていません。MintのCaptainやメニューを使う実機確認の代わりにはしません。

| 対象 | 値 |
|---|---|
| 最終ファイル | `tsukuhako-linux-amd64-0.4.5.deb` |
| bytes | `133466152` |
| SHA-256 | `665991ee388c71e9893f0f0da61b83eeacd1ce785f2ef7470dbcb7651c9c304a` |
| deb内の製品source | `bd006beb3dac5db2c18c1cf28e436cfc0dc3f643`、dirty=false |
| 製品・helper | 0.4.5 |
| 検証ツールsource | `68ca276f0b10fe73675b50ea4b1d7b0c5b7d0643` |
| 実行環境 | Ubuntu 24.04.5 LTS / noble / amd64の専用Dockerコンテナ |
| 最終実行時刻 | 2026-10-24 14:02:53〜14:04:36 JST |

検証ツールのcommitは `68ca276f0b10fe73675b50ea4b1d7b0c5b7d0643`。製品sourceと検証sourceは別です。[最終結果](isolated-container-final/result.json)に実ファイルSHA、検証ツール3本のハッシュ、イメージID、隔離設定、14個の完了チェックを記録しました。導入後の[build-info](isolated-container-final/container/build-info-final.json)も製品sourceと一致しています。

## 確認結果

事前にElectron用ライブラリ、Node、Python、GUI環境を入れていないUbuntu baseを使いました。最初のAPT導入は、debのDependsを使う `--no-install-recommends` です。取得したライブラリの一覧と版は[導入前](isolated-container-final/container/packages-before.tsv)・[導入後](isolated-container-final/container/packages-final.tsv)へ保存しています。

| 段階 | 結果 |
|---|---|
| 試験用下位版 `0.4.5~upgrade-test1` | 正常導入。依存をdebから解決 |
| 最終deb `0.4.5` で更新 | 正常更新。dpkgの版が0.4.5 |
| remove | 本体・desktop・アイコン・alternativeが除去された |
| 最終debを再導入 | 正常再導入。配置・版・依存が一致 |
| purge | 本体・登録情報を除去。保存用fixtureは保持 |

下位版は、最終debのアプリ内容を変えず、controlのVersionだけを下げた試験用パッケージです。過去に配布した製品からのデータ形式移行や互換性を試したものではありません。[fixture定義](isolated-container-final/container/upgrade-fixture.tsv)

3回の導入確認で、[ldd](isolated-container-final/container/ldd-final.txt)の未解決ライブラリは0です。GTKは`libgtk-3-0t64`、ALSAは`libasound2t64`、AT-SPIは`libatspi2.0-0t64`、GBMは`libgbm1`で解決しました。desktopは一件で、Name=ツクハコ、Icon=tsukuhako、Terminal=false、Execにsandbox無効化や昇格の指定がないことを確認しています。メニューの実表示は試していません。[desktop](isolated-container-final/container/desktop-final.txt)

本体はroot:root 0755、chrome-sandboxはこのコンテナ内ではroot:root 4755です。標準postinstのuser namespace試行がコンテナ内で拒否され、SUID側を選択した結果です。実機のAppArmorや通常ユーザーでのsandbox起動の確認結果ではありません。[権限](isolated-container-final/container/permissions-final.txt)

配置先全体を非特権の`thvalidator`ユーザーで調べ、書込み可能な項目は0でした。world-writeの項目も0です。rootグループだけに書込み可能な0664/0775のファイル・ディレクトリは別に記録しています。[実効権限](isolated-container-final/container/user-writable-payload-final.txt) / [world-write](isolated-container-final/container/world-writable-payload-final.txt) / [rootグループの記録](isolated-container-final/container/group-writable-payload-final.txt)

読書設定、生成プロジェクト、旧tar相当のファイル、Docker保存先を模したファイルの4つを各段階でSHA照合し、全て保持されました。これは保存位置を模したfixtureで、実ユーザー設定や実Docker volumeの試験ではありません。[照合対象](isolated-container-final/container/sentinels.sha256) / [全実行ログ](isolated-container-final/container-run.log)

## 初回停止と検証側の修正

[初回の結果](isolated-container/result.json)はFAILのまま保持しています。APT導入は成功しましたが、検査がgroup-writeとworld-writeを一律に拒否したため、root:rootの0664/0775を不適切に失敗扱いしました。検証ツールを、通常ユーザーの実効書込み権限とworld-writeの2項目へ修正しました。製品debは変更しておらず、両実行のSHAは同一です。後続の全手順は新規コンテナで最初から確認しました。[調整記録](isolated-container-final/harness-adjustment.json)

## 隔離と未実施

hostから渡したものは、最終deb一つのreadonly bind mountだけです。HOME、Docker socket、hostのAppArmor領域は共有していません。privilegedや追加capability、ホスト側のAPT/dpkg導入は使っていません。証拠を回収後、専用コンテナと固有イメージタグは除去し、最終debのSHAも再確認しています。既存2 DBコンテナは稼働・healthyのままです。[後片付けの確認](isolated-container-final/host-boundary.json)

**NOT_RUN：** Mint CaptainによるGUI導入・認証・取消、Mintのメニューからの通常起動、対象OSのAppArmor制限下でのsandbox起動、実際の旧版からの読書設定移行、実Docker volumeの保持、初心者による補足なしの完走、公開受取先からの取得。このレポートではアプリ自体を起動していません。

再現手順は[検証ツールの説明](../../tools/linux-deb/VALIDATION.md)にあります。最終配布manifestのdeb SHAは、このレポートと`result.json`のSHAに一致させてください。
