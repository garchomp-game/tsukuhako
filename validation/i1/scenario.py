#!/usr/bin/env python3
import json, os, pathlib, shutil, subprocess, sys
HERE=pathlib.Path(__file__).resolve().parent
ROOT=HERE.parent.parent
TRIAL=HERE/'runs'/'初回 PostgreSQL'
COPY=HERE/'runs'/'別コピー PostgreSQL'
CLI=ROOT/'tools/node_modules/.bin/devcontainer'
observations=json.loads((HERE/"observations.json").read_text()) if (HERE/"observations.json").exists() else []
resume_before=os.environ.get("I1_RESUME_BEFORE", "")
active=not resume_before
def run(name,args,cwd=TRIAL,expect=0,contains=None):
 global active
 if not active:
  if name != resume_before: return ""
  active=True
 command=[sys.executable,str(HERE/'run.py'),'--cwd',str(cwd),'--expect',str(expect),name,'--',*map(str,args)]
 subprocess.run(command,check=True)
 output=(HERE/'logs'/f'{name}.log').read_text()
 if contains is not None:
  assert contains in output,(name,contains,output)
 observations.append({'id':name,'result':'PASS','assertion':contains or f'exit={expect}'})
 (HERE/'observations.json').write_text(json.dumps(observations,ensure_ascii=False,indent=2))
 return output
def db(name,*args,**kw): return run(name,['bash','scripts/project.sh','db',*args],**kw)
def sql(name,query,**kw): return db(name,'connect','--no-align','--tuples-only','-c',query,**kw)
run('shell-static',['bash','-c','bash -n scripts/*.sh && shellcheck -x scripts/*.sh'],cwd=ROOT/'starter-templates/I1')
run('no-host-node',['env','PATH=/usr/bin:/bin','bash','scripts/doctor.sh'],contains='PASS: Docker')
run('docker-unreachable',['env','DOCKER_HOST=unix:///tmp/otoka-i1-no-such-docker.sock','bash','scripts/doctor.sh'],expect=1,contains='Docker に接続できません')
run('config-preserved',['bash','scripts/configure.sh'],contains='設定を保持')
run('config-refuses-overwrite',['bash','scripts/configure.sh','--port','55440'],expect=1,contains='上書きしません')
run('devcontainer-exec',['bash','-c',f'"{CLI}" exec --workspace-folder "$PWD" bash -c "id -u; psql --version; test -w /workspace"'],contains='1000')
sql('empty-before-setup',"SELECT to_regclass('public.sample_items') IS NULL;",contains='t')
db('setup-empty','setup',contains='CREATE TABLE')
db('semantic-check','check',contains='PASS: SQL CRUD')
sql('seed-two-rows',"SELECT count(*) FROM sample_items;",contains='2')
sql('edit-and-persist',"UPDATE sample_items SET quantity=17 WHERE code='notebook'; INSERT INTO sample_items(code,name,quantity) VALUES ('persist-probe','保持を確認',42);")
db('setup-repeat','setup',contains='skip: 001_create_sample_items.sql')
sql('seed-idempotent',"SELECT count(*)=3 AND count(*) FILTER (WHERE code='notebook' AND quantity=17)=1 FROM sample_items;",contains='t')
practice=TRIAL/'sql/practice.sql'
practice.write_text(practice.read_text().replace('SQLの練習','変更反映を確認'))
db('source-change','query','sql/practice.sql',contains='変更反映を確認')
migration=TRIAL/'migrations/001_create_sample_items.sql'; original=migration.read_text()
try:
 migration.write_text(original+'\n-- test modified applied migration\n')
 db('migration-drift-refused-fixed','migrate',expect=3,contains='適用済みmigrationを変更しました')
finally: migration.write_text(original)
(TRIAL/'migrations/002_add_note.sql').write_text("ALTER TABLE public.sample_items ADD COLUMN note text NOT NULL DEFAULT '';\n")
db('migration-add-column','migrate',contains='ALTER TABLE')
db('migration-repeat','migrate',contains='skip: 002_add_note.sql')
sql('column-use',"UPDATE sample_items SET note='migrationで追加' WHERE code='persist-probe'; SELECT note FROM sample_items WHERE code='persist-probe';",contains='migrationで追加')
bad=TRIAL/'migrations/003_failure_probe.sql'
try:
 bad.write_text('CREATE TABLE public.must_rollback(id integer);\nSELECT missing_column FROM missing_table;\n')
 db('migration-failure-atomic','migrate',expect=3,contains='does not exist')
 sql('migration-rollback-proof',"SELECT to_regclass('public.must_rollback') IS NULL AND NOT EXISTS (SELECT 1 FROM schema_migrations WHERE name='003_failure_probe.sql');",contains='t')
finally: bad.unlink(missing_ok=True)
run('stop',['bash','scripts/project.sh','stop'])
run('resume',['bash','scripts/project.sh','start'])
sql('persist-after-stop',"SELECT name || ':' || quantity || ':' || note FROM sample_items WHERE code='persist-probe';",contains='保持を確認:42:migrationで追加')
run('remove-containers-keep-data',['bash','scripts/project.sh','down'])
run('devcontainer-rebuild',[CLI,'up','--workspace-folder',TRIAL,'--remove-existing-container','--log-level','info'])
sql('persist-after-recreate',"SELECT name || ':' || quantity || ':' || note FROM sample_items WHERE code='persist-probe';",contains='保持を確認:42:migrationで追加')
db('source-after-recreate','query','sql/practice.sql',contains='変更反映を確認')
run('devcontainer-reconnect',[CLI,'exec','--workspace-folder',TRIAL,'bash','scripts/db.sh','check'],contains='PASS: SQL CRUD')
if not COPY.exists(): shutil.copytree(ROOT/'starter-templates/I1',COPY)
run('config-missing',['bash','scripts/doctor.sh'],cwd=COPY,expect=1,contains='設定がありません')
run('config-invalid-port',['bash','scripts/configure.sh','--port','99'],cwd=COPY,expect=1,contains='1024')
if active: shutil.copy2(TRIAL/'.env',COPY/'.env')
run('copied-env-refused',['bash','scripts/doctor.sh'],cwd=COPY,expect=1,contains='別フォルダの .env')
run('configure-copy',['bash','scripts/configure.sh','--new-copy','--name','validation','--port','55433'],cwd=COPY)
run('second-copy-start',['bash','scripts/project.sh','start'],cwd=COPY)
db('second-copy-setup','setup',cwd=COPY)
sql('copies-isolated',"SELECT count(*)=2 AND NOT EXISTS(SELECT 1 FROM sample_items WHERE code='persist-probe') FROM sample_items;",cwd=COPY,contains='t')
sql('second-copy-marker',"INSERT INTO sample_items(code,name,quantity) VALUES('other-copy','別コピーの保持',99);",cwd=COPY)
project=dict(line.split('=',1) for line in (TRIAL/'.env').read_text().splitlines())['PROJECT_NAME']
other_project=dict(line.split('=',1) for line in (COPY/'.env').read_text().splitlines())['PROJECT_NAME']
run('wrong-reset-refused',['bash','scripts/project.sh','reset','--confirm',other_project],expect=1,contains='--confirm')
run('scoped-reset',['bash','scripts/project.sh','reset','--confirm',project],contains=project+'_pgdata')
sql('other-copy-survives-reset',"SELECT name || ':' || quantity FROM sample_items WHERE code='other-copy';",cwd=COPY,contains='別コピーの保持:99')
run('reset-start-empty',['bash','scripts/project.sh','start'])
sql('reset-is-empty',"SELECT to_regclass('public.sample_items') IS NULL;",contains='t')
db('reset-reconstruct','setup')
sql('reset-seed-and-migration',"SELECT count(*)=2 AND count(note)=2 AND NOT EXISTS(SELECT 1 FROM sample_items WHERE code='persist-probe') FROM sample_items;",contains='t')
db('final-semantic-check','check',contains='PASS: SQL CRUD')
run('resources-first',['bash','scripts/project.sh','resources'])
run('resources-second',['bash','scripts/project.sh','resources'],cwd=COPY)
run('published-ports',['docker','ps','--filter','label=otoka.template=I1','--format','{{.Names}} {{.Ports}}'],contains='127.0.0.1:55432->5432/tcp')
run('memory-snapshot',['docker','stats','--no-stream','--format','{{.Name}} {{.MemUsage}}',f'{project}-app-1',f'{project}-db-1',f'{other_project}-app-1',f'{other_project}-db-1'])
run('image-size',['docker','image','inspect','postgres:18.6-bookworm@sha256:afc7e2d441324c0388fa80c3d24f733b4194a4eb7f47dd8ee2b08eb1a24a647c','--format','{{.Id}} {{.Size}} {{json .RepoDigests}}'])
resources=[]
for cwd,pname,port in [(TRIAL,project,55432),(COPY,other_project,55433)]:
 resources.append({'trial':str(cwd.relative_to(ROOT)),'project':pname,'containers':[pname+'-app-1',pname+'-db-1'],'network':pname+'_default','volume':pname+'_pgdata','image':pname+'-dev:0.1.0','hostPort':port,'bindAddress':'127.0.0.1','status':'running; scoped cleanup pending'})
(HERE/'resources.json').write_text(json.dumps(resources,ensure_ascii=False,indent=2))
print('ALL SQL AND ISOLATION CHECKS PASSED')
