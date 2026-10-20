import { createInterface } from 'node:readline/promises';
import { getTemplates } from '../core/catalog.mjs';
import { destinationFromParts } from '../core/configuration.mjs';
import { planGeneration } from '../core/plan.mjs';
import { applyGeneration } from '../core/apply.mjs';
import { diagnoseHost } from '../core/diagnostics.mjs';
import { publicError } from '../core/common.mjs';
import { planText, diagnosticText, resultText } from './display.mjs';

export async function runWizard(root, { input = process.stdin, output = process.stdout, diagnose = diagnoseHost } = {}) {
  if (!input.isTTY || !output.isTTY) {
    output.write('wizardは対話ターミナルで使ってください。非TTYでは質問待ちをしません。\n例: node generator/cli.mjs create F2 /absolute/path/new-project\n');
    return 1;
  }
  const data = getTemplates(root), state = { goal: 'screen', template: 'F2', parent: process.cwd(), child: 'my-app', advanced: 'n', name: '' };
  let interrupted = false, generating = false, closed = false;
  const rl = createInterface({ input, output, terminal: true });
  const ended = new Promise(resolve => rl.once('close', () => { closed = true; resolve(null); }));
  const interrupt = () => { if (!generating) { interrupted = true; rl.close(); } };
  rl.on('SIGINT', interrupt); process.on('SIGINT', interrupt);
  const ask = async prompt => closed ? null : Promise.race([rl.question(prompt).catch(() => null), ended]);
  const write = text => output.write(text + '\n');
  const template = () => data.templates.find(t => t.id === state.template);
  const goalChoice = () => data.goals.findIndex(g => g.id === state.goal) + 1;
  const screenTemplates = data.goals.find(g => g.id === 'screen').templates;
  const screenChoice = () => screenTemplates.indexOf(state.template) + 1;
  const fields = [
    { key: 'goal',
      prompt: () => 'まず何を作りますか？\n' + data.goals.map((g, i) => `${i + 1}. ${g.title} — ${g.summary}`).join('\n') + `\n用途 [${goalChoice()}]: `,
      parse: v => {
        const g = data.goals[Number(v || goalChoice()) - 1];
        if (!g) throw new Error('1〜5で選んでください。');
        // Keep a compatible choice when revisiting the same purpose.
        if (!g.templates.includes(state.template)) state.template = g.templates[0];
        return g.id;
      } },
    { key: 'template', when: () => state.goal === 'screen',
      prompt: () => `1. Next.js (F2) / 2. React + Vite (F1)\n画面の構成 [${screenChoice()}]: `,
      parse: v => {
        const choice = v || String(screenChoice());
        if (!['1', '2'].includes(choice)) throw new Error('1か2で選んでください。');
        return screenTemplates[Number(choice) - 1];
      } },
    { key: 'parent', prompt: () => `親フォルダ [${state.parent}]: `, parse: v => v || state.parent },
    { key: 'child', prompt: () => `新しいフォルダ名 [${state.child}]: `, parse: v => { destinationFromParts(state.parent, v || state.child); return v || state.child; } },
    { key: 'advanced', prompt: () => `識別ラベル・ポートを変更しますか？ [${state.advanced === 'y' ? 'Y/n' : 'y/N'}]: `, parse: v => { if (!['', 'y', 'n'].includes(v.toLowerCase())) throw new Error('yかnで入力してください。'); return v.toLowerCase() || state.advanced; } },
    { key: 'name', when: () => state.advanced === 'y', prompt: () => `識別ラベル（省略可） [${state.name}]: `, parse: v => v || state.name },
    { key: 'port', when: () => state.advanced === 'y', prompt: () => `ホストポート [${state.port ?? template().defaultPort}]: `, parse: v => v || state.port || template().defaultPort },
    { key: 'dbBase', when: () => state.advanced === 'y' && state.template === 'S2', prompt: () => `DB開始ポート [${state.dbBase ?? template().dbBase}]: `, parse: v => v || state.dbBase || template().dbBase },
  ];
  write('ツクハコ — 新しいプロジェクトを作成します\n各入力で :back（戻る）、:cancel（中止）が使えます。');
  let index = 0;
  try {
    while (true) {
      if (index < fields.length) {
        const field = fields[index];
        if (field.when && !field.when()) { index++; continue; }
        const answer = await ask(field.prompt());
        if (answer === null || answer === ':cancel') { write('生成前に中止しました。ファイルは作成していません。'); return interrupted ? 130 : 0; }
        if (answer === ':back') { do { index = Math.max(0, index - 1); } while (index && fields[index].when && !fields[index].when()); continue; }
        try { state[field.key] = field.parse(answer); index++; } catch (error) { write(error.message); }
        continue;
      }
      let plan;
      try {
        const request = { templateId: state.template, destination: destinationFromParts(state.parent, state.child),
          ...(state.advanced === 'y' ? { name: state.name, ...(state.port === undefined ? {} : { port: state.port }), ...(state.template === 'S2' && state.dbBase !== undefined ? { dbBase: state.dbBase } : {}) } : {}) };
        plan = planGeneration(root, request);
        write('\n' + planText(plan));
        const diagnostics = await diagnose(root, request);
        write(diagnosticText(diagnostics));
        if (diagnostics.generationReady !== true) { write('生成準備を確認してから再試行してください。'); index = 2; continue; }
      } catch (error) { const detail = publicError(error); write(`${detail.message}\n${detail.nextAction}`); index = error.code === 'INVALID_OPTIONS' ? 4 : 2; continue; }
      const answer = await ask('この内容で作成しますか？ [y / :back / :cancel]: ');
      if (answer === null || answer === ':cancel' || answer.toLowerCase() === 'n') { write('生成前に中止しました。ファイルは作成していません。'); return interrupted ? 130 : 0; }
      if (answer === ':back') { index = 2; continue; }
      if (answer.toLowerCase() !== 'y') continue;
      generating = true;
      try {
        const result = applyGeneration(root, plan);
        write(resultText(result, plan.nextSteps)); return 0;
      } catch (error) {
        const detail = publicError(error); write(`${detail.code}: ${detail.message}\n${detail.nextAction}`);
        if (detail.details.preserved) write(detail.details.preserved.join('\n'));
        if (error.code === 'PLAN_STALE') { index = 2; continue; }
        return error.exitCode ?? 2;
      } finally { generating = false; }
    }
  } finally { process.removeListener('SIGINT', interrupt); rl.close(); }
}
