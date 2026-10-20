import Link from "next/link";
import PreviewForm from "../../components/PreviewForm";

export default function Practice() {
  return (
    <main className="mx-auto my-12 max-w-3xl px-6">
      <Link className="text-sm text-emerald-800 underline underline-offset-4" href="/">← トップへ</Link>
      <p className="mt-8 text-xs font-bold tracking-widest text-emerald-800">ツクハコ / INPUT → API → PREVIEW</p>
      <h1 className="mb-3 mt-4 text-4xl font-semibold tracking-tight">ことばを送ってみる</h1>
      <p className="mb-8 leading-7 text-slate-600">前後の空白を取り除き、文字の数を数えます。</p>
      <PreviewForm />
      <p className="mt-6 text-xs leading-6 text-slate-600">文字数はUnicodeコードポイントで数えます。絵文字の組み合わせなど、見た目の一文字が複数になる場合があります。再読み込みすると入力と結果は消えます。</p>
    </main>
  );
}
