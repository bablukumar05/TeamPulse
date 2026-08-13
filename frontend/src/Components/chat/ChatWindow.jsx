import React, { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

const EMOJIS = ['👍', '❤️', '🎉', '🔥', '🚀', '👀', '💯', '👏', '✅', '💡'];

const ChatWindow = ({
  room,
  messages,
  currentUserId,
  onSendMessage,
  onReact,
  onReply,
  onEdit,
  onDelete,
  typingUsers,
  users,
}) => {
  const [inputText, setInputText]         = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mentionQuery, setMentionQuery]   = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  if (!room) {
    return (
      <div className="flex-1 bg-[#0d0f15] flex flex-col items-center justify-center text-center p-8 select-none">
        <div className="text-6xl mb-4">💬</div>
        <h3 className="text-lg font-bold text-white mb-1">Select a Conversation</h3>
        <p className="text-gray-500 text-xs max-w-sm">
          Choose a direct message or team channel from the sidebar to start chatting.
        </p>
      </div>
    );
  }

  const handleTextChange = (e) => {
    const val = e.target.value;
    setInputText(val);

    // Detect @mention
    const lastWord = val.split(' ').pop();
    if (lastWord.startsWith('@')) {
      setMentionQuery(lastWord.substring(1).toLowerCase());
    } else {
      setMentionQuery(null);
    }
  };

  const insertMention = (user) => {
    const words = inputText.split(' ');
    words.pop();
    setInputText(`${words.join(' ')} @${user.firstName} `);
    setMentionQuery(null);
  };

  const handleFileSelect = (e) => {
    if (e.target.files?.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() && selectedFiles.length === 0) return;

    // Detect mentioned user IDs
    const mentionedUserIds = (users || [])
      .filter(u => inputText.includes(`@${u.firstName}`))
      .map(u => u._id);

    onSendMessage({
      text: inputText,
      files: selectedFiles,
      mentions: mentionedUserIds,
    });

    setInputText('');
    setSelectedFiles([]);
    setShowEmojiPicker(false);
  };

  // Filter mention suggestions
  const mentionSuggestions = mentionQuery !== null
    ? (users || []).filter(u =>
        u.firstName?.toLowerCase().includes(mentionQuery) ||
        u.lastName?.toLowerCase().includes(mentionQuery)
      )
    : [];

  return (
    <div className="flex-1 bg-[#0d0f15] flex flex-col h-full overflow-hidden select-none">
      {/* Room Header */}
      <div className="px-6 py-3.5 border-b border-white/[0.08] bg-[#11131a] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            {room.type === 'DM' ? '💬' : room.type === 'Project' ? '📁' : '🏢'}
          </div>
          <div>
            <h2 className="font-bold text-sm text-white">{room.name}</h2>
            <p className="text-[10px] text-gray-500">
              {room.participants?.length || 0} members · {room.type}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-2">👋</div>
            <p className="text-gray-400 font-semibold text-sm">No messages yet</p>
            <p className="text-gray-600 text-xs mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map(msg => (
            <MessageBubble
              key={msg._id}
              message={msg}
              isOwn={msg.senderId?._id?.toString() === currentUserId?.toString() || msg.senderId?.toString() === currentUserId?.toString()}
              onReact={onReact}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}

        {/* Typing indicator */}
        {typingUsers?.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-500 italic px-2 py-1">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
            </span>
            <span>{typingUsers.join(', ')} typing…</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Selected File Previews */}
      {selectedFiles.length > 0 && (
        <div className="px-6 py-2 bg-white/[0.02] border-t border-white/[0.04] flex items-center gap-2 flex-wrap">
          {selectedFiles.map((file, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-lg">
              <span className="truncate max-w-[150px]">{file.name}</span>
              <button
                type="button"
                onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                className="text-gray-400 hover:text-white font-bold ml-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Mention Auto-complete Popup */}
      {mentionSuggestions.length > 0 && (
        <div className="mx-6 mb-1 bg-[#181a24] border border-white/10 rounded-xl max-h-36 overflow-y-auto p-1 shadow-2xl z-20">
          {mentionSuggestions.map(user => (
            <button
              key={user._id}
              type="button"
              onClick={() => insertMention(user)}
              className="w-full text-left text-xs px-3 py-1.5 hover:bg-indigo-600/30 text-white rounded-lg flex items-center gap-2"
            >
              <span className="font-bold">@{user.firstName} {user.lastName}</span>
              <span className="text-[10px] text-gray-500">({user.role})</span>
            </button>
          ))}
        </div>
      )}

      {/* Message Input Box */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/[0.08] bg-[#11131a] relative">
        {/* Emoji picker popup */}
        {showEmojiPicker && (
          <div className="absolute bottom-full mb-2 left-4 bg-[#181a24] border border-white/10 rounded-2xl p-2 shadow-2xl flex gap-1 z-30">
            {EMOJIS.map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  setInputText(prev => prev + emoji);
                  setShowEmojiPicker(false);
                }}
                className="hover:scale-125 transition-transform text-lg p-1.5"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* File Attachment Button */}
          <label className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer transition-colors border border-white/10">
            📎
            <input type="file" multiple className="hidden" onChange={handleFileSelect} />
          </label>

          {/* Emoji Toggle Button */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/10 text-sm"
          >
            😀
          </button>

          {/* Text Input */}
          <input
            value={inputText}
            onChange={handleTextChange}
            placeholder={`Message ${room.name}… (Type @ to mention)`}
            className="flex-1 text-xs px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 outline-none focus:border-indigo-500 transition-colors"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() && selectedFiles.length === 0}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-indigo-600/20"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
