#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
case "$*" in
  stop|down|'down --volumes'|ps|logs) ;;
  *) echo '使い方: bash scripts/compose.sh {stop|down|down --volumes|ps|logs}' >&2; exit 2 ;;
esac
# 同名で別フォルダの資源があれば、停止や削除も拒否する。
bash scripts/doctor-host.sh --skip-port
project=$(sed -n 's/^PROJECT_NAME=//p' .env)
env -u COMPOSE_PROJECT_NAME -u COMPOSE_FILE -u COMPOSE_PROFILES -u COMPOSE_ENV_FILES \
  -u PROJECT_NAME -u HOST_PORT \
  docker compose --project-directory "$(pwd -P)" --env-file .env \
  --project-name "$project" -f compose.yaml "$@"
