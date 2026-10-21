import { app, BrowserWindow, dialog, ipcMain, protocol, session, utilityProcess, shell } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ContentLibrary, ReadingSettings } from './lib/content.mjs';
import { diagnoseLocal, openLocalEditor, redact, STATUS } from './adapters/local.mjs';
import { windowsGuidance } from './adapters/wsl-guidance.mjs';
import { WSLAdapter } from './adapters/wsl.mjs';
import { UI_URL, METHODS, desktopError, validateSender, validatePayload, publicFailure } from './security.mjs';

const directory = path.dirname(fileURLToPath(import.meta.url));
const bundleRoot = fs.existsSync(path.join(directory, 'bundle/catalog.json')) ? path.join(directory, 'bundle') : path.resolve(directory, '..');
const buildRoot = path.join(directory, 'build');
app.setName('ツクハコ');
// Keep an explicit test/user profile override; ordinary launches use the new slug.
if (!app.commandLine.hasSwitch('user-data-dir')) {
  app.setPath('userData', path.join(app.getPath('appData'), 'tsukuhako'));
}
app.setPath('sessionData', app.getPath('userData'));
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }]);
app.enableSandbox();
let window, worker, serial = 0, generating = false, lastCreated, lastCreatedTarget;
const pending = new Map();
function ensureWorker() {
  if (worker) return;
  const child = utilityProcess.fork(path.join(directory, 'worker.mjs'), [bundleRoot], { serviceName: 'Tsukuhako Generator', stdio: 'ignore' });
  worker = child;
  child.on('message', message => {
    const task = pending.get(message.id);
    if (!task || task.worker !== child) return;
    clearTimeout(task.timer); pending.delete(message.id);
    if (message.ok) task.resolve(message.value);
    else task.reject(Object.assign(new Error(message.error.message), message.error));
  });
  child.on('exit', () => {
    if (worker === child) worker = undefined;
    for (const [id, task] of pending) if (task.worker === child) {
      clearTimeout(task.timer); pending.delete(id);
      task.reject(desktopError('WORKER_FAILED', '作成処理との接続が切れました。', '作成中だった場合は保存先を確認してください。入力へ戻って再確認できます。'));
    }
  });
}
function rpc(method, payload) {
  ensureWorker(); const child = worker, id = ++serial;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      // A timed-out worker is not reused with unobserved state or an old plan.
      child.kill();
      pending.delete(id);
      reject(desktopError('WORKER_TIMEOUT', '処理を時間内に確認できませんでした。', '作成中だった場合は保存先の状態を確認してから、入力へ戻って再試行してください。'));
    }, 25000);
    pending.set(id, { worker: child, resolve, reject, timer });
    child.postMessage({ id, method, payload });
  });
}
const library = new ContentLibrary(path.join(bundleRoot,'curriculum'));
const reading = new ReadingSettings(path.join(app.getPath('userData'),'reading.json'));
const wsl = process.platform==='win32' ? new WSLAdapter(path.join(directory,'wsl-helper')) : null;
let preparationController, preparationDone = Promise.resolve();
const readOnly = new Set(['getLearningIndex','readChapter','readAsset','readSettings','saveSettings','openLessonLink','cancelPreparation']);
async function checkPreparation(payload,install=false){
  if(preparationController)throw desktopError('BUSY','準備チェックを実行しています。','完了を待つか中断してください。');
  const controller=new AbortController();preparationController=controller;
  let finishPreparation;
  preparationDone=new Promise(resolve=>{finishPreparation=resolve});
  try{
    if(!wsl)return await diagnoseLocal({...payload,signal:controller.signal});
    if(!payload.distroId)throw desktopError('WSL_SELECTION','開発するWSLを選んでください。','通常のLinuxディストリビューションを選びます。');
    const target=await wsl.choose(payload.distroId,controller.signal);
    if(install)await wsl.install(controller.signal);
    const code=await diagnoseLocal({platform:'win32',includeDocker:false,templateId:payload.templateId,signal:controller.signal,runner:undefined});
    const helperReady=await wsl.verifyRemote(controller.signal);
    const linux=helperReady?await wsl.request('prepare',{templateId:payload.templateId},{signal:controller.signal}):{checks:[{id:'helper',state:'setup',label:STATUS.setup,message:'同梱のWSL用ファイルを準備してください。',reason:'選んだLinux内で同じ共有コアを実行します。',nextAction:'「WSL用ファイルを準備」を押してください。',guide:'windows'}],dockerReady:false};
    return {...linux,platform:'win32',arch:process.arch,checkedAt:new Date().toISOString(),target,defaultParent:target.home,helperReady,checks:[...windowsGuidance(linux.checks),...code.checks.filter(c=>['code','ms-vscode-remote.remote-containers','ms-vscode-remote.remote-wsl'].includes(c.id))],devContainerReady:null};
  }finally{if(preparationController===controller)preparationController=undefined;finishPreparation();}
}
async function generateRpc(method,payload){
 if(!wsl)return rpc(method,payload);
 if(method==='getTemplates')return rpc(method,payload);
 if(method==='reset'&&!wsl.session)return null;
 if(!wsl.session)throw desktopError('WSL_SELECTION','先に開発準備チェックでWSLを確認してください。','同梱教材は今すぐ読めます。');
 await wsl.choose(wsl.session.distroId);
 return wsl.request(method,payload);
}
for (const method of METHODS) ipcMain.handle(`tsukuhako:${method}`, async (event, input) => {
  try {
    validateSender(event, window);
    const payload = validatePayload(method, input);
    if (generating && !readOnly.has(method)) throw desktopError('BUSY', 'ファイルを作成しています。', '結果が表示されるまでお待ちください。');
    if(preparationController&&['plan','apply','diagnose'].includes(method)&&payload!==null)throw desktopError('BUSY','準備チェックを実行しています。','診断が終わってから内容を確認してください。');
    let value;
    if(method==='getLearningIndex') value=await library.index();
    else if(method==='readChapter') value=await library.chapter(payload.lessonId,payload.chapterId);
    else if(method==='readAsset') value=await library.asset(payload.id);
    else if(method==='readSettings') value=await reading.read();
    else if(method==='saveSettings') { await reading.save(payload);value={saved:true}; }
    else if(method==='openLessonLink') {await shell.openExternal(await library.external(payload.lessonId,payload.chapterId,payload.href));value={opened:true};}
    else if(method==='getPreparation') value={platform:process.platform,arch:process.arch,defaultParent:app.getPath('home'),...(wsl?await wsl.list():{})};
    else if(method==='checkPreparation'||method==='prepareWSL') value=await checkPreparation(payload,method==='prepareWSL');
    else if(method==='cancelPreparation') {preparationController?.abort();value={cancelled:true};}
    else if(method==='exportDiagnostic') {const result=await dialog.showSaveDialog(window,{title:'診断ログを書き出す',defaultPath:'tsukuhako-diagnostic.txt',filters:[{name:'テキスト',extensions:['txt']}]});if(result.canceled)value={saved:false};else{await fs.promises.writeFile(result.filePath,redact(payload.text),{mode:0o600});value={saved:true};}}
    else if (method === 'getTemplates') value = { ...await rpc(method), defaultParent: app.getPath('home'), version: '0.4.4' };
    else if (method === 'chooseParentDirectory') {
      if(wsl)throw desktopError('WSL_PATH','WSLの保存先を手入力してください。','Windows側のフォルダ選択は使いません。');
      const result = await dialog.showOpenDialog(window, { title: '親フォルダを選ぶ', buttonLabel: '親フォルダを選ぶ', properties: ['openDirectory'] });
      value = result.canceled ? null : result.filePaths[0];
    } else if (method === 'plan') {
      lastCreated = undefined;
      value = await generateRpc(payload === null ? 'reset' : 'plan', payload);
    } else if (method === 'apply') {
      generating = true;
      try { value = await generateRpc(method, payload); lastCreated = value.destination; lastCreatedTarget = wsl?.session ? JSON.stringify(wsl.session) : null; }
      finally { generating = false; }
    } else if (method === 'openInVSCode') {
      if (!lastCreated) throw desktopError('NOT_CREATED', '作成済みのフォルダがありません。', '先にプロジェクトを作成してください。');
      if(wsl){await wsl.choose(wsl.session.distroId);if(lastCreatedTarget!==JSON.stringify(wsl.session))throw desktopError('TARGET_CHANGED','生成時のWSLと現在の実行先が異なります。','生成完了時のdistroと通常ユーザーで手動接続してください。');}
      value = await openLocalEditor(lastCreated,{distro:wsl?.session?.distro});
    } else value = await generateRpc(method, payload);
    return { ok: true, value };
  } catch (error) { return publicFailure(error); }
});
app.whenReady().then(async () => {
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => callback({ cancel: !details.url.startsWith('app://tsukuhako/') && !details.url.startsWith('devtools://') }));
  const allowed = new Set();
  function list(dir) { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const full = path.join(dir, entry.name); if (entry.isDirectory()) list(full); else if (entry.isFile()) allowed.add(full); } }
  list(buildRoot);
  protocol.handle('app', async request => {
    const url = new URL(request.url);
    let relative;
    try { relative = decodeURIComponent(url.pathname); } catch { return new Response('Bad path', { status: 400 }); }
    const target = path.resolve(buildRoot, '.' + relative);
    if (request.method !== 'GET' || url.host !== 'tsukuhako' || url.search || !allowed.has(target) || !target.startsWith(buildRoot + path.sep)) return new Response('Not found', { status: 404 });
    const content = await fs.promises.readFile(target);
    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' }[path.extname(target)] ?? 'application/octet-stream';
    const headers = new Headers({ 'Content-Type': mime + '; charset=utf-8' });
    headers.set('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'");
    headers.set('X-Content-Type-Options', 'nosniff');
    return new Response(content, { status: 200, headers });
  });
  window = new BrowserWindow({ width: 1150, height: 900, minWidth: 860, minHeight: 680, title: 'ツクハコ — 作る・学ぶ・困ったとき', backgroundColor: '#F7F9FC', icon: path.join(buildRoot, 'brand-mark.png'), show: false,
    webPreferences: { preload: path.join(directory, 'preload.cjs'), contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true, webviewTag: false } });
  window.removeMenu();
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', event => event.preventDefault());
  window.webContents.on('will-attach-webview', event => event.preventDefault());
  // Menu-less windows still offer the usual keyboard display controls.
  window.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown' || !(input.control || input.meta) || input.alt) return;
    if (!['+', '=', '-', '0'].includes(input.key)) return;
    event.preventDefault();
    const current = window.webContents.getZoomFactor();
    const next = input.key === '0' ? 1 : Math.max(.75, Math.min(2, Math.round((current + (input.key === '-' ? -.25 : .25)) * 100) / 100));
    window.webContents.setZoomFactor(next);
  });
  window.webContents.on('before-input-event', (event, input) => { if (generating && ((input.control || input.meta) && input.key.toLowerCase() === 'r' || input.key === 'F5')) event.preventDefault(); });
  window.webContents.on('did-start-navigation', (_event, _url, _inPlace, isMainFrame) => { if (isMainFrame && !generating) { lastCreated = undefined; generateRpc('reset').catch(() => {}); } });
  window.on('close', event => { if (generating) event.preventDefault(); });
  window.webContents.on('render-process-gone', () => { lastCreated = undefined; if (!generating) generateRpc('reset').catch(() => {}); });
  window.once('ready-to-show', () => window.show());
  await window.loadURL(UI_URL);
});
let shuttingDown=false,allowQuit=false;
async function shutdown(){
  if(shuttingDown)return;
  shuttingDown=true;
  try{
    preparationController?.abort();
    await wsl?.close();
    await preparationDone;
    await reading.queue.catch(()=>{});
  }finally{worker?.kill();allowQuit=true;app.quit();}
}
app.on('before-quit', event => {
  if(generating){event.preventDefault();return;}
  if(!allowQuit){event.preventDefault();void shutdown();}
});
app.on('window-all-closed',()=>{void shutdown();});
