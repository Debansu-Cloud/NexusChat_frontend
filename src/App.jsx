import { useEffect, useRef, useState } from 'react';
import { connectWS } from './ws';
import './App.css';

export default function App() {
    const timer = useRef(null);
    const socket = useRef(null);
    const scrollRef = useRef(null); // Ref for auto-scrolling

    const [userName, setUserName] = useState('');
    const [showNamePopup, setShowNamePopup] = useState(true);
    const [inputName, setInputName] = useState('');
    const [typers, setTypers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');

    // Auto-scroll to bottom whenever messages update
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        socket.current = connectWS();

        socket.current.on('connect', () => {
            // Joined Notice
            socket.current.on('roomNotice', (joinedUserName) => {
                const notice = {
                    id: `system-join-${Date.now()}`,
                    isSystem: true,
                    text: `${joinedUserName} has entered the chat`,
                };
                setMessages((prev) => [...prev, notice]);
            });

            // Left Notice (Added feature)
            socket.current.on('userLeft', (leftUserName) => {
                const notice = {
                    id: `system-leave-${Date.now()}`,
                    isSystem: true,
                    text: `${leftUserName} has left the frequency`,
                    isLeave: true
                };
                setMessages((prev) => [...prev, notice]);
            });

            socket.current.on('chatMessage', (msg) => {
                setMessages((prev) => [...prev, msg]);
            });

            socket.current.on('typing', (user) => {
                setTypers((prev) => (prev.includes(user) ? prev : [...prev, user]));
            });

            socket.current.on('stopTyping', (user) => {
                setTypers((prev) => prev.filter((t) => t !== user));
            });
        });

        return () => {
            socket.current.off('roomNotice');
            socket.current.off('userLeft');
            socket.current.off('chatMessage');
            socket.current.off('typing');
            socket.current.off('stopTyping');
        };
    }, []);

    useEffect(() => {
        if (text && userName) {
            socket.current.emit('typing', userName);
            clearTimeout(timer.current);
        }
        timer.current = setTimeout(() => {
            if (userName) socket.current.emit('stopTyping', userName);
        }, 1000);
        return () => clearTimeout(timer.current);
    }, [text, userName]);

    function formatTime(ts) {
        const d = new Date(ts);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function handleNameSubmit(e) {
        e.preventDefault();
        const trimmed = inputName.trim();
        if (!trimmed) return;
        socket.current.emit('joinRoom', trimmed);
        setUserName(trimmed);
        setShowNamePopup(false);
    }

    function sendMessage() {
        const t = text.trim();
        if (!t) return;
        const msg = {
            id: Date.now(),
            sender: userName,
            text: t,
            ts: Date.now(),
        };
        setMessages((m) => [...m, msg]);
        socket.current.emit('chatMessage', msg);
        setText('');
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    function handleExit() {
        window.location.reload(); 
    }


    if (showNamePopup) {
        return (
            <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white font-sans flex items-center justify-center p-6">
                <div className="w-full max-w-md bg-white/10 border border-white/20 p-8 rounded-3xl backdrop-blur-xl shadow-2xl text-center">
                    <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                        Nexus Chat
                    </h1>
                    <p className="text-gray-300 mb-8">Identify yourself to join the frequency.</p><br></br>
                    <form onSubmit={handleNameSubmit} className="space-y-6">
                        <input
                            autoFocus
                            value={inputName}
                            onChange={(e) => setInputName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-cyan-400 transition-all text-xl text-center"
                            placeholder="Enter Username..."
                        />
                        <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-4 rounded-2xl shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all transform active:scale-95">
                            START CHATTING
                        </button><br></br>
                    </form>
                    <p className="mt-10 text-[10px] tracking-[0.3em] text-white/40 uppercase">Engineered by Debansu</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white font-sans overflow-hidden flex flex-col">
            {/* HEADER */}
            <header className="h-20 flex items-center justify-between px-4 md:px-6 bg-white/5 backdrop-blur-md border-b border-white/10 shrink-0 z-10">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center font-black shadow-lg">
                        N
                    </div>
                    <div className="max-w-[120px] md:max-w-none">
                        <h2 className="font-bold text-sm md:text-lg leading-none truncate">Nexus Group</h2>
                        <div className="h-4 flex items-center">
                            {typers.length > 0 ? (
                                <span className="text-[10px] md:text-xs text-cyan-400 animate-pulse truncate">
                                    {typers[0]} is typing...
                                </span>
                            ) : (
                                <span className="text-[10px] md:text-xs text-emerald-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span> Live
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* MOBILE VISIBILITY FIX: Username shown alongside exit button */}
                <div className="flex items-center gap-2 md:gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] md:text-[10px] text-white/40 uppercase font-bold">User</span>
                        <span className="text-xs md:text-sm font-bold text-cyan-400 truncate max-w-[70px] md:max-w-[150px]">{userName}</span>
                    </div>
                    <button 
                        onClick={handleExit}
                        className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/50 px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[10px] md:text-xs font-bold transition-all whitespace-nowrap"
                    >
                        EXIT
                    </button>
                </div>
            </header>

            {/* MESSAGE AREA */}
            <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                {messages.map((m) => {
                    if (m.isSystem) {
                        return (
                            <div key={m.id} className="flex justify-center">
                                <span className={`bg-white/5 border ${m.isLeave ? 'border-red-500/30 text-red-300' : 'border-white/10 text-white/50'} text-[10px] px-4 py-1.5 rounded-full uppercase tracking-tighter`}>
                                    {m.text}
                                </span>
                            </div>
                        );
                    }

                    const mine = m.sender === userName;
                    return (
                        <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                            <div className={`flex flex-col max-w-[85%] md:max-w-[60%] ${mine ? 'items-end' : 'items-start'}`}>
                                <span className="text-[10px] font-bold text-white/40 mb-1 px-2 uppercase">{m.sender}</span>
                                <div className={`px-5 py-3 rounded-2xl shadow-xl ${
                                    mine 
                                    ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-tr-none' 
                                    : 'bg-white/10 backdrop-blur-md border border-white/10 rounded-tl-none'
                                }`}>
                                    <p className="text-sm md:text-base leading-relaxed break-words">{m.text}</p>
                                </div>
                                <span className="text-[9px] text-white/30 mt-1 px-2">{formatTime(m.ts)}</span>
                            </div>
                        </div>
                    );
                })}
            </main>

            {/* INPUT DOCK */}
            <footer className="p-4 md:p-6 bg-white/5 backdrop-blur-lg border-t border-white/10 shrink-0">
                <div className="max-w-5xl mx-auto flex items-center gap-3 bg-white/5 p-2 rounded-3xl border border-white/10">
                    <textarea
                        rows={1}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Transmit a message..."
                        className="flex-1 bg-transparent px-4 py-3 outline-none resize-none text-sm md:text-base"
                    />
                    <button
                        onClick={sendMessage}
                        className="h-12 w-12 md:w-24 bg-cyan-500 hover:bg-cyan-400 text-black rounded-2xl font-bold flex items-center justify-center transition-all shadow-lg active:scale-90"
                    >
                        <span className="hidden md:block">SEND</span>
                        <svg className="md:hidden w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                </div>
                <div className="mt-4 text-center">
                    <span className="text-[9px] text-white/20 uppercase tracking-[0.4em] font-medium">Created by Debansu</span>
                </div>
            </footer>
        </div>
    );
}