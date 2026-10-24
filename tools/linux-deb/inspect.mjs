// Read-only inspection of the actual deb; no host installation or maintainer-script execution.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {verifyBundle} from '../verify-desktop-bundle.mjs';

const sha = data => createHash('sha256').update(data).digest('hex');
const run = (name,args) => execFileSync(name,args,{encoding:'utf8',maxBuffer:16*1024*1024});
export async function inspectDeb(input) {
  const deb=path.resolve(input),temp=fs.mkdtempSync(path.join(os.tmpdir(),'tsukuhako-deb-'));
  try {
    const field=name=>run('dpkg-deb',['--field',deb,name]).trim();
    const control=Object.fromEntries(['Package','Version','Architecture','Maintainer','Depends','Homepage'].map(k=>[k,field(k)]));
    assert.equal(control.Package,'tsukuhako');assert.equal(control.Architecture,'amd64');
    assert.match(control.Maintainer,/^garchomp-game <[^<>]+@[^<>]+>$/);
    for(const dep of ['libgtk-3-0t64','libnss3','libasound2t64','libgbm1','xdg-utils'])assert.ok(control.Depends.includes(dep),dep);
    const listing=run('dpkg-deb',['--contents',deb]);
    for(const line of listing.trim().split('\n'))assert.match(line,/\s(?:root\/root|0\/0)\s/,line);
    assert.match(listing,/chrome-sandbox/);
    run('dpkg-deb',['--extract',deb,temp+'/root']);run('dpkg-deb',['--control',deb,temp+'/control']);
    const base=temp+'/root',read=relative=>fs.readFileSync(base+'/'+relative,'utf8');
    const desktopDir=base+'/usr/share/applications',names=fs.readdirSync(desktopDir);
    assert.deepEqual(names,['tsukuhako.desktop']);
    const desktop=read('usr/share/applications/tsukuhako.desktop');
    for(const re of [/^Name=ツクハコ$/m,/^Exec=\/?(?:"\/)?opt\/tsukuhako\/tsukuhako"?\s.*$/m,/^Icon=tsukuhako$/m,/^Terminal=false$/m])assert.match(desktop,re);
    assert.ok(!desktop.includes('--no-sandbox'));assert.ok(!desktop.includes('--disable-sandbox'));
    assert.ok(fs.existsSync(base+'/usr/share/icons/hicolor/256x256/apps/tsukuhako.png'));
    const app=base+'/opt/tsukuhako/resources/app',bundle=await verifyBundle(app);
    assert.equal(bundle.dirty,false);assert.equal(bundle.productVersion,control.Version);assert.equal(bundle.chapters,55);
    const curriculum=JSON.parse(fs.readFileSync(app+'/bundle/curriculum/manifest.json','utf8'));
    assert.deepEqual(curriculum.lessons.find(l=>l.id==='guide').chapters.map(c=>c.id),['start','first-run','troubleshooting','next-step','feedback']);
    assert.match(fs.readFileSync(app+'/main.mjs','utf8'),/app\.enableSandbox\(\)/);
    assert.match(fs.readFileSync(app+'/main.mjs','utf8'),/sandbox:\s*true/);
    for(const file of ['LICENSE.electron.txt','LICENSES.chromium.html'])assert.ok(fs.statSync(base+'/opt/tsukuhako/'+file).size>100);
    const scripts={};
    for(const file of ['preinst','postinst','prerm','postrm'])if(fs.existsSync(temp+'/control/'+file)) {
      const content=fs.readFileSync(temp+'/control/'+file,'utf8');scripts[file]=content;
      assert.ok(!/(?:--no-sandbox|sysctl\s|usermod\s|groupadd\s|docker\s|\$HOME|\/home\/)/.test(content),file);
    }
    assert.match(scripts.postinst,/update-alternatives/);assert.match(scripts.postinst,/chmod 4755/);
    assert.match(scripts.postrm,/update-alternatives/);
    const sandbox=fs.statSync(base+'/opt/tsukuhako/chrome-sandbox');
    assert.ok([0o755,0o4755].includes(sandbox.mode&0o7777));
    const profile=read('opt/tsukuhako/resources/apparmor-profile');
    assert.match(profile,/profile "tsukuhako" "\/opt\/tsukuhako\/tsukuhako"/);assert.match(profile,/userns,/);
    return {status:'PASS',category:'DEB_STATIC_INSPECTION',checkedAt:new Date().toISOString(),file:path.basename(deb),bytes:fs.statSync(deb).size,sha256:sha(fs.readFileSync(deb)),control,bundle,desktop,sandbox:{archiveOwner:'root:root',archiveMode:(sandbox.mode&0o7777).toString(8),installedMode:'See isolated lifecycle evidence; postinst selects 0755 or 4755'},scripts,apparmorProfile:profile,hostInstallation:'NOT_RUN',mintGui:'NOT_RUN'};
  } finally {fs.rmSync(temp,{recursive:true,force:true});}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(await inspectDeb(process.argv[2]),null,2));
