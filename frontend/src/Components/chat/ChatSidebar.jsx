import React, { useState } from 'react';

const ROOM_ICONS = {
  DM: '💬',
  Group: '👥',
  Project: '📁',
  Department: '🏢',
  Announcement: '📢',
};

const ChatSidebar = ({ rooms, activeRoom, onSelectRoom, onCreateRoom, users, currentUserId }) => {
  const [search, setSearch]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newType, setNewType]     = useState('Group');
  const [newName, setNewName]     = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Filter rooms by search
  const filtered = rooms.filter(r => {
    if (!search) return true;
    const nameMatch = r.name?.toLowerCase().includes(search.toLowerCase());
    const participantMatch = r.participants?.some(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
    );
    return nameMatch || participantMatch;
  });

  // Group rooms by type
  const dms          = filtered.filter(r => r.type === 'DM');
  const projectRooms = filtered.filter(r => r.type === 'Project');
  const deptRooms    = filtered.filter(r => r.type === 'Department');
  const groupRooms   = filtered.filter(r => r.type === 'Group' || r.type === 'Announcement');

  const getDMOtherUser = (room) => {
    return room.participants?.find(p => p._id?.toString() !== currentUserId?.toString()) || room.participants?.[0];
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newName.trim() && newType !== 'DM') return;
    onCreateRoom({
      type: newType,
      name: newName,
      participants: selectedUsers,
    });
    setNewName('');
    setSelectedUsers([]);
    setShowModal(false);
  };

  const toggleUserSelect = (uId) => {
    setSelectedUsers(prev =>
      prev.includes(uId) ? prev.filter(id => id !== uId) : [...prev, uId]
    );
  };

  return (
    <div className="w-72 bg-[#101218] border-r border-white/[0.08] flex flex-col h-full select-none">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
        <h2 className="font-black text-lg bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          Conversations
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center text-base transition-colors shadow-lg shadow-indigo-600/20"
          title="New Chat / Group"
        >
          +
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-white/[0.04]">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search rooms or people…"
          className="w-full text-xs px-3 py-2 bg-white/[0.05] border border-white/10 rounded-xl text-white placeholder-gray-500 outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Room categories list */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {/* Direct Messages */}
        <div>
          <div className="px-2 mb-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center justify-between">
            <span>Direct Messages</span>
            <span className="text-gray-600">{dms.length}</span>
          </div>
          <div className="space-y-0.5">
            {dms.map(room => {
              const other = getDMOtherUser(room);
              const isSelected = activeRoom?._id === room._id;
              return (
                <button
                  key={room._id}
                  onClick={() => onSelectRoom(room)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all ${
                    isSelected ? 'bg-indigo-500/20 text-white border border-indigo-500/30' : 'text-gray-400 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                      {other?.firstName?.charAt(0) || '?'}
                    </div>
                    {other?.isOnline && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#101218]" />
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-semibold truncate text-white">
                      {other ? `${other.firstName} ${other.lastName || ''}` : room.name}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate">
                      {room.lastMessage?.text || 'No messages yet'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Project Rooms */}
        {projectRooms.length > 0 && (
          <div>
            <div className="px-2 mb-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center justify-between">
              <span>Project Rooms</span>
              <span className="text-gray-600">{projectRooms.length}</span>
            </div>
            <div className="space-y-0.5">
              {projectRooms.map(room => {
                const isSelected = activeRoom?._id === room._id;
                return (
                  <button
                    key={room._id}
                    onClick={() => onSelectRoom(room)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all ${
                      isSelected ? 'bg-indigo-500/20 text-white border border-indigo-500/30' : 'text-gray-400 hover:bg-white/[0.05] hover:text-white'
                    }`}
                  >
                    <span className="text-base flex-shrink-0">📁</span>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-semibold truncate text-white">#{room.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{room.lastMessage?.text || 'No messages'}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Department Rooms */}
        {deptRooms.length > 0 && (
          <div>
            <div className="px-2 mb-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center justify-between">
              <span>Department Rooms</span>
              <span className="text-gray-600">{deptRooms.length}</span>
            </div>
            <div className="space-y-0.5">
              {deptRooms.map(room => {
                const isSelected = activeRoom?._id === room._id;
                return (
                  <button
                    key={room._id}
                    onClick={() => onSelectRoom(room)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all ${
                      isSelected ? 'bg-indigo-500/20 text-white border border-indigo-500/30' : 'text-gray-400 hover:bg-white/[0.05] hover:text-white'
                    }`}
                  >
                    <span className="text-base flex-shrink-0">🏢</span>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-semibold truncate text-white">#{room.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{room.lastMessage?.text || 'No messages'}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Group Chats */}
        {groupRooms.length > 0 && (
          <div>
            <div className="px-2 mb-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center justify-between">
              <span>Groups</span>
              <span className="text-gray-600">{groupRooms.length}</span>
            </div>
            <div className="space-y-0.5">
              {groupRooms.map(room => {
                const isSelected = activeRoom?._id === room._id;
                return (
                  <button
                    key={room._id}
                    onClick={() => onSelectRoom(room)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all ${
                      isSelected ? 'bg-indigo-500/20 text-white border border-indigo-500/30' : 'text-gray-400 hover:bg-white/[0.05] hover:text-white'
                    }`}
                  >
                    <span className="text-base flex-shrink-0">👥</span>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-semibold truncate text-white">{room.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{room.lastMessage?.text || 'No messages'}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* New Room Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#161922] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 text-white">
            <h3 className="text-lg font-bold">New Conversation</h3>

            <div className="flex gap-2">
              {['Group', 'Project', 'Department'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setNewType(t)}
                  className={`flex-1 text-xs font-bold py-2 rounded-xl border transition-all ${
                    newType === t ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white/5 text-gray-400 border-white/10'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <input
                required
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Room Name (e.g. Frontend Team)"
                className="w-full text-xs px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 outline-none focus:border-indigo-500"
              />

              {/* User Selection */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">
                  Add Members ({selectedUsers.length} selected)
                </label>
                <div className="max-h-40 overflow-y-auto space-y-1 bg-white/[0.03] border border-white/10 rounded-xl p-2">
                  {(users || []).map(u => (
                    <div
                      key={u._id}
                      onClick={() => toggleUserSelect(u._id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                        selectedUsers.includes(u._id) ? 'bg-indigo-500/20 text-indigo-300 font-semibold' : 'text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      <span>{u.firstName} {u.lastName || ''} ({u.role})</span>
                      {selectedUsers.includes(u._id) && <span>✓</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
                >
                  Create Room
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-bold py-2.5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatSidebar;
