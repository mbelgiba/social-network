"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [activeGroup, setActiveGroup] = useState<any | null>(null);
  const [groupPosts, setGroupPosts] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [newPostContent, setNewPostContent] = useState('');

  const fetchGroups = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/groups', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setGroups(data || []);
      }
    } catch(err) {}
  };

  useEffect(() => { 
    fetchGroups(); 
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
    fetchGroups();
  };

  const handleToggleJoin = async (groupId: string, e: any) => {
    e.stopPropagation();
    await fetch(`http://localhost:8080/api/groups/join?id=${groupId}`, { method: 'POST', credentials: 'include' });
    fetchGroups();
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

  return (
    <>
      <Navbar />
      <div className="flex h-[calc(100vh-120px)] max-w-[1400px] mx-auto px-6 gap-8 pb-10 relative z-10">
        
        {/* Groups Sidebar */}
        <div className="glass-panel w-80 rounded-[32px] flex flex-col overflow-hidden border border-red-500/10 shadow-lg">
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <h2 className="text-xl font-black text-red-500 uppercase tracking-[0.2em]">Sectors</h2>
            <button onClick={() => setIsModalOpen(true)} className="bg-red-700 text-white w-8 h-8 rounded-full font-black hover:bg-red-600 transition-colors shadow-crimson-glow flex items-center justify-center hover:scale-110 active:scale-90">
              +
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {groups.map((group, index) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                key={group.id} 
                onClick={() => setActiveGroup(group)}
                className={`p-6 rounded-[24px] cursor-pointer transition-all border ${
                  activeGroup?.id === group.id ? 'bg-red-900/10 border-red-500/30 shadow-crimson-glow' : 'border-transparent hover:bg-white/5'
                }`}
              >
                <div className="font-black text-slate-100 mb-2 tracking-wide uppercase">{group.name}</div>
                <div className="text-slate-500 text-[10px] font-light mb-5 truncate leading-relaxed">{group.description}</div>
                <button 
                  onClick={(e) => handleToggleJoin(group.id, e)}
                  className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    group.is_member ? 'border border-red-500/30 text-red-500 hover:bg-red-500/10' : 'bg-red-700 text-white shadow-crimson-glow hover:bg-red-600 hover:scale-[1.02]'
                  }`}
                >
                  {group.is_member ? 'Leave Sector' : 'Enter Sector'}
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Group Content Area */}
        <div className="glass-panel flex-1 rounded-[32px] flex flex-col overflow-hidden border border-red-500/10 shadow-lg relative">
          {activeGroup ? (
            <>
              <div className="p-10 border-b border-white/5 bg-gradient-to-b from-red-950/20 to-transparent relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-bl-full blur-3xl"></div>
                <h2 className="text-4xl font-black text-white tracking-wide mb-3 uppercase relative z-10">{activeGroup.name}</h2>
                <p className="text-slate-400 font-light leading-relaxed max-w-2xl relative z-10">{activeGroup.description}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#0a0a0a]/30">
                {!activeGroup.is_member ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-600">
                    <span className="text-4xl mb-4">🔒</span>
                    <span className="text-xs font-black uppercase tracking-[0.3em]">Access Denied. Enter sector to view data.</span>
                  </div>
                ) : (
                  <>
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 p-6 rounded-[24px] border border-red-500/10 shadow-lg">
                      <textarea 
                        value={newPostContent} 
                        onChange={(e) => setNewPostContent(e.target.value)} 
                        placeholder="Broadcast to sector..." 
                        className="w-full bg-transparent text-white outline-none resize-none mb-4 font-light placeholder:text-slate-600"
                      />
                      <div className="flex justify-end">
                        <button onClick={handleCreatePost} className="bg-red-700 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 shadow-crimson-glow transition-all hover:scale-105 active:scale-95">
                          Transmit
                        </button>
                      </div>
                    </motion.div>
                    
                    <AnimatePresence>
                      {groupPosts.map((post, index) => (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          key={post.id} 
                          className="bg-white/[0.02] p-8 rounded-[32px] border border-white/5 hover:border-red-500/20 transition-all"
                        >
                          <div className="flex items-center gap-4 mb-5">
                            <div className="w-10 h-10 rounded-full bg-red-950 flex justify-center items-center text-red-500 font-black text-sm border border-red-500/30">
                              {post.author[0]}
                            </div>
                            <div className="text-white font-black tracking-wide uppercase text-sm">{post.author}</div>
                          </div>
                          <p className="text-slate-300 font-light leading-relaxed whitespace-pre-wrap">{post.content}</p>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
              <span className="text-4xl mb-4 animate-pulse text-red-900">🗄️</span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Select Sector to initialize data stream</span>
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-[#0a0a0a]/90 backdrop-blur-xl flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-panel w-full max-w-md p-10 rounded-[40px] border border-red-500/30 shadow-crimson-bold bg-[#050505]">
              <h2 className="text-2xl font-black text-red-600 uppercase tracking-[0.2em] mb-6">Initialize Sector</h2>
              <input 
                type="text" 
                value={newGroup.name} 
                onChange={e => setNewGroup({...newGroup, name: e.target.value})} 
                placeholder="Sector Designation" 
                className="w-full bg-white/5 border border-white/10 text-white px-5 py-4 rounded-2xl mb-4 outline-none focus:border-red-600/50 transition-all font-light" 
              />
              <textarea 
                value={newGroup.description} 
                onChange={e => setNewGroup({...newGroup, description: e.target.value})} 
                placeholder="Parameters & Description" 
                className="w-full bg-white/5 border border-white/10 text-white px-5 py-4 rounded-2xl mb-8 outline-none focus:border-red-600/50 transition-all font-light h-32 resize-none" 
              />
              <div className="flex gap-4">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 border border-white/10 text-slate-400 rounded-2xl uppercase tracking-widest text-[10px] font-black hover:text-white transition-colors">Abort</button>
                <button onClick={handleCreateGroup} className="flex-1 py-4 bg-red-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-600 shadow-crimson-glow transition-all">Create</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}