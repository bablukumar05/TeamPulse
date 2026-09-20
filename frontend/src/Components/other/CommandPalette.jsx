import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../Context/AuthProvider';

const NAV_SHORTCUTS = [
  { id: 'dashboard', title: 'Dashboard', icon: '🏠', category: 'Navigation', shortcut: 'G D' },
  { id: 'reviews', title: 'Squad Reviews & QA', icon: '🔍', category: 'Navigation', shortcut: 'G Q' },
  { id: 'integrations', title: 'Integrations & APM (GitHub, Slack, Cal)', icon: '🔌', category: 'Navigation', shortcut: 'G I' },
  { id: 'teams', title: 'Teams & Squads', icon: '🛡️', category: 'Navigation', shortcut: 'G T' },
  { id: 'settings', title: 'Workspace Settings', icon: '⚙️', category: 'Navigation', shortcut: 'G S' },
  { id: 'projects', title: 'Projects Overview', icon: '📁', category: 'Navigation', shortcut: 'G P' },
  { id: 'kanban', title: 'Kanban Board', icon: '📋', category: 'Navigation', shortcut: 'G K' },
  { id: 'calendar', title: 'Calendar Schedule', icon: '📅', category: 'Navigation', shortcut: 'G C' },
  { id: 'tasks', title: 'All Tasks & Workflow', icon: '✅', category: 'Navigation', shortcut: 'G A' },
  { id: 'chat', title: 'Team Chat & Channels', icon: '💬', category: 'Navigation', shortcut: 'G M' },
  { id: 'hr', title: 'HR & Directory', icon: '👥', category: 'Navigation', shortcut: 'G H' },
  { id: 'reports', title: 'Analytics & Reports', icon: '📈', category: 'Navigation', shortcut: 'G R' },
  { id: 'audit', title: 'Audit Logs', icon: '📊', category: 'Navigation', shortcut: 'G L' }
];

const ACTION_SHORTCUTS = [
  { id: 'action-task', title: 'Create New Task', icon: '⚡', category: 'Quick Action', action: 'create-task' },
  { id: 'action-project', title: 'Create New Project', icon: '🚀', category: 'Quick Action', action: 'create-project' },
  { id: 'action-leave', title: 'Request Time Off', icon: '🏖️', category: 'Quick Action', action: 'request-leave' },
  { id: 'action-sync', title: 'Sync Live Data', icon: '🔄', category: 'Quick Action', action: 'refetch-data' }
];

const CommandPalette = ({ isOpen, setIsOpen, setActiveNav, onOpenTaskModal, onOpenProjectModal }) => {
  const { token } = useContext(AuthContext);
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    const handleCustomOpen = () => setIsOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('openCommandPalette', handleCustomOpen);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('openCommandPalette', handleCustomOpen);
    };
  }, [setIsOpen]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!token || !isOpen) return;
    const delayDebounce = setTimeout(() => {
      const url = query.trim()
        ? `/api/workspace/users/directory?search=${encodeURIComponent(query.trim())}`
        : '/api/workspace/users/directory';

      axios
        .get(url, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          if (Array.isArray(res.data)) {
            setUsers(res.data.slice(0, 5));
          }
        })
        .catch(() => setUsers([]));
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [query, token, isOpen]);

  const filteredNav = NAV_SHORTCUTS.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  const filteredActions = ACTION_SHORTCUTS.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  const directoryItems = users.map((u) => ({
    id: `user-${u._id}`,
    title: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
    subtitle: `${u.designation || u.role || 'Member'} ${u.department ? '• ' + u.department : ''}`,
    icon: u.avatar ? (
      <img src={u.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
    ) : (
      '👤'
    ),
    category: 'Team Directory',
    data: u
  }));

  const allVisibleItems = [...filteredActions, ...filteredNav, ...directoryItems];

  const handleSelect = (item) => {
    if (!item) return;

    if (item.category === 'Navigation') {
      if (setActiveNav) setActiveNav(item.id);
      setIsOpen(false);
      return;
    }

    if (item.category === 'Quick Action') {
      if (item.action === 'create-task') {
        if (setActiveNav) setActiveNav('dashboard');
        if (onOpenTaskModal) onOpenTaskModal();
      } else if (item.action === 'create-project') {
        if (setActiveNav) setActiveNav('projects');
        if (onOpenProjectModal) onOpenProjectModal();
      } else if (item.action === 'refetch-data') {
        window.dispatchEvent(new CustomEvent('adminDataRefetch'));
      }
      setIsOpen(false);
      return;
    }

    if (item.category === 'Team Directory') {
      if (setActiveNav) setActiveNav('hr');
      setIsOpen(false);
      return;
    }

    setIsOpen(false);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, allVisibleItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allVisibleItems.length) % Math.max(1, allVisibleItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allVisibleItems[selectedIndex]) {
        handleSelect(allVisibleItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-[#0D121F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 bg-white/[0.02]">
          <span className="text-zinc-400 mr-3 text-lg">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Type a command, screen name, or search employee..."
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded bg-white/5 mr-2"
            >
              Clear
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono text-zinc-400 bg-white/5 border border-white/10 rounded">
            ESC
          </kbd>
        </div>

        <div className="overflow-y-auto p-2 divide-y divide-white/5 space-y-2">
          {allVisibleItems.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-zinc-400 text-sm font-medium">No results found for "{query}"</p>
              <p className="text-zinc-600 text-xs mt-1">Try searching for Dashboard, Teams, Tasks, or an Employee name.</p>
            </div>
          ) : (
            <>
              {filteredActions.length > 0 && (
                <div className="pt-1">
                  <div className="px-3 py-1 text-[10px] font-semibold tracking-wider uppercase text-indigo-400/80">
                    Quick Actions
                  </div>
                  {filteredActions.map((item) => {
                    const globalIdx = allVisibleItems.indexOf(item);
                    const isSelected = globalIdx === selectedIndex;
                    return (
                      <div
                        key={item.id}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        onClick={() => handleSelect(item)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-medium transition-all ${
                          isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-zinc-300 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{item.icon}</span>
                          <span>{item.title}</span>
                        </div>
                        <span className={`text-[10px] font-mono ${isSelected ? 'text-indigo-200' : 'text-zinc-500'}`}>
                          Action
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {filteredNav.length > 0 && (
                <div className="pt-2">
                  <div className="px-3 py-1 text-[10px] font-semibold tracking-wider uppercase text-zinc-500">
                    Navigation Views
                  </div>
                  {filteredNav.map((item) => {
                    const globalIdx = allVisibleItems.indexOf(item);
                    const isSelected = globalIdx === selectedIndex;
                    return (
                      <div
                        key={item.id}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        onClick={() => handleSelect(item)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-xs font-medium transition-all ${
                          isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-zinc-300 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{item.icon}</span>
                          <span>{item.title}</span>
                        </div>
                        {item.shortcut && (
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                            isSelected ? 'bg-indigo-700/50 border-indigo-400/40 text-indigo-100' : 'bg-white/5 border-white/10 text-zinc-500'
                          }`}>
                            {item.shortcut}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {directoryItems.length > 0 && (
                <div className="pt-2">
                  <div className="px-3 py-1 text-[10px] font-semibold tracking-wider uppercase text-emerald-400/80">
                    Team Directory ({directoryItems.length})
                  </div>
                  {directoryItems.map((item) => {
                    const globalIdx = allVisibleItems.indexOf(item);
                    const isSelected = globalIdx === selectedIndex;
                    return (
                      <div
                        key={item.id}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        onClick={() => handleSelect(item)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-xs font-medium transition-all ${
                          isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-zinc-300 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-5 h-5 flex items-center justify-center text-sm">{item.icon}</div>
                          <div>
                            <p className="text-xs font-medium text-white">{item.title}</p>
                            <p className={`text-[10px] ${isSelected ? 'text-indigo-200' : 'text-zinc-500'}`}>
                              {item.subtitle}
                            </p>
                          </div>
                        </div>
                        <span className={`text-[10px] ${isSelected ? 'text-indigo-200' : 'text-zinc-500'}`}>
                          View Profile →
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-4">
            <span><kbd className="font-mono bg-white/5 px-1 py-0.5 rounded border border-white/10">↑↓</kbd> Navigate</span>
            <span><kbd className="font-mono bg-white/5 px-1 py-0.5 rounded border border-white/10">↵</kbd> Open</span>
            <span><kbd className="font-mono bg-white/5 px-1 py-0.5 rounded border border-white/10">Esc</kbd> Close</span>
          </div>
          <span className="font-mono text-indigo-400">TeamPulse Spotlight</span>
        </div>
      </div>
      <div className="fixed inset-0 -z-10" onClick={() => setIsOpen(false)} />
    </div>
  );
};

export default CommandPalette;
