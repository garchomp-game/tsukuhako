import { commandText } from '../core/next-steps.mjs';

export function planText(plan) {
  return [`構成: ${plan.request.templateId} / 版 ${plan.templateVersion}`, `保存先: ${plan.destination}`, `識別名: ${plan.projectName}`,
    `ポート: ${Object.entries(plan.ports).map(([name, port]) => `${name}=${port}`).join(' / ')}`,
    `ファイル: ${plan.files.length}件（サンプル・教材・テスト・CI設定、.env、START_HERE.md）`,
    'まだファイルは書き込んでいません。', `planId: ${plan.planId}`].join('\n');
}
export function diagnosticText(report) {
  const label = value => value === true ? '確認済み' : value === false ? '準備不足' : '未確認あり';
  return [`生成準備: ${label(report.generationReady)}`, `起動準備: ${label(report.runtimeReady)}`,
    ...report.checks.map(check => `[${check.status}] ${check.message}`),
    ...(report.generationReady === true && report.runtimeReady !== true ? ['ファイルは作成できます。起動する前に、Dockerなどの準備が必要です。'] : [])].join('\n');
}
export function resultText(result, steps) {
  return ['ファイルを作成しました。次は、作成先のSTART_HERE.mdを開いてください。', `保存先: ${result.destination}`, `最初に読む: ${result.startHere}`,
    ...steps.map(step => `[${{ host: 'ホスト', container: 'コンテナ内', editor: 'VS Code' }[step.location]} ${step.title}${step.command ? '\n  ' + commandText(step.command) : step.url ? '\n  ' + step.url : step.document ? '\n  ' + step.document : ''}`)].join('\n');
}
