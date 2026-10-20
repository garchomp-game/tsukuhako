#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
bash scripts/configure.sh
bash scripts/doctor-host.sh
[[ -f .env.local ]] || { echo "ホストで先に bash scripts/db.sh start を実行してください。" >&2; exit 1; }
project=$(sed -n 's/^PROJECT_NAME=//p' .env)
docker build --tag "${project}-dev:0.1.0" --file .devcontainer/Dockerfile .
