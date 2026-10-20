import Notes from "./notes";
export default function Page() {
  return <main className="mx-auto max-w-3xl px-5 py-12">
    <p className="eyebrow">ツクハコ / STARTER S2</p>
    <h1 className="mt-3 text-3xl font-semibold">ローカル学習メモ</h1>
    <p className="intro">書く、保存する、読み返す。Next.jsとSupabaseのつながりを、小さなメモで確かめましょう。</p>
    <aside className="notice"><strong>このPCでの学習専用</strong><br />ログイン機能はありません。架空の内容だけを入力してください。メモはローカルDBに保存され、再読み込み後も残ります。</aside>
    <Notes />
    <footer>画面 → 同じオリジンのAPI → ローカルSupabase<br />操作を変えたら、ターミナルでテストを実行しましょう。</footer>
  </main>;
}
