#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
root=$(pwd -P)
fail() { printf '%s\n' "$*" >&2; exit 1; }
usage() { printf '%s\n' 'Host: bash scripts/db.sh start|stop|status|test|reset --confirm-local-reset=<project-id>'; }
for required in docker curl tar sha256sum awk sed timeout; do command -v "$required" >/dev/null || fail "不足: $required。docs/SETUP.md を確認してください。"; done
[[ -f .env ]] || fail '.env がありません。ホストで bash scripts/configure.sh を実行してください。'
value() {
  local result
  result=$(awk -F= -v name="$1" '$1 == name {sub(/^[^=]*=/, ""); sub(/\r$/, ""); print}' .env)
  [[ -n "$result" && "$result" != *$'\n'* ]] || fail ".env の $1 を1行で指定してください。"
  printf '%s' "$result"
}
bash scripts/check-settings.sh
project=$(value PROJECT_NAME)
[[ "$project" =~ ^otoka-s2-[a-z0-9][a-z0-9-]{0,39}$ ]] || fail 'PROJECT_NAME は otoka-s2- で始まる英小文字・数字・ハイフンにしてください。'
api_port=$(value SUPABASE_API_PORT)
db_port=$(value SUPABASE_DB_PORT)
studio_port=$(value SUPABASE_STUDIO_PORT)
shadow_port=$(value SUPABASE_SHADOW_PORT)
app_port=$(value HOST_PORT)
for port in "$api_port" "$db_port" "$studio_port" "$shadow_port" "$app_port"; do
  [[ "$port" =~ ^[0-9]{4,5}$ && "$port" -ge 1024 && "$port" -le 65535 ]] || fail 'ポートは1024〜65535の整数にしてください。'
done
[[ $(printf '%s\n' "$api_port" "$db_port" "$studio_port" "$shadow_port" "$app_port" | sort -u | wc -l) -eq 5 ]] || fail 'この構成内のポートが重複しています。'
network="${project}-network"
docker info >/dev/null 2>&1 || fail 'Dockerへ接続できません。Dockerを起動し docs/RECOVERY.md を確認してください。'
mkdir -p .cache/supabase .local
if [[ -f .local/project-id && $(cat .local/project-id) != "$project" ]]; then
  fail '既存DBと異なるIDです。元の .env で停止し、別コピーで新しいIDを使ってください。'
fi

install_cli() {
  local platform arch checksum archive
  case "$(uname -s)" in Linux) platform=linux;; *) fail 'この補助スクリプトの対象はLinux/WSLです。macOS/Windowsネイティブは未対応です。';; esac
  case "$(uname -m)" in x86_64) arch=amd64; checksum=4b481189efbdc57cf2d37bdee5f1a0d29574314398564b32a6dfb76c0fcf275f;; aarch64|arm64) arch=arm64; checksum=896278173cd7c3632e9340e546129606a26e696e90bcaaa6f7b7490fe218efc7;; *) fail '未対応CPUです。Linux amd64で実測済み、arm64は未検証です。';; esac
  cli="$root/.cache/supabase/supabase"
  if [[ ! -x "$cli" ]] || [[ "$("$cli" --version)" != 2.121.0 ]]; then
    archive="supabase_2.121.0_${platform}_${arch}.tar.gz"
    printf 'Supabase CLI 2.121.0 をプロジェクト内へ取得します。\n'
    curl --fail --location --retry 2 --connect-timeout 15 --max-time 180 "https://github.com/supabase/cli/releases/download/v2.121.0/$archive" -o .cache/supabase/download.tar.gz
    printf '%s  %s\n' "$checksum" .cache/supabase/download.tar.gz | sha256sum --check --status || fail 'CLIのチェックサムが一致しません。取得を停止しました。'
    tar -xzf .cache/supabase/download.tar.gz -C .cache/supabase supabase
    rm .cache/supabase/download.tar.gz
  fi
}
config() {
  sed -e "s/__PROJECT_ID__/$project/g" -e "s/__API_PORT__/$api_port/g" -e "s/__DB_PORT__/$db_port/g" \
    -e "s/__STUDIO_PORT__/$studio_port/g" -e "s/__SHADOW_PORT__/$shadow_port/g" -e "s/__APP_PORT__/$app_port/g" \
    supabase/config.template.toml > .local/config.next.toml
  if [[ -f supabase/config.toml ]] && ! cmp -s supabase/config.toml .local/config.next.toml; then
    if docker inspect "supabase_db_$project" >/dev/null 2>&1; then
      fail '起動中に接続設定を変更できません。元の設定でDBを停止してから変更してください。'
    fi
  fi
  mv .local/config.next.toml supabase/config.toml
}
assert_owned_network() {
  local owner
  owner=$(docker network inspect "$network" --format '{{index .Labels "otoka.s2.owner"}}' 2>/dev/null || true)
  if [[ -n "$owner" && "$owner" != "$root" ]]; then
    fail "同じPROJECT_NAMEの別フォルダがあります。別コピーではIDと全ポートを変更してください: $network"
  fi
  if docker network inspect "$network" >/dev/null 2>&1; then
    [[ "$owner" == "$root" ]] || fail '既存の所有者不明ネットワークには接続しません。別のIDを指定してください。'
    [[ $(docker network inspect "$network" --format '{{index .Options "com.docker.network.bridge.host_binding_ipv4"}}') == 127.0.0.1 ]] || fail 'ネットワークがlocalhost公開に限定されていません。'
  fi
}
install_cli
config
assert_owned_network
run_cli() { timeout --foreground 900 "$cli" --workdir "$root" --agent no --network-id "$network" "$@"; }
case "${1:-}" in
  start)
    if ! docker network inspect "$network" >/dev/null 2>&1; then
      docker network create --label "otoka.s2.owner=$root" --label 'otoka.template=S2' --opt com.docker.network.bridge.host_binding_ipv4=127.0.0.1 "$network" >/dev/null
    fi
    printf '%s\n' "$project" > .local/project-id
    printf 'ローカルSupabaseを起動: %s（初回の画像取得には数分かかります）\n' "$project"
    # CLI status includes privileged local credentials. Do not print or persist its raw output.
    if ! run_cli start > .local/start-output 2>&1; then
      sed -E 's/((anon|service_role|secret|publishable)[^:]*:).*/\1 [REDACTED]/Ig; s/eyJ[A-Za-z0-9_.-]+/[REDACTED_JWT]/g; s/sb_(secret|publishable)_[A-Za-z0-9_-]+/[REDACTED_KEY]/g; s#postgresql://[^ ]+#postgresql://[REDACTED]#g' .local/start-output >&2
      rm -f .local/start-output
      fail '起動に失敗しました。ポート競合・空き容量を確認してください。DBは自動リセットしません。'
    fi
    rm .local/start-output
    # Only the low-privilege anon key is passed to the server; never the service role key.
    anon=$(run_cli status -o env 2>/dev/null | sed -n 's/^ANON_KEY="\([^"]*\)"$/\1/p')
    [[ -n "$anon" ]] || fail '匿名公開キーを取得できませんでした。CLI版を確認してください。'
    [[ ! -L .env.local ]] || fail ".env.localは通常ファイルにしてください。"
    umask 077
    printf 'SUPABASE_URL=http://supabase_kong_%s:8000\nSUPABASE_ANON_KEY=%s\n' "$project" "$anon" > .env.local
    printf '準備完了。API http://127.0.0.1:%s / Studio http://127.0.0.1:%s\n次: VS Codeで Reopen in Container → npm run dev\n' "$api_port" "$studio_port"
    ;;
  stop)
    run_cli stop
    printf '停止しました。DB volumeと編集したソースは保持されます。\n'
    ;;
  status)
    docker ps --filter "label=com.supabase.cli.project=$project" --format '{{.Names}} {{.Status}} {{.Ports}}'
    printf 'API http://127.0.0.1:%s / Studio http://127.0.0.1:%s / DB 127.0.0.1:%s\n' "$api_port" "$studio_port" "$db_port"
    ;;
  test)
    docker exec -i "supabase_db_$project" psql -X -U postgres -d postgres -v ON_ERROR_STOP=1 < tests/database.sql
    ;;
  reset)
    [[ "${2:-}" == "--confirm-local-reset=$project" ]] || fail "この試行用DBの学習データを全消去します。実行する場合: bash scripts/db.sh reset --confirm-local-reset=$project"
    [[ -f .local/project-id ]] || fail 'このフォルダで作成したDBの記録がありません。'
    run_cli db reset --local --yes
    ;;
  *) usage; exit 1;;
esac
