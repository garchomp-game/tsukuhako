"""Inventory legacy text with a reason per path; fail on active product leftovers."""
from pathlib import Path
import importlib.util
import json
import re

ROOT = Path(__file__).resolve().parents[1]
E = ROOT / 'validation/brand-0.3.0'
spec = importlib.util.spec_from_file_location('package_files', ROOT / 'tools/package.py')
pack = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pack)
pattern = re.compile(r'明鏡|meikyo', re.I)
text_extensions = {'.md','.json','.ndjson','.txt','.log','.py','.mjs','.js','.sh','.yaml','.yml','.toml','.ts','.tsx','.css','.html','.sql','.cjs','.svg'}
records, issues = [], []
outputs = {'legacy-names.md', 'legacy-names.json'}
negative_tests = {'tools/verify-template-preview-030.mjs', 'tools/verify-startup-030.mjs', 'tools/audit-legacy-names-030.py'}
decision_marker = '## ツクハコ 0.3.0'

def reason_for(rel, line, line_number, content):
    if rel in negative_tests:
        return '旧名が出ないことを確認する否定検査、または検索対象の定義。製品に表示しない。'
    if rel == 'DECISIONS.md' and (decision_marker not in content or line_number < content[:content.index(decision_marker)].count('\n') + 1):
        return '0.2.1以前の実装判断の履歴。追記方式で当時の記録を保持。'
    if re.search(r'-(020|021)\.(py|mjs)$', rel):
        return '旧版専用の配布・再現・検査スクリプト。0.3.0の制作手順からは呼ばない。'
    if rel.startswith('starter-templates/') and ('/VALIDATION' in rel or '/docs/VALIDATION' in rel):
        return 'テンプレートに同梱した過去の検証コマンド・証拠。内容を保持。'
    if rel.startswith('validation/') and not rel.startswith(('validation/brand-0.3.0/', 'validation/root/t030-')):
        return '0.2.1以前の検証資料、画像の記録、実行コマンド、配布hash。今版の実測とは区別。'
    if rel.startswith('validation/brand-0.3.0/baseline') or rel == 'validation/brand-0.3.0/BASELINE-REPORT.txt':
        return '比較基点0.2.1のcatalog・manifest・REPORT・配布名をそのまま保存。'
    if rel == 'validation/brand-0.3.0/SPEC.md':
        return 'ユーザー提供の移行仕様原文。旧名・教材サイト・対象パスの説明を保持。'
    stripped = line.replace(str(ROOT), '<WORKSPACE>').replace(str(ROOT.parent), '<PARENT>')
    if not pattern.search(stripped):
        return '実行場所として記録した利用者の既存ワークスペース名。親フォルダは改名しない。'
    return None

for folder in ['generator','generator-desktop','starter-templates','existing-project-adapter','tools','docs','validation']:
    for p, sub in pack.files(ROOT / folder):
        rel = str(Path(folder) / sub)
        if p.suffix not in text_extensions or p.name in outputs or 'handoff-check' in p.name:
            continue
        content = p.read_text()
        matches = []
        for number, line in enumerate(content.splitlines(), 1):
            if pattern.search(line):
                why = reason_for(rel, line, number, content)
                matches.append({'line':number, 'reason':why or '要修正'})
                if not why:
                    issues.append({'path':rel, 'line':number})
        if matches:
            records.append({'path':rel, 'occurrences':len(matches), 'reasons':sorted({m['reason'] for m in matches}), 'lines':[m['line'] for m in matches]})
for p in [ROOT / 'README.md', ROOT / 'REPORT.md', ROOT / 'DECISIONS.md', ROOT / 'catalog.json']:
    content = p.read_text()
    matches = [(i, reason_for(p.name, line, i, content)) for i,line in enumerate(content.splitlines(),1) if pattern.search(line)]
    if matches:
        records.append({'path':p.name,'occurrences':len(matches),'reasons':sorted({why or '要修正' for _,why in matches}),'lines':[i for i,_ in matches]})
        issues += [{'path':p.name,'line':i} for i,why in matches if not why]
records.sort(key=lambda x:x['path'])
result = {'status':'FAIL' if issues else 'PASS', 'scope':'Current source, built GUI assets and text evidence; includes hidden config files. Runtime fixtures/caches and binary archives excluded from text search and checked separately by handoff readback.',
          'activeProductUnexplainedMatches':len(issues), 'filesWithExplainedMatches':len(records),'records':records,'issues':issues}
(E / 'legacy-names.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
lines = ['# 旧名称の残存一覧 — 0.3.0', '',
         '現行の表示・Dev Container名・内部API・配布名を検査し、履歴や実行場所の文字列を次の理由で保持しています。全バイトの文字列ゼロを目的に履歴を書き換えません。',
         '', f'判定：{result["status"]}。未説明の残存：{len(issues)}件。行番号と機械可読の結果は[JSON](legacy-names.json)。',
         '', '## テキストの残存', '', '|パス|該当行数|理由|','|---|---:|---|']
lines += [f'|`{r["path"]}`|{r["occurrences"]}|{" / ".join(r["reasons"])}|' for r in records]
lines += ['', '## 画像・配布物・利用者の資源', '',
          '- `validation/generator-0.2.0/`、`validation/revision-0.2.1/`等の過去PNGは当時の画面を保持します。旧画像を現行画面として紹介しません。',
          '- `validation/brand-0.3.0/gui/`の保存先欄には利用者が指定した親ワークスペース名が写ります。製品名ではなく実際のパスで、画像を加工せず保存します。',
          '- `validation/brand-0.3.0/pre-footer/`はF2フッター版修正前の試行です。最終の受入はこのフォルダの外にある記録・配布hashで判定します。',
          '- 比較基点の旧版フォルダと3配布物は別フォルダに同一bytesで保持。旧プロファイルや既存利用者の生成プロジェクトへ自動移行を行いません。',
          '- 作者由来の`otoka-*`識別子、Dockerのproject/volume/image名、Supabase project ID、.envのキー・値は改名対象外。固定runtime imageの`0.1.0`タグも識別子として保持します。',
          '- 第三者LICENSE、著作権表示、技術名を保持。各現行ZIPとGUI tarの実ファイルは最終読戻し検査でソース・manifestに照合します。',
          '- この一覧とJSON自身は自己参照を避けて再検索対象外。実行生成先・cache・node_modulesは製品ソースの検索から除外し、配布除外と同梱依存LICENSEを別途確認します。', '']
(E / 'legacy-names.md').write_text('\n'.join(lines))
print(json.dumps({k:v for k,v in result.items() if k!='records'},ensure_ascii=False,indent=2))
raise SystemExit(bool(issues))
