import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "ツクハコ｜ローカル学習メモ", description: "Next.jsとSupabaseローカルのCRUDを学ぶスターター" };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body>{children}</body></html>;
}
