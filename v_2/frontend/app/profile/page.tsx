"use client";

import { useEffect, useState } from 'react';
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
  created_at: string;
  is_following: boolean;
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', about_me: '' });
  const [editAvatar, setEditAvatar] = useState<File | null>(null);

  const fetchProfile = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/profile', { credentials: 'include' });
      if (!res.ok) throw new Error('');
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      window.location.href = '/login';
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/users', { credentials: 'include' });
      if (res.ok) {
        const uData = await res.json();
        setUsers(uData || []);
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchProfile();
    fetchUsers();
  }, []);

  const togglePrivacy = async () => {
    await fetch('http://localhost:8080/api/profile/privacy', { method: 'POST', credentials: 'include' });
    fetchProfile();
  };

  const handleFollow = async (userId: string) => {
    const res = await fetch(`http://localhost:8080/api/users/follow?id=${userId}`, { method: 'POST', credentials: 'include' });
    if (res.ok) fetchUsers();
  };

  const openEditModal = () => {
    setEditForm({ 
      first_name: profile!.first_name, 
      last_name: profile!.last_name, 
      about_me: profile!.about_me || '' 
    });
    setIsEditModalOpen(true);
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
      fetchProfile();
    }
  };

  if (!profile) return <div className="text-center mt-20 text-red-500 uppercase tracking-[0.3em] font-bold animate-pulse">Initializing Profile...</div>;

  return (
    <>
      <Navbar />
      <div className="max-w-[1000px] mx-auto px-6 pb-20 relative z-10">
        
        {/* Main Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-10 rounded-[40px] mb-12 relative overflow-hidden border border-red-500/10 shadow-lg">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-bl-full blur-3xl"></div>
          <div className="flex items-center gap-8 mb-10 relative z-10">
            {profile.avatar ? (
              <img src={profile.avatar} alt="Avatar" className="w-32 h-32 rounded-full object-cover border border-red-500/30 shadow-crimson-glow grayscale-[0.2]" />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex justify-center items-center text-5xl font-black text-white shadow-crimson-glow">
                {profile.first_name[0]}
              </div>
            )}
            <div>
              <h2 className="text-4xl font-black text-white tracking-wide uppercase">{profile.first_name} {profile.last_name}</h2>
              <div className="text-red-500/70 text-xs uppercase tracking-[0.2em] mt-1 mb-6">{profile.email}</div>
              <button onClick={openEditModal} className="text-white border border-red-500/50 hover:bg-red-600 hover:border-red-600 px-6 py-2 rounded-2xl transition-all text-[10px] uppercase tracking-widest font-bold shadow-crimson-glow hover:scale-105 active:scale-95">
                Configure Identity
              </button>
            </div>
          </div>

          <div className="grid gap-6 relative z-10">
            <div className="bg-white/5 p-6 rounded-[24px] border border-white/5">
              <span className="text-slate-500 text-[10px] uppercase tracking-widest block mb-2 font-black">Biography Data</span>
              <div className="text-slate-300 font-light leading-relaxed">{profile.about_me || 'No data provided in system core.'}</div>
            </div>
            <button onClick={togglePrivacy} className="w-full bg-[#050505] border border-red-500/20 hover:border-red-500/50 py-4 rounded-[24px] transition-colors text-xs uppercase tracking-[0.2em] font-black shadow-inner">
              Profile Status: <span className={profile.is_public ? 'text-green-500 drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'text-red-500 drop-shadow-[0_0_5px_rgba(225,29,72,0.5)]'}>{profile.is_public ? 'PUBLIC' : 'RESTRICTED'}</span>
            </button>
          </div>
        </motion.div>

        {/* Users List */}
        <h2 className="text-2xl font-black text-red-600 mb-8 px-2 uppercase tracking-[0.2em] flex items-center gap-3">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
          Network Nodes
        </h2>
        <div className="grid gap-4">
          {users.map((user, index) => (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              key={user.id} 
              className="glass-panel flex items-center justify-between p-6 rounded-[24px] border border-transparent hover:border-red-500/30 hover:bg-white/[0.02] transition-all"
            >
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0a0a0a] to-red-950/50 flex justify-center items-center text-red-500 font-black text-xl border border-red-500/20 shadow-inner">
                  {user.first_name[0]}
                </div>
                <div>
                  <div className="text-white font-bold tracking-wide uppercase">{user.first_name} {user.last_name}</div>
                  <div className="text-slate-500 text-[10px] tracking-widest uppercase mt-1">{user.email}</div>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleFollow(user.id)} 
                  className={`px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${user.is_following ? 'border border-red-500/30 text-red-500 hover:bg-red-500/10' : 'bg-red-700 text-white hover:bg-red-600 shadow-crimson-glow hover:scale-105 active:scale-95'}`}
                >
                  {user.is_following ? 'Disconnect' : 'Connect'}
                </button>
                <button onClick={() => { setSelectedUser(user); setIsModalOpen(true); }} className="border border-white/10 text-slate-400 px-6 py-2.5 rounded-2xl text-[10px] uppercase tracking-widest font-black hover:text-white hover:bg-white/5 transition-all">
                  Inspect
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Modals */}
        <AnimatePresence>
          {isEditModalOpen && (
            <div className="fixed inset-0 bg-[#0a0a0a]/90 backdrop-blur-xl flex justify-center items-center z-50 p-4">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-panel w-full max-w-md p-10 rounded-[40px] border border-red-500/30 shadow-crimson-bold flex flex-col gap-6 bg-[#050505]">
                <h2 className="text-2xl font-black text-red-600 uppercase tracking-[0.2em] mb-2">Modify Identity</h2>
                <input type="text" value={editForm.first_name} onChange={e => setEditForm({...editForm, first_name: e.target.value})} placeholder="First Name" className="bg-white/5 border border-white/10 text-white px-5 py-4 rounded-2xl outline-none focus:border-red-600/50 transition-all font-light" />
                <input type="text" value={editForm.last_name} onChange={e => setEditForm({...editForm, last_name: e.target.value})} placeholder="Last Name" className="bg-white/5 border border-white/10 text-white px-5 py-4 rounded-2xl outline-none focus:border-red-600/50 transition-all font-light" />
                <textarea value={editForm.about_me} onChange={e => setEditForm({...editForm, about_me: e.target.value})} placeholder="Biography..." className="bg-white/5 border border-white/10 text-white px-5 py-4 rounded-2xl outline-none focus:border-red-600/50 transition-all font-light resize-none h-32" />
                <input type="file" accept="image/*" onChange={(e) => setEditAvatar(e.target.files ? e.target.files[0] : null)} className="text-slate-500 text-xs font-light file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-red-500/10 file:text-red-500 hover:file:bg-red-500/20" />
                <div className="flex gap-4 mt-4">
                  <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-4 border border-white/10 text-slate-400 rounded-2xl uppercase tracking-widest text-[10px] font-black hover:text-white hover:bg-white/5 transition-colors">Abort</button>
                  <button onClick={handleUpdateProfile} className="flex-1 py-4 bg-red-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-600 shadow-crimson-glow transition-all">Save Changes</button>
                </div>
              </motion.div>
            </div>
          )}

          {isModalOpen && selectedUser && (
            <div className="fixed inset-0 bg-[#0a0a0a]/90 backdrop-blur-xl flex justify-center items-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="glass-panel w-full max-w-sm p-10 rounded-[40px] border border-red-500/30 relative bg-[#050505] shadow-crimson-bold">
                <div className="text-center mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-red-600 to-red-950 mx-auto mb-6 rounded-full flex justify-center items-center text-4xl font-black text-white shadow-crimson-glow border border-red-500/50">{selectedUser.first_name[0]}</div>
                  <h2 className="text-2xl font-black text-white tracking-wide uppercase">{selectedUser.first_name} {selectedUser.last_name}</h2>
                  <p className="text-red-500/70 text-[10px] uppercase tracking-[0.2em] mt-2 font-bold">{selectedUser.email}</p>
                </div>
                <div className="bg-white/5 p-6 rounded-[24px] border border-white/5">
                  <span className="text-slate-500 text-[10px] uppercase tracking-widest block mb-3 font-black">Biography Data</span>
                  <div className="text-slate-300 font-light text-sm leading-relaxed">{selectedUser.about_me || 'No data provided in system core.'}</div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}