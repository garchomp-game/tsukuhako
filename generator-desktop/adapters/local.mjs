import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {run} from './process.mjs';import {desktopError} from '../security.mjs';
export const STATUS={ready:'利用可能',missing:'未導入',stopped:'導入済みだが未起動',setup:'設定不足',restart:'再起動等が必要',unknown:'確認できない'};
export function commandSpec(name,platform=process.platform,env=process.env){
 const p=platform==='win32'?path.win32:path;let candidates=[];
 if(platform==='win32'){
  if(name==='code')candidates=[p.join(env.LOCALAPPDATA||'C:\\Users\\Default\\AppData\\Local','Programs','Microsoft VS Code','Code.exe'),p.join(env.ProgramFiles||'C:\\Program Files','Microsoft VS Code','Code.exe')];
  if(name==='docker')candidates=[p.join(env.ProgramFiles||'C:\\Program Files','Docker','Docker','resources','bin','docker.exe')];
 }else{
  candidates=(env.PATH||'').split(path.delimiter).filter(Boolean).map(d=>p.join(d,name));
  if(name==='docker')candidates.push('/usr/bin/docker','/usr/local/bin/docker','/Applications/Docker.app/Contents/Resources/bin/docker');
  if(name==='code')candidates.push('/usr/bin/code','/usr/local/bin/code','/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code',p.join(os.homedir(),'Applications/Visual Studio Code.app/Contents/Resources/app/bin/code'));
 }
 const found=candidates.find(f=>{try{fs.accessSync(f,fs.constants.X_OK);return fs.statSync(f).isFile()}catch{return false}});
 if(!found)return null;
 if(platform==='win32'&&name==='code'){const cli=p.join(p.dirname(found),'resources','app','out','cli.js');if(!fs.existsSync(cli))return null;return{executable:found,prefix:[cli],env:{...env,ELECTRON_RUN_AS_NODE:'1'},outsidePath:true}}
 return{executable:found,prefix:[],env,outsidePath:!(env.PATH||'').split(path.delimiter).includes(p.dirname(found))};
}
export async function invoke(spec,args,options={}){if(!spec)return{ok:false,error:'ENOENT',output:''};return run(spec.executable,[...spec.prefix,...args],{...options,env:spec.env})}
export function failureState(r){if(r.reason)return'unknown';if(r.error==='ENOENT')return'missing';if(r.error==='EACCES'||/permission denied|access is denied|0x80070005/i.test(r.output))return'setup';if(/restart|reboot|0x800701bc/i.test(r.output))return'restart';if(/cannot connect|connection refused|daemon is not running|is the docker daemon running/i.test(r.output))return'stopped';return'unknown'}
export function effectiveEndpoint(env,contextHost){return env.DOCKER_CONTEXT?contextHost:env.DOCKER_HOST||contextHost}
export function redact(text,home=os.homedir()){
 return String(text).split(home).join('<HOME>').replace(/(?:https?|tcp|ssh):\/\/[^\s"<>]+/g,'<CONNECTION>').replace(/(?:[A-Za-z]:\\Users\\|\/home\/|\/Users\/)[^\s/\\"<>]+/g,'<HOME>').replace(/(token|password|secret|authorization)\s*[:=]\s*\S+/gi,'$1=<REDACTED>');
}
export async function diagnoseLocal({platform=process.platform,arch=process.arch,signal,runner,env=process.env,home=os.homedir(),includeCode=true,includeDocker=true,templateId}={}){
 const checks=[];const guide=platform==='darwin'?'macos':platform==='win32'?'windows':'linux';
 const add=(id,state,message,reason,nextAction,extra={})=>checks.push({id,state,label:STATUS[state],message,reason,nextAction,guide,...extra});
 const specs=Object.fromEntries(['docker','code','bash','curl','tar','sha256sum','awk','sed','timeout'].map(name=>[name,commandSpec(name,platform,env)]));
 const probe=runner||((name,args)=>invoke(specs[name],args,{signal}));
 if(includeDocker){const docker=await probe('docker',['--version']);
 add('docker-cli',docker.ok?'ready':failureState(docker),docker.ok?'Docker CLIを確認しました。'+(specs.docker?.outsidePath?' GUIのPATH外の既知の場所で検出。':''):'Docker CLIを確認できません。','コンテナを操作するために必要です。','OS別の公式導入先とPATHの手順を確認し、再診断します。');
 if(docker.ok&&!signal?.aborted){
  const context=await probe('docker',['context','show']);
  const inspect=context.ok?await probe('docker',['context','inspect','--format','{{.Endpoints.docker.Host}}']):context;
  const endpoint=effectiveEndpoint(env,inspect.output.trim());const remote=!!endpoint&&!/^(unix:\/\/|npipe:\/\/)/.test(endpoint);
  add('docker-context',!inspect.ok?'unknown':remote?'setup':'ready',remote?'リモート接続先です。初版のローカル開発と異なります。':inspect.ok?'ローカル接続先を確認しました。':'接続先を確認できません。','同じ環境のファイルをコンテナへ渡す必要があります。','Docker contextとDOCKER_HOST / DOCKER_CONTEXTの指定を自身で確認します。');
  // Do not contact a known remote server during local readiness checks.
  if(!remote){const server=await probe('docker',['info','--format','{{json .}}']);let info={};try{info=JSON.parse(server.output)}catch{}
   const state=!server.ok?failureState(server):info.OSType==='linux'?'ready':'setup';
   const engine=/desktop/i.test(info.OperatingSystem||'')?'desktop':(info.SecurityOptions||[]).some(x=>x.includes('rootless'))?'rootless':'engine';
   add('docker-server',state,!server.ok?'Docker Serverへ接続できません。':info.OSType!=='linux'?'Linux containersへ切り替える設定が必要です。':`Linux containersへ接続できました（${engine}）。`,'テンプレートはLinuxコンテナで動きます。','起動、一般ユーザーの権限、Docker接続先、WSL Integrationを確認します。',{engine,serverVersion:info.ServerVersion||null});
   if(platform==='linux'&&engine!=='engine')add('engine-compatibility','unknown',`${engine}構成のテンプレート適合は別途確認が必要です。`,'Engineと異なる実行方式です。','既存設定を保ったまま、対象構成で実起動を確認します。');
  }
  const compose=await probe('docker',['compose','version','--short']);add('compose',compose.ok?'ready':failureState(compose),compose.ok?'Composeプラグインを確認しました。':'Composeプラグインを確認できません。','サービス構成を起動するために必要です。','OS別のDocker公式手順でComposeプラグインを確認します。');
 }
 }
 if(includeCode&&!signal?.aborted){const code=await probe('code',['--version']);add('code',code.ok?'ready':failureState(code),code.ok?'VS Codeを確認しました。'+(specs.code?.outsidePath?' GUIのPATH外で検出。':''):'VS Codeを確認できません。','生成したコードを編集するために使います。','VS CodeのOS別導入手順を読み、再確認します。');if(code.ok){const ext=await probe('code',['--list-extensions']);for(const [id,label]of[['ms-vscode-remote.remote-containers','Dev Containers'],...(platform==='win32'?[['ms-vscode-remote.remote-wsl','WSL']]:[])])add(id,!ext.ok?'unknown':ext.output.toLowerCase().split(/\r?\n/).includes(id)?'ready':'setup',`${label}拡張の確認`,'VS Codeから対象環境へ接続します。',`VS Codeの拡張画面で${label}を確認します。`)}}
 if(templateId==='S2'&&platform==='linux'&&!signal?.aborted){for(const name of ['bash','curl','tar','sha256sum','awk','sed','timeout']){const r=await probe(name,name==='awk'?['BEGIN {exit 0}']:['--version']);add('s2-'+name,r.ok?'ready':failureState(r),`S2のホスト用 ${name} の確認`,'Supabaseの取得と起動に使います。','S2の準備教材で不足コマンドを確認します。');if(signal?.aborted)break;}}
 if(platform==='darwin')add('template-host-tools','unknown',templateId==='S2'?'S2のホスト用起動スクリプトはLinux専用です。':'既存ホスト用bash / GNUコマンドのmacOS適合は未確認です。','ファイル生成と実起動は別の検証です。','対象テンプレートの実機検証が終わるまで、macOS対応済みとして扱わないでください。');
 let capacity={totalMemoryBytes:os.totalmem(),availableBytes:null};try{const s=fs.statfsSync(home);capacity.availableBytes=Number(s.bavail)*Number(s.bsize)}catch{}
 if(signal?.aborted)add('interrupted','unknown','診断を中断しました。','未実施項目は成功と扱いません。','必要な時に再確認してください。');
 return{platform,arch,checkedAt:new Date().toISOString(),checks,capacity,templateId:templateId||null,dockerReady:checks.some(c=>c.id==='docker-server'&&c.state==='ready'),devContainerReady:null,stale:false};
}
export async function openLocalEditor(destination,{platform=process.platform,distro}={}){
 const args=distro?['--folder-uri',`vscode-remote://wsl+${encodeURIComponent(distro)}${destination.split('/').map(encodeURIComponent).join('/')}`]:['--',destination];
 const result=await invoke(commandSpec('code',platform),args,{timeout:12000});
 if(!result.ok)throw desktopError('EDITOR_UNAVAILABLE','VS Codeへ接続を渡せませんでした。',distro?`WSL: Connect to WSL using Distroで「${distro}」を選び、${destination} を開いてください。`:`VS Codeから ${destination} を開いてください。`);
 return{opened:true};
}
