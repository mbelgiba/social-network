"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:8080/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      if (res.ok) {
        router.push('/');
      } else {
        setError('Authorization failed. Invalid credentials.');
      }
    } catch (err) {
      setError('System connection error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-[#0a0a0a] overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-900/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-950/20 rounded-full blur-[150px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="glass-panel w-full max-w-md p-12 rounded-[40px] shadow-crimson-bold relative z-10 border border-red-500/10 bg-[#050505]/80 backdrop-blur-2xl"
      >
        <div className="text-center mb-12">
          <motion.h1 
            animate={{ textShadow: ['0 0 10px rgba(225,29,72,0.3)', '0 0 20px rgba(225,29,72,0.6)', '0 0 10px rgba(225,29,72,0.3)'] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-5xl font-black text-red-600 tracking-[0.3em] mb-4 uppercase"
          >
            01Net
          </motion.h1>
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-bold">Private Network Access</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-900/20 border border-red-500/30 text-red-400 p-4 rounded-2xl mb-6 text-center text-xs uppercase tracking-widest font-bold">
            {error}
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500/70 ml-2">Identifier (E-mail)</label>
            <input 
              type="email" 
              required
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 text-white px-6 py-4 rounded-2xl focus:outline-none focus:border-red-600/50 transition-all placeholder:text-slate-700 font-light"
              placeholder="user@network.local"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500/70 ml-2">Security Credential</label>
            <input 
              type="password" 
              required
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 text-white px-6 py-4 rounded-2xl focus:outline-none focus:border-red-600/50 transition-all placeholder:text-slate-700 font-light"
              placeholder="••••••••"
            />
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            disabled={isLoading}
            className="mt-6 bg-red-700 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-red-600 transition-all shadow-[0_0_30px_rgba(185,28,28,0.2)] hover:shadow-crimson-bold relative overflow-hidden group"
          >
            <span className="relative z-10">{isLoading ? 'Authenticating...' : 'Authorize'}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-800 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </motion.button>
        </form>

        <div className="mt-10 text-center">
          <Link href="/register" className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] hover:text-red-500 transition-colors">
            Create New Identity
          </Link>
        </div>
      </motion.div>
    </div>
  );
}