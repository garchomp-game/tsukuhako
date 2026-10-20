import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto my-16 max-w-3xl px-6">
      <p className="text-xs font-bold tracking-widest text-emerald-800">ツクハコ / S1 · NEXT.JS / ROUTE HANDLERS</p>
      <h1 className="mt-5 text-5xl font-semibold tracking-tight">ことばの便り</h1>
      <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">画面から送ったことばをAPIが整えて返します。入力、送信、応答の流れを、小さな画面で確かめましょう。</p>
      <ol className="my-9 grid gap-4 sm:grid-cols-3">
        {["1. ことばを入力", "2. APIへ送信", "3. 結果を表示"].map((step) => <li key={step} className="rounded-xl border border-emerald-900/15 bg-white p-5 text-sm font-semibold">{step}</li>)}
      </ol>
      <Link className="inline-block rounded-lg bg-emerald-800 px-6 py-3 font-semibold text-white" href="/practice">練習画面へ</Link>
      <p className="mt-8 text-sm text-slate-600">入力は保存しません。データベースやクラウド接続は不要です。</p>
    </main>
  );
}
