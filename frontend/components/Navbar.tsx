"use client";

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{role: string} | null>(null);
  const [isAuth, setIsAuth] = useState(false);

  const fetchAuthStatus = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8080/api/profile', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        
        // --- ОТЛАДКА: Посмотри это в консоли браузера (F12) ---
        console.log(">>> NEXUS AUTH DEBUG <<<");
        console.log("Current User Role:", data.role);
        
        setUser(data);
        setIsAuth(true);
      } else {
        setIsAuth(false);
        setUser(null);
      }
    } catch (err) {
      console.error("Nexus Uplink Error:", err);
      setIsAuth(false);
    }
  }, []);

  useEffect(() => {
    fetchAuthStatus();
  }, [pathname, fetchAuthStatus]);

  const handleLogout = async () => {
    await fetch('http://localhost:8080/api/logout', { method: 'POST', credentials: 'include' });
    setIsAuth(false);
    setUser(null);
    router.push('/login');
  };

  // Проверка на админа с игнорированием регистра
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  return (
    <nav className="bg-black/80 backdrop-blur-2xl sticky top-0 z-[100] flex justify-between items-center px-12 py-6 border-b border-orange-600/20 shadow-[0_10px_50px_rgba(0,0,0,0.9)]">
      <Link href="/" className="text-3xl font-black text-orange-600 tracking-[0.4em] hover:text-orange-500 transition-all uppercase drop-shadow-[0_0_15px_rgba(255,69,0,0.4)]">
        NEXUS
      </Link>
      
      <div className="flex gap-10 items-center">
        {isAuth ? (
          <>
            <Link href="/" className={`text-[10px] font-black uppercase tracking-[0.25em] transition-all ${pathname === '/' ? 'text-orange-500' : 'text-slate-500 hover:text-orange-400'}`}>Feed</Link>
            <Link href="/messages" className={`text-[10px] font-black uppercase tracking-[0.25em] transition-all ${pathname === '/messages' ? 'text-orange-500' : 'text-slate-500 hover:text-orange-400'}`}>Comms</Link>
            <Link href="/groups" className={`text-[10px] font-black uppercase tracking-[0.25em] transition-all ${pathname === '/groups' ? 'text-orange-500' : 'text-slate-500 hover:text-orange-400'}`}>Sectors</Link>
            <Link href="/profile" className={`text-[10px] uppercase tracking-[0.25em] font-black transition-all ${pathname === '/profile' ? 'text-orange-600 underline underline-offset-8 decoration-2' : 'text-slate-500 hover:text-orange-500'}`}>Identity</Link>
            
            {/* КНОПКА OVERRIDE (ADMIN) */}
            {isAdmin && (
              <Link href="/admin" className="relative group">
                <motion.div 
                  animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -inset-4 bg-orange-600/20 blur-2xl rounded-full" 
                />
                <span className="relative bg-orange-600 text-black px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(255,69,0,0.5)] hover:bg-orange-400 transition-all block border border-orange-300/40">
                  Override
                </span>
              </Link>
            )}

            <button onClick={handleLogout} className="ml-6 text-slate-700 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.3em] transition-all">
              Sever
            </button>
          </>
        ) : (
          <Link href="/login" className="bg-white text-black px-10 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] hover:bg-orange-600 transition-all">
            Link
          </Link>
        )}
      </div>
    </nav>
  );
}