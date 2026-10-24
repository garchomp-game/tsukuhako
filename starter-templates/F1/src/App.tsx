import { useState } from "react";

export default function App() {
  const [text, setText] = useState("");

  return (
    <main>
      <header>
        <p className="eyebrow">ツクハコ / REACT / VITE</p>
        <h1>ことばの鏡</h1>
        <p className="intro">書いたことばが、そのまま画面に映ります。</p>
      </header>
      <section className="card" aria-labelledby="input-heading">
        <h2 id="input-heading">まずは、ひとこと。</h2>
        <label htmlFor="text">表示することば</label>
        <textarea id="text" value={text} onChange={(event) => setText(event.target.value)} placeholder="こんにちは、ツクハコ。" rows={4} />
        <div className="actions">
          <p>{Array.from(text).length} コードポイント</p>
          <button type="button" onClick={() => setText("")} disabled={text.length === 0}>クリア</button>
        </div>
        <div className="preview" aria-live="polite">
          <h3>いまの表示</h3>
          <p data-testid="preview">{text || "入力したことばがここに表示されます。"}</p>
        </div>
      </section>
      <footer>この入力はブラウザの中だけで扱います。ページを再読み込みすると消えます。</footer>
    </main>
  );
}
