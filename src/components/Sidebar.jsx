import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    MessageSquare,
    LogOut,
    Trash2,
    ChevronLeft,
    ChevronRight,
    User as UserIcon,
    Cpu // New Branding Icon
} from 'lucide-react';
import { motion } from 'framer-motion';
import ConfirmationModal from './ConfirmationModal';

const Sidebar = ({ isOpen, toggle }) => {
    const { user, logout, token } = useAuth();
    const [chats, setChats] = useState([]);
    const [isLogoutModalOpen, setLogoutModalOpen] = useState(false);
    const [isClearModalOpen, setClearModalOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (token) {
            fetchChats();
        }
    }, [token]);

    const fetchChats = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/chats', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) setChats(data.slice(0, 20)); // Up to 20 chats
        } catch (err) {
            console.error('Failed to fetch chats');
        }
    };

    const handleNewChat = () => {
        navigate('/');
        if (window.innerWidth <= 768) toggle();
    };

    const onChatClick = (chatId) => {
        navigate(`/chat/${chatId}`);
        if (window.innerWidth <= 768) toggle();
    };

    const handleClearHistory = async () => {
        try {
            await fetch('http://localhost:5000/api/chats', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setChats([]);
            if (window.innerWidth <= 768) toggle();
            navigate('/');
        } catch (err) {
            console.error('Failed to clear history');
        }
    };

    const [isHeaderHovered, setIsHeaderHovered] = useState(false);

    return (
        <>
            <motion.aside
                animate={{ width: isOpen ? 280 : (window.innerWidth > 768 ? 80 : 0) }}
                className="glass border-r border-white/5 flex flex-col h-full z-20 shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div
                    onClick={!isOpen ? toggle : undefined}
                    onMouseEnter={() => setIsHeaderHovered(true)}
                    onMouseLeave={() => setIsHeaderHovered(false)}
                    className={`p-4 flex items-center ${isOpen ? 'justify-between' : 'justify-center'} w-full border-b border-white/5 ${!isOpen ? 'cursor-pointer hover:bg-white/10 bg-white/[0.02] transition-all py-6' : ''}`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg ${!isOpen && isHeaderHovered ? 'scale-110 shadow-indigo-600/40' : 'shadow-indigo-600/20'} shrink-0 transition-all duration-300`}>
                            {(!isOpen && isHeaderHovered) ? <ChevronRight size={24} /> : <Cpu size={24} />}
                        </div>
                        {isOpen && (
                            <motion.h2
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400 truncate"
                            >
                                GemAI
                            </motion.h2>
                        )}
                    </div>
                    {isOpen && (
                        <button onClick={toggle} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 ml-2 cursor-pointer">
                            <ChevronLeft size={20} />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className={`flex-1 ${isOpen ? 'px-3' : 'px-2'} py-6 space-y-6 overflow-y-auto custom-scrollbar w-full`}>
                    <button
                        onClick={handleNewChat}
                        className={`w-full flex items-center ${isOpen ? 'gap-3 px-3' : 'justify-center'} bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl transition-all shadow-lg shadow-indigo-500/10 active:scale-95 cursor-pointer`}
                        title={!isOpen ? "New Chat" : ""}
                    >
                        <Plus size={20} className={!isOpen ? 'scale-110' : ''} />
                        {isOpen && <span className="font-medium">New Chat</span>}
                    </button>

                    <div className="space-y-2">
                        {isOpen && (
                            <div className="flex items-center justify-between ml-2 mb-2">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recent</p>
                                <span className="text-[10px] bg-white/5 text-slate-500 px-1.5 py-0.5 rounded-md">{chats.length}</span>
                            </div>
                        )}
                        {chats.map(chat => (
                            <button
                                key={chat.id}
                                onClick={() => onChatClick(chat.id)}
                                className={`w-full flex items-center ${isOpen ? 'gap-3 px-3 text-left' : 'justify-center'} p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group cursor-pointer`}
                                title={!isOpen ? chat.title : ""}
                            >
                                <MessageSquare size={18} className="shrink-0" />
                                {isOpen && <span className="truncate text-sm flex-1">{chat.title}</span>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 space-y-3 w-full bg-white/[0.01]">
                    {isOpen && (
                        <button
                            onClick={() => setClearModalOpen(true)}
                            className="w-full flex items-center gap-3 p-3 text-slate-500 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all cursor-pointer"
                        >
                            <Trash2 size={18} />
                            <span className="text-sm">Clear History</span>
                        </button>
                    )}

                    <div className={`flex items-center ${isOpen ? 'gap-3 p-3' : 'justify-center p-0'} rounded-xl bg-white/5 py-3 transition-colors hover:bg-white/10`}>
                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                            <UserIcon size={20} />
                        </div>
                        {isOpen && (
                            <>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                </div>
                                <button
                                    onClick={() => setLogoutModalOpen(true)}
                                    className="p-2 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-colors cursor-pointer"
                                >
                                    <LogOut size={18} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </motion.aside>

            {/* Modals */}
            <ConfirmationModal
                isOpen={isLogoutModalOpen}
                onClose={() => setLogoutModalOpen(false)}
                onConfirm={logout}
                title="Log Out"
                message="Are you sure you want to log out of GemAI? You will need to sign in again to access your chats."
                confirmText="Log Out"
                type="danger"
            />

            <ConfirmationModal
                isOpen={isClearModalOpen}
                onClose={() => setClearModalOpen(false)}
                onConfirm={handleClearHistory}
                title="Clear History"
                message="This will permanently delete all your chat history. This action cannot be undone."
                confirmText="Clear All"
                type="danger"
            />
        </>
    );
};

export default Sidebar;
