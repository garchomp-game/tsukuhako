from pathlib import Path
import json,zipfile,hashlib,subprocess,os
ROOT=Path(__file__).resolve().parents[1]
ARCHIVE=ROOT/'dist/meikyo-generator-cli-0.2.1-linux.zip'
BASE=ROOT/'validation/revision-0.2.1/runs/cli-relocated/別の 場所'
BASE.mkdir(parents=True,exist_ok=False)
with zipfile.ZipFile(ARCHIVE) as z:z.extractall(BASE)
bundle=BASE/ARCHIVE.stem
catalog=json.loads((bundle/'catalog.json').read_text())
env={**os.environ,'NODE_PATH':'','NODE_OPTIONS':''}
records=[]
for t in catalog['templates']:
    if not t['generatorEligible']:continue
    dest=BASE/f"{t['id']} 日本語 ; $(touch should-not-exist)"
    args=['node',str(bundle/'generator/cli.mjs'),'create',t['id'],str(dest),'--json']
    p=subprocess.run(args,cwd='/tmp',env=env,capture_output=True,text=True,timeout=15)
    assert p.returncode==0,p.stderr+p.stdout
    result=json.loads(p.stdout);assert not p.stderr
    version=subprocess.run(['node',str(bundle/'generator/cli.mjs'),'plan',t['id'],str(BASE/f"{t['id']} plan-only"),'--json'],cwd='/tmp',env=env,capture_output=True,text=True,timeout=15)
    assert version.returncode==0,version.stderr
    assert json.loads(version.stdout)['generatorVersion']=='0.2.1'
    assert not (BASE/f"{t['id']} plan-only").exists()
    with zipfile.ZipFile(bundle/t['packagePath']) as z:
        for n in z.namelist():assert (dest/Path(n).relative_to(t['id'])).read_bytes()==z.read(n)
    if t['id']=='I1':
        assert (dest/'.env').stat().st_mode & 0o777==0o600
        secret=next(x.split('=',1)[1] for x in (dest/'.env').read_text().splitlines() if x.startswith('POSTGRES_PASSWORD='))
        assert secret not in p.stdout and secret not in (dest/'START_HERE.md').read_text()
    records.append({'id':t['id'],'version':t['implementationVersion'],'status':'PASS','archiveFiles':len(z.namelist()),'generation':result})
assert not (BASE/'should-not-exist').exists()
report={'status':'PASS','case':'0.2.1 standalone CLI relocated; six templates, version and no-write plan','archive':ARCHIVE.name,'sha256':hashlib.sha256(ARCHIVE.read_bytes()).hexdigest(),'records':records,'network':'No install or network operation during generation; NODE_PATH and NODE_OPTIONS empty; cwd /tmp.'}
(ROOT/'validation/revision-0.2.1/cli-bundle.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'status':'PASS','templates':len(records),'sha256':report['sha256']}))
