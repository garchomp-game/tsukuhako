"""Linux x64 tar.gz; consumes the same physical app layout as Windows NSIS."""
from pathlib import Path
import gzip
import json
import shutil
import tarfile
import subprocess

root = Path(__file__).resolve().parents[1]
app = root / 'dist/desktop-app'
info = json.loads((app / 'build-info.json').read_text())
assert not info['dirty'], 'Only package a committed product'
name = f"tsukuhako-linux-x64-{info['productVersion']}"
stage = root / 'validation/release-0.4.3/runs/desktop-build' / name
if stage.exists():
    shutil.rmtree(stage)
shutil.copytree(root / 'generator-desktop/node_modules/electron/dist', stage, symlinks=True)
(stage / 'electron').rename(stage / 'tsukuhako')
(stage / 'resources/default_app.asar').unlink(missing_ok=True)
shutil.copytree(app, stage / 'resources/app')
shutil.copy2(app / 'README.md', stage / 'README.md')
for p in stage.rglob('*'):
    if p.is_symlink():
        assert p.resolve().is_relative_to(stage.resolve()), p
artifact = root / 'dist' / (name + '.tar.gz')
with artifact.open('wb') as f, gzip.GzipFile(filename='', mode='wb', fileobj=f, mtime=0) as gz, tarfile.open(fileobj=gz, mode='w') as tar:
    def fixed(item):
        item.uid = item.gid = 0
        item.uname = item.gname = ''
        item.mtime = 1792454400
        return item
    tar.add(stage, arcname=name, filter=fixed)
subprocess.run(['node', str(root / 'tools/artifact-manifest.mjs'), str(artifact), 'linux'], check=True)
