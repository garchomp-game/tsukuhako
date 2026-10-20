from pathlib import Path
import datetime,json,subprocess
here=Path(__file__).resolve().parent
initial=json.loads((here/'05-initial-state.json').read_text());project=initial['settings']['PROJECT_NAME']
container=f'supabase_db_{project}'
sql="select json_build_object('database',current_database(),'notesCount',(select count(*) from public.notes),'noteIds',(select json_agg(id order by id) from public.notes),'migrationVersions',(select json_agg(version order by version) from supabase_migrations.schema_migrations));"
data=json.loads(subprocess.check_output(['docker','exec',container,'psql','-X','-U','postgres','-d','postgres','-At','-v','ON_ERROR_STOP=1','-c',sql],text=True))
assert data['notesCount']==2
assert data['noteIds']==['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222']
assert data['migrationVersions']==['20261020000000']
instance=json.loads(subprocess.check_output(['docker','inspect',container],text=True))[0]
mounts=[{'name':m.get('Name'),'destination':m['Destination'],'type':m['Type']} for m in instance['Mounts']]
dbVolumes=[m['name'] for m in mounts if m['type']=='volume' and m['destination']=='/var/lib/postgresql/data']
assert dbVolumes==[f'supabase_db_{project}'],dbVolumes
volume=json.loads(subprocess.check_output(['docker','volume','inspect',dbVolumes[0]],text=True))[0]
record={'result':'PASS','observedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'project':project,'dbContainerId':instance['Id'],'dbContainerCreated':instance['Created'],'database':data,'volume':{'name':volume['Name'],'createdAt':volume['CreatedAt'],'labels':volume['Labels']},'mounts':mounts,'beforeEvidence':'05-initial-state.json','assertion':'New database volume; one bundled migration applied; exactly two fixed seed IDs before any CRUD test; no prior test volume reused.'}
(here/'08-initial-db.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(record,ensure_ascii=False))
