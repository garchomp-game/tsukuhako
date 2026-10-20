"""依存・実設定・DBデータを除いて単独配布ZIPを作る。"""
from pathlib import Path
import hashlib
import json
import sys
import zipfile
import os
import re

ROOT = Path(__file__).resolve().parents[1]
SKIP_DIRS = {'node_modules', '.next', 'dist', '.git', '.cache', '.local', '.temp', '.branches',
             'playwright-report', 'test-results', '__pycache__', 'runs', 'probe', '新規 展開'}

def include(relative):
    if any(part in SKIP_DIRS for part in relative.parts):
        return False
    name = relative.name
    if name.startswith('.env') and name != '.env.example':
        return False
    if name.endswith(('.tsbuildinfo','.pyc','.zip')):
        return False
    if relative.as_posix().endswith('supabase/config.toml'):
        return False
    return True

def files(folder):
    for base, dirs, names in os.walk(folder):
        dirs[:] = sorted(d for d in dirs if d not in SKIP_DIRS)
        for name in sorted(dirs + names):
            path=Path(base)/name
            rel=path.relative_to(folder)
            if not include(rel):
                continue
            if path.is_symlink():
                raise ValueError(f'Symlink cannot be packaged: {rel}')
            if path.is_file():
                yield path,rel

def runtime_manifest(folder):
    return {str(rel):hashlib.sha256(path.read_bytes()).hexdigest() for path,rel in files(folder)
            if path.suffix != '.md' and rel.parts[0] != 'docs'}

def template_version(folder):
    metadata=folder/'VERSION.json'
    if not metadata.exists():
        metadata=folder/'template.json'
    version=json.loads(metadata.read_text())['version']
    if not re.fullmatch(r'\d+\.\d+\.\d+',version):
        raise ValueError(f'Invalid template version: {version}')
    return version

def pack(tid, destination=None):
    folder=ROOT/'starter-templates'/tid
    version=template_version(folder)
    dest=Path(destination) if destination else ROOT/'dist'/f'{tid}-{version}.zip'
    dest.parent.mkdir(parents=True,exist_ok=True)
    manifest={}
    with zipfile.ZipFile(dest,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for path,rel in files(folder):
            data=path.read_bytes()
            info=zipfile.ZipInfo(str(Path(tid)/rel),date_time=(2026,10,20,0,0,0))
            info.external_attr=(0o100755 if path.suffix=='.sh' else 0o100644)<<16
            info.compress_type=zipfile.ZIP_DEFLATED
            z.writestr(info,data)
            manifest[str(rel)]=hashlib.sha256(data).hexdigest()
    result={'id':tid,'version':version,'file':dest.name,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),
            'bytes':dest.stat().st_size,'files':manifest,
            'runtimeFiles':{name:digest for name,digest in manifest.items()
                            if not name.endswith('.md') and not name.startswith('docs/')}}
    dest.with_suffix('.manifest.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:v for k,v in result.items() if k not in ['files','runtimeFiles']}))
    return result

if __name__=='__main__':
    for tid in sys.argv[1:]:
        pack(tid)
