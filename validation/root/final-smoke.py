from pathlib import Path
import subprocess,json,time,datetime,sys,os
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'validation/root/final-packages'/os.environ.get('MEIKYO_SMOKE_RUN','initial')
OUT.mkdir(parents=True,exist_ok=True)
records=[]

def run(tid,step,cmd,cwd,expected=0,env=None):
    start=time.monotonic()
    p=subprocess.run([str(x) for x in cmd],cwd=cwd,capture_output=True,text=True,timeout=240,env=env)
    log=f'{tid}-{step}.log'
    (OUT/log).write_text(p.stdout+p.stderr)
    record={'id':tid,'step':step,'command':[str(x) for x in cmd],'cwd':str(cwd.relative_to(ROOT)),'startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'durationSeconds':round(time.monotonic()-start,3),'exitCode':p.returncode,'expectedExitCode':expected,'status':'PASS' if p.returncode==expected else 'FAIL','log':log}
    records.append(record)
    (OUT/'results.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(record,ensure_ascii=False),flush=True)
    if p.returncode!=expected: raise RuntimeError(p.stdout[-2000:]+p.stderr[-2000:])
    return p

for tid in sys.argv[1:]:
    port={'F1':34900,'F2':34901,'B1':34902,'S1':34903}[tid]
    parent=OUT/'runs'/'最終 展開';parent.mkdir(parents=True,exist_ok=True)
    folder=parent/tid
    run(tid,'generator-create',['node','generator/cli.mjs','create',tid,folder,'--name','final','--port',str(port)],ROOT)
    manifest=json.loads((ROOT/'dist'/f'{tid}-0.1.0.manifest.json').read_text())
    records[-1]['testedArchiveSha256']=manifest['sha256']
    try:
        run(tid,'devcontainer-up',[ROOT/'tools/node_modules/.bin/devcontainer','up','--workspace-folder',folder],ROOT)
        run(tid,'check',[ROOT/'tools/node_modules/.bin/devcontainer','exec','--workspace-folder',folder,'npm','run','check'],ROOT)
        project=next(x.split('=',1)[1] for x in (folder/'.env').read_text().splitlines() if x.startswith('PROJECT_NAME='))
        compose=['docker','compose','--project-directory',folder,'--env-file',folder/'.env','--project-name',project,'-f',folder/'compose.yaml']
        run(tid,'dev',compose+['exec','-d','app','sh','-c','npm run dev > /tmp/meikyo-final-dev.log 2>&1'],ROOT)
        run(tid,'function',['node','validation/root/final-ui-probe.mjs',tid,str(port)],ROOT)
        if tid=='F2': run(tid,'duplicate-server-refused',compose+['exec','-T','app','npm','run','dev'],ROOT,expected=1)
    finally:
        run(tid,'stop',['bash','scripts/compose.sh','stop'],folder)
