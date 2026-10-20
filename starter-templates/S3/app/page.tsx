import "server-only";
import { loadCatalog, settings } from "../lib/catalog";
export const dynamic = "force-dynamic";

export default async function Page() {
  const result = await loadCatalog(settings(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLIC_KEY));
  return <main className="mx-auto max-w-3xl px-5 py-12">
    <p className="eyebrow">ツクハコ / STARTER S3</p>
    <h1 className="mt-3 text-3xl font-semibold">公開カタログを読む</h1>
    <p className="intro">Next.jsからSupabaseの公開データへ。架空の商品を使って、接続と読取り権限を学びます。</p>
    <aside className="notice"><strong>読取り専用の追加テンプレート</strong><br />書き込み・ログイン機能はありません。クラウド接続には専用の学習プロジェクトが必要です。</aside>
    {result.state !== "ready" ? <section className="panel" aria-labelledby="connection-title">
      <h2 id="connection-title">{result.state === "missing" ? "接続設定から始めましょう" : "接続を確認してください"}</h2>
      <p role="alert" aria-label="接続案内" className="intro">{result.message}</p>
      <ol className="mt-4 list-decimal pl-6"><li>READMEの専用プロジェクト接続手順を確認する</li><li>公開してよい架空データとSELECT権限を準備する</li><li>設定を保存して開発サーバーを再起動する</li></ol>
    </section> : <section aria-labelledby="products-title">
      <h2 id="products-title">架空の商品 <span>({result.products.length}件)</span></h2>
      {result.products.length === 0 ? <p className="empty">公開データはまだありません。seedとSELECT policyを確認してください。</p> :
        <ul className="notes">{result.products.map(product => <li key={product.id}><h3 className="font-semibold">{product.name}</h3><p className="mt-2">参考価格 {product.price_yen.toLocaleString("ja-JP")}円</p></li>)}</ul>}
    </section>}
    <form className="mt-6" action="/" method="get"><button type="submit">一覧を再読込</button></form>
    <footer>ブラウザ → Next.jsのサーバー → Supabaseの公開SELECT<br />学習用の架空データです。商品の販売や申込みはできません。</footer>
  </main>;
}
