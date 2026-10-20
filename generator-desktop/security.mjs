export const UI_URL = 'app://tsukuhako/index.html';
export const METHODS = ['getTemplates', 'chooseParentDirectory', 'plan', 'diagnose', 'apply', 'openInVSCode', 'getLearningIndex', 'readChapter', 'readAsset', 'readSettings', 'saveSettings', 'openLessonLink', 'getPreparation', 'checkPreparation', 'cancelPreparation', 'prepareWSL', 'exportDiagnostic'];
export function desktopError(code, message, nextAction, details = {}) {
  return Object.assign(new Error(message), { code, nextAction, details });
}
const bad = () => { throw desktopError('INVALID_OPTIONS', '入力の形式が正しくありません。', '入力欄を確認し直してください。'); };
export function validateSender(event, window) {
  if (!window || window.isDestroyed() || event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame || event.senderFrame?.url !== UI_URL) {
    throw desktopError('INVALID_SENDER', 'この画面からの操作を確認できません。', 'アプリを開き直してください。');
  }
}
function plain(value) { return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype; }
export function validatePayload(method, payload) {
  if (!METHODS.includes(method)) bad();
  if (['getLearningIndex','readSettings','getPreparation','cancelPreparation'].includes(method)) { if(payload!==undefined)bad();return; }
  if (['readChapter','openLessonLink'].includes(method)) {
    if(!plain(payload)||Object.keys(payload).some(k=>!['lessonId','chapterId',...(method==='openLessonLink'?['href']:[])].includes(k)))bad();
    for(const key of ['lessonId','chapterId'])if(typeof payload[key]!=='string'||!/^[A-Za-z0-9-]{1,64}$/.test(payload[key]))bad();
    if(method==='openLessonLink'&&(typeof payload.href!=='string'||payload.href.length>2048))bad();return {...payload};
  }
  if(method==='readAsset'){if(!plain(payload)||Object.keys(payload).length!==1||typeof payload.id!=='string'||!/^[a-z0-9-]{1,64}$/.test(payload.id))bad();return {...payload};}
  if(method==='saveSettings'){
    if(!plain(payload)||Object.keys(payload).some(k=>!['view','lessonId','chapterId','scroll','distroId'].includes(k)))bad();
    if(!['create','learn','help'].includes(payload.view)||typeof payload.lessonId!=='string'||!/^[A-Za-z0-9-]{1,64}$/.test(payload.lessonId)||typeof payload.chapterId!=='string'||!/^[A-Za-z0-9-]{0,64}$/.test(payload.chapterId)||!Number.isFinite(payload.scroll)||payload.scroll<0||payload.scroll>10000000)bad();
    if(payload.distroId!==undefined&&!/^[a-f0-9]{16}$/.test(payload.distroId))bad();return {...payload};
  }
  if(['checkPreparation','prepareWSL'].includes(method)){
    if(!plain(payload)||Object.keys(payload).some(k=>!['templateId','distroId'].includes(k))||!['F1','F2','B1','S1','S2','I1'].includes(payload.templateId))bad();
    if(payload.distroId!==undefined&&!/^[a-f0-9]{16}$/.test(payload.distroId))bad();return {...payload};
  }
  if(method==='exportDiagnostic'){if(!plain(payload)||Object.keys(payload).length!==1||typeof payload.text!=='string'||payload.text.length>65536)bad();return {...payload};}
  if (['getTemplates', 'chooseParentDirectory', 'openInVSCode'].includes(method)) { if (payload !== undefined) bad(); return; }
  if (method === 'plan') {
    // null only invalidates the existing preview; it never creates a new plan.
    if (payload === null) return null;
    if (!plain(payload) || Object.keys(payload).some(k => !['templateId','parent','folder','name','port','dbBase'].includes(k))) bad();
    for (const key of ['templateId','parent','folder']) if (typeof payload[key] !== 'string' || !payload[key] || payload[key].length > 4096 || /[\x00-\x1f\x7f]/.test(payload[key])) bad();
    if (!['F1','F2','B1','S1','S2','I1'].includes(payload.templateId)) bad();
    if (payload.name !== undefined && (typeof payload.name !== 'string' || !/^[a-z][a-z0-9-]{0,24}$/.test(payload.name))) bad();
    for (const key of ['port','dbBase']) if (payload[key] !== undefined && (!Number.isInteger(payload[key]) || payload[key] < 1024 || payload[key] > (key === 'dbBase' ? 65532 : 65535))) bad();
    if (payload.dbBase !== undefined && payload.templateId !== 'S2') bad();
    return { ...payload };
  }
  if (!plain(payload) || Object.keys(payload).length !== 1 || typeof payload.planId !== 'string' || !/^[a-f0-9]{64}$/.test(payload.planId)) bad();
  return { planId: payload.planId };
}
export function publicFailure(error) {
  return { ok: false, error: typeof error?.code === 'string' && error.nextAction
    ? { code: error.code, message: error.message, nextAction: error.nextAction, details: error.details ?? {} }
    : { code: 'INTERNAL_ERROR', message: '処理を完了できませんでした。', nextAction: '入力と保存先を確認して再試行してください。', details: {} } };
}
