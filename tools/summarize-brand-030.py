"""Assemble T01–T12 from recorded results for the exact final artifacts."""
from pathlib import Path
import datetime
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
E = ROOT / 'validation/brand-0.3.0'
read = lambda p: json.loads(p.read_text())
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
catalog = read(ROOT / 'catalog.json')
logs = [
    't030-core-tests-release','t030-wizard-source-final','t030-wizard-packaged-final','t030-gui-ipc',
    't030-gui-build','t030-cli-package-final','t030-gui-package-final','t030-cli-relocated-final',
    't030-gui-release-final','t030-guide-alignment-final','t030-f2-footer-build',
    't030-f2-up-final','t030-f2-doctor-final','t030-f2-first-exercise-final',
    't030-s2-generate-final','t030-s2-db-start-final','t030-s2-up-final','t030-s2-browser-final',
    't030-resource-cleanup','t030-preservation-final',
]
for name in logs:
    d = read(ROOT / 'validation/root' / name / 'result.json')
    assert d['result'] == 'PASS' and d['exitCode'] == 0, name
for name, count in [('t030-core-tests-release',21),('t030-gui-ipc',2)]:
    content = (ROOT / 'validation/root' / name / 'output.log').read_text()
    assert re.search(r'\btests ' + str(count) + r'\b', content), name
    assert re.search(r'\bfail 0\b', content), name
    assert re.search(r'\bskipped 0\b', content), name
for name, count, key in [('cli-bundle.json',6,'records'),('gui/result.json',11,'records'),
                          ('source-pty/result.json',8,'cases'),('packaged-pty/result.json',8,'cases'),
                          ('guide-alignment.json',6,'records'),('templates/summary.json',6,'records')]:
    d = read(E / name)
    assert d['status'] == 'PASS' and len(d[key]) == count, name
    assert all(x['status'] == 'PASS' for x in d[key]), name
for name in ['startup/F2-browser.json','startup/S2-browser.json','preservation.json','legacy-names.json','resource-cleanup.json']:
    assert read(E / name)['status'] == 'PASS', name
for t in catalog['templates']:
    assert sha(ROOT / t['packagePath']) == t['packageSha256'], t['id']
    if t['id'] != 'I1':
        d = read(E / 'templates' / (t['id'] + '.json'))
        assert d['sha256'] == t['packageSha256'] and d['version'] == t['implementationVersion'], t['id']
artifacts = []
for name, evidence in [('tsukuhako-generator-cli-0.3.0-linux.zip','cli-bundle.json'),
                       ('tsukuhako-linux-x64-0.3.0.tar.gz','gui/result.json')]:
    p = ROOT / 'dist' / name
    m = read(p.with_suffix('.manifest.json') if name.endswith('.zip') else p.with_name(name + '.manifest.json'))
    assert sha(p) == m['sha256'] == read(E / evidence)['sha256']
    assert p.stat().st_size == m['bytes']
    artifacts.append({k:v for k,v in m.items() if k != 'files'})
f2 = read(E / 'startup/F2-browser.json')
s2 = read(E / 'startup/S2-browser.json')
assert f2['guiEvidence']['archiveSha256'] == artifacts[1]['sha256']
assert read(E / 'cli-generated-s2.json')['archiveSha256'] == artifacts[0]['sha256']
assert read(E / 'cli-generated-s2.json')['guideSha256'] == s2['guideSha256']
assert read(E / 'cli-generated-s2.json')['preexistingSupabaseVolumes'] == []
for name in ['README.md','docs/TRIAL-RECORD.md','docs/OFFER-DRAFT.md']:
    assert (ROOT / name).is_file()
acceptance = [
    ('T01','Brand, executable, app/profile names, CLI, active docs and artifacts','gui/result.json'),
    ('T02','Four screens at 1150x900 and 860x680; scroll/wrap, font sizes and real keyboard focus; palette/hover/disabled CSS inspected','gui/result.json'),
    ('T03','New origin/IPC/preload, real plan/apply and guides; isolation, sender validation and static-file allowlist retained','gui/result.json'),
    ('T04','21 existing core tests, 8 source PTY, 8 relocated CLI PTY, 2 IPC tests; no skipped tests','source-pty/result.json'),
    ('T05','Six templates from final relocated CLI, archive byte identity, guides and actual lesson links','cli-bundle.json'),
    ('T06','Six changed ZIPs check/build, new Dev Container names, F1/S1 UI, B1 health, S3 unconfigured preview, F2/S2 startup','templates/summary.json'),
    ('T07','Relocated standalone CLI/GUI; GUI generation with host PATH containing only cksum','gui/result.json'),
    ('T08','Versions, hashes, source/manifest consistency; old release, history, I1, adapter and dependency/runtime identities preserved','preservation.json'),
    ('T09','No unexplained active brand residue; every remaining text path has a reason','legacy-names.json'),
    ('T10','Six literal source/lesson/restore guides; final GUI-generated F2 started, edited, reflected and restored via Dev Container CLI and browser; actual VS Code UI NOT_RUN','startup/F2-browser.json'),
    ('T11','Busy copy/disabled, second apply BUSY, destination error/action/focus, inputs retained and back without writes','gui/result.json'),
    ('T12','Scenario/prerequisites/coverage in README; trial-record and offer drafts prepared; actual user trials and sales NOT_RUN','../../docs/TRIAL-RECORD.md'),
]
summary = {
    'status':'PASS', 'version':'0.3.0', 'recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'scope':'Developer technical acceptance only on Linux Mint 22.3 x86_64. Per-test scope and NOT_RUN/BLOCKED items remain explicit.',
    'artifacts':artifacts, 'acceptance':[{'id':tid,'status':'PASS','scope':scope,'evidence':evidence} for tid,scope,evidence in acceptance],
    'testCounts':{'existingCore':21,'sourcePTY':8,'packagedPTY':8,'IPC':2,'actualGUIAssertionGroups':11,'changedTemplateBuilds':6,'guideAlignments':6},
    'successfulCommandRecords':['validation/root/' + n + '/result.json' for n in logs],
    'notRun':['Actual VS Code UI Reopen/reconnect/Rebuild','Native folder picker manual acceptance','Windows/WSL','macOS/ARM','fresh-PC installation','GitHub-hosted CI','Beginner/user trials','All prior functional/CRUD/tutorial suites rerun'],
    'blocked':['S3 dedicated live cloud connection; generator ineligible'],
    'supersededEvidence':'pre-footer/artifacts.json identifies pre-footer-correction artifact hashes; those do not constitute final artifact acceptance.',
    'initialFailures':['Bare Node image npm differed from fixed template npm; corrected test environment','Old Japanese error regex differed from required copy; existing test changed to structured error codes','Docker address pools exhausted; user-authorized cleanup restored normal startup'],
    'dockerReset':read(E / 'docker-reset.json'), 'cleanup':read(E / 'resource-cleanup.json'),
    'externalPublication':False, 'userTrialPerformed':False,
}
(E / 'summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2) + '\n')
(ROOT / 'dist/GENERATOR_SHA256SUMS.txt').write_text(''.join(a['sha256'] + '  ' + a['file'] + '\n' for a in artifacts))
print(json.dumps({'status':'PASS','acceptance':len(acceptance),'testCounts':summary['testCounts'],'artifacts':artifacts},ensure_ascii=False,indent=2))
