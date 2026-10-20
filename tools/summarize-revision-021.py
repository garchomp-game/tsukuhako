"""Collect the 0.2.1 regression results and verify the unchanged release inputs."""
from pathlib import Path
import datetime
import hashlib
import json
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
E = ROOT / 'validation/revision-0.2.1'
read = lambda p: json.loads(p.read_text())
sha = lambda data: hashlib.sha256(data).hexdigest()
baseline = read(E / 'baseline.json')
old_catalog = read(E / 'baseline-catalog.json')
catalog = read(ROOT / 'catalog.json')
old_manifest = read(E / 'baseline-archive-manifest.json')
original = ROOT.parent / baseline['originalWorkspace']
assert catalog['templates'] == old_catalog['templates']
frozen = {'starter-templates': 0, 'existing-project-adapter': 0}
product_changes = []
for entry in old_manifest['files']:
    rel = Path(entry['path']).relative_to('otoka-devcontainer-starters')
    if rel.parts[0] in frozen:
        assert sha((ROOT / rel).read_bytes()) == entry['sha256'], str(rel)
        frozen[rel.parts[0]] += 1
    if rel.parts[0] in {'generator', 'generator-desktop'}:
        current = ROOT / rel
        if not current.exists() or sha(current.read_bytes()) != entry['sha256']:
            product_changes.append(rel.as_posix())

expected_changes = {
    'generator/README.md', 'generator/package.json', 'generator/package-lock.json',
    'generator/src/cli/wizard.mjs', 'generator/src/core/common.mjs',
    'generator-desktop/README.md', 'generator-desktop/main.mjs',
    'generator-desktop/package.json', 'generator-desktop/package-lock.json',
    'generator-desktop/src/main.tsx', 'generator-desktop/build/index.html',
}
assert all(p in expected_changes or p.startswith('generator-desktop/build/assets/') for p in product_changes)
baseline_zip = original / 'dist' / baseline['artifacts'][0]['file']
with zipfile.ZipFile(baseline_zip) as old_zip:
    for rel in ['generator/src/core/common.mjs', 'generator-desktop/main.mjs', 'generator-desktop/src/main.tsx']:
        prior = old_zip.read('otoka-devcontainer-starters/' + rel).decode()
        assert (ROOT / rel).read_text() == prior.replace('0.2.0', '0.2.1'), rel
    for directory in ['generator', 'generator-desktop']:
        for name in ['package.json', 'package-lock.json']:
            rel = directory + '/' + name
            prior = json.loads(old_zip.read('otoka-devcontainer-starters/' + rel))
            current = read(ROOT / rel)
            prior['version'] = '0.2.1'
            if name == 'package-lock.json':
                prior['packages']['']['version'] = '0.2.1'
            assert current == prior, rel

for artifact in baseline['artifacts']:
    data = (original / 'dist' / artifact['file']).read_bytes()
    assert sha(data) == artifact['sha256'] and len(data) == artifact['bytes'], artifact['file']
original_files = 0
for entry in old_manifest['files']:
    rel = Path(entry['path']).relative_to('otoka-devcontainer-starters')
    if rel.parts[0] != 'validation':
        assert sha((original / rel).read_bytes()) == entry['sha256'], str(rel)
        original_files += 1
for template in catalog['templates']:
    assert sha((ROOT / template['packagePath']).read_bytes()) == template['packageSha256']
preservation = {
    'status': 'PASS', 'templateArchivesUnchanged': 7, 'frozenSources': frozen,
    'originalWorkspace': baseline['originalWorkspace'],
    'originalArtifacts': baseline['artifacts'],
    'originalNonValidationFilesUnchanged': original_files,
    'changedExistingProductFiles': product_changes,
    'sharedCoreAndGuiRuntimeChanges': 'Only version literals; lockfile dependency graphs unchanged.',
}
(E / 'preservation.json').write_text(json.dumps(preservation, ensure_ascii=False, indent=2) + '\n')

commands = []
for name in [
    'baseline-pty', 'core-tests', 'wizard-source', 'cli-package', 'cli-relocated',
    'wizard-packaged', 'gui-build', 'gui-ipc', 'gui-package', 'gui-release',
]:
    rel = Path('validation/root') / ('r021-' + name) / 'result.json'
    result = read(ROOT / rel)
    assert result['result'] == 'PASS' and result['exitCode'] == 0, name
    commands.append({'id': result['id'], 'status': result['result'], 'evidence': rel.as_posix()})
for name, count in [('core-tests', 21), ('gui-ipc', 2)]:
    log = (ROOT / f'validation/root/r021-{name}/output.log').read_text()
    assert f'pass {count}' in log and 'fail 0' in log and 'skipped 0' in log
reproduced = read(E / 'baseline-pty/result.json')
assert reproduced['status'] == 'REPRODUCED' and len(reproduced['cases']) == 4
for label in ['source-pty', 'packaged-pty']:
    result = read(E / label / 'result.json')
    assert result['status'] == 'PASS' and len(result['cases']) == 8
    assert all(case['status'] == 'PASS' for case in result['cases'])
cli = read(E / 'cli-bundle.json')
gui = read(E / 'gui/result.json')
assert cli['status'] == gui['status'] == 'PASS'
assert len(cli['records']) == 6 and len(gui['records']) == 8
artifacts = []
for result in [cli, gui]:
    artifact = ROOT / 'dist' / result['archive']
    assert sha(artifact.read_bytes()) == result['sha256']
    artifacts.append({'file': artifact.name, 'sha256': result['sha256'], 'bytes': artifact.stat().st_size})
summary = {
    'recordedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'packageVersion': '0.2.1', 'status': 'PASS',
    'scope': 'Review R1 and compatible selection retention; 0.2.1 packaging/version impact only.',
    'review': 'validation/revision-0.2.1/REVIEW.md',
    'baselineReproduced': 4, 'coreTests': 21, 'sourcePtyCases': 8, 'packagedPtyCases': 8,
    'relocatedCliTemplates': 6, 'guiIpcTests': 2, 'guiReleaseChecks': 8,
    'hostNode': subprocess.check_output(['node', '--version'], text=True).strip(),
    'electron': gui['records'][0]['metadata']['electron'],
    'embeddedNode': gui['records'][0]['metadata']['node'],
    'commands': commands, 'artifacts': artifacts,
    'preservationEvidence': 'validation/revision-0.2.1/preservation.json',
    'historicalEvidence': 'validation/generator-0.2.0/summary.json',
    'notRunThisRevision': [
        'F2/S2 Dev Container startup, browser workflows and all G01-G15 cases from 0.2.0',
        'Actual VS Code Reopen, reconnect and Rebuild',
        'Windows/WSL, macOS/ARM, fresh-PC setup and GitHub Actions',
        'Beginner trial and native parent-folder dialog',
    ],
    'blockedUnchanged': ['S3 dedicated live cloud connection; excluded from generation'],
}
(E / 'summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n')
(ROOT / 'dist/GENERATOR_SHA256SUMS.txt').write_text(
    ''.join(f"{a['sha256']}  {a['file']}\n" for a in artifacts)
)
print(json.dumps({'status': 'PASS', 'frozen': frozen, 'originalFiles': original_files, 'commands': len(commands)}, ensure_ascii=False))
