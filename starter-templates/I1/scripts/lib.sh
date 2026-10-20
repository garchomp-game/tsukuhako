#!/usr/bin/env bash
# shellcheck shell=bash

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"
COPY_FINGERPRINT="$(printf '%s' "$ROOT" | cksum | cut -d ' ' -f 1)"

fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

read_config() {
  [[ -f "$ROOT/.env" ]] || fail '設定がありません。ホストで bash scripts/configure.sh を実行してください。'
  local inherited_project="${PROJECT_NAME:-}" inherited_port="${HOST_PORT:-}" inherited_password="${POSTGRES_PASSWORD:-}" variable
  for variable in ${!COMPOSE_@}; do
    [[ "$variable" == COMPOSE_PROJECT_NAME || -z "${!variable}" ]] || fail 'Compose の環境変数が設定されています。値を公開せず確認し、引き継がない端末で再実行してください。'
  done
  PROJECT_NAME='' HOST_PORT='' COPY_ID='' POSTGRES_PASSWORD=''
  local key value seen='|'
  while IFS='=' read -r key value || [[ -n "$key" ]]; do
    [[ -z "$key" || "$key" == \#* ]] && continue
    case "$key" in
      PROJECT_NAME|HOST_PORT|COPY_ID|POSTGRES_PASSWORD) ;;
      *) fail '.env に不明な設定があります。.env.example と docs/troubleshooting.md を確認してください。' ;;
    esac
    [[ "$seen" != *"|$key|"* ]] || fail '.env に重複する設定があります。'
    seen+="$key|"
    printf -v "$key" '%s' "$value"
  done < "$ROOT/.env"
  [[ "$PROJECT_NAME" =~ ^otoka-i1-[a-z0-9][a-z0-9-]{0,55}$ ]] || fail '.env の PROJECT_NAME が不正です。'
  if [[ ! "$HOST_PORT" =~ ^[0-9]{4,5}$ ]] || ((10#$HOST_PORT < 1024 || 10#$HOST_PORT > 65535)); then
    fail '.env の HOST_PORT は 1024〜65535 にしてください。'
  fi
  [[ "$COPY_ID" =~ ^[0-9]+$ ]] || fail '.env の COPY_ID が不正です。'
  [[ "$POSTGRES_PASSWORD" =~ ^[a-f0-9]{48}$ ]] || fail '.env のローカルパスワード設定が不正です。値をログへ貼らず docs/troubleshooting.md を参照してください。'
  [[ "$COPY_ID" == "$COPY_FINGERPRINT" ]] || fail '別フォルダの .env です。独立したコピーには bash scripts/configure.sh --new-copy --port 55433 を実行してください。移動元のDBは自動移行しません。'
  [[ "$PROJECT_NAME" == *"-$COPY_ID" ]] || fail 'PROJECT_NAME とこのフォルダの識別子が一致しません。docs/troubleshooting.md を確認してください。'
  [[ -z "${COMPOSE_PROJECT_NAME:-}" || "$COMPOSE_PROJECT_NAME" == "$PROJECT_NAME" ]] || fail 'COMPOSE_PROJECT_NAME がこの構成と競合します。環境変数を確認してください。'
  [[ -z "$inherited_project" || "$inherited_project" == "$PROJECT_NAME" ]] || fail 'PROJECT_NAME の環境変数が .env と競合します。'
  [[ -z "$inherited_port" || "$inherited_port" == "$HOST_PORT" ]] || fail 'HOST_PORT の環境変数が .env と競合します。'
  [[ -z "$inherited_password" || "$inherited_password" == "$POSTGRES_PASSWORD" ]] || fail 'POSTGRES_PASSWORD の環境変数が .env と競合します。値をログへ貼らず確認してください。'
}

compose() {
  # Do not let an inherited shell setting select another Compose project/file.
  env -u COMPOSE_PROJECT_NAME -u COMPOSE_FILE -u COMPOSE_PROFILES -u COMPOSE_ENV_FILES \
    -u PROJECT_NAME -u HOST_PORT -u POSTGRES_PASSWORD \
    docker compose --project-directory "$ROOT" --env-file "$ROOT/.env" \
    --project-name "$PROJECT_NAME" -f "$ROOT/compose.yaml" "$@"
}
