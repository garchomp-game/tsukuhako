"""制作専用。各配布フォルダへ共通ファイルを実体として書き出す。"""
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
NODE_IMAGE = 'node:24.22.0-bookworm-slim@sha256:a5f4366e834695d5f363b920c104953a535d3a9864d1bdf74566a0ebe01daee5'
PORTS = dict.fromkeys(('F1', 'F2', 'B1', 'S1', 'S2', 'S3'), 3000)

def put(root, path, text):
    dest = root / path
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(text.lstrip('\n'), encoding='utf-8')

def common(tid):
    root = ROOT / 'starter-templates' / tid
    if root.exists():
        raise ValueError('初期ひな形専用です。既存の構成別教材・修正版を上書きできません。')
    port = PORTS[tid]
    put(root, '.devcontainer/Dockerfile', f'''FROM {NODE_IMAGE}
RUN apt-get update && apt-get install -y --no-install-recommends \\
    git curl ca-certificates libnss3 libatk1.0-0 libatk-bridge2.0-0 \\
    libx11-6 libxcomposite1 libxdamage1 libxext6 libxfixes3 libxrandr2 \\
    libgbm1 libdrm2 libxcb1 libxkbcommon0 libasound2 libglib2.0-0 \\
    libcups2 libdbus-1-3 libpango-1.0-0 libcairo2 fonts-liberation \\
    && rm -rf /var/lib/apt/lists/*
RUN npm install --global npm@11.17.0 \\
    && mkdir -p /workspace/node_modules /home/node/.npm \\
    && chown -R node:node /workspace /home/node/.npm
USER node
WORKDIR /workspace
CMD ["sleep", "infinity"]
''')
    put(root, '.devcontainer/devcontainer.json', json.dumps({
        'name': f'ツクハコ {tid}', 'dockerComposeFile': '../compose.yaml', 'service': 'app',
        'workspaceFolder': '/workspace', 'remoteUser': 'node', 'updateRemoteUserUID': True,
        'initializeCommand': ['bash', 'scripts/initialize.sh'],
        'postCreateCommand': 'npm ci --no-audit --no-fund && node scripts/doctor.mjs',
        'shutdownAction': 'stopCompose',
        'customizations': {'vscode': {'extensions': ['dbaeumer.vscode-eslint'],
            'settings': {'remote.autoForwardPorts': False}}}
    }, ensure_ascii=False, indent=2) + '\n')
    put(root, 'compose.yaml', '''name: ${PROJECT_NAME:?Run bash scripts/configure.sh first}
services:
  app:
    image: ${PROJECT_NAME:?Run configure.sh}-dev:0.1.0
    pull_policy: never
    init: true
    command: sleep infinity
    working_dir: /workspace
    environment:
      NEXT_TELEMETRY_DISABLED: "1"
    volumes:
      - .:/workspace
      - dependencies:/workspace/node_modules
      - npm-cache:/home/node/.npm
    ports:
      - "127.0.0.1:${HOST_PORT:?Run configure.sh}:3000"
volumes:
  dependencies:
  npm-cache:
''')
    put(root, 'scripts/configure.sh', '''#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
port=__PORT__
project="otoka-__ID__-$(pwd -P | cksum | awk '{print $1}')"
while (($#)); do
  case "$1" in
    --name) test "$#" -ge 2 || exit 2; project=$2; shift 2 ;;
    --port) test "$#" -ge 2 || exit 2; port=$2; shift 2 ;;
    *) echo '使い方: bash scripts/configure.sh [--name 識別名] [--port ポート]' >&2; exit 2 ;;
  esac
done
[[ "$project" =~ ^[a-z][a-z0-9-]{2,48}$ ]] || { echo '識別名は英小文字で始まる3〜49文字の英小文字・数字・ハイフンです。' >&2; exit 2; }
if ! [[ "$port" =~ ^[0-9]{4,5}$ ]] || ((10#$port < 1024 || 10#$port > 65535)); then echo 'ポートは1024〜65535です。' >&2; exit 2; fi
if [[ -e .env || -L .env ]]; then
  [[ -f .env && ! -L .env ]] || { echo '.envは通常ファイルにしてください。' >&2; exit 1; }
  echo '.envは既存の設定を保持します。変更は.envを編集後、コンテナを再構築してください。'
else
  (umask 077; set -o noclobber; printf 'PROJECT_NAME=%s\nHOST_PORT=%s\n' "$project" "$port" > .env)
  echo '設定を.envに作成しました。次は bash scripts/doctor-host.sh'
fi
'''.replace('__PORT__', str(port)).replace('__ID__', tid.lower()))
    put(root, 'scripts/compose.sh', (ROOT / 'tools/compose-guard-template.sh').read_text())
    put(root, 'scripts/initialize.sh', '''#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
bash scripts/configure.sh
bash scripts/doctor-host.sh
project=$(sed -n 's/^PROJECT_NAME=//p' .env)
docker build --tag "${project}-dev:0.1.0" --file .devcontainer/Dockerfile .
''')
    put(root, 'scripts/doctor-host.sh', '''#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
fail() { echo "診断NG: $*" >&2; echo '復旧手順: docs/RECOVERY.md' >&2; exit 1; }
[[ $# == 0 || ( $# == 1 && "$1" == --skip-port ) ]] || fail '診断の引数が不正です。'
command -v docker >/dev/null || fail 'Dockerがありません。docs/SETUP.mdを確認してください。'
docker version --format '{{.Server.Version}}' >/dev/null 2>&1 || fail 'Dockerへ接続できません。Dockerの起動と接続権限を確認してください。'
docker compose version >/dev/null 2>&1 || fail 'Docker Compose pluginが必要です。'
[[ -f .env && ! -L .env ]] || fail '設定がありません。bash scripts/configure.sh を実行してください。'
seen='|'
while IFS='=' read -r key value || [[ -n "$key" ]]; do
  [[ -z "$key" || "$key" == \\#* ]] && continue
  case "$key" in PROJECT_NAME|HOST_PORT) ;; *) fail '.envに未知のキーがあります。.env.exampleと照合してください。Compose予約キーは使用できません。' ;; esac
  [[ "$seen" != *"|$key|"* ]] || fail '.envに同じキーが重複しています。'
  seen+="$key|"
done < .env
project=$(sed -n 's/^PROJECT_NAME=//p' .env)
port=$(sed -n 's/^HOST_PORT=//p' .env)
[[ "$project" =~ ^[a-z][a-z0-9-]{2,48}$ ]] || fail 'PROJECT_NAMEを確認してください。'
if ! [[ "$port" =~ ^[0-9]{4,5}$ ]] || ((10#$port < 1024 || 10#$port > 65535)); then fail 'HOST_PORTは1024〜65535です。'; fi
[[ -z "${PROJECT_NAME:-}" || "$PROJECT_NAME" == "$project" ]] || fail 'シェルのPROJECT_NAMEと.envが競合しています。別プロジェクトの環境変数を解除して再実行してください。'
[[ -z "${HOST_PORT:-}" || "$HOST_PORT" == "$port" ]] || fail 'シェルのHOST_PORTと.envが競合しています。'
[[ -z "${COMPOSE_PROJECT_NAME:-}" || "$COMPOSE_PROJECT_NAME" == "$project" ]] || fail 'COMPOSE_PROJECT_NAMEが別プロジェクトを指定しています。'
[[ -z "${COMPOSE_FILE:-}" ]] || fail 'COMPOSE_FILEが設定されています。このフォルダ用のComposeを使うため解除してください。'
[[ -z "${COMPOSE_ENV_FILES:-}" ]] || fail 'COMPOSE_ENV_FILESが設定されています。解除して再実行してください。'
docker compose --project-directory "$(pwd -P)" --env-file .env --project-name "$project" -f compose.yaml config --quiet || fail 'compose.yaml または.envに不整合があります。'
for id in $(docker ps -aq --filter "label=com.docker.compose.project=$project" --filter 'label=com.docker.compose.service=app'); do
  origin=$(docker inspect --format '{{range .Mounts}}{{if eq .Destination "/workspace"}}{{.Source}}{{end}}{{end}}' "$id")
  [[ "$origin" == "$(pwd -P)" ]] || fail 'PROJECT_NAMEは別フォルダで使用されています。.envで未使用の識別名を選んでください。'
done
if [[ "${1:-}" != --skip-port ]] && command -v ss >/dev/null && [[ -n "$(ss -H -ltn "sport = :$port")" ]]; then
  own=$(docker ps --filter "label=com.docker.compose.project=$project" --filter publish="$port" -q)
  [[ -n "$own" ]] || fail "ポート $port は使用中です。.envのHOST_PORTを変更してください。"
  echo 'このプロジェクトのポートは起動中です。'
fi
printf '診断OK: %s / http://localhost:%s\n' "$project" "$port"
df -h . | tail -1
echo '容量不足なら不要な自分の試行資源を確認してください。全体pruneは行いません。'
''')
    put(root, 'scripts/doctor.mjs', '''import { existsSync } from 'node:fs';
const failures = [];
if (process.versions.node !== '24.22.0') failures.push('Node 24.22.0で再構築してください');
if (!existsSync('package-lock.json')) failures.push('配布物のpackage-lock.jsonがありません');
if (!existsSync('node_modules')) failures.push('npm ciを実行してください');
if (failures.length) {
  console.error(`診断NG: ${failures.join(' / ')}。docs/RECOVERY.mdを確認してください。`);
  process.exitCode = 1;
} else console.log('準備完了。npm run dev で開始、npm run check で静的確認します。');
''')
    put(root, '.env.example', f'# bash scripts/configure.sh がコピーごとに識別名を生成します。実際の.envは配布しません。\nPROJECT_NAME=otoka-{tid.lower()}-change-me\nHOST_PORT={port}\n')
    put(root, '.gitignore', '''node_modules/
.next/
dist/
.env
.env.*
!.env.example
*.tsbuildinfo
playwright-report/
test-results/
.cache/
''')
    put(root, '.dockerignore', '.git\nnode_modules\n.next\ndist\n.env*\n.cache\nvalidation\n')
    put(root, '.nvmrc', '24.22.0\n')
    put(root, '.npmrc', 'save-exact=true\nengine-strict=true\n')
    put(root, '.gitattributes', '* text=auto eol=lf\n')
    put(root, '.vscode/tasks.json', json.dumps({'version':'2.0.0','tasks':[
        {'label': key, 'type':'shell','command':f'npm run {key}', 'problemMatcher': []}
        for key in ['dev','check','test','build','doctor']]},ensure_ascii=False,indent=2)+'\n')
    put(root, '.github/workflows/check.yml', '''name: Checks
on: [push, pull_request]
permissions:
  contents: read
jobs:
  checks:
    runs-on: ubuntu-24.04
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24.22.0
          cache: npm
      - run: npm install --global npm@11.17.0
      - run: npm ci --no-audit --no-fund
      - run: npm run check
      - run: npx --no-install playwright install --with-deps chromium
      - run: npm test
      - run: npm run test:browser --if-present
      - run: npm run build
''')
    put(root, 'VERSION.json', json.dumps({'id':tid,'version':'0.1.0','requirementsVersion':'0.3','node':'24.22.0','npm':'11.17.0','image':NODE_IMAGE},indent=2)+'\n')
    put(root, 'CHANGELOG.md', '# 変更履歴\n\n## 0.1.0 — 2026-10-20\n\n日本語教材付きの初回試作。実測範囲と未確認事項はVALIDATION.md参照。\n')
    put(root, 'LICENSE-NOTES.md', '# 利用条件のメモ\n\nこのコードと教材は本人の学習・検証用の初回試作です。外部販売・再配布の利用条件は未決です。依存パッケージとコンテナOSのライセンスはそれぞれの権利者の条件に従います。package-lock.jsonに依存版を記録し、ソースやアイコンなど第三者の制作物は転載していません。外部配布前に依存のLICENSE、表示義務、教材の利用条件を確認してください。\n')
    put(root, 'docs/SETUP.md', '''# 最初の準備（ホストで行う）

ここではDockerとVS Codeをまだ入れていない場合の道筋を説明します。導入済みPCでの試験と、未導入PCからの導入試験は別です。実測はVALIDATION.mdを確認してください。

1. Windowsでは管理者PowerShellで `wsl --install` を実行し、再起動とLinuxユーザー作成を終えます。[Microsoft WSL公式手順](https://learn.microsoft.com/windows/wsl/install)で要件を確認します。
2. [Docker DesktopのWindows手順](https://docs.docker.com/desktop/setup/install/windows-install/)に沿って導入し、WSL integrationを使うディストリビューションで有効にします。Docker EngineをWSL内に別途重複導入しません。利用条件は公式で確認します。
3. [VS Code](https://code.visualstudio.com/)とMicrosoftのWSL / Dev Containers拡張を入れます。WSL内の `~/projects/` に展開し、WSLターミナルから `code .` で開きます。`/mnt/c` は初版の推奨配置ではありません。
4. Linuxでは[Docker Engine公式手順](https://docs.docker.com/engine/install/)とCompose plugin、VS Code / Dev Containers拡張を準備します。ここに自動インストーラーは含めていません。dockerグループは強い権限を持つため組織・PCの方針に従ってください。
5. ホストのターミナルで `docker version` と `docker compose version` が成功することを確認し、READMEへ戻ります。ホストのNode/npmはテンプレート利用に不要です。bash、cksum、awk、sedが必要です。

初回はイメージとnpm依存をネットから取得します。完全オフライン起動は保証しません。macOS/ARM/Windows実機は検証記録に結果がある場合だけ検証済みです。
''')
    put(root, 'docs/ARCHITECTURE.md', f'''# 構成を理解する

ホストにあるソースを `/workspace` にbind mountします。コンテナにはNode/npmなどの実行道具が入り、ブラウザはホスト側で動きます。ブラウザの `http://localhost:{port}` は `127.0.0.1:HOST_PORT → app:3000` に接続します。コンテナ内のlocalhostはそのコンテナ自身です。

`compose.yaml` は起動単位・ポート・volumeを定義し、`.devcontainer/devcontainer.json` はVS Codeの接続先・ユーザー・初回処理を定義します。Dockerfileは道具を固定し、package-lock.jsonはnpm依存の具体的な版を固定します。初回は `npm ci` の完了を待ち、その後に利用者が開発サーバーを起動します。再接続だけでサーバーを重複起動しません。

|保存対象|場所|停止・再構築|削除の影響|
|---|---|---|---|
|ソース・教材|ホストの展開フォルダ|保持|フォルダを消すと失う|
|npm依存|プロジェクト別dependencies volume|保持、npm ciで復元|再取得できる|
|取得キャッシュ|プロジェクト別npm-cache volume|保持|再取得が必要|
|ビルド結果|.next またはdist|再生成可能|ソースは失われない|

この構成の入力状態はブラウザまたはリクエスト内だけで保持します。永続DBは含めません。ソースのGit管理は任意ですが、演習前にバックアップすると戻しやすくなります。
''')
    put(root, 'docs/RECOVERY.md', '''# 停止・再開と復旧

開発サーバーだけ止めるにはコンテナ内の実行ターミナルでCtrl+C。再開は `npm run dev` です。VS Codeのウィンドウを閉じ、再度「Reopen in Container」で接続した後も明示的に実行します。

全サービスの通常停止はホストの展開フォルダで `bash scripts/compose.sh stop`。再開はVS Codeの「Reopen in Container」。Dockerfileの変更は「Dev Containers: Rebuild Container」で反映します。ソースはホストにあり保持されます。依存は初回処理の `npm ci` がlockfileから復元します。

|症状|確認場所と戻し方|
|---|---|
|Docker接続失敗|ホストで `bash scripts/doctor-host.sh`。Dockerの起動・許可を確認。docs/SETUP.mdへ戻る|
|設定なし|ホストで `bash scripts/configure.sh`。既存.envは上書きしない|
|ポート使用中|ホストの.envのHOST_PORTを空き番号に変更し再構築。自動で別ポートへ移動しない|
|別コピーと混ざる|コピーには.envを持ち込まずconfigureを実行。PROJECT_NAMEとHOST_PORTの両方を分ける。使用中の識別名を変更しても旧資源は移動しない|
|依存が壊れた|コンテナ内でサーバーを止め `npm ci`。package-lock.jsonを削除して解決しない|
|古い画面|起動ターミナルのエラー、保存したファイルとURLを確認。ソース変更は自動反映される|
|ブラウザ試験の実行ファイルなし|コンテナ内で `npm run test:setup`、その後 `npm run test:browser`|

コンテナだけ破棄するにはホストで `bash scripts/compose.sh down`。依存volumeは残ります。`bash scripts/compose.sh down --volumes` はこのPROJECT_NAMEの依存キャッシュを消します。別プロジェクトやDBを含むComposeへこの操作を流用しないでください。ホスト全体のpruneは使いません。

質問用には、操作した場所（ホスト/コンテナ）、コマンド、期待結果、診断のエラー文、VERSION.json、OS、Docker/Composeの版を添えます。.envの中身やDocker inspectの環境変数全体は送らないでください。
''')
    put(root, 'docs/BUILD-YOUR-OWN.md', '''# 空フォルダから組み立てる演習

元のフォルダを残し、別の空フォルダで順番に試します。これは学習用です。配布版のlockfileを使う最短起動とは区別します。

1. `.devcontainer/Dockerfile`、`compose.yaml`、`.devcontainer/devcontainer.json`、`scripts/`、`.env.example` を順に読み写します。Dockerfileだけではソースの保存場所は決まらず、Composeのmountが必要であることを確かめます。
2. `package.json` と `package-lock.json` を追加します。固定版を使い、ホストでconfigure後にDev Containerを開きます。初回の `npm ci` が成功すれば道具と依存の準備が完了です。
3. `tsconfig.json` とESLint設定を加え、`app/`（F1は `src/` とindex.html、Vite設定）を一ファイルずつ加えます。各ページ/Route Handlerの役割をREADMEと照合します。
4. UI構成ではCSSとPostCSS設定を加え、B1ではAPIにUIが不要なことを確認します。`npm run dev` でブラウザ/HTTP応答を確認します。
5. `tests/` とテスト設定を追加し、`npm run check`、`npm test`、`npm run build`。不正入力テストを一度失敗させ、コードを直して合格へ戻します。
6. `.vscode/tasks.json` と `.github/workflows/check.yml` を加え、同じコマンドがエディターとCIから呼ばれる関係を確認します。workflowを置くだけでは実CIの成功にはなりません。

サンプルを自分の機能へ置き換える際は、ページ/API→関連テスト→教材の順に変更し、Docker設定とlockfileを理由なく削除しないようにします。DB付き構成へ変える場合は永続volume、migration、権限を別途設計します。
''')
    return root

if __name__ == '__main__':
    for name in sys.argv[1:]:
        common(name)
