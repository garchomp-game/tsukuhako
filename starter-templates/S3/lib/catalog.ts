export type Product = { id: string; name: string; price_yen: number };
export type Settings = { state: "ready"; url: string; key: string } | { state: "missing" | "invalid"; message: string };
export type Catalog = { state: "ready"; products: Product[] } | { state: "missing" | "invalid" | "error"; message: string };

export function settings(urlValue: string | undefined, keyValue: string | undefined): Settings {
  if (!urlValue?.trim() || !keyValue?.trim()) return { state: "missing", message: "接続設定がまだありません。.env.local に SUPABASE_URL と SUPABASE_PUBLIC_KEY を設定してください。" };
  const key = keyValue.trim();
  if (!/^sb_publishable_[A-Za-z0-9_-]{8,}$/.test(key)) {
    try {
      if (key.split(".").length !== 3 || JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString()).role !== "anon") throw new Error();
    } catch { return { state: "invalid", message: "公開用のpublishableキーまたはanonキーだけを使用できます。secret/service_roleキーは受け付けません。" }; }
  }
  let url: URL;
  try { url = new URL(urlValue.trim()); } catch { return { state: "invalid", message: "SupabaseのProject URLを確認してください。" }; }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if ((url.protocol !== "https:" && !(local && url.protocol === "http:")) || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    return { state: "invalid", message: "Project URLはHTTPSのオリジンを指定してください。HTTPはローカル検証だけに使えます。" };
  }
  return { state: "ready", url: url.origin, key };
}

export async function loadCatalog(config: Settings, fetcher: typeof fetch = fetch): Promise<Catalog> {
  if (config.state !== "ready") return config;
  const headers: Record<string, string> = { apikey: config.key };
  if (!config.key.startsWith("sb_publishable_")) headers.Authorization = `Bearer ${config.key}`;
  try {
    const response = await fetcher(`${config.url}/rest/v1/learning_products?select=id,name,price_yen&order=name&limit=100`, {
      method: "GET", headers, cache: "no-store", signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return { state: "error", message: "読取りに失敗しました。URL・公開キー・SELECTのgrantとRLS policyを確認してください。" };
    const data: unknown = await response.json();
    if (!Array.isArray(data) || !data.every((item: unknown) => {
      if (!item || typeof item !== "object") return false;
      const product = item as Partial<Product>;
      return typeof product.id === "string" && typeof product.name === "string" && typeof product.price_yen === "number" && Number.isSafeInteger(product.price_yen) && product.price_yen >= 0;
    })) return { state: "error", message: "データ形式がサンプルと異なります。公開テーブルの列を確認してください。" };
    return { state: "ready", products: data as Product[] };
  } catch { return { state: "error", message: "接続できませんでした。ネットワークとProject URLを確認し、再読込してください。" }; }
}
