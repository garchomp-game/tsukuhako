#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
port=3000
project="otoka-b1-$(pwd -P | cksum | awk '{print $1}')"
while (($#)); do
  case "$1" in
    --name) test "$#" -ge 2 || exit 2; project=$2; shift 2 ;;
    --port) test "$#" -ge 2 || exit 2; port=$2; shift 2 ;;
    *) echo '使い方: bash scripts/configure.sh [--name 識別名] [--port ポート]' >&2; exit 2 ;;
  esac
done
[[ "$project" =~ ^[a-z][a-z0-9-]{2,48}$ ]] || { echo '識別名は英小文字で始まる3〜49文字の英小文字・数字・ハイフンです。' >&2; exit 2; }
if ! [[ "$port" =~ ^[0-9]{4,5}$ ]] || ((10#$port < 1024 || 10#$port > 65535)); then echo 'ポートは1024〜65535です。' >&2; exit 2; fi
if [[ -e .env || -L .env ]]; then
  [[ -f .env && ! -L .env ]] || { echo '.envは通常ファイルにしてください。' >&2; exit 1; }
  echo '.envは既存の設定を保持します。変更は.envを編集後、コンテナを再構築してください。'
else
  (umask 077; set -o noclobber; printf 'PROJECT_NAME=%s
HOST_PORT=%s
' "$project" "$port" > .env)
  echo '設定を.envに作成しました。次は bash scripts/doctor-host.sh'
fi
