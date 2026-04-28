"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';

// --- КОМПОНЕНТ ОКА САУРОНА ---
const SauronEye = () => (
  <motion.div
    animate={{ 
      filter: [
        'drop-shadow(0 0 10px rgba(255, 69, 0, 0.2))', 
        'drop-shadow(0 0 25px rgba(255, 0, 0, 0.5))', 
        'drop-shadow(0 0 10px rgba(255, 69, 0, 0.2))'
      ]
    }}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    className="fixed top-24 left-10 w-24 h-48 pointer-events-none z-0 hidden xl:block opacity-30"
  >
    <svg viewBox="0 0 100 200" className="w-full h-full">
      <defs>
        <radialGradient id="eyeGradientGroups" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffea00" />
          <stop offset="30%" stopColor="#ff8c00" />
          <stop offset="70%" stopColor="#ff4500" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="100" r="40" fill="url(#eyeGradientGroups)" />
      <motion.ellipse 
        cx="50" cy="100" rx="4" ry="60" fill="#000"
        animate={{ scaleX: [1, 1.6, 1] }}
        transition={{ duration: 5, repeat: Infinity }}
      />
    </svg>
  </motion.div>
);

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [activeGroup, setActiveGroup] = useState<any | null>(null);
  const [groupPosts, setGroupPosts] = useState<any[]>([]);
  const [user, setUser] = useState<{id: string, role: string} | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [newPostContent, setNewPostContent] = useState('');

  const fetchData = async () => {
    try {
      const uRes = await fetch('http://localhost:8080/api/profile', { credentials: 'include' });
      if (uRes.ok) setUser(await uRes.json());

      const res = await fetch('http://localhost:8080/api/groups', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setGroups(data || []);
      }
    } catch(err) {}
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  const fetchGroupPosts = async (groupId: string) => {
    try {
      const res = await fetch(`http://localhost:8080/api/groups/posts?id=${groupId}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setGroupPosts(data || []);
      }
    } catch(err) {}
  };

  useEffect(() => {
    if (activeGroup?.is_member) {
      fetchGroupPosts(activeGroup.id);
    } else {
      setGroupPosts([]);
    }
  }, [activeGroup]);

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) return;
    await fetch('http://localhost:8080/api/groups/create', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newGroup), 
      credentials: 'include'
    });
    setNewGroup({ name: '', description: '' });
    setIsModalOpen(false);
    fetchData();
  };

  const handleToggleJoin = async (groupId: string, e: any) => {
    e.stopPropagation();
    await fetch(`http://localhost:8080/api/groups/join?id=${groupId}`, { method: 'POST', credentials: 'include' });
    fetchData();
    if (activeGroup?.id === groupId) {
      setActiveGroup({ ...activeGroup, is_member: !activeGroup.is_member });
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !activeGroup) return;
    await fetch(`http://localhost:8080/api/groups/posts/create?id=${activeGroup.id}`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newPostContent }), 
      credentials: 'include'
    });
    setNewPostContent('');
    fetchGroupPosts(activeGroup.id);
  };

  // ФУНКЦИЯ ВЛАСТИ: Испепеление сектора админом
  const incinerateGroup = async (groupId: string, e: any) => {
    e.stopPropagation();
    if(!confirm('INCINERATE THIS SECTOR? ALL DATA WILL BE LOST.')) return;
    const res = await fetch(`http://localhost:8080/api/admin/groups/incinerate?id=${groupId}`, {
      method: 'POST',
      credentials: 'include'
    });
    if (res.ok) {
      if (activeGroup?.id === groupId) setActiveGroup(null);
      fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300">
      <Navbar />
      <SauronEye />
      
      <div className="flex h-[calc(100vh-120px)] max-w-[1400px] mx-auto px-6 gap-8 pb-10 relative z-10">
        
        {/* Groups Sidebar (Sectors) */}
        <div className="bg-black/40 backdrop-blur-md w-80 rounded-[32px] flex flex-col overflow-hidden border border-orange-500/10 shadow-lg">
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <h2 className="text-xl font-black text-orange-600 uppercase tracking-[0.2em]">Sectors</h2>
            <button onClick={() => setIsModalOpen(true)} className="bg-orange-700 text-white w-8 h-8 rounded-full font-black hover:bg-orange-600 transition-colors shadow-lg flex items-center justify-center hover:scale-110 active:scale-90">
              +
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
            {groups.map((group, index) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                key={group.id} 
                onClick={() => setActiveGroup(group)}
                className={`p-6 rounded-[24px] cursor-pointer transition-all border relative group/item ${
                  activeGroup?.id === group.id ? 'bg-orange-950/20 border-orange-500/40 shadow-[0_0_15px_rgba(249,115,22,0.15)]' : 'border-transparent hover:bg-white/5'
                }`}
              >
                {user?.role === 'admin' && (
                  <button 
                    onClick={(e) => incinerateGroup(group.id, e)}
                    className="absolute top-2 right-2 opacity-0 group-hover/item:opacity-100 text-[8px] font-black text-red-500 uppercase tracking-widest hover:text-white transition-all"
                  >
                    [ incinerate ]
                  </button>
                )}
                <div className="font-black text-slate-100 mb-2 tracking-wide uppercase text-sm">{group.name}</div>
                <div className="text-slate-500 text-[10px] font-light mb-5 truncate leading-relaxed">{group.description}</div>
                <button 
                  onClick={(e) => handleToggleJoin(group.id, e)}
                  className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    group.is_member ? 'border border-orange-500/30 text-orange-500 hover:bg-orange-500/10' : 'bg-orange-700 text-white shadow-lg hover:bg-orange-600'
                  }`}
                >
                  {group.is_member ? 'Leave Sector' : 'Enter Sector'}
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Group Content Area */}
        <div className="bg-black/40 backdrop-blur-md flex-1 rounded-[32px] flex flex-col overflow-hidden border border-orange-500/10 shadow-lg relative">
          {activeGroup ? (
            <>
              <div className="p-10 border-b border-white/5 bg-gradient-to-b from-orange-950/20 to-transparent relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/5 rounded-bl-full blur-3xl"></div>
                <h2 className="text-4xl font-black text-white tracking-wide mb-3 uppercase relative z-10">{activeGroup.name}</h2>
                <p className="text-slate-400 font-light leading-relaxed max-w-2xl relative z-10">{activeGroup.description}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#0a0a0a]/30 custom-scrollbar">
                {!activeGroup.is_member ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-700">
                    <span className="text-4xl mb-4">🔒</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Sector Access Denied.</span>
                  </div>
                ) : (
                  <>
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 p-6 rounded-[24px] border border-orange-500/10 shadow-lg">
                      <textarea 
                        value={newPostContent} 
                        onChange={(e) => setNewPostContent(e.target.value)} 
                        placeholder="Broadcast to sector..." 
                        className="w-full bg-transparent text-white outline-none resize-none mb-4 font-light placeholder:text-slate-600 text-sm"
                      />
                      <div className="flex justify-end">
                        <button onClick={handleCreatePost} className="bg-orange-700 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all">
                          Transmit
                        </button>
                      </div>
                    </motion.div>
                    <AnimatePresence>
                      {groupPosts.map((post, index) => (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          key={post.id} 
                          className="bg-white/[0.02] p-8 rounded-[32px] border border-white/5 hover:border-orange-500/20 transition-all"
                        >
                          <div className="flex items-center gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-orange-950/40 flex justify-center items-center text-orange-500 font-black text-sm border border-orange-500/20">
                              {post.author ? post.author[0] : 'N'}
                            </div>
                            <div className="text-white font-black tracking-wide uppercase text-xs">{post.author}</div>
                          </div>
                          <p className="text-slate-400 font-light leading-relaxed whitespace-pre-wrap text-sm">{post.content}</p>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-700">
              <span className="text-4xl mb-4 animate-pulse">👁️</span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Initialize data stream for Sector</span>
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-[#0a0a0a]/95 backdrop-blur-xl flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-md p-10 rounded-[40px] border border-orange-600/30 bg-[#050505] shadow-2xl">
              <h2 className="text-2xl font-black text-orange-600 uppercase tracking-[0.2em] mb-8 text-center">Establish Sector</h2>
              <input 
                type="text" 
                value={newGroup.name} 
                onChange={e => setNewGroup({...newGroup, name: e.target.value})} 
                placeholder="Sector Designation" 
                className="w-full bg-white/5 border border-white/10 text-white px-6 py-5 rounded-2xl mb-5 outline-none focus:border-orange-600/50 transition-all font-light" 
              />
              <textarea 
                value={newGroup.description} 
                onChange={e => setNewGroup({...newGroup, description: e.target.value})} 
                placeholder="Operational Parameters" 
                className="w-full bg-white/5 border border-white/10 text-white px-6 py-5 rounded-2xl mb-10 outline-none focus:border-orange-600/50 transition-all font-light h-32 resize-none" 
              />
              <div className="flex gap-4">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-500 rounded-2xl uppercase tracking-widest text-[10px] font-black hover:text-white transition-colors">Abort</button>
                <button onClick={handleCreateGroup} className="flex-1 py-4 bg-orange-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-orange-600 transition-all shadow-lg shadow-orange-900/20">Establish</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}