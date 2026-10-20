import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "ツクハコ｜公開カタログ", description: "Supabaseの公開データ読取りを学ぶスターター" };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body>{children}</body></html>;
}
