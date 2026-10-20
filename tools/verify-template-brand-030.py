"""Build the six changed template ZIPs with their pinned Node image; inspect local previews."""
from pathlib import Path
import argparse, datetime, hashlib, json, os, subprocess, time, zipfile

ROOT = Path(__file__).resolve().parents[1]
E = ROOT / 'validation/brand-0.3.0/templates'
parser = argparse.ArgumentParser()
parser.add_argument('--templates', nargs='+', choices=['F1','F2','B1','S1','S2','S3'], default=['F1','F2','B1','S1','S2','S3'])
parser.add_argument('--label', default='template-checks')
args = parser.parse_args()
assert args.label.replace('-', '').isalnum(), 'Use a simple dedicated run label'
RUNS = ROOT / 'validation/brand-0.3.0/runs' / args.label
E.mkdir(parents=True, exist_ok=True)
RUNS.mkdir(parents=True, exist_ok=False)
cache = RUNS / 'npm-cache'
cache.mkdir()
previous = json.loads((E/'summary.json').read_text())['records'] if (E/'summary.json').exists() else []
records = [r for r in previous if r['id'] not in args.templates]
def run(command, log, timeout=600):
    started = time.monotonic()
    with log.open('w') as output:
        result = subprocess.run(command, stdout=output, stderr=subprocess.STDOUT, timeout=timeout)
    record = {'command':command, 'exitCode':result.returncode, 'seconds':round(time.monotonic()-started,3), 'log':log.name}
    assert result.returncode == 0, f'{log}: {log.read_text()[-2500:]}'
    return record
try:
    for tid in args.templates:
        version = json.loads((ROOT / f'starter-templates/{tid}/VERSION.json').read_text())
        archive = ROOT / f"dist/{tid}-{version['version']}.zip"
        with zipfile.ZipFile(archive) as z:
            z.extractall(RUNS)
        folder = RUNS / tid
        dev = json.loads((folder / '.devcontainer/devcontainer.json').read_text())
        assert dev['name'] == 'ツクハコ ' + tid
        name = 'tsukuhako-030-check-' + tid.lower()
        # Containers only mount this dedicated fixture and its private npm cache.
        common = ['docker','run','--rm','--name',name,'--user',f'{os.getuid()}:{os.getgid()}',
                  '-e','HOME=/tmp','-e','npm_config_cache=/cache','-e','NEXT_TELEMETRY_DISABLED=1',
                  '-v',str(folder)+':/workspace','-v',str(cache)+':/cache','-w','/workspace']
        image = 'tsukuhako-030-template-' + tid.lower()
        image_build = run(['docker','build','--tag',image,'--file',str(folder/'.devcontainer/Dockerfile'),str(folder)], E/(tid+'-image.log'))
        command = common + [image,'sh','-lc',
                            'node --version && npm --version && npm ci --no-audit --no-fund && npm run check && npm run build']
        try:
            build = run(command, E / (tid+'-build.log'))
        finally:
            # A timeout can leave docker's foreground process detached; stop only this known fixture.
            subprocess.run(['docker','stop',name],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        record = {'id':tid,'version':version['version'],'archive':archive.name,
                  'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),
                  'devContainerName':dev['name'],'imageBuild':image_build,'build':build,'status':'PASS'}
        # F2/S2 are also exercised later from the final GUI/CLI generated projects.
        if tid in ['F1','B1','S1','S3']:
            server = common[:2] + ['-d'] + common[2:] + ['-p','127.0.0.1::3000',image,'npm','run','dev']
            try:
                launched = subprocess.run(server,capture_output=True,text=True,timeout=30)
                assert launched.returncode == 0, launched.stderr
                port = subprocess.check_output(['docker','port',name,'3000'],text=True).strip().rsplit(':',1)[1]
                record['preview'] = run(['node',str(ROOT/'tools/verify-template-preview-030.mjs'),tid,'http://localhost:'+port], E/(tid+'-preview.log'),120)
            finally:
                subprocess.run(['docker','stop',name],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        records.append(record)
        (E/(tid+'.json')).write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
        print(json.dumps({'id':tid,'status':'PASS'},ensure_ascii=False),flush=True)
finally:
    (E/'summary.json').write_text(json.dumps({'recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'status':'PASS' if len(records)==6 else 'FAIL','scope':'Six changed ZIPs: pinned Node check/build; F1/B1/S1/S3 local previews. No S3 cloud connection.',
        'records':records},ensure_ascii=False,indent=2)+'\n')
