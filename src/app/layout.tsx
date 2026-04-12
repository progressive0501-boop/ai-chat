import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI 雑談チャット",
  description: "明るく楽しい AI との雑談ボット",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${geist.variable} h-full`}>
      <body className="h-full flex flex-col bg-gray-50 antialiased">
        {/* ヘッダー */}
        <header className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-lg shadow">
              🤖
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-800 leading-tight">AI 雑談ボット</h1>
              <p className="text-xs text-gray-400">何でも気軽に話しかけてね！</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-gray-400">オンライン</span>
            </div>
          </div>
        </header>

        {/* チャットエリア（残り全高さ） */}
        <main className="flex-1 overflow-hidden max-w-3xl w-full mx-auto flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
