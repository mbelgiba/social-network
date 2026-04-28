"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    nickname: ''
  });
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('http://localhost:8080/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/login');
      } else {
        const data = await res.json();
        setError(data.error || "INITIALIZATION FAILED: DATA CORRUPTION");
      }
    } catch (err) {
      setError("NEXUS UPLINK ERROR: CORE UNREACHABLE");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Фоновое свечение Бездны */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-600/5 rounded-full blur-[150px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl relative z-10"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-orange-600 tracking-[0.4em] uppercase mb-4">Nexus</h1>
          <p className="text-[9px] text-slate-500 uppercase tracking-[0.3em] font-bold">New Soul Incorporation Protocol</p>
        </div>

        <div className="bg-black/40 backdrop-blur-3xl border border-orange-600/10 p-10 rounded-[48px] shadow-2xl">
          <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[8px] uppercase tracking-[0.3em] text-slate-600 mb-2 ml-2 font-black">Identity (Email)</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-orange-600/40 transition-all text-sm font-light"
              />
            </div>

            <div>
              <label className="block text-[8px] uppercase tracking-[0.3em] text-slate-600 mb-2 ml-2 font-black">Access Key (Password)</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-orange-600/40 transition-all text-sm font-light"
              />
            </div>

            <div>
              <label className="block text-[8px] uppercase tracking-[0.3em] text-slate-600 mb-2 ml-2 font-black">Designation (Nickname)</label>
              <input
                type="text"
                required
                value={formData.nickname}
                onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-orange-600/40 transition-all text-sm font-light"
              />
            </div>

            <div>
              <label className="block text-[8px] uppercase tracking-[0.3em] text-slate-600 mb-2 ml-2 font-black">First Name</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-orange-600/40 transition-all text-sm font-light"
              />
            </div>

            <div>
              <label className="block text-[8px] uppercase tracking-[0.3em] text-slate-600 mb-2 ml-2 font-black">Last Name</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-orange-600/40 transition-all text-sm font-light"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[8px] uppercase tracking-[0.3em] text-slate-600 mb-2 ml-2 font-black">Origin Date (Birth Date)</label>
              <input
                type="date"
                required
                value={formData.date_of_birth}
                onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                className="w-full bg-white/[0.02] border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-orange-600/40 transition-all text-sm font-light"
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="md:col-span-2 bg-orange-950/10 border border-orange-600/20 p-4 rounded-xl text-orange-500 text-[10px] font-black uppercase tracking-widest text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              className="md:col-span-2 bg-orange-600 text-black py-5 rounded-2xl font-black uppercase tracking-[0.4em] text-[10px] hover:bg-orange-500 transition-all shadow-xl shadow-orange-900/20 active:scale-[0.98] mt-4"
            >
              Authorize Entry
            </button>
          </form>

          <div className="mt-10 text-center border-t border-white/5 pt-8">
            <p className="text-[9px] text-slate-600 uppercase tracking-[0.2em]">Already Linked?</p>
            <Link href="/login" className="text-orange-500 text-[10px] font-black uppercase tracking-[0.2em] mt-3 block hover:text-white transition-colors">
              Re-establish Connection
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}