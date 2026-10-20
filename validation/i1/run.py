#!/usr/bin/env python3
import argparse, datetime, json, os, pathlib, subprocess, time
HERE=pathlib.Path(__file__).resolve().parent
ROOT=HERE.parent.parent
p=argparse.ArgumentParser()
p.add_argument('id'); p.add_argument('--cwd', default=str(ROOT)); p.add_argument('--expect',type=int, default=0); p.add_argument('--timeout',type=int,default=600); p.add_argument('command',nargs=argparse.REMAINDER)
a=p.parse_args(); command=a.command[1:] if a.command[:1]==['--'] else a.command
start=time.monotonic(); when=datetime.datetime.now(datetime.timezone.utc).isoformat()
try:
 r=subprocess.run(command,cwd=a.cwd,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=a.timeout)
 code=r.returncode; output=r.stdout
except subprocess.TimeoutExpired as e:
 code=124; output=(e.stdout or b'').decode(errors='replace') if isinstance(e.stdout,bytes) else (e.stdout or '')
 output+='\nTIMEOUT\n'
for envfile in (ROOT/'starter-templates'/'I1' / '.env', *HERE.glob('runs/**/.env')):
 if envfile.is_file():
  for line in envfile.read_text().splitlines():
   if line.startswith('POSTGRES_PASSWORD='):
    output=output.replace(line.split('=',1)[1],'[REDACTED_LOCAL_PASSWORD]')
output=output.replace(str(ROOT),'[work-root]')
(HERE/'logs').mkdir(exist_ok=True)
log=f'logs/{a.id}.log'; (HERE/log).write_text(output)
record={'id':a.id,'timestamp':when,'command':[str(x).replace(str(ROOT),'[work-root]') for x in command], 'cwd':str(a.cwd).replace(str(ROOT),'[work-root]'),'exitCode':code,'expectedExitCode':a.expect,'durationSeconds':round(time.monotonic()-start,3),'result':'PASS' if code==a.expect else 'FAIL','log':log}
with (HERE/'commands.ndjson').open('a') as f: f.write(json.dumps(record,ensure_ascii=False)+'\n')
print(json.dumps(record,ensure_ascii=False)); print(output[-6000:])
raise SystemExit(0 if code==a.expect else 1)
