#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
docker info >/dev/null 2>&1 || { echo 'ホストのDockerを起動してください。' >&2; exit 1; }
image='postgres:18.6-bookworm@sha256:afc7e2d441324c0388fa80c3d24f733b4194a4eb7f47dd8ee2b08eb1a24a647c'
name="otoka-s3-sql-$(pwd -P | cksum | awk '{print $1}')-$$"
# No published ports, host mounts or persistent volumes. Only fake test data.
container=$(docker run --detach --rm --name "$name" --label otoka.template=S3-sql-test \
  --network none --tmpfs /var/lib/postgresql:rw -e POSTGRES_PASSWORD=local-test-only "$image")
trap 'docker stop "$container" >/dev/null' EXIT
ready=false
for _attempt in $(seq 1 60); do
  if docker exec "$container" pg_isready -U postgres >/dev/null 2>&1; then ready=true; break; fi
  sleep 1
done
[[ "$ready" == true ]] || { echo '試験用PostgreSQLが60秒で準備できませんでした。' >&2; exit 1; }
printf 'create role anon; create role authenticated;\n' | docker exec -i "$container" psql -X -U postgres -v ON_ERROR_STOP=1
docker exec -i "$container" psql -X -U postgres -v ON_ERROR_STOP=1 < sql/public-catalog.sql
docker exec -i "$container" psql -X -U postgres -v ON_ERROR_STOP=1 < tests/permissions.sql
printf 'PASS: ローカル権限試験のみ。実クラウド接続のPASSではありません。\n'
