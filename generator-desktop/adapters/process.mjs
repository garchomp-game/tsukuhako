import {spawn} from 'node:child_process';
export function decodeOutput(buffer){return buffer.includes(0)?buffer.toString('utf16le').replace(/^\uFEFF/,''):buffer.toString('utf8').replace(/^\uFEFF/,'')}
export function run(executable,args,{signal,timeout=7000,maxBytes=65536,input,env=process.env}={}){
 return new Promise(resolve=>{let chunks=[],bytes=0,reason,done=false,force;const child=spawn(executable,args,{shell:false,windowsHide:true,detached:process.platform!=='win32',stdio:['pipe','pipe','pipe'],env});
 const kill=s=>{try{process.platform==='win32'?child.kill(s):process.kill(-child.pid,s)}catch{}};
 const stop=r=>{reason=r;kill('SIGTERM');force=setTimeout(()=>kill('SIGKILL'),300)};
 const abort=()=>stop('aborted');signal?.addEventListener('abort',abort,{once:true});const timer=setTimeout(()=>stop('timeout'),timeout);
 const finish=(code,error)=>{if(done)return;done=true;clearTimeout(timer);clearTimeout(force);signal?.removeEventListener('abort',abort);if(reason)kill('SIGKILL');resolve({ok:code===0&&!reason&&!error,code,error:error?.code,reason,output:decodeOutput(Buffer.concat(chunks))})};
 for(const stream of [child.stdout,child.stderr])stream.on('data',b=>{bytes+=b.length;if(bytes<=maxBytes)chunks.push(b);else stop('output-limit')});
 child.on('error',e=>finish(null,e));child.on('close',code=>finish(code));child.stdin.on('error',()=>{});child.stdin.end(input);if(signal?.aborted)abort();
 });
}
