"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';

// Компонент демонического змеиного глаза
const DemonicEye = ({ flip = false }: { flip?: boolean }) => (
  <motion.div
    animate={{ 
      y: [0, -15, 0], 
      rotateZ: flip ? [0, 3, 0] : [0, -3, 0],
      filter: ['drop-shadow(0 0 10px rgba(225,29,72,0.3))', 'drop-shadow(0 0 30px rgba(225,29,72,0.8))', 'drop-shadow(0 0 10px rgba(225,29,72,0.3))']
    }}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    className={`absolute top-1/2 -translate-y-1/2 w-28 h-56 pointer-events-none z-10 ${flip ? '-right-36' : '-left-36'}`}
  >
    <div className="absolute inset-0 bg-red-600/20 blur-3xl rounded-full animate-pulse" />
    <svg viewBox="0 0 100 200" className="w-full h-full relative z-10">
      <path d="M50 10 Q90 100 50 190 Q10 100 50 10" fill="#050505" stroke="#e11d48" strokeWidth="2" />
      <path d="M50 20 Q80 100 50 180 Q20 100 50 20" fill="url(#eyeGradient)" />
      <motion.ellipse 
        cx="50" cy="100" rx="3" ry="50" 
        fill="#000" 
        animate={{ ry: [50, 5, 50, 50, 50], rx: [3, 8, 3, 3, 3] }}
        transition={{ duration: 5, repeat: Infinity, times: [0, 0.05, 0.1, 0.5, 1] }} 
      />
      <defs>
        <radialGradient id="eyeGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff003c" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#4a0010" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#050505" stopOpacity="0.1" />
        </radialGradient>
      </defs>
    </svg>
  </motion.div>
);

// Компонент стекающей крови (Кровавые слезы)
const BloodRain = () => {
  const [drops, setDrops] = useState<{id: number, left: string, delay: number, duration: number, height: string}[]>([]);

  useEffect(() => {
    // Генерируем 30 капель с рандомными параметрами
    const generatedDrops = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: Math.random() * 5,
      duration: Math.random() * 4 + 3, // от 3 до 7 секунд
      height: `${Math.random() * 80 + 30}px`,
    }));
    setDrops(generatedDrops);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Стекающие капли */}
      {drops.map(drop => (
        <motion.div
          key={drop.id}
          initial={{ y: -150, opacity: 0 }}
          animate={{ y: '120vh', opacity: [0, 0.8, 0.8, 0] }}
          transition={{ duration: drop.duration, delay: drop.delay, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 w-1 bg-gradient-to-b from-transparent via-red-600 to-red-900 rounded-b-full blur-[1px]"
          style={{ left: drop.left, height: drop.height }}
        />
      ))}
      {/* Кровавые пятна (Брызги) на заднем фоне */}
      <motion.div 
        animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.1, 1] }}
        transition={{ duration: 6, repeat: Infinity }}
        className="absolute top-[20%] left-[10%] w-64 h-64 bg-red-800/20 rounded-full blur-[80px]"
      />
      <motion.div 
        animate={{ opacity: [0.1, 0.4, 0.1], scale: [1, 1.2, 1] }}
        transition={{ duration: 8, repeat: Infinity, delay: 2 }}
        className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-red-900/20 rounded-full blur-[100px]"
      />
    </div>
  );
};

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('OVERRIDE');
  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [adForm, setAdForm] = useState({ title: '', content: '', link: '' });
  const [eventForm, setEventForm] = useState({ title: '', description: '', date: '', type: 'CRITICAL' });
  const [events, setEvents] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      // ЗАЩИТА СНЯТА: Теперь админка загрузит данные в любом случае, даже если бэкенд не дает роль 'admin'
      const uRes = await fetch('http://localhost:8080/api/users', { credentials: 'include' });
      if (uRes.ok) setUsers(await uRes.json() || []);
      
      const postRes = await fetch('http://localhost:8080/api/posts', { credentials: 'include' });
      if (postRes.ok) setPosts(await postRes.json() || []);
      
      const aRes = await fetch('http://localhost:8080/api/ads', { credentials: 'include' });
      if (aRes.ok) setAds(await aRes.json() || []);
    } catch (err) { 
      console.log("Data fetch error, but override is active.");
    }
  };

  useEffect(() => { fetchData(); }, []);

  const deleteItem = async (type: string, id: string) => {
    if (!confirm('Confirm purge operation? This action is irreversible.')) return;
    await fetch(`http://localhost:8080/api/admin/${type}/delete?id=${id}`, { method: 'POST', credentials: 'include' });
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

  const createEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title) return;
    setEvents([{ id: Date.now().toString(), ...eventForm }, ...events]);
    setEventForm({ title: '', description: '', date: '', type: 'CRITICAL' });
    alert('System Event Initialized.');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-hidden flex flex-col relative">
      <BloodRain />
      
      <div className="relative z-20">
        <Navbar />
      </div>
      
      <div className="flex-1 flex items-center justify-center p-6 relative z-10 mt-10">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative w-full max-w-6xl h-[75vh] glass-panel rounded-[40px] border border-red-500/30 flex flex-col md:flex-row overflow-visible shadow-crimson-bold bg-[#050505]/80 backdrop-blur-3xl"
        >
          {/* Левый и Правый Глаза */}
          <DemonicEye />
          <DemonicEye flip={true} />

          {/* Левая панель навигации (Tabs) */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-red-500/20 p-8 flex flex-col bg-black/40 rounded-l-[40px] relative z-20">
            <h1 className="text-2xl font-black text-red-600 mb-10 tracking-[0.3em] drop-shadow-md">NEXUS<br/><span className="text-[10px] text-slate-500">CONTROL</span></h1>
            <nav className="flex flex-col gap-4">
              {['OVERRIDE', 'AD_INJECT', 'EVENTS', 'USERS'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)}
                  className={`text-left px-4 py-3 rounded-xl text-[10px] uppercase tracking-[0.2em] font-black transition-all ${
                    activeTab === tab ? 'bg-red-600 text-white shadow-crimson-glow' : 'text-slate-500 hover:text-red-400 hover:bg-red-900/10'
                  }`}
                >
                  {tab.replace('_', ' ')}
                </button>
              ))}
            </nav>
            <div className="mt-auto pt-8 border-t border-red-500/20">
              <div className="text-[8px] text-red-500/50 uppercase tracking-widest font-mono">Status: God Mode</div>
              <div className="text-[8px] text-green-500/50 uppercase tracking-widest font-mono mt-1">Uplink: Secured</div>
            </div>
          </div>

          {/* Правая панель контента */}
          <div className="flex-1 p-10 overflow-y-auto relative z-20">
            <AnimatePresence mode="wait">
              
              {/* Вкладка OVERRIDE (Посты) */}
              {activeTab === 'OVERRIDE' && (
                <motion.div key="override" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <h2 className="text-xl font-black text-white uppercase tracking-[0.2em] border-b border-white/5 pb-4">Data Streams Purge</h2>
                  <div className="grid gap-4">
                    {posts.map(p => (
                      <div key={p.id} className="flex justify-between items-center bg-white/[0.02] p-5 rounded-2xl border border-white/5 hover:border-red-500/30 transition-colors">
                        <div className="truncate pr-4 w-full">
                          <span className="text-red-500 font-bold text-sm tracking-wide mr-2">{p.author}</span>
                          <span className="text-slate-400 font-light text-sm truncate">{p.content || '[Media Payload]'}</span>
                        </div>
                        <button onClick={() => deleteItem('posts', p.id)} className="bg-red-950/30 border border-red-500/50 text-red-500 hover:bg-red-600 hover:text-white px-5 py-2 rounded-xl text-[10px] uppercase tracking-widest font-bold transition-all shadow-crimson-glow">Purge</button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Вкладка ADS (Реклама) */}
              {activeTab === 'AD_INJECT' && (
                <motion.div key="ads" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <h2 className="text-xl font-black text-white uppercase tracking-[0.2em] border-b border-white/5 pb-4">Sponsored Payload Injection</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <input type="text" placeholder="Designation (Title)" value={adForm.title} onChange={e => setAdForm({...adForm, title: e.target.value})} className="bg-white/5 border border-white/10 text-white px-5 py-4 rounded-2xl outline-none focus:border-red-600/50 transition-all font-light" />
                    <input type="text" placeholder="Hyperlink URL" value={adForm.link} onChange={e => setAdForm({...adForm, link: e.target.value})} className="bg-white/5 border border-white/10 text-white px-5 py-4 rounded-2xl outline-none focus:border-red-600/50 transition-all font-light" />
                    <input type="text" placeholder="Payload / Content" value={adForm.content} onChange={e => setAdForm({...adForm, content: e.target.value})} className="md:col-span-2 bg-white/5 border border-white/10 text-white px-5 py-4 rounded-2xl outline-none focus:border-red-600/50 transition-all font-light" />
                    <button onClick={createAd} className="md:col-span-2 bg-red-700 text-white py-4 rounded-2xl font-black uppercase tracking-[0.3em] text-xs hover:bg-red-600 shadow-crimson-glow transition-all">Execute Injection</button>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {ads.map(a => (
                      <div key={a.id} className="bg-gradient-to-br from-white/[0.05] to-transparent p-6 rounded-[24px] border border-red-500/10 relative overflow-hidden">
                        <div className="absolute inset-0 bg-red-900/5 opacity-0 hover:opacity-100 transition-opacity pointer-events-none"></div>
                        <strong className="text-red-500 block mb-2 tracking-wide">{a.title}</strong>
                        <p className="text-sm font-light text-slate-400 mb-4 relative z-10">{a.content}</p>
                        <button onClick={() => deleteItem('ads', a.id)} className="w-full border border-red-500/30 text-red-500 py-2 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-red-600 hover:text-white transition-all relative z-10">Terminate</button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Вкладка EVENTS (События сети) */}
              {activeTab === 'EVENTS' && (
                <motion.div key="events" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <h2 className="text-xl font-black text-white uppercase tracking-[0.2em] border-b border-white/5 pb-4">Global Network Events</h2>
                  <form onSubmit={createEvent} className="bg-red-950/10 border border-red-500/20 p-6 rounded-[32px] grid gap-4 mb-8">
                    <div className="flex gap-4">
                      <input required type="text" placeholder="Event Codename" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} className="flex-1 bg-white/5 border border-white/10 text-white px-5 py-4 rounded-2xl outline-none focus:border-red-600/50 transition-all font-light" />
                      <select value={eventForm.type} onChange={e => setEventForm({...eventForm, type: e.target.value})} className="bg-white/5 border border-white/10 text-red-500 font-bold px-5 py-4 rounded-2xl outline-none focus:border-red-600/50 transition-all uppercase tracking-widest text-xs">
                        <option value="INFO">Information</option>
                        <option value="WARNING">Warning</option>
                        <option value="CRITICAL">Critical Alert</option>
                      </select>
                    </div>
                    <textarea required placeholder="Event Parameters..." value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} className="bg-white/5 border border-white/10 text-white px-5 py-4 rounded-2xl outline-none focus:border-red-600/50 transition-all font-light resize-none h-24" />
                    <button type="submit" className="bg-red-700 text-white py-4 rounded-2xl font-black uppercase tracking-[0.3em] text-xs hover:bg-red-600 shadow-crimson-glow transition-all">Broadcast Event</button>
                  </form>
                  <div className="space-y-4">
                    {events.map(ev => (
                      <div key={ev.id} className="flex gap-4 items-center bg-white/[0.02] p-5 rounded-2xl border border-white/5 border-l-4 border-l-red-600 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-900/20 to-transparent pointer-events-none"></div>
                        <div className="flex-1 relative z-10">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-red-500 font-black tracking-widest text-sm">{ev.title}</span>
                            <span className="bg-red-900/50 text-red-300 px-2 py-1 rounded text-[8px] uppercase tracking-widest">{ev.type}</span>
                          </div>
                          <p className="text-slate-400 text-xs">{ev.description}</p>
                        </div>
                        <button onClick={() => setEvents(events.filter(e => e.id !== ev.id))} className="text-slate-600 hover:text-red-500 uppercase text-[10px] font-black tracking-widest relative z-10">Clear</button>
                      </div>
                    ))}
                    {events.length === 0 && <div className="text-slate-600 text-xs font-mono uppercase">No active events in network.</div>}
                  </div>
                </motion.div>
              )}

              {/* Вкладка USERS (Пользователи) */}
              {activeTab === 'USERS' && (
                <motion.div key="users" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <h2 className="text-xl font-black text-white uppercase tracking-[0.2em] border-b border-white/5 pb-4">Identity Matrix</h2>
                  <div className="grid gap-4">
                    {users.map(u => (
                      <div key={u.id} className="flex justify-between items-center bg-white/[0.02] p-5 rounded-2xl border border-white/5 hover:border-red-500/20 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-red-900/30 rounded-full flex items-center justify-center text-red-500 font-black">{u.first_name[0]}</div>
                          <div>
                            <div className="text-white font-bold tracking-wide text-sm">{u.first_name} {u.last_name}</div>
                            <div className="text-slate-500 text-[10px] uppercase tracking-widest">{u.email}</div>
                          </div>
                        </div>
                        <button onClick={() => deleteItem('users', u.id)} className="border border-red-500/50 text-red-500 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest font-bold transition-all shadow-[0_0_10px_rgba(225,29,72,0)] hover:shadow-crimson-glow">Eradicate</button>
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