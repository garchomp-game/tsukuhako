// Finish the bundle's existing-app first-run check without repeating edit/restore.
import {fs,out,runtime,chromium,env,expect,sha,json,connect} from '../onboarding-evidence.mjs';
const project=JSON.parse(fs.readFileSync(runtime+'/sunday-project.json'));
const artifacts=JSON.parse(fs.readFileSync(out+'/delivery/artifacts.json'));
const linux=artifacts.files.find(f=>f.platform==='linux');
const input=JSON.parse(fs.readFileSync(out+'/logs/runtime-input.json'));
expect(input.zipSha256).toBe(linux.sha256);
expect(sha(project.binary)).toBe(input.binarySha256);
const url=`http://localhost:${project.port}/`;
expect(fs.readFileSync(project.destination+'/START_HERE.md','utf8')).toContain(url);
const browser=await chromium.launch({channel:'chrome',headless:false,env:env(),args:['--window-size=1400,900']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 const response=await page.goto(url);expect(response.status()).toBe(200);
 await expect(page.locator('h1')).toContainText('小さく変えて、');
 await expect(page.locator('h1')).toContainText('動きを確かめよう。');
 const heading=(await page.locator('h1').innerText()).replace(/\s/g,'');
 expect(heading).toBe('小さく変えて、動きを確かめよう。');
 await page.screenshot({path:out+'/screenshots/03-first-page.png',fullPage:true});
 expect(sha(project.destination+'/app/page.tsx')).toBe(project.sourceHash);
 const c=await connect(9431);try{await expect(c.page.locator('body')).toContainText('Ready');await expect(c.page.locator('body')).toContainText('/workspace');await c.page.screenshot({path:out+'/screenshots/04-server-ready.png'});}finally{await c.browser.close();}
 json(out+'/logs/first-page.json',{category:'REAL_HOST',interaction:'AUTOMATED',result:'PASS',checkedAt:new Date().toISOString(),zipSha256:linux.sha256,binarySha256:input.binarySha256,browser:'Chrome '+browser.version(),headless:false,firstPageHeading:heading,hostPort:project.port,hostUrlUsesGeneratedGuide:true,completionProof:'screenshots/02-initialized.png',serverReady:true,httpStatus:200,sourceUnchanged:true,sourceHash:project.sourceHash,optionalEditRestore:'INHERITED_PREVIOUS_EVIDENCE_NOT_REPEATED',unaidedHuman:'NOT_RUN'});
 console.log('PASS: final bundled Linux application → F2 normal initialization → first page.');
}finally{await browser.close();}
