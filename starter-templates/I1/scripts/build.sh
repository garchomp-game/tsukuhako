#!/usr/bin/env bash
set -euo pipefail
# shellcheck source=scripts/lib.sh
source "$(dirname -- "$0")/lib.sh"
read_config
docker build --file "$ROOT/.devcontainer/Dockerfile" --tag "${PROJECT_NAME}-dev:0.1.0" "$ROOT"
