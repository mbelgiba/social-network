"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '', password: '', first_name: '', last_name: '', date_of_birth: '', nickname: '', about_me: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:8080/api/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData)
      });

      if (res.ok) {
        router.push('/login');
      } else {
        setError('Identity creation failed. Identifier may be in use.');
      }
    } catch (err) {
      setError('System connection error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12 relative bg-[#0a0a0a] overflow-hidden">
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-900/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-950/20 rounded-full blur-[150px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="glass-panel w-full max-w-xl p-12 rounded-[40px] shadow-crimson-bold relative z-10 border border-red-500/10 bg-[#050505]/80 backdrop-blur-2xl"
      >
        <div className="text-center mb-10">
          <motion.h1 
            animate={{ textShadow: ['0 0 10px rgba(225,29,72,0.3)', '0 0 20px rgba(225,29,72,0.6)', '0 0 10px rgba(225,29,72,0.3)'] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-4xl font-black text-red-600 tracking-[0.3em] mb-2 uppercase"
          >
            Initialization
          </motion.h1>
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-bold">Register Network Identity</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-900/20 border border-red-500/30 text-red-400 p-4 rounded-2xl mb-6 text-center text-xs uppercase tracking-widest font-bold">
            {error}
          </motion.div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-5">
            <input type="text" name="first_name" required placeholder="First Name" onChange={handleChange} className="bg-white/5 border border-white/10 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-red-600/50 transition-all placeholder:text-slate-600 font-light" />
            <input type="text" name="last_name" required placeholder="Last Name" onChange={handleChange} className="bg-white/5 border border-white/10 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-red-600/50 transition-all placeholder:text-slate-600 font-light" />
          </div>
          <input type="text" name="nickname" placeholder="Callsign (@user)" onChange={handleChange} className="bg-white/5 border border-white/10 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-red-600/50 transition-all placeholder:text-slate-600 font-light" />
          <input type="date" name="date_of_birth" required onChange={handleChange} className="bg-white/5 border border-white/10 text-slate-400 px-5 py-4 rounded-2xl focus:outline-none focus:border-red-600/50 transition-all font-light" />
          <input type="email" name="email" required placeholder="E-mail Address" onChange={handleChange} className="bg-white/5 border border-white/10 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-red-600/50 transition-all placeholder:text-slate-600 font-light" />
          <input type="password" name="password" required placeholder="Security Credential" onChange={handleChange} className="bg-white/5 border border-white/10 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-red-600/50 transition-all placeholder:text-slate-600 font-light" />
          <textarea name="about_me" placeholder="System Biography..." onChange={handleChange} className="bg-white/5 border border-white/10 text-white px-5 py-4 rounded-2xl focus:outline-none focus:border-red-600/50 transition-all placeholder:text-slate-600 font-light h-24 resize-none" />
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            disabled={isLoading} 
            className="mt-6 bg-red-700 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-red-600 transition-all shadow-[0_0_30px_rgba(185,28,28,0.2)] hover:shadow-crimson-bold relative overflow-hidden group"
          >
            <span className="relative z-10">{isLoading ? 'Processing...' : 'Register Identity'}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-800 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </motion.button>
        </form>

        <div className="mt-10 text-center text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
          Already in system? <Link href="/login" className="text-red-500 hover:text-red-400 transition-colors ml-2">Authenticate</Link>
        </div>
      </motion.div>
    </div>
  );
}