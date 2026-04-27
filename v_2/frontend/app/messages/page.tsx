"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar?: string;
}

interface Message {
  type?: string;
  id?: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at?: string;
}

export default function MessagesPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    const init = async () => {
      try {
        const authRes = await fetch('http://localhost:8080/api/check-auth', { credentials: 'include' });
        if (!authRes.ok) throw new Error();
        const authData = await authRes.json();
        setCurrentUserId(authData.user_id);

        const usersRes = await fetch('http://localhost:8080/api/users', { credentials: 'include' });
        if (usersRes.ok) {
          const uData = await usersRes.json();
          setUsers(uData || []);
        }

        const onlineRes = await fetch('http://localhost:8080/api/users/online', { credentials: 'include' });
        if (onlineRes.ok) {
          const oData = await onlineRes.json();
          setOnlineUsers(oData || []);
        }

        ws.current = new WebSocket('ws://localhost:8080/api/ws');
        
        ws.current.onmessage = (event) => {
          const msg = JSON.parse(event.data);
          
          if (msg.type === 'online') {
            setOnlineUsers(prev => Array.from(new Set([...prev, msg.sender_id])));
            return;
          }
          if (msg.type === 'offline') {
            setOnlineUsers(prev => prev.filter(id => id !== msg.sender_id));
            return;
          }
          if (msg.type === 'typing') {
            setTypingUsers(prev => ({ ...prev, [msg.sender_id]: true }));
            if (typingTimeoutRef.current[msg.sender_id]) clearTimeout(typingTimeoutRef.current[msg.sender_id]);
            typingTimeoutRef.current[msg.sender_id] = setTimeout(() => {
              setTypingUsers(prev => ({ ...prev, [msg.sender_id]: false }));
            }, 3000);
            return;
          }

          if (msg.type === 'message') {
            setMessages((prev) => {
              if (prev.find(m => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
            setTypingUsers(prev => ({ ...prev, [msg.sender_id]: false }));
          }
        };
      } catch (err) {
        router.push('/login');
      }
    };
    init();
    
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [router]);

  useEffect(() => {
    if (activeChatId) {
      fetch(`http://localhost:8080/api/messages/history?user_id=${activeChatId}`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => setMessages(data || []));
    }
  }, [activeChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (ws.current && activeChatId) {
      ws.current.send(JSON.stringify({ type: 'typing', receiver_id: activeChatId }));
    }
  };

  const sendMessage = () => {
    if (!inputText.trim() || !activeChatId || !ws.current) return;
    ws.current.send(JSON.stringify({ type: 'message', receiver_id: activeChatId, content: inputText }));
    setInputText('');
  };

  const activeUser = users.find(u => u.id === activeChatId);

  return (
    <>
      <Navbar />
      <div className="flex h-[calc(100vh-120px)] max-w-[1400px] mx-auto px-6 gap-8 pb-10 relative z-10">
        
        {/* Contacts Sidebar */}
        <div className="glass-panel w-80 rounded-[32px] overflow-hidden flex flex-col border border-red-500/10 shadow-lg">
          <div className="p-8 border-b border-white/5 bg-white/[0.02]">
            <h2 className="text-xl font-black text-red-500 tracking-[0.2em] uppercase">Communications</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {users.map(user => (
              <motion.div 
                whileHover={{ scale: 1.02 }}
                key={user.id} 
                onClick={() => setActiveChatId(user.id)}
                className={`flex items-center gap-5 p-4 rounded-[24px] cursor-pointer transition-all border ${
                  activeChatId === user.id ? 'bg-red-900/20 border-red-500/50 shadow-crimson-glow' : 'border-transparent hover:bg-white/5'
                }`}
              >
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-red-600 to-red-900 rounded-full flex items-center justify-center font-black text-white text-xl shadow-md">
                    {user.first_name[0]}
                  </div>
                  {onlineUsers.includes(user.id) && (
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute bottom-0 right-0 w-4 h-4 bg-red-500 border-[3px] border-[#0a0a0a] rounded-full shadow-[0_0_10px_#e11d48]"
                    />
                  )}
                </div>
                <div className="truncate">
                  <div className="text-slate-100 font-bold tracking-wide truncate">{user.first_name} {user.last_name}</div>
                  <div className={`text-[9px] uppercase tracking-widest font-black mt-1 ${onlineUsers.includes(user.id) ? 'text-red-500' : 'text-slate-600'}`}>
                    {onlineUsers.includes(user.id) ? 'Active Node' : 'Offline'}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <div className="glass-panel flex-1 rounded-[32px] overflow-hidden flex flex-col border border-red-500/10 shadow-lg relative">
          {activeChatId && activeUser ? (
            <>
              <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <span className="text-white font-black tracking-widest text-xl uppercase">{activeUser.first_name} {activeUser.last_name}</span>
                <AnimatePresence>
                  {typingUsers[activeChatId] && (
                    <motion.span 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="text-red-500 text-[10px] uppercase tracking-[0.2em] font-black animate-pulse bg-red-500/10 px-4 py-2 rounded-full border border-red-500/30 shadow-crimson-glow"
                    >
                      Transmitting Data...
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gradient-to-b from-transparent to-black/20">
                <AnimatePresence>
                  {messages.map((msg, idx) => {
                    const isMe = msg.sender_id === currentUserId;
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        key={idx} 
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] p-6 rounded-3xl text-sm font-light leading-relaxed border ${
                          isMe 
                          ? 'bg-gradient-to-br from-red-700 to-red-900 text-white rounded-tr-none border-red-500/30 shadow-[0_5px_20px_rgba(225,29,72,0.3)]' 
                          : 'bg-white/5 text-slate-200 rounded-tl-none border-white/5 shadow-lg'
                        }`}>
                          {msg.content}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
              
              <div className="p-6 border-t border-white/5 flex gap-4 bg-[#0a0a0a]/50 backdrop-blur-xl">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Encrypt payload..." 
                  className="flex-1 bg-white/5 border border-white/5 text-white px-6 py-4 rounded-2xl outline-none focus:border-red-600/50 transition-all placeholder:text-slate-600 font-light"
                />
                <button onClick={sendMessage} className="bg-red-700 text-white px-8 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-600 shadow-crimson-glow transition-all hover:scale-105 active:scale-95">
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
              <span className="text-4xl mb-4 animate-pulse">📡</span>
              <span className="uppercase tracking-[0.3em] font-bold text-xs">Select target to initialize connection</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}