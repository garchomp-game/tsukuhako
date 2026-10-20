"""教材の明示ファイル一覧だけを、段階ごとに空フォルダへ配置して実測する。"""
from pathlib import Path
import argparse
import datetime
import hashlib
import json
import os
import re
import signal
import subprocess
import time

BASE = Path(__file__).resolve().parent
ROOT = BASE.parents[2]
CLI = ROOT / 'tools/node_modules/.bin/devcontainer'
PORTS = {'B1': 3402, 'S1': 3403, 'F1': 3400}
RUN_LABEL = None

def utc():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()

def sha(data):
    return hashlib.sha256(data).hexdigest()

def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('x') as stream:
        json.dump(value, stream, ensure_ascii=False, indent=2)
        stream.write('\n')

def command(tid, event, args, cwd, timeout=300):
    target = BASE / 'logs' / (RUN_LABEL or tid) / event
    target.mkdir(parents=True)
    started = time.monotonic()
    record = {'template': tid, 'event': event, 'startedAt': utc(),
              'command': [str(x) for x in args], 'cwd': str(cwd.relative_to(ROOT))}
    print(f'{tid} {event}: RUN', flush=True)
    with (target / 'output.log').open('x') as output:
        process = subprocess.Popen(args, cwd=cwd, stdout=output, stderr=subprocess.STDOUT,
                                   start_new_session=True)
        try:
            code = process.wait(timeout=timeout)
        except subprocess.TimeoutExpired:
            os.killpg(process.pid, signal.SIGTERM)
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                os.killpg(process.pid, signal.SIGKILL)
                process.wait()
            code = 124
    record.update(endedAt=utc(), exitCode=code, elapsedSeconds=round(time.monotonic()-started, 3),
                  result='PASS' if code == 0 else 'FAIL', log='output.log')
    save(target / 'result.json', record)
    print(f'{tid} {event}: {record["result"]} ({record["elapsedSeconds"]}s)', flush=True)
    if code:
        print((target / 'output.log').read_text()[-6000:], flush=True)
        raise RuntimeError(f'{tid} {event} exit {code}')
    return (target / 'output.log').read_text()

def main(tid, attempt=1):
    global RUN_LABEL
    RUN_LABEL = tid if attempt == 1 else f'{tid}-attempt{attempt}'
    source = ROOT / 'starter-templates' / tid
    lesson = source / 'docs/BUILD-YOUR-OWN.md'
    content = lesson.read_bytes()
    stages = re.findall(r'<!-- assembly-stage: (\d+) -->\n```text\n(.*?)\n```', content.decode(), re.S)
    assert stages and [int(n) for n, _ in stages] == list(range(1, len(stages)+1))
    workspace = BASE / 'runs' / (f'{tid} 空フォルダ 教材 0.1.1' + (f' 再試行{attempt}' if attempt > 1 else ''))
    workspace.parent.mkdir(parents=True, exist_ok=True)
    workspace.mkdir()
    observations = {'template': tid, 'version': '0.1.1', 'startedAt': utc(),
                    'source': str(source.relative_to(ROOT)),
                    'lesson': str(lesson.relative_to(ROOT)), 'lessonSha256': sha(content),
                    'workspace': str(workspace.relative_to(ROOT)), 'initialFiles': [],
                    'copyMethod': 'Only individual paths listed in each assembly-stage text block; no directory copy.',
                    'stages': [], 'port': PORTS[tid],
                    'notRun': ['VS Code UI', 'Windows/WSL', 'macOS/ARM', 'live GitHub Actions', 'beginner usability trial']}
    observations['attempt'] = attempt
    save(BASE / 'manifests' / f'{RUN_LABEL}-start.json', observations)
    container = None
    running_server = None
    copied = {}

    def call(event, args, timeout=300):
        return command(tid, event, args, workspace, timeout)

    def execute(event, *args, timeout=300):
        return call(event, [str(CLI), 'exec', '--workspace-folder', str(workspace), *args], timeout)

    def start_server(event):
        nonlocal running_server
        # bash job control gives npm and its descendants a private process group.
        script = 'set -m; npm run dev > /tmp/meikyo-lesson-dev.log 2>&1 & lesson_pid=$!; printf "%s\\n" "$lesson_pid" > /tmp/meikyo-lesson-dev.pid; wait "$lesson_pid"'
        call(event+'-start', ['docker', 'exec', '--detach', '--user', 'node', '--workdir', '/workspace', container, 'bash', '-c', script])
        running_server = event

    def stop_server(event):
        nonlocal running_server
        script = 'read -r lesson_pid < /tmp/meikyo-lesson-dev.pid; kill -TERM -- "-$lesson_pid"'
        call(event+'-stop', ['docker', 'exec', '--user', 'node', container, 'bash', '-c', script])
        call(event+'-server-log', ['docker', 'exec', container, 'cat', '/tmp/meikyo-lesson-dev.log'])
        check = "const net=require('node:net'); (async()=>{for(let i=0;i<50;i++){const closed=await new Promise(r=>{const s=net.connect(3000,'127.0.0.1');s.on('connect',()=>{s.destroy();r(false)});s.on('error',()=>r(true))});if(closed){console.log(JSON.stringify({port:3000,released:true}));return}await new Promise(r=>setTimeout(r,100))}process.exit(1)})()"
        call(event+'-port-released', ['docker', 'exec', container, 'node', '-e', check])
        running_server = None

    try:
        for number, raw in stages:
            number = int(number)
            paths = raw.splitlines()
            stage_record = {'number': number, 'startedAt': utc(), 'files': []}
            for relative in paths:
                rel = Path(relative)
                assert relative and not rel.is_absolute() and '..' not in rel.parts
                assert relative not in copied and relative != '.env'
                data = (source / rel).read_bytes()
                out = workspace / rel
                out.parent.mkdir(parents=True, exist_ok=True)
                with out.open('xb') as stream:
                    stream.write(data)
                out.chmod(0o755 if relative.endswith('.sh') else 0o644)
                copied[relative] = sha(data)
                stage_record['files'].append({'path': relative, 'source': str((source/rel).relative_to(ROOT)), 'sha256': sha(data)})
            save(BASE / 'manifests' / f'{RUN_LABEL}-stage-{number}.json', stage_record)
            observations['stages'].append(stage_record)
            print(f'{tid} stage {number}: copied {len(paths)} explicit files', flush=True)

            if number == 1:
                call('stage1-configure', ['bash', 'scripts/configure.sh', '--port', str(PORTS[tid])])
                call('stage1-doctor', ['bash', 'scripts/doctor-host.sh'])
                settings = dict(line.split('=', 1) for line in (workspace/'.env').read_text().splitlines())
                observations['project'] = settings['PROJECT_NAME']
            elif number == 2:
                call('stage2-devcontainer-up', [str(CLI), 'up', '--workspace-folder', str(workspace)], 600)
                container = call('stage2-container-id', ['docker', 'compose', '--project-directory', str(workspace), '--env-file', str(workspace/'.env'), '--project-name', observations['project'], '-f', str(workspace/'compose.yaml'), 'ps', '-q', 'app']).strip()
                assert re.fullmatch('[a-f0-9]+', container)
                observations['container'] = container
                execute('stage2-node-version', 'node', '--version')
                execute('stage2-npm-version', 'npm', '--version')
                execute('stage2-doctor', 'npm', 'run', 'doctor')
            elif number == 3:
                execute('stage3-eslint-syntax', 'node', '--check', 'eslint.config.mjs')
                if tid == 'S1':
                    execute('stage3-postcss-syntax', 'node', '--check', 'postcss.config.mjs')
            elif number == 4 or (tid == 'S1' and number == 5):
                event = f'stage{number}'
                execute(event+'-check', 'npm', 'run', 'check')
                start_server(event)
                mode = 'api' if tid == 'B1' or (tid == 'S1' and number == 4) else 'browser'
                call(event+'-operation', ['node', str(BASE/'probe.mjs'), tid, f'http://localhost:{PORTS[tid]}', mode], 120)
                stop_server(event)
            elif number == (6 if tid == 'S1' else 5):
                execute('tests-check', 'npm', 'run', 'check')
                execute('tests-http', 'npm', 'test')
                if tid != 'B1':
                    execute('tests-browser-setup', 'npm', 'run', 'test:setup', timeout=300)
                    execute('tests-browser', 'npm', 'run', 'test:browser', timeout=300)
                execute('tests-build', 'npm', 'run', 'build', timeout=300)
            else:
                script = "const f=require('node:fs');const t=JSON.parse(f.readFileSync('.vscode/tasks.json'));if(!Array.isArray(t.tasks))process.exit(1);const w=f.readFileSync('.github/workflows/check.yml','utf8');for(const c of ['npm run check','npm test','npm run build'])if(!w.includes(c))process.exit(1);console.log(JSON.stringify({tasks:t.tasks.length,workflowCommands:true,liveCI:'NOT_RUN'}))"
                execute('editor-ci-entries', 'node', '-e', script)
        final_files = []
        for relative, digest in copied.items():
            final_files.append({'path': relative, 'sourceSha256': digest, 'assembledSha256AfterChecks': sha((workspace/relative).read_bytes())})
        observations.update(result='PASS', endedAt=utc(), explicitFiles=final_files,
                            commands='logs/'+RUN_LABEL, browserTests=0 if tid=='B1' else 5 if tid=='S1' else 2,
                            httpTests=1 if tid=='F1' else 10)
    except BaseException as error:
        observations.update(result='FAIL', endedAt=utc(), error=str(error))
        raise
    finally:
        if container:
            try:
                if running_server:
                    stop_server('cleanup')
                call('final-stop', ['bash', 'scripts/compose.sh', 'stop'])
                observations['stopped'] = True
                call('final-down', ['bash', 'scripts/compose.sh', 'down'])
                observations['containerRemoved'] = True
                observations['namedVolumesRetained'] = True
            except BaseException as error:
                observations['cleanupError'] = str(error)
                observations['stopped'] = False
                observations['result'] = 'FAIL'
        save(BASE / 'manifests' / f'{RUN_LABEL}-result.json', observations)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('template', choices=PORTS)
    parser.add_argument('--attempt', type=int, default=1)
    args = parser.parse_args()
    main(args.template, args.attempt)
