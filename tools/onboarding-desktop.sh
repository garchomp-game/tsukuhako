#!/usr/bin/env bash
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
out=${ONBOARDING_OUT:-"$root/validation/onboarding-0.4.2/20261021T0919-JST"}
run="$out/runs"
mkdir -p "$out/logs" "$out/screenshots" "$run/xdg-config" "$run/xdg-cache" "$run/xdg-data" "$run/bin" "$run/code-profile/User" "$run/code-extensions"
if [[ ${1:-} != inside ]]; then
  test ! -e "$run/desktop-env.json" || { echo "Use a fresh ONBOARDING_OUT directory; old evidence is retained"; exit 1; }
  test ! -e /tmp/.X11-unix/X91 || { echo ':91 already exists; choose another display before rerunning'; exit 1; }
  Xephyr :91 -screen 1600x900 -nolisten tcp -noreset > "$run/xephyr.log" 2>&1 &
  echo $! > "$run/xephyr.pid"
  for i in {1..50}; do DISPLAY=:91 xdpyinfo >/dev/null 2>&1 && break; sleep .1; done
  exec dbus-run-session -- bash "$0" inside
fi
export DISPLAY=:91
export XDG_CONFIG_HOME="$run/xdg-config" XDG_CACHE_HOME="$run/xdg-cache" XDG_DATA_HOME="$run/xdg-data"
export TSU_CAPTURE_RUNTIME="$run"
export PATH="$run/bin:$PATH"
unset ELECTRON_RUN_AS_NODE
dbus-update-activation-environment DISPLAY XDG_CONFIG_HOME XDG_CACHE_HOME XDG_DATA_HOME PATH
node -e 'const fs=require("fs");const keys=["DISPLAY","DBUS_SESSION_BUS_ADDRESS","XDG_CONFIG_HOME","XDG_CACHE_HOME","XDG_DATA_HOME","TSU_CAPTURE_RUNTIME","PATH"];fs.writeFileSync(process.env.TSU_CAPTURE_RUNTIME+"/desktop-env.json",JSON.stringify(Object.fromEntries(keys.map(k=>[k,process.env[k]]))))'
cat > "$run/bin/code" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
printf '%s' "$(date --iso-8601=seconds)" >> "$TSU_CAPTURE_RUNTIME/code-invocations.log"
printf ' %q' "$@" >> "$TSU_CAPTURE_RUNTIME/code-invocations.log"
printf '\n' >> "$TSU_CAPTURE_RUNTIME/code-invocations.log"
exec /usr/bin/code --user-data-dir="$TSU_CAPTURE_RUNTIME/code-profile" --extensions-dir="$TSU_CAPTURE_RUNTIME/code-extensions" --remote-debugging-port=9431 --remote-debugging-address=127.0.0.1 "$@"
EOF
chmod +x "$run/bin/code"
printf '%s\n' '{"workbench.startupEditor":"none","extensions.autoUpdate":false,"extensions.autoCheckUpdates":false,"update.mode":"none","window.title":"[TSUKUHAKO evidence] ${activeEditorShort}${separator}${rootName}${separator}${appName}"}' > "$run/code-profile/User/settings.json"
metacity --sm-disable --no-composite > "$run/metacity.log" 2>&1 &
echo $! > "$run/metacity.pid"
xsetroot -solid '#233242'
wait
