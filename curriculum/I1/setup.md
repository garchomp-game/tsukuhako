# 導入と接続先

## 必要なもの

- Bash と一般的なシェルツール。Linux なら通常の端末、Windows なら WSL2 の端末を使います。
- Docker Engine または Docker Desktop と Docker Compose v2 以降。`docker info` と `docker compose version` を実行して確認します。
- VS Code と Microsoft の Dev Containers 拡張。Windows では WSL 拡張も使用します。
- 初回イメージ取得のネットワークと空きディスク。実測環境・測定範囲は [検証記録](validation.md) に記載します。

ホストの Node、npm、psql は不要です。制作側の自動検証には別途 Dev Container CLI を使いますが、ZIP 利用者の前提ではありません。

Windows では [Microsoft の WSL 導入案内](https://learn.microsoft.com/windows/wsl/install)、[Docker Desktop の WSL 案内](https://docs.docker.com/desktop/features/wsl/)、[VS Code の WSL 案内](https://code.visualstudio.com/docs/remote/wsl) に従って準備します。プロジェクトは WSL のホーム配下（例 `~/projects/i1`）へ置き、WSL 側で `code .` を実行します。Windows 側の PowerShell で Bash スクリプトを直接実行する手順ではありません。未導入 PC への導入試験は未実施です。

## 何がどこで動くか

```text
ホストの VS Code / Docker Compose
       │ bind mount: このフォルダ → /workspace
       ▼
app: 作業用コンテナ (vscode ユーザー、psql)
       │ db:5432 / otoka_learning
       ▼
db: PostgreSQL 18.6 ── named volume: <project>_pgdata
       ▲
       │ 127.0.0.1:<HOST_PORT> (既定 55432)
ホストの任意の DB クライアント
```

コンテナから見た `localhost` はそのコンテナ自身です。作業コンテナの接続先は `db:5432`、ホストの接続先は `127.0.0.1:55432` です。ブラウザ用 URL はありません。ホストに DB クライアントを追加する必要はありません。

`configure.sh` が `.env` に、フォルダのパスから作った識別子、ポート、乱数のローカルパスワードを保存します。スクリプトは `.env` をシェルコードとして実行しません。既存 `.env` を通常の再実行で上書きしません。コピーした場合は `.env` を持ち越さず、新しく設定します。[コピー時の復旧](troubleshooting.md) も参照してください。

コンテナのソースはこのフォルダを直接使います。DB データは named volume に残り、ソースフォルダや ZIP には入りません。Docker ソケットやホストのホーム全体を作業コンテナへ渡しません。
