#!/bin/bash
# Runs only inside the dedicated, disposable Ubuntu container created by the JS runner.
set -Eeuo pipefail
umask 022

[[ -f /.dockerenv && -r /input/final.deb ]] || {
  printf '%s\n' 'Refusing to run outside the dedicated container with its deb input.' >&2
  exit 64
}
[[ $# == 4 ]] || exit 64
expected_sha=$1
package=$2
version=$3
architecture=$4
[[ $expected_sha =~ ^[a-f0-9]{64}$ && $package == tsukuhako && $architecture == amd64 ]] || exit 64
[[ $version =~ ^[0-9][A-Za-z0-9.+:~_-]*$ ]] || exit 64

mkdir -p /evidence /work
exec > >(tee /evidence/commands.log) 2>&1
current_step=initialization
finish() {
  local code=$?
  printf 'exitCode\t%s\nlastStep\t%s\n' "$code" "$current_step" > /evidence/status.tsv
}
trap finish EXIT
pass() { printf '%s\tPASS\n' "$1" | tee -a /evidence/checks.tsv; }
record_packages() { dpkg-query -W -f='${binary:Package}\t${Version}\t${db:Status-Status}\n' | sort > "/evidence/packages-$1.tsv"; }
assert_data() { sha256sum --check /evidence/sentinels.sha256; pass "data-preserved-$1"; }
assert_installed() {
  local expected_version=$1 phase=$2
  [[ $(dpkg-query -W -f='${Status}' "$package") == 'install ok installed' ]]
  [[ $(dpkg-query -W -f='${Version}' "$package") == "$expected_version" ]]
  [[ $(dpkg-query -W -f='${Architecture}' "$package") == "$architecture" ]]
  dpkg --audit > "/evidence/dpkg-audit-$phase.txt"
  [[ ! -s /evidence/dpkg-audit-$phase.txt ]]
  dpkg-query -L "$package" > "/evidence/package-files-$phase.txt"
  local executable install_dir desktop
  executable=$(readlink -e "/usr/bin/$package")
  [[ $executable == /opt/*/"$package" && -x $executable ]]
  install_dir=$(dirname "$executable")
  printf '%s\n' "$executable" > /evidence/installed-executable.txt
  dpkg-query -S "$executable" > "/evidence/executable-owner-$phase.txt"
  [[ $(stat -c '%u:%g' "$executable") == 0:0 ]]
  [[ $(stat -c '%u:%g' "$install_dir/chrome-sandbox") == 0:0 ]]
  [[ $(stat -c '%a' "$install_dir/chrome-sandbox") =~ ^(755|4755)$ ]]
  stat -c '%U:%G %a %n' "$executable" "$install_dir/chrome-sandbox" > "/evidence/permissions-$phase.txt"
  runuser -u thvalidator -- test -x "$executable"
  if runuser -u thvalidator -- test -w "$install_dir"; then
    printf '%s\n' 'Application installation directory is writable by the ordinary test user.' >&2
    return 1
  fi
  find "$install_dir" -type f -perm /022 -print > "/evidence/writable-payload-$phase.txt"
  [[ ! -s /evidence/writable-payload-$phase.txt ]]
  mapfile -t desktops < <(sed -n '\|^/usr/share/applications/[^/]*\.desktop$|p' "/evidence/package-files-$phase.txt")
  [[ ${#desktops[@]} == 1 ]]
  desktop=${desktops[0]}
  grep -Fx 'Name=ツクハコ' "$desktop"
  grep -Fx 'Terminal=false' "$desktop"
  grep -Fx "Icon=$package" "$desktop"
  grep '^Exec=' "$desktop"
  if grep -E '^Exec=.*(--no-sandbox|--disable-setuid-sandbox|sudo|pkexec)' "$desktop"; then
    return 1
  fi
  cp "$desktop" "/evidence/desktop-$phase.txt"
  printf '%s\n' "$desktop" > /evidence/installed-desktop.txt
  find /usr/share/icons/hicolor -type f -path "*/apps/$package.*" -print > "/evidence/icons-$phase.txt"
  [[ -s /evidence/icons-$phase.txt ]]
  update-alternatives --query "$package" > "/evidence/alternative-$phase.txt"
  ldd "$executable" > "/evidence/ldd-$phase.txt"
  if grep -F 'not found' "/evidence/ldd-$phase.txt"; then return 1; fi
  assert_data "$phase"
  pass "installed-$phase"
}
assert_removed() {
  local phase=$1 executable desktop status
  executable=$(cat /evidence/installed-executable.txt)
  desktop=$(cat /evidence/installed-desktop.txt)
  [[ ! -e $executable && ! -e $desktop && ! -e /usr/bin/$package && ! -L /usr/bin/$package ]]
  [[ ! -e /etc/apparmor.d/$package ]]
  if update-alternatives --query "$package" > "/evidence/alternative-$phase.txt" 2>&1; then return 1; fi
  while IFS= read -r icon; do [[ ! -e $icon ]]; done < /evidence/icons-final.txt
  status=$(dpkg-query -W -f='${Status}' "$package" 2>/dev/null || true)
  [[ $status != 'install ok installed' ]]
  printf '%s\n' "$status" > "/evidence/package-status-$phase.txt"
  assert_data "$phase"
  pass "removed-$phase"
}

current_step=input
printf '%s  /input/final.deb\n' "$expected_sha" | sha256sum --check -
[[ $(dpkg-deb -f /input/final.deb Package) == "$package" ]]
[[ $(dpkg-deb -f /input/final.deb Version) == "$version" ]]
[[ $(dpkg-deb -f /input/final.deb Architecture) == "$architecture" ]]
[[ $(dpkg --print-architecture) == "$architecture" ]]
cp /etc/os-release /evidence/os-release.txt
uname -a > /evidence/kernel.txt
dpkg-deb -f /input/final.deb > /evidence/control.txt
dpkg-deb --control /input/final.deb /evidence/control
record_packages before
pass input

current_step=sentinels
useradd --create-home --uid 12045 --shell /bin/bash thvalidator
mkdir -p /home/thvalidator/.config/tsukuhako /home/thvalidator/projects/f2-kept /home/thvalidator/portable/old-tar /var/lib/docker/volumes/tsukuhako-fixture/_data
printf '%s\n' '{"fixture":"reading-preferences-must-survive","version":1}' > /home/thvalidator/.config/tsukuhako/reading-state.json
printf '%s\n' 'generated-project-fixture-must-survive' > /home/thvalidator/projects/f2-kept/page.tsx
printf '%s\n' 'old-portable-copy-must-not-be-deleted' > /home/thvalidator/portable/old-tar/tsukuhako
printf '%s\n' 'docker-storage-location-fixture-no-docker-daemon' > /var/lib/docker/volumes/tsukuhako-fixture/_data/keep.txt
chown -R thvalidator:thvalidator /home/thvalidator
sha256sum /home/thvalidator/.config/tsukuhako/reading-state.json /home/thvalidator/projects/f2-kept/page.tsx /home/thvalidator/portable/old-tar/tsukuhako /var/lib/docker/volumes/tsukuhako-fixture/_data/keep.txt > /evidence/sentinels.sha256
pass sentinels

current_step=lower-version-fixture
# The application payload is the final build. Only dpkg's version metadata changes.
# This verifies package lifecycle transitions, not compatibility with an older release.
lower_version="${version}~upgrade-test1"
dpkg --compare-versions "$lower_version" lt "$version"
dpkg-deb --raw-extract /input/final.deb /work/lower
sed -i "s/^Version: .*/Version: $lower_version/" /work/lower/DEBIAN/control
dpkg-deb --build --root-owner-group -Zgzip /work/lower /work/lower.deb
printf 'finalVersion\t%s\nlowerFixtureVersion\t%s\npayload\tSAME_FINAL_APPLICATION_NOT_AN_OLD_RELEASE\n' "$version" "$lower_version" > /evidence/upgrade-fixture.tsv
sha256sum /work/lower.deb > /evidence/upgrade-fixture.sha256
pass lower-version-fixture

current_step=resolve-and-install-lower
apt-get update
apt-get install -y --no-install-recommends /work/lower.deb
assert_installed "$lower_version" lower
record_packages lower

current_step=upgrade-final
apt-get install -y --no-install-recommends /input/final.deb
assert_installed "$version" final
record_packages final

current_step=remove
apt-get remove -y "$package"
assert_removed remove

current_step=reinstall-final
apt-get install -y --no-install-recommends /input/final.deb
assert_installed "$version" reinstall
record_packages reinstall

current_step=purge
apt-get purge -y "$package"
assert_removed purge
record_packages after
current_step=complete
pass complete
