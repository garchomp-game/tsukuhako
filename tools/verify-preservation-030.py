"""Compare the migration with the frozen 0.2.1 archive, including runtime identities."""
from pathlib import Path
import copy
import hashlib
import json
import zipfile

ROOT = Path(__file__).resolve().parents[1]
E = ROOT / 'validation/brand-0.3.0'
read = lambda p: json.loads(p.read_text())
sha = lambda data: hashlib.sha256(data).hexdigest()
baseline = read(E / 'baseline.json')
original = ROOT.parent / baseline['originalWorkspace']
manifest = read(E / 'baseline-archive-manifest.json')
catalog = read(ROOT / 'catalog.json')
old_catalog = read(E / 'baseline-catalog.json')
issues, checks = [], []

def check(ok, label):
    if not ok:
        issues.append(label)

check(original.is_dir(), 'Original 0.2.1 workspace unavailable')
for a in baseline['artifacts']:
    data = (original / 'dist' / a['file']).read_bytes()
    check(sha(data) == a['sha256'] and len(data) == a['bytes'], 'Original artifact: ' + a['file'])
counts = {'originalNonValidationFiles': 0, 'inheritedHistoricalFiles': 0, 'I1SourceFiles': 0, 'adapterFiles': 0}
for entry in manifest['files']:
    rel = entry['path'].removeprefix('otoka-devcontainer-starters/')
    if not rel.startswith('validation/'):
        check(sha((original / rel).read_bytes()) == entry['sha256'], 'Original source changed: ' + rel)
        counts['originalNonValidationFiles'] += 1
    if rel.startswith('validation/') and rel != 'validation/package-audit.json':
        check(sha((ROOT / rel).read_bytes()) == entry['sha256'], 'Historical evidence changed: ' + rel)
        counts['inheritedHistoricalFiles'] += 1
    for prefix, key in [('starter-templates/I1/', 'I1SourceFiles'), ('existing-project-adapter/', 'adapterFiles')]:
        if rel.startswith(prefix):
            check(sha((ROOT / rel).read_bytes()) == entry['sha256'], 'Frozen source changed: ' + rel)
            counts[key] += 1
check((E / 'BASELINE-REPORT.txt').read_bytes() == (original / 'REPORT.md').read_bytes(), 'Archived baseline report differs')
for tid in ['I1']:
    old = next(t for t in old_catalog['templates'] if t['id'] == tid)
    new = next(t for t in catalog['templates'] if t['id'] == tid)
    check(new == old, 'Unchanged I1 catalog entry')
    check((ROOT / new['packagePath']).read_bytes() == (original / old['packagePath']).read_bytes(), 'Unchanged I1 ZIP bytes')
checks.append('Original artifacts/sources, inherited evidence, I1 and adapter byte identity')

# Package names and each package's own version are metadata; dependency resolutions are frozen.
packages = ['generator', 'generator-desktop'] + ['starter-templates/' + t for t in ['F1', 'F2', 'B1', 'S1', 'S2', 'S3']]
for directory in packages:
    for filename in ['package.json', 'package-lock.json']:
        old, new = [copy.deepcopy(read(folder / directory / filename)) for folder in (original, ROOT)]
        for obj in [old, new]:
            for key in ['name', 'version', 'productName']:
                obj.pop(key, None)
            if filename == 'package-lock.json':
                for key in ['name', 'version']:
                    obj.get('packages', {}).get('', {}).pop(key, None)
        check(old == new, 'Dependency or unrelated package setting changed: ' + directory + '/' + filename)
checks.append('Eight package/lock dependency graphs unchanged; only own name/version/productName differ')
for tid in ['F1', 'F2', 'B1', 'S1', 'S2', 'S3']:
    folder = Path('starter-templates') / tid
    # Runtime commands, IDs, DB settings and lifecycle helpers are unchanged.
    old_files = [original / folder / 'compose.yaml', original / folder / '.env.example',
                 original / folder / '.devcontainer/Dockerfile',
                 *(original / folder / 'scripts').rglob('*')]
    if (original / folder / 'supabase').exists():
        old_files += list((original / folder / 'supabase').rglob('*'))
    for p in old_files:
        if p.is_file():
            rel = p.relative_to(original)
            check((ROOT / rel).read_bytes() == p.read_bytes(), 'Runtime identity/config changed: ' + str(rel))
    old, new = [read(base / folder / '.devcontainer/devcontainer.json') for base in (original, ROOT)]
    check(new.pop('name') == 'ツクハコ ' + tid, 'Dev Container display name: ' + tid)
    old.pop('name')
    check(old == new, 'Dev Container settings changed beyond name: ' + tid)
checks.append('Six runtime images/configurations/scripts/DB IDs unchanged; only Dev Container display names differ')

for t in catalog['templates']:
    p = ROOT / t['packagePath']
    m = read(p.with_suffix('.manifest.json'))
    check(sha(p.read_bytes()) == t['packageSha256'] == m['sha256'], 'Template SHA: ' + t['id'])
    check(p.stat().st_size == m['bytes'], 'Template size: ' + t['id'])
    check(m['version'] == t['implementationVersion'], 'Template version: ' + t['id'])
    with zipfile.ZipFile(p) as z:
        for name, digest in m['files'].items():
            data = z.read(t['id'] + '/' + name)
            check(sha(data) == digest == sha((ROOT / t['sourcePath'] / name).read_bytes()), 'Template content: ' + t['id'] + '/' + name)
checks.append('Seven template ZIP hashes, manifests, catalog versions and source bytes match')
result = {'status': 'FAIL' if issues else 'PASS', 'counts': counts, 'checks': checks, 'issues': issues}
(E / 'preservation.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(result, ensure_ascii=False, indent=2))
raise SystemExit(bool(issues))
