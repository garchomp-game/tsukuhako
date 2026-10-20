#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERSION, fail, publicError } from './src/core/common.mjs';
import { getTemplates } from './src/core/catalog.mjs';
import { planGeneration } from './src/core/plan.mjs';
import { applyGeneration } from './src/core/apply.mjs';
import { diagnoseHost } from './src/core/diagnostics.mjs';
import { parseArgs } from './src/cli/arguments.mjs';
import { runWizard } from './src/cli/wizard.mjs';
import { planText, diagnosticText, resultText } from './src/cli/display.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const help = `ツクハコ generator ${VERSION}
node generator/cli.mjs list [--json]
node generator/cli.mjs doctor [ID 保存先] [--scope generation] [--json]
node generator/cli.mjs wizard
node generator/cli.mjs plan ID 新しい保存先 [--name ラベル] [--port 番号] [--db-base 番号] [--json]
node generator/cli.mjs create ID 新しい保存先 [同上] [--expect-plan planId] [--json]
生成はファイルの作成のみです。起動・依存の取得は生成後に行います。`;
const argv = process.argv.slice(2);
const json = argv.includes('--json');
try {
  const { command, request, options } = parseArgs(argv.length ? argv : ['--help']);
  if (command === '--help' || command === 'help') console.log(help);
  else if (command === 'wizard') process.exitCode = await runWizard(root);
  else if (command === 'list') {
    const result = { schemaVersion: 1, generatorVersion: VERSION, ...getTemplates(root) };
    console.log(json ? JSON.stringify(result) : result.templates.map(t => `${t.id}\t${t.name}\t${t.eligible ? '新規作成可' : '参考資料のみ'}\t${t.summary}`).join('\n'));
  } else if (command === 'doctor') {
    const report = await diagnoseHost(root, request, { scope: options.scope ?? 'all' });
    console.log(json ? JSON.stringify(report) : diagnosticText(report));
    process.exitCode = report.checks.some(c => c.status === 'FAIL') ? 1 : 0;
  } else {
    const plan = planGeneration(root, request);
    if (command === 'plan') console.log(json ? JSON.stringify(plan) : planText(plan));
    else {
      if (options.expectPlan !== undefined && options.expectPlan !== plan.planId) fail('PLAN_STALE', '指定したplanIdと現在の条件が一致しません。', 'planを作り直して内容を確認してください。');
      const result = applyGeneration(root, plan);
      console.log(json ? JSON.stringify(result) : resultText(result, plan.nextSteps));
    }
  }
} catch (error) {
  const detail = publicError(error);
  if (json) console.log(JSON.stringify({ status: 'error', error: detail }));
  else console.error(`${detail.code}: ${detail.message}\n${detail.nextAction}${detail.details.preserved ? '\n' + detail.details.preserved.join('\n') : ''}`);
  process.exitCode = error.exitCode ?? 2;
}
