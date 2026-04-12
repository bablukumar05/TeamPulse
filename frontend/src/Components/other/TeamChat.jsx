import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from "../../Context/AuthProvider";
import { socket } from "../../App";

const TeamChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const { authUser, token } = useContext(AuthContext);
    const endOfMessagesRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;

        const fetchMessages = async () => {
            try {
                const res = await axios.get('/api/chat', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMessages(res.data);
            } catch (error) {
                console.error("Failed to fetch chat history", error);
            }
        };
        fetchMessages();
    }, [isOpen, token]);

    useEffect(() => {
        // Since socket is exported using live bindings, we should re-attach our event if it changes,
        // but socket is usually stable once connected.
        if (!socket) return;

        const handleReceive = (msg) => {
            setMessages(prev => {
                // Prevent duplicate message from showing if socket fired twice or we already rendered
                if (prev.find(m => m._id === msg._id)) return prev;
                return [...prev, msg];
            });
        };

        socket.on('receiveGlobalMessage', handleReceive);

        return () => {
            socket.off('receiveGlobalMessage', handleReceive);
        };
    }, []);

    useEffect(() => {
        if (isOpen) {
            endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;

        const userData = authUser.data || authUser; 

        socket.emit('sendGlobalMessage', {
            senderId: userData._id || userData.id, // Admin uses authUser.data
            senderName: userData.firstName,
            senderRole: authUser.role,
            text: newMessage.trim()
        });
        setNewMessage("");
    };

    if (!authUser) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {isOpen && (
                <div className="mb-4 w-[350px] sm:w-[400px] h-[450px] bg-[#161a23]/90 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border-b border-white/5 p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                            <h3 className="font-bold text-white tracking-wide">Company Chat</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans">
                        {messages.length === 0 ? (
                            <p className="text-center text-gray-500 mt-10 text-sm">No messages yet. Say hello!</p>
                        ) : (
                            messages.map((msg, idx) => {
                                const isMe = (authUser.data || authUser).firstName === msg.senderName;
                                return (
                                    <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className="text-xs font-semibold text-gray-300">{isMe ? 'You' : msg.senderName}</span>
                                            <span className="text-[10px] text-gray-500">{msg.senderRole}</span>
                                        </div>
                                        <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/10 text-gray-200 rounded-tl-none'} shadow-md`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={endOfMessagesRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white/5 border-t border-white/5">
                        <form onSubmit={handleSend} className="flex gap-2">
                            <input 
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 bg-white/10 border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                            />
                            <button 
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-400 disabled:opacity-50 transition-colors"
                            >
                                <svg className="w-5 h-5 translate-x-[-1px] translate-y-[-1px]" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {!isOpen && (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-[0_10px_30px_rgba(59,130,246,0.6)] hover:-translate-y-1 transition-all duration-300"
                >
                    <svg className="w-6 h-6 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-[#11141c]"></span>
                    </span>
                </button>
            )}
        </div>
    );
};

export default TeamChat;
