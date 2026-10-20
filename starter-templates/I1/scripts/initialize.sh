#!/usr/bin/env bash
set -euo pipefail
root="$(cd -- "$(dirname -- "$0")/.." && pwd -P)"
bash "$root/scripts/configure.sh"
bash "$root/scripts/doctor.sh"
bash "$root/scripts/build.sh"
