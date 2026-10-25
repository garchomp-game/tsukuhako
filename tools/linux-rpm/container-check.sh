#!/bin/bash
# Isolated RPM lifecycle test; never run on a desktop host.
set -Eeuo pipefail
[[ -f /.dockerenv && -f /input/final.rpm && $# == 1 ]] || exit 64
expected_sha=$1
[[ $expected_sha =~ ^[a-f0-9]{64}$ ]] || exit 64
mkdir -p /evidence /work
exec > >(tee /evidence/commands.log) 2>&1
step=input
trap 'printf "exitCode\t%s\nlastStep\t%s\n" "$?" "$step" > /evidence/status.tsv' EXIT
pass(){ printf '%s\tPASS\n' "$1" | tee -a /evidence/checks.tsv; }
assert_data(){ sha256sum -c /evidence/data.sha256; pass "data-preserved-$1"; }
assert_installed(){
 local phase=$1
 [[ $(rpm -q --qf '%{VERSION}' tsukuhako) == "$version" ]]
 [[ $(rpm -q --qf '%{ARCH}' tsukuhako) == x86_64 ]]
 [[ -x /usr/bin/tsukuhako && $(readlink -e /usr/bin/tsukuhako) == /opt/tsukuhako/tsukuhako ]]
 [[ $(stat -c '%u:%g' /opt/tsukuhako/tsukuhako) == 0:0 ]]
 [[ $(stat -c '%u:%g' /opt/tsukuhako/chrome-sandbox) == 0:0 ]]
 [[ $(stat -c '%a' /opt/tsukuhako/chrome-sandbox) =~ ^(755|4755)$ ]]
 test -f /opt/tsukuhako/resources/app/LICENSE
 grep -Fx 'Name=ツクハコ' /usr/share/applications/tsukuhako.desktop
 grep -Fx 'Terminal=false' /usr/share/applications/tsukuhako.desktop
 if grep -E '^Exec=.*(--no-sandbox|--disable-setuid-sandbox|sudo|pkexec)' /usr/share/applications/tsukuhako.desktop; then return 1; fi
 find /opt/tsukuhako -perm /002 -print > "/evidence/world-writable-$phase.txt"
 [[ ! -s /evidence/world-writable-$phase.txt ]]
 : > "/evidence/ldd-$phase.txt"
 for f in /opt/tsukuhako/tsukuhako /opt/tsukuhako/chrome_crashpad_handler /opt/tsukuhako/*.so /opt/tsukuhako/*.so.1; do
  [[ -f $f ]] || continue
  printf '\n%s\n' "$f" >> "/evidence/ldd-$phase.txt"
  ldd "$f" >> "/evidence/ldd-$phase.txt"
 done
 if grep -F 'not found' "/evidence/ldd-$phase.txt"; then return 1; fi
 rpm -q --requires tsukuhako > "/evidence/requires-$phase.txt"
 stat -c '%U:%G %a %n' /opt/tsukuhako/tsukuhako /opt/tsukuhako/chrome-sandbox > "/evidence/permissions-$phase.txt"
 cp /opt/tsukuhako/resources/app/build-info.json "/evidence/build-info-$phase.json"
 assert_data "$phase";pass "installed-$phase"
}
assert_removed(){
 local phase=$1
 ! rpm -q tsukuhako
 [[ ! -e /usr/bin/tsukuhako && ! -L /usr/bin/tsukuhako ]]
 [[ ! -e /opt/tsukuhako/tsukuhako && ! -e /usr/share/applications/tsukuhako.desktop ]]
 [[ ! -e /usr/share/icons/hicolor/256x256/apps/tsukuhako.png ]]
 assert_data "$phase";pass "removed-$phase"
}
printf '%s  /input/final.rpm\n' "$expected_sha" | sha256sum -c -
[[ $(rpm -qp --qf '%{NAME}' /input/final.rpm) == tsukuhako ]]
[[ $(rpm -qp --qf '%{ARCH}' /input/final.rpm) == x86_64 ]]
version=$(rpm -qp --qf '%{VERSION}' /input/final.rpm)
cp /etc/os-release /evidence/os-release.txt
rpm -qp --scripts /input/final.rpm > /evidence/package-scripts.txt
rpm -qa | sort > /evidence/packages-before.txt
mkdir -p /home/fixture/.config/tsukuhako /home/fixture/projects/keep /var/lib/docker/volumes/tsukuhako-fixture/_data
printf 'reading settings fixture\n' > /home/fixture/.config/tsukuhako/state.json
printf 'project fixture\n' > /home/fixture/projects/keep/page.tsx
printf 'Docker location fixture (no daemon)\n' > /var/lib/docker/volumes/tsukuhako-fixture/_data/keep.txt
sha256sum /home/fixture/.config/tsukuhako/state.json /home/fixture/projects/keep/page.tsx /var/lib/docker/volumes/tsukuhako-fixture/_data/keep.txt > /evidence/data.sha256
pass input

step=install-final
# The unsigned local package is explicitly selected; repository signature checks stay enabled.
dnf -y --setopt=localpkg_gpgcheck=0 install /input/final.rpm
assert_installed initial
rpm -qa | sort > /evidence/packages-installed.txt

step=upgrade-fixture
# Install build tooling only after checking the final package's own dependency closure.
dnf -y install rpm-build
mkdir -p /work/rpmbuild/{BUILD,BUILDROOT,RPMS,SOURCES,SPECS,SRPMS}
cat > /work/rpmbuild/SPECS/lower.spec <<'SPEC'
Name: tsukuhako
Version: 0.0.0
Release: 1
Summary: Isolated upgrade fixture, not a released application
License: MIT
BuildArch: x86_64
%description
Minimal old-package fixture to exercise the final package's RPM upgrade scriptlets.
%install
mkdir -p %{buildroot}/opt/tsukuhako
printf '#!/bin/sh\nexit 0\n' > %{buildroot}/opt/tsukuhako/tsukuhako
chmod 755 %{buildroot}/opt/tsukuhako/tsukuhako
%files
/opt/tsukuhako/tsukuhako
%post -p /bin/bash
ln -sf /opt/tsukuhako/tsukuhako /usr/bin/tsukuhako
%postun -p /bin/bash
SPEC
rpm -qp --qf '%{POSTUN}\n' /input/final.rpm | sed 's/%/%%/g' >> /work/rpmbuild/SPECS/lower.spec
rpmbuild --define '_topdir /work/rpmbuild' -bb /work/rpmbuild/SPECS/lower.spec > /evidence/fixture-build.log 2>&1
rpm -Uvh --oldpackage /work/rpmbuild/RPMS/x86_64/tsukuhako-0.0.0-1.x86_64.rpm
[[ $(rpm -q --qf '%{VERSION}' tsukuhako) == 0.0.0 ]]
printf 'fixture\tMinimal fake 0.0.0 payload; final postun script, not real older-version migration\n' > /evidence/upgrade-fixture.tsv
dnf -y --setopt=localpkg_gpgcheck=0 upgrade /input/final.rpm
assert_installed upgraded
pass upgrade-link-preserved

step=remove
dnf -y remove tsukuhako
assert_removed remove
step=reinstall
dnf -y --setopt=localpkg_gpgcheck=0 install /input/final.rpm
assert_installed reinstalled
step=final-remove
dnf -y remove tsukuhako
assert_removed final
step=complete
pass complete
