"""実PTYでwizardの戻る・中止・割込み・生成を確認する。"""
from pathlib import Path
import os,pty,select,signal,time,json,subprocess,hashlib,shutil,datetime
ROOT=Path(__file__).resolve().parents[1]
EVIDENCE=ROOT/'validation/generator-0.2.0/wizard'
EVIDENCE.mkdir(exist_ok=True)
WORK=ROOT/'validation/generator-0.2.0/runs/wizard'
WORK.mkdir(parents=True,exist_ok=False)
class Terminal:
 def __init__(self):
  self.pid,self.fd=pty.fork()
  if self.pid==0:
   os.chdir(ROOT);os.execvp('node',['node','generator/cli.mjs','wizard'])
  self.buffer=b'';self.cursor=0;self.status=None
 def pump(self):
  if select.select([self.fd],[],[],0.1)[0]:
   try:self.buffer+=os.read(self.fd,65536)
   except OSError:pass
 def expect(self,text,timeout=25):
  needle=text.encode();deadline=time.monotonic()+timeout
  while time.monotonic()<deadline:
   found=self.buffer.find(needle,self.cursor)
   if found>=0:self.cursor=found+len(needle);return
   self.pump()
  raise AssertionError('prompt timeout: '+text+'\n'+self.buffer.decode(errors='replace')[-1000:])
 def send(self,text):os.write(self.fd,(text+'\n').encode())
 def end(self,case):
  deadline=time.monotonic()+30
  while time.monotonic()<deadline:
   self.pump();pid,status=os.waitpid(self.pid,os.WNOHANG)
   if pid:
    self.status=os.waitstatus_to_exitcode(status);break
  if self.status is None:os.kill(self.pid,signal.SIGKILL);os.waitpid(self.pid,0);raise AssertionError('wizard timeout')
  os.close(self.fd);(EVIDENCE/(case+'.log')).write_bytes(self.buffer)
  return self.status
 def cleanup(self):
  if self.status is None:
   try:os.kill(self.pid,signal.SIGKILL);os.waitpid(self.pid,0)
   except ProcessLookupError:pass
   try:os.close(self.fd)
   except OSError:pass
results=[]
for case in ['create-back','cancel','interrupt']:
 parent=WORK/case;parent.mkdir();term=Terminal()
 try:
  term.expect('用途 [1]: ')
  if case=='interrupt':
   os.kill(term.pid,signal.SIGINT);code=term.end(case);assert code==130;assert list(parent.iterdir())==[]
   results.append({'case':case,'exitCode':code,'result':'PASS'});continue
  term.send('1');term.expect('画面の構成 [1]: ');term.send('1')
  term.expect('親フォルダ [');term.expect(']: ');term.send(str(parent))
  term.expect('新しいフォルダ名 [');term.expect(']: ');term.send('最初の 入力')
  term.expect('[y/N]: ');term.send('n');term.expect('[y / :back / :cancel]: ')
  assert list(parent.iterdir())==[]
  if case=='cancel':
   term.send(':cancel');code=term.end(case);assert code==0;assert list(parent.iterdir())==[]
   results.append({'case':case,'exitCode':code,'planNoWrites':True,'result':'PASS'});continue
  term.send(':back');term.expect('親フォルダ ['+str(parent)+']: ');term.send('')
  term.expect('新しいフォルダ名 [最初の 入力]: ');term.send('完成 日本語 $(literal)')
  term.expect('[y/N]: ');term.send('n');term.expect('[y / :back / :cancel]: ');assert list(parent.iterdir())==[]
  term.send('y');code=term.end(case);assert code==0
  dest=parent/'完成 日本語 $(literal)'
  def snapshot():return {str(p.relative_to(dest)):hashlib.sha256(p.read_bytes()).hexdigest() for p in dest.rglob('*') if p.is_file()}
  before=snapshot();shutil.rmtree(dest)
  explicit=subprocess.run(['node','generator/cli.mjs','create','F2',str(dest),'--json'],cwd=ROOT,text=True,capture_output=True)
  assert explicit.returncode==0 and json.loads(explicit.stdout)['status']=='created';assert snapshot()==before
  assert not (parent/'最初の 入力').exists()
  results.append({'case':case,'exitCode':code,'planAndBackNoWrites':True,'retainedInput':True,'explicitCliBytesEqual':True,'files':len(before),'result':'PASS'})
 finally:term.cleanup()
result={'recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'result':'PASS','scope':'Real Linux PTY, not piped mock input; no GUI claim','cases':results}
(EVIDENCE/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False,indent=2))
