import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {root,productVersion,guideRevision,packageRevision,applicationSourceCommit,guideDirectory,selectionFile,guides,platforms} from './delivery-bundle/config.mjs';
import {renderEntry,renderGuide,readGuides} from './delivery-bundle/html.mjs';
const run=(exe,args,options={})=>execFileSync(exe,args,{encoding:'utf8',...options}).trim();
export const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
export const describe=(directory,file)=>({file,bytes:fs.statSync(path.join(directory,file)).size,sha256:hash(path.join(directory,file))});
const writeJson=(file,data)=>fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');
export function expectedFiles(platform){return ['00_START_HERE.html',...['START_HERE.txt','manifest.json','SHA256SUMS',platforms[platform].binary].map(f=>'app/'+f),'guide/index.html',...guides.map(g=>'guide/'+g.file),'manifest.json','SHA256SUMS'].sort();}
export function validateInputs(directory,selected,wanted){
 if(selected.revision!=='2026-10-22-A')throw Error('Unexpected A revision');
 const checked=[];
 for(const platform of wanted){
  const records=selected.files.filter(f=>f.platform===platform);
  const names=['START_HERE.txt','manifest.json','SHA256SUMS',platforms[platform].binary].sort();
  if(JSON.stringify(records.map(f=>f.file).sort())!==JSON.stringify(names))throw Error('Unexpected A file set: '+platform);
  for(const row of records){const file=path.join(directory,platform,row.file);if(!fs.existsSync(file)||!fs.lstatSync(file).isFile())throw Error('Missing regular A input: '+platform+'/'+row.file);const actual=describe(path.join(directory,platform),row.file);if(actual.bytes!==row.bytes||actual.sha256!==row.sha256)throw Error('A input mismatch: '+platform+'/'+row.file);checked.push({platform,...actual});}
 }
 return checked;
}
export function validateArchiveNames(names,stem,platform){
 const expected=expectedFiles(platform).map(f=>stem+'/'+f).sort();
 if(names.some(n=>n.startsWith('/')||n.includes('\\')||n.split('/').some(s=>s==='..'||s==='.'||s==='')||/[\r\n\0]/.test(n)))throw Error('Unsafe ZIP path');
 if(new Set(names).size!==names.length||JSON.stringify([...names].sort())!==JSON.stringify(expected))throw Error('Unexpected ZIP members');
}
export function verifyBundle(archive,platform,selected,extractParent){
 const stem=path.basename(archive,'.zip');
 const names=run('unzip',['-Z1',archive]).split('\n');validateArchiveNames(names,stem,platform);
 const modes=run('unzip',['-Z','-l',archive]).split('\n').filter(l=>/^[bcdlps-][rwx-]{9}/.test(l));
 if(modes.length!==names.length||modes.some(l=>l[0]!=='-'))throw Error('ZIP must contain regular files only');
 fs.mkdirSync(extractParent,{recursive:true});const fresh=fs.mkdtempSync(path.join(extractParent,'新規 展開 '));
 run('unzip',['-q',archive,'-d',fresh]);const folder=path.join(fresh,stem);
 const expected=expectedFiles(platform);for(const file of expected)if(!fs.lstatSync(path.join(folder,file)).isFile())throw Error('Nonregular extraction');
 const manifest=JSON.parse(fs.readFileSync(path.join(folder,'manifest.json')));
 for(const [key,value] of Object.entries({productVersion,guideRevision,packageRevision,platform,architecture:'x64',applicationSourceCommit,entryPoint:'00_START_HERE.html',includesApplication:true,applicationSetRevision:selected.revision}))if(manifest[key]!==value)throw Error('Manifest mismatch: '+key);
 const payload=expected.filter(f=>f!=='manifest.json'&&f!=='SHA256SUMS');
 if(JSON.stringify(manifest.files.map(f=>f.file).sort())!==JSON.stringify(payload))throw Error('Manifest file inventory mismatch');
 for(const row of manifest.files)if(JSON.stringify(describe(folder,row.file))!==JSON.stringify(row))throw Error('Manifest hash mismatch: '+row.file);
 const sums=fs.readFileSync(path.join(folder,'SHA256SUMS'),'utf8').trim().split('\n').map(l=>{const match=l.match(/^([a-f0-9]{64})  (.+)$/);if(!match)throw Error('Bad checksum line');return {sha256:match[1],file:match[2]};});
 if(JSON.stringify(sums.map(r=>r.file).sort())!==JSON.stringify(expected.filter(f=>f!=='SHA256SUMS')))throw Error('Root checksum coverage mismatch');
 for(const row of sums)if(hash(path.join(folder,row.file))!==row.sha256)throw Error('Root checksum mismatch');
 const checked=selected.files.filter(f=>f.platform===platform).map(row=>{
  const actual=describe(path.join(folder,'app'),row.file);
  if(actual.bytes!==row.bytes||actual.sha256!==row.sha256)throw Error('Extracted A input mismatch: '+row.file);
  return {platform,...actual};
 });
 if(JSON.stringify(manifest.applicationInputs)!==JSON.stringify(checked))throw Error('Manifest A inputs mismatch');
 run('sha256sum',['-c','SHA256SUMS'],{cwd:path.join(folder,'app')});
 return {folder,manifest,checked};
}
function sourceFingerprint(){
 const files=['tools/package-delivery-bundle.mjs','tools/delivery-bundle/config.mjs','tools/delivery-bundle/html.mjs','generator-desktop/package.json','generator-desktop/package-lock.json','validation/release-0.4.4-followup/delivery/upload-files.json',...guides.map(g=>'docs/launch/sunday-pack/'+g.file)];
 const commit=run('git',['rev-parse','HEAD'],{cwd:root});
 for(const file of files){const saved=execFileSync('git',['show',commit+':'+file],{cwd:root});if(!saved.equals(fs.readFileSync(path.join(root,file))))throw Error('Commit packaging sources before building: '+file);}
 return {packagingSourceRevision:commit,packagingSourceFiles:files.map(file=>describe(root,file))};
}
export function buildBundles({input,output,evidence,platform='all'}){
 const wanted=platform==='all'?Object.keys(platforms):[platform];if(wanted.some(p=>!platforms[p]))throw Error('Choose linux, windows or all');
 const inputDir=path.resolve(input),outputDir=path.resolve(output),evidenceDir=path.resolve(evidence);
 if(outputDir===inputDir||outputDir.startsWith(inputDir+path.sep)||inputDir.startsWith(outputDir+path.sep))throw Error('Input and output must be separate');
 if(fs.existsSync(outputDir))throw Error('Use a new output directory; existing candidate is preserved');
 if(fs.existsSync(evidenceDir))throw Error('Use a new evidence directory; existing evidence is preserved');
 const selected=JSON.parse(fs.readFileSync(selectionFile));const inputs=validateInputs(inputDir,selected,wanted);const fingerprint=sourceFingerprint();
 const sources=readGuides();for(const g of sources){if(!g.text.includes(guideRevision))throw Error('Guide revision mismatch');if(/\{\{[^}]+\}\}|\/home\/garchomp-game|\/var\/tmp\/|127\.0\.0\.1|localhost:\d|github\.com\/garchomp-game\/tsukuhako/.test(g.text))throw Error('Internal or unresolved reader content: '+g.file);}
 const guideHtml=renderGuide(sources);fs.mkdirSync(outputDir,{recursive:true});fs.mkdirSync(evidenceDir,{recursive:true});const outputs=[];
 for(const p of wanted){
  const stem='tsukuhako-'+productVersion+'-'+p+'-x64-pack-'+packageRevision,stage=fs.mkdtempSync(path.join(os.tmpdir(),'tsukuhako-bundle-')),folder=path.join(stage,stem);fs.mkdirSync(folder+'/app',{recursive:true});fs.mkdirSync(folder+'/guide');
  try {
   for(const row of inputs.filter(f=>f.platform===p))fs.copyFileSync(path.join(inputDir,p,row.file),path.join(folder,'app',row.file));
   for(const g of sources)fs.writeFileSync(path.join(folder,'guide',g.file),g.text);
   fs.writeFileSync(path.join(folder,'guide/index.html'),guideHtml);fs.writeFileSync(path.join(folder,'00_START_HERE.html'),renderEntry(p));
   const payload=expectedFiles(p).filter(f=>f!=='manifest.json'&&f!=='SHA256SUMS');
   const manifest={productVersion,guideRevision,packageRevision,platform:p,architecture:'x64',applicationSourceCommit,...fingerprint,entryPoint:'00_START_HERE.html',includesApplication:true,applicationSetRevision:selected.revision,applicationInputs:inputs.filter(f=>f.platform===p),files:payload.map(file=>describe(folder,file)),verificationScope:{inheritedLinuxApplication:'REAL_HOST / AUTOMATED: Linux Mint 22.3 x64 existing development environment, F2 initialization and first page; 2026-10-23',archiveAndLinks:'STATIC and local file-browser verification recorded outside the archive',windows11RealWslF2:'NOT_RUN',cleanPC:'NOT_RUN',publicRecipientDownload:'NOT_RUN',unaidedHumanTrial:'NOT_RUN'},checksumPolicy:{manifestExcludes:['manifest.json','SHA256SUMS'],rootChecksumsIncludeManifest:true,rootChecksumsExcludeSelf:true},status:'CANDIDATE_NOT_PUBLISHED'};
   writeJson(folder+'/manifest.json',manifest);const covered=[...payload,'manifest.json'].sort();fs.writeFileSync(folder+'/SHA256SUMS',covered.map(f=>hash(path.join(folder,f))+'  '+f).join('\n')+'\n');
   for(const f of expectedFiles(p))fs.utimesSync(path.join(folder,f),new Date('2026-10-25T00:00:00Z'),new Date('2026-10-25T00:00:00Z'));
   const archive=path.join(outputDir,stem+'.zip');run('zip',['-X','-q','-0',archive,...expectedFiles(p).map(f=>stem+'/'+f)],{cwd:stage,env:{...process.env,TZ:'UTC'}});
   const artifact={platform:p,...describe(outputDir,stem+'.zip'),localPath:path.relative(root,archive)};
   const verified=verifyBundle(archive,p,selected,path.join(outputDir,'verification'));
   for(const f of expectedFiles(p))if(hash(path.join(folder,f))!==hash(path.join(verified.folder,f)))throw Error('Extracted bytes differ');
   const pEvidence=path.join(evidenceDir,p);fs.mkdirSync(pEvidence);for(const f of ['manifest.json','SHA256SUMS','00_START_HERE.html'])fs.copyFileSync(path.join(folder,f),path.join(pEvidence,f));
   outputs.push({...artifact,extractedPath:path.relative(root,verified.folder),verification:'PASS',members:expectedFiles(p)});
  }finally{fs.rmSync(stage,{recursive:true,force:true});}
 }
 fs.writeFileSync(outputDir+'/SHA256SUMS',outputs.map(f=>f.sha256+'  '+f.file).join('\n')+'\n');fs.copyFileSync(outputDir+'/SHA256SUMS',evidenceDir+'/SHA256SUMS');
 const result={category:'STATIC',result:'PASS',productVersion,guideRevision,packageRevision,...fingerprint,inputs,files:outputs,published:false,downloadUrls:null};writeJson(evidenceDir+'/artifacts.json',result);return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const args=process.argv.slice(2),values={};for(let i=0;i<args.length;i+=2){if(!['--input','--output','--evidence','--platform'].includes(args[i])||!args[i+1])throw Error('Usage: node tools/package-delivery-bundle.mjs --input A_SET_ROOT --output NEW_DIR --evidence NEW_METADATA_DIR [--platform all|linux|windows]');values[args[i].slice(2)]=args[i+1];}
 for(const key of ['input','output','evidence'])if(!values[key])throw Error('Missing --'+key);
 console.log(JSON.stringify(buildBundles(values).files.map(({platform,file,bytes,sha256})=>({platform,file,bytes,sha256})),null,2));
}
