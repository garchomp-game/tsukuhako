import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ツクハコ｜画面とAPIの練習",
  description: "画面とAPIのつながりを学ぶ、保存しない文字列プレビュー",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body>{children}</body></html>;
}
