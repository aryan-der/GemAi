import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Send, Loader2, User, Cpu, Edit2, Trash2, Check, X, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const Chat = () => {
    const { id } = useParams();
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [editText, setEditText] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (id) {
            fetchChat();
        } else {
            // Clear all state for new chat
            setMessages([]);
            setInput('');
            setEditingIndex(null);
            setEditText('');
        }
    }, [id, location.key]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const fetchChat = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/chats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            const currentChat = data.find(c => c.id === id);
            if (currentChat) setMessages(currentChat.messages);
            else if (id) navigate('/');
        } catch (err) {
            console.error('Failed to fetch chat');
        }
    };

    const saveChatSession = async (updatedMessages) => {
        try {
            const res = await fetch('http://localhost:5000/api/chats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    id: id || undefined,
                    messages: updatedMessages
                }),
            });
            if (!id && res.ok) {
                const newChat = await res.json();
                navigate(`/chat/${newChat.id}`, { replace: true });
            }
        } catch (err) {
            console.error('Failed to save chat history');
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = { role: 'user', content: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:5000/api/gemini', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ prompt: input }),
            });
            const data = await res.json();
            const aiMessage = { role: 'assistant', content: data.message };
            const finalMessages = [...newMessages, aiMessage];
            setMessages(finalMessages);
            saveChatSession(finalMessages);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Error: Failed to get response.' }]);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    const startEditing = (index, content) => {
        setEditingIndex(index);
        setEditText(content);
    };

    const saveEdit = (index) => {
        const updated = [...messages];
        updated[index].content = editText;
        setMessages(updated);
        setEditingIndex(null);
        saveChatSession(updated);
    };

    return (
        <div className="flex flex-col h-full max-w-5xl mx-auto w-full relative">
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-6 md:space-y-8">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-fade-in px-4">
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-600/20">
                            <Cpu size={48} className="animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">How can I help you?</h2>
                            <p className="text-slate-400 max-w-md mx-auto text-base md:text-lg text-balance">
                                GemAI is your premium intelligence partner. Ask anything, from code to complex questions.
                            </p>
                        </div>
                    </div>
                )}

                <AnimatePresence initial={false}>
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-3 md:gap-5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-white/10 border border-white/5' : 'bg-indigo-600'
                                }`}>
                                {msg.role === 'user' ? <User size={20} className="text-white" /> : <Cpu size={20} className="text-white" />}
                            </div>
                            <div className={`group relative max-w-[90%] md:max-w-[85%] space-y-2`}>
                                <div className={`px-4 py-3 md:px-6 md:py-2 rounded-2xl md:rounded-[2rem] ${msg.role === 'user'
                                    ? 'chat-bubble-user rounded-tr-none'
                                    : 'chat-bubble-ai rounded-tl-none'
                                    }`}>
                                    {editingIndex === i ? (
                                        <div className="flex flex-col gap-3 min-w-[250px] md:min-w-[350px]">
                                            <textarea
                                                value={editText}
                                                onChange={(e) => setEditText(e.target.value)}
                                                className="bg-black/40 border border-white/10 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-full"
                                                rows={4}
                                            />
                                            <div className="flex justify-end gap-3">
                                                <button onClick={() => setEditingIndex(null)} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-red-400 transition-colors">
                                                    <X size={18} />
                                                </button>
                                                <button onClick={() => saveEdit(i)} className="p-2 bg-indigo-500 hover:bg-indigo-400 rounded-lg text-white transition-colors">
                                                    <Check size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="prose prose-invert max-w-none text-sm md:text-base overflow-hidden">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    img({ node, ...props }) {
                                                        return (
                                                            <motion.img
                                                                initial={{ opacity: 0, scale: 0.95 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                className="rounded-2xl border border-white/10 shadow-2xl my-4 max-w-full hover:scale-[1.02] transition-transform cursor-zoom-in"
                                                                {...props}
                                                            />
                                                        );
                                                    },
                                                    code({ node, inline, className, children, ...props }) {
                                                        const match = /language-(\w+)/.exec(className || '')
                                                        const codeString = String(children).replace(/\n$/, '');
                                                        return !inline && match ? (
                                                            <div className="relative group/code my-4">
                                                                <button
                                                                    onClick={() => copyToClipboard(codeString)}
                                                                    className="absolute right-3 top-3 z-10 p-2 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 rounded-lg opacity-0 group-hover/code:opacity-100 transition-all border border-indigo-500/20"
                                                                    title="Copy Code"
                                                                >
                                                                    <Copy size={16} />
                                                                </button>
                                                                <SyntaxHighlighter
                                                                    style={atomDark}
                                                                    language={match[1]}
                                                                    PreTag="div"
                                                                    className="rounded-xl !bg-slate-900/50 border border-white/5 overflow-x-auto text-[12px] md:text-sm !p-4"
                                                                    {...props}
                                                                >
                                                                    {codeString}
                                                                </SyntaxHighlighter>
                                                            </div>
                                                        ) : (
                                                            <code className={className} {...props}>
                                                                {children}
                                                            </code>
                                                        )
                                                    }
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                </div>

                                {msg.role === 'user' && editingIndex !== i && (
                                    <button
                                        onClick={() => startEditing(i, msg.content)}
                                        className="absolute -left-10 md:-left-12 top-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-white"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}

                    {loading && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-3 md:gap-5 animate-pulse-soft"
                        >
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-lg">
                                <Cpu size={20} className="text-white" />
                            </div>
                            <div className="bg-white/5 border border-white/5 px-5 py-3 md:px-6 md:py-4 rounded-2xl md:rounded-[2rem] rounded-tl-none flex items-center gap-2">
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 md:p-6 pb-6 md:pb-8">
                <form onSubmit={handleSend} className="relative max-w-2xl mx-auto group">
                    <div className="absolute inset-0 bg-indigo-500/10 blur-2xl rounded-[2.5rem] opacity-0 group-focus-within:opacity-100 transition-opacity hidden md:block" />
                    <div className="relative flex items-end gap-2 bg-slate-900/50 border border-white/10 rounded-xl md:rounded-[2rem] p-1.5 md:p-1 pl-3 md:pl-5 focus-within:border-indigo-500/40 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all shadow-2xl backdrop-blur-xl">
                        <textarea
                            rows={1}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend(e)}
                            placeholder="Message GemAI..."
                            className="flex-1 bg-transparent py-1.5 md:py-2 focus:outline-none resize-none text-sm md:text-base text-slate-200"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className={`p-2 md:p-3 ${input.trim() ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-slate-800 text-slate-600'
                                } text-white rounded-lg md:rounded-[1.5rem] transition-all shadow-xl disabled:opacity-50`}
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                        </button>
                    </div>
                    <p className="text-[10px] md:text-[11px] text-center text-slate-500 mt-3 font-medium tracking-wide leading-none">
                        GEMAI PREMIUM • POWERED BY GEMAI v0.1
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Chat;
