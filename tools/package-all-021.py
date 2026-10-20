"""最終配布: 単独ZIPを再作成せず、検証済みの同一bytesを含める。"""
from pathlib import Path
import hashlib,json,os,re,zipfile
from importlib.util import spec_from_file_location,module_from_spec

ROOT=Path(__file__).resolve().parents[1]
spec=spec_from_file_location('meikyo_pack',ROOT/'tools/package.py')
pack=module_from_spec(spec);spec.loader.exec_module(pack)
catalog=json.loads((ROOT/'catalog.json').read_text())
OUT=ROOT/'dist'/f"otoka-devcontainer-starters-{catalog['packageVersion']}-{catalog['generatedDate']}.zip"
PREFIX='otoka-devcontainer-starters'
SENSITIVE=re.compile(rb'eyJ[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}|sb_(?:secret|publishable)_[A-Za-z0-9_-]{20,}')
TEXT_EXT={'.md','.json','.ndjson','.txt','.log','.py','.mjs','.js','.sh','.yaml','.yml','.toml','.ts','.tsx','.css','.html','.sql'}

def sha(data): return hashlib.sha256(data).hexdigest()

def selected():
    for name in ['README.md','REPORT.md','DECISIONS.md','catalog.json','.gitignore']:
        p=ROOT/name
        yield p,p.relative_to(ROOT)
    for directory in ['starter-templates','generator','existing-project-adapter','generator-desktop','tools','validation']:
        for p,sub in pack.files(ROOT/directory):
            rel=Path(directory)/sub
            if directory=='validation' and ('work' in sub.parts or p.suffix not in {'.md','.json','.ndjson','.txt','.log','.py','.mjs','.png'}): continue
            if directory=='validation' and sub.parts[0]=='releases': continue
            # 最終ZIPを読み返した後の記録は外に置き、自己参照hashを作らない。
            if directory=='validation' and p.name=='handoff-check.json': continue
            if directory=='validation' and p.name.startswith('next-plan') and p.suffix=='.json': continue
            yield p,rel
    for t in catalog['templates']:
        archive=ROOT/t['packagePath']
        for p in [archive,archive.with_suffix('.manifest.json')]:
            yield p,p.relative_to(ROOT)
    for name in ['TEMPLATE_SHA256SUMS.txt', 'meikyo-generator-cli-0.2.1-linux.zip', 'meikyo-generator-cli-0.2.1-linux.manifest.json', 'meikyo-generator-linux-x64-0.2.1.tar.gz.manifest.json', 'GENERATOR_SHA256SUMS.txt']:
        p=ROOT/'dist'/name
        yield p,p.relative_to(ROOT)

audit={'schemaVersion':1,'status':'PASS','checks':[],'scope':'Final archive, actual settings/cache/credentials exclusion, template SHA256 and full path inventory'}
sumlines=[]
for t in catalog['templates']:
    p=ROOT/t['packagePath'];data=p.read_bytes();digest=sha(data)
    if digest!=t['packageSha256']: raise ValueError(f"Catalog hash mismatch: {t['id']}")
    m=json.loads(p.with_suffix('.manifest.json').read_text())
    if m['version']!=t['implementationVersion'] or pack.template_version(ROOT/t['sourcePath'])!=t['implementationVersion']:
        raise ValueError(f"Version mismatch: {t['id']}")
    if set(m['files'])!={str(rel) for _,rel in pack.files(ROOT/t['sourcePath'])}:
        raise ValueError(f"Source inventory differs from frozen ZIP: {t['id']}")
    with zipfile.ZipFile(p) as z:
        names=z.namelist()
        if len(names)!=len(set(names)): raise ValueError('Duplicate ZIP entries')
        for n in names:
            rel=Path(n).relative_to(t['id'])
            payload=z.read(n)
            if not pack.include(rel) or '..' in rel.parts: raise ValueError(f'Unexpected archive entry: {n}')
            if SENSITIVE.search(payload): raise ValueError(f'Credential-like content: {n}')
            if sha(payload)!=m['files'][str(rel)]: raise ValueError(f'File hash mismatch: {n}')
            if sha((ROOT/'starter-templates'/t['id']/rel).read_bytes())!=m['files'][str(rel)]: raise ValueError(f'Source changed after frozen ZIP: {n}')
    audit['checks'].append({'id':t['id'],'status':'PASS','sha256':digest,'files':len(names),'bytes':len(data)})
    sumlines.append(f'{digest}  {p.name}')
(ROOT/'dist/TEMPLATE_SHA256SUMS.txt').write_text('\n'.join(sumlines)+'\n')
(ROOT/'validation/package-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
entries=[]
with zipfile.ZipFile(OUT,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for p,rel in selected():
        data=p.read_bytes()
        if p.suffix in TEXT_EXT:
            if SENSITIVE.search(data): raise ValueError(f'Credential-like content: {rel}')
            # 証拠は意味を保ったまま制作者のホームパスだけ置換する。
            if rel.parts[0]=='validation':
                data=data.replace(str(ROOT).encode(),b'<WORKSPACE>').replace(str(Path.home()).encode(),b'<HOME>')
        entry=f'{PREFIX}/{rel.as_posix()}'
        info=zipfile.ZipInfo(entry,date_time=(2026,10,20,0,0,0))
        info.external_attr=(0o100755 if p.suffix=='.sh' else 0o100644)<<16
        info.compress_type=zipfile.ZIP_DEFLATED
        z.writestr(info,data)
        entries.append({'path':entry,'bytes':len(data),'sha256':sha(data)})
digest=sha(OUT.read_bytes())
with zipfile.ZipFile(OUT) as z:
    assert z.testzip() is None
    assert len(z.namelist())==len(set(z.namelist()))
result={'file':OUT.name,'sha256':digest,'bytes':OUT.stat().st_size,'files':entries}
OUT.with_suffix('.manifest.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
generator_sums=(ROOT/'dist/GENERATOR_SHA256SUMS.txt').read_text().splitlines()
(ROOT/'dist/SHA256SUMS.txt').write_text('\n'.join(sumlines+generator_sums+[f'{digest}  {OUT.name}'])+'\n')
print(json.dumps({k:v for k,v in result.items() if k!='files'},ensure_ascii=False))
