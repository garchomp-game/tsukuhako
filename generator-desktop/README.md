# ツクハコ Desktop 0.4.3

学習用の開発環境を作り、同梱教材で起動・変更・復元まで進むアプリです。明鏡の公式アプリではありません。教材閲覧とファイル生成にアカウント登録・ホストNode.js・ネット接続は不要です。初回の開発環境構築にはネット接続が必要です。

## 今回の配布対象

- Windows 11 x64: `tsukuhako-windows-x64-0.4.3-setup.exe`。NSISのユーザー単位インストール。未署名の検証用です。Windows上の実機起動、初回警告、F2/S2の完走、アンインストール後のデータ保持は未確認です。CIでのビルドを実機合格と扱いません。
- Linux x64: `tsukuhako-linux-x64-0.4.3.tar.gz`。展開したフォルダの `tsukuhako` を一般ユーザーで起動します。確認対象はLinux Mint 22.3。未導入PCや他ディストリビューションの動作を保証するものではありません。
- macOS・ARM・deb・AppImage・自動更新は今回の対象外です。既存のmacOS教材は参考として残しています。

OSの保護機能やElectron sandboxを無効化せず、停止や警告が出た場合は内容を記録してください。Windowsでは通常のWindowsユーザーでインストールし、スタートメニューの「ツクハコ」から起動します。

## Windowsの保存場所と削除

Windowsのアプリから選んだWSL 2の通常ユーザーを使います。Docker DesktopのWSL Integrationも同じdistroを選びます。rootやdocker-desktopを開発先にしません。生成先は選択WSLのHOME配下です。アプリのインストールフォルダは保存先・作業キャッシュに使いません。

「WSL用ファイルを準備」で、同梱のLinux x64 Node・共有コア・テンプレートを `~/.tsukuhako-helper/0.4.3-linux-x64` に配置します。アーカイブ・manifest・実行ファイルのSHA-256を照合します。不完全な同じ版を自動削除せず、利用者が確認して退避した後で再配置します。OSパッケージ・既定distro・シェル設定は変更しません。

Windowsの「インストールされているアプリ」でツクハコをアンインストールしても、生成プロジェクト、WSL、Dockerデータ・ボリュームは削除しない構成です。WSLの `.tsukuhako-helper` とWindowsの `%APPDATA%/tsukuhako`（読書位置など）は残します。環境や旧版ヘルパーの自動掃除はしません。この保持動作のWindows実機確認は残っています。

## 初回の進め方

VS Codeのサインインはローカル学習には不要です。信頼するのは今生成したフォルダだけです。拡張画面でMicrosoftのDev Containersを導入し、WindowsではWSL拡張も用意します。

F1/F2/B1/S1/S2はReopen in Containerのあと、構成ターミナル本文の「準備完了」と初期構成処理の正常終了を確認してから `npm run dev` を実行します。接続バッジ・node_modules・Configuring...というタブ名だけでは完了と判断しません。処理中に別の `npm ci` を重ねません。早く実行して `next: not found` が出たら正常終了を待って再実行し、構成処理自体が失敗していればログと復旧教材を確認します。I1は専用のDB手順です。

生成完了画面・START_HERE.md・教材の「最初の一歩」は同じ共有コアから案内します。アプリを終了してもプロジェクトは残り、VS CodeからそのSTART_HERE.mdを開いて再開できます。

## 制作側の再現手順

Node 24.19.0、Python 3.12以降。Electron 44.9.1、electron-builder 26.15.3はlockfileで固定しています。

```sh
npm ci --prefix generator
npm ci --prefix generator-desktop
node tools/build-curriculum-043.mjs
python tools/build-helper-043.py
npm run build --prefix generator-desktop
npm test --prefix generator
npm test --prefix generator-desktop
```

製品ソースをcommitした後で `node tools/stage-desktop.mjs`。テスト中だけ `--allow-dirty` を使えますが、その状態の成果物は配布処理で拒否します。

```sh
node tools/stage-desktop.mjs
npm run test:package --prefix generator-desktop
# Windows上
npm run package:windows --prefix generator-desktop
# Linux上
python tools/package-desktop-043.py
```

手動の `Desktop validation artifacts` workflowでも両方を作成できます。標準runnerのみ・各25分上限・成果物14日保持・OS別ダウンロードです。公開Releaseを作りません。

ASARは使用せず、`resources/app/main.mjs` を基準にUI・worker・共有コア・教材・テンプレート・ライセンス・WSLヘルパーを実ファイルで配置します。fflateは共有コアのnode_modules、React/Markdown関連コードはViteのUIへ同梱します。Nodeのライセンスはhelper.tar、Electronのライセンスは配布ルートに含まれます。`build-info.json` と `bundle-files.json` でソースcommit・版・同梱ファイルのハッシュを確認できます。

設定は [electron-builder.json](electron-builder.json)。[NSIS形式の公式説明](https://www.electron.build/v26/docs/targets/) と [Electron署名の説明](https://www.electronjs.org/docs/latest/tutorial/code-signing) に沿い、一般配布用の署名準備は別作業です。有料サービスや証明書は購入しません。
