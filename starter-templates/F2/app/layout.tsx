import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = { title: 'ツクハコ｜画面づくりの練習', description: 'Next.jsで画面づくりを学ぶ小さな練習室' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body>
    <header className="mx-auto flex max-w-5xl items-center justify-between border-b border-[#d7dfd8] px-6 py-7">
      <Link href="/" className="text-xl font-bold tracking-[.2em]">ツクハコ <span className="ml-3 text-xs font-normal tracking-normal">つくりながら、わかる。</span></Link>
      <span className="rounded-full border border-[#b9cbc1] px-3 py-1 text-xs">Next.js</span>
    </header>
    <main className="mx-auto max-w-5xl px-6 py-12 md:py-20">{children}</main>
    <footer className="mx-auto max-w-5xl px-6 py-6 text-sm text-[#61756a]">学習用スターター · 0.1.2</footer>
  </body></html>;
}
