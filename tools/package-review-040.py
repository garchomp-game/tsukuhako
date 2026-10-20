from pathlib import Path
import os,json,hashlib,zipfile,re
R=Path(__file__).resolve().parents[1];V=R/'validation/learning-0.4.0';sha=lambda b:hashlib.sha256(b).hexdigest()
skip={'node_modules','build','runs','baseline-profile','probe','work','.git','.next','.cache','.local','__pycache__','playwright-report','test-results','.temp','.branches'}
evidence={'ACCEPTANCE.md','PLATFORM-MATRIX.md','MEASUREMENTS.md','measurement-summary.json','gui-results.json','core-tests.txt','unit-tests.txt','renderer-build.txt','content-links.json','security-extra.json','app-diagnosis-shutdown.json','helper-linux-tests.json','helper-shutdown.json','vscode-f2.json','vscode-reconnect.json','vscode-rebuild.json','linux-template-startup.json','f1-012-regression.json','s2-startup.json','s2-cleanup.json','cleanup.json','coexist-memory.json','baseline-030.json','cli-bundle.json','platform-builds.json','preservation.json','source-changes.json','source-diff.patch','release-check.json','artifacts.json'}
shots={'01-preparation.png','02-reader.png','03-help.png','06-minimum.png','f2-before.png','f2-changed.png','f2-restored.png','F1-changed.png','F1-restored.png','S1-changed.png','B1-changed.png'}
rootfiles=['README.md','REPORT.md','DIFF.md','ARTIFACTS.md','DECISIONS.md','catalog.json','.gitignore']
def walk(directory):
 for base,dirs,names in os.walk(R/directory):
  dirs[:]=sorted(x for x in dirs if x not in skip)
  for name in sorted(names):
   p=Path(base)/name;rel=p.relative_to(R)
   if p.is_symlink():continue
   if name.startswith('.env') and name!='.env.example':continue
   if p.suffix in {'.zip','.gz','.tar','.xz','.pyc','.tsbuildinfo'}:continue
   if rel.as_posix().endswith('supabase/config.toml'):continue
   yield p
formal040={'build-curriculum-040.mjs','build-helper-040.py','check-content-links-040.mjs','check-release-040.py','download-platforms-040.mjs','measure-baseline-040.mjs','measure-coexist-040.mjs','package-desktop-040.py','package-generator-040.py','package-platforms-040.py','package-review-040.py','prepare-review-040.py','summarize-learning-040.py','verify-app-diagnosis-shutdown-040.mjs','verify-cli-bundle-040.py','verify-extra-security-040.mjs','verify-helper-040.mjs','verify-helper-shutdown-040.mjs','verify-learning-040.mjs','verify-linux-templates-040.mjs','verify-startup-040.mjs','start-s2-040.py','launch-vscode-040.mjs','vscode-edit-restore-040.mjs','vscode-reconnect-040.mjs'}
def selected(review):
 paths=[R/name for name in rootfiles if (R/name).is_file()]
 folders=['docs','generator','generator-desktop','curriculum']+(['starter-templates/F1'] if review else ['starter-templates','existing-project-adapter'])
 for folder in folders:paths+=list(walk(folder))
 for p in walk('tools'):
  if p.name.endswith(('040.py','040.mjs')) and p.name not in formal040:continue
  if review and p.name not in formal040 and p.name not in {'package.json','package-lock.json'}:continue
  paths.append(p)
 for name in evidence:
  p=V/name
  if p.exists():paths.append(p)
 for name in shots:paths.append(V/'screenshots'/name)
 paths += [V/'startup'/name for name in ['S2-browser.json','S2-persisted.png','S2-desktop.png','S2-mobile.png']]
 # Catalog's previous validation references remain historical evidence.
 for p in walk('validation/brand-0.3.0/templates'):paths.append(p)
 if not review:
  for folder in ['validation/adapter','validation/frontend-api','validation/i1','validation/s2','validation/s3','validation/revision-0.1.1','validation/revision-0.2.1','validation/generator-0.2.0','validation/root']:
   if (R/folder).exists():paths+=list(walk(folder))
  cat=json.loads((R/'catalog.json').read_text())
  for t in cat['templates']:
   p=R/t['packagePath'];paths.extend([p,p.with_suffix('.manifest.json')])
  for name in ['tsukuhako-generator-cli-0.4.0-linux.zip','tsukuhako-generator-cli-0.4.0-linux.manifest.json','tsukuhako-linux-x64-0.4.0.tar.gz.manifest.json','TEMPLATE_SHA256SUMS.txt','GENERATOR_SHA256SUMS.txt']:
   paths.append(R/'dist'/name)
 return sorted(set(paths))
secret_pattern=re.compile(rb'eyJ[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}|sb_(?:secret|publishable)_[A-Za-z0-9_-]{20,}')
text_ext={'.md','.json','.txt','.log','.ndjson','.patch','.py','.mjs','.js','.ts','.tsx','.css','.html','.yaml','.yml','.toml','.sql','.sh'}
archives=[]
for review in [False,True]:
 name=('tsukuhako-review' if review else 'tsukuhako-starters')+'-0.4.0-2026-10-21';out=R/'dist'/(name+'.zip');entries=[]
 with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
  if review:
   note='レビュー専用資料です。製品ランタイムは含みません。REPORT.md → validation/learning-0.4.0/ACCEPTANCE.md → MEASUREMENTS.md → DIFF.mdの順に確認してください。Windows/macOSは実機未確認です。\n'
   b=note.encode();p='REVIEW-ONLY.txt';z.writestr(name+'/'+p,b);entries.append({'path':name+'/'+p,'bytes':len(b),'sha256':sha(b)})
  for p in selected(review):
   rel=p.relative_to(R).as_posix();b=p.read_bytes()
   if p.suffix in text_ext:
    if rel.startswith('validation/'):
     b=b.replace(str(R).encode(),b'<WORKSPACE>').replace(str(Path.home()).encode(),b'<HOME>')
    assert not secret_pattern.search(b),'Credential-like value: '+rel
   info=zipfile.ZipInfo(name+'/'+rel,(2026,10,21,0,0,0));info.create_system=3;info.external_attr=(0o100755 if p.suffix=='.sh' else 0o100644)<<16;info.compress_type=zipfile.ZIP_DEFLATED
   z.writestr(info,b);entries.append({'path':name+'/'+rel,'bytes':len(b),'sha256':sha(b)})
 result={'file':out.name,'bytes':out.stat().st_size,'sha256':sha(out.read_bytes()),'purpose':'REVIEW ONLY — not product runtime' if review else 'Source + CLI + templates; GUI runtime distributed separately','files':entries}
 with zipfile.ZipFile(out) as z:
  assert len(z.namelist())==len(set(z.namelist())) and z.testzip() is None
  for e in entries:
   b=z.read(e['path']);assert len(b)==e['bytes'] and sha(b)==e['sha256']
  assert not any('/node_modules/' in n or '/runs/' in n or '/.env' in n and not n.endswith('/.env.example') for n in z.namelist())
 out.with_suffix('.manifest.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 archives.append({k:v for k,v in result.items() if k!='files'});print(json.dumps(archives[-1],ensure_ascii=False),flush=True)
artifacts=json.loads((V/'artifacts.json').read_text())+archives
(R/'dist/SHA256SUMS-0.4.0.txt').write_text('\n'.join(f"{x['sha256']}  {x['file']}" for x in artifacts)+'\n')
for a in artifacts:assert sha((R/'dist'/a['file']).read_bytes())==a['sha256']
(R/'dist/handoff-check-0.4.0.json').write_text(json.dumps({'status':'PASS','archives':archives,'checkedArtifacts':len(artifacts),'checks':['ZIP read-back for every entry, byte count and SHA256','Unique relative paths','node_modules, runs and actual env excluded from source/review','Credential-like values rejected','Review ZIP clearly marked; runtime excluded','All SHA256SUMS entries match'],'selfReference':'This post-archive check remains outside archives.'},ensure_ascii=False,indent=2)+'\n')
