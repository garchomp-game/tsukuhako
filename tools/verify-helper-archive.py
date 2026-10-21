"""Inspect the helper from a staged or extracted app, without executing it."""
from pathlib import Path, PurePosixPath
import hashlib
import json
import sys
import tarfile

app = Path(sys.argv[1]).resolve()
read = lambda p: json.loads(p.read_text(encoding='utf-8'))
sha = lambda b: hashlib.sha256(b).hexdigest()
meta = read(app / 'wsl-helper/bundle.json')
assert meta['version'] == read(app / 'package.json')['version']
archive = app / 'wsl-helper/helper.tar'
assert sha(archive.read_bytes()) == meta['sha256']
with tarfile.open(archive) as tar:
    names = set()
    for member in tar.getmembers():
        assert member.name not in names, member.name
        names.add(member.name)
        assert not PurePosixPath(member.name).is_absolute()
        assert '..' not in PurePosixPath(member.name).parts and '\\' not in member.name
        assert member.isfile() or member.isdir(), member.name
    manifest_data = tar.extractfile('manifest.json').read()
    assert sha(manifest_data) == meta['manifestSha256']
    manifest = json.loads(manifest_data)
    assert manifest['version'] == meta['version'] and manifest['arch'] == 'x64'
    expected_files = {f['path'] for f in manifest['files']} | {'manifest.json'}
    assert expected_files == {m.name for m in tar.getmembers() if m.isfile()}
    for item in manifest['files']:
        data = tar.extractfile(item['path']).read()
        assert len(data) == item['bytes'] and sha(data) == item['sha256'], item['path']
    assert tar.extractfile('node').read(5) == b'\x7fELF\x02'
    assert tar.getmember('node').mode & 0o111
    assert sha(tar.extractfile('node').read()) == meta['nodeSha256']
    assert sha(tar.extractfile('helper.mjs').read()) == meta['helperSha256']
    assert len(tar.extractfile('Node-LICENSE').read()) > 1000
    assert len(tar.extractfile('bundle/generator/node_modules/fflate/LICENSE').read()) > 100
    catalog = json.load(tar.extractfile('bundle/catalog.json'))
    assert catalog['packageVersion'] == meta['version']
    for template in catalog['templates']:
        assert sha(tar.extractfile('bundle/' + template['packagePath']).read()) == template['packageSha256']
print(json.dumps({'status': 'PASS', 'category': 'BUNDLE_INSPECTION', 'helperVersion': meta['version'], 'files': len(expected_files), 'helperSha256': meta['sha256']}))
