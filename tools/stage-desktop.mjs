import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {verifyBundle} from './verify-desktop-bundle.mjs';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const gui = path.join(root, 'generator-desktop');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
export async function stageDesktop(destination = path.join(root, 'dist/desktop-app')) {
  const pkg = read(path.join(gui, 'package.json'));
  const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim();
  const dirty = !!execFileSync('git', ['status', '--porcelain', '--untracked-files=normal'], {cwd: root, encoding: 'utf8'}).trim();
  if (dirty && !process.argv.includes('--allow-dirty')) throw Error('Commit product sources before staging; --allow-dirty is for tests only.');
  fs.rmSync(destination, {recursive: true, force: true});
  fs.mkdirSync(destination, {recursive: true});
  const copy = (from, to) => fs.cpSync(from, to, {recursive: true, dereference: false});
  for (const f of ['main.mjs','preload.cjs','worker.mjs','security.mjs','build','lib','adapters','wsl-helper','README.md']) copy(path.join(gui,f),path.join(destination,f));
  fs.writeFileSync(path.join(destination,'package.json'), JSON.stringify({name:pkg.name,productName:pkg.productName,version:pkg.version,main:pkg.main,type:'module',description:'ツクハコ — 作る・学ぶ・困ったとき',author:'ツクハコ',private:true}, null, 2)+'\n');
  const bundle = path.join(destination,'bundle');
  fs.mkdirSync(bundle);
  for (const f of ['catalog.json','curriculum','generator/src','generator/package.json','generator/node_modules/fflate']) copy(path.join(root,f),path.join(bundle,f));
  for (const t of read(path.join(root,'catalog.json')).templates) copy(path.join(root,t.packagePath),path.join(bundle,t.packagePath));
  const licenses = path.join(destination,'third-party');
  fs.mkdirSync(licenses);
  for (const name of ['react','react-dom','markdown-it','entities','linkify-it','mdurl','punycode.js','uc.micro','argparse']) {
    const source = path.join(gui,'node_modules',name);
    const license = fs.readdirSync(source).find(f=>/^license/i.test(f));
    if (!license) throw Error('License missing: '+name);
    copy(path.join(source,license),path.join(licenses,name+'-LICENSE.txt'));
  }
  copy(path.join(root,'generator/node_modules/fflate/LICENSE'),path.join(licenses,'fflate-LICENSE.txt'));
  fs.writeFileSync(path.join(destination,'build-info.json'),JSON.stringify({productVersion:pkg.version,sourceCommit,dirty,helperVersion:read(path.join(gui,'wsl-helper/bundle.json')).version},null,2)+'\n');
  const files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))) {
      const p = path.join(dir,entry.name);
      if (entry.isSymbolicLink()) throw Error('Unexpected bundle symlink: '+p);
      if (entry.isDirectory()) walk(p);
      else {const bytes=fs.readFileSync(p);files.push({path:path.relative(destination,p).split(path.sep).join('/'),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}
    }
  }
  walk(destination);
  fs.writeFileSync(path.join(destination,'bundle-files.json'),JSON.stringify(files,null,2)+'\n');
  return verifyBundle(destination);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify(await stageDesktop(),null,2));
