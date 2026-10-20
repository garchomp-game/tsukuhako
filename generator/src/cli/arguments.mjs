import { fail } from '../core/common.mjs';
export function parseArgs(argv) {
  const [command, ...rest] = argv;
  const positional = [], options = {};
  for (let i = 0; i < rest.length; i++) {
    const token = rest[i];
    if (token === '--') { positional.push(...rest.slice(i + 1)); break; }
    if (!token.startsWith('--')) { positional.push(token); continue; }
    const key = { '--name': 'name', '--port': 'port', '--db-base': 'dbBase', '--expect-plan': 'expectPlan', '--scope': 'scope', '--json': 'json' }[token];
    if (!key || Object.hasOwn(options, key)) fail('INVALID_OPTIONS', '不明または重複したオプションです。', '--helpで使い方を確認してください。');
    if (key === 'json') options[key] = true;
    else {
      if (rest[i + 1] === undefined || rest[i + 1].startsWith('--')) fail('INVALID_OPTIONS', `${token}の値がありません。`, 'オプションの値を指定してください。');
      options[key] = rest[++i];
    }
  }
  const allowed = { list: ['json'], doctor: ['json', 'scope', 'name', 'port', 'dbBase'], plan: ['json', 'name', 'port', 'dbBase'], create: ['json', 'name', 'port', 'dbBase', 'expectPlan'], wizard: [], '--help': [], help: [] };
  if (!allowed[command] || Object.keys(options).some(key => !allowed[command].includes(key)) ||
      (['plan', 'create'].includes(command) ? positional.length !== 2 : command === 'doctor' ? ![0, 2].includes(positional.length) : positional.length !== 0) ||
      (options.scope && !['all', 'generation'].includes(options.scope))) fail('INVALID_OPTIONS', 'コマンドと引数の組合せを確認してください。', '--helpで使い方を確認してください。');
  const request = positional.length ? { templateId: positional[0], destination: positional[1],
    ...Object.fromEntries(['name', 'port', 'dbBase'].filter(key => options[key] !== undefined).map(key => [key, options[key]])) } : undefined;
  return { command, request, options };
}
