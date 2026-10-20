#!/usr/bin/env bash
set -euo pipefail
# shellcheck source=scripts/lib.sh
source "$(dirname -- "$0")/lib.sh"

command -v docker >/dev/null || fail 'Docker がありません。docs/setup.md の導入手順を確認してください。'
docker info >/dev/null 2>&1 || fail 'Docker に接続できません。Docker を起動し、接続権限を確認してください。docs/troubleshooting.md を参照してください。'
docker compose version >/dev/null 2>&1 || fail 'Docker Compose v2 以降が必要です。docs/setup.md を確認してください。'
read_config
compose config --quiet || fail 'Compose 設定が不正です。.env と compose.yaml を確認してください。'
printf 'PASS: Docker / Compose / 設定\nproject: %s\nhost: 127.0.0.1:%s\ncontainer: db:5432\n' "$PROJECT_NAME" "$HOST_PORT"
printf 'ホスト Node.js/npm/psql は不要です。起動時の port already allocated は docs/troubleshooting.md へ。\n'
