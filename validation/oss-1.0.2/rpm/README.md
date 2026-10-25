# 1.0.2 RPM検証

RPMのビルド・静的検査、Rocky Linux 9 / Fedora 44の隔離コンテナーでの依存解決、導入、更新、削除、再導入がPASSしました。最終バイナリの情報は `summary.json`、OS別の結果と検査項目は各フォルダーにあります。

ホストにはrpm等を導入せず、Node 24.19.0 / Debian Bookwormの専用コンテナーで作成しました。共通stageをread-onlyで渡し、コンテナー内コピーから作成しています。

RPM更新時に旧パッケージの削除処理で新しい起動リンクが消えないよう、`%postun` の引数が0（最終削除）の場合だけ処理します。最小の旧版fixtureから実際に更新し、起動リンクと最終payloadを確認しました。このfixtureは実際の旧リリースやユーザーデータ移行の試験ではありません。

最初のRocky Linux検査では、DNFの自動依存削除が保護対象のsystemd-udevまで選んだため、DNFが削除を拒否しました。保護を解除せず、本体だけ削除する `--setopt=clean_requirements_on_remove=False` を検査と利用案内に採用し、両OSで再確認しました。経緯は `validation-history.json` に記録しています。RPM本体は変更していません。

GUI起動、実機のSELinux、RHEL実機、Dev Containerからサンプル画面までの通し動作は未確認です。コンテナーは検査後に削除しました。ユーザーデータ保持は試験用ファイルによる確認です。
