# ツクハコ Desktop 0.4.1

同じウィンドウの「作る」「学ぶ」「困ったとき」でプロジェクト生成と教材閲覧を行います。React / Electron / Node共有コアを維持し、アカウント登録・ローカルHTTPサーバー・CDNは必要ありません。

## 配布物

Linux x64 tar.gzを展開し、中の`tsukuhako`を一般ユーザーで起動します。ホストへのNode.js導入は不要です。Linux Mint 22.3で測定しています。初めてのPCの依存パッケージ導入は別の未実施項目です。OSの保護機能やElectron sandboxを無効化して動かす案内はしません。

0.4.1ではLinux実行版のみ同梱検証しています。Windows/macOSの0.4.1実行配布物は未作成です。旧0.4.0のWindows x64 / macOS x64・arm64の`UNVERIFIED.zip`は旧版の検証用です。実機起動・署名・公証・初回警告・全依存の実起動は未確認です。macOSでは既存テンプレートのホストスクリプトにGNU/Linux依存が残り、特にS2の起動補助はLinux専用です。対応済みとして販売しません。

Windowsはnative Electron＋選んだWSL 2の通常ユーザーが対象です。「WSL用ファイルを準備」で同梱Node Linux x64、コア、テンプレートをHOME/.tsukuhako-helper/0.4.1-linux-x64へ配置します。版・CPU・manifest・SHA256を照合します。専用領域の不完全な同じ版は自動削除せず、確認して退避後に再配置します。一時領域は再試行ごとに分離します。旧版・既定distro・OSパッケージ・シェル設定は変更しません。Windows/WSL実機での設置・中断・再起動検証は残っています。

## 学ぶ

教材 v0.4.1は構成別6教材と準備教材、合計50章です。教材の対象テンプレート版を表示します。起動時はメタデータ、本文は選択章だけを読み込みます。main側本文キャッシュは3章までで、rendererは現在の章だけを表示します。画像も表示位置に来てから読みます。

章リンクと見出しはReactの状態で移動します。コードコピーは実行しません。HTMLを有効化せず、教材IDから同梱ファイルだけを読みます。外部リンクは章本文に含まれるHTTPSリンクのみ標準ブラウザで開きます。生成先の任意ファイルを教材IPCで読むことはできません。

読書位置はローカルのreading.jsonへ保存します。入力条件・plan・生成結果は画面の往復で保持しますが、再起動時に生成を再開しません。削除された章は目次へ戻します。生成中も教材を読めます。二重生成と生成中の終了を防ぎます。終了時にVS CodeやDockerを止める処理はありません。

## 制作側

```sh
npm ci --prefix generator
npm ci --prefix generator-desktop
npm run build --prefix generator-desktop
npm test --prefix generator
npm test --prefix generator-desktop
npm start --prefix generator-desktop
```

配布用はtools/package-desktop-041.py、tools/build-helper-041.pyを使用します。署名用アカウントを持たないクロスビルドを署名済みと扱いません。詳細はREPORT.mdとTEST-RESULTS.mdを確認してください。
