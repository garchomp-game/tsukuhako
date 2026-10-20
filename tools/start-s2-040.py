from pathlib import Path
import subprocess,json,time
R=Path(__file__).resolve().parents[1];out=R/'validation/learning-0.4.0';project=out/'runs/gui-verified/S2 IPC.dir 日本語 & literal'
results=[]
for label,args in [('db-start',['bash','scripts/db.sh','start']),('container-up',[str(R/'tools/node_modules/.bin/devcontainer'),'up','--workspace-folder',str(project)]),('database-test',['bash','scripts/db.sh','test'])]:
 start=time.monotonic();p=subprocess.run(args,cwd=project,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=960)
 (out/(f's2-{label}.log')).write_text(p.stdout.replace(str(Path.home()),'<HOME>'));results.append({'id':label,'exitCode':p.returncode,'elapsedSeconds':round(time.monotonic()-start,2)})
 print(label,p.returncode,flush=True)
 if p.returncode:break
(out/'s2-startup.json').write_text(json.dumps(results,indent=2)+'\n')
