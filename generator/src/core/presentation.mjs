// User-facing names and first outcomes are shared by the picker, Reader and saved guide.
// Template IDs remain the stable keys used by generation and diagnostics.
const presentations = {
  F1: {
    name: '入力と表示のWeb画面',
    summary: '入力したことばが画面に映るサンプルから、画面づくりを始めます。',
    technology: 'React + Vite',
    firstGoal: 'サンプル画面を表示する',
    guideAction: 'サンプル画面を表示する手順へ',
    success: 'ブラウザーに「ことばの鏡」と、入力欄「表示することば」が表示されます。',
    route: '/',
  },
  F2: {
    name: 'はじめてのWeb画面',
    summary: 'まずサンプル画面を表示します。そのあと、ページの移動や文字の変更を試せます。',
    technology: 'Next.js + Tailwind CSS',
    firstGoal: 'サンプル画面を表示する',
    guideAction: 'サンプル画面を表示する手順へ',
    success: 'ブラウザーに「小さく変えて、動きを確かめよう。」という大きな見出しと「練習画面へ →」が表示されます。',
    route: '/',
  },
  B1: {
    name: 'データを返すAPI',
    summary: 'APIからJSONを受け取ります。そのあと、入力に応じた応答を試せます。',
    technology: 'Next.js API',
    firstGoal: 'APIの応答を確認する',
    guideAction: 'APIの応答を確認する手順へ',
    success: 'HTTP 200の応答と、statusがokのJSON（{"status":"ok"}）が表示されます。',
    route: '/api/health',
  },
  S1: {
    name: '画面からつなぐAPI',
    summary: '画面で入力したことばをAPIへ送り、応答が画面へ戻る流れを試します。',
    technology: 'Next.js 画面 + API',
    firstGoal: '画面からAPIの応答を確認する',
    guideAction: '画面からAPIを試す手順へ',
    success: '「ことばを送ってみる」の画面から送信すると、「APIからの返事」に入力したことばと文字数が表示されます。',
    route: '/practice',
  },
  S2: {
    name: 'メモを保存するWeb画面',
    summary: 'このPCのDBに架空のメモを保存し、ページを読み直しても残ることを試します。',
    technology: 'Next.js + ローカルSupabase',
    firstGoal: 'メモを保存して読み直す',
    guideAction: 'メモの保存を試す手順へ',
    success: '「ローカル学習メモ」で保存した架空のメモが一覧に表示され、ブラウザーを再読み込みしても残ります。',
    route: '/',
  },
  I1: {
    name: 'SQLで調べるデータベース',
    summary: 'DBへ接続し、SQLで在庫のサンプルを検索します。Web画面は使いません。',
    technology: 'PostgreSQL + SQL',
    firstGoal: 'SQLでサンプルデータを確認する',
    guideAction: 'SQLで確認する手順へ',
    success: 'DBへの接続が成功し、SQLの結果にlesson列の「SQLの練習」と在庫のサンプルが表示されます。',
    route: null,
  },
  S3: {
    name: 'クラウドDBへの接続（参考）',
    summary: '専用クラウド接続は未確認です。新規作成の対象外です。',
    technology: 'Next.js + クラウドSupabase',
    firstGoal: '参考資料で構成を確認する',
    guideAction: '参考資料へ',
    success: '専用クラウド接続の動作は未確認です。',
    route: null,
  },
};

export function presentationFor(id) {
  if (!Object.hasOwn(presentations, id)) throw new RangeError(`Unknown template: ${id}`);
  return { ...presentations[id] };
}
