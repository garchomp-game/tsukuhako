import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import { pathToFileURL } from 'node:url';
const root = process.argv[2]; // Set by main, never by renderer.
const core = name => import(pathToFileURL(path.join(root, 'generator/src/core', name + '.mjs')).href);
const [{ getTemplates }, { destinationFromParts }, { planGeneration }, { applyGeneration }, { diagnoseHost, probePort }, { publicError, readRegular }, { startHere }] = await Promise.all(
  ['catalog','configuration','plan','apply','diagnostics','common','next-steps'].map(core));
let current, publicId;
const execution={os:process.platform,arch:process.arch,user:os.userInfo().username,helperVersion:'0.4.4'};
const stale = () => Object.assign(new Error('確認した内容が現在の状態と一致しません。'), { code: 'PLAN_STALE', nextAction: '保存先の入力へ戻り、内容を確認し直してください。', details: {} });
process.parentPort.on('message', async ({ data }) => {
  const { id, method, payload } = data;
  try {
    let value;
    if (method === 'reset') { current = undefined; value = null; }
    else if (method === 'getTemplates') value = getTemplates(root);
    else if (method === 'plan') {
      current = undefined;
      const { parent, folder, ...rest } = payload;
      current = planGeneration(root, { ...rest, destination: destinationFromParts(parent, folder) });
      publicId=createHash('sha256').update(JSON.stringify({planId:current.planId,execution})).digest('hex');value = {...current,planId:publicId,execution};
    } else if (method === 'diagnose') {
      if (!current || publicId !== payload.planId) throw stale();
      value = await diagnoseHost(root, current.request, {scope:'generation'});
      for(const [name,port] of Object.entries(current.ports)){const available=await probePort(port);value.checks.push({id:'port-'+name,scope:'runtime',status:available?'PASS':'FAIL',message:name+' '+port+': '+(available?'現在は利用可能（予約なし）':'使用中または確認不可'),nextAction:available?undefined:'詳細設定で別の未使用ポートを選んでください。'});}
    } else if (method === 'apply') {
      if (!current || publicId !== payload.planId) throw stale();
      const plan = current; current = undefined;
      value = { ...applyGeneration(root, plan), nextSteps: plan.nextSteps, guide: startHere(plan) };
      try { value.readmeText = readRegular(path.join(plan.destination, 'README.md'), 1024 * 1024).toString('utf8'); }
      catch { value.readmeText = 'README.mdをアプリ内で読み込めませんでした。作成先のファイルを確認してください。'; }
    } else throw stale();
    process.parentPort.postMessage({ id, ok: true, value });
  } catch (error) {
    process.parentPort.postMessage({ id, ok: false, error: error.code === 'PLAN_STALE' && error.nextAction ? { code: error.code, message: error.message, nextAction: error.nextAction, details: error.details } : publicError(error) });
  }
});
