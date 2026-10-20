import { createHash } from 'node:crypto';

export const RUNTIME = Object.freeze({
  node: '24.22.0', npm: '11.17.0', nextFamily: '16.4.x',
  image: 'node:24.22.0-bookworm-slim@sha256:a5f4366e834695d5f363b920c104953a535d3a9864d1bdf74566a0ebe01daee5',
});

export function renderFiles(root, port) {
  const copy = createHash('sha256').update(root).digest('hex').slice(0, 12);
  const project = `otoka-existing-${copy}`;
  const guard = `
directory="$(cd -- "$(dirname -- "$0")" && pwd -P)"
root="$(cd -- "$directory/.." && pwd -P)"
fingerprint="$(printf '%s' "$root" | sha256sum | cut -c 1-12)"
if [[ "$fingerprint" != '${copy}' ]]; then
  printf 'ERROR: 提案時とフォルダが異なります。既存の設定を保存し、新しい場所で再提案してください。\\n' >&2
  exit 1
fi
if [[ -n "\${COMPOSE_FILE:-}" || (-n "\${COMPOSE_PROJECT_NAME:-}" && "\${COMPOSE_PROJECT_NAME}" != '${project}') || (-n "\${PROJECT_NAME:-}" && "\${PROJECT_NAME}" != '${project}') || (-n "\${HOST_PORT:-}" && "\${HOST_PORT}" != '${port}') ]]; then
  printf 'ERROR: Compose/project/port の環境変数が提案と競合します。設定を確認し、環境変数を引き継がないターミナルで再実行してください。\\n' >&2
  exit 1
fi
for variable in \${!COMPOSE_@}; do
  if [[ "$variable" != COMPOSE_PROJECT_NAME && -n "\${!variable}" ]]; then
    printf 'ERROR: Compose の環境変数が設定されています。値を公開せず所有者が確認してください。\\n' >&2
    exit 1
  fi
done
for env_file in "$root/.env" "$directory/.env"; do
  if [[ -L "$env_file" || (-e "$env_file" && ! -f "$env_file") ]]; then
    printf 'ERROR: .env は通常ファイルである必要があります。手動で確認してください。\\n' >&2
    exit 1
  fi
  if [[ -f "$env_file" ]]; then
    if [[ ! -r "$env_file" || $(wc -c < "$env_file") -gt 1048576 ]]; then
      printf 'ERROR: .env を安全に確認できません。手動で確認してください。\\n' >&2
      exit 1
    fi
    if LC_ALL=C awk '{ sub(/^\\357\\273\\277/, ""); if ($0 ~ /^[[:space:]]*(export[[:space:]]+)?["\\047]?COMPOSE_[[:alnum:]_]+/) found=1 } END { exit found ? 0 : 1 }' "$env_file"; then
      printf 'ERROR: .env に Compose の予約キーがあります。値を公開せず所有者が確認してください。\\n' >&2
      exit 1
    fi
  fi
done
`;
  const files = {
    'Dockerfile': `FROM ${RUNTIME.image}
RUN npm install --global npm@${RUNTIME.npm} \\
    && mkdir -p /workspace/node_modules /home/node/.npm \\
    && chown -R node:node /workspace /home/node/.npm
USER node
WORKDIR /workspace
CMD ["sleep", "infinity"]
`,
    'devcontainer.json': `${JSON.stringify({
      name: '既存 Next.js の作業環境', dockerComposeFile: 'compose.yaml', service: 'app',
      workspaceFolder: '/workspace', remoteUser: 'node', updateRemoteUserUID: true,
      initializeCommand: ['bash', '.devcontainer/initialize.sh'],
      postCreateCommand: 'npm ci --no-audit --no-fund', shutdownAction: 'stopCompose',
      customizations: { vscode: { settings: { 'remote.autoForwardPorts': false } } },
    }, null, 2)}\n`,
    'compose.yaml': `name: ${project}
services:
  app:
    image: ${project}-dev:0.1.1
    pull_policy: never
    init: true
    environment:
      HOST_PORT: "${port}"
      NEXT_TELEMETRY_DISABLED: "1"
    ports:
      - "127.0.0.1:${port}:3000"
    volumes:
      - type: bind
        source: ..
        target: /workspace
      - node_modules:/workspace/node_modules
      - npm_cache:/home/node/.npm
volumes:
  node_modules:
  npm_cache:
`,
    'initialize.sh': `#!/usr/bin/env bash
set -euo pipefail
${guard}
command -v docker >/dev/null || { printf 'ERROR: Docker を導入してください。\\n' >&2; exit 1; }
docker info >/dev/null 2>&1 || { printf 'ERROR: Docker を起動して接続を確認してください。\\n' >&2; exit 1; }
docker compose version >/dev/null
docker build --file "$directory/Dockerfile" --tag '${project}-dev:0.1.1' "$directory"
`,
    'manage.sh': `#!/usr/bin/env bash
set -euo pipefail
${guard}
compose() {
  env -u COMPOSE_PROJECT_NAME -u COMPOSE_FILE -u PROJECT_NAME -u HOST_PORT \\
    docker compose --project-directory "$directory" --project-name '${project}' --file "$directory/compose.yaml" "$@"
}
case "\${1:-help}" in
  start) bash "$directory/initialize.sh"; compose up -d --wait --wait-timeout 90 ;;
  stop) compose stop ;;
  down) compose down --remove-orphans ;;
  status) compose ps ;;
  shell) compose exec app bash ;;
  dev) compose exec app npm run dev -- --hostname 0.0.0.0 --port 3000 ;;
  *) printf '使用方法: bash .devcontainer/manage.sh {start|stop|down|status|shell|dev}\\n'; exit 1 ;;
esac
`,
    'README.md': `# 追加した Next.js 作業環境

この設定は Linux / WSL の Bash と Docker、VS Code Dev Containers 用です。ホストの Node は環境利用には不要です。判定・適用CLIを使う場合は Node 24 が必要です。

VS Code の **Dev Containers: Reopen in Container** を選びます。初回は固定 Node ${RUNTIME.node} / npm ${RUNTIME.npm} をビルドし、コンテナ内で 'npm ci --no-audit --no-fund' が実行されます。既存プロジェクトと依存パッケージの install lifecycle script が動く場合があります。元のソースや package scripts を adapter が書き換えることはありません。

コンテナ内で 'npm run dev -- --hostname 0.0.0.0 --port 3000' を実行し、ホストの http://localhost:${port} を開きます。ソースを編集して保存し、反映を確認します。検証は既存プロジェクトの check/test/build 手順で行います。

停止は VS Code を閉じるか、ホストのプロジェクトルートで 'bash .devcontainer/manage.sh stop'。状態は 'bash .devcontainer/manage.sh status'、コンテナ削除（volume保持）は 'bash .devcontainer/manage.sh down' です。起動・停止の入口は固定したprojectとComposeファイルを使い、競合する環境変数があれば拒否します。再開は Reopen in Container、再構築は Rebuild Container です。ソースはホストに残り、依存とnpm cacheはこのprojectのnamed volumeです。DBは追加しません。

作成した資源は project '${project}'、port '127.0.0.1:${port}'、volume '${project}_node_modules' / '${project}_npm_cache' です。名前とポートを手動で共有すると競合します。移動・コピー後の自動流用はせず再提案してください。

適用を取り消す前にこの構成を停止します。adapter の undo は追加したファイルのうち内容が一致するものだけを削除します。利用者の編集・追記は保持し、Docker volume/imageは削除しません。ログに .env や認証情報を貼らないでください。
`,
  };
  return Object.entries(files).map(([name, content]) => ({ path: `.devcontainer/${name}`, content }));
}
