"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';

// --- КОМПОНЕНТ ОКА САУРОНА (ВИЗУАЛ) ---
const SauronEye = () => (
  <motion.div
    animate={{ 
      filter: [
        'drop-shadow(0 0 10px rgba(255, 69, 0, 0.3))', 
        'drop-shadow(0 0 30px rgba(255, 0, 0, 0.6))', 
        'drop-shadow(0 0 10px rgba(255, 69, 0, 0.3))'
      ]
    }}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    className="fixed top-24 left-10 w-24 h-48 pointer-events-none z-0 hidden xl:block opacity-40"
  >
    <svg viewBox="0 0 100 200" className="w-full h-full">
      <defs>
        <radialGradient id="eyeGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffea00" />
          <stop offset="30%" stopColor="#ff8c00" />
          <stop offset="70%" stopColor="#ff4500" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d="M10 100 Q50 20 90 100 Q50 180 10 100" fill="none" stroke="#ff4500" strokeWidth="0.5" opacity="0.3" />
      <circle cx="50" cy="100" r="40" fill="url(#eyeGradient)" />
      <motion.ellipse 
        cx="50" cy="100" rx="4" ry="60" fill="#000"
        animate={{ scaleX: [1, 1.5, 1] }}
        transition={{ duration: 5, repeat: Infinity }}
      />
    </svg>
  </motion.div>
);

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<{id: string, role: string} | null>(null);

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

  // Инициализация данных: профиль, проверка авторизации и реклама
  useEffect(() => {
    const init = async () => {
      try {
        const authRes = await fetch('http://localhost:8080/api/profile', { credentials: 'include' });
        if (authRes.ok) {
          const data = await authRes.json();
          setUser(data);
        } else {
          router.push('/login');
          return;
        }
        
        const aRes = await fetch('http://localhost:8080/api/ads', { credentials: 'include' });
        if (aRes.ok) {
          const adData = await aRes.json();
          setAds(adData || []);
        }
      } catch (err) {}
    };
    init();
  }, [router]);

  // Сброс при изменении поискового запроса (хэштега)
  useEffect(() => {
    setPosts([]);
    setPage(1);
    setHasMore(true);
  }, [searchQuery]);

  // Загрузка постов с поддержкой пагинации и поиска
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
    
    // Перезагрузка постов после отправки
    const pRes = await fetch(`http://localhost:8080/api/posts?page=1&limit=5`, { credentials: 'include' });
    const freshPosts = await pRes.json();
    setPosts(freshPosts || []);
  };

  // ФУНКЦИЯ ВЛАСТИ И УПРАВЛЕНИЯ
  const incineratePost = async (postId: string) => {
    if(!confirm('PURGE THIS DATA FROM THE NEXUS?')) return;
    
    const isOwnPost = posts.find(p => p.id === postId)?.user_id === user?.id;
    const endpoint = isOwnPost 
      ? `http://localhost:8080/api/posts/delete-own?id=${postId}`
      : `http://localhost:8080/api/admin/posts/incinerate?id=${postId}`;

    const res = await fetch(endpoint, { method: 'POST', credentials: 'include' });
    if (res.ok) {
      setPosts(prev => prev.filter(p => p.id !== postId));
    }
  };

  const startEditing = (post: any) => {
    setEditingPostId(post.id);
    setEditContent(post.content);
  };

  const saveEditPost = async (postId: string) => {
    const res = await fetch(`http://localhost:8080/api/posts/edit-own?id=${postId}`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ content: editContent }), 
      credentials: 'include'
    });
    if (res.ok) {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, content: editContent } : p));
      setEditingPostId(null);
    }
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
    if (!text) return "";
    return text.split(/(#[a-zA-Z0-9_а-яА-ЯёЁөқғңүұі]+)/g).map((part, i) => {
      if (part.startsWith('#')) {
        return (
          <span 
            key={i} 
            onClick={(e) => { 
              e.stopPropagation(); 
              router.push(`/?search=${encodeURIComponent(part)}`); 
            }} 
            className="text-orange-500 font-black hover:text-orange-400 cursor-pointer transition-colors drop-shadow-[0_0_5px_rgba(249,115,22,0.3)]"
          >
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
      <SauronEye />
      
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-8 px-6 max-w-[1400px] mx-auto pb-20 relative z-10">
        
        {/* ЛЕВАЯ ПАНЕЛЬ: НАВИГАЦИЯ */}
        <div className="hidden lg:flex flex-col gap-4">
          <div className="bg-black/40 backdrop-blur-md p-8 rounded-[32px] sticky top-24 border border-orange-500/5">
            <ul className="flex flex-col gap-6 text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black">
              <li onClick={() => router.push('/')} className={`cursor-pointer transition-transform hover:translate-x-2 ${!searchQuery ? 'text-orange-600 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]' : 'hover:text-slate-300'}`}>Global Feed</li>
              <li onClick={() => router.push('/groups')} className="cursor-pointer hover:text-slate-300 hover:translate-x-2 transition-transform">Sectors</li>
              <li onClick={() => router.push('/messages')} className="cursor-pointer hover:text-slate-300 hover:translate-x-2 transition-transform">Comms</li>
            </ul>
          </div>
        </div>
        
        {/* ЦЕНТРАЛЬНАЯ ПАНЕЛЬ: ЛЕНТА */}
        <div className="flex flex-col gap-8">
          {!searchQuery && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-black/40 p-8 rounded-[32px] border border-orange-500/10 shadow-lg">
              <textarea 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                placeholder="Initialize new broadcast to Nexus... #tag" 
                className="w-full bg-white/5 text-white border border-white/5 rounded-2xl p-6 focus:outline-none focus:border-orange-600/50 transition-all resize-none min-h-[120px] placeholder:text-slate-600 font-light" 
              />
              <div className="flex justify-between items-center mt-6">
                <label className="flex items-center gap-3 text-slate-500 hover:text-orange-500 cursor-pointer transition-colors text-[10px] uppercase tracking-[0.2em] font-black">
                  <input type="file" accept="image/*" onChange={(e) => setSelectedImage(e.target.files ? e.target.files[0] : null)} className="hidden" />
                  <span className="bg-white/5 px-4 py-2 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">📷 Attach Media</span>
                </label>
                <button onClick={handlePostSubmit} className="bg-orange-700 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-orange-600 transition-all shadow-[0_0_20px_rgba(249,115,22,0.2)]">
                  Transmit
                </button>
              </div>
            </motion.div>
          )}
          
          {posts.map((post, index) => (
            <motion.div 
              ref={posts.length === index + 1 ? lastPostElementRef : null}
              key={post.id} 
              initial={{ opacity: 0, scale: 0.98, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              transition={{ duration: 0.4, delay: index % 5 * 0.1 }}
              className="bg-black/20 p-8 rounded-[32px] border border-white/5 hover:border-orange-500/30 transition-all duration-500 relative shadow-lg group"
            >
              {/* КНОПКИ УПРАВЛЕНИЯ (РЕДАКТИРОВАНИЕ/УДАЛЕНИЕ) */}
              <div className="absolute top-8 right-8 flex gap-4 text-[10px] uppercase tracking-widest font-black opacity-0 group-hover:opacity-100 transition-opacity">
                {post.user_id === user?.id && (
                  <button onClick={() => startEditing(post)} className="text-slate-600 hover:text-white transition-colors">Edit</button>
                )}
                {(post.user_id === user?.id || user?.role === 'admin') && (
                  <button onClick={() => incineratePost(post.id)} className="text-red-900 hover:text-red-500 transition-colors">Incinerate</button>
                )}
              </div>

              <div className="flex items-center gap-5 mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-600 to-red-900 rounded-2xl flex justify-center items-center text-black font-black text-xl shadow-lg">
                  {post.author ? post.author[0].toUpperCase() : "N"}
                </div>
                <div>
                  <div className="font-black text-slate-100 tracking-wide text-lg uppercase">{post.author}</div>
                  <div className="text-[9px] text-orange-500/80 uppercase tracking-[0.2em] font-bold">Node verified</div>
                </div>
              </div>
              
              {editingPostId === post.id ? (
                <div className="mb-8">
                  <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full bg-white/5 border border-orange-500/30 rounded-2xl p-5 text-white mb-4 outline-none font-light" />
                  <button onClick={() => saveEditPost(post.id)} className="bg-orange-700 text-white px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px]">Update Payload</button>
                </div>
              ) : (
                <p className="text-slate-300 leading-relaxed text-base mb-8 font-light whitespace-pre-wrap">{renderContentWithHashtags(post.content)}</p>
              )}
              
              {post.image_url && (
                <div className="overflow-hidden rounded-[24px] mb-8 border border-white/5 shadow-lg relative">
                  <img src={post.image_url} alt="Data" className="w-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700" />
                </div>
              )}
              
              <div className="flex gap-8 border-t border-white/5 pt-6">
                <motion.button whileTap={{ scale: 0.8 }} onClick={() => handleLike(post.id)} className={`flex items-center gap-3 transition-colors ${post.is_liked ? 'text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]' : 'text-slate-600 hover:text-orange-400'}`}>
                  <span className="text-xl">{post.is_liked ? '🔥' : '🌑'}</span>
                  <span className="font-mono text-sm font-bold">{post.like_count}</span>
                </motion.button>
                <button onClick={() => toggleComments(post.id)} className="text-slate-600 hover:text-white flex items-center gap-3 transition-colors">
                  <span className="text-xl">💬</span>
                  <span className="font-mono text-sm font-bold">{post.comment_count}</span>
                </button>
              </div>

              {/* СЕКЦИЯ КОММЕНТАРИЕВ */}
              <AnimatePresence>
                {openComments[post.id] && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-8 pt-8 border-t border-white/5">
                    <div className="flex flex-col gap-4 mb-6">
                      {(commentsData[post.id] || []).map(c => (
                        <div key={c.id} className="bg-white/5 p-5 rounded-2xl text-sm border border-white/5">
                          <span className="font-black text-orange-500 tracking-wide mr-3">{c.author}:</span> 
                          <span className="text-slate-300 font-light">{c.content}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-4">
                      <input 
                        value={commentInputs[post.id] || ''} 
                        onChange={e => setCommentInputs(prev => ({...prev, [post.id]: e.target.value}))} 
                        placeholder="Append data block..." 
                        className="flex-1 bg-white/5 border border-white/5 px-6 py-4 rounded-2xl text-white outline-none focus:border-orange-600/50 transition-all text-sm font-light"
                      />
                      <button onClick={() => handleCommentSubmit(post.id)} className="bg-orange-700 text-white px-8 rounded-2xl text-[10px] uppercase tracking-[0.2em] font-black hover:bg-orange-600 transition-colors">Log</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
          {isLoading && <div className="text-center text-orange-500 text-[10px] uppercase tracking-[0.3em] font-black mt-10 animate-pulse">Syncing...</div>}
        </div>
        
        {/* ПРАВАЯ ПАНЕЛЬ: ИВЕНТЫ И СПОНСОРЫ */}
        <div className="hidden lg:flex flex-col gap-6 sticky top-24 h-fit">
          
          <motion.div 
            animate={{ boxShadow: ['0 0 10px rgba(249,115,22,0.1)', '0 0 30px rgba(249,115,22,0.3)', '0 0 10px rgba(249,115,22,0.1)'] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="bg-black/60 p-8 rounded-[32px] border border-orange-500/30 overflow-hidden relative"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
              <h3 className="text-white font-black text-sm uppercase tracking-[0.3em]">System Events</h3>
            </div>
            <div className="bg-orange-950/40 p-5 rounded-2xl border border-orange-500/20">
              <p className="text-orange-500 text-[10px] font-black uppercase tracking-widest mb-2">Notice</p>
              <p className="text-white font-bold text-sm mb-2">Master Override Online</p>
              <p className="text-slate-400 text-xs font-light leading-relaxed">Visual sensors updated to Eye of Power. Admin incinerator ready.</p>
            </div>
          </motion.div>

          {/* СПОНСОРСКАЯ ЧАСТЬ */}
          {ads.map(ad => (
            <motion.div 
              key={ad.id} 
              whileHover={{ scale: 1.02 }}
              className="bg-black/40 p-8 rounded-[32px] border border-white/5 hover:border-orange-500/30 transition-colors relative overflow-hidden group shadow-lg"
            >
              <span className="text-slate-600 text-[9px] uppercase tracking-[0.3em] font-black block mb-4">Sponsored Payload</span>
              <h4 className="text-white font-black text-lg mb-3 tracking-wide uppercase">{ad.title}</h4>
              <p className="text-slate-400 text-sm font-light leading-relaxed">{ad.content}</p>
              {ad.link && (
                <a href={ad.link} target="_blank" rel="noreferrer" className="inline-block mt-4 text-orange-500 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors">
                  Establish Link ↗
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
    <Suspense fallback={<div className="text-center mt-20 text-orange-500 text-[10px] uppercase tracking-[0.3em] font-black animate-pulse">Initializing Nexus...</div>}>
      <HomeContent />
    </Suspense>
  ); 
}