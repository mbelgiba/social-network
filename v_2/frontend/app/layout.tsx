import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "01Net - Әлеуметтік желі",
  description: "Заманауи, жылдам және қауіпсіз әлеуметтік желі",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="kk">
      <body className={`${inter.className} antialiased selection:bg-yellow-400 selection:text-slate-900`}>
        {children}
      </body>
    </html>
  );
}