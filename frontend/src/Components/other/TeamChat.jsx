import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from '../../Context/AuthProvider';
import ChatSidebar from '../chat/ChatSidebar';
import ChatWindow from '../chat/ChatWindow';
import ThreadPanel from '../chat/ThreadPanel';
import { io } from 'socket.io-client';

const TeamChat = () => {
  const { token, authUser } = useContext(AuthContext);
  const [rooms, setRooms]             = useState([]);
  const [activeRoom, setActiveRoom]   = useState(null);
  const [messages, setMessages]       = useState([]);
  const [users, setUsers]             = useState([]);
  const [threadParent, setThreadParent] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const socketRef = useRef(null);

  const currentUserId = authUser?.data?._id || authUser?._id;
  const headers = { Authorization: `Bearer ${token}` };

  // Fetch rooms & users on mount
  useEffect(() => {
    const init = async () => {
      try {
        const [roomsRes, usersRes] = await Promise.all([
          axios.get('/api/chat/rooms', { headers }),
          axios.get('/api/admin/employees', { headers }),
        ]);
        setRooms(roomsRes.data || []);
        setUsers(usersRes.data || []);

        if (roomsRes.data?.length > 0) {
          setActiveRoom(roomsRes.data[0]);
        }
      } catch {
        toast.error('Failed to load chat');
      }
    };
    if (token) init();
  }, [token]);

  // Socket.IO Connection & Room Event Handlers
  useEffect(() => {
    if (!token) return;
    const socketUrl = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? window.location.origin : 'http://localhost:5000');
    const socket = io(socketUrl);
    socketRef.current = socket;

    socket.emit('authenticate', currentUserId);

    socket.on('newRoomMessage', (message) => {
      setMessages(prev => {
        if (prev.some(m => m._id === message._id)) return prev;
        return [...prev, message];
      });
    });

    socket.on('messageReactionUpdated', (message) => {
      setMessages(prev => prev.map(m => m._id === message._id ? message : m));
    });

    socket.on('userTyping', ({ userId, userName }) => {
      setTypingUsers(prev => prev.includes(userName) ? prev : [...prev, userName]);
    });

    socket.on('userStopTyping', ({ userName }) => {
      setTypingUsers(prev => prev.filter(u => u !== userName));
    });

    return () => {
      socket.disconnect();
    };
  }, [token, currentUserId]);

  // Handle active room change
  useEffect(() => {
    if (!activeRoom) return;
    const fetchRoomMessages = async () => {
      try {
        const res = await axios.get(`/api/chat/rooms/${activeRoom._id}/messages`, { headers });
        setMessages(res.data || []);
        if (socketRef.current) {
          socketRef.current.emit('joinRoom', activeRoom._id);
        }
      } catch { /* silent */ }
    };

    fetchRoomMessages();

    return () => {
      if (socketRef.current && activeRoom) {
        socketRef.current.emit('leaveRoom', activeRoom._id);
      }
    };
  }, [activeRoom, token]);

  const handleCreateRoom = async (roomData) => {
    try {
      const res = await axios.post('/api/chat/rooms', roomData, { headers });
      setRooms(prev => [res.data, ...prev]);
      setActiveRoom(res.data);
      toast.success('Room created!', { style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create room');
    }
  };

  const handleSendMessage = async ({ text, files, mentions }) => {
    if (!activeRoom) return;
    try {
      const formData = new FormData();
      formData.append('text', text);
      if (mentions) {
        mentions.forEach(id => formData.append('mentions', id));
      }
      if (files) {
        files.forEach(f => formData.append('attachments', f));
      }

      const res = await axios.post(`/api/chat/rooms/${activeRoom._id}/messages`, formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      });

      // Emit over socket
      if (socketRef.current) {
        socketRef.current.emit('sendRoomMessage', {
          roomId: activeRoom._id,
          message: res.data,
        });
      }
    } catch {
      toast.error('Failed to send message');
    }
  };

  const handleReact = async (messageId, emoji) => {
    try {
      const res = await axios.post(`/api/chat/messages/${messageId}/react`, { emoji }, { headers });
      if (socketRef.current && activeRoom) {
        socketRef.current.emit('messageReaction', {
          roomId: activeRoom._id,
          message: res.data,
        });
      }
    } catch {
      toast.error('Failed to add reaction');
    }
  };

  const handleEdit = async (messageId, text) => {
    try {
      const res = await axios.put(`/api/chat/messages/${messageId}`, { text }, { headers });
      setMessages(prev => prev.map(m => m._id === messageId ? res.data : m));
      toast.success('Message updated');
    } catch {
      toast.error('Failed to edit message');
    }
  };

  const handleDelete = async (messageId) => {
    try {
      await axios.delete(`/api/chat/messages/${messageId}`, { headers });
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, isDeleted: true, text: 'This message was deleted' } : m));
      toast.success('Message deleted');
    } catch {
      toast.error('Failed to delete message');
    }
  };

  const handleSendReply = async (parentMessageId, text) => {
    if (!activeRoom) return;
    try {
      const res = await axios.post(`/api/chat/rooms/${activeRoom._id}/messages`, {
        text,
        parentMessageId,
      }, { headers });

      if (socketRef.current) {
        socketRef.current.emit('sendRoomMessage', {
          roomId: activeRoom._id,
          message: res.data,
        });
      }
      setThreadParent(null);
    } catch {
      toast.error('Failed to send reply');
    }
  };

  return (
    <div className="flex h-[calc(100vh-100px)] bg-[#0A0C10] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
      {/* Rooms Sidebar */}
      <ChatSidebar
        rooms={rooms}
        activeRoom={activeRoom}
        onSelectRoom={setActiveRoom}
        onCreateRoom={handleCreateRoom}
        users={users}
        currentUserId={currentUserId}
      />

      {/* Active Conversation Window */}
      <ChatWindow
        room={activeRoom}
        messages={messages}
        currentUserId={currentUserId}
        onSendMessage={handleSendMessage}
        onReact={handleReact}
        onReply={setThreadParent}
        onEdit={handleEdit}
        onDelete={handleDelete}
        typingUsers={typingUsers}
        users={users}
      />

      {/* Thread Reply Panel */}
      {threadParent && (
        <ThreadPanel
          parentMessage={threadParent}
          onClose={() => setThreadParent(null)}
          onSendReply={handleSendReply}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
};

export default TeamChat;
