"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const [ads, setAds] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentsData, setCommentsData] = useState<Record<string, any[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostElementRef = useCallback((node: HTMLDivElement) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore]);

  useEffect(() => {
    const init = async () => {
      try {
        const authRes = await fetch('http://localhost:8080/api/check-auth', { credentials: 'include' });
        if (!authRes.ok) { router.push('/login'); return; }
        const data = await authRes.json();
        setCurrentUserId(data.user_id);
        
        const aRes = await fetch('http://localhost:8080/api/ads', { credentials: 'include' });
        if (aRes.ok) {
          const adData = await aRes.json();
          setAds(adData || []);
        }
      } catch (err) {}
    };
    init();
  }, [router]);

  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
  }, [searchQuery]);

  useEffect(() => {
    const loadPosts = async () => {
      setIsLoading(true);
      try {
        const url = `http://localhost:8080/api/posts?page=${page}&limit=5&search=${encodeURIComponent(searchQuery)}`;
        const pRes = await fetch(url, { credentials: 'include' });
        if (pRes.ok) {
          const newPosts = await pRes.json() || [];
          if (newPosts.length < 5) setHasMore(false);
          setPosts(prev => page === 1 ? newPosts : [...prev, ...newPosts]);
        }
      } catch (err) {}
      setIsLoading(false);
    };
    loadPosts();
  }, [page, searchQuery]);

  const handlePostSubmit = async () => {
    if (!content.trim() && !selectedImage) return;
    let imageUrl = '';
    
    if (selectedImage) {
      const formData = new FormData(); 
      formData.append('image', selectedImage);
      try {
        const uploadRes = await fetch('http://localhost:8080/api/upload', { method: 'POST', body: formData, credentials: 'include' });
        if (uploadRes.ok) { 
          const upData = await uploadRes.json();
          imageUrl = upData.url; 
        }
      } catch (err) {}
    }
    
    await fetch('http://localhost:8080/api/posts/create', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, image_url: imageUrl }), 
      credentials: 'include'
    });
    
    setContent(''); 
    setSelectedImage(null); 
    setPage(1); 
    setHasMore(true);
    
    if(searchQuery !== '') {
      router.push('/');
    } else {
      const pRes = await fetch(`http://localhost:8080/api/posts?page=1&limit=5`, { credentials: 'include' });
      const freshPosts = await pRes.json();
      setPosts(freshPosts || []);
    }
  };

  const deleteOwnPost = async (postId: string) => {
    if(!confirm('Purge this data record?')) return;
    await fetch(`http://localhost:8080/api/posts/delete-own?id=${postId}`, { method: 'POST', credentials: 'include' });
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const startEditing = (post: any) => {
    setEditingPostId(post.id);
    setEditContent(post.content);
  };

  const saveEditPost = async (postId: string) => {
    await fetch(`http://localhost:8080/api/posts/edit-own?id=${postId}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: editContent }), credentials: 'include'
    });
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, content: editContent } : p));
    setEditingPostId(null);
  };

  const handleLike = async (postId: string) => {
    await fetch(`http://localhost:8080/api/posts/like?id=${postId}`, { method: 'POST', credentials: 'include' });
    setPosts(prev => prev.map(p => {
      if (p.id === postId) return { ...p, is_liked: !p.is_liked, like_count: p.is_liked ? p.like_count - 1 : p.like_count + 1 };
      return p;
    }));
  };

  const toggleComments = async (postId: string) => {
    setOpenComments(prev => ({ ...prev, [postId]: !prev[postId] }));
    if (!openComments[postId]) {
      const res = await fetch(`http://localhost:8080/api/comments?id=${postId}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCommentsData(prev => ({ ...prev, [postId]: data || [] }));
      }
    }
  };

  const handleCommentSubmit = async (postId: string) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;
    await fetch(`http://localhost:8080/api/comments/create?id=${postId}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: text }), credentials: 'include'
    });
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    const res = await fetch(`http://localhost:8080/api/comments?id=${postId}`, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setCommentsData(prev => ({ ...prev, [postId]: data || [] }));
    }
  };

  const renderContentWithHashtags = (text: string) => {
    return text.split(/(#[a-zA-Z0-9_а-яА-ЯёЁөқғңүұі]+)/g).map((part, i) => {
      if (part.startsWith('#')) {
        return (
          <span key={i} onClick={(e) => { e.stopPropagation(); router.push(`/?search=${encodeURIComponent(part)}`); }} className="text-red-500 font-bold hover:text-red-400 cursor-pointer transition-colors drop-shadow-[0_0_5px_rgba(225,29,72,0.3)]">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <>
      <Navbar />
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-8 px-6 max-w-[1400px] mx-auto pb-20 relative z-10">
        
        {/* Левая панель навигации */}
        <div className="hidden lg:flex flex-col gap-4">
          <div className="glass-panel p-8 rounded-[32px] sticky top-24 border border-red-500/5">
            <ul className="flex flex-col gap-6 text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black">
              <li onClick={() => router.push('/')} className={`cursor-pointer transition-transform hover:translate-x-2 ${!searchQuery ? 'text-red-500 drop-shadow-[0_0_8px_rgba(225,29,72,0.6)]' : 'hover:text-slate-300'}`}>Global Feed</li>
              <li onClick={() => router.push('/groups')} className="cursor-pointer hover:text-slate-300 hover:translate-x-2 transition-transform">Sectors</li>
              <li onClick={() => router.push('/messages')} className="cursor-pointer hover:text-slate-300 hover:translate-x-2 transition-transform">Comms</li>
            </ul>
          </div>
        </div>
        
        {/* Центральная лента постов */}
        <div className="flex flex-col gap-8">
          {!searchQuery && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8 rounded-[32px] border border-red-500/10 shadow-lg">
              <textarea 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                placeholder="Initialize new broadcast... #tag" 
                className="w-full bg-white/5 text-white border border-white/5 rounded-2xl p-6 focus:outline-none focus:border-red-600/50 transition-all resize-none min-h-[120px] placeholder:text-slate-600 font-light" 
              />
              <div className="flex justify-between items-center mt-6">
                <label className="flex items-center gap-3 text-slate-500 hover:text-red-500 cursor-pointer transition-colors text-[10px] uppercase tracking-[0.2em] font-black">
                  <input type="file" accept="image/*" onChange={(e) => setSelectedImage(e.target.files ? e.target.files[0] : null)} className="hidden" />
                  <span className="bg-white/5 px-4 py-2 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">📷 Attach Media</span>
                </label>
                <button onClick={handlePostSubmit} className="bg-red-700 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-red-600 transition-all shadow-crimson-glow hover:shadow-crimson-bold hover:scale-105 active:scale-95">
                  Transmit
                </button>
              </div>
            </motion.div>
          )}
          
          {posts.map((post, index) => (
            <motion.div 
              ref={posts.length === index + 1 ? lastPostElementRef : null}
              key={post.id} 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              transition={{ duration: 0.4, delay: index % 5 * 0.1 }}
              className="glass-panel p-8 rounded-[32px] border border-red-500/5 hover:border-red-500/30 transition-all duration-500 relative shadow-lg group"
            >
              {post.user_id === currentUserId && (
                <div className="absolute top-8 right-8 flex gap-4 text-[10px] uppercase tracking-widest font-black opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEditing(post)} className="text-slate-600 hover:text-white transition-colors">Edit</button>
                  <button onClick={() => deleteOwnPost(post.id)} className="text-red-900 hover:text-red-500 transition-colors">Purge</button>
                </div>
              )}
              <div className="flex items-center gap-5 mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-red-600 to-red-900 rounded-full flex justify-center items-center text-white font-black text-xl shadow-[0_0_15px_rgba(225,29,72,0.4)] relative">
                  <div className="absolute inset-0 rounded-full border-2 border-red-500/50 animate-ping opacity-20"></div>
                  {post.author[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-black text-slate-100 tracking-wide text-lg">{post.author}</div>
                  <div className="text-[9px] text-red-500/80 uppercase tracking-[0.2em] font-bold">Verified Node</div>
                </div>
              </div>
              
              {editingPostId === post.id ? (
                <div className="mb-8">
                  <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full bg-white/5 border border-red-500/30 rounded-2xl p-5 text-white mb-4 outline-none font-light" />
                  <button onClick={() => saveEditPost(post.id)} className="bg-red-700 text-white px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-crimson-glow">Update Payload</button>
                </div>
              ) : (
                <p className="text-slate-300 leading-relaxed text-base mb-8 font-light whitespace-pre-wrap">{renderContentWithHashtags(post.content)}</p>
              )}
              
              {post.image_url && (
                <div className="overflow-hidden rounded-[24px] mb-8 border border-white/5 shadow-lg relative">
                  <img src={post.image_url} alt="Post" className="w-full object-cover grayscale-[0.4] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" />
                </div>
              )}
              
              <div className="flex gap-8 border-t border-white/5 pt-6">
                <motion.button whileTap={{ scale: 0.8 }} onClick={() => handleLike(post.id)} className={`flex items-center gap-3 transition-colors ${post.is_liked ? 'text-red-500 drop-shadow-[0_0_8px_rgba(225,29,72,0.6)]' : 'text-slate-600 hover:text-red-400'}`}>
                  <span className="text-xl">{post.is_liked ? '❤️' : '🖤'}</span>
                  <span className="font-mono text-sm font-bold">{post.like_count}</span>
                </motion.button>
                <button onClick={() => toggleComments(post.id)} className="text-slate-600 hover:text-white flex items-center gap-3 transition-colors">
                  <span className="text-xl">💬</span>
                  <span className="font-mono text-sm font-bold">{post.comment_count}</span>
                </button>
              </div>

              <AnimatePresence>
                {openComments[post.id] && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-8 pt-8 border-t border-white/5">
                    <div className="flex flex-col gap-4 mb-6">
                      {(commentsData[post.id] || []).map(c => (
                        <div key={c.id} className="bg-white/5 p-5 rounded-2xl text-sm border border-white/5">
                          <span className="font-black text-red-500 tracking-wide mr-3">{c.author}:</span> 
                          <span className="text-slate-300 font-light">{c.content}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-4">
                      <input value={commentInputs[post.id] || ''} onChange={e => setCommentInputs(prev => ({...prev, [post.id]: e.target.value}))} placeholder="Append data block..." className="flex-1 bg-white/5 border border-white/5 px-6 py-4 rounded-2xl text-white outline-none focus:border-red-600/50 transition-all placeholder:text-slate-600 font-light text-sm"/>
                      <button onClick={() => handleCommentSubmit(post.id)} className="bg-red-700 text-white px-8 rounded-2xl text-[10px] uppercase tracking-[0.2em] font-black hover:bg-red-600 transition-colors shadow-crimson-glow">Log</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
          {isLoading && <div className="text-center text-red-500 text-[10px] uppercase tracking-[0.3em] font-black mt-10 animate-pulse">Processing...</div>}
        </div>
        
        {/* Правая панель (Ивенты и Реклама) */}
        <div className="hidden lg:flex flex-col gap-6 sticky top-24 h-fit">
          
          {/* Панель Ивентов */}
          <motion.div 
            animate={{ boxShadow: ['0 0 10px rgba(225,29,72,0.1)', '0 0 30px rgba(225,29,72,0.3)', '0 0 10px rgba(225,29,72,0.1)'] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="glass-panel p-8 rounded-[32px] border border-red-500/30 overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-bl-full blur-2xl"></div>
            <div className="flex items-center gap-3 mb-6">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              <h3 className="text-white font-black text-sm uppercase tracking-[0.3em]">System Events</h3>
            </div>
            <div className="bg-red-950/40 p-5 rounded-2xl border border-red-500/20">
              <div className="text-red-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                <span>⚠️ CRITICAL</span>
              </div>
              <p className="text-white font-bold text-sm mb-2">Project Obsidian Deployed</p>
              <p className="text-slate-400 text-xs font-light leading-relaxed">Global visual overhaul completed. Awaiting admin directives.</p>
            </div>
          </motion.div>

          {/* Панель Рекламы */}
          {ads.map(ad => (
            <motion.div 
              key={ad.id} 
              whileHover={{ scale: 1.02 }}
              className="glass-panel p-8 rounded-[32px] border border-white/5 hover:border-red-500/30 transition-colors relative overflow-hidden group shadow-lg"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-red-600/20 to-transparent rounded-bl-full group-hover:from-red-600/40 transition-colors"></div>
              <span className="text-slate-600 text-[9px] uppercase tracking-[0.3em] font-black block mb-4">Sponsored Link</span>
              <h4 className="text-white font-black text-lg mb-3 tracking-wide">{ad.title}</h4>
              <p className="text-slate-400 text-sm font-light leading-relaxed">{ad.content}</p>
              {ad.link && (
                <a href={ad.link} target="_blank" rel="noreferrer" className="inline-block mt-4 text-red-500 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors">
                  Initialize Link ↗
                </a>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function Home() { 
  return (
    <Suspense fallback={<div className="text-center mt-20 text-red-500 text-xs uppercase tracking-[0.3em] font-black animate-pulse">Initializing Interface...</div>}>
      <HomeContent />
    </Suspense>
  ); 
}