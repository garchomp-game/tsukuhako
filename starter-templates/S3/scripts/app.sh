#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
case "${1:-}" in stop|status) ;; *) echo '使い方: bash scripts/app.sh stop|status' >&2; exit 2;; esac
bash scripts/doctor-host.sh >/dev/null
project=$(sed -n 's/^PROJECT_NAME=//p' .env)
if [[ "$1" == status ]]; then action="ps"; else action="stop"; fi
docker compose --project-name "$project" --env-file .env --file compose.yaml "$action"
