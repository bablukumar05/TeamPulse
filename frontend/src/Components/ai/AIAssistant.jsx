import React, { useState, useContext, useRef, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from '../../Context/AuthProvider';

const QUICK_ACTIONS = [
  { label: '📊 Summarize My Tasks', action: 'summarize' },
  { label: '⚠️ What is Overdue?',   action: 'overdue' },
  { label: '📝 Weekly Report',      action: 'report' },
  { label: '🌴 Leave Info',          action: 'leave' },
];

const AIAssistant = () => {
  const { token, authUser } = useContext(AuthContext);
  const [isOpen, setIsOpen]         = useState(false);
  const [messages, setMessages]     = useState([
    { sender: 'ai', text: `Hi ${authUser?.firstName || 'there'}! I'm your TeamPulse AI Assistant. How can I help you today?` }
  ]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const chatEndRef = useRef(null);
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const sendQuery = async (userMessage) => {
    if (!userMessage.trim()) return;

    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('/api/ai/chat', { message: userMessage }, { headers });
      setMessages(prev => [...prev, { sender: 'ai', text: res.data.reply }]);
    } catch {
      toast.error('AI assistant offline');
      setMessages(prev => [...prev, { sender: 'ai', text: 'Sorry, I am having trouble connecting right now.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (actionType) => {
    if (actionType === 'summarize') {
      setMessages(prev => [...prev, { sender: 'user', text: 'Summarize my tasks' }]);
      setLoading(true);
      try {
        const res = await axios.post('/api/ai/summarize-tasks', {}, { headers });
        const data = res.data;
        const text = `${data.greeting}\n\n` +
          `• Total Tasks: ${data.metrics.total}\n` +
          `• Completed: ${data.metrics.completed} (${data.metrics.completionRate})\n` +
          `• In Progress: ${data.metrics.inProgress}\n` +
          `• Overdue: ${data.metrics.overdue}\n\n` +
          `**Recommendation:** ${data.recommendation}`;
        setMessages(prev => [...prev, { sender: 'ai', text }]);
      } catch {
        toast.error('Failed to summarize tasks');
      } finally { setLoading(false); }
    } else if (actionType === 'report') {
      setMessages(prev => [...prev, { sender: 'user', text: 'Generate weekly report' }]);
      setLoading(true);
      try {
        const res = await axios.post('/api/ai/generate-report', { timeframe: 'weekly' }, { headers });
        const data = res.data;
        const text = `**${data.title}**\n${data.period}\n\n` +
          `${data.summary}\n\n` +
          `**Performance Rating:** ${data.score}`;
        setMessages(prev => [...prev, { sender: 'ai', text }]);
      } catch {
        toast.error('Failed to generate report');
      } finally { setLoading(false); }
    } else if (actionType === 'overdue') {
      sendQuery('What tasks are overdue?');
    } else if (actionType === 'leave') {
      sendQuery('How much leave do I have?');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-2xl flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:scale-110 active:scale-95 transition-all duration-300 group"
          title="Open AI Assistant"
        >
          <span className="group-hover:rotate-12 transition-transform">🤖</span>
        </button>
      )}

      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[500px] bg-[#12141c] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl animate-in fade-in zoom-in duration-200">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-base">
                🤖
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">TeamPulse AI</h3>
                <p className="text-[10px] text-indigo-300 font-medium">Smart Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white text-base px-2 py-1 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Quick Action Chips */}
          <div className="p-2 border-b border-white/[0.04] bg-white/[0.02] flex gap-1.5 overflow-x-auto">
            {QUICK_ACTIONS.map(qa => (
              <button
                key={qa.action}
                onClick={() => handleQuickAction(qa.action)}
                className="text-[10px] font-bold bg-white/5 hover:bg-indigo-500/20 text-gray-300 hover:text-indigo-300 border border-white/10 hover:border-indigo-500/30 px-2.5 py-1 rounded-full whitespace-nowrap transition-all flex-shrink-0"
              >
                {qa.label}
              </button>
            ))}
          </div>

          {/* Messages Scroll View */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 text-xs ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-6 h-6 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-[10px] flex-shrink-0">
                    🤖
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-white/[0.05] text-gray-200 border border-white/10 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-indigo-400 italic">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                AI is thinking…
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); sendQuery(input); }}
            className="p-3 border-t border-white/[0.08] bg-[#0c0e14] flex items-center gap-2"
          >
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask AI anything about your work…"
              className="flex-1 text-xs px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl disabled:opacity-50 hover:scale-105 transition-all"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
