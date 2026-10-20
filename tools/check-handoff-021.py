"""Read back 0.2.1 artifacts, verify baseline preservation, byte identity and exclusions."""
from pathlib import Path,PurePosixPath
import hashlib,json,posixpath,re,zipfile,io,tarfile,datetime
ROOT=Path(__file__).resolve().parents[1]
E=ROOT/'validation/revision-0.2.1'
sha=lambda data:hashlib.sha256(data).hexdigest()
read=lambda p:json.loads(p.read_text())
catalog=read(ROOT/'catalog.json')
archive=ROOT/'dist'/f"otoka-devcontainer-starters-{catalog['packageVersion']}-{catalog['generatedDate']}.zip"
prefix='otoka-devcontainer-starters/'
issues=[];checks=[]
def check(ok,message):
    if not ok:issues.append(message)
def passed(message):checks.append(message)
old=read(E/'baseline-catalog.json')
check(catalog['templates']==old['templates'],'Template catalog entries changed')
oldmanifest=read(E/'baseline-archive-manifest.json')
for entry in oldmanifest['files']:
    rel=entry['path'].removeprefix(prefix)
    if rel.startswith(('starter-templates/','existing-project-adapter/')):
        check(sha((ROOT/rel).read_bytes())==entry['sha256'],f'Frozen source changed: {rel}')
passed('Seven template catalog entries, template sources and adapter preserved')
secrets=[]
for p in (E/'runs').rglob('.env'):
    if p.is_file() and not p.is_symlink():
        for line in p.read_text().splitlines():
            if line.startswith('POSTGRES_PASSWORD='):
                value=line.split('=',1)[1]
                if len(value)>=32:secrets.append(value.encode())
manifest=read(archive.with_suffix('.manifest.json'))
check(sha(archive.read_bytes())==manifest['sha256'],'Full ZIP SHA differs from manifest')
with zipfile.ZipFile(archive) as z:
    names=set(z.namelist());check(len(names)==len(z.namelist()),'Duplicate paths');check(z.testzip() is None,'ZIP integrity')
    check(names=={x['path'] for x in manifest['files']},'Manifest inventory differs')
    check(json.loads(z.read(prefix+'catalog.json'))==catalog,'Embedded catalog differs')
    for entry in manifest['files']:
        data=z.read(entry['path']);check(sha(data)==entry['sha256'] and len(data)==entry['bytes'],f'Manifest bytes: {entry["path"]}')
    for t in catalog['templates']:
        data=z.read(prefix+t['packagePath']);check(sha(data)==t['packageSha256'],f'Template SHA {t["id"]}')
    for name in sorted(names):
        parts=PurePosixPath(name).parts
        check(not any(x in {'node_modules','.next','.cache','.local','.git','runs','probe','work'} for x in parts),f'Excluded path: {name}')
        check(not any(x.startswith('.env') and x!='.env.example' for x in parts),f'Actual env: {name}')
        if name.endswith(('.md','.json','.ndjson','.log','.txt','.mjs','.py','.sh','.ts','.tsx','.yaml','.yml','.toml','.css','.html','.sql','.js')):
            data=z.read(name)
            check(str(Path.home()).encode() not in data,f'Creator home: {name}')
            check(not any(secret in data for secret in secrets),f'Generated I1 secret present: {name}')
            check(not re.search(rb'eyJ[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}|sb_(?:secret|publishable)_[A-Za-z0-9_-]{20,}',data),f'Credential-like value: {name}')
        if name.endswith('.md'):
            for target in re.findall(r'\]\(([^)]+)\)',z.read(name).decode()):
                if re.match(r'\w+://|#',target):continue
                targetpath=posixpath.normpath(posixpath.join(posixpath.dirname(name),target.split('#',1)[0]))
                check(targetpath in names,f'Broken Markdown link: {name} -> {target}')
    cli='meikyo-generator-cli-0.2.1-linux.zip'
    check(z.read(prefix+'dist/'+cli)==(ROOT/'dist'/cli).read_bytes(),'Embedded standalone CLI changed')
passed('Full ZIP and manifest read back; template SHA, settings/secret/cache exclusions and Markdown links checked')
summary=read(E/'summary.json')
for artifact in summary['artifacts']:
    check(sha((ROOT/'dist'/artifact['file']).read_bytes())==artifact['sha256'],f'Artifact changed after testing: {artifact["file"]}')
cm=read((ROOT/'dist'/cli).with_suffix('.manifest.json'))
check(sha((ROOT/'dist'/cli).read_bytes())==cm['sha256'],'CLI hash differs from manifest')
with zipfile.ZipFile(ROOT/'dist'/cli) as z:
    stem=Path(cli).stem+'/'
    check(z.testzip() is None,'CLI ZIP integrity')
    check(len(z.namelist())==len(set(z.namelist())),'CLI duplicate paths')
    check(set(z.namelist())=={stem+e['path'] for e in cm['files']},'CLI manifest inventory')
    for entry in cm['files']:
        data=z.read(stem+entry['path'])
        check(sha(data)==entry['sha256'] and len(data)==entry['bytes'],f'CLI manifest bytes: {entry["path"]}')
    for name in ['package.json','package-lock.json','README.md']:
        check(z.read(stem+'generator/'+name)==(ROOT/'generator'/name).read_bytes(),f'CLI metadata/readme differs: {name}')
    check(json.loads(z.read(stem+'catalog.json'))==catalog,'CLI catalog differs')
    for p in [ROOT/'generator/cli.mjs',*(ROOT/'generator/src').rglob('*.mjs')]:check(z.read(stem+p.relative_to(ROOT).as_posix())==p.read_bytes(),f'CLI source differs: {p.name}')
    check(stem+'generator/node_modules/fflate/LICENSE' in z.namelist(),'CLI fflate missing')
    for t in catalog['templates']:check(sha(z.read(stem+t['packagePath']))==t['packageSha256'],f'CLI template {t["id"]}')
gui=ROOT/'dist/meikyo-generator-linux-x64-0.2.1.tar.gz'
gm=read(gui.with_name(gui.name+'.manifest.json'))
check(sha(gui.read_bytes())==gm['sha256'] and gui.stat().st_size==gm['bytes'],'GUI hash/size differs from manifest')
with tarfile.open(gui) as tar:
    stem='meikyo-generator-linux-x64-0.2.1/';bundle=stem+'resources/app/bundle/'
    members=tar.getmembers()
    check(all(x.isfile() or x.isdir() for x in members),'Unexpected GUI tar member type')
    check(len(members)==len({x.name for x in members}),'GUI duplicate paths')
    expected_files={stem+e['path'] for e in gm['files']}
    expected_dirs={str(parent) for name in expected_files for parent in PurePosixPath(name).parents if str(parent)!='.'}
    check({x.name for x in members if x.isfile()}==expected_files,'GUI manifest file inventory')
    check({x.name for x in members if x.isdir()}==expected_dirs,'GUI directory inventory')
    for entry in gm['files']:
        data=tar.extractfile(stem+entry['path']).read()
        check(sha(data)==entry['sha256'] and len(data)==entry['bytes'],f'GUI manifest bytes: {entry["path"]}')
    check(tar.getmember(stem+'meikyo-generator').mode & 0o111 != 0,'GUI executable bit missing')
    check(json.loads(tar.extractfile(stem+'resources/app/package.json').read())['version']=='0.2.1','GUI app version')
    check(json.loads(tar.extractfile(bundle+'generator/package.json').read())['version']=='0.2.1','GUI core version')
    check(json.loads(tar.extractfile(bundle+'catalog.json').read())==catalog,'GUI catalog differs')
    for p in (ROOT/'generator/src').rglob('*.mjs'):check(tar.extractfile(bundle+p.relative_to(ROOT).as_posix()).read()==p.read_bytes(),f'GUI shared core differs: {p.name}')
    for name in ['main.mjs','security.mjs','worker.mjs','preload.cjs']:check(tar.extractfile(stem+'resources/app/'+name).read()==(ROOT/'generator-desktop'/name).read_bytes(),f'GUI source differs: {name}')
    for p in (ROOT/'generator-desktop/build').rglob('*'):
        if p.is_file():check(tar.extractfile(stem+'resources/app/build/'+p.relative_to(ROOT/'generator-desktop/build').as_posix()).read()==p.read_bytes(),f'GUI built asset differs: {p.name}')
    for t in catalog['templates']:check(sha(tar.extractfile(bundle+t['packagePath']).read())==t['packageSha256'],f'GUI template {t["id"]}')
    check(tar.extractfile(bundle+'generator/node_modules/fflate/LICENSE') is not None,'GUI fflate missing')
passed('Tested CLI/GUI artifact hashes unchanged; bundled shared core, built assets, catalog and seven ZIPs match final source')
baseline=read(E/'baseline.json');original=ROOT.parent/baseline['originalWorkspace'];preservation='NOT_CHECKED: original 0.2.0 checkout is not available at this location'
if original.exists():
    for artifact in baseline['artifacts']:
        data=(original/'dist'/artifact['file']).read_bytes()
        check(sha(data)==artifact['sha256'] and len(data)==artifact['bytes'],f'Original artifact changed: {artifact["file"]}')
    for entry in oldmanifest['files']:
        rel=entry['path'].removeprefix(prefix)
        if not rel.startswith('validation/'):
            check(sha((original/rel).read_bytes())==entry['sha256'],f'Original 0.2.0 source changed: {rel}')
    preservation='PASS: original 0.2.0 full ZIP, CLI, GUI and distributed non-validation bytes preserved'
passed(preservation)
for line in (ROOT/'dist/SHA256SUMS.txt').read_text().splitlines():
    expected,name=line.split('  ',1)
    check(sha((ROOT/'dist'/name).read_bytes())==expected,f'SHA256SUMS: {name}')
passed('Final SHA256SUMS entries match all release artifacts')
report={'recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'version':catalog['packageVersion'],'archive':archive.name,'archiveSha256':sha(archive.read_bytes()),'archiveFiles':len(names),'status':'PASS' if not issues else 'FAIL','issues':issues,'checks':checks,'testedArtifacts':summary['artifacts']}
(E/'handoff-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2))
raise SystemExit(1 if issues else 0)
