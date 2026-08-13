import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from '../../Context/AuthProvider';
import SubtaskPanel from './SubtaskPanel';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LABEL_OPTIONS = ['Backend', 'Frontend', 'Bug', 'Feature', 'Urgent', 'Documentation', 'Testing', 'Research', 'Design', 'DevOps'];

const STATUSES = ['Backlog', 'To Do', 'In Progress', 'Code Review', 'Testing / QA', 'Ready for Deployment', 'Completed', 'Blocked', 'Archived'];

const STATUS_COLORS = {
  'Backlog':               'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  'To Do':                 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  'In Progress':           'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Code Review':           'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Testing / QA':          'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Ready for Deployment':  'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'Completed':             'bg-green-500/20 text-green-400 border-green-500/30',
  'Blocked':               'bg-red-500/20 text-red-400 border-red-500/30',
  'Archived':              'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const PRIORITY_COLORS = {
  Critical: 'bg-red-500/20 text-red-400 border-red-500/40',
  High:     'bg-orange-500/20 text-orange-400 border-orange-500/40',
  Medium:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  Low:      'bg-green-500/20 text-green-400 border-green-500/40',
};

const LABEL_COLORS = {
  Backend:       'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  Frontend:      'bg-sky-500/20 text-sky-300 border-sky-500/30',
  Bug:           'bg-rose-500/20 text-rose-300 border-rose-500/30',
  Feature:       'bg-purple-500/20 text-purple-300 border-purple-500/30',
  Urgent:        'bg-red-500/20 text-red-300 border-red-500/30',
  Documentation: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  Testing:       'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Research:      'bg-amber-500/20 text-amber-300 border-amber-500/30',
  Design:        'bg-pink-500/20 text-pink-300 border-pink-500/30',
  DevOps:        'bg-teal-500/20 text-teal-300 border-teal-500/30',
};

const getLabelColor = (lbl) => LABEL_COLORS[lbl] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 30) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ─── Component ────────────────────────────────────────────────────────────────

const TaskDetailsDrawer = ({ task, isOpen, onClose, onUpdate }) => {
  const { token, authUser } = useContext(AuthContext);

  const [currentTask, setCurrentTask]     = useState(task);
  const [activeTab, setActiveTab]         = useState('details');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newComment, setNewComment]       = useState('');
  const [loggedHours, setLoggedHours]     = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [editingTitle, setEditingTitle]   = useState(false);
  const [titleDraft, setTitleDraft]       = useState('');
  const [editingDesc, setEditingDesc]     = useState(false);
  const [descDraft, setDescDraft]         = useState('');
  const [showLabelPicker, setShowLabelPicker] = useState(false);

  useEffect(() => {
    setCurrentTask(task);
    setActiveTab('details');
    setEditingTitle(false);
    setEditingDesc(false);
    setShowLabelPicker(false);
  }, [task]);

  if (!isOpen || !currentTask) return null;

  const isManagerOrAdmin = authUser?.role === 'Admin' || authUser?.role === 'Manager';

  const detailsApiEndpoint = isManagerOrAdmin
    ? `/api/admin/tasks/${currentTask._id}/details`
    : `/api/employee/tasks/${currentTask._id}/details`;

  const commentApiEndpoint = isManagerOrAdmin
    ? `/api/admin/tasks/${currentTask._id}/comment`
    : `/api/employee/tasks/${currentTask._id}/comment`;

  const uploadApiEndpoint = isManagerOrAdmin
    ? `/api/admin/tasks/${currentTask._id}/upload`
    : `/api/employee/tasks/${currentTask._id}/upload`;

  const statusApiEndpoint = isManagerOrAdmin
    ? `/api/admin/tasks/${currentTask._id}/status`
    : `/api/employee/tasks/${currentTask._id}/status`;

  // ── API Helpers ──────────────────────────────────────────────────────────

  const patchDetails = async (payload, successMsg) => {
    try {
      const res = await axios.put(detailsApiEndpoint, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentTask(res.data.task);
      if (successMsg) toast.success(successMsg, {
        style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' }
      });
      if (onUpdate) onUpdate();
      return res.data.task;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
      return null;
    }
  };

  // ── Status Change ────────────────────────────────────────────────────────

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await axios.put(statusApiEndpoint, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentTask(res.data.task);
      toast.success(`Moved to ${newStatus}`, {
        style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' }
      });
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  // ── Priority Change ──────────────────────────────────────────────────────

  const handlePriorityChange = async (newPriority) => {
    await patchDetails({ priority: newPriority }, `Priority → ${newPriority}`);
  };

  // ── Title Editing ────────────────────────────────────────────────────────

  const startEditTitle = () => {
    if (!isManagerOrAdmin) return;
    setTitleDraft(currentTask.title);
    setEditingTitle(true);
  };

  const saveTitle = async () => {
    if (!titleDraft.trim()) { setEditingTitle(false); return; }
    if (titleDraft.trim() === currentTask.title) { setEditingTitle(false); return; }
    await patchDetails({ title: titleDraft.trim() }, 'Title updated');
    setEditingTitle(false);
  };

  // ── Description Editing ──────────────────────────────────────────────────

  const startEditDesc = () => {
    setDescDraft(currentTask.description || '');
    setEditingDesc(true);
  };

  const saveDesc = async () => {
    if (descDraft.trim() === (currentTask.description || '').trim()) { setEditingDesc(false); return; }
    await patchDetails({ description: descDraft.trim() }, 'Description updated');
    setEditingDesc(false);
  };

  // ── Label Management ─────────────────────────────────────────────────────

  const toggleLabel = async (label) => {
    const current = currentTask.labels || [];
    const updated = current.includes(label)
      ? current.filter(l => l !== label)
      : [...current, label];
    await patchDetails({ labels: updated });
  };

  // ── Checklist ────────────────────────────────────────────────────────────

  const handleToggleChecklist = async (index) => {
    const updated = (currentTask.checklist || []).map((item, i) =>
      i === index ? { ...item, completed: !item.completed } : item
    );
    await patchDetails({ checklist: updated });
  };

  const handleAddChecklistItem = async (e) => {
    e.preventDefault();
    if (!newChecklistItem.trim()) return;
    const updated = [...(currentTask.checklist || []), { title: newChecklistItem.trim(), completed: false }];
    const result = await patchDetails({ checklist: updated }, 'Checklist item added');
    if (result) setNewChecklistItem('');
  };

  const handleDeleteChecklistItem = async (index) => {
    const updated = (currentTask.checklist || []).filter((_, i) => i !== index);
    await patchDetails({ checklist: updated }, 'Item removed');
  };

  // ── Time Logging ─────────────────────────────────────────────────────────

  const handleLogHours = async (e) => {
    e.preventDefault();
    const hoursNum = parseFloat(loggedHours);
    if (isNaN(hoursNum) || hoursNum <= 0) return;
    const updatedActual = (currentTask.actualHours || 0) + hoursNum;
    const result = await patchDetails({ actualHours: updatedActual }, `Logged ${hoursNum}h`);
    if (result) setLoggedHours('');
  };

  // ── Comments ─────────────────────────────────────────────────────────────

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await axios.post(commentApiEndpoint, { text: newComment.trim() }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentTask(res.data.task);
      setNewComment('');
      toast.success('Comment posted', {
        style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' }
      });
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error('Failed to post comment');
    }
  };

  // ── File Upload ───────────────────────────────────────────────────────────

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setUploadingFile(true);

    try {
      const res = await axios.post(uploadApiEndpoint, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setCurrentTask(res.data.task);
      toast.success('File uploaded', {
        style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' }
      });
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error('Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  // ── Calculations ──────────────────────────────────────────────────────────

  const checklistCount          = currentTask.checklist?.length || 0;
  const completedChecklistCount = currentTask.checklist?.filter(i => i.completed).length || 0;
  const checklistPercent        = checklistCount > 0 ? Math.round((completedChecklistCount / checklistCount) * 100) : 0;

  const estimated    = currentTask.estimatedHours || 0;
  const actual       = currentTask.actualHours || 0;
  const timePercent  = estimated > 0 ? Math.min(Math.round((actual / estimated) * 100), 100) : 0;
  const isOverTime   = estimated > 0 && actual > estimated;

  const assigneeName = currentTask.assignedTo
    ? `${currentTask.assignedTo.firstName || ''}${currentTask.assignedTo.lastName ? ' ' + currentTask.assignedTo.lastName : ''}`
    : 'Unassigned';
  const assigneeInitial = currentTask.assignedTo?.firstName?.charAt(0).toUpperCase() || '?';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl bg-[#111318] border-l border-white/10 flex flex-col shadow-[−20px_0_60px_rgba(0,0,0,0.8)] animate-in slide-in-from-right duration-300">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 border-b border-white/10 bg-[#111318]/95 backdrop-blur-md">

          {/* Top bar: task ID + close */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-md border border-blue-500/20">
                TASK-{currentTask._id.slice(-5).toUpperCase()}
              </span>
              {/* Labels */}
              {(currentTask.labels || []).map((lbl, i) => (
                <span key={i} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getLabelColor(lbl)}`}>
                  {lbl}
                </span>
              ))}
              {/* Add label button */}
              <div className="relative">
                <button
                  onClick={() => setShowLabelPicker(v => !v)}
                  className="text-[10px] text-gray-500 hover:text-gray-300 border border-white/10 hover:border-white/20 bg-white/5 rounded-full px-2 py-0.5 transition-colors"
                  title="Manage labels"
                >
                  + Label
                </button>
                {showLabelPicker && (
                  <div className="absolute top-7 left-0 z-20 bg-[#1c1f29] border border-white/10 rounded-xl p-3 shadow-2xl min-w-[200px]">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Labels</p>
                    <div className="flex flex-wrap gap-1.5">
                      {LABEL_OPTIONS.map(lbl => {
                        const active = (currentTask.labels || []).includes(lbl);
                        return (
                          <button
                            key={lbl}
                            onClick={() => toggleLabel(lbl)}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                              active
                                ? getLabelColor(lbl) + ' opacity-100'
                                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            {active ? '✓ ' : ''}{lbl}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors flex-shrink-0"
              title="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Title (editable for admin/manager) */}
          <div className="px-6 pb-3">
            {editingTitle ? (
              <div className="flex items-start gap-2">
                <input
                  autoFocus
                  value={titleDraft}
                  onChange={e => setTitleDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
                  className="flex-1 text-lg font-bold bg-white/5 border border-blue-500/50 rounded-xl px-3 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                <button onClick={saveTitle} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-xl">Save</button>
                <button onClick={() => setEditingTitle(false)} className="bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-bold px-3 py-2 rounded-xl">Cancel</button>
              </div>
            ) : (
              <h2
                className={`text-xl font-bold text-white leading-snug ${isManagerOrAdmin ? 'cursor-pointer hover:text-blue-300 transition-colors group' : ''}`}
                onClick={startEditTitle}
                title={isManagerOrAdmin ? 'Click to edit title' : undefined}
              >
                {currentTask.title}
                {isManagerOrAdmin && (
                  <span className="ml-2 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity text-sm">✏️</span>
                )}
              </h2>
            )}
          </div>

          {/* Controls bar: Status, Priority, Assignee, Dates */}
          <div className="px-6 pb-4 flex flex-wrap items-end gap-4 text-xs">
            {/* Status */}
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block mb-1">Status</label>
              <select
                value={currentTask.status}
                onChange={e => handleStatusChange(e.target.value)}
                className={`border rounded-lg px-3 py-1.5 font-bold outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer text-xs ${STATUS_COLORS[currentTask.status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}
              >
                {STATUSES.map(st => (
                  <option key={st} value={st} className="bg-gray-900 text-white">{st}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block mb-1">Priority</label>
              <select
                value={currentTask.priority || 'Medium'}
                onChange={e => handlePriorityChange(e.target.value)}
                className={`border rounded-lg px-3 py-1.5 font-bold outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer text-xs ${PRIORITY_COLORS[currentTask.priority || 'Medium']}`}
              >
                <option value="Critical" className="bg-gray-900 text-red-400">🔴 Critical</option>
                <option value="High"     className="bg-gray-900 text-orange-400">🟠 High</option>
                <option value="Medium"   className="bg-gray-900 text-yellow-400">🟡 Medium</option>
                <option value="Low"      className="bg-gray-900 text-green-400">🟢 Low</option>
              </select>
            </div>

            {/* Assignee */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                {assigneeInitial}
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block">Assignee</span>
                <span className="text-white font-semibold text-xs">{assigneeName}</span>
              </div>
            </div>

            {/* Dates */}
            <div className="ml-auto flex gap-3">
              {currentTask.startDate && (
                <div className="text-right">
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block">Start</span>
                  <span className="text-gray-300 text-xs">{formatDate(currentTask.startDate)}</span>
                </div>
              )}
              {(currentTask.dueDate || currentTask.date) && (
                <div className="text-right">
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block">Due</span>
                  <span className="text-gray-300 text-xs">{formatDate(currentTask.dueDate || currentTask.date)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-t border-white/10 px-6 gap-0 text-xs font-semibold overflow-x-auto">
            {[
              { id: 'details',  label: 'Details & Checklist',  count: null },
              { id: 'subtasks', label: 'Subtasks',              count: currentTask.subtasks?.length || 0 },
              { id: 'comments', label: 'Comments',             count: currentTask.comments?.length || 0 },
              { id: 'files',    label: 'Files',                count: currentTask.attachments?.length || 0 },
              { id: 'activity', label: 'Activity',             count: currentTask.activityLog?.length || 0 },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                    : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                {tab.label}
                {tab.count != null && tab.count > 0 && (
                  <span className="bg-white/10 px-1.5 py-0.5 rounded-full text-[10px] font-mono">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Scrollable Body ──────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">

          {/* ── DETAILS TAB ─────────────────────────────────────────────── */}
          {activeTab === 'details' && (
            <>
              {/* Description */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Description</h3>
                  {!editingDesc && (
                    <button onClick={startEditDesc} className="text-[10px] text-gray-500 hover:text-blue-400 transition-colors">
                      ✏️ Edit
                    </button>
                  )}
                </div>
                {editingDesc ? (
                  <div className="space-y-2">
                    <textarea
                      autoFocus
                      value={descDraft}
                      onChange={e => setDescDraft(e.target.value)}
                      rows={5}
                      className="w-full bg-white/5 border border-blue-500/50 rounded-xl p-4 text-sm text-gray-200 outline-none focus:ring-2 focus:ring-blue-500/30 resize-none custom-scrollbar"
                    />
                    <div className="flex gap-2">
                      <button onClick={saveDesc} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">Save</button>
                      <button onClick={() => setEditingDesc(false)} className="bg-white/10 hover:bg-white/20 text-gray-300 text-xs font-bold px-4 py-2 rounded-xl transition-colors">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={startEditDesc}
                    className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap cursor-text hover:bg-white/[0.05] hover:border-white/[0.12] transition-colors min-h-[80px]"
                  >
                    {currentTask.description || (
                      <span className="text-gray-600 italic">Click to add a description…</span>
                    )}
                  </div>
                )}
              </section>

              {/* Progress Summary Chips */}
              <div className="flex flex-wrap gap-2">
                {checklistCount > 0 && (
                  <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2">
                    <span className="text-blue-400 text-sm">✔</span>
                    <span className="text-xs text-blue-300 font-semibold">{completedChecklistCount}/{checklistCount} Tasks</span>
                    <div className="w-16 bg-blue-500/20 h-1 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full transition-all" style={{ width: `${checklistPercent}%` }} />
                    </div>
                    <span className="text-[10px] text-blue-400 font-mono">{checklistPercent}%</span>
                  </div>
                )}
                {estimated > 0 && (
                  <div className={`flex items-center gap-2 border rounded-xl px-3 py-2 ${isOverTime ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                    <span className={`text-sm ${isOverTime ? 'text-red-400' : 'text-emerald-400'}`}>⏱</span>
                    <span className={`text-xs font-semibold ${isOverTime ? 'text-red-300' : 'text-emerald-300'}`}>{actual}h / {estimated}h</span>
                    <div className={`w-16 h-1 rounded-full overflow-hidden ${isOverTime ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${timePercent}%`,
                          background: isOverTime ? '#ef4444' : '#10b981'
                        }}
                      />
                    </div>
                    <span className={`text-[10px] font-mono ${isOverTime ? 'text-red-400' : 'text-emerald-400'}`}>{timePercent}%</span>
                  </div>
                )}
              </div>

              {/* ── Checklist ─────────────────────────────────────────────── */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    Checklist
                    {checklistCount > 0 && (
                      <span className="ml-2 text-blue-400 font-mono">({checklistPercent}%)</span>
                    )}
                  </h3>
                </div>

                {/* Progress bar */}
                {checklistCount > 0 && (
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${checklistPercent}%`,
                        background: checklistPercent === 100
                          ? 'linear-gradient(90deg,#22c55e,#16a34a)'
                          : 'linear-gradient(90deg,#3b82f6,#6366f1)'
                      }}
                    />
                  </div>
                )}

                <div className="space-y-2 mb-3">
                  {(currentTask.checklist || []).map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all group ${
                        item.completed
                          ? 'bg-green-500/5 border-green-500/20'
                          : 'bg-white/[0.025] border-white/[0.06] hover:bg-white/[0.05]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleChecklist(idx)}
                        className="w-4 h-4 rounded accent-blue-500 cursor-pointer flex-shrink-0"
                      />
                      <span className={`text-sm flex-1 ${item.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                        {item.title}
                      </span>
                      <button
                        onClick={() => handleDeleteChecklistItem(idx)}
                        className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xs"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {checklistCount === 0 && (
                    <p className="text-xs text-gray-600 italic py-2">No checklist items yet.</p>
                  )}
                </div>

                {/* Add checklist item */}
                <form onSubmit={handleAddChecklistItem} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add checklist item…"
                    value={newChecklistItem}
                    onChange={e => setNewChecklistItem(e.target.value)}
                    className="text-xs px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl w-full outline-none focus:border-blue-500 text-white placeholder-gray-600 transition-colors"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors flex-shrink-0"
                  >
                    Add
                  </button>
                </form>
              </section>

              {/* ── Time Tracking ─────────────────────────────────────────── */}
              <section>
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Time Tracking</h3>
                <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2 text-xs">
                    <span className="text-gray-400">
                      {estimated > 0 ? `${actual}h logged of ${estimated}h estimated` : `${actual}h logged (no estimate)`}
                    </span>
                    <span className={`font-bold font-mono ${isOverTime ? 'text-red-400' : 'text-emerald-400'}`}>
                      {timePercent}% {isOverTime ? '⚠️ Overtime!' : ''}
                    </span>
                  </div>
                  {estimated > 0 && (
                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mb-4">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${timePercent}%`,
                          background: isOverTime
                            ? 'linear-gradient(90deg,#ef4444,#dc2626)'
                            : 'linear-gradient(90deg,#10b981,#0d9488)'
                        }}
                      />
                    </div>
                  )}
                  <form onSubmit={handleLogHours} className="flex gap-2">
                    <input
                      type="number"
                      step="0.25"
                      min="0.25"
                      placeholder="Log hours (e.g. 1.5)…"
                      value={loggedHours}
                      onChange={e => setLoggedHours(e.target.value)}
                      className="text-xs px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl w-full outline-none focus:border-emerald-500 text-white placeholder-gray-600 transition-colors"
                    />
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-colors flex-shrink-0"
                    >
                      Log Time
                    </button>
                  </form>
                </div>
              </section>
            </>
          )}

          {/* ── COMMENTS TAB ────────────────────────────────────────────── */}
          {activeTab === 'comments' && (
            <div className="flex flex-col gap-4">
              {/* Comment list */}
              <div className="space-y-3">
                {(currentTask.comments || []).length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-3xl mb-2">💬</div>
                    <p className="text-sm text-gray-500">No comments yet. Start the conversation!</p>
                  </div>
                )}
                {(currentTask.comments || []).map((cmt, idx) => (
                  <div key={idx} className="flex gap-3 group">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 mt-0.5">
                      {(cmt.userName || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-blue-400">{cmt.userName || 'User'}</span>
                        <span className="text-[10px] text-gray-600" title={new Date(cmt.date).toLocaleString()}>
                          {timeAgo(cmt.date)}
                        </span>
                      </div>
                      <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl rounded-tl-none px-4 py-3 text-sm text-gray-200 leading-relaxed">
                        {cmt.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Post comment */}
              <form onSubmit={handleAddComment} className="pt-2 border-t border-white/10">
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                    {authUser?.firstName?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 space-y-2">
                    <textarea
                      placeholder="Write a comment…"
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddComment(e); }}
                      rows={3}
                      className="text-xs px-4 py-3 bg-white/5 border border-white/10 rounded-xl w-full outline-none focus:border-blue-500 text-white placeholder-gray-600 resize-none custom-scrollbar transition-colors"
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-600">Ctrl+Enter to post</span>
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-xl text-xs font-bold text-white transition-colors"
                      >
                        Post Comment
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* ── FILES TAB ───────────────────────────────────────────────── */}
          {activeTab === 'files' && (
            <div className="space-y-4">
              {/* Upload button */}
              <label className={`flex items-center justify-center gap-3 w-full py-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                uploadingFile
                  ? 'border-blue-500/50 bg-blue-500/5'
                  : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
              }`}>
                <div className="text-center">
                  <div className="text-3xl mb-2">{uploadingFile ? '⏳' : '📎'}</div>
                  <p className="text-sm font-semibold text-gray-300">
                    {uploadingFile ? 'Uploading…' : 'Click to upload a file'}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Any file type supported</p>
                </div>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploadingFile}
                />
              </label>

              {/* File list */}
              {(currentTask.attachments || []).length === 0 ? (
                <p className="text-xs text-gray-600 italic text-center py-4">No files uploaded yet.</p>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {(currentTask.attachments || []).map((att, i) => (
                    <a
                      key={i}
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 p-3.5 bg-white/[0.03] border border-white/[0.07] rounded-xl hover:bg-white/[0.07] hover:border-white/[0.12] transition-all group"
                    >
                      <span className="text-2xl flex-shrink-0">📄</span>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-semibold text-gray-200 group-hover:text-blue-400 truncate transition-colors">
                          {att.filename}
                        </p>
                        <p className="text-[10px] text-gray-600">{formatDate(att.uploadedAt) || 'Unknown date'}</p>
                      </div>
                      <span className="text-gray-600 group-hover:text-blue-400 text-xs transition-colors flex-shrink-0">↗</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ACTIVITY TAB ────────────────────────────────────────────── */}
          {activeTab === 'activity' && (
            <div className="space-y-2">
              {(currentTask.activityLog || []).length === 0 && (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">📋</div>
                  <p className="text-sm text-gray-500">No activity recorded yet.</p>
                </div>
              )}
              {(currentTask.activityLog || []).slice().reverse().map((act, idx, arr) => (
                <div key={idx} className="flex items-start gap-3 relative">
                  {/* Timeline line */}
                  {idx < arr.length - 1 && (
                    <div className="absolute left-[7px] top-5 bottom-0 w-px bg-white/[0.06]" />
                  )}
                  {/* Dot */}
                  <div className="w-3.5 h-3.5 rounded-full bg-blue-500/30 border-2 border-blue-500/60 flex-shrink-0 mt-1 relative z-10" />
                  {/* Content */}
                  <div className="flex-1 pb-3">
                    <p className="text-sm text-gray-200 leading-snug">{act.action}</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">
                      by <span className="text-gray-400 font-semibold">{act.performedByName || 'System'}</span>
                      {' · '}
                      <span title={new Date(act.timestamp).toLocaleString()}>{timeAgo(act.timestamp)}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── SUBTASKS TAB ─────────────────────────────────────────────── */}
          {activeTab === 'subtasks' && (
            <SubtaskPanel
              task={currentTask}
              token={token}
              isAdmin={isManagerOrAdmin}
              onUpdate={(updatedTask) => {
                if (updatedTask && typeof updatedTask === 'object') setCurrentTask(updatedTask);
                else if (onUpdate) onUpdate();
              }}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default TaskDetailsDrawer;
