"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isExiled, setIsExiled] = useState(false); // Состояние для забаненного юзера
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsExiled(false);

    try {
      const res = await fetch('http://localhost:8080/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (res.ok) {
        router.push('/');
      } else if (res.status === 403) {
        // Если бэкенд вернул 403, значит пользователь изгнан
        setIsExiled(true);
        setError("YOUR SOUL HAS BEEN EXILED FROM THE NEXUS");
      } else {
        setError("INVALID CREDENTIALS OR SYSTEM FAILURE");
      }
    } catch (err) {
      setError("CONNECTION TO CORE LOST");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Фоновое свечение Ока */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-600/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-orange-600 tracking-[0.4em] uppercase mb-4 shadow-orange-900/20">Nexus</h1>
          <p className="text-[9px] text-slate-500 uppercase tracking-[0.3em] font-bold">Initialize Connection to Core</p>
        </div>

        <div className="bg-black/40 backdrop-blur-3xl border border-orange-600/10 p-10 rounded-[40px] shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[8px] uppercase tracking-[0.3em] text-slate-500 mb-3 ml-2 font-black">Identity (Email)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-orange-600/40 transition-all text-sm font-light"
                required
              />
            </div>
            <div>
              <label className="block text-[8px] uppercase tracking-[0.3em] text-slate-500 mb-3 ml-2 font-black">Access Key (Password)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-orange-600/40 transition-all text-sm font-light"
                required
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`text-[9px] font-black tracking-[0.2em] text-center p-4 rounded-xl border uppercase ${isExiled ? 'bg-red-950/20 border-red-600/50 text-red-500 shadow-[0_0_20px_rgba(220,38,38,0.2)]' : 'bg-orange-950/10 border-orange-600/20 text-orange-500'}`}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              className="w-full bg-orange-600 text-black py-5 rounded-2xl font-black uppercase tracking-[0.4em] text-[10px] hover:bg-orange-500 transition-all shadow-xl shadow-orange-900/20 active:scale-[0.98]"
            >
              Link to Nexus
            </button>
          </form>

          <div className="mt-10 text-center border-t border-white/5 pt-8">
            <p className="text-[9px] text-slate-600 uppercase tracking-[0.2em]">New Soul?</p>
            <Link href="/register" className="text-orange-500 text-[10px] font-black uppercase tracking-[0.2em] mt-3 block hover:text-white transition-colors">
              Request Entry
            </Link>
          </div>
        </div>
      </motion.div>
      
      {/* Декоративный элемент "Scanning" */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3">
        <div className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-ping" />
        <span className="text-[7px] font-mono text-slate-700 uppercase tracking-[0.5em]">System Scanning Identity...</span>
      </div>
    </div>
  );
}