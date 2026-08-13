import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from '../../Context/AuthProvider';

const NOTIF_ICONS = {
  task_assigned: '📌',
  task_due_tomorrow: '⏰',
  task_overdue: '⚠️',
  task_status_changed: '🔄',
  task_commented: '💬',
  task_mentioned: '🏷️',
  task_completed: '✅',
  checklist_completed: '✔',
  sprint_started: '🚀',
  sprint_completed: '⚡',
  milestone_reached: '🏁',
  leave_submitted: '🌴',
  leave_approved: '✅',
  leave_denied: '❌',
  project_created: '📁',
  project_member_added: '👥',
  announcement: '📢',
  kudo_received: '👏',
  dm_received: '💬',
  group_message: '👥',
  mention_in_chat: '🏷️',
  join_request_approved: '🎉',
  system: '⚙️',
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const NotificationCenter = () => {
  const { token } = useContext(AuthContext);
  const [isOpen, setIsOpen]               = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(false);
  const dropdownRef = useRef(null);
  const headers = { Authorization: `Bearer ${token}` };

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await axios.get('/api/notifications?limit=20', { headers });
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch { /* silent fail */ }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Polling every 15s
    return () => clearInterval(interval);
  }, [token]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await axios.put('/api/notifications/read-all', {}, { headers });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All marked as read');
    } catch { toast.error('Failed to mark read'); }
  };

  const markOneRead = async (id, link) => {
    try {
      await axios.put(`/api/notifications/${id}/read`, {}, { headers });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      if (link) window.location.href = link;
    } catch { /* silent */ }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-colors border border-white/10"
        aria-label="Notifications"
      >
        <span className="text-lg">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-[#0B0B0B] animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#12141a] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden text-white backdrop-blur-xl">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded-full border border-red-500/30">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-white/[0.04]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-2">🔕</div>
                <p className="text-gray-400 text-xs font-semibold">No notifications</p>
                <p className="text-gray-600 text-[11px] mt-0.5">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => markOneRead(notif._id, notif.link)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors hover:bg-white/[0.05] ${
                    !notif.isRead ? 'bg-indigo-500/[0.06]' : ''
                  }`}
                >
                  <div className="text-xl flex-shrink-0 mt-0.5">
                    {NOTIF_ICONS[notif.type] || '🔔'}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs font-semibold truncate ${!notif.isRead ? 'text-white font-bold' : 'text-gray-300'}`}>
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-gray-500 whitespace-nowrap">
                        {timeAgo(notif.createdAt)}
                      </span>
                    </div>
                    {notif.body && (
                      <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.body}
                      </p>
                    )}
                  </div>
                  {!notif.isRead && (
                    <div className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
