from pathlib import Path
import datetime, hashlib, json, subprocess
root=Path(__file__).resolve().parents[2]
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
def command(*args):
    return subprocess.check_output(['docker',*args],text=True).strip()
def identifiers(kind,project):
    return sorted(set((command(kind,'ls','-q','--filter',f'label=com.docker.compose.project={project}')+'\n'+command(kind,'ls','-q','--filter',f'label=com.supabase.cli.project={project}')).split()))
projects={'S2':['otoka-s2-2226800358','otoka-s2-410292944'],'S3':['otoka-s3-2237852257','otoka-s3-243362404']}
for tid,names in projects.items():
    ledger={'observedAt':now,'result':'PASS','state':'all task-owned application and Supabase containers stopped; volumes/images retained','projects':[],'noGlobalPrune':True}
    for project in names:
        ids=sorted(set((command('ps','-aq','--filter',f'label=com.docker.compose.project={project}')+'\n'+command('ps','-aq','--filter',f'label=com.supabase.cli.project={project}')).split()))
        containers=[]
        for id in ids:
            obj=json.loads(command('inspect',id))[0]
            assert not obj['State']['Running'],obj['Name']
            containers.append({'id':obj['Id'],'name':obj['Name'],'status':obj['State']['Status'],'image':obj['Config']['Image'],'ports':obj['HostConfig'].get('PortBindings'),'mounts':[{'type':m['Type'],'name':m.get('Name'),'destination':m['Destination']} for m in obj['Mounts']]})
        volumes=identifiers('volume',project)
        networks=[]
        for name in [f'{project}-network',f'{project}_default']:
            result=subprocess.run(['docker','network','inspect',name],text=True,capture_output=True)
            if result.returncode==0:
                obj=json.loads(result.stdout)[0]
                networks.append({'id':obj['Id'],'name':obj['Name'],'labels':obj['Labels'],'options':obj['Options'],'connectedContainers':list(obj['Containers'])})
        image=json.loads(command('image','inspect',f'{project}-dev:0.1.0'))[0]
        ledger['projects'].append({'project':project,'containers':containers,'volumes':volumes,'networks':networks,'appImage':{'tag':f'{project}-dev:0.1.0','id':image['Id'],'bytes':image['Size']}})
    ledger['unrelatedBaselineStillRunning']=[id for id in ['b531d3443746','8e9f201539c5'] if command('inspect','--format','{{.State.Running}}',id)=='true']
    assert len(ledger['unrelatedBaselineStillRunning'])==2
    (root/f'validation/{tid.lower()}/resources-final.json').write_text(json.dumps(ledger,ensure_ascii=False,indent=2)+'\n')
guards=json.loads((root/'validation/s3/16-final-zip-guards.json').read_text())
(root/'validation/s2/41-final-zip-guards.json').write_text(json.dumps({'result':'PASS','checks':[c for c in guards['checks'] if c['template']=='S2']},ensure_ascii=False,indent=2)+'\n')
s2=json.loads((root/'validation/s2/summary.json').read_text())
s2.update({'testedAt':now,'finalZip':json.loads((root/'validation/s2/final-zip.json').read_text()),'resourcePolicy':'Both task-owned S2 Supabase stacks and apps stopped. DB volumes, app dependency/cache volumes, local images and networks retained. Shared Docker was not pruned; unrelated baseline containers remained running.'})
s2['evidence'].update({'finalZipRestart':'35-final-zip-fixed.json','finalZipStaticUnit':'36-final-zip-check.log','finalZipBrowser':'39-final-zip-browser-fixed.json','finalZipGuards':'41-final-zip-guards.json','finalZipStop':'40-final-stop.log','resourcesFinal':'resources-final.json'})
s2['warnings'] += ['Final candidate ZIP exposed unquoted CLI version check in a space-containing path. Runtime fix quoted the executable; final ZIP c18b3b... reused cached CLI without downloading and passed.', 'Final smoke harness expected DELETE200, but API contract is DELETE204. Harness-only correction passed on the unchanged final ZIP; failed record38 retained.']
(root/'validation/s2/summary.json').write_text(json.dumps(s2,ensure_ascii=False,indent=2)+'\n')
s3={'templateId':'S3','version':'0.1.0','testedAt':now,'result':'BLOCKED','localResult':'PASS','scope':'Additional read-only cloud starter; Linux local container/build/missing-and-failure UI/SQL permissions/standalone final ZIP validated. Dedicated live cloud endpoint/key not provided.',
    'environment':{**{k:v for k,v in s2['environment'].items() if k not in ['supabaseCli','postgres','browserAutomation']},'sql':'Supabase PostgreSQL17.11 isolated temporary DB; PostgreSQL18.6 portless temporary container','browserAutomation':'Playwright1.64.1 controlling host Chrome155.0.8059.84'},
    'blocked':[{'item':'Live Supabase cloud data fetch and SQL application','reason':'Dedicated learning project URL/public key not provided; no account/project was created.'}],
    'notRun':['VS Code UI','Windows/WSL device','macOS','ARM','fresh-PC install','GitHub-hosted CI','source HMR-specific test','cloud-data persistence/rebuild','beginner usability study'],
    'finalZip':json.loads((root/'validation/s3/final-zip.json').read_text()),
    'evidence':{'localSupabaseSQL':'01-local-permissions.log','portlessSQL':'02-portless-sql-harness.log','devcontainer':'03-devcontainer.log','staticUnitBuild':'05-check-unit-build-fixed.log','finalZipUp':'12-final-zip-up.log','finalZipStaticUnitBuild':'13-final-zip-check.log','finalZipBrowser':'15-final-zip-browser.log','finalZipGuards':'16-final-zip-guards.json','restart':'17-final-zip-restart.log','settingsRemovedAfterRestart':'19-restarted-guidance.log','finalZipSQL':'20-final-zip-sql.log','finalStop':'21-final-stop.log','resources':'resources-final.json','desktop':'ui-desktop.png','mobile':'ui-mobile.png'},
    'resourcePolicy':'Both S3 app containers stopped, dependency/cache volumes/images retained. Temporary SQL containers self-removed; temporary DB in task-owned S2 stack dropped. No cloud resources or shared Docker resources modified.',
    'warnings':['Initial lint link issue fixed; check/test/build rerun passed.','Initial browser harness counted Next development button; scoped to main. A follow-up env-removal assertion assumed live values unload; README requires dev restart and final ZIP restart verified missing state.','S3 disables Next dev indicator to keep the mobile reload button unobstructed.','Live cloud BLOCKED is not converted to PASS by local SQL or fixture results.'],
    'timing':'CLI log timestamps record startup. Browser15 measured4.06s and restarted guidance19 measured1.83s. No inferred end-to-end install duration claimed.'}
(root/'validation/s3/summary.json').write_text(json.dumps(s3,ensure_ascii=False,indent=2)+'\n')
for tid in ['S2','S3']:
    manifest=json.loads((root/f'dist/{tid}-0.1.0.manifest.json').read_text())
    assert hashlib.sha256((root/f'dist/{tid}-0.1.0.zip').read_bytes()).hexdigest()==manifest['sha256']
    for name,digest in manifest['files'].items():
        assert hashlib.sha256((root/'starter-templates'/tid/name).read_bytes()).hexdigest()==digest,(tid,name)
print('PASS: final ZIP checksums/source freeze; stopped-resource ledgers and S2/S3 summaries saved.')
