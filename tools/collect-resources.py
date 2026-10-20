"""この試作で作った識別名だけを対象に、秘密を出さず資源台帳を作る。"""
from pathlib import Path
import subprocess,json,os,datetime

ROOT=Path(__file__).resolve().parents[1]
projects=set()
for base,dirs,files in os.walk(ROOT):
    dirs[:]=[x for x in dirs if x not in {'node_modules','.next','.cache','.git','.local','dist'}]
    if '.env' in files:
        p=Path(base)/'.env'
        if p.is_symlink(): continue
        for line in p.read_text().splitlines():
            if line.startswith('PROJECT_NAME=otoka-'): projects.add(line.split('=',1)[1])
# adapter stores its name in the reviewed generated plan, not application .env.
for p in (ROOT/'validation/adapter').glob('*plan*.json'):
    obj=json.loads(p.read_text())
    def walk(value):
        if isinstance(value,dict):
            for k,v in value.items():
                if k in ['projectName','project'] and isinstance(v,str) and v.startswith('otoka-'): projects.add(v)
                walk(v)
        elif isinstance(value,list):
            for v in value: walk(v)
    walk(obj)

def output(args): return subprocess.check_output(args,text=True).strip()
def inspect(kind,ids): return json.loads(output(['docker',kind,'inspect',*ids])) if ids else []
containers=inspect('container',output(['docker','ps','-aq']).splitlines())
owned=[];baseline=[]
baseline_ids=json.loads((ROOT/'validation/environment.json').read_text())['baselineUnrelatedContainerIds']
for c in containers:
    labels=c.get('Config',{}).get('Labels') or {}
    mounts=c.get('Mounts',[])
    name=c['Name'].lstrip('/')
    root_mount=any(m.get('Source','').startswith(str(ROOT)+'/') for m in mounts)
    matches=any(p in name for p in projects)
    if root_mount or labels.get('com.docker.compose.project') in projects or matches:
        project=labels.get('com.docker.compose.project')
        if project: projects.add(project)
        owned.append({'id':c['Id'],'name':name,'state':c['State']['Status'],'project':project,'image':c['Config']['Image'],'volumes':[m['Name'] for m in mounts if m['Type']=='volume'],'bindSources':[m['Source'] for m in mounts if m['Type']=='bind' and m.get('Source','').startswith(str(ROOT))],'publishedPorts':c['HostConfig'].get('PortBindings') or {}})
    elif any(c['Id'].startswith(i) for i in baseline_ids):
        baseline.append({'id':c['Id'][:12],'name':name,'state':c['State']['Status'],'action':'not modified by this task'})
volumes=[]
for v in inspect('volume',output(['docker','volume','ls','-q']).splitlines()):
    if (v.get('Labels') or {}).get('com.docker.compose.project') in projects or any(p in v['Name'] for p in projects):
        volumes.append({'name':v['Name'],'driver':v['Driver'],'project':(v.get('Labels') or {}).get('com.docker.compose.project')})
networks=[]
for n in inspect('network',output(['docker','network','ls','-q']).splitlines()):
    if (n.get('Labels') or {}).get('com.docker.compose.project') in projects or any(p in n['Name'] for p in projects):
        networks.append({'name':n['Name'],'driver':n['Driver'],'attachedContainers':len(n.get('Containers') or {})})
result={'recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'policy':'Task trial containers stopped. Named volumes and images retained. No global prune.','taskProjectNames':sorted(projects),'containers':owned,'retainedVolumes':volumes,'networks':networks,'baselineUnrelated':baseline,'allTrialContainersStopped':all(c['state']!='running' for c in owned),'resources':{'memory':output(['free','-h']),'disk':output(['df','-h',str(ROOT)])}}
(ROOT/'validation/resources-final.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'containers':len(owned),'running':[c['name'] for c in owned if c['state']=='running'],'volumes':len(volumes),'baseline':baseline},ensure_ascii=False))
