# ツクハコ 0.4.6

学習用の開発環境を作り、同梱教材でサンプルの動作確認まで進む。文字の変更・復元は任意で続けられるReact/Electronアプリです。明鏡の公式アプリではありません。

Linuxの主配布物を**単体deb**に変更しました。対象候補はLinux Mint 22.3 x64です。`tsukuhako-linux-amd64-0.4.6.deb`を標準のパッケージインストーラーで導入し、メニューの「ツクハコ」→「はじめてのWeb画面で始める」へ進みます。通常画面にも「ガイド」があります。所有者のPCでの初回GUI導入・メニュー起動は確認待ちです。詳細な検証範囲は[0.4.6レポート](validation/onboarding-0.4.6/REPORT.md)を参照してください。

本体と55章の教材・ガイド、テンプレート、ファイル生成機能を同梱しています。本体を使うためのアカウント登録・ホストNode.js・Pythonは不要です。Docker・VS Code等の開発準備と、本体の導入完了は別です。最初の推奨構成は「はじめてのWeb画面」です。ブラウザでサンプル画面を確認できれば初回完了です。

- [短い導入・更新・削除案内](docs/linux-deb/INSTALL.txt)
- [制作・再現手順とWindowsの扱い](generator-desktop/README.md)
- [購入者向け受取先の準備手順](docs/linux-deb/UPLOAD.md)（外部配布は未実施）
- [Brain・ガイドの制作メモ](docs/launch/SUNDAY-PACK.md) / [原稿等](docs/launch/REPORT.md) / [任意メールのローカル試作](web/README.md)

Windowsの既存候補は0.4.4（未署名NSIS）のままです。今回Windows成果物は再生成していません。Windows 11通常ユーザーと実WSL経路は確認待ちです。macOS・ARM・他のLinuxディストリビューションは今回の対応確認対象外です。

F1/F2/B1/S1/S2/I1が生成対象、S3は参考資料です。Webサンプル4構成は、通常表示の管理IDを外す表示変更に合わせてテンプレート版とZIPを更新しました。生成済みプロジェクトは自動更新しません。

過去の検証記録：[0.4.5](validation/linux-deb-0.4.5/REPORT.md)、[0.4.4](validation/release-0.4.4/REPORT.md)、[担当A](validation/release-0.4.4-followup/REPORT.md)、[A・B・C](validation/launch-abc-2026-10-22/REPORT.md)、[旧b1同梱ZIP](validation/sunday-bundle-2026-10-25/REPORT.md)。過去版の成功を0.4.6の実機証拠へ読み替えません。

ソースは[garchomp-game/tsukuhako](https://github.com/garchomp-game/tsukuhako)（private）で管理します。依存フォルダ・製品ランタイム・大容量配布物・実際の.envをGitへ追加しません。公開販売・課金・公開ストレージへのアップロードは行っていません。
