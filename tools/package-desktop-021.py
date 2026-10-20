#!/usr/bin/env python3
from pathlib import Path
import shutil,json,hashlib,tarfile,gzip,os
ROOT=Path(__file__).resolve().parents[1]
GUI=ROOT/'generator-desktop'
NAME='meikyo-generator-linux-x64-0.2.1'
STAGE=ROOT/'validation/revision-0.2.1/runs/desktop-build'/NAME
if STAGE.exists():shutil.rmtree(STAGE)
shutil.copytree(GUI/'node_modules/electron/dist',STAGE,symlinks=True)
(STAGE/'electron').rename(STAGE/'meikyo-generator')
default=STAGE/'resources/default_app.asar'
if default.exists():default.unlink()
app=STAGE/'resources/app';app.mkdir()
for file in ['main.mjs','preload.cjs','worker.mjs','security.mjs']:
    shutil.copy2(GUI/file,app/file)
(app/'package.json').write_text(json.dumps({'name':'meikyo-generator','version':'0.2.1','main':'main.mjs','type':'module'}))
shutil.copytree(GUI/'build',app/'build')
bundle=app/'bundle';bundle.mkdir()
shutil.copy2(ROOT/'catalog.json',bundle/'catalog.json')
shutil.copytree(ROOT/'generator/src',bundle/'generator/src')
shutil.copy2(ROOT/'generator/package.json',bundle/'generator/package.json')
shutil.copytree(ROOT/'generator/node_modules/fflate',bundle/'generator/node_modules/fflate')
(bundle/'dist').mkdir()
for t in json.loads((ROOT/'catalog.json').read_text())['templates']:
    shutil.copy2(ROOT/t['packagePath'],bundle/t['packagePath'])
licenses=STAGE/'third-party';licenses.mkdir()
for name in ['react','react-dom']:
    shutil.copy2(GUI/'node_modules'/name/'LICENSE',licenses/f'{name}-LICENSE.txt')
shutil.copy2(GUI/'README.md',STAGE/'README.md')
sha=lambda b:hashlib.sha256(b).hexdigest()
manifest=[]
for p in sorted(STAGE.rglob('*')):
    if p.is_symlink():assert p.resolve().is_relative_to(STAGE.resolve()),p
    if p.is_file():manifest.append({'path':p.relative_to(STAGE).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())})
OUT=ROOT/'dist'/f'{NAME}.tar.gz'
with OUT.open('wb') as file,gzip.GzipFile(filename='',mode='wb',fileobj=file,mtime=0,compresslevel=6) as gz,tarfile.open(fileobj=gz,mode='w') as tar:
    def fixed(info):info.uid=info.gid=0;info.uname=info.gname='';info.mtime=1792454400;return info
    tar.add(STAGE,arcname=NAME,filter=fixed)
result={'file':OUT.name,'sha256':sha(OUT.read_bytes()),'bytes':OUT.stat().st_size,'files':manifest}
OUT.with_name(OUT.name+'.manifest.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if k!='files'}))
