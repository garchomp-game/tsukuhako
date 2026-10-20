from pathlib import Path
import sys,zipfile,hashlib,json
name=sys.argv[1]
final=len(sys.argv)>2 and sys.argv[2]=='final'
root=Path('starter-templates')/name
out=Path('validation/frontend-api/packages')
out.mkdir(parents=True,exist_ok=True)
archive=out/f"{name}-0.1.0-{'final' if final else 'tested'}.zip"
ignored={'node_modules','.next','dist','.cache','test-results','playwright-report','.git'}
files=[p for p in root.rglob('*') if p.is_file() and not (set(p.relative_to(root).parts)&ignored) and p.name!='.env' and not p.name.endswith('.tsbuildinfo')]
runtime={p.relative_to(root).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(files) if p.suffix!='.md' and 'docs' not in p.relative_to(root).parts}
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED) as z:
 for p in sorted(files): z.write(p,Path(name)/p.relative_to(root))
target=Path('validation/work/frontend-api/最終 追加' if final else 'validation/work/frontend-api/新規 展開')
target.mkdir(parents=True,exist_ok=True)
assert not (target/name).exists(),'Refusing to overwrite an existing extraction'
with zipfile.ZipFile(archive) as z: z.extractall(target)
record={'template':name,'archive':str(archive),'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'bytes':archive.stat().st_size,'extraction':str(target/name),'runtimeFiles':runtime,'runtimeHash':hashlib.sha256(json.dumps(runtime,sort_keys=True).encode()).hexdigest(),'note':'Runtime hash excludes Markdown docs; any final report-only repack must preserve this map. Archive contains no .env, dependencies, build output, browser cache, or DB files.'}
(out/f"{name}{'-final' if final else ''}-manifest.json").write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in record.items() if k!='runtimeFiles'},ensure_ascii=False))
