from pathlib import Path
import shutil,hashlib,json,tarfile,urllib.request
R=Path(__file__).resolve().parents[1];P=R/'validation/learning-0.4.0/runs/helper-build';P.mkdir(parents=True,exist_ok=True)
version='24.19.0';name=f'node-v{version}-linux-x64';archive=P/(name+'.tar.xz')
url=f'https://nodejs.org/dist/v{version}/'
sums=urllib.request.urlopen(url+'SHASUMS256.txt',timeout=30).read();(P/'node-SHASUMS256.txt').write_bytes(sums)
expected=next(l.split()[0] for l in sums.decode().splitlines() if l.endswith(name+'.tar.xz'))
if not archive.exists():urllib.request.urlretrieve(url+archive.name,archive)
sha=lambda b:hashlib.sha256(b).hexdigest()
assert sha(archive.read_bytes())==expected
stage=P/'stage'
if stage.exists():shutil.rmtree(stage)
stage.mkdir()
with tarfile.open(archive) as t:
 for source,target in [(name+'/bin/node','node'),(name+'/LICENSE','Node-LICENSE')]:
  (stage/target).write_bytes(t.extractfile(source).read())
(stage/'node').chmod(0o755)
for f in ['helper.mjs','job.mjs']:shutil.copy2(R/'generator-desktop/helper'/f,stage/f)
(stage/'adapters').mkdir()
for f in ['local.mjs','process.mjs']:shutil.copy2(R/'generator-desktop/adapters'/f,stage/'adapters'/f)
shutil.copy2(R/'generator-desktop/security.mjs',stage/'security.mjs')
b=stage/'bundle';b.mkdir();shutil.copy2(R/'catalog.json',b/'catalog.json');shutil.copytree(R/'generator/src',b/'generator/src');shutil.copy2(R/'generator/package.json',b/'generator/package.json');shutil.copytree(R/'generator/node_modules/fflate',b/'generator/node_modules/fflate');(b/'dist').mkdir()
for t in json.loads((R/'catalog.json').read_text())['templates']:shutil.copy2(R/t['packagePath'],b/t['packagePath'])
files=[{'path':p.relative_to(stage).as_posix(),'sha256':sha(p.read_bytes()),'bytes':p.stat().st_size} for p in sorted(stage.rglob('*')) if p.is_file()]
manifest={'version':'0.4.0','arch':'x64','runtime':'Node '+version,'runtimeSource':url+archive.name,'runtimeArchiveSha256':expected,'files':files}
(stage/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
out=R/'generator-desktop/wsl-helper';out.mkdir(exist_ok=True)
with tarfile.open(out/'helper.tar','w') as t:
 for p in sorted(stage.iterdir()):t.add(p,arcname=p.name)
meta={'version':'0.4.0','arch':'x64','bytes':(out/'helper.tar').stat().st_size,'sha256':sha((out/'helper.tar').read_bytes()),'nodeSha256':sha((stage/'node').read_bytes()),'manifestSha256':sha((stage/'manifest.json').read_bytes()),'helperSha256':sha((stage/'helper.mjs').read_bytes()),'runtimeArchiveSha256':expected,'runtimeSource':url+archive.name}
(out/'bundle.json').write_text(json.dumps(meta,indent=2)+'\n');print(json.dumps(meta))
