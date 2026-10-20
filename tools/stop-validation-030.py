"""Stop only recorded 0.3.0 fixtures, preserve volumes, and verify released ports."""
from pathlib import Path
import datetime
import json
import socket
import subprocess

ROOT = Path(__file__).resolve().parents[1]
E = ROOT / 'validation/brand-0.3.0'
startup = E / 'runs/startup'
def run(args, cwd=None):
    return subprocess.check_output(args, cwd=cwd, text=True).strip()
def settings(p):
    return dict(line.split('=', 1) for line in (p / '.env').read_text().splitlines())
projects, before = {}, []
for tid in ['F2','S2']:
    folder = startup / (tid + ' 学習')
    project = settings(folder)['PROJECT_NAME']
    projects[tid] = project
    ids = run(['docker','ps','-aq','--filter','label=com.docker.compose.project=' + project]).split()
    before += ids
    if tid == 'F2':
        run(['bash','scripts/compose.sh','down'], folder)
    else:
        run(['bash','scripts/app.sh','stop'], folder)
        run(['bash','scripts/db.sh','stop'], folder)
        run(['docker','compose','--project-name',project,'--env-file','.env','--file','compose.yaml','down'], folder)

# Remove just the two empty local networks created for this migration, including the superseded fixture.
old = E / 'runs/pre-footer/startup/S2 学習'
network_projects = [projects['S2']]
if old.exists():
    network_projects.append(settings(old)['PROJECT_NAME'])
removed = []
for project in network_projects:
    name = project + '-network'
    result = subprocess.run(['docker','network','inspect',name], capture_output=True, text=True)
    if result.returncode:
        continue
    network = json.loads(result.stdout)[0]
    assert network['Labels'].get('otoka.s2.owner') == str(startup / 'S2 学習')
    assert not network.get('Containers')
    run(['docker','network','rm',network['Id']])
    removed.append(name)
ports = [3761,3764,55320,55321,55322,55323]
for port in ports:
    with socket.socket() as sock:
        sock.settimeout(1)
        assert sock.connect_ex(('127.0.0.1',port)) != 0, f'Port still open: {port}'
baseline = json.loads((E / 'host.json').read_text())
baseline_ids = [line.split()[0] for line in baseline['runningContainersBefore']]
current = json.loads(run(['docker','inspect',*baseline_ids]))
assert all(c['State']['Running'] and c['State']['Health']['Status'] == 'healthy' for c in current)
reset = json.loads((E / 'docker-reset.json').read_text())
prior_volumes = json.loads((Path(reset['privateRecoveryMetadata']) / 'volumes.json').read_text())
now_volumes = set(run(['docker','volume','ls','-q']).split())
assert {v['Name'] for v in prior_volumes} <= now_volumes
running = run(['docker','ps','-q']).split()
assert set(running) == set(baseline_ids), 'Unexpected running fixture remains'
record = {
    'status':'PASS', 'recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'projects':projects, 'fixtureComposeContainersRemoved':before, 'removedEmptySupabaseNetworks':removed,
    'releasedPorts':ports, 'baselineDatabasesStillHealthy':len(current),
    'allOriginalVolumesPreserved':len(prior_volumes), 'volumesNow':len(now_volumes),
    'networksNow':len(run(['docker','network','ls','-q']).split()),
    'runningContainersNow':len(running), 'databaseVolumeDeletion':False,
    'scope':'Only explicit 0.3.0 test resources stopped; sources, data volumes and image caches retained.'
}
(E / 'resource-cleanup.json').write_text(json.dumps(record,ensure_ascii=False,indent=2) + '\n')
print(json.dumps(record,ensure_ascii=False,indent=2))
