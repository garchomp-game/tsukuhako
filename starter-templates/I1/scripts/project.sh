#!/usr/bin/env bash
set -euo pipefail
# shellcheck source=scripts/lib.sh
source "$(dirname -- "$0")/lib.sh"
read_config
operation="${1:-help}"
[[ $# == 0 ]] || shift
case "$operation" in
  start)
    bash "$ROOT/scripts/doctor.sh"
    bash "$ROOT/scripts/build.sh"
    compose up --detach --wait --wait-timeout 90
    ;;
  stop) compose stop ;;
  down) compose down --remove-orphans ;;
  restart) compose restart; compose up --detach --wait --wait-timeout 90 ;;
  rebuild) bash "$ROOT/scripts/build.sh"; compose up --force-recreate --detach --wait --wait-timeout 90 ;;
  shell) compose exec app bash ;;
  db) compose exec -T app bash scripts/db.sh "$@" ;;
  status) compose ps ;;
  resources)
    printf 'project: %s\nvolume: %s_pgdata\n' "$PROJECT_NAME" "$PROJECT_NAME"
    docker ps -a --filter "label=com.docker.compose.project=$PROJECT_NAME" --format '{{.ID}} {{.Names}} {{.Status}}'
    docker volume ls --filter "label=com.docker.compose.project=$PROJECT_NAME" --format '{{.Name}}'
    ;;
  reset)
    [[ $# == 2 && "$1" == '--confirm' && "$2" == "$PROJECT_NAME" ]] || fail "このコピーのDBを全削除します。必要な場合だけ reset --confirm $PROJECT_NAME を指定してください。"
    volume="${PROJECT_NAME}_pgdata"
    owner="$(docker volume inspect --format '{{index .Labels "com.docker.compose.project"}}' "$volume" 2>/dev/null)" || fail '対象volumeがありません。reset は不要です。'
    template="$(docker volume inspect --format '{{index .Labels "otoka.template"}}' "$volume")"
    [[ "$owner" == "$PROJECT_NAME" && "$template" == I1 ]] || fail 'volume の所有ラベルが一致しないため停止しました。'
    compose down --remove-orphans
    docker volume rm "$volume"
    printf '削除済み: %s\n再作成: bash scripts/project.sh start → bash scripts/project.sh db setup\n' "$volume"
    ;;
  *)
    printf '使い方: bash scripts/project.sh {start|stop|down|restart|rebuild|shell|db COMMAND|status|resources|reset --confirm PROJECT}\n'
    [[ "$operation" == help ]] || exit 1
    ;;
esac
