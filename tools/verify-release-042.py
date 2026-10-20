from pathlib import Path
import hashlib
import json
import subprocess
import tarfile

root = Path(__file__).resolve().parents[1]
out = root / 'validation/ux-0.4.2'
sha = lambda data: hashlib.sha256(data).hexdigest()
read = lambda p: json.loads(p.read_text())
archive = root / 'dist/tsukuhako-linux-x64-0.4.2.tar.gz'
manifest = read(Path(str(archive) + '.manifest.json'))
digest = sha(archive.read_bytes())
assert digest == manifest['sha256']
assert digest == read(out / 'gui.json')['artifact'] == read(out / 'vscode-f2.json')['artifact']
checked_sources = 0
with tarfile.open(archive) as tar:
    prefix = 'tsukuhako-linux-x64-0.4.2/'
    for item in manifest['files']:
        data = tar.extractfile(prefix + item['path']).read()
        assert len(data) == item['bytes'] and sha(data) == item['sha256'], item['path']
        name = item['path']
        source = None
        if name.startswith('resources/app/bundle/'):
            source = root / name.removeprefix('resources/app/bundle/')
        elif name.startswith('resources/app/') and name != 'resources/app/package.json':
            source = root / 'generator-desktop' / name.removeprefix('resources/app/')
        if source is not None:
            assert source.read_bytes() == data, name
            checked_sources += 1
catalog = read(root / 'catalog.json')
for item in catalog['templates']:
    data = (root / item['packagePath']).read_bytes()
    assert sha(data) == item['packageSha256'] and len(data) == item['packageBytes']
    assert data == subprocess.check_output(['git', 'show', '599d130:' + item['packagePath']], cwd=root)
assert not subprocess.check_output(['git', 'diff', '599d130', '--name-only', '--', 'starter-templates'], cwd=root).strip()
content = read(root / 'curriculum/manifest.json')
assert content['appVersion'] == content['version'] == '0.4.2'
chapters = [c for lesson in content['lessons'] for c in lesson['chapters']]
for item in chapters + content['assets']:
    data = (root / 'curriculum' / item['file']).read_bytes()
    assert sha(data) == item['sha256'] and len(data) == item['bytes']
for name in ['gui', 'vscode-f2', 'helper-linux-tests', 'helper-shutdown', 'cleanup']:
    assert read(out / (name + '.json'))['status'] == 'PASS', name
for name, count in [('core-tests.txt', 27), ('desktop-tests.txt', 23)]:
    log = (out / name).read_text()
    assert f'pass {count}\n' in log and 'fail 0\n' in log and 'skipped 0\n' in log
for name, old_digest in read(out / 'baseline.json')['artifacts'].items():
    assert sha((root / name).read_bytes()) == old_digest
project = read(out / 'project.json')
assert sha(Path(project['destination'], 'START_HERE.md').read_bytes()) == project['guideSha256']
assert sha(Path(project['destination'], 'app/page.tsx').read_bytes()) == read(out / 'vscode-f2.json')['fileSha256']
record = {'status': 'PASS', 'linuxSha256': digest, 'linuxBytes': archive.stat().st_size,
          'manifestFilesChecked': len(manifest['files']), 'packagedSourcesCompared': checked_sources,
          'testedArtifactMatches': True, 'templateZipsAndSourcesUnchanged': 7,
          'curriculumChapters': len(chapters), 'curriculumAssets': len(content['assets']),
          'previous041ArchivesPreserved': True, 'generatedGuideAndRestoredSourceMatch': True}
(out / 'release-check.json').write_text(json.dumps(record, indent=2) + '\n')
(root / 'dist/SHA256SUMS-0.4.2.txt').write_text(f'{digest}  {archive.name}\n')
print(json.dumps(record))
