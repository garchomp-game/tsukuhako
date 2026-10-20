"""改訂カタログから必須6構成を生成する既存回帰テストを記録する。"""
from pathlib import Path
import datetime
import json
import subprocess
import time

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
catalog = json.loads((ROOT / 'catalog.json').read_text())
if catalog['packageVersion'] != '0.1.1':
    raise ValueError('0.1.1のカタログと配布ZIPを先に確定してください。')
command = ['npm', 'test', '--prefix', 'generator']
start = time.monotonic()
record = {
    'version': '0.1.1',
    'startedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'command': command,
    'cwd': '.',
    'node': subprocess.check_output(['node', '--version'], text=True).strip(),
    'npm': subprocess.check_output(['npm', '--version'], text=True).strip(),
    'scope': '8 regression tests; generate all six required templates in Japanese/space paths; verify catalog versions; no Docker startup in this check.',
    'templates': [
        {'id': t['id'], 'version': t['implementationVersion'], 'sha256': t['packageSha256']}
        for t in catalog['templates'] if t['generatorEligible']
    ],
}
with (HERE / 'output.log').open('w') as log:
    run = subprocess.run(command, cwd=ROOT, stdout=log, stderr=subprocess.STDOUT, timeout=120)
record.update(result='PASS' if run.returncode == 0 else 'FAIL', exitCode=run.returncode,
              elapsedSeconds=round(time.monotonic() - start, 3), log='output.log')
(HERE / 'result.json').write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(record, ensure_ascii=False))
print((HERE / 'output.log').read_text()[-5500:])
raise SystemExit(run.returncode)
