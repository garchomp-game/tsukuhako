from pathlib import Path
import os,json,hashlib,zipfile,difflib,re,tarfile
R=Path(__file__).resolve().parents[1];V=R/'validation/ux-0.4.1';OLD=R.parent/'tsukuhako-starters-0.4.0';sha=lambda b:hashlib.sha256(b).hexdigest()
skip={'node_modules','build','runs','.git','.next','.cache','.local','__pycache__','playwright-report','test-results','.temp','.branches'}
rootfiles=['README.md','REPORT.md','UX-REVIEW.md','UX-FLOWS.md','TEST-RESULTS.md','NEXT-ACTIONS.md','DIFF.md','catalog.json','.gitignore']
evidence=['before.json','gui.json','core-tests.txt','desktop-tests.txt','renderer-build.txt','security.json','reader-zoom.json','zoom.json','environment.json','f2-doctor.txt','vscode-f2.json','f2-guide-integrity.json','helper-linux-tests.json','helper-shutdown.json','app-diagnosis-shutdown.json','cleanup.json','preservation.json','release-check.json']
shots=['before-first-run.png','before-source-link.png','after-first-run.png','after-complete.png','after-project-guide.png','after-windows-fixture.png','after-200-percent.png','reader-200-percent.png','vscode-f2-start.png','vscode-f2-edited.png','f2-before.png','f2-changed.png','f2-restored.png']
def walk(folder):
 for base,dirs,names in os.walk(R/folder):
  dirs[:]=sorted(n for n in dirs if n not in skip)
  for name in sorted(names):
   p=Path(base)/name
   if p.is_symlink() or name.startswith('.env') and name!='.env.example':continue
   if p.suffix in {'.tar','.gz','.xz','.zip','.pyc','.tsbuildinfo'}:continue
   if p.name=='config.toml' and p.parent.name=='supabase':continue
   yield p
source=[R/n for n in rootfiles]+[R/'docs/BRAIN-LAUNCH-DRAFT.md']
for folder in ['generator','generator-desktop','curriculum','starter-templates']:source.extend(walk(folder))
source += [p for p in (R/'tools').iterdir() if p.name.endswith(('041.py','041.mjs')) or p.name in {'package.json','package-lock.json'}]
cat=json.loads((R/'catalog.json').read_text())
for t in cat['templates']:
 p=R/t['packagePath'];source.append(p)
 if p.with_suffix('.manifest.json').exists():source.append(p.with_suffix('.manifest.json'))
source=sorted(set(source));changes=[];patch=[]
for p in source:
 rel=p.relative_to(R).as_posix();before=OLD/rel;b=p.read_bytes()
 if before.exists() and before.read_bytes()==b:continue
 changes.append({'path':rel,'change':'modified' if before.exists() else 'added','sha256':sha(b)})
 try:
  after=b.decode();prior=before.read_text() if before.exists() else ''
  patch.extend(difflib.unified_diff(prior.splitlines(True),after.splitlines(True),fromfile='a/'+rel,tofile='b/'+rel))
 except UnicodeError:pass
(V/'source-changes.json').write_text(json.dumps({'baseline':'0.4.0','release':'0.4.1','files':changes},ensure_ascii=False,indent=2)+'\n')
(V/'source-diff.patch').write_text(''.join(patch))
# Check final tested product, content, and the unchanged template ZIPs.
linux=R/'dist/tsukuhako-linux-x64-0.4.1.tar.gz';manifest=json.loads(Path(str(linux)+'.manifest.json').read_text());gui=json.loads((V/'gui.json').read_text());assert gui['status']=='PASS' and gui['artifact']==sha(linux.read_bytes())==manifest['sha256']
with tarfile.open(linux) as tar:
 for f in manifest['files']:
  assert sha(tar.extractfile('tsukuhako-linux-x64-0.4.1/'+f['path']).read())==f['sha256'],f['path']
for t in cat['templates']:
 p=R/t['packagePath'];assert sha(p.read_bytes())==t['packageSha256'];assert p.read_bytes()==(OLD/t['packagePath']).read_bytes();assert len(p.read_bytes())==t['packageBytes']
content=json.loads((R/'curriculum/manifest.json').read_text());assert content['version']==content['appVersion']=='0.4.1'
for l in content['lessons']:
 for c in l['chapters']:
  data=(R/'curriculum'/c['file']).read_bytes();assert len(data)==c['bytes'] and sha(data)==c['sha256']
for name in ['security.json','reader-zoom.json','vscode-f2.json','f2-guide-integrity.json','helper-linux-tests.json','helper-shutdown.json','app-diagnosis-shutdown.json','cleanup.json','preservation.json']:assert json.loads((V/name).read_text())['status']=='PASS',name
(V/'release-check.json').write_text(json.dumps({'status':'PASS','linuxSha256':manifest['sha256'],'linuxManifestFilesChecked':len(manifest['files']),'testedGuiArtifactMatches':True,'templateZipsUnchanged':7,'curriculumChaptersChecked':sum(len(l['chapters']) for l in content['lessons']),'changedSourceFiles':len(changes),'actualWindowsMac':'NOT_RUN'},indent=2)+'\n')
selected=source+[V/n for n in evidence]+[V/'source-changes.json',V/'source-diff.patch']+[V/'screenshots'/n for n in shots]+[Path(str(linux)+'.manifest.json')]
secret=re.compile(rb'eyJ[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}|sb_(?:secret|publishable)_[A-Za-z0-9_-]{20,}')
name='tsukuhako-ux-review-0.4.1-2026-10-21';out=R/'dist'/(name+'.zip');entries=[]
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 z.writestr(name+'/REVIEW-ONLY.txt','レビュー専用です。製品の実行ファイルは別のLinux tar.gzです。UX-REVIEW.mdからお読みください。Windows/macOSは実機未確認です。\n')
 for p in sorted(set(selected)):
  rel=p.relative_to(R).as_posix();data=p.read_bytes()
  assert not secret.search(data),rel
  info=zipfile.ZipInfo(name+'/'+rel,(2026,10,21,0,0,0));info.create_system=3;info.external_attr=(0o100755 if p.suffix=='.sh' else 0o100644)<<16;info.compress_type=zipfile.ZIP_DEFLATED;z.writestr(info,data);entries.append({'path':name+'/'+rel,'bytes':len(data),'sha256':sha(data)})
result={'file':out.name,'bytes':out.stat().st_size,'sha256':sha(out.read_bytes()),'purpose':'Review source and evidence; product runtime excluded','files':entries}
with zipfile.ZipFile(out) as z:
 assert z.testzip() is None and len(z.namelist())==len(set(z.namelist()))
 for f in entries:assert sha(z.read(f['path']))==f['sha256']
 assert not any('/runs/' in n or '/node_modules/' in n or '/.env' in n and not n.endswith('/.env.example') for n in z.namelist())
out.with_suffix('.manifest.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
artifacts=[{k:v for k,v in result.items() if k!='files'},{k:v for k,v in manifest.items() if k!='files'}]
(R/'dist/SHA256SUMS-0.4.1.txt').write_text(''.join(f"{a['sha256']}  {a['file']}\n" for a in artifacts))
(V/'artifacts.json').write_text(json.dumps(artifacts,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'review':{k:v for k,v in result.items() if k!='files'},'changedFiles':len(changes),'includedFiles':len(entries)+1},ensure_ascii=False))
