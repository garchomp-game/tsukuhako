from pathlib import Path
import json, os, shutil, subprocess, sys, tempfile
root=Path(__file__).resolve().parents[2]
results=[]
locations={tid:root/'starter-templates'/tid for tid in ['S2','S3']}
if len(sys.argv)>1:
    locations={tid:Path(folder).resolve() for tid,folder in zip(sys.argv[1::2],sys.argv[2::2])}
for tid,folder in locations.items():
    for name,value in [('PROJECT_NAME','otoka-unrelated'),('HOST_PORT','65000'),('COMPOSE_PROJECT_NAME','otoka-unrelated'),('COMPOSE_FILE','/tmp/unrelated.yaml'),('COMPOSE_ENV_FILES','/tmp/unrelated.env')]:
        env=dict(os.environ);env[name]=value
        for script in ['doctor-host.sh','app.sh']:
            result=subprocess.run(['bash',f'scripts/{script}',*(['stop'] if script=='app.sh' else [])],cwd=folder,env=env,text=True,capture_output=True)
            assert result.returncode!=0, (tid,name,script,'unexpected success')
            assert name in result.stderr, (tid,name,script,result.stderr)
            results.append({'template':tid,'case':f'{script} rejects exported {name}','result':'PASS'})
    with tempfile.TemporaryDirectory(prefix=f'guard-{tid}-',dir=root/'validation'/tid.lower()/'runs') as temp:
        fixture=Path(temp);(fixture/'scripts').mkdir()
        shutil.copyfile(folder/'scripts/check-settings.sh',fixture/'scripts/check-settings.sh')
        original=(folder/'.env').read_text()
        cases={'unknown_compose_key':original+'COMPOSE_PROJECT_NAME=otoka-unrelated\n','duplicate':original+'HOST_PORT=65000\n','missing':'PROJECT_NAME=otoka-test\n'}
        for name,content in cases.items():
            (fixture/'.env').write_text(content)
            result=subprocess.run(['bash','scripts/check-settings.sh'],cwd=fixture,text=True,capture_output=True)
            assert result.returncode!=0,(tid,name)
            assert 'otoka-unrelated' not in result.stderr
            results.append({'template':tid,'case':f'.env rejects {name}','result':'PASS'})
    result=subprocess.run(['bash','scripts/app.sh','status'],cwd=folder,text=True,capture_output=True)
    assert result.returncode==0,(tid,result.stderr)
    results.append({'template':tid,'case':'own app status allowed','result':'PASS'})
print(json.dumps({'result':'PASS','checks':results},ensure_ascii=False,indent=2))
