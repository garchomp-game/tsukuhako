from pathlib import Path
import datetime,json,subprocess
here=Path(__file__).resolve().parent
run=json.loads((here/'10-ci-equivalent-sequence.json').read_text());assert run['result']=='PASS'
log=(here/'10-ci-equivalent-sequence.log').read_text()
events=[]
for line in log.splitlines():
    if line.startswith('{"event":'):events.append(json.loads(line))
started=[event for event in events if event['event']=='managed-server-started'][-1]
stopped=[event for event in events if event['event']=='managed-server-stopped'][-1]
assert started['pid']==stopped['pid'] and not started['reused']
assert stopped['processGroupTerminated'] and stopped['portBindable'] and stopped['port']==3000
assert log.index('STEP 1/2: HTTP')<log.index('STEP 2/2: browser')<log.index('PASS: HTTP → browser → server/group exit')<log.index('> next build')
script=f"""import {{assertPortFree}} from './scripts/managed-server.mjs';
for(const pid of [{started['pid']},-{started['pid']}]){{try{{process.kill(pid,0);throw new Error('owned server/group still exists');}}catch(error){{if(error.code!=='ESRCH')throw error;}}}}
await assertPortFree(3000);console.log('PASS: independent post-build check: exact server PID/group absent and internal port3000 bindable');"""
output=subprocess.check_output(['docker','exec','-u','node','-w','/workspace','otoka-s2-2811127744-app-1','node','--input-type=module','-e',script],text=True)
(here/'11-server-boundary.log').write_text(output)
record={'result':'PASS','observedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'environment':{'CI':'true','location':'Node24.22.0/npm11.17.0 Dev Container; same integration→build commands as workflow','actualGithubActions':'NOT_RUN'},'order':['HTTP contract','browser CRUD','owned process group terminated','internal3000 rebind succeeded','production build'],'started':started,'stopped':stopped,'independentAfterBuild':'exact PID and process group ESRCH; internal port3000 bindable','host3504':'Docker published port stays bound until app container stops; this is distinct from internal Next3000 lifecycle','sequenceLog':'10-ci-equivalent-sequence.log'}
(here/'11-server-boundary.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n');print(json.dumps(record,ensure_ascii=False))
