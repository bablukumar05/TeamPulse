import React, { useState } from 'react';

const ThreadPanel = ({ parentMessage, onClose, onSendReply, currentUserId }) => {
  const [text, setText] = useState('');

  if (!parentMessage) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendReply(parentMessage._id, text.trim());
    setText('');
  };

  return (
    <div className="w-80 bg-[#12141c] border-l border-white/[0.08] flex flex-col h-full z-30 select-none">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-white">Thread</h3>
          <p className="text-[10px] text-gray-500">Replying to message</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-lg px-2"
        >
          ✕
        </button>
      </div>

      {/* Parent Message Card */}
      <div className="p-4 bg-white/[0.02] border-b border-white/[0.04]">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
            {parentMessage.senderName?.charAt(0) || 'U'}
          </div>
          <span className="text-xs font-bold text-gray-300">{parentMessage.senderName}</span>
        </div>
        <p className="text-xs text-gray-400 bg-white/5 p-2.5 rounded-xl border border-white/5">
          {parentMessage.text}
        </p>
      </div>

      {/* Replies Placeholder / Info */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-widest text-center">
          Thread Replies
        </p>
        <p className="text-xs text-gray-600 text-center">
          Replies sent here will reference this message.
        </p>
      </div>

      {/* Reply Input Box */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-white/[0.08] bg-[#0c0e14]">
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Reply in thread…"
            className="flex-1 text-xs px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-3 py-2.5 rounded-xl transition-colors"
          >
            Reply
          </button>
        </div>
      </form>
    </div>
  );
};

export default ThreadPanel;
