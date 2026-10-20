from pathlib import Path
import datetime,json,subprocess,sys,time
here=Path(__file__).resolve().parent
root=here.parents[2]
name,cwd,*command=sys.argv[1:]
started=datetime.datetime.now(datetime.timezone.utc).isoformat();before=time.monotonic()
with (here/f'{name}.log').open('w') as output:
    try: code=subprocess.run(command,cwd=cwd,stdout=output,stderr=subprocess.STDOUT,timeout=900).returncode
    except subprocess.TimeoutExpired: code=124;output.write('\nTIMEOUT\n')
record={'name':name,'startedAt':started,'elapsedSeconds':round(time.monotonic()-before,3),'command':command,'cwd':str(Path(cwd).resolve().relative_to(root)),'exitCode':code,'result':'PASS' if code==0 else 'FAIL','log':f'{name}.log'}
(here/f'{name}.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(record,ensure_ascii=False));sys.exit(code)
