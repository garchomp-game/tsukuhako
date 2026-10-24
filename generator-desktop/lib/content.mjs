import fs from 'node:fs/promises';import {constants,readFileSync} from 'node:fs';import {randomUUID} from 'node:crypto';import path from 'node:path';import {createHash} from 'node:crypto';
import {desktopError} from '../security.mjs';
const productVersion=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')).version;
const error=()=>desktopError('CONTENT_UNAVAILABLE','教材の版・場所・整合を確認できません。','ツクハコを閉じ、同じ版のインストーラーで再インストールしてください。携帯用の旧版では配布物を展開し直してください。');
const digest=b=>createHash('sha256').update(b).digest('hex');
export async function confinedRead(root,relative,limit=262144){
 if(typeof relative!=='string'||path.isAbsolute(relative)||relative.split(/[\\/]/).some(x=>!x||x==='.'||x==='..'))throw error();
 let current=path.resolve(root);if((await fs.lstat(current)).isSymbolicLink())throw error();
 for(const part of relative.split('/')){current=path.join(current,part);if((await fs.lstat(current)).isSymbolicLink())throw error()}
 if(!current.startsWith(path.resolve(root)+path.sep)||await fs.realpath(current)!==current)throw error();
 const file=await fs.open(current,constants.O_RDONLY|(constants.O_NOFOLLOW||0));try{const s=await file.stat();if(!s.isFile()||s.size>limit)throw error();return await file.readFile()}finally{await file.close()}
}
export class ContentLibrary{
 constructor(root){this.root=root;this.cache=new Map()}
 async index(){if(!this.manifest){const manifest=JSON.parse(await confinedRead(this.root,'manifest.json',262144));if(manifest.appVersion!==productVersion||manifest.version!==productVersion)throw error();this.manifest=manifest}return this.manifest}
 async chapter(lessonId,chapterId){const m=await this.index();const meta=m.lessons.find(l=>l.id===lessonId)?.chapters.find(c=>c.id===chapterId);if(!meta)throw error();const key=lessonId+'/'+chapterId;if(this.cache.has(key)){const v=this.cache.get(key);this.cache.delete(key);this.cache.set(key,v);return v}const bytes=await confinedRead(this.root,meta.file);if(bytes.length!==meta.bytes||digest(bytes)!==meta.sha256)throw error();const value={text:bytes.toString('utf8')};this.cache.set(key,value);while(this.cache.size>3)this.cache.delete(this.cache.keys().next().value);return value}
 async asset(id){const meta=(await this.index()).assets.find(a=>a.id===id);if(!meta||meta.mime!=='image/png')throw error();const bytes=await confinedRead(this.root,meta.file,1048576);if(bytes.length!==meta.bytes||digest(bytes)!==meta.sha256)throw error();return 'data:image/png;base64,'+bytes.toString('base64')}
 async external(lessonId,chapterId,href){const {text}=await this.chapter(lessonId,chapterId);let u;try{u=new URL(href)}catch{throw error()};if(u.protocol!=='https:'||u.username||u.password||!text.includes(']('+href+')')||/[\x00-\x20\x7f]/.test(href))throw error();return u.href}
}
export class ReadingSettings{
 constructor(file){this.file=file;this.queue=Promise.resolve()}
 async read(){try{const stat=await fs.lstat(this.file);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>16384)return{};return JSON.parse(await fs.readFile(this.file,'utf8'))}catch{return{}}}
 save(value){this.queue=this.queue.catch(()=>{}).then(async()=>{await fs.mkdir(path.dirname(this.file),{recursive:true});const tmp=this.file+'.'+randomUUID()+'.tmp';const f=await fs.open(tmp,'wx',0o600);try{await f.writeFile(JSON.stringify(value));await f.sync()}finally{await f.close()}await fs.rename(tmp,this.file)});return this.queue}
}
