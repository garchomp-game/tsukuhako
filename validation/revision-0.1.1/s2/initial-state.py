from pathlib import Path
import datetime,hashlib,json,socket,subprocess
here=Path(__file__).resolve().parent;root=here.parents[2]
folder=here/'runs/最終配布 新規起動/S2'
settings=dict(line.split('=',1) for line in (folder/'.env').read_text().splitlines() if line and not line.startswith('#'))
project=settings['PROJECT_NAME']
def docker(*args):return subprocess.check_output(['docker',*args],text=True).strip()
containers=docker('ps','-aq','--filter',f'label=com.supabase.cli.project={project}')
apps=docker('ps','-aq','--filter',f'label=com.docker.compose.project={project}')
volumes=[v for v in docker('volume','ls','--format','{{.Name}}').splitlines() if project in v]
networks=[n for n in docker('network','ls','--format','{{.Name}}').splitlines() if project in n]
assert not containers and not apps and not volumes and not networks
missing=['.env.local','.cache','.local','supabase/config.toml']
assert all(not (folder/name).exists() for name in missing)
for key,value in settings.items():
    if key.endswith('_PORT'):
        with socket.socket() as listener:listener.bind(('0.0.0.0',int(value)))
manifest=json.loads((root/'dist/S2-0.1.1.manifest.json').read_text())
assert hashlib.sha256((root/'dist/S2-0.1.1.zip').read_bytes()).hexdigest()==manifest['sha256']
for name,digest in manifest['files'].items():assert hashlib.sha256((folder/name).read_bytes()).hexdigest()==digest,name
record={'result':'PASS','observedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'artifact':'S2-0.1.1.zip','sha256':manifest['sha256'],'folder':str(folder.relative_to(root)),'settings':settings,'containersBefore':[],'appContainersBefore':[],'volumesBefore':volumes,'networksBefore':networks,'localGeneratedFilesAbsent':missing,'allFivePortsBindable':True,'allArchiveFilesMatchBeforeFirstStart':True,'databaseInitialState':'No DB container, volume or local config existed for this fresh project ID. CLI first start will initialize a new database. No old test volume attached.'}
(here/'05-initial-state.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(record,ensure_ascii=False))
