import {spawn,spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const root=path.resolve(import.meta.dirname,'..'),out=root+'/validation/ux-0.4.2',base=out+'/runs/vscode';
const project=JSON.parse(fs.readFileSync(out+'/project.json'));
fs.mkdirSync(base+'/profile/User',{recursive:true});
fs.writeFileSync(base+'/profile/User/settings.json',JSON.stringify({'workbench.startupEditor':'none','extensions.autoUpdate':false,'extensions.autoCheckUpdates':false,'update.mode':'none'}));
if(!fs.existsSync(base+'/extensions')){
 const installed=path.join(os.homedir(),'.vscode/extensions');
 const extension=process.env.TSUKUHAKO_DEVCONTAINERS_EXTENSION||path.join(installed,fs.readdirSync(installed).filter(n=>n.startsWith('ms-vscode-remote.remote-containers-')).sort().at(-1)||'missing-extension');
 if(!fs.existsSync(extension))throw Error('Set TSUKUHAKO_DEVCONTAINERS_EXTENSION to an installed Dev Containers extension directory.');
 fs.mkdirSync(base+'/extensions');fs.cpSync(extension,path.join(base,'extensions',path.basename(extension)),{recursive:true});
}
const doctor=spawnSync('bash',['scripts/doctor-host.sh'],{cwd:project.destination,encoding:'utf8'});
fs.writeFileSync(out+'/f2-doctor.txt',doctor.stdout+doctor.stderr);if(doctor.status!==0)throw Error('F2 doctor failed');
const log=fs.openSync(base+'/launch.log','w'),env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
const child=spawn('/usr/bin/code',['--user-data-dir',base+'/profile','--extensions-dir',base+'/extensions','--remote-debugging-port=9422','--remote-debugging-address=127.0.0.1','--new-window','--wait',project.destination],{env,stdio:['ignore',log,log],shell:false});
fs.writeFileSync(base+'/launcher.json',JSON.stringify({pid:child.pid,port:9422}));
child.on('exit',code=>console.log('Owned VS Code closed',code));
