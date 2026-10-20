from pathlib import Path
import hashlib,json,zipfile
out=Path('validation/frontend-api/packages')
for name in ('F1','B1','S1'):
 root=Path('starter-templates')/name
 ignored={'node_modules','.next','dist','.cache','test-results','playwright-report','.git'}
 files=[p for p in root.rglob('*') if p.is_file() and not (set(p.relative_to(root).parts)&ignored) and p.name!='.env' and not p.name.endswith('.tsbuildinfo')]
 runtime={p.relative_to(root).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(files) if p.suffix!='.md' and 'docs' not in p.relative_to(root).parts}
 manifest=out/f'{name}-final-manifest.json'; previous=json.loads(manifest.read_text())
 assert previous['runtimeFiles']==runtime,f'{name}: runtime changed after verification'
 archive=out/f'{name}-0.1.0-final.zip'
 with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED) as z:
  for p in sorted(files):
   assert not p.is_symlink(),p
   z.write(p,Path(name)/p.relative_to(root))
 with zipfile.ZipFile(archive) as z: assert z.testzip() is None
 previous.update(sha256=hashlib.sha256(archive.read_bytes()).hexdigest(),bytes=archive.stat().st_size,verifiedRuntimeEqual=True,note='Final report-only repack verified byte-identical runtime to the recorded final manifest. Runtime hash excludes Markdown and docs/. Initial extracted runtime tests and F1 doctor guard targeted tests are preserved separately.')
 manifest.write_text(json.dumps(previous,ensure_ascii=False,indent=2)+'\n')
 print(name,previous['sha256'],previous['bytes'],'runtime identical')
