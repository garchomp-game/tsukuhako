import { presentationFor } from './presentation.mjs';

export const quoteArg = value => `'${String(value).replaceAll("'", "'\\''")}'`;
export const commandText = command => [command.executable, ...command.args].map(quoteArg).join(' ');

// Keep these unnumbered headings stable: saved Markdown and the Reader use the same anchors.
export const GUIDE_HEADINGS = Object.freeze({
  prepare: '準備を確認する', open: 'VS Codeでフォルダーを開く', connect: 'コンテナーで開く',
  initialize: '初期処理の正常終了を待つ', server: '開発サーバーを起動する', verify: 'サンプルの動作を確認する',
  complete: '初回完了', optional: '任意の練習', stop: '終了する', resume: '同じフォルダーから再開する',
  missingPreparation: '準備が足りないとき', docker: 'Dockerにつながらないとき',
  initialization: '初期処理が終わらないとき', result: 'サンプルを確認できないとき',
});
export const GUIDE_ANCHORS = Object.freeze(Object.fromEntries(Object.entries(GUIDE_HEADINGS).map(([key, title]) =>
  [key, title.toLowerCase().trim().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s+/g, '-')])));
const link = (key, label = GUIDE_HEADINGS[key]) => `[${label}](#${GUIDE_ANCHORS[key]})`;
const recoveryFor = id => id === 'I1' ? 'docs/recovery.md' : 'docs/RECOVERY.md';
const setupFor = id => id === 'I1' ? 'docs/setup.md' : 'docs/SETUP.md';
const platformFor = platform => platform === 'win32' ? 'win32' : platform === 'darwin' ? 'darwin' : 'linux';
const headingAnchor = title => title.toLowerCase().trim().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s+/g, '-');
// A path can legally contain backticks. A longer fence keeps the copied shell command intact.
function codeBlock(value, language = 'sh') {
  const length = Math.max(3, ...[...String(value).matchAll(/`+/g)].map(match => match[0].length + 1));
  const fence = '`'.repeat(length);
  return `${fence}${language}\n${value}\n${fence}\n\n`;
}

// These are the first exercises already shipped with each template.
export function firstExercise(id) {
  return {
    F1: {file:'src/App.tsx', before:'表示することば', after:'今日のことば', lesson:'docs/EXERCISES.md', section:'第1項', route:'/', result:'入力ラベルが「今日のことば」に変わります。', change:'入力ラベル「表示することば」を「今日のことば」に変えて保存します。', restore:'入力ラベルを「表示することば」に戻して保存します。'},
    F2: {file:'app/page.tsx', before:'小さく変えて、<br />動きを確かめよう。', after:'わたしの練習室', lesson:'docs/EXERCISES.md', section:'第1項', route:'/', result:'トップページの大きな見出しが「わたしの練習室」に変わります。', change:'h1の中の「小さく変えて、<br />動きを確かめよう。」を「わたしの練習室」に変えて保存します。h1タグとclassNameは残します。', restore:'h1の中を「小さく変えて、<br />動きを確かめよう。」へ戻して保存します。'},
    B1: {file:'app/api/health/route.ts', before:'{ status: "ok" }', after:'{ status: "ok", lesson: "preview" }', lesson:'docs/EXERCISES.md', section:'第1項', route:'/api/health', result:'JSONに lesson: "preview" が増えます。', change:'Response.jsonの { status: "ok" } を { status: "ok", lesson: "preview" } に変えて保存します。この一時変更中は、元の応答を要求する既存の契約テストが失敗します。練習が終わったら応答を元へ戻します。', restore:'追加した lesson: "preview" を削除し、{ status: "ok" } へ戻して保存します。'},
    S1: {file:'app/practice/page.tsx', before:'ことばを送ってみる', after:'今日の便り', lesson:'docs/EXERCISES.md', section:'第1項', route:'/practice', result:'/practiceの見出しが「今日の便り」に変わります。', change:'見出し「ことばを送ってみる」を「今日の便り」に変えて保存します。', restore:'見出しを「ことばを送ってみる」に戻して保存します。'},
    S2: {file:'app/page.tsx', before:'ローカル学習メモ', after:'わたしの学習メモ', lesson:'docs/EXERCISES.md', section:'第1項', route:'/', result:'トップページの見出しが「わたしの学習メモ」に変わります。', change:'見出し「ローカル学習メモ」を「わたしの学習メモ」に変えて保存します。', restore:'見出しを「ローカル学習メモ」に戻して保存します。メモやDBを削除する必要はありません。'},
    I1: {file:'sql/practice.sql', before:'SQLの練習', after:'在庫を調べる', lesson:'docs/learning.md', section:'演習1', result:'再実行するとlesson列が「在庫を調べる」に変わります。', change:'SELECTの「SQLの練習」を「在庫を調べる」に変えて保存します。保存だけでは結果は変わりません。', restore:'文字列を「SQLの練習」に戻して保存します。'},
  }[id];
}
export function nextSteps(id, ports, {platform = process.platform} = {}) {
  const presentation = presentationFor(id), exercise = firstExercise(id);
  if (!exercise) throw new RangeError(`No generation guide: ${id}`);
  const os = platformFor(platform), shortcut = os === 'darwin' ? 'Cmd+Shift+P' : 'Ctrl+Shift+P';
  const steps = [];
  const add = (key, title, location, detail, extra = {}, phase = 'required') => steps.push({
    key, phase, title, location, cwd: location === 'container' ? '/workspace' : 'destination', detail, ...extra,
  });
  const cmd = (key, title, location, args, detail, expected) => add(key, title, location, detail, {command:{executable:'bash',args}, expected});
  cmd('prepare', GUIDE_HEADINGS.prepare, 'host', [id === 'I1' ? 'scripts/doctor.sh' : 'scripts/doctor-host.sh'],
    `下のコマンドで、このフォルダーの設定とDockerへの接続を確認します。.envと.devcontainerは生成済みです。作り直す必要はありません。不足がある場合は${link('missingPreparation')}、Dockerのエラーは${link('docker')}へ進み、対処後にこのコマンドをもう一度実行します。`,
    id === 'I1' ? 'PASS: Docker / Compose / 設定 が表示されます。これは設定の確認で、DB接続は後の手順で確認します。' : '診断OK と、このプロジェクトのURLが表示されます。これは起動前の確認で、サンプルはまだ動いていません。');
  if (id === 'S2') cmd('databaseStart', 'ローカルDBを起動する', 'host', ['scripts/db.sh','start'],
    '初回はネット接続が必要です。処理が終わるまで待ちます。ここで使うメモは、このPCでの学習用の架空の内容だけにします。', '準備完了 とAPI・Studioの接続先が表示され、コマンドが正常終了します。');
  const open = os === 'win32'
    ? 'Windows側のVS Codeで、生成に使ったWSLへ接続します。そのWSLのウィンドウで「ファイル」→「フォルダーを開く」（File → Open Folder）を選び、上のLinux側の保存先を開きます。別のWSLやWindows側のコピーは開きません。'
    : 'VS Codeを起動し、「ファイル」→「フォルダーを開く」（File → Open Folder）で、上の保存先を開きます。';
  add('open', GUIDE_HEADINGS.open, 'editor', open + ' 信頼の確認が出たら、保存先が自分で生成したフォルダーであることを確認して信頼します。「Restricted Mode」（制限モード）が表示される場合も、そのフォルダーだけを確認して信頼します。ローカル学習にVS Codeのサインインは不要です。',
    {expected:'VS Codeのエクスプローラーに、このフォルダーのSTART_HERE.mdとREADME.mdが表示されます。'});
  add('connect', GUIDE_HEADINGS.connect, 'editor',
    `未接続なら通知の「Reopen in Container」を選びます。通知がなければ${shortcut}でコマンドパレットを開き、「Dev Containers: Reopen in Container」を検索して選びます。このフォルダーのコンテナーに接続済みなら、開き直さず次へ進みます。初回はイメージの取得と環境の作成を待ちます。コマンドがない場合は${link('missingPreparation')}へ進みます。`,
    {expected:'VS Code左下にDev Containerへの接続が表示され、/workspaceのファイルが開きます。接続表示だけでは初期処理の完了ではありません。'});
  const initializationMarker = id === 'I1' ? '「PASS: otoka_learning / PostgreSQL」に続くバージョン' : '「準備完了」';
  add('initialize', GUIDE_HEADINGS.initialize, 'editor',
    `VS Codeの構成ターミナル（Configuring... など）を開き、本文の${initializationMarker}と、Doneの表示など初期処理がエラーなく正常終了したことの両方を確認します。接続バッジ・node_modulesの存在・タブ名だけでは判断しません。処理中は別のコマンドを重ねず、そのまま待ちます。進まない場合や失敗時は${link('initialization')}へ進みます。`,
    {expected:`構成ターミナルに${initializationMarker}が表示され、初期処理が正常終了しています。`});
  if (id === 'I1') {
    cmd('databaseSetup', 'サンプルデータを準備する', 'container', ['scripts/db.sh','setup'],
      'VS Codeの「ターミナル」→「新しいターミナル」で実行します。pwdが/workspaceであることを確認します。DBへの接続を確認し、テーブルとサンプルデータを用意します。',
      'PASS: otoka_learning / PostgreSQL に続くバージョンが表示され、エラーなくコマンドが終了します。');
    cmd('databaseCheck', 'SQLの主要操作を確認する', 'container', ['scripts/db.sh','check'],
      'サンプルDBで、SQLの操作と制約を確認します。試験用の変更はこのコマンド内で元へ戻します。',
      'PASS: SQL CRUD / 日本語・絵文字 / 制約 / rollback が表示されます。');
  } else {
    add('server', GUIDE_HEADINGS.server, 'container',
      `初期処理の正常終了を確認してから、VS Codeの「ターミナル」→「新しいターミナル」で実行します。pwdが/workspaceであることを確認します。このターミナルを動かしたまま、次へ進みます。next: not foundなどが出た場合は${link('initialization')}へ戻ります。`,
      {command:{executable:'npm',args:['run','dev']}, expected:id === 'F1' ? 'VITE と Local のURLが表示されます。次の確認には、この案内のURLを使います。' : 'Ready が表示されます。次の確認には、この案内のURLを使います。'});
  }
  const verify = id === 'I1'
    ? {location:'container', cwd:'/workspace', command:{executable:'bash',args:['scripts/db.sh','query','sql/practice.sql']}}
    : id === 'B1' ? {location:'host', cwd:'destination', command:{executable:'curl',args:['-i',`http://localhost:${ports.app}${presentation.route}`]}}
      : {location:'host', cwd:'destination', url:`http://localhost:${ports.app}${presentation.route}`};
  const firstAction = {
    F1:'下のURLをブラウザーのアドレス欄に入力します。',
    F2:'下のURLをブラウザーのアドレス欄に入力します。',
    B1:'開発サーバーを動かしたまま、下のコマンドでAPIの応答を取得します。',
    S1:'下のURLをブラウザーで開き、「送信することば」に「こんにちは」と入力して「プレビューを送信」を押します。',
    S2:'下のURLをブラウザーで開き、「本文」に架空のメモ「練習のメモ」と入力して「保存する」を押します。「保存しました」と一覧を確認したら、ブラウザーを再読み込みします。',
    I1:'下のコマンドで、用意したサンプルデータをSQLで検索します。',
  }[id];
  add('verify', GUIDE_HEADINGS.verify, verify.location, `${firstAction} 期待した結果にならない場合は${link('result')}へ進みます。`, {...verify, expected:presentation.success});
  add('change', '一か所変える', 'editor', exercise.change, {document:exercise.file}, 'optional');
  add('checkChange', '変化を自分で確認する', verify.location,
    exercise.result + (id === 'I1' ? ' 保存後は必ず再実行してください。' : ' 開発サーバーを動かしたまま確かめます。') + ` 反映されない場合は${link('result')}へ進みます。`, verify, 'optional');
  add('restore', '元の内容に戻して保存する', 'editor', exercise.restore, {document:exercise.file}, 'optional');
  add('checkRestore', '復元した結果を確認する', verify.location,
    id === 'I1' ? '上のSQLコマンドをもう一度実行し、lesson列が「SQLの練習」に戻ったことを確認します。' : id === 'B1' ? '上のcurlコマンドで再取得し、JSONが { status: "ok" } に戻り、lessonがないことを確認します。' : `開発サーバーを動かしたまま下記URLを開き、${id === 'F1' ? '入力ラベル' : '見出し'}が「${exercise.before.replaceAll('<br />','')}」に戻ったことを確認します。`, verify, 'optional');
  add('lesson', `練習の教材へ進む（最初の変更は${exercise.section}）`, 'editor', '続けたいときに、次の練習を選びます。', {document:exercise.lesson}, 'reference');
  const documents = [['readme','全体の使い方','README.md'], ...(id === 'I1' ? [] : [['build','空から組み立てる','docs/BUILD-YOUR-OWN.md']]), ['recovery','停止・復旧',recoveryFor(id)]];
  for (const [key,title,document] of documents) add(key, title, 'editor', '手動配置向けの設定手順も含む補助資料です。今回の生成済みフォルダーでは.envと.devcontainerを作り直さず、このSTART_HERE.mdを起点にします。', {document}, 'reference');
  const summaries = {
    prepare:'このフォルダーで設定とDockerを確認します。エラーがあれば、対処してから進みます。',
    databaseStart:'コンテナーで開き直す前に、ローカルDBを起動し、正常終了を待ちます。',
    open:(os === 'win32' ? '生成に使ったWSLへWindows側のVS Codeで接続し、今回の保存先を開きます。' : 'VS Codeで今回の保存先を開きます。') + '信頼の確認が出た場合は、このフォルダーだけを確認して信頼します。',
    connect:`未接続なら通知の「Reopen in Container」を選びます。通知がなければ${shortcut}から「Dev Containers: Reopen in Container」。このフォルダーのコンテナーに接続済みなら次へ進みます。`,
    initialize:`構成ターミナルの${initializationMarker}と、初期処理の正常終了を確認します。処理中・エラー時は次へ進みません。`,
    databaseSetup:'新しいターミナルでサンプルデータを準備します。pwdが/workspaceであることを確認します。',
    databaseCheck:'サンプルDBでSQLの主要操作を確認します。試験内の変更は元へ戻ります。',
    server:'初期処理が正常終了したら、新しいターミナルで実行します。pwdが/workspaceであることを確認し、起動したまま次へ進みます。',
    verify:firstAction,
  };
  for (const step of steps) if (step.phase === 'required') step.summary = summaries[step.key];
  return steps;
}

export function stepLocation(step, {platform = process.platform} = {}) {
  const os = platformFor(platform);
  const labels = {
    host: os === 'win32' ? '選択したWSLのターミナル（PowerShellでは実行しません）' : os === 'darwin' ? 'macOSのターミナル' : 'Linuxのターミナル',
    container:'VS CodeのDev Container内ターミナル', editor:'VS Codeの編集画面',
  };
  return step.url ? 'OSのブラウザーのアドレス欄。下記URLを開きます。' : `${labels[step.location]}。${step.cwd === 'destination' ? 'このプロジェクトのフォルダー' : '/workspace'}で行います。`;
}

function renderStep(step, options, level = 2, introduction = '') {
  let text = `${'#'.repeat(level)} ${step.title}\n\n場所：${stepLocation(step, options)}\n\n${introduction}`;
  if (step.detail) text += step.detail.replaceAll('<br />','`<br />`') + '\n\n';
  if (step.command) text += codeBlock(commandText(step.command));
  if (step.url) text += `ブラウザーのアドレス欄：\`${step.url}\`\n\n`;
  if (step.expected) text += `確認できる結果：${step.expected}\n\n`;
  if (step.document) text += `[${step.document}](${step.document})\n\n`;
  return text;
}

function connectionSummary(id, ports) {
  if (id === 'I1') return `DBの接続先：\`localhost:${ports.database}\`。SQLの操作は、下記のコンテナー内ターミナルで行います。\n\n`;
  const presentation = presentationFor(id);
  let text = `${id === 'B1' ? '起動後に確認するAPIのURL' : '起動後にブラウザーで開くURL'}：\`http://localhost:${ports.app}${presentation.route}\`\n\n`;
  if (ports.app !== 3000) text += `ターミナルに「3000」と表示されても正常です。${id === 'B1' ? 'PC側からのAPI確認には' : 'ブラウザーでは'}上のURLを使います。\n\n`;
  return text;
}

function platformNotice(os) {
  if (os === 'win32') return 'Windows 11と実WSLでの利用は実機未確認です。この案内のホスト用コマンドは、生成時に選択したWSLの通常ユーザーで実行します。\n\n';
  if (os === 'darwin') return 'macOSは今回の配布・実機確認の対象外です。この案内は後続対応の参考です。\n\n';
  return '';
}

function startupOverview(steps) {
  return '## まず行う操作\n\n' + steps.filter(step => step.phase === 'required')
    .map((step, i) => `${i + 1}. [${step.title}](#${headingAnchor(step.title)}) — ${step.summary}`).join('\n') + '\n\n';
}

// The compact UI renders the same required steps as the saved full guide. Links
// to recovery/stop/resume intentionally open the matching full-guide section.
export function quickStart(plan, {platform = process.platform, includeContext = true} = {}) {
  const id = plan.request.templateId, presentation = presentationFor(id), options = {platform};
  const steps = nextSteps(id, plan.ports, options).filter(step => step.phase === 'required');
  let text = `# ${presentation.name}：${presentation.firstGoal}\n\n必要な操作と確認結果だけを表示します。コンテナーとサンプルの起動は、これから行います。初回のイメージ・依存取得にはネット接続が必要です。\n\n`;
  if (includeContext) text += '## 今回のプロジェクト\n\n保存先：\n\n' + codeBlock(plan.destination, 'text') + connectionSummary(id, plan.ports);
  text += '.envと.devcontainerは生成済みです。作り直す必要はありません。\n\n' + platformNotice(platformFor(platform));
  for (const step of steps) {
    const introduction = step.key === 'prepare'
      ? 'まずこのプロジェクトへ移動し、pwdの結果が上の保存先と一致することを確認します。\n\n' + codeBlock(`cd -- ${quoteArg(plan.destination)}\npwd`)
      : '';
    text += renderStep({...step, detail:step.summary}, options, 2, introduction);
    text += `[詳しい確認方法](#${headingAnchor(step.title)})\n\n`;
  }
  return text + `## ${GUIDE_HEADINGS.complete}\n\n${presentation.success}\n\nこの結果を自分で確認できたら完了です。${link('stop')} / ${link('resume')} / ${link('missingPreparation','困ったとき')}\n`;
}

export function startHere(plan, {platform = process.platform} = {}) {
  const id = plan.request.templateId, presentation = presentationFor(id), options = {platform}, os = platformFor(platform);
  // Re-render the same trusted template/ports for the guide OS (the WSL helper itself runs on Linux).
  const steps = nextSteps(id, plan.ports, options);
  const hostLocation = stepLocation({location:'host',cwd:'destination'}, options);
  const cd = `cd -- ${quoteArg(plan.destination)}\npwd`;
  let text = `# ${presentation.name}：${presentation.firstGoal}\n\nプロジェクトのファイルができました。コンテナーはまだ起動していません。今回の到達点は「${presentation.firstGoal}」です。ソースの編集・復元は、そのあとに選べる${link('optional')}です。\n\n教材の閲覧とファイル生成はネット接続なしで行えます。初回起動のイメージ・依存取得にはネット接続が必要です。\n\n## 今回のプロジェクト\n\n保存先：\n\n` + codeBlock(plan.destination, 'text');
  text += `構成：${presentation.name}\n\n.envと.devcontainerは生成済みです。READMEの手動設定をやり直す必要はありません。\n\n`;
  text += connectionSummary(id, plan.ports) + platformNotice(os) + startupOverview(steps);
  for (const step of steps.filter(step => step.phase === 'required')) {
    if (step.key === 'prepare') {
      const introduction = 'まず次をコピーして実行し、このプロジェクトへ移動します。\n\n' + codeBlock(cd)
        + 'pwdの結果が上の保存先と一致すれば、作業する場所は正しく開けています。以降のホスト用コマンドも、このフォルダーで実行します。\n\n';
      text += renderStep(step, options, 2, introduction);
    } else text += renderStep(step, options);
  }
  text += `## ${GUIDE_HEADINGS.complete}\n\n${presentation.success}\n\n上の結果を自分で確認できたら、初回は完了です。ここで${link('stop','終了して構いません')}。変更・復元の練習は必須ではありません。続けたい場合だけ${link('optional')}へ進みます。\n\n`;
  text += `## ${GUIDE_HEADINGS.stop}\n\n`;
  if (id !== 'I1') text += '場所：開発サーバーを動かしているVS CodeのDev Container内ターミナル。Ctrl+Cでサーバーを止めます。コマンドを入力できる状態へ戻ったことを確認します。\n\n';
  text += `ファイルを保存して、このプロジェクトのVS Codeウィンドウを閉じます。次は${hostLocation}\n\n` + codeBlock(cd);
  const stopCommands = id === 'I1' ? [['scripts/project.sh','stop']] : id === 'S2' ? [['scripts/app.sh','stop'],['scripts/db.sh','stop']] : [['scripts/compose.sh','stop']];
  text += codeBlock(stopCommands.map(args => commandText({executable:'bash',args})).join('\n'));
  text += '各コマンドがエラーなく終了したことを確認します。これは通常の停止です。ソースやDBのデータを消す操作は行いません。\n\n';
  text += `## ${GUIDE_HEADINGS.resume}\n\n同じプロジェクトを生成し直さず、上の保存先を使います。次回も${link('open')}から既存フォルダーを開き、START_HERE.mdを開きます。VS Codeのプレビューはファイルを右クリックして「Open Preview」（プレビューを開く）で表示できます。.envと.devcontainerはそのまま使います。\n\n${link('prepare')}で設定とDockerを再確認し、${id === 'S2' ? '「ローカルDBを起動する」を実行してから、' : ''}${link('connect')}へ進みます。初期処理が始まった場合は${link('initialize')}で正常終了を確認します。初回の正常終了を確認済みで、再開時に初期処理が実行されなければ、${id === 'I1' ? link('verify') : link('server')}から続けます。\n\n`;
  text += `## ${GUIDE_HEADINGS.missingPreparation}\n\n`;
  text += os === 'win32'
    ? 'Windows側のVS CodeにMicrosoftのWSL拡張とDev Containers（ms-vscode-remote.remote-containers）拡張が必要です。左側の「拡張機能」で名前と発行元を確認します。Docker Desktopを起動し、生成に使ったWSLとの連携を確認します。\n\n'
    : 'PC側のVS CodeにMicrosoftのDev Containers（ms-vscode-remote.remote-containers）拡張が必要です。左側の「拡張機能」で名前と発行元を確認します。DockerとComposeも、PC側で利用できる必要があります。生成済みの.devcontainerとは別の準備です。\n\n';
  text += `[導入の補助資料](${setupFor(id)})の${os === 'win32' ? 'Windows' : os === 'darwin' ? '対象OS' : 'Linux'}の項目を確認してください。設定ファイルを作り直す必要はありません。準備後は${link('prepare')}へ戻ります。\n\n`;
  text += `## ${GUIDE_HEADINGS.docker}\n\n場所：${hostLocation}\n\n` + codeBlock("'docker' 'version'\n'docker' 'compose' 'version'");
  text += os === 'win32'
    ? 'Docker Desktopの起動と、選択したWSLのIntegrationを確認します。PowerShell側だけの成功では、このWSLからの接続は確認できません。\n\n'
    : 'docker versionのClientとServerの両方が表示されることを確認します。Serverへ接続できない場合は、Dockerの起動状態と通常ユーザーの利用権限をPCの導入手順に沿って確認します。\n\n';
  text += `接続できたら${link('prepare')}へ戻ります。\n\n`;
  text += `## ${GUIDE_HEADINGS.initialization}\n\nVS Codeの構成ターミナルとDev Containersのログを開きます。ログが進んでいれば、初回の取得・構成処理を待ちます。失敗した場合は、最後のエラーとネット接続、空き容量を確認します。処理中に別のnpm ciなどを重ねて実行しません。\n\n[初期処理の復旧資料](${recoveryFor(id)})を参照する場合も、生成済みの.envは作り直しません。初期処理を再実行した後は${link('initialize')}へ戻り、表示と正常終了の両方を確認します。\n\n`;
  text += `## ${GUIDE_HEADINGS.result}\n\n`;
  text += id === 'I1'
    ? `DBのエラーは[接続とSQLの復旧資料](docs/troubleshooting.md)で確認します。初回にテーブルがない場合は、この案内の「サンプルデータを準備する」が正常終了したか確認します。復旧後は${link('verify')}のSQLを再実行します。\n\n`
    : `開発サーバーのターミナルにエラーがないか確認します。停止していたら${link('server')}へ戻ります。初期処理を終えていなければ${link('initialize')}から続けます。\n\n${link('verify')}のURLまたはコマンドをそのまま使います。別の保存先や古いポート、127.0.0.1に置き換えないでください。${id === 'S2' ? 'DBへ接続できない場合は、ホストで「ローカルDBを起動する」の正常終了を確認します。' : ''}直らない場合は[停止・復旧の補助資料](${recoveryFor(id)})を確認してください。\n\n`;
  text += `## ${GUIDE_HEADINGS.optional}\n\nここからは、初回完了後に選べる練習です。一か所変え、変化を確認し、元へ戻します。終了していた場合は${link('resume')}から再開してから進みます。\n\n`;
  for (const step of steps.filter(step => step.phase === 'optional')) text += renderStep(step, options, 3);
  text += '## 続きの教材と補助資料\n\n';
  for (const step of steps.filter(step => step.phase === 'reference')) text += renderStep(step, options, 3);
  text += `## 詳細情報\n\n- 使用技術：${presentation.technology}\n- 管理用ID：${id}\n- 版：${plan.templateVersion}\n- 識別名：${plan.projectName}\n- ポート：${Object.entries(plan.ports).map(([key,value]) => `${key}=${value}`).join(' / ')}\n\n`;
  return text + '生成前の診断はその時点の観察です。ポートや起動成功の保証ではありません。秘密値は.envだけに保存し、この案内には載せません。\n';
}
