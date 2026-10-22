import {readdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';
async function files(dir){return(await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?files(join(dir,e.name)):[join(dir,e.name)]))).flat();}
const denied=['/api/preview/','原稿をローカル確認','linuxDownload','windowsDownload','brain-paid','PRIVATE-LINKS','RESEND_API_KEY','confirmationTokens'];
for(const path of await files('dist')){const data=await readFile(path,'utf8');for(const term of denied)if(data.includes(term))throw new Error(`Public build contains ${term}: ${path}`);}
console.log('Public static build excludes preview management, paid download keys and mail source documents.');
