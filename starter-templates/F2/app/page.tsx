import Link from 'next/link';
export default function Home() {
  return <>
    <p className="mb-5 text-sm font-semibold tracking-widest text-[#356e5d]">01 / 画面づくりの入口</p>
    <h1 className="max-w-2xl text-4xl leading-snug font-bold md:text-5xl">小さく変えて、<br />動きを確かめよう。</h1>
    <p className="mt-7 max-w-xl text-base leading-8 text-[#53665d]">ページを開く。文字を入れる。見出しを変える。<br />この練習室から、Next.jsの構成を少しずつ学びます。</p>
    <Link href="/practice" className="mt-9 inline-block rounded-xl bg-[#194f40] px-7 py-4 font-semibold text-white">練習画面へ →</Link>
    <div className="mt-16 grid gap-4 sm:grid-cols-3">
      {['ページを移動する', '入力が表示に変わる', 'ソースを一つ変える'].map((text, i) => <div key={text} className="rounded-2xl border border-[#d9e0d7] bg-white/60 p-6"><p className="text-xs text-[#6e8578]">STEP 0{i + 1}</p><h2 className="mt-3 font-semibold">{text}</h2></div>)}
    </div>
  </>;
}
