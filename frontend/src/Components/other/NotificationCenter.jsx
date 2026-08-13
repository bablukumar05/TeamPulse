import React, { useState, useEffect } from 'react';
import { socket } from "../../App";

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!socket) return;

    const handleNewTask = (data) => {
      addNotification({ title: 'New Task Assigned', message: data.message, time: new Date(), type: 'info' });
    };

    const handleAdminNotification = (data) => {
      addNotification({ title: 'System Alert', message: data.message, time: new Date(), type: data.status === 'Failed' ? 'error' : 'success' });
    };

    socket.on('newTaskAssigned', handleNewTask);
    socket.on('adminTaskNotification', handleAdminNotification);

    return () => {
      socket.off('newTaskAssigned', handleNewTask);
      socket.off('adminTaskNotification', handleAdminNotification);
    };
  }, []);

  const addNotification = (notif) => {
    setNotifications(prev => [notif, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const markAllRead = () => {
    setUnreadCount(0);
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) markAllRead();
        }}
        className="group relative inline-flex items-center justify-center p-2.5 text-gray-300 transition-all duration-200 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg shadow-lg hover:scale-[1.02]"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-[#1A1A1A]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] z-50 overflow-hidden transform opacity-100 scale-100 transition-all duration-200">
          <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
            <h3 className="text-sm font-bold tracking-wider text-gray-200 uppercase">Notifications</h3>
            {notifications.length > 0 && (
                <button onClick={() => setNotifications([])} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Clear All</button>
            )}
          </div>
          
          <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                No new notifications
              </div>
            ) : (
              notifications.map((notif, idx) => (
                <div key={idx} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${notif.type === 'error' ? 'bg-red-500' : notif.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors">{notif.title}</h4>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{notif.message}</p>
                        <span className="text-[10px] text-gray-500 mt-2 block font-medium">
                            {notif.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                  </div>
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
