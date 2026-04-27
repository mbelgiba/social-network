"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const router = useRouter();
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/check-auth', { credentials: 'include' });
        if (res.ok) {
          setIsAuth(true);
        } else {
          setIsAuth(false);
        }
      } catch (err) {
        setIsAuth(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    await fetch('http://localhost:8080/api/logout', { method: 'POST', credentials: 'include' });
    setIsAuth(false);
    router.push('/login');
  };

  return (
    <nav className="glass-panel sticky top-0 z-50 flex justify-between items-center px-10 py-5 mb-6 rounded-b-3xl mx-4 mt-2 border-b border-red-500/20">
      <Link href="/" className="text-2xl font-black text-red-600 tracking-[0.3em] hover:text-red-500 transition-all uppercase drop-shadow-[0_0_10px_rgba(225,29,72,0.5)]">
        01Net
      </Link>
      
      <div className="flex gap-8 items-center">
        {isAuth ? (
          <>
            <Link href="/" className="text-slate-400 hover:text-red-500 transition-colors text-[10px] font-bold uppercase tracking-[0.2em]">Feed</Link>
            <Link href="/messages" className="text-slate-400 hover:text-red-500 transition-colors text-[10px] font-bold uppercase tracking-[0.2em]">Comms</Link>
            <Link href="/groups" className="text-slate-400 hover:text-red-500 transition-colors text-[10px] font-bold uppercase tracking-[0.2em]">Sectors</Link>
            <Link href="/profile" className="text-slate-400 hover:text-red-500 transition-colors text-[10px] uppercase tracking-[0.2em] font-bold underline decoration-red-500/50 underline-offset-8">Identity</Link>
            
            {/* Блокировка снята. Кнопка всегда доступна для авторизованных */}
            <Link href="/admin" className="text-red-500 border border-red-500/50 px-3 py-1 rounded-md hover:bg-red-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.2em] shadow-crimson-glow">
              Override
            </Link>

            <button onClick={handleLogout} className="ml-4 px-6 py-2 border border-red-500/30 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-red-600 hover:text-white transition-all shadow-crimson-glow">
              Terminate
            </button>
          </>
        ) : (
          <Link href="/login" className="bg-red-700 text-white px-8 py-2.5 rounded-full font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-600 shadow-crimson-glow transition-all">
            Access Network
          </Link>
        )}
      </div>
    </nav>
  );
}