import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

const Layout = ({ children }) => {
    const { user } = useAuth();
    const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);

    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

    return (
        <div className="flex h-screen bg-slate-950 overflow-hidden font-sans relative">
            {/* Mobile Header */}
            {/* Mobile Header - only show when sidebar is NOT open */}
            <AnimatePresence>
                {!isSidebarOpen && (
                    <header className="md:hidden absolute top-0 left-0 right-0 h-16 glass border-b border-white/5 flex items-center px-4 z-30">
                        <button onClick={toggleSidebar} className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors">
                            <ChevronRight className="transition-transform duration-300" />
                        </button>
                        <h1 className="ml-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">
                            GemAI
                        </h1>
                    </header>
                )}
            </AnimatePresence>



            {/* Sidebar overlay for mobile */}
            {isSidebarOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <motion.div
                animate={{ width: isSidebarOpen ? 280 : (window.innerWidth > 768 ? 80 : 0) }}
                className="fixed inset-y-0 left-0 z-50 md:relative overflow-hidden"
            >
                <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />
            </motion.div>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black overflow-hidden relative">
                <div className="flex-1 overflow-hidden relative pt-16 md:pt-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={window.location.pathname}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="h-full"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default Layout;
