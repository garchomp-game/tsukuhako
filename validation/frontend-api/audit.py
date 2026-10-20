from pathlib import Path
import json,sys,re
root=Path('starter-templates')/sys.argv[1]
assert not (root/'.env').exists()
assert '127.0.0.1:${HOST_PORT' in (root/'compose.yaml').read_text()
assert 'docker.sock' not in (root/'compose.yaml').read_text()
assert 'privileged:' not in (root/'compose.yaml').read_text()
for p in root.rglob('*'):
 if not p.is_file() or 'node_modules' in p.parts:continue
 content=p.read_text()
 assert '<HOME>' not in content,str(p)
 assert not re.search(r'(?:sb_secret_|sk-proj-|service_role_key\s*=)[A-Za-z0-9_-]{12,}',content),str(p)
for p in (root/'app').rglob('*.tsx') if (root/'app').exists() else (root/'src').rglob('*.tsx'):
 assert 'dangerouslySetInnerHTML' not in p.read_text(),str(p)
print('No creator-specific paths or credential patterns; actual .env excluded; ports loopback-only; no Docker socket or privileged container; rendered input is text PASS')
