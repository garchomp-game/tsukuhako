#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "$0")/.." && pwd -P)"
cd "$ROOT"
fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
command -v psql >/dev/null || fail 'Dev Container 内で実行してください。ホストでは bash scripts/project.sh db COMMAND を使います。'
[[ "${PGHOST:-}" == db && "${PGDATABASE:-}" == otoka_learning && "${PGUSER:-}" == otoka && "${PGPORT:-}" == 5432 ]] || fail '学習用の db:5432 / otoka_learning 接続設定がありません。Dev Containerを開き直してください。'
export PGCONNECT_TIMEOUT=5
psql_safe() { psql -X --set ON_ERROR_STOP=1 "$@"; }
doctor() {
  psql_safe --no-align --tuples-only -c "SELECT 'PASS: ' || current_database() || ' / PostgreSQL ' || current_setting('server_version');" || fail 'DB接続に失敗しました。ホストの project.sh status と docs/troubleshooting.md を確認してください。'
  printf 'workbench user: %s (uid=%s)\n' "$(id -un)" "$(id -u)"
}
migrate() {
  local temporary filename checksum
  for path in migrations/*.sql; do
    filename="${path##*/}"
    [[ "$filename" =~ ^[0-9]{3}_[a-z0-9_]+\.sql$ ]] || fail 'migration 名は 002_add_note.sql の形式にしてください。'
  done
  temporary="$(mktemp)"
  # Keep all pending migrations and their history in one atomic transaction.
  {
    printf '%s\n' 'BEGIN;' 'SELECT pg_advisory_xact_lock(7191042);'
    printf '%s\n' 'CREATE TABLE IF NOT EXISTS public.schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now());'
    for path in migrations/*.sql; do
      filename="${path##*/}"
      checksum="$(sha256sum "$path" | cut -d ' ' -f 1)"
      printf "SELECT EXISTS(SELECT 1 FROM public.schema_migrations WHERE name = '%s') AS applied \\gset\n" "$filename"
      printf '%s\n' '\if :applied'
      printf "SELECT checksum = '%s' AS unchanged FROM public.schema_migrations WHERE name = '%s' \\gset\n" "$checksum" "$filename"
      printf '%s\n' '\if :unchanged' "\\echo 'skip: $filename'" '\else'
      printf '%s\n' "\\echo 'ERROR: 適用済みmigrationを変更しました。元に戻して新しいmigrationを追加してください: $filename'" \
        "DO \$migration\$ BEGIN RAISE EXCEPTION 'Applied migration checksum changed'; END \$migration\$;" '\endif' '\else'
      printf '\\i %s\n' "$path"
      printf "INSERT INTO public.schema_migrations(name, checksum) VALUES ('%s', '%s');\n" "$filename" "$checksum"
      printf '%s\n' '\endif'
    done
    printf '%s\n' 'COMMIT;'
  } > "$temporary"
  local result=0
  psql_safe -f "$temporary" || result=$?
  rm -f "$temporary"
  return "$result"
}
operation="${1:-help}"
[[ $# == 0 ]] || shift
case "$operation" in
  doctor) doctor ;;
  dev|connect) psql_safe "$@" ;;
  migrate) migrate ;;
  seed) psql_safe --single-transaction -f sql/seed.sql ;;
  setup) doctor; migrate; psql_safe --single-transaction -f sql/seed.sql ;;
  query) [[ $# == 1 && -f "$1" ]] || fail 'query sql/practice.sql のようにSQLファイルを指定してください。'; psql_safe -f "$1" ;;
  check|test) doctor; psql_safe -f tests/semantics.sql ;;
  *) printf '使い方: bash scripts/db.sh {doctor|dev|connect|setup|migrate|seed|query FILE|check|test}\n'; [[ "$operation" == help ]] || exit 1 ;;
esac
