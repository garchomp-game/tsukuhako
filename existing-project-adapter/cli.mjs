#!/usr/bin/env node
import fs from 'node:fs';
import { AdapterError, inspect, recommend, preview, savePlan, applyPlan, undo } from './src/adapter.mjs';

const [command, project, ...args] = process.argv.slice(2);
const usage = 'node cli.mjs inspect|recommend PROJECT\nnode cli.mjs preview PROJECT --out PLAN.json [--port 3000]\nnode cli.mjs apply PROJECT --plan PLAN.json\nnode cli.mjs undo PROJECT';
try {
  if (!project || !['inspect', 'recommend', 'preview', 'apply', 'undo'].includes(command)) throw new AdapterError('USAGE', usage);
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!['--out', '--port', '--plan'].includes(args[i]) || args[i + 1] === undefined || Object.hasOwn(options, args[i])) throw new AdapterError('OPTION', '不明・重複・値のないオプションです。force等の迂回オプションはありません。');
    options[args[i]] = args[i + 1];
  }
  let result;
  if (command === 'inspect' || command === 'recommend') {
    if (args.length) throw new AdapterError('OPTION', '読み取り判定にオプションはありません。');
    result = command === 'inspect' ? inspect(project) : recommend(project);
  } else if (command === 'preview') {
    if (options['--plan']) throw new AdapterError('OPTION', 'previewで--planは使いません。');
    result = preview(project, { port: options['--port'] === undefined ? 3000 : Number(options['--port']) });
    if (options['--out']) { const saved = savePlan(result, options['--out']); result = { status: 'previewed', saved, planId: result.planId, files: result.files, lifecycle: result.lifecycle, runtime: result.runtime }; }
  } else if (command === 'apply') {
    if (!options['--plan'] || options['--out'] || options['--port']) throw new AdapterError('OPTION', 'applyは--planのみを指定します。');
    const stat = fs.lstatSync(options['--plan']);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 1024 * 1024) throw new AdapterError('UNSAFE_PLAN', '提案は1MiB以下の通常ファイルを指定してください。');
    result = applyPlan(project, JSON.parse(fs.readFileSync(options['--plan'], 'utf8')));
  } else {
    if (args.length) throw new AdapterError('OPTION', 'undoにforce等のオプションはありません。');
    result = undo(project);
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${JSON.stringify({ status: 'error', code: error.code ?? 'ERROR', message: error instanceof AdapterError ? error.message : '処理できませんでした。入力JSON・パス・書込権限を確認してください。', details: error instanceof AdapterError ? error.details : {} }, null, 2)}\n`);
  process.exitCode = 1;
}
