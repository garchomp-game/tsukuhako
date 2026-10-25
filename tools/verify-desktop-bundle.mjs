import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL,fileURLToPath} from 'node:url';
const sha = b => createHash('sha256').update(b).digest('hex');
export async function verifyBundle(directory) {
  const dir = path.resolve(directory);
  const read = p => JSON.parse(fs.readFileSync(path.join(dir,p),'utf8'));
  const pkg = read('package.json'), info = read('build-info.json');
  assert.equal(pkg.version,info.productVersion);
  const [major,minor,patch] = pkg.version.split('.').map(Number);
  if (major > 1 || (major === 1 && (minor > 0 || patch >= 1))) {
    assert.equal(pkg.license,'MIT');
    assert.match(fs.readFileSync(path.join(dir,'LICENSE'),'utf8'), /MIT License/);
    assert.ok(fs.statSync(path.join(dir,'THIRD-PARTY-NOTICES.md')).isFile());
    assert.ok(fs.statSync(path.join(dir,'third-party/scheduler-LICENSE.txt')).size > 100);
  }
  assert.match(info.sourceCommit,/^[a-f0-9]{40}$/);
  for (const file of ['main.mjs','preload.cjs','worker.mjs','security.mjs','build/index.html','lib/content.mjs','adapters/wsl.mjs','wsl-helper/bundle.json','wsl-helper/helper.tar','third-party/fflate-LICENSE.txt','third-party/react-LICENSE.txt','third-party/markdown-it-LICENSE.txt','bundle/generator/node_modules/fflate/package.json']) assert.ok(fs.statSync(path.join(dir,file)).isFile(),file);
  const files=read('bundle-files.json');
  for (const f of files) {
    assert.ok(!path.isAbsolute(f.path)&&!f.path.includes('\\')&&!f.path.split('/').some(p=>!p||p==='..'));
    const data=fs.readFileSync(path.join(dir,f.path));
    assert.equal(data.length,f.bytes,f.path);assert.equal(sha(data),f.sha256,f.path);
  }
  const helper=read('wsl-helper/bundle.json'),archive=fs.readFileSync(path.join(dir,'wsl-helper/helper.tar'));
  assert.equal(helper.version,pkg.version);assert.equal(helper.arch,'x64');assert.equal(archive.length,helper.bytes);assert.equal(sha(archive),helper.sha256);
  const {ContentLibrary}=await import(pathToFileURL(path.join(dir,'lib/content.mjs')).href);
  const lib=new ContentLibrary(path.join(dir,'bundle/curriculum')),m=await lib.index();
  assert.equal(m.version,pkg.version);assert.equal(m.appVersion,pkg.version);
  let chapters=0;
  for (const l of m.lessons) {assert.equal(l.version,pkg.version);for(const c of l.chapters){await lib.chapter(l.id,c.id);chapters++;}}
  for(const a of m.assets) await lib.asset(a.id);
  const {VERSION}=await import(pathToFileURL(path.join(dir,'bundle/generator/src/core/common.mjs')).href);
  assert.equal(VERSION,pkg.version);assert.equal(read('bundle/generator/package.json').version,pkg.version);
  const {HELPER_VERSION}=await import(pathToFileURL(path.join(dir,'adapters/wsl.mjs')).href);assert.equal(HELPER_VERSION,pkg.version);
  const catalog=read('bundle/catalog.json');assert.equal(catalog.packageVersion,pkg.version);
  for(const t of catalog.templates){const data=fs.readFileSync(path.join(dir,'bundle',t.packagePath));assert.equal(sha(data),t.packageSha256,t.id);assert.equal(data.length,t.packageBytes,t.id);if(t.generatorEligible)assert.equal(m.lessons.find(l=>l.id===t.id).templateVersion,t.implementationVersion);}
  return {status:'PASS',category:'BUNDLE_INSPECTION',...info,files:files.length,chapters,templates:catalog.templates.length,helperSha256:helper.sha256};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) console.log(JSON.stringify(await verifyBundle(process.argv[2]),null,2));
