"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';

// Компонент Ока Саурона (Sauron's Eye)
const SauronEye = ({ flip = false }: { flip?: boolean }) => (
  <motion.div
    animate={{ 
      y: [0, -10, 0], 
      filter: [
        'drop-shadow(0 0 15px rgba(255, 69, 0, 0.4))', 
        'drop-shadow(0 0 45px rgba(255, 0, 0, 0.9))', 
        'drop-shadow(0 0 15px rgba(255, 69, 0, 0.4))'
      ]
    }}
    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    className={`absolute top-1/2 -translate-y-1/2 w-32 h-72 pointer-events-none z-10 ${flip ? '-right-44' : '-left-44'}`}
  >
    <div className="absolute inset-0 bg-orange-600/10 blur-[120px] rounded-full animate-pulse" />
    <svg viewBox="0 0 100 200" className="w-full h-full relative z-10">
      <defs>
        <radialGradient id="sauronFlame" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffff00" />
          <stop offset="20%" stopColor="#ff8c00" />
          <stop offset="50%" stopColor="#ff4500" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.9" />
        </radialGradient>
      </defs>
      
      {/* Форма ока */}
      <path 
        d="M10 100 Q50 0 90 100 Q50 200 10 100" 
        fill="#000" 
        stroke="#ff4500" 
        strokeWidth="1" 
        className="opacity-40"
      />
      
      {/* Пылающая радужка */}
      <motion.path 
        d="M20 100 Q50 25 80 100 Q50 175 20 100" 
        fill="url(#sauronFlame)"
        animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.02, 1] }}
        transition={{ duration: 0.15, repeat: Infinity }}
      />

      {/* Вертикальный зрачок власти */}
      <motion.ellipse 
        cx="50" cy="100" rx="3.5" ry="80" 
        fill="#000" 
        animate={{ 
          rx: [3.5, 6, 3.5],
          opacity: [1, 0.8, 1]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} 
      />
      
      {/* Внешние частицы пламени */}
      <circle cx="50" cy="100" r="45" fill="none" stroke="#ff4500" strokeWidth="0.5" strokeDasharray="5 10" className="animate-spin-slow" />
    </svg>
  </motion.div>
);

const BloodRain = () => {
  const [drops, setDrops] = useState<{id: number, left: string, delay: number, duration: number, height: string}[]>([]);
  useEffect(() => {
    const generatedDrops = Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: Math.random() * 5,
      duration: Math.random() * 4 + 2,
      height: `${Math.random() * 100 + 40}px`,
    }));
    setDrops(generatedDrops);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {drops.map(drop => (
        <motion.div
          key={drop.id}
          initial={{ y: -200, opacity: 0 }}
          animate={{ y: '120vh', opacity: [0, 0.7, 0.7, 0] }}
          transition={{ duration: drop.duration, delay: drop.delay, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 w-[1.5px] bg-gradient-to-b from-transparent via-orange-500 to-red-900 rounded-b-full blur-[0.5px]"
          style={{ left: drop.left, height: drop.height }}
        />
      ))}
    </div>
  );
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('SYSTEM_CORE');
  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [adForm, setAdForm] = useState({ title: '', content: '', link: '' });
  const [siteConfig, setSiteConfig] = useState({ registrationOpen: true, globalAlert: "" });

  const fetchData = async () => {
    try {
      const uRes = await fetch('http://localhost:8080/api/users', { credentials: 'include' });
      if (uRes.ok) setUsers(await uRes.json() || []);
      
      const postRes = await fetch('http://localhost:8080/api/posts', { credentials: 'include' });
      if (postRes.ok) setPosts(await postRes.json() || []);
      
      const aRes = await fetch('http://localhost:8080/api/ads', { credentials: 'include' });
      if (aRes.ok) setAds(await aRes.json() || []);
    } catch (err) { 
      console.log("Connection to Nexus Core lost. Using override protocols.");
    }
  };

  useEffect(() => { fetchData(); }, []);

  const executeAction = async (action: string, id?: string) => {
    if (!confirm(`Execute authority action: ${action}?`)) return;
    alert(`Nexus Core: Action ${action} initialized.`);
    fetchData();
  };

  const createAd = async () => {
    if (!adForm.title || !adForm.content) return;
    await fetch('http://localhost:8080/api/admin/ads', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(adForm), credentials: 'include'
    });
    setAdForm({ title: '', content: '', link: '' });
    fetchData();
  };

  return (
    <div className="min-h-screen bg-[#050505] overflow-hidden flex flex-col relative text-slate-400">
      <BloodRain />
      
      <div className="relative z-20">
        <Navbar />
      </div>
      
      <div className="flex-1 flex items-center justify-center p-6 relative z-10 mt-10">
        <motion.div 
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative w-full max-w-6xl h-[82vh] rounded-[48px] border border-orange-600/20 flex flex-col md:flex-row overflow-visible bg-black/95 backdrop-blur-3xl shadow-[0_0_80px_rgba(255,69,0,0.1)]"
        >
          {/* Визуализация Ока Саурона */}
          <SauronEye />
          <SauronEye flip={true} />

          {/* Левая панель власти */}
          <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-orange-600/10 p-8 flex flex-col bg-black/40 rounded-l-[48px] relative z-20">
            <div className="mb-12">
              <h1 className="text-3xl font-black text-orange-600 tracking-[0.25em] leading-none">SAURON<br/><span className="text-[9px] text-orange-400/50 uppercase tracking-[0.5em] mt-2 block font-bold">Absolute Authority</span></h1>
            </div>
            
            <nav className="flex flex-col gap-3">
              {[
                { id: 'SYSTEM_CORE', label: 'System Core' },
                { id: 'AD_INJECT', label: 'Sponsorship' },
                { id: 'CONTENT_MOD', label: 'Content Control' },
                { id: 'IDENTITY', label: 'User Matrix' }
              ].map(tab => (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-left px-6 py-4 rounded-2xl text-[10px] uppercase tracking-[0.3em] font-black transition-all ${
                    activeTab === tab.id 
                    ? 'bg-orange-600 text-black shadow-[0_0_30px_rgba(255,69,0,0.5)] scale-105' 
                    : 'text-slate-600 hover:text-orange-400 hover:bg-orange-900/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="mt-auto pt-8 border-t border-orange-600/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(255,69,0,1)]" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-orange-500">Master Linked</span>
              </div>
              <div className="text-[8px] text-slate-700 uppercase font-mono tracking-tighter">Core: 0xSAURON_V2</div>
            </div>
          </div>

          {/* Контентная часть */}
          <div className="flex-1 p-12 overflow-y-auto relative z-20 custom-scrollbar">
            <AnimatePresence mode="wait">
              
              {/* SYSTEM CORE */}
              {activeTab === 'SYSTEM_CORE' && (
                <motion.div key="core" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                  <h2 className="text-2xl font-black text-white uppercase tracking-[0.4em]">Site Sovereignty</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="p-8 bg-orange-950/5 border border-orange-500/10 rounded-[36px] space-y-6">
                      <h3 className="text-xs font-bold text-orange-500 uppercase tracking-widest">Gate Control</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">Lock or unlock the portal for new souls entering the network.</p>
                      <button 
                        onClick={() => setSiteConfig({...siteConfig, registrationOpen: !siteConfig.registrationOpen})}
                        className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${siteConfig.registrationOpen ? 'border-green-600/40 text-green-500' : 'border-red-600/40 text-red-500 bg-red-950/10'}`}
                      >
                        Registration: {siteConfig.registrationOpen ? 'OPEN' : 'SEALED'}
                      </button>
                    </div>
                    <div className="p-8 bg-orange-950/5 border border-orange-500/10 rounded-[36px] space-y-6">
                      <h3 className="text-xs font-bold text-red-600 uppercase tracking-widest">Nuclear Option</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">Immediate purge of all temporary data, sessions and cache.</p>
                      <button onClick={() => executeAction('purge_all')} className="w-full py-4 bg-red-950/20 border border-red-600/30 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Invoke Purge</button>
                    </div>
                  </div>
                  <div className="p-10 border border-white/5 rounded-[40px] bg-white/[0.02] shadow-inner">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white mb-8">Thought Broadcast</h3>
                    <textarea 
                      placeholder="Input direct message to all nodes..." 
                      className="w-full bg-black border border-white/10 rounded-[24px] p-6 text-sm text-slate-300 outline-none focus:border-orange-600/40 h-32 resize-none mb-6 transition-all" 
                    />
                    <button className="w-full py-5 bg-orange-600 text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] hover:bg-orange-500 transition-all shadow-xl shadow-orange-900/20">Transmit to All</button>
                  </div>
                </motion.div>
              )}

              {/* AD_INJECT (Sponsorship) */}
              {activeTab === 'AD_INJECT' && (
                <motion.div key="ads" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                  <h2 className="text-2xl font-black text-white uppercase tracking-[0.4em]">Sponsor Protocols</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <input type="text" placeholder="Campaign Alias" value={adForm.title} onChange={e => setAdForm({...adForm, title: e.target.value})} className="bg-white/5 border border-white/10 text-white px-6 py-5 rounded-2xl outline-none focus:border-orange-600/40" />
                    <input type="text" placeholder="Target Link" value={adForm.link} onChange={e => setAdForm({...adForm, link: e.target.value})} className="bg-white/5 border border-white/10 text-white px-6 py-5 rounded-2xl outline-none focus:border-orange-600/40" />
                    <textarea placeholder="Payload data..." value={adForm.content} onChange={e => setAdForm({...adForm, content: e.target.value})} className="md:col-span-2 bg-white/5 border border-white/10 text-white px-6 py-5 rounded-2xl outline-none focus:border-orange-600/40 h-28 resize-none" />
                    <button onClick={createAd} className="md:col-span-2 bg-white text-black py-5 rounded-2xl font-black uppercase tracking-[0.4em] text-[10px] hover:bg-orange-600 transition-all">Deploy Sponsor Block</button>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {ads.map(a => (
                      <div key={a.id} className="bg-white/[0.03] p-8 rounded-[32px] border border-white/5 group">
                        <strong className="text-orange-500 block mb-3 text-sm tracking-widest">{a.title}</strong>
                        <p className="text-xs text-slate-500 mb-6 font-light">{a.content}</p>
                        <button onClick={() => executeAction('terminate_ad', a.id)} className="text-[9px] uppercase font-black text-red-600 tracking-[0.2em] opacity-50 group-hover:opacity-100 transition-opacity">Terminate Campaign</button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* CONTENT_MOD */}
              {activeTab === 'CONTENT_MOD' && (
                <motion.div key="content" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <h2 className="text-2xl font-black text-white uppercase tracking-[0.4em]">Content Erasure</h2>
                  <div className="space-y-4">
                    {posts.map(p => (
                      <div key={p.id} className="flex justify-between items-center bg-white/[0.02] p-6 rounded-[32px] border border-white/5 hover:border-orange-600/20 transition-all">
                        <div className="max-w-md">
                          <div className="text-orange-500 font-black text-[10px] mb-2 tracking-widest uppercase">ID: {p.author}</div>
                          <div className="text-sm text-slate-300 font-light truncate">{p.content || '[Media Encrypted]'}</div>
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => executeAction('shadowban', p.id)} className="px-5 py-3 bg-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5">Hide</button>
                          <button onClick={() => executeAction('incinerate', p.id)} className="px-5 py-3 bg-red-950/30 text-red-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-red-900/20 hover:bg-red-600 hover:text-white transition-all">Incinerate</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* IDENTITY (User Matrix) */}
              {activeTab === 'IDENTITY' && (
                <motion.div key="users" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                  <h2 className="text-2xl font-black text-white uppercase tracking-[0.4em]">User Matrix</h2>
                  <div className="grid grid-cols-1 gap-4">
                    {users.map(u => (
                      <div key={u.id} className="flex justify-between items-center bg-white/[0.02] p-8 rounded-[36px] border border-white/5">
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 bg-gradient-to-br from-orange-600 to-red-950 rounded-[20px] flex items-center justify-center text-black font-black text-2xl shadow-lg">
                            {u.first_name[0]}
                          </div>
                          <div>
                            <div className="text-white font-black tracking-widest text-sm uppercase">{u.first_name} {u.last_name}</div>
                            <div className="text-[10px] text-slate-600 uppercase tracking-[0.2em] font-mono mt-1">{u.email}</div>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <button onClick={() => executeAction('elevate', u.id)} className="px-6 py-3 bg-orange-600/10 text-orange-500 border border-orange-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-orange-600 hover:text-black transition-all">Promote</button>
                          <button onClick={() => executeAction('exile', u.id)} className="px-6 py-3 bg-red-600/10 text-red-600 border border-red-600/20 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Exile</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}