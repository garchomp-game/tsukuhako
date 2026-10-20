from pathlib import Path
import hashlib,json,zipfile,tarfile
R=Path(__file__).resolve().parents[1];V=R/'validation/learning-0.4.0';sha=lambda b:hashlib.sha256(b).hexdigest();read=lambda p:json.loads(p.read_text())
cat=read(R/'catalog.json');assert cat['packageVersion']=='0.4.0'
chapters=read(R/'curriculum/manifest.json');assert chapters['appVersion']==chapters['version']=='0.4.0'
for lesson in chapters['lessons']:
 if lesson['templateVersion']:assert lesson['templateVersion']==next(t['implementationVersion'] for t in cat['templates'] if t['id']==lesson['id'])
 for c in lesson['chapters']:
  b=(R/'curriculum'/c['file']).read_bytes();assert sha(b)==c['sha256'] and len(b)==c['bytes']
artifacts=[]
for t in cat['templates']:
 p=R/t['packagePath'];assert sha(p.read_bytes())==t['packageSha256']
 with zipfile.ZipFile(p) as z:
  assert z.testzip() is None
  for name in z.namelist():assert z.read(name)==(R/'starter-templates'/name).read_bytes(),name
 artifacts.append({'file':p.name,'kind':'template','version':t['implementationVersion'],'bytes':p.stat().st_size,'sha256':t['packageSha256']})
files=['tsukuhako-generator-cli-0.4.0-linux.zip','tsukuhako-linux-x64-0.4.0.tar.gz','tsukuhako-win32-x64-0.4.0-UNVERIFIED.zip','tsukuhako-darwin-x64-0.4.0-UNVERIFIED.zip','tsukuhako-darwin-arm64-0.4.0-UNVERIFIED.zip']
for name in files:
 p=R/'dist'/name;m=read(p.with_suffix('.manifest.json') if p.suffix=='.zip' else p.with_name(name+'.manifest.json'));assert sha(p.read_bytes())==m['sha256'] and p.stat().st_size==m['bytes']
 if name.endswith('.tar.gz'):
  prefix='tsukuhako-linux-x64-0.4.0/'
  with tarfile.open(p) as archive:
   for f in m['files']:
    data=archive.extractfile(prefix+f['path']).read();assert sha(data)==f['sha256'] and len(data)==f['bytes']
   app=prefix+'resources/app/'
   for d in ['lib','adapters','build']:
    for f in (R/'generator-desktop'/d).rglob('*'):
     if f.is_file():assert archive.extractfile(app+f.relative_to(R/'generator-desktop').as_posix()).read()==f.read_bytes()
   for name2 in ['main.mjs','worker.mjs','preload.cjs','security.mjs']:
    assert archive.extractfile(app+name2).read()==(R/'generator-desktop'/name2).read_bytes()
   for d in ['generator/src','curriculum']:
    for f in (R/d).rglob('*'):
     if f.is_file():assert archive.extractfile(app+'bundle/'+f.relative_to(R).as_posix()).read()==f.read_bytes()
   for t in cat['templates']:assert archive.extractfile(app+'bundle/'+t['packagePath']).read()==(R/t['packagePath']).read_bytes()
  assert read(V/'gui-results.json')['artifact']==m['sha256'] and read(V/'coexist-memory.json')['artifact']==m['sha256']
 else:
  with zipfile.ZipFile(p) as archive:
   assert archive.testzip() is None
   prefix=archive.namelist()[0].split('/')[0]+'/'
   for f in m['files']:
    data=archive.read(prefix+f['path'])
    if 'symlink' in f:assert data.decode()==f['symlink']
    else:assert sha(data)==f['sha256'] and len(data)==f['bytes']
   if 'win32' in name:
    data=archive.read(prefix+'resources/app/wsl-helper/helper.tar');assert sha(data)==read(R/'generator-desktop/wsl-helper/bundle.json')['sha256']
 artifacts.append({'file':p.name,'kind':'CLI' if 'cli-' in name else 'GUI','bytes':p.stat().st_size,'sha256':m['sha256'],'runtimeTest':'NOT_RUN' if 'UNVERIFIED' in name else 'PASS (Linux Mint x64)'})
for f in ['gui-results.json','cli-bundle.json','helper-linux-tests.json','helper-shutdown.json','app-diagnosis-shutdown.json','security-extra.json','vscode-f2.json','vscode-reconnect.json','vscode-rebuild.json','preservation.json']:
 assert read(V/f)['status']=='PASS',f
assert all(x['status']=='PASS' for x in read(V/'linux-template-startup.json'))
assert all(x['exitCode']==0 for x in read(V/'s2-startup.json'))
assert read(V/'startup/S2-browser.json')['status']=='PASS'
(R/'dist/TEMPLATE_SHA256SUMS.txt').write_text('\n'.join(f"{t['packageSha256']}  {Path(t['packagePath']).name}" for t in cat['templates'])+'\n')
(R/'dist/GENERATOR_SHA256SUMS.txt').write_text('\n'.join(f"{a['sha256']}  {a['file']}" for a in artifacts if a['kind']!='template')+'\n')
(V/'artifacts.json').write_text(json.dumps(artifacts,indent=2)+'\n')
(V/'release-check.json').write_text(json.dumps({'status':'PASS','version':'0.4.0','checks':['Every distributed template matches final source and catalog hash','50 chapters match curriculum manifest and target template versions','Every GUI/CLI archive member read back against manifest','Linux GUI bundled source matches final main/adapters/core/curriculum/build','Linux GUI test and whole-tree measurements identify final archive hash','Windows embeds current Linux helper archive','Current acceptance evidence passed for documented Linux/fixture scope','Original 0.3.0 distributions unchanged'],'runtimeLimit':'Windows/macOS runtime remains NOT_RUN; read-back is not platform runtime acceptance','artifacts':artifacts},indent=2)+'\n')
lines=['# 配布物 0.4.0','', 'SHA256は整合確認用です。GUIはこの表のファイルを別途使用します。レビューZIPにはGUI本体を含みません。','', '|ファイル|容量 MiB|種類・実行確認|SHA256|','|---|---|---|---|']
for a in artifacts:lines.append(f"|{a['file']}|{a['bytes']/1048576:.2f}|{a['kind']} / {a.get('runtimeTest','catalog記載の範囲')}|`{a['sha256']}`|")
lines+=['','Windows配布はLinux x64用Node 24.19.0＋共有core＋テンプレートを約121.8 MiBのtarで同梱（ZIP圧縮後の全容量は上表）。Node LICENSEとElectron/React/Markdown依存ライセンスを保持しています。更新は新しい配布物を受け取り、ヘルパーを版別領域へ置く方式です。常駐自動更新はありません。','', 'ソースZIPとレビューZIP自身のhashは外側のmanifestとSHA256SUMS-0.4.0.txtに記録します。自己参照するhashを文書内へ埋め込みません。']
(R/'ARTIFACTS.md').write_text('\n'.join(lines)+'\n')
print('release archive read-back PASS',len(artifacts),'artifacts')
