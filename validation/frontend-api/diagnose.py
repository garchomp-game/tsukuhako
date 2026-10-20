from pathlib import Path
import os, subprocess, sys
root=Path('starter-templates')/sys.argv[1]
for label,env,expected in [('missing-config',os.environ.copy(),'設定がありません'),('docker-unavailable',{**os.environ,'DOCKER_HOST':'unix:///tmp/otoka-missing-docker-frontend-validation.sock'},'Dockerへ接続できません')]:
 p=subprocess.run(['bash','scripts/doctor-host.sh'],cwd=root,env=env,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=20)
 assert p.returncode==1,(label,p.returncode,p.stdout)
 assert expected in p.stdout,(label,p.stdout)
 assert 'docs/RECOVERY.md' in p.stdout
 print(f'{label}: expected rejection and recovery guide PASS')
p=subprocess.run(['bash','scripts/configure.sh','--port','invalid'],cwd=root,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=10)
assert p.returncode==2
assert 'ポートは1024〜65535' in p.stdout
assert not (root/'.env').exists()
print('invalid port: expected rejection; no .env created PASS')
