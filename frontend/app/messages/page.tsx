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
  role?: string;
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
        if (usersRes.ok) setUsers(await usersRes.json() || []);

        const onlineRes = await fetch('http://localhost:8080/api/users/online', { credentials: 'include' });
        if (onlineRes.ok) setOnlineUsers(await onlineRes.json() || []);

        ws.current = new WebSocket('ws://localhost:8080/api/ws');
        ws.current.onmessage = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.type === 'online') setOnlineUsers(prev => Array.from(new Set([...prev, msg.sender_id])));
          if (msg.type === 'offline') setOnlineUsers(prev => prev.filter(id => id !== msg.sender_id));
          if (msg.type === 'typing') {
            setTypingUsers(prev => ({ ...prev, [msg.sender_id]: true }));
            if (typingTimeoutRef.current[msg.sender_id]) clearTimeout(typingTimeoutRef.current[msg.sender_id]);
            typingTimeoutRef.current[msg.sender_id] = setTimeout(() => {
              setTypingUsers(prev => ({ ...prev, [msg.sender_id]: false }));
            }, 3000);
          }
          if (msg.type === 'message') {
            setMessages(prev => [...prev, msg]);
            setTypingUsers(prev => ({ ...prev, [msg.sender_id]: false }));
          }
        };
      } catch (err) { router.push('/login'); }
    };
    init();
    return () => ws.current?.close();
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
    if (ws.current && activeChatId) ws.current.send(JSON.stringify({ type: 'typing', receiver_id: activeChatId }));
  };

  const sendMessage = () => {
    if (!inputText.trim() || !activeChatId || !ws.current) return;
    ws.current.send(JSON.stringify({ type: 'message', receiver_id: activeChatId, content: inputText }));
    setInputText('');
  };

  const activeUser = users.find(u => u.id === activeChatId);

  return (
    <div className="h-screen bg-[#050505] flex flex-col">
      <Navbar />
      <div className="flex flex-1 max-w-[1400px] mx-auto w-full px-6 gap-8 pb-10 overflow-hidden relative z-10">
        
        {/* Sidebar: Nodes */}
        <div className="bg-black/40 backdrop-blur-md w-80 rounded-[32px] overflow-hidden flex flex-col border border-orange-500/10 shadow-lg">
          <div className="p-8 border-b border-white/5 bg-white/[0.02]">
            <h2 className="text-xl font-black text-orange-600 tracking-[0.2em] uppercase">Comms</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
            {users.map(u => (
              <motion.div 
                whileHover={{ x: 5 }} key={u.id} onClick={() => setActiveChatId(u.id)}
                className={`flex items-center gap-5 p-5 rounded-[28px] cursor-pointer transition-all border ${activeChatId === u.id ? 'bg-orange-950/20 border-orange-500/40 shadow-inner' : 'border-transparent hover:bg-white/5'}`}
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-orange-950/40 border border-orange-500/20 rounded-2xl flex items-center justify-center font-black text-orange-500 text-lg uppercase shadow-lg">{u.first_name[0]}</div>
                  {onlineUsers.includes(u.id) && <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 border-4 border-black rounded-full" />}
                </div>
                <div className="truncate">
                  <div className="text-slate-200 font-black tracking-widest text-[10px] uppercase truncate">{u.first_name} {u.last_name}</div>
                  <div className={`text-[8px] uppercase tracking-widest font-mono mt-1 ${onlineUsers.includes(u.id) ? 'text-green-500' : 'text-slate-600'}`}>{onlineUsers.includes(u.id) ? 'LINK ACTIVE' : 'OFFLINE'}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="bg-black/40 backdrop-blur-md flex-1 rounded-[32px] overflow-hidden flex flex-col border border-orange-500/10 shadow-lg relative">
          {activeChatId && activeUser ? (
            <>
              <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div>
                  <span className="text-white font-black tracking-[0.2em] text-sm uppercase">{activeUser.first_name} {activeUser.last_name}</span>
                  <div className="text-[8px] text-slate-600 uppercase tracking-widest font-mono mt-1">Direct thought bridge established</div>
                </div>
                {typingUsers[activeChatId] && <span className="text-orange-500 text-[8px] uppercase tracking-[0.3em] font-black animate-pulse">Subject is thinking...</span>}
              </div>
              <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-gradient-to-b from-transparent to-black/20 custom-scrollbar">
                {messages.map((msg, idx) => {
                  const isMe = msg.sender_id === currentUserId;
                  return (
                    <motion.div initial={{ opacity: 0, x: isMe ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] p-6 rounded-[28px] text-sm font-light leading-relaxed border ${isMe ? 'bg-orange-600 text-black rounded-tr-none border-orange-500 shadow-xl' : 'bg-white/5 text-slate-300 rounded-tl-none border-white/5 shadow-lg'}`}>{msg.content}</div>
                    </motion.div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-8 border-t border-white/5 flex gap-4 bg-black/40">
                <input 
                  type="text" value={inputText} onChange={handleInputChange} onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Transmit encrypted payload..." 
                  className="flex-1 bg-white/5 border border-white/10 text-white px-8 py-5 rounded-[20px] outline-none focus:border-orange-600/40 transition-all text-sm font-light"
                />
                <button onClick={sendMessage} className="bg-white text-black px-10 rounded-[20px] font-black uppercase tracking-[0.3em] text-[10px] hover:bg-orange-600 transition-all shadow-xl active:scale-95">Send</button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-700 opacity-30">
              <span className="text-6xl mb-6">📡</span>
              <span className="uppercase tracking-[0.5em] font-black text-xs">Awaiting Target Selection</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}