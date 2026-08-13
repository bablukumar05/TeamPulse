import React, { useState } from 'react';

const EMOJI_OPTIONS = ['👍', '❤️', '🎉', '🔥', '🚀', '👀', '💯'];

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const MessageBubble = ({ message, isOwn, onReact, onReply, onEdit, onDelete }) => {
  const [showReactions, setShowReactions] = useState(false);
  const [isEditing, setIsEditing]           = useState(false);
  const [editText, setEditText]             = useState(message.text || '');

  const sender = typeof message.senderId === 'object' ? message.senderId : { firstName: message.senderName || 'User' };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editText.trim()) return;
    onEdit(message._id, editText);
    setIsEditing(false);
  };

  return (
    <div className={`group relative flex items-start gap-3 my-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5">
        {sender.firstName?.charAt(0) || message.senderName?.charAt(0) || '?'}
      </div>

      {/* Bubble Container */}
      <div className={`max-w-[75%] space-y-1 ${isOwn ? 'items-end text-right' : 'items-start text-left'}`}>
        {/* Sender Name & Role & Time */}
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs font-bold text-gray-300">
            {message.senderName || `${sender.firstName} ${sender.lastName || ''}`}
          </span>
          <span className="text-[10px] text-gray-500">{formatTime(message.createdAt)}</span>
          {message.isEdited && <span className="text-[9px] text-gray-600 italic">(edited)</span>}
        </div>

        {/* Parent Message Preview (Thread/Reply Context) */}
        {message.parentMessage && (
          <div className="text-[11px] bg-white/[0.04] border-l-2 border-indigo-500 px-2.5 py-1 rounded text-gray-400 max-w-full truncate">
            <span className="font-bold text-indigo-400">Replying to: </span>
            {message.parentMessage.text || 'Attachment'}
          </div>
        )}

        {/* Bubble */}
        <div
          className={`relative rounded-2xl px-4 py-2.5 text-xs leading-relaxed transition-all ${
            isOwn
              ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-600/10'
              : 'bg-[#1b1e28] text-gray-200 border border-white/[0.08] rounded-tl-none'
          } ${message.isDeleted ? 'italic text-gray-500 bg-white/5 border-none' : ''}`}
        >
          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="flex gap-2 min-w-[200px]">
              <input
                value={editText}
                onChange={e => setEditText(e.target.value)}
                className="flex-1 bg-black/30 text-white px-2 py-1 rounded outline-none border border-white/20 text-xs"
                autoFocus
              />
              <button type="submit" className="text-[10px] bg-emerald-500 text-white px-2 rounded font-bold">Save</button>
              <button type="button" onClick={() => setIsEditing(false)} className="text-[10px] bg-white/20 text-white px-2 rounded">Cancel</button>
            </form>
          ) : (
            <p className="whitespace-pre-wrap break-words">{message.text}</p>
          )}

          {/* File Attachments */}
          {message.attachments?.length > 0 && (
            <div className="mt-2 space-y-1.5 pt-2 border-t border-white/10">
              {message.attachments.map((att, idx) => (
                <a
                  key={idx}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-black/20 hover:bg-black/30 p-1.5 rounded-lg border border-white/10 text-[11px] text-indigo-300 font-medium truncate transition-colors"
                >
                  <span>📎</span>
                  <span className="truncate">{att.filename}</span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Reactions List */}
        {message.reactions?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 px-1">
            {message.reactions.map((r, idx) => (
              <button
                key={idx}
                onClick={() => onReact(message._id, r.emoji)}
                className="inline-flex items-center gap-1 text-[11px] bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 px-2 py-0.5 rounded-full transition-colors"
              >
                <span>{r.emoji}</span>
                <span className="text-[10px] text-gray-400 font-bold">{r.users?.length || 1}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action Toolbar on Hover */}
      {!message.isDeleted && (
        <div className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-[#1a1d27] border border-white/10 rounded-xl px-2 py-1 shadow-xl z-20 ${
          isOwn ? 'right-0 -top-7' : 'left-0 -top-7'
        }`}>
          {/* Reaction Picker Button */}
          <div className="relative">
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="text-xs hover:scale-125 transition-transform px-1"
              title="Add Reaction"
            >
              😀
            </button>

            {/* Popup Emoji Bar */}
            {showReactions && (
              <div className="absolute bottom-full mb-1 left-0 flex gap-1 bg-[#12141c] border border-white/10 p-1.5 rounded-xl shadow-2xl z-30 animate-in fade-in zoom-in duration-150">
                {EMOJI_OPTIONS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReact(message._id, emoji);
                      setShowReactions(false);
                    }}
                    className="hover:scale-125 transition-transform text-sm p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reply in Thread */}
          <button
            onClick={() => onReply(message)}
            className="text-xs text-gray-400 hover:text-indigo-400 px-1"
            title="Reply in Thread"
          >
            💬
          </button>

          {/* Edit (if own) */}
          {isOwn && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-gray-400 hover:text-amber-400 px-1"
              title="Edit Message"
            >
              ✏️
            </button>
          )}

          {/* Delete (if own) */}
          {isOwn && (
            <button
              onClick={() => onDelete(message._id)}
              className="text-xs text-gray-400 hover:text-red-400 px-1"
              title="Delete Message"
            >
              🗑️
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
