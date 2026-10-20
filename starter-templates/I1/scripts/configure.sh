#!/usr/bin/env bash
set -euo pipefail
# shellcheck source=scripts/lib.sh
source "$(dirname -- "$0")/lib.sh"

port=55432
label=''
new_copy=false
requested=false
while (($#)); do
  case "$1" in
    --port) [[ $# -ge 2 ]] || fail '--port の値がありません。'; port="$2"; requested=true; shift 2 ;;
    --name) [[ $# -ge 2 ]] || fail '--name の値がありません。'; label="$2"; requested=true; shift 2 ;;
    --new-copy) new_copy=true; shift ;;
    *) fail '使い方: bash scripts/configure.sh [--name 英小文字の識別名] [--port 55432] [--new-copy]' ;;
  esac
done
if [[ ! "$port" =~ ^[0-9]{4,5}$ ]] || ((10#$port < 1024 || 10#$port > 65535)); then
  fail 'ポートは 1024〜65535 にしてください。'
fi
[[ -z "$label" || "$label" =~ ^[a-z][a-z0-9-]{0,24}$ ]] || fail '名前は英小文字から始まる英小文字・数字・ハイフンの 1〜25 文字です。'

if [[ -f "$ROOT/.env" && "$new_copy" == false ]]; then
  read_config
  [[ "$requested" == false ]] || fail '既存 .env は上書きしません。ポート変更は停止後に .env の HOST_PORT だけ編集してください。'
  printf '設定を保持: %s / 127.0.0.1:%s\n' "$PROJECT_NAME" "$HOST_PORT"
  exit 0
fi
if [[ -f "$ROOT/.env" && "$new_copy" == true ]]; then
  old_copy="$(sed -n 's/^COPY_ID=//p' "$ROOT/.env")"
  [[ "$old_copy" =~ ^[0-9]+$ ]] || fail 'コピー元の識別子を確認できません。.env を上書きせず停止しました。'
  [[ "$old_copy" != "$COPY_FINGERPRINT" ]] || fail 'このフォルダは設定済みです。--new-copy は別フォルダへコピーした場合だけ使えます。'
fi

project="otoka-i1-${label:+$label-}$COPY_FINGERPRINT"
password="$(od -An -N24 -tx1 /dev/urandom | tr -d ' \n')"
[[ ${#password} == 48 ]] || fail 'ローカルパスワードを生成できませんでした。'
umask 077
temporary="$(mktemp "$ROOT/.env.XXXXXX")"
trap 'rm -f "$temporary"' EXIT
printf 'PROJECT_NAME=%s\nHOST_PORT=%s\nCOPY_ID=%s\nPOSTGRES_PASSWORD=%s\n' \
  "$project" "$port" "$COPY_FINGERPRINT" "$password" > "$temporary"
mv -- "$temporary" "$ROOT/.env"
printf '設定を作成: %s / 127.0.0.1:%s\n次: bash scripts/doctor.sh\n' "$project" "$port"
