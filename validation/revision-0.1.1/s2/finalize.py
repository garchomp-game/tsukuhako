from pathlib import Path
import datetime,hashlib,json,re,socket,subprocess
here=Path(__file__).resolve().parent;root=here.parents[2]
project='otoka-s2-2811127744';folder=here/'runs/最終配布 新規起動/S2'
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
def docker(*args):return subprocess.check_output(['docker',*args],text=True).strip()
required=['06-fresh-db-start','07-fresh-devcontainer-up','09-fresh-database-tests','10-ci-equivalent-sequence','14-browser-before-stop','15-normal-stop','17-normal-restart','19-browser-after-restart','20-final-stop']
for name in required:assert json.loads((here/f'{name}.json').read_text())['result']=='PASS',name
assert json.loads((here/'11-server-boundary.json').read_text())['result']=='PASS'
assert json.loads((here/'13-existing-server-refused.json').read_text())['result']=='PASS'
ports=[3504,54621,54622,54623,54620]
for port in ports:
    with socket.socket() as listener:listener.bind(('0.0.0.0',port))
assert not docker('ps','-q','--filter',f'label=com.docker.compose.project={project}')
assert not docker('ps','-q','--filter',f'label=com.supabase.cli.project={project}')
app=json.loads(docker('inspect',f'{project}-app-1'))[0]
assert not app['State']['Running']
volumes=docker('volume','ls','-q','--filter',f'label=com.docker.compose.project={project}').splitlines()
volumeDetails=[]
for name in volumes:
    obj=json.loads(docker('volume','inspect',name))[0]
    volumeDetails.append({'name':name,'createdAt':obj['CreatedAt'],'labels':obj['Labels']})
network=json.loads(docker('network','inspect',f'{project}-network'))[0]
assert not network['Containers']
assert network['Options']['com.docker.network.bridge.host_binding_ipv4']=='127.0.0.1'
priorS2=[]
for name in ['otoka-s2-2226800358','otoka-s2-410292944']:
    assert not docker('ps','-q','--filter',f'label=com.docker.compose.project={name}')
    assert not docker('ps','-q','--filter',f'label=com.supabase.cli.project={name}')
    priorS2.append({'project':name,'running':False,'databaseUsedInFreshAcceptance':False})
baseline=['b531d3443746','8e9f201539c5']
assert all(docker('inspect','--format','{{.State.Running}}',id)=='true' for id in baseline)
ledger={'result':'PASS','observedAt':now,'project':project,'app':{'id':app['Id'],'name':app['Name'],'status':app['State']['Status'],'image':app['Config']['Image']},'runningOwnedContainers':[],'releasedHostPorts':ports,'retainedVolumes':volumeDetails,'retainedNetwork':{'id':network['Id'],'name':network['Name'],'options':network['Options'],'connectedContainers':[]},'priorS2State':priorS2,'unrelatedBaselineStillRunning':baseline,'cleanup':'Only current app/db stop helpers used. No reset, volume deletion or global prune. Images/volumes/network retained for learning restart.'}
(here/'21-resources-final.json').write_text(json.dumps(ledger,ensure_ascii=False,indent=2)+'\n')
manifest=json.loads((root/'dist/S2-0.1.1.manifest.json').read_text())
assert hashlib.sha256((root/'dist/S2-0.1.1.zip').read_bytes()).hexdigest()==manifest['sha256']
changed=[]
for name,digest in manifest['files'].items():
    assert hashlib.sha256((root/'starter-templates/S2'/name).read_bytes()).hexdigest()==digest,name
    if hashlib.sha256((folder/name).read_bytes()).hexdigest()!=digest:changed.append(name)
assert not set(changed)-{'next-env.d.ts'}
identity={'result':'PASS','artifact':manifest['file'],'sha256':manifest['sha256'],'bytes':manifest['bytes'],'sourceMatchesAllManifestFiles':True,'freshCopyMatchesHandAuthoredFiles':True,'frameworkGeneratedDifferences':changed,'sourceFrozen':True}
(here/'22-final-artifact.json').write_text(json.dumps(identity,ensure_ascii=False,indent=2)+'\n')
secretPattern=re.compile(r'eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}|sb_secret_[A-Za-z0-9_-]{12,}')
for file in here.iterdir():
    if file.is_file() and file.suffix in ['.json','.jsonl','.log','.md','.py','.mjs']:
        assert not secretPattern.search(file.read_text()),file.name
summary={'templateId':'S2','version':'0.1.1','testedAt':now,'result':'PASS','scope':'R2 regression and exact final ZIP from new path/new ID/new empty DB, Linux local validation only',
  'artifact':identity,
  'R2':{'result':'PASS','change':'Direct Next process in a dedicated process group; HTTP and browser share it; finally waits for complete group exit and port release before the next build step. Existing servers are refused.','files':['scripts/managed-server.mjs','scripts/test-integration.mjs','tests/managed-server.test.mjs','playwright.config.ts','.github/workflows/check.yml'],'regressionTests':{'unit':5,'http':2,'browser':2,'failureCleanup':'child-server process group terminated on callback failure','occupiedPort':'fixture owner retained; actual running Next also refused and retained'},'ciEquivalent':'CI=true check/install browser/unit/HTTP/browser/verified shutdown/build in one consecutive shell run; PASS','boundary':'PID/group286 gone and internal3000 bindable before build; independent post-build check also PASS','actualGithubActions':'NOT_RUN','evidence':['03-preflight-final.log','10-ci-equivalent-sequence.json','11-server-boundary.json','13-existing-server-refused.json']},
  'freshFinalZip':{'result':'PASS','path':str(folder.relative_to(root)),'project':project,'sha256':manifest['sha256'],'initialState':'No app/DB containers, volumes, networks or generated DB config for this new project before first start','initialDatabase':'New supabase_db volume; exactly migration20261020000000 and the two fixed seed UUIDs before CRUD','commands':'configure → doctor → db start → DevContainer up/npm ci → SQL/migration/seed checks → CI-equivalent sequence → normal dev/browser create/edit/reload → app+DB stop → DB+app restart → same ID/body retained → browser delete/reload → final stop','stopRestart':'Same synthetic note ID/body and original seed2 retained; deletion after restart left seed2 only; no reset used','resourceIsolation':'All five host ports separate; no previous test DB or volume reused in acceptance. Image/download caches allowed.','evidence':['05-initial-state.json','06-fresh-db-start.json','07-fresh-devcontainer-up.json','08-initial-db.json','09-fresh-database-tests.json','14-browser-before-stop.json','16-normal-stop-state.json','17-normal-restart.json','19-browser-after-restart.json','20-final-stop.json']},
  'environment':{'host':'Linux Mint22.3 x86_64','docker':'29.9.1','compose':'5.6.0','devcontainerCLI':'0.89.0','nodeInContainer':'24.22.0','npmInContainer':'11.17.0','supabaseCLI':'2.121.0','postgres':'17.11.0.004','testBrowser':'Playwright1.64.1 / bundled Chromium156','visualBrowser':'host Google Chrome155; desktop/mobile screenshots inspected'},
  'notRun':['Actual GitHub Actions / push','VS Code GUI Reopen/edit/reconnect/Rebuild','Windows+WSL actual device','macOS / ARM','Fresh-PC tool installation','Beginner usability study','Cloud connection / deployment'],
  'resources':'21-resources-final.json','sourceFreeze':'22-final-artifact.json','secrets':'No actual key/JWT patterns in revision evidence outside excluded runs; raw .env.local and CLI status not logged','preflightScope':'Existing source app dependency volume was used only for static/unit preflight and stopped before fresh acceptance; no old DB started. Final acceptance app, npm/dependency and DB volumes were all new.',
  'notes':['Runtime image tag0.1.0 retains the unchanged fixed toolchain; template/package/lock/VERSION are0.1.1.','No S3/I1 files or resources modified.','Old0.1.0 validation and ZIP retained; this revision evidence is separate.']}
(here/'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'result':'PASS','summary':str((here/'summary.json').relative_to(root)),'sha256':manifest['sha256'],'ownedRunningContainers':0,'unrelatedBaselineStillRunning':2}))
