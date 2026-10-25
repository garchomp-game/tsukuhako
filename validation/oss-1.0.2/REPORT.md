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
- 各形式の配布コピーが元のビルド成果物とサイズ・SHA-256一致。製品ソースcommitは3形式で共通。[一覧](artifacts.json)。製品ソースは `05b2a8f7671b6aab2ed73c80208552cf5bae4d07`、ビルド時 `dirty: false`。その後のcommitは配布案内・検査手順・証拠の追記。
- Windows Server 2022のGitHub Actionsで同じ公開予定exeをユーザー単位（HKCU）に導入し、導入先から起動、日本語教材を表示、正常終了、アンインストール、隔離した実読書データのSHA保持がPASS。renderer errorsは0。[CI](https://github.com/garchomp-game/tsukuhako/actions/runs/40179249095) / [検査結果](windows/installer-smoke.json) / [教材表示](windows/installed-lesson.png)。runnerは管理者トークンを持つためWindows 11通常ユーザーの操作確認とは区別する。
- Debian 13 / Ubuntu 24.04.5 LTSの使い捨てコンテナーで、同じ最終debの依存解決・ライブラリ解決・版番号fixtureからの更新・削除・再導入・purge・ユーザーファイルfixture保持の各14項目PASS。[deb結果](deb/README.md)。ホストへのアプリ導入は行っていない。
- Fedora 44 / Rocky Linux 9の使い捨てコンテナーで、同じ最終rpmの依存解決・ELFライブラリ解決・最小旧版fixtureからの更新・削除・再導入・設定/プロジェクト/Docker配置場所のfixture保持PASS。[RPM集計](rpm/summary.json)。実際の過去版データ移行や実DBの確認ではない。
- Rocky Linux 9の初回削除は、DNFの自動依存削除が保護対象 `systemd-udev` を選び、DNFが処理を拒否してFAIL。保護を無効化せず、アプリ本体だけを削除する `dnf --setopt=clean_requirements_on_remove=False remove tsukuhako` を案内・検査へ反映。同じ最終rpmで両OSを再検査しPASS。[初回失敗と修正の記録](rpm/validation-history.json)。
- 公開対象の案内・検査差分・証拠をgitleaksで確認。debの依存列 `libsecret-1-0` に対する2件は公開ライブラリ名の誤検知で、未解決の認証情報検出は0。[確認結果](secret-scan.json)。
- 匿名公開ダウンロード結果は公開後に追記する。

## 未確認の範囲

Windows 11通常ユーザー・SmartScreen・既定導入先やスタートメニューからの起動、実WSLからDockerとサンプル表示までの通し操作、各LinuxデスクトップのGUIインストール・起動、RHEL実機、macOS・ARM。コンテナー検査は実機GUI・SELinux/AppArmorポリシーの動作保証ではない。
