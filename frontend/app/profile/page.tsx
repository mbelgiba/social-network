"use client";

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  avatar: string;
  nickname: string;
  about_me: string;
  is_public: boolean;
  role: string;
  is_active: boolean;
  created_at: string;
  followers_count: number;
  following_count: number;
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', about_me: '' });
  const [editAvatar, setEditAvatar] = useState<File | null>(null);

  const fetchProfileData = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8080/api/profile', { credentials: 'include' });
      if (!res.ok) throw new Error('Unauthorized');
      const data = await res.json();
      setProfile(data);
      setEditForm({ 
        first_name: data.first_name || '', 
        last_name: data.last_name || '', 
        about_me: data.about_me || '' 
      });

      // Загрузка постов пользователя
      const pRes = await fetch(`http://localhost:8080/api/posts?user_id=${data.id}`, { credentials: 'include' });
      if (pRes.ok) {
        const posts = await pRes.json();
        setUserPosts(Array.isArray(posts) ? posts.filter((p: any) => p.user_id === data.id) : []);
      }
    } catch (err) {
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  // ТА САМАЯ ФУНКЦИЯ, КОТОРОЙ НЕ ХВАТАЛО
  const togglePrivacy = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/profile/privacy', { 
        method: 'POST', 
        credentials: 'include' 
      });
      if (res.ok) {
        fetchProfileData();
      }
    } catch (err) {
      console.error("Privacy protocol error:", err);
    }
  };

  const handleUpdateProfile = async () => {
    let avatarUrl = profile?.avatar || '';
    if (editAvatar) {
      const formData = new FormData(); 
      formData.append('image', editAvatar);
      const uploadRes = await fetch('http://localhost:8080/api/upload', { method: 'POST', body: formData, credentials: 'include' });
      if (uploadRes.ok) {
        const upData = await uploadRes.json();
        avatarUrl = upData.url;
      }
    }

    const res = await fetch('http://localhost:8080/api/profile/update', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editForm, avatar: avatarUrl }), 
      credentials: 'include'
    });

    if (res.ok) {
      setIsEditModalOpen(false);
      fetchProfileData();
    }
  };

  if (!profile) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-orange-600 font-black tracking-[0.5em] animate-pulse uppercase text-xs">Accessing Subject Master-File...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 pb-32">
      <Navbar />
      
      {/* ДИНАМИЧЕСКАЯ ОБЛОЖКА */}
      <div className="h-80 w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-orange-900/10 to-black z-0" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 z-10" />
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute inset-0 bg-orange-600/5 blur-3xl rounded-full translate-y-1/2" 
        />
        <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-[#050505] to-transparent z-20" />
      </div>

      <div className="max-w-[1200px] mx-auto px-6 relative z-30 -mt-32">
        
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          
          {/* ЛЕВАЯ КОЛОНКА: ИНФОРМАЦИОННЫЙ МОДУЛЬ */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="w-full lg:w-[400px] bg-black/80 backdrop-blur-2xl border border-orange-600/20 p-10 rounded-[56px] shadow-[0_0_80px_rgba(0,0,0,1)] sticky top-28"
          >
            <div className="flex flex-col items-center">
              <div className="relative mb-8">
                <div className="w-44 h-44 rounded-[42px] overflow-hidden border-2 border-orange-600/50 p-1 bg-black shadow-[0_0_30px_rgba(255,69,0,0.2)]">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover rounded-[38px] grayscale hover:grayscale-0 transition-all duration-700" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-600 to-red-900 flex justify-center items-center text-7xl font-black text-black">
                      {profile.first_name[0]}
                    </div>
                  )}
                </div>
                {profile.is_active && (
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }} 
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-black" 
                  />
                )}
              </div>

              <div className="text-center mb-8">
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-1">
                  {profile.first_name} {profile.last_name}
                </h2>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-orange-500 text-[10px] font-mono uppercase tracking-[0.3em]">@{profile.nickname || 'Subject_Node'}</span>
                  <div className="w-1 h-1 bg-slate-700 rounded-full" />
                  <span className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.2em]">{profile.role}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 w-full mb-8">
                <div className="text-center py-4 bg-white/[0.03] rounded-3xl border border-white/5">
                  <div className="text-2xl font-black text-white">{profile.followers_count || 0}</div>
                  <div className="text-[8px] text-slate-600 uppercase tracking-widest font-black">Followers</div>
                </div>
                <div className="text-center py-4 bg-white/[0.03] rounded-3xl border border-white/5">
                  <div className="text-2xl font-black text-white">{profile.following_count || 0}</div>
                  <div className="text-[8px] text-slate-600 uppercase tracking-widest font-black">Following</div>
                </div>
              </div>

              <div className="w-full space-y-3">
                <button 
                  onClick={() => setIsEditModalOpen(true)} 
                  className="w-full py-5 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl"
                >
                  Recalibrate Identity
                </button>
                <button 
                  onClick={togglePrivacy} 
                  className={`w-full py-5 border rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${profile.is_public ? 'border-orange-600/30 text-orange-500' : 'border-white/10 text-slate-400'}`}
                >
                  {profile.is_public ? 'Neural Shield: OFF' : 'Neural Shield: ACTIVE'}
                </button>
              </div>

              <div className="mt-10 pt-10 border-t border-white/5 w-full">
                <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] mb-6 px-2">Access Logs</h4>
                <div className="space-y-5 px-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-500 uppercase">Integrity</span>
                    <span className="text-green-500 font-bold uppercase">{profile.is_active ? 'Stable' : 'Exiled'}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-500 uppercase">Linked Since</span>
                    <span className="text-white font-mono">{new Date(profile.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-500 uppercase">Node UID</span>
                    <span className="text-orange-600 font-mono">{profile.id.slice(0, 12)}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ПРАВАЯ КОЛОНКА: ЛЕНТА СОБЫТИЙ */}
          <div className="flex-1 space-y-10">
            {/* СЕКЦИЯ БИО */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
              className="bg-white/[0.02] border border-orange-600/10 p-12 rounded-[56px] shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8">
                <div className="text-[40px] opacity-10">📜</div>
              </div>
              <h3 className="text-white text-xs font-black uppercase tracking-[0.5em] mb-8 flex items-center gap-4">
                <div className="w-2 h-2 bg-orange-600 rotate-45" /> Biometric Dossier
              </h3>
              <p className="text-slate-400 text-xl font-light leading-relaxed italic border-l-2 border-orange-600/20 pl-8 py-2">
                {profile.about_me ? `"${profile.about_me}"` : "Subject has provided no biographical data for the Nexus archives."}
              </p>
            </motion.div>

            {/* СЕКЦИЯ ПОСТОВ */}
            <div className="space-y-8">
              <h3 className="text-white text-xs font-black uppercase tracking-[0.5em] ml-6 mb-10 flex items-center gap-4">
                <div className="w-2 h-2 bg-orange-600 rotate-45" /> Signal History
              </h3>
              
              <div className="grid gap-6">
                {userPosts.length > 0 ? userPosts.map((post, idx) => (
                  <motion.div 
                    key={post.id} 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-black/60 border border-white/5 p-10 rounded-[48px] hover:border-orange-600/20 transition-all group"
                  >
                    <div className="flex justify-between items-center mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse" />
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Post_ID: {post.id.slice(0,8)}</span>
                      </div>
                      <span className="text-[10px] font-mono text-orange-600 uppercase tracking-widest">{new Date(post.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-300 text-lg font-light leading-relaxed mb-8">{post.content}</p>
                    {post.image_url && (
                      <div className="rounded-[32px] overflow-hidden border border-white/5 mb-8">
                        <img src={post.image_url} className="w-full max-h-[500px] object-cover grayscale group-hover:grayscale-0 transition-all duration-1000" />
                      </div>
                    )}
                    <div className="flex gap-6 border-t border-white/5 pt-8">
                      <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Likes: {post.like_count}</div>
                      <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Comments: {post.comment_count}</div>
                    </div>
                  </motion.div>
                )) : (
                  <div className="text-center py-32 bg-white/[0.01] border border-dashed border-white/10 rounded-[56px]">
                    <div className="text-4xl mb-6 opacity-20">📡</div>
                    <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em]">No active signals detected from this node.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* МОДАЛКА РЕДАКТИРОВАНИЯ */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black/98 backdrop-blur-xl z-[1000] flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#050505] border border-orange-600/30 p-14 rounded-[64px] w-full max-w-2xl shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-600 to-transparent" />
              
              <h2 className="text-4xl font-black text-white uppercase tracking-[0.3em] mb-12 text-center">Rewrite Identity</h2>
              
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[9px] uppercase tracking-widest text-slate-500 ml-4">Given Name</label>
                    <input type="text" value={editForm.first_name} onChange={e => setEditForm({...editForm, first_name: e.target.value})} className="w-full bg-white/5 border border-white/10 text-white px-8 py-5 rounded-3xl outline-none focus:border-orange-600/40 transition-all" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] uppercase tracking-widest text-slate-500 ml-4">Family Name</label>
                    <input type="text" value={editForm.last_name} onChange={e => setEditForm({...editForm, last_name: e.target.value})} className="w-full bg-white/5 border border-white/10 text-white px-8 py-5 rounded-3xl outline-none focus:border-orange-600/40 transition-all" />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label className="text-[9px] uppercase tracking-widest text-slate-500 ml-4">Subject Narrative (Bio)</label>
                  <textarea value={editForm.about_me} onChange={e => setEditForm({...editForm, about_me: e.target.value})} className="w-full bg-white/5 border border-white/10 text-white px-8 py-5 rounded-3xl outline-none focus:border-orange-600/40 h-44 resize-none font-light" />
                </div>

                <div className="bg-white/5 p-8 rounded-3xl border border-white/10 group hover:border-orange-600/30 transition-all">
                  <span className="text-[9px] uppercase tracking-widest text-slate-500 block mb-4">Neural Scan (Avatar)</span>
                  <input type="file" onChange={(e) => setEditAvatar(e.target.files ? e.target.files[0] : null)} className="text-[10px] text-slate-400 file:bg-orange-600 file:text-black file:border-0 file:px-6 file:py-2 file:rounded-xl file:mr-6 file:font-black file:uppercase file:tracking-widest" />
                </div>
              </div>

              <div className="flex gap-6 mt-14">
                <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-6 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Cancel Protocol</button>
                <button onClick={handleUpdateProfile} className="flex-1 py-6 bg-orange-600 text-black rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 transition-all shadow-2xl shadow-orange-900/40">Confirm Injection</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}