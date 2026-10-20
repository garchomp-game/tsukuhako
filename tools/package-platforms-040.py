from pathlib import Path
import json,zipfile,shutil,hashlib,plistlib,stat,os
R=Path(__file__).resolve().parents[1];G=R/'generator-desktop';V=R/'validation/learning-0.4.0';sha=lambda b:hashlib.sha256(b).hexdigest()
source=V/'runs/desktop-build/tsukuhako-linux-x64-0.4.0'
results=[]
for runtime in json.loads((V/'platform-runtime-downloads.json').read_text()):
 if runtime['status']!='DOWNLOADED':results.append(runtime);continue
 platform,arch=runtime['platform'],runtime['arch'];name=f'tsukuhako-{platform}-{arch}-0.4.0';stage=V/'runs/platform-build'/name
 if stage.exists():shutil.rmtree(stage)
 stage.mkdir(parents=True)
 with zipfile.ZipFile(runtime['file']) as z:
  for f in z.infolist():
   rel=Path(f.filename);assert not rel.is_absolute() and '..' not in rel.parts
   p=stage/rel
   if f.is_dir():p.mkdir(parents=True,exist_ok=True);continue
   p.parent.mkdir(parents=True,exist_ok=True);data=z.read(f);mode=f.external_attr>>16
   if stat.S_ISLNK(mode):
    target=data.decode();assert not target.startswith('/') and (p.parent/target).resolve().is_relative_to(stage.resolve());p.symlink_to(target)
   else:p.write_bytes(data);p.chmod(mode&0o777 or 0o644)
 if platform=='win32':
  (stage/'electron.exe').rename(stage/'tsukuhako.exe');resources=stage/'resources'
 else:
  (stage/'Electron.app').rename(stage/'Tsukuhako.app');app=stage/'Tsukuhako.app';resources=app/'Contents/Resources'
  info=app/'Contents/Info.plist';meta=plistlib.loads(info.read_bytes());meta.update(CFBundleName='Tsukuhako',CFBundleDisplayName='ツクハコ',CFBundleIdentifier='jp.otoka.tsukuhako',CFBundleShortVersionString='0.4.0',CFBundleVersion='0.4.0');info.write_bytes(plistlib.dumps(meta))
  # App contents changed: do not claim upstream Electron's signature signs this app.
  signature=app/'Contents/_CodeSignature'
  if signature.exists():shutil.rmtree(signature)
 if (resources/'default_app.asar').exists():(resources/'default_app.asar').unlink()
 shutil.copytree(source/'resources/app',resources/'app')
 if platform=='win32':shutil.copytree(G/'wsl-helper',resources/'app/wsl-helper')
 shutil.copytree(source/'third-party',stage/'third-party')
 if platform=='win32':shutil.copy2(V/'runs/helper-build/stage/Node-LICENSE',stage/'third-party/WSL-Node-LICENSE.txt')
 (stage/'README.md').write_text(f'''# ツクハコ 0.4.0 — {platform} / {arch}\n\n検証用ビルドです。このOSの実機起動・署名・公証・初回警告は未確認です。販売向けの動作保証を意味しません。OSの保護を無効化して起動しないでください。\n\nWindows x64はWindowsのGUI＋WSL 2通常ユーザーを使います。同梱ヘルパーはアプリ内の明示操作で配置します。macOSは既存テンプレートのホストスクリプトにGNU/Linux依存が残り、S2は実起動未対応です。\n\n教材は同じウィンドウでオフライン閲覧できます。更新版は別に受け取り、旧版のプロジェクトは自動更新しません。SHA256は整合確認用で、配布者の真正性を単独では証明しません。\n''')
 manifest=[];out=R/'dist'/f'{name}-UNVERIFIED.zip'
 with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
  for p in sorted(stage.rglob('*')):
   rel=p.relative_to(stage).as_posix()
   if p.is_symlink():
    data=os.readlink(p).encode();info=zipfile.ZipInfo(name+'/'+rel);info.create_system=3;info.external_attr=0o120777<<16;z.writestr(info,data);manifest.append({'path':rel,'symlink':os.readlink(p)})
   elif p.is_file():
    data=p.read_bytes();info=zipfile.ZipInfo(name+'/'+rel,(2026,10,21,0,0,0));info.create_system=3;info.external_attr=(stat.S_IFREG|p.stat().st_mode&0o777)<<16;info.compress_type=zipfile.ZIP_DEFLATED;z.writestr(info,data);manifest.append({'path':rel,'sha256':sha(data),'bytes':len(data)})
 result={'file':out.name,'bytes':out.stat().st_size,'sha256':sha(out.read_bytes()),'platform':platform,'arch':arch,'build':'PACKAGED','runtimeTest':'NOT_RUN','signing':'UNSIGNED / NOT_NOTARIZED','files':manifest};out.with_suffix('.manifest.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');results.append({k:v for k,v in result.items() if k!='files'});print(out.name,out.stat().st_size,flush=True)
(V/'platform-builds.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
