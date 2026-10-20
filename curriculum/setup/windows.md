# Windows / WSL 2の準備

対象目標：Windows 11 x64、サポート中のUbuntu LTS / WSL 2。実機未確認です。Windows ARMは対象外です。

## WSLと通常ユーザー

[Microsoft公式の導入手順](https://learn.microsoft.com/en-us/windows/wsl/install)に従います。管理者操作や再起動を要求されたら指示に従い、Linux初回起動で通常ユーザーを作ります。

場所：WindowsのPowerShell（任意のフォルダ）。次を順に実行します。

```powershell
wsl --status
wsl --version
wsl --list --verbose
```

一覧に通常のLinux名と VERSION 2 が表示されることを確認します。WSL 1はそのまま対象にしません。[WSLコマンドの公式説明](https://learn.microsoft.com/en-us/windows/wsl/basic-commands)で変換・既定ユーザーの設定を確認します。仮想化・組織ポリシー・再起動待ちは別の問題です。勝手にディストリビューションを削除しないでください。Stoppedは正常な待機状態です。

導入後はアプリ左の「準備チェックへ戻る」を押し、「もう一度確認」で候補を更新します。ツクハコで通常のdistroを選びます。docker-desktopは開発先にしません。診断で選択したLinuxが起動することがあります。root既定なら通常ユーザーへ設定してから再確認します。

## 保存場所とヘルパー

[Linux側のファイルシステム](https://learn.microsoft.com/en-us/windows/wsl/filesystems)を使います。初期保存先は通常ユーザーのHOMEです。projectsを使う場合は先にLinux側でフォルダを作成してください。Cドライブ・/mnt/c・他distroのUNCパスは使えません。

「WSL用ファイルを準備」で、同梱Linuxランタイムと共有コア・テンプレートをHOMEの.tsukuhako-helper配下へ配置します。OSパッケージやシェル設定は変更しません。版ごとに分離し、旧版は自動削除しません。

## Docker Desktopの連携

[Windows版の公式導入先](https://docs.docker.com/desktop/setup/install/windows-install/)から導入し、初回起動と利用条件の同意は自身で行います。管理者要否は導入方式によります。Linux containersとWSL 2 backend、選んだUbuntuの[WSL Integration](https://docs.docker.com/desktop/features/wsl/)を有効にします。

Windows側の成功だけでは不十分です。場所：選択したWSLのターミナル（任意のフォルダ）。次を実行し、ClientとServerの両方が表示されることを確認します。

```sh
docker version
```

失敗したら、Windows側のDocker Desktopの起動と選択WSLのIntegrationを確認します。WSLに別のEngineを追加する手順へは進みません。WSL内EngineとDesktopが混在する場合は、データを削除せず接続先を整理してください。ツクハコは切替・削除しません。

## S2で不足コマンドが表示された場合

準備チェックの「S2のホスト用 curl の確認」「S2のホスト用 timeout の確認」などで、状態が「未導入」の項目から不足したコマンド名を確認します。bash、curl、tar、sha256sum、awk、sed、timeoutは選択したWSL内で確認しています。PowerShellやDev Container内の導入状況とは別です。

[S2の追加準備](lesson:S2/setup)で、必要なツールと用途・対象OSを確認してください。用意する場所はツクハコの「開発するWSL」で選んだディストリビューションです。そのWSLの通常ユーザーのターミナルで、不足したコマンドをディストリビューションの案内に沿って準備します。ツクハコがOSへ自動インストールすることはありません。

S2の章を読んだら左の「作る画面へ戻る」を押し、構成がS2、開発するWSLが同じ選択であることを確認して「もう一度確認」を押します。このWindows準備章からは「準備チェックへ戻る」で戻れます。教材を読んだだけでは診断結果は変わりません。「確認できない」の場合は未導入と決めつけず、診断理由も確認してください。Dockerの項目は上のDocker Desktop・WSL Integrationの手順で確認します。

## Windows版VS Code

[VS Code WSLガイド](https://code.visualstudio.com/docs/remote/wsl)に沿ってWindows側へVS Code、WSL拡張、Dev Containers拡張を導入します。生成結果の「VS Codeで開く」は選択distroのフォルダへ接続します。失敗したらVS CodeのWSL接続で同じdistroとLinuxパスを選びます。初回はVS Code Serverの取得に時間がかかります。

アプリ左の「準備チェックへ戻る」→「もう一度確認」で結果を更新します。

[再確認と復旧](lesson:setup/trouble)
