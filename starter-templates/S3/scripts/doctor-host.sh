#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
fail() { echo "診断NG: $*" >&2; echo '復旧手順: docs/RECOVERY.md' >&2; exit 1; }
command -v docker >/dev/null || fail 'Dockerがありません。docs/SETUP.mdを確認してください。'
docker version --format '{{.Server.Version}}' >/dev/null 2>&1 || fail 'Dockerへ接続できません。Dockerの起動と接続権限を確認してください。'
docker compose version >/dev/null 2>&1 || fail 'Docker Compose pluginが必要です。'
[[ -f .env && ! -L .env ]] || fail '設定がありません。bash scripts/configure.sh を実行してください。'
bash scripts/check-settings.sh
project=$(sed -n 's/^PROJECT_NAME=//p' .env)
port=$(sed -n 's/^HOST_PORT=//p' .env)
[[ "$project" =~ ^[a-z][a-z0-9-]{2,48}$ ]] || fail 'PROJECT_NAMEを確認してください。'
if ! [[ "$port" =~ ^[0-9]{4,5}$ ]] || ((10#$port < 1024 || 10#$port > 65535)); then fail 'HOST_PORTは1024〜65535です。'; fi
[[ -z "${PROJECT_NAME:-}" || "$PROJECT_NAME" == "$project" ]] || fail 'シェルのPROJECT_NAMEと.envが競合しています。別プロジェクトの環境変数を解除して再実行してください。'
[[ -z "${HOST_PORT:-}" || "$HOST_PORT" == "$port" ]] || fail 'シェルのHOST_PORTと.envが競合しています。'
[[ -z "${COMPOSE_PROJECT_NAME:-}" || "$COMPOSE_PROJECT_NAME" == "$project" ]] || fail 'COMPOSE_PROJECT_NAMEが別プロジェクトを指定しています。'
[[ -z "${COMPOSE_FILE:-}" ]] || fail 'COMPOSE_FILEが設定されています。このフォルダ用のComposeを使うため解除してください。'
[[ -z "${COMPOSE_ENV_FILES:-}" ]] || fail 'COMPOSE_ENV_FILESが設定されています。解除してください。'
docker compose config --quiet || fail 'compose.yaml または.envに不整合があります。'
for id in $(docker ps -aq --filter "label=com.docker.compose.project=$project" --filter 'label=com.docker.compose.service=app'); do
  origin=$(docker inspect --format '{{range .Mounts}}{{if eq .Destination "/workspace"}}{{.Source}}{{end}}{{end}}' "$id")
  [[ "$origin" == "$(pwd -P)" ]] || fail 'PROJECT_NAMEは別フォルダで使用されています。.envで未使用の識別名を選んでください。'
done
if command -v ss >/dev/null && [[ -n "$(ss -H -ltn "sport = :$port")" ]]; then
  own=$(docker ps --filter "label=com.docker.compose.project=$project" --filter publish="$port" -q)
  [[ -n "$own" ]] || fail "ポート $port は使用中です。.envのHOST_PORTを変更してください。"
  echo 'このプロジェクトのポートは起動中です。'
fi
printf '診断OK: %s / http://localhost:%s
' "$project" "$port"
df -h . | tail -1
echo '容量不足なら不要な自分の試行資源を確認してください。全体pruneは行いません。'
