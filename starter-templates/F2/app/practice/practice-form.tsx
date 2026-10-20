'use client';
import { useState } from 'react';

export default function PracticeForm() {
  const [text, setText] = useState('');
  return <div className="mt-9 max-w-2xl">
    <label htmlFor="idea" className="block text-sm font-semibold">つくりたいもの</label>
    <input id="idea" value={text} onChange={e => setText(e.target.value)} placeholder="例：毎日の発見を残すノート" className="mt-3 w-full rounded-xl border border-[#abbfb1] bg-white p-4" />
    <button type="button" onClick={() => setText('')} className="mt-3 px-1 py-2 text-sm text-[#356e5d] underline underline-offset-4">クリア</button>
    <section className="mt-7 rounded-2xl bg-[#e3ebe1] p-7" aria-label="プレビュー">
      <h2 className="text-xs font-semibold tracking-widest text-[#4a6a55]">YOUR IDEA</h2>
      <p role="status" className="mt-4 min-h-8 break-words text-xl leading-8">{text || 'ここに、あなたのアイデアが表示されます。'}</p>
    </section>
  </div>;
}
