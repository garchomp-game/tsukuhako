from pathlib import Path
import json,hashlib,zipfile,difflib
R=Path(__file__).resolve().parents[1];V=R/'validation/learning-0.4.0';old=R.parent/'tsukuhako-starters-0.3.0';sha=lambda b:hashlib.sha256(b).hexdigest()
expected={
 'tsukuhako-starters-0.3.0-2026-10-20.zip':'312f3b4e1d674e16a01cde6e4bab1dce9380dcaff5b6235a9db8d2124bf676e7',
 'tsukuhako-generator-cli-0.3.0-linux.zip':'e00c9368759a64e360c24a3786d15e1486c400354ae34fc379c628f4bc9b8b7b',
 'tsukuhako-linux-x64-0.3.0.tar.gz':'34a4e9ae590f3122c219311c037e8476aca9ac3aedababe7f7a2b2bc2dcfc3ec'}
records=[]
for name,digest in expected.items():
 p=old/'dist'/name;assert sha(p.read_bytes())==digest,name;records.append({'file':name,'sha256':digest,'bytes':p.stat().st_size,'status':'UNCHANGED'})
with zipfile.ZipFile(old/'dist/tsukuhako-starters-0.3.0-2026-10-20.zip') as z:
 prefix='tsukuhako-starters/'
 baseline={n[len(prefix):]:z.read(n) for n in z.namelist() if n.startswith(prefix)}
 cat=json.loads(baseline['catalog.json'])
 for t in cat['templates']:
  p=old/t['packagePath'];assert sha(p.read_bytes())==t['packageSha256'];records.append({'file':p.name,'sha256':t['packageSha256'],'status':'UNCHANGED'})
review=R.parent/'tsukuhako-review-0.3.0-2026-10-20/dist/tsukuhako-review-0.3.0-2026-10-20.zip'
assert sha(review.read_bytes())=='de1acb2f1efda17a1789071fa366a2f57592b3c1cd61298d003be386b0ace8d3';records.append({'file':review.name,'sha256':sha(review.read_bytes()),'status':'UNCHANGED'})
(V/'preservation.json').write_text(json.dumps({'status':'PASS','scope':'Original 0.3.0 distributions and previous review ZIP; no old artifact overwritten','records':records},indent=2)+'\n')
paths=[]
for f in ['README.md','REPORT.md','catalog.json','DECISIONS.md']:paths.append(R/f)
for folder in ['generator','generator-desktop','curriculum','docs','starter-templates/F1']:
 for p in (R/folder).rglob('*'):
  rel=p.relative_to(R)
  if p.is_file() and not p.is_symlink() and not {'node_modules','build','wsl-helper','third-party'}.intersection(rel.parts):paths.append(p)
changes=[];patch=[]
for p in sorted(set(paths)):
 rel=p.relative_to(R).as_posix();new=p.read_bytes();before=baseline.get(rel,b'')
 if new==before:continue
 changes.append({'path':rel,'change':'modified' if rel in baseline else 'added','beforeSha256':sha(before) if rel in baseline else None,'afterSha256':sha(new),'bytes':len(new)})
 if p.suffix in {'.mjs','.js','.ts','.tsx','.css','.html','.json','.md','.txt'}:
  try:patch.extend(difflib.unified_diff(before.decode().splitlines(True),new.decode().splitlines(True),fromfile='a/'+rel if rel in baseline else '/dev/null',tofile='b/'+rel))
  except UnicodeDecodeError:pass
(V/'source-diff.patch').write_text(''.join(patch));(V/'source-changes.json').write_text(json.dumps(changes,ensure_ascii=False,indent=2)+'\n')
(R/'DIFF.md').write_text('''# 0.3.0 → 0.4.0 の差分

- 同じウィンドウへ教材Readerと準備チェックを追加。共有コア、既存の生成ウィザード、書込み保護は継続。
- curriculumに6構成＋OS準備の50章とローカル画像、版/hash付きmanifestを追加。HTML無効のMarkdown表示と章ID専用API。
- main/preload/workerに固定IPC、読み取り専用の並行読込、対象に結び付いたplan、読書位置保存、所有診断プロセスの終了待ち。
- adaptersにローカル診断・VS Code起動・Windows/WSL境界、helperに同梱Linux Node用のjob/cancel機構。
- coreへPOSIX cksum互換計算と協調キャンセル点を追加。CLI READMEのテスト適用範囲（R1）を明記。
- F1のHTTPテストに残った旧titleを修正し0.1.3へ更新。実アプリと依存版は維持。ほか6テンプレートZIPは0.3.0と同一bytes。
- Brain掲載文をローカル配布方式へ更新。会員サイト・公開・購入は対象外。

機械可読の変更一覧は validation/learning-0.4.0/source-changes.json、テキスト差分は同じ場所のsource-diff.patch。比較元はSHA256を照合した0.3.0全体ZIPです。新しい検証スクリプト、バイナリ画像、配布ランタイムはpatchだけでは再現できません。全体ソースZIPを使ってください。

Windows/macOS実機検証、macOSホストスクリプト適合、とくにS2の起動補助は残っています。旧版の配布物は書き換えていません。
''')
print('preservation PASS',len(records),'artifacts;',len(changes),'source changes')
