export const quoteArg = value => `'${String(value).replaceAll("'", "'\\''")}'`;
export const commandText = command => [command.executable, ...command.args].map(quoteArg).join(' ');

// These are the first exercises already shipped with each template.
export function firstExercise(id) {
  return {
    F1: {file:'src/App.tsx', before:'表示することば', after:'今日のことば', lesson:'docs/EXERCISES.md', section:'第1項', route:'/', result:'入力ラベルが「今日のことば」に変わります。', change:'入力ラベル「表示することば」を「今日のことば」に変えて保存します。', restore:'入力ラベルを「表示することば」に戻して保存します。'},
    F2: {file:'app/page.tsx', before:'小さく変えて、<br />動きを確かめよう。', after:'わたしの練習室', lesson:'docs/EXERCISES.md', section:'第1項', route:'/', result:'トップページの大きな見出しが「わたしの練習室」に変わります。', change:'h1の中の「小さく変えて、<br />動きを確かめよう。」を「わたしの練習室」に変えて保存します。h1タグとclassNameは残します。', restore:'h1の中を「小さく変えて、<br />動きを確かめよう。」へ戻して保存します。'},
    B1: {file:'app/api/health/route.ts', before:'{ status: "ok" }', after:'{ status: "ok", lesson: "preview" }', lesson:'docs/EXERCISES.md', section:'第1項', route:'/api/health', result:'JSONに lesson: "preview" が増えます。', change:'Response.jsonの { status: "ok" } を { status: "ok", lesson: "preview" } に変えて保存します。この一時変更中は、元の応答を要求する既存の契約テストが失敗します。初回は応答を元へ戻すところまで行います。', restore:'追加した lesson: "preview" を削除し、{ status: "ok" } へ戻して保存します。再取得して元のJSONを確認します。'},
    S1: {file:'app/practice/page.tsx', before:'ことばを送ってみる', after:'今日の便り', lesson:'docs/EXERCISES.md', section:'第1項', route:'/practice', result:'/practiceの見出しが「今日の便り」に変わります。', change:'見出し「ことばを送ってみる」を「今日の便り」に変えて保存します。', restore:'見出しを「ことばを送ってみる」に戻して保存します。'},
    S2: {file:'app/page.tsx', before:'ローカル学習メモ', after:'わたしの学習メモ', lesson:'docs/EXERCISES.md', section:'第1項', route:'/', result:'トップページの見出しが「わたしの学習メモ」に変わります。', change:'見出し「ローカル学習メモ」を「わたしの学習メモ」に変えて保存します。', restore:'見出しを「ローカル学習メモ」に戻して保存します。メモやDBを削除する必要はありません。'},
    I1: {file:'sql/practice.sql', before:'SQLの練習', after:'在庫を調べる', lesson:'docs/learning.md', section:'演習1', result:'再実行するとlesson列が「在庫を調べる」に変わります。', change:'SELECTの「SQLの練習」を「在庫を調べる」に変えて保存します。保存だけでは結果は変わりません。', restore:'文字列を「SQLの練習」に戻し、保存してから同じSQLコマンドを再実行します。'},
  }[id];
}
export function nextSteps(id, ports) {
  const steps = [];
  const cmd = (title, location, executable, args) => steps.push({ title, location, cwd: location === 'container' ? '/workspace' : 'destination', command: { executable, args } });
  cmd('準備と、このプロジェクトの設定を確認する', 'host', 'bash', [id === 'I1' ? 'scripts/doctor.sh' : 'scripts/doctor-host.sh']);
  Object.assign(steps[0], {document:id === 'I1' ? 'README.md' : 'docs/SETUP.md', expected:id === 'I1' ? 'PASS: Docker / Compose / 設定 が表示されます。' : '診断OK と、このプロジェクトのURLが表示されます。', detail:'不足があれば、次の準備手順を確認してください。生成済みの.envを最初から作り直す必要はありません。'});
  if (id === 'S2') cmd('ローカルDBを起動する（初回はネット接続が必要）', 'host', 'bash', ['scripts/db.sh', 'start']);
  steps.push({ title:'VS Codeでフォルダを開き、Dev Containers: Reopen in Containerを実行する', location:'editor', cwd:'destination', detail:'生成完了画面の「VS Codeで開く」を押します。VS CodeでCtrl+Shift+P（macOSはCmd+Shift+P）を押し、Dev Containers: Reopen in Containerを検索して選びます。自身が生成したフォルダを確認して信頼します。初回のイメージ・依存取得を待ちます。', expected:'VS Code左下にDev Containerへの接続が表示され、/workspaceのファイルが開きます。' });
  if (id === 'I1') {
    cmd('migrationとサンプルデータを準備する', 'container', 'bash', ['scripts/db.sh', 'setup']);
    cmd('SQLの主要操作を確認する', 'container', 'bash', ['scripts/db.sh', 'check']);
    cmd('変更前の結果を確認する', 'container', 'bash', ['scripts/db.sh', 'query', 'sql/practice.sql']);
  } else {
    cmd('開発サーバーを起動する', 'container', 'npm', ['run', 'dev']);
    steps.at(-1).detail = 'Dev Containerへの接続後、VS Codeの「ターミナル」→「新しいターミナル」で実行します。pwd が /workspace であることを確認します。このターミナルを起動したまま、次の確認・編集へ進みます。';
    steps.at(-1).expected = id === 'F1' ? 'VITE と Local のURLが表示されます。ブラウザでは下記のホスト側URLを使います。' : 'Ready が表示されます。ブラウザでは下記のホスト側URLを使います。';
    if (id === 'B1') cmd('変更前のJSONを確認する', 'host', 'curl', ['-i', `http://localhost:${ports.app}/api/health`]);
    else steps.push({ title:'変更前の画面を確認する', location:'host', cwd:'destination', url:`http://localhost:${ports.app}${firstExercise(id).route}` });
  }
  const exercise = firstExercise(id);
  const recovery = id === 'I1' ? 'docs/recovery.md' : 'docs/RECOVERY.md';
  steps.push({title:'一か所変える', location:'editor', cwd:'destination', document:exercise.file, detail:exercise.change});
  const verify = id === 'I1'
    ? {location:'container', cwd:'/workspace', command:{executable:'bash',args:['scripts/db.sh','query','sql/practice.sql']}}
    : id === 'B1' ? {location:'host', cwd:'destination', command:{executable:'curl',args:['-i',`http://localhost:${ports.app}/api/health`]}}
      : {location:'host', cwd:'destination', url:`http://localhost:${ports.app}${exercise.route}`};
  steps.push({title:'変化を自分で確認する', ...verify, detail:exercise.result + (id === 'I1' ? ' 保存後は必ず再実行してください。' : ' 開発サーバーを動かしたまま確かめます。') + ' 反映されない場合は復旧手順へ進みます。', document:recovery});
  steps.push({title:'元へ戻して、もう一度確認する', ...verify, detail:exercise.restore});
  steps.push({title:`次の教材へ進む（最初の変更は${exercise.section}）`, location:'editor', cwd:'destination', document:exercise.lesson, detail:'できたところを確認してから、次の練習を選びましょう。'});
  const documents = id === 'I1'
    ? [['全体の使い方','README.md'],['停止・復旧','docs/recovery.md']]
    : [['全体の使い方','README.md'],['空から組み立てる','docs/BUILD-YOUR-OWN.md'],['停止・復旧','docs/RECOVERY.md']];
  steps.push(...documents.map(([title,document]) => ({title, location:'host', cwd:'destination', document})));
  return steps;
}
export function startHere(plan) {
  const labels = {host:'開発ホストのターミナル（Windowsは選択したWSL内。PowerShellでは実行しません）', container:'VS CodeのDev Container内ターミナル', editor:'VS Codeの編集画面'};
  let text = `# ${plan.request.templateId}：最初の一歩\n\nプロジェクトのファイルができました。コンテナはまだ起動していません。\n起動して、一か所変えた結果を自分で確かめ、元へ戻すところまで進めましょう。\n\n## このプロジェクトの設定\n\n- 構成：${plan.request.templateId} / 版 ${plan.templateVersion}\n- 識別名：${plan.projectName}\n- ポート：${Object.entries(plan.ports).map(([key,value]) => `${key}=${value}`).join(' / ')}\n- .envは作成済みです。READMEの既定ポートと異なる場合は上の設定を使います。\n\n保存先：\n\n    ${plan.destination}\n\n生成時のネット接続は不要です。初回起動でイメージや依存を取得する際はネット接続が必要です。\n\n## 最初に作業フォルダを開く\n\n開発ホストのターミナル（Windowsは選択したWSL内、Linux/macOSはそのOSのターミナル）で次をコピーして実行します。\n\n\`\`\`sh\ncd -- ${quoteArg(plan.destination)}\n\`\`\`\n\npwd で上の保存先が表示されれば準備完了です。以降のホスト用コマンドはここで実行します。\n\n[開発準備](${plan.request.templateId==='I1'?'docs/setup.md':'docs/SETUP.md'})に不足がある場合は、先にその手順を確認します。\n\n## 起動して、最初の変更を試す\n\n`;
  for (const [index,step] of plan.nextSteps.entries()) {
    text += `### ${index + 1}. ${step.title}\n\n場所：${step.url ? 'OSのブラウザのアドレス欄' : labels[step.location]}。${step.url ? '下記URLを開きます。' : (step.cwd === 'destination' ? 'このプロジェクトのフォルダ' : '/workspace')+'で行います。'}\n\n`;
    if (step.detail) text += step.detail.replaceAll('<br />','`<br />`') + '\n\n';
    if (step.command) text += `\x60\x60\x60sh\n${commandText(step.command)}\n\x60\x60\x60\n\n`;
    if (step.url) text += `ブラウザのアドレス欄：\`${step.url}\`\n\n`;
    if (step.expected) text += `確認できる結果：${step.expected}\n\n`;
    if (step.document) text += `[${step.document}](${step.document})\n\n`;
  }
  return text + `## うまく進まないとき・次の学び\n\n[停止・復旧](${plan.request.templateId === 'I1' ? 'docs/recovery.md' : 'docs/RECOVERY.md'})で今の操作に合う項目を確認します。アプリの「作る画面へ戻る」で生成結果へ戻れます。再起動後は、VS Codeでこの START_HERE.md を開いて再開してください。\n\n変更前・変更後・復元後を確認できたら、最初の一歩は完了です。「空から組み立てる」は仕組みを学びながら自作する次の教材です。\n\n` + '生成前の診断はその時点の観察です。ポートや起動成功の保証ではありません。秘密値は.envだけに保存し、この案内には載せません。\n';
}
