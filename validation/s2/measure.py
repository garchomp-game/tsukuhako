from pathlib import Path
import datetime, json, subprocess, sys, time
here=Path(__file__).resolve().parent
name,cwd,*command=sys.argv[1:]
started=datetime.datetime.now(datetime.timezone.utc).isoformat(); before=time.monotonic()
with (here/f'{name}.log').open('w') as f:
    try: code=subprocess.run(command,cwd=cwd,stdout=f,stderr=subprocess.STDOUT,timeout=900).returncode
    except subprocess.TimeoutExpired: code=124;f.write('\nTIMEOUT\n')
record={'name':name,'startedAt':started,'elapsedSeconds':round(time.monotonic()-before,3),'command':command,'cwd':str(Path(cwd).resolve().relative_to(here.parents[1])),'exitCode':code,'result':'PASS' if code==0 else 'FAIL','log':f'{name}.log'}
(here/f'{name}.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(record,ensure_ascii=False));sys.exit(code)
