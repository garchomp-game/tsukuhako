"""Private artifact retrieval. Credentials never follow the artifact redirect."""
import concurrent.futures, hashlib, json, os, pathlib, subprocess, sys, tempfile, urllib.request, urllib.error, zipfile
run, *platforms = sys.argv[1:]
platforms = platforms or ['linux', 'windows']
assert run.isdigit() and all(p in ['linux', 'windows'] for p in platforms)
root = pathlib.Path(__file__).resolve().parents[1] / 'validation/release-0.4.4/runs' / ('ci-' + run)
root.mkdir(parents=True, exist_ok=True)
env = os.environ.copy(); env.pop('GH_TOKEN', None); env.pop('GITHUB_TOKEN', None)
def gh(*args): return subprocess.check_output(['gh', *args], env=env, text=True)
metadata = json.loads(gh('api', f'repos/garchomp-game/tsukuhako/actions/runs/{run}/artifacts'))
token = gh('auth', 'token', '--hostname', 'github.com').strip()
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args): return None
opener = urllib.request.build_opener(NoRedirect)
def download(platform):
    name = f'tsukuhako-{platform}-x64-delivery'
    matches = [a for a in metadata['artifacts'] if a['name'] == name]
    if len(matches) != 1: raise RuntimeError('Artifact not available: ' + platform)
    a = matches[0]; archive = root / (name + '.zip'); digest = a['digest'].removeprefix('sha256:')
    if not archive.exists() or hashlib.sha256(archive.read_bytes()).hexdigest() != digest:
        request = urllib.request.Request(f"https://api.github.com/repos/garchomp-game/tsukuhako/actions/artifacts/{a['id']}/zip", headers={'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json'})
        try:
            opener.open(request, timeout=30)
            raise RuntimeError('Expected artifact redirect')
        except urllib.error.HTTPError as error:
            if error.code != 302: raise RuntimeError('Artifact API status: ' + str(error.code)) from None
            signed = error.headers['Location']
        assert signed.startswith('https://')
        with tempfile.NamedTemporaryFile(mode='w', dir=root, delete=False) as secret:
            secret.write(signed + '\n  dir=' + str(root) + '\n  out=' + archive.name + '\n')
        try:
            # Only the scoped artifact URL reaches storage, never the GitHub token.
            with (root / (platform + '-private-transfer.log')).open('w') as log:
                result = subprocess.run(['aria2c', '--input-file=' + secret.name, '--split=8', '--max-connection-per-server=8', '--min-split-size=5M', '--max-tries=3', '--retry-wait=2', '--summary-interval=0', '--console-log-level=error', '--allow-overwrite=true', '--auto-file-renaming=false', '--quiet=true'], stdout=log, stderr=log, timeout=600)
            if result.returncode: raise RuntimeError('Transfer failed; private log retained')
        finally: pathlib.Path(secret.name).unlink(missing_ok=True)
    assert hashlib.sha256(archive.read_bytes()).hexdigest() == digest, 'ZIP digest differs from GitHub'
    product = 'tsukuhako-linux-x64-0.4.4.tar.gz' if platform == 'linux' else 'tsukuhako-windows-x64-0.4.4-setup.exe'
    with zipfile.ZipFile(archive) as z:
        assert sorted(z.namelist()) == sorted([product, 'START_HERE.txt', 'manifest.json', 'SHA256SUMS'])
        z.extractall(root / platform)
    (root / (platform + '-artifact.json')).write_text(json.dumps(a, indent=2) + '\n')
    print(platform + ' ZIP digest verified; four recipient files extracted', flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=len(platforms)) as pool:
    for result in [pool.submit(download, p) for p in platforms]: result.result()
