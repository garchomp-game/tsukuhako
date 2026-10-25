# ツクハコ 1.0.2 — Windows・deb・rpm配布

Windows x64を主な配布対象にし、Linux x64向けdebとrpmを用意する。WindowsのCI検査、各Linuxコンテナーの導入検査、実機のGUI・WSL操作は別々に記録する。

## 変更

- WindowsのNSISビルドとCI smokeを現行UIに対応させ、公開用の案内とライセンスを同梱。
- RPMのビルド・検査・導入確認を追加。ホストにRPMツールをインストールせずコンテナーを使う。
- Debian・Ubuntuのパッケージ検査対象を選べるようにした。
- 内蔵初回ガイドをWindows/WSLとLinuxに対応。OSごとの準備・保存先・コマンド実行場所を明記。
- READMEの先頭にWindows、続けてdeb・rpmのダウンロード先を配置。

## 検証結果

- generator 47/47、desktop 34/34、Windows配布fixture 3/3 PASS。
- TypeScript・Viteビルド、61章のハッシュ・現行ガイドリンク・6構成の生成検査 PASS。
- CI・パッケージ検査と公開後のダウンロード結果を完了後に追記する。

## 未確認の範囲

Windows 11実機・実WSLからDockerとサンプル表示までの通し操作、各LinuxデスクトップのGUIインストール・起動、RHEL実機、macOS・ARM。コンテナー検査は実機GUI・SELinux/AppArmorポリシーの動作保証ではない。
