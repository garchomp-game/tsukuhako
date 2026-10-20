"""Real PTY regression for review R1, usable with source or a relocated CLI bundle."""
from pathlib import Path
import argparse,codecs,datetime,hashlib,json,os,pty,re,select,signal,subprocess,time
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--bundle',type=Path,default=ROOT);p.add_argument('--label',required=True);p.add_argument('--baseline',action='store_true');args=p.parse_args()
BUNDLE=args.bundle.resolve();E=ROOT/'validation/revision-0.2.1'/args.label;E.mkdir(parents=True,exist_ok=False);WORK=ROOT/'validation/revision-0.2.1/runs'/args.label;WORK.mkdir(parents=True,exist_ok=False)
CONFIRM=r'この内容で作成しますか？ \[y / :back / :cancel\]: '
class Terminal:
 def __init__(self):
  self.pid,self.fd=pty.fork();self.text='';self.cursor=0;self.code=None;self.decoder=codecs.getincrementaldecoder('utf8')('replace')
  if self.pid==0:os.chdir(WORK);os.execvp('node',['node',str(BUNDLE/'generator/cli.mjs'),'wizard'])
 def pump(self):
  if select.select([self.fd],[],[],0.1)[0]:
   try:self.text+=self.decoder.decode(os.read(self.fd,65536))
   except OSError:pass
 def expect(self,pattern,timeout=20):
  deadline=time.monotonic()+timeout
  while time.monotonic()<deadline:
   match=re.search(pattern,self.text[self.cursor:])
   if match:self.cursor+=match.end();return match
   self.pump()
  raise AssertionError('Prompt timeout: '+pattern+'\n'+self.text[-2000:])
 def send(self,value):os.write(self.fd,(value+'\n').encode())
 def field(self,title,value):
  shown=self.expect(re.escape(title)+r' \[([^\r\n]*)\]: ').group(1);self.send(value);return shown
 def confirm(self):
  start=self.cursor;self.expect(CONFIRM);text=self.text[start:self.cursor]
  return {'template':re.search(r'構成: (\w+) /',text).group(1),'project':re.search(r'識別名: ([^\r\n]+)',text).group(1),'ports':re.search(r'ポート: ([^\r\n]+)',text).group(1)}
 def finish(self,case):
  deadline=time.monotonic()+20
  while time.monotonic()<deadline:
   self.pump();pid,status=os.waitpid(self.pid,os.WNOHANG)
   if pid:self.code=os.waitstatus_to_exitcode(status);break
  assert self.code is not None,'wizard did not exit';self.save(case);return self.code
 def save(self,case):(E/(case+'.log')).write_text(self.text)
 def close(self):
  if self.code is None:
   try:os.kill(self.pid,signal.SIGKILL);os.waitpid(self.pid,0)
   except ProcessLookupError:pass
  os.close(self.fd)

def no_output(parent):assert list(parent.iterdir())==[], 'preview/back/cancel wrote files'
def location(t,parent,child):t.field('親フォルダ',str(parent));t.field('新しいフォルダ名',child)
def advanced(t,name,port,db=None):
 t.field('識別ラベル・ポートを変更しますか？','y');t.field('識別ラベル（省略可）',name);t.field('ホストポート',str(port))
 if db is not None:t.field('DB開始ポート',str(db))
def return_unchanged(t,parent,child,db=None):
 t.send(':back');assert t.field('親フォルダ','')==str(parent);assert t.field('新しいフォルダ名','')==child
 shown=t.field('識別ラベル・ポートを変更しますか？','')
 fields={}
 if shown=='Y/n':
  fields['name']=t.field('識別ラベル（省略可）','');fields['port']=t.field('ホストポート','')
  if db is not None:fields['dbBase']=t.field('DB開始ポート','')
 return shown,fields,t.confirm()

cases=['advanced-f2','purpose-i1','framework-f1','same-purpose-f1']
if not args.baseline:cases+=['advanced-s2','explicit-n-and-y','changed-purpose','interrupt']
results=[]
try:
 for case in cases:
  parent=WORK/case;parent.mkdir();t=Terminal();record={'case':case}
  try:
   default=t.field('用途','5' if case=='purpose-i1' else '4' if case=='advanced-s2' else '1');assert default=='1'
   if case=='interrupt':
    t.expect('画面の構成');os.kill(t.pid,signal.SIGINT);assert t.finish(case)==130;no_output(parent);record.update(status='PASS',exitCode=130);results.append(record);continue
   if case=='purpose-i1':
    t.field('親フォルダ',':back');shown=t.field('用途','');record['purposeDefault']=shown
    if shown=='1':t.field('画面の構成','')
    location(t,parent,'用途を保持');t.field('識別ラベル・ポートを変更しますか？','');after=t.confirm();record['after']=after;record['retained']=shown=='5' and after['template']=='I1'
   elif case in ['framework-f1','same-purpose-f1','changed-purpose']:
    t.field('画面の構成','2');t.field('親フォルダ',':back')
    if case in ['same-purpose-f1','changed-purpose']:
     t.field('画面の構成',':back');t.field('用途','2' if case=='changed-purpose' else '')
    if case=='changed-purpose':
     t.field('親フォルダ',':back');assert t.field('用途',':back')=='2';assert t.field('用途','')=='2'
     location(t,parent,'用途変更');t.field('識別ラベル・ポートを変更しますか？','');after=t.confirm();record.update(after=after,retained=after['template']=='B1')
    else:
     shown=t.field('画面の構成','');record['frameworkDefault']=shown;location(t,parent,'Viteを保持');t.field('識別ラベル・ポートを変更しますか？','');after=t.confirm();record.update(after=after,retained=shown=='2' and after['template']=='F1')
   else:
    is_s2=case=='advanced-s2'
    if not is_s2:t.field('画面の構成','1')
    child='日本語 詳細設定 ; $(literal)';location(t,parent,child);advanced(t,'custom',3409,54820 if is_s2 else None)
    before=t.confirm();assert '-custom-' in before['project'] and 'app=3409' in before['ports'];no_output(parent)
    if case=='explicit-n-and-y':
     t.send(':back');t.field('親フォルダ','');t.field('新しいフォルダ名','');assert t.field('識別ラベル・ポートを変更しますか？','n')=='Y/n';disabled=t.confirm();assert '-custom-' not in disabled['project'] and disabled['ports']=='app=3001';no_output(parent)
     shown,_,still_disabled=return_unchanged(t,parent,child);assert shown=='y/N' and still_disabled==disabled
     t.send(':back');t.field('親フォルダ','');t.field('新しいフォルダ名','');assert t.field('識別ラベル・ポートを変更しますか？','y')=='y/N';assert t.field('識別ラベル（省略可）','')=='custom';assert t.field('ホストポート','')=='3409';after=t.confirm();record.update(before=before,explicitN=disabled,after=after,retained=after==before)
    else:
     shown,fields,after=return_unchanged(t,parent,child,54820 if is_s2 else None);record.update(before=before,advancedDefault=shown,fieldDefaults=fields,after=after,retained=shown=='Y/n' and after==before)
     if not args.baseline:assert fields==({'name':'custom','port':'3409','dbBase':'54820'} if is_s2 else {'name':'custom','port':'3409'})
   no_output(parent)
   if args.baseline:
    assert not record['retained'],'expected old-release regression to reproduce';record['status']='REPRODUCED'
   else:assert record['retained'];record['status']='PASS'
   if not args.baseline and case=='advanced-f2':
    t.send('y');assert t.finish(case)==0;dest=parent/child
    env=dict(line.split('=',1) for line in (dest/'.env').read_text().splitlines());assert env['HOST_PORT']=='3409' and '-custom-' in env['PROJECT_NAME']
    guide=(dest/'START_HERE.md').read_text();assert 'app=3409' in guide;record['generatedSettingsCorrect']=True;record['files']=sum(p.is_file() for p in dest.rglob('*'))
   else:
    t.send(':cancel');assert t.finish(case)==0;no_output(parent);record['cancelNoWrites']=True
   record['exitCode']=0;results.append(record)
  finally:t.save(case);t.close()
 report={'status':'REPRODUCED' if args.baseline else 'PASS','recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'bundle':str(BUNDLE),'scope':'Real Linux PTY; normal CLI, real diagnostics, no piped-input or readline mocks','cases':results}
except Exception as error:
 report={'status':'FAIL','cases':results,'error':str(error)}
 raise
finally:
 (E/'result.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False,indent=2))
