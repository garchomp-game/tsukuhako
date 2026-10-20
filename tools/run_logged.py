"""制作側のコマンド実測。秘密を出すコマンドには使用しない。"""
import argparse
import datetime
import json
import os
from pathlib import Path
import subprocess
import sys
import time

parser = argparse.ArgumentParser()
parser.add_argument('--id', required=True)
parser.add_argument('--cwd', default='.')
parser.add_argument('--timeout', type=int, default=600)
parser.add_argument('command', nargs=argparse.REMAINDER)
args = parser.parse_args()
cmd = args.command[1:] if args.command[:1] == ['--'] else args.command
root = Path(__file__).resolve().parents[1]
destination = root / 'validation' / 'root' / args.id
destination.mkdir(parents=True, exist_ok=True)
start = time.monotonic()
record = {'id': args.id, 'startedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'command': cmd, 'cwd': os.path.relpath(Path(args.cwd).resolve(), root),
          'environment': 'Linux Mint 22.3 / x86_64 / Docker 29.9.1 / Compose 5.6.0'}
with (destination / 'output.log').open('w') as log:
    try:
        p = subprocess.run(cmd, cwd=args.cwd, stdout=log, stderr=subprocess.STDOUT, timeout=args.timeout)
        code = p.returncode
    except subprocess.TimeoutExpired:
        code = 124
        log.write('\nTIMEOUT\n')
record.update(exitCode=code, elapsedSeconds=round(time.monotonic()-start,3), result='PASS' if code==0 else 'FAIL', log='output.log')
(destination / 'result.json').write_text(json.dumps(record, ensure_ascii=False, indent=2)+'\n')
print(json.dumps(record, ensure_ascii=False))
print((destination/'output.log').read_text()[-5000:])
sys.exit(code)
