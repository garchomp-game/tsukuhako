# F2を一つ作り、最初の画面まで進む

[入口に戻る](START_HERE.md) · ガイド2026-10-25-r2 / アプリ0.4.4

全体は **現在地 → 不足分の準備 → F2生成 → VS Code接続 → 初期処理の正常終了 → ブラウザ表示** です。アプリの生成完了と、開発環境の起動完了は別です。Windowsの一経路は実機未確認です。

## 1. 現在地を見る — ツクハコの画面

アプリ上部の「作る」を開き、「開発準備チェック」を見ます。今回は下の「画面づくりの構成」で **「Next.js：画面とページ移動の練習（初期候補）」、F2** を使います。

Windowsの場合は「開発するWSL」で、普段使うLinuxを選んで「もう一度確認」を押します。`docker-desktop` やrootユーザーは開発先にしません。

**成功の目印：** Dockerが「利用可能」で、項目別結果に不足がない状態です。「Dev Container起動：未確認」は、この後に実際に接続して確かめる項目です。診断時刻も確認します。

不足があれば2番へ。準備済みなら3番へ進みます。途中で止まった場合は、今の画面と最後の操作を [FEEDBACK](FEEDBACK.md) に残せます。

## 2. 不足分だけ用意する — OSとWSLを取り違えない

ツクハコの「このOSの準備手順」を開きます。導入済みのものを消して入れ直す必要はありません。アプリはDocker/WSLを自動導入しません。必要な導入・再起動を終えたら「準備チェックへ戻る」→「もう一度確認」で再診断します。

### Linuxの場合

1. Docker EngineとComposeプラグインが未導入なら、[Dockerの導入案内](https://docs.docker.com/engine/install/)で対象OSを確認します。**Linux MintはDockerのUbuntu向け公式サポート対象ではありません**。このガイドのMint記録は既存環境のものです。対応や権限が分からない場合はここで止まり、PCの管理者と確認します。[Ubuntu版の対象OS](https://docs.docker.com/engine/install/ubuntu/)。
2. [VS CodeのLinux手順](https://code.visualstudio.com/docs/setup/linux)に沿って用意し、VS Codeの拡張画面でMicrosoftの **Dev Containers**（`ms-vscode-remote.remote-containers`）を入れます。
3. **Linuxホストのターミナル**で次を1行ずつ実行します。ClientとServerの両方、Composeの版が出ることを確かめます。権限エラーは [困ったとき](TROUBLESHOOTING.md)へ。

```sh
docker version
docker compose version
```

### Windowsの場合 — 検証協力用の案内

1. **WindowsのPowerShell**で `wsl --list --verbose` を実行し、使う通常のLinuxのVERSIONが2か確認します。未導入なら [MicrosoftのWSL導入手順](https://learn.microsoft.com/windows/wsl/install)を開き、管理者権限での導入、再起動、Linuxユーザー作成を終えます。既存WSLを削除したり、`docker-desktop`を作業場所にしたりしません。
2. [Docker DesktopのWindows要件と導入手順](https://docs.docker.com/desktop/setup/install/windows-install/)を確認します。アプリを起動し、Linux containers / WSL 2 backendを使い、Settings → Resources → WSL Integrationで**1番で選んだ同じLinux**の連携を有効にします。[WSL連携](https://docs.docker.com/desktop/features/wsl/)。WSL内へ別のDocker Engineを重ねて導入する手順ではありません。
3. **Windows側**のVS CodeにMicrosoftの **WSL**（`ms-vscode-remote.remote-wsl`）と **Dev Containers** を入れます。[VS CodeとWSL](https://code.visualstudio.com/docs/remote/wsl)。
4. スタートメニュー等から**選んだLinuxのターミナル（WSL）**を開き、`whoami` でrootではないことを確認し、上の `docker version` と `docker compose version` を実行します。以降「ホスト」は、このWSLを指します。
5. ツクハコへ戻り、同じ「開発するWSL」を選択→「もう一度確認」→必要なら「WSL用ファイルを準備」→再確認します。**選択WSL・通常ユーザー・補助ファイルの準備が確認できてから**3番へ進みます。

Windowsの要件はアプリの起動対象と、Docker Desktop/WSL側の要件を両方満たす必要があります。版・ハードウェア・利用条件は導入時の公式ページで確認してください。ここまでの読了は実機成功の意味ではありません。

## 3. 新しいフォルダへ生成する — ツクハコ

1. F2の選択を確認して「保存先を決める」を押します。
2. 「親フォルダ」は**既に存在する、自分が書き込めるフォルダ**を指定します。初回は `~/` を使えます。Windowsでは選択したWSLのHOME内です。アプリの展開先、WindowsのCドライブや `/mnt/c` には作りません。
3. 「新しいフォルダ名」に `f2-first` など、まだ存在しない名前を入れます。既に作成済みなら作り直さず [再開手順](TROUBLESHOOTING.md)へ。
4. 詳細設定は通常そのままにし、「作成内容を確認」を押します。**F2・保存先・ポート**を確認します。「起動前に確認する項目」が出たら先に解消します。ポート使用中なら「保存先・ポートを見直す」へ戻り、空き番号に変更して再診断します。
5. 「プロジェクトを作成」を押します。

**成功の目印：**「プロジェクトのファイルができました。」と保存先が表示されます。ここでは**コンテナはまだ起動していません**。この保存先をメモし、プロジェクト内の `START_HERE.md` を開きます。生成時に `.env` は作成済みです。最初から作り直しません。

## 4. プロジェクトの準備を確かめる — ホストのターミナル

Linuxは通常のターミナル、Windowsは**選択したWSLのターミナル**を使います。生成先の `START_HERE.md` の「最初に作業フォルダを開く」にある、`cd --` で始まるコマンドをコピーして実行します。自分の保存先が入ったコマンドなので、別の教材の例へ置き換えません。移動後に次を実行します。

```sh
pwd
bash scripts/doctor-host.sh
```

**成功の目印：** `pwd` が生成先と一致し、診断OKと**このプロジェクトのURL**が出ます。URLをメモします。FAILがあればその表示と [困ったとき](TROUBLESHOOTING.md)へ戻ります。PowerShellやDev Container内でこのホスト診断を実行しません。

## 5. 開発環境へ接続する — VS Code

生成完了画面の「VS Codeで開く」を押します。Windowsでは選択WSLの生成先が開くことを確認します。開けない場合の別入口は [困ったとき](TROUBLESHOOTING.md)にあります。

VS Codeで自分が生成したフォルダを確認して信頼し、`Ctrl+Shift+P` を押して **Dev Containers: Reopen in Container** を選びます。構成のひな形を新規作成する操作は不要です。コマンドがなければ2番の拡張を確認します。VS Codeのサインインは、このローカル練習には不要です。

上部に `Restricted Mode`（制限モード）が残っている場合は、その案内の `Manage`（管理）を開き、**今生成したフォルダ**を確認して `Trust`（信頼）を選んでから進みます。親フォルダ全体を信頼する必要はありません。

**途中の目印：** 左下に `Dev Container: ツクハコ F2` の接続表示が出ます。まだ次の起動コマンドは実行せず、6番へ進みます。

## 6. 初期処理の正常終了を待つ — VS Codeの構成ターミナル

VS Code下部のターミナルを開き、初期構成用タブ（`Configuring...` など）を選びます。見えない場合は「表示」→「ターミナル」から開き、タブを選びます。

**成功の目印は二つです：本文に「準備完了」があり、初期構成処理がエラーなく終了していること。** タブ名・接続表示・`node_modules`の存在だけでは判断しません。取得や処理が続いている間は待ち、別の `npm ci` を重ねて実行しません。失敗表示、終了コードのエラー、長く進まない状態は [困ったとき](TROUBLESHOOTING.md)へ。所要時間の保証はありません。

今回のLinux確認環境では、最後に `Done. Press any key to close the terminal.` と表示されました。文言はVS Codeの版・表示言語で変わるため、この一文だけで判断せず、上の二条件を確認します。

## 7. 最初の画面を表示する — コンテナ内ターミナル → OSのブラウザ

6番が正常終了したら、VS Codeの「ターミナル」→「新しいターミナル」を開きます。

```sh
pwd
```

**`/workspace` であることを確認してから**、同じターミナルで起動します。

```sh
npm run dev
```

`Ready` が出たら、このターミナルを動かしたまま、OSのブラウザで**生成先の `START_HERE.md` または4番の診断に出たURL**を開きます。コンテナ内のログに出る標準ポートへ置き換えず、`localhost` のホスト側URLを使います。

**達成の目印：** F2の画面に「小さく変えて、動きを確かめよう。」という見出しが表示されます。ここまでが今回の目標です。任意で [変更と復元](NEXT-STEP.md)へ進めます。今日は終了する場合は、実行中ターミナルの `Ctrl+C` で開発サーバーを止め、コンテナの停止・次回の再開は [困ったとき](TROUBLESHOOTING.md)を確認します。
