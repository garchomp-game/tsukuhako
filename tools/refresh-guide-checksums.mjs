import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

// Refresh only the current guide's metadata. No app, archive or old evidence is changed.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const folder=path.resolve(process.argv[2]||path.join(root,'docs/launch/sunday-pack'));
const manifestFile=path.join(folder,'manifest.json');
const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
const sha=data=>createHash('sha256').update(data).digest('hex');
const names=manifest.files.map(entry=>entry.file);
if(!names.length||new Set(names).size!==names.length||names.some(name=>typeof name!=='string'||path.basename(name)!==name||!name.endsWith('.md')))throw new Error('Expected unique Markdown basenames');
manifest.files=names.map(file=>{const data=fs.readFileSync(path.join(folder,file));return{file,bytes:data.length,sha256:sha(data)}});
manifest.checksums={algorithm:'SHA-256',file:'SHA256SUMS',covers:[...names,'manifest.json'],note:'The checksum file does not hash itself.'};
const manifestText=JSON.stringify(manifest,null,2)+'\n';
const checksums=[...manifest.files.map(file=>`${file.sha256}  ${file.file}`),`${sha(manifestText)}  manifest.json`].join('\n')+'\n';
fs.writeFileSync(manifestFile,manifestText);
fs.writeFileSync(path.join(folder,'SHA256SUMS'),checksums);
console.log(`Updated ${names.length} guide file hashes and manifest checksum for ${manifest.guideRevision}.`);
