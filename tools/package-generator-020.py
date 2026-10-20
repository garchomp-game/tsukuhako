#!/usr/bin/env python3
"""Offline CLI: exact core, catalog and frozen template ZIPs, including fflate."""
from pathlib import Path
import hashlib,json,zipfile
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'dist/meikyo-generator-cli-0.2.0-linux.zip'
PREFIX=OUT.stem
sha=lambda b:hashlib.sha256(b).hexdigest()
catalog=json.loads((ROOT/'catalog.json').read_text())
paths=[ROOT/'catalog.json']
for base in ['generator/src','generator/node_modules/fflate']:
    paths.extend(p for p in (ROOT/base).rglob('*') if p.is_file())
paths.extend(ROOT/'generator'/n for n in ['cli.mjs','package.json','package-lock.json','README.md'])
paths.extend(ROOT/t['packagePath'] for t in catalog['templates'])
entries=[]
with zipfile.ZipFile(OUT,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for p in sorted(paths):
        assert not p.is_symlink()
        rel=p.relative_to(ROOT).as_posix();data=p.read_bytes()
        info=zipfile.ZipInfo(f'{PREFIX}/{rel}',(2026,10,20,0,0,0));info.external_attr=0o100644<<16;info.compress_type=zipfile.ZIP_DEFLATED
        z.writestr(info,data);entries.append({'path':rel,'sha256':sha(data),'bytes':len(data)})
result={'file':OUT.name,'sha256':sha(OUT.read_bytes()),'bytes':OUT.stat().st_size,'files':entries}
OUT.with_suffix('.manifest.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if k!='files'}))
