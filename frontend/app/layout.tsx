import './globals.css';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';

// Подключаем основной шрифт и моноширинный для технических деталей
const inter = Inter({ subsets: ['latin', 'cyrillic'] });
const mono = JetBrains_Mono({ 
  subsets: ['latin'], 
  variable: '--font-mono' 
});

export const metadata: Metadata = {
  title: 'NEXUS | Absolute Authority',
  description: 'The Eye is watching. Site sovereignty protocol active.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`${mono.variable}`}>
      <body className={`${inter.className} bg-[#050505] text-slate-300 antialiased`}>
        
        {/* Глобальный визуальный эффект: зернистость (Noise) */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[9999] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        
        {/* Контейнер для всего контента приложения */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {children}
        </div>

      </body>
    </html>
  );
}