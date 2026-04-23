import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "Dark Gold Social",
  description: "A modern social network built with Next.js and Go",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-primary text-text-primary min-h-screen flex flex-col`}>
        <nav className="bg-accent border-b border-border p-4 flex justify-between items-center">
          <h1 className="text-yellow font-bold text-xl tracking-wider">DG SOCIAL</h1>
        </nav>
        <main className="flex-grow flex items-center justify-center p-4">
          {children}
        </main>
      </body>
    </html>
  );
}