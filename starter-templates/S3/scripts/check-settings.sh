#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
[[ -f .env && ! -L .env ]] || { echo '.envがありません。configure.shを実行してください。' >&2; exit 1; }
awk -v allowed="PROJECT_NAME HOST_PORT" '
BEGIN {n=split(allowed, names, " ");for(i=1;i<=n;i++)ok[names[i]]=1;bad=0}
{sub(/\r$/, "")}
/^[[:space:]]*(#|$)/ {next}
{at=index($0,"=");key=substr($0,1,at-1);if(!at || !(key in ok) || seen[key]++){bad=1;exit 1}}
END {if(bad)exit 1;for(i=1;i<=n;i++)if(!seen[names[i]])exit 1}
' .env || { echo '.envの未知キー・重複キー・欠落を確認してください。接続キーは.env.localへ設定します。' >&2; exit 1; }
