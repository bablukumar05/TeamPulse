import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const MilestoneTimeline = ({ project, milestones, onRefresh, token, isAdmin }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', dueDate: '', color: '#f59e0b' });
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [milestoneTasks, setMilestoneTasks] = useState({});
  const headers = { Authorization: `Bearer ${token}` };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post('/api/milestones', { ...form, projectId: project._id }, { headers });
      toast.success('Milestone created!', { style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' } });
      setForm({ name: '', description: '', dueDate: '', color: '#f59e0b' });
      setShowForm(false);
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create milestone');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async (id) => {
    try {
      await axios.put(`/api/milestones/${id}`, { status: 'Closed' }, { headers });
      toast.success('Milestone closed ✅');
      onRefresh();
    } catch { toast.error('Failed to close milestone'); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete milestone "${name}"?`)) return;
    try {
      await axios.delete(`/api/milestones/${id}`, { headers });
      toast.success('Milestone deleted');
      onRefresh();
    } catch { toast.error('Failed to delete milestone'); }
  };

  const toggleExpand = async (id) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (!milestoneTasks[id]) {
      try {
        const res = await axios.get(`/api/milestones/${id}/tasks`, { headers });
        setMilestoneTasks(prev => ({ ...prev, [id]: res.data }));
      } catch { /* ignore */ }
    }
  };

  const today = new Date();

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Milestones</h2>
        {isAdmin && (
          <button onClick={() => setShowForm(v => !v)}
            className="bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
            + New Milestone
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white/[0.03] border border-amber-500/30 rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-white">Create Milestone</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Milestone name" className="col-span-2 text-sm px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 outline-none focus:border-amber-500" />
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Description (optional)" className="col-span-2 text-sm px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 outline-none focus:border-amber-500" />
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className="w-full text-sm px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500 [color-scheme:dark]" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Color</label>
              <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                className="w-full h-10 px-2 bg-white/5 border border-white/10 rounded-xl cursor-pointer" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold px-5 py-2 rounded-xl transition-colors disabled:opacity-50">
              {submitting ? 'Creating…' : 'Create Milestone'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-white/10 text-gray-300 text-sm font-bold px-5 py-2 rounded-xl hover:bg-white/20 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {milestones.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🏁</div>
          <p className="text-gray-400 font-semibold">No milestones yet</p>
          <p className="text-gray-600 text-sm mt-1">Add milestones to track key delivery checkpoints.</p>
        </div>
      ) : (
        /* Timeline layout */
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-4 bottom-4 w-0.5 bg-white/[0.07]" />

          <div className="space-y-4">
            {milestones.map((ms, idx) => {
              const due = ms.dueDate ? new Date(ms.dueDate) : null;
              const isOverdue = due && ms.status === 'Open' && due < today;
              const isDueSoon = due && ms.status === 'Open' && !isOverdue && (due - today) < 7 * 86400000;
              const pct = ms.completionPercent || 0;

              return (
                <div key={ms._id} className="flex gap-5 relative">
                  {/* Timeline dot */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center text-base z-10 relative"
                    style={{ background: ms.color + '22', borderColor: ms.color + '66' }}>
                    {ms.status === 'Closed' ? '✅' : isOverdue ? '⚠️' : '🏁'}
                  </div>

                  {/* Card */}
                  <div className={`flex-1 bg-white/[0.03] border rounded-2xl p-4 cursor-pointer transition-all ${
                    ms.status === 'Closed' ? 'border-green-500/20 opacity-60'
                    : isOverdue ? 'border-red-500/30'
                    : isDueSoon ? 'border-amber-500/30'
                    : 'border-white/[0.07] hover:border-white/[0.12]'
                  }`} onClick={() => toggleExpand(ms._id)}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-bold text-white">{ms.name}</h3>
                          {ms.status === 'Closed' && <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-bold">Closed</span>}
                          {isOverdue && <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-bold">Overdue</span>}
                          {isDueSoon && !isOverdue && <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">Due Soon</span>}
                        </div>
                        {ms.description && <p className="text-xs text-gray-500 mb-2">{ms.description}</p>}
                        {due && <p className="text-xs text-gray-600">📅 {due.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>}
                      </div>

                      {/* Completion ring */}
                      <div className="flex-shrink-0 flex flex-col items-center gap-1">
                        <div className="relative w-12 h-12">
                          <svg viewBox="0 0 40 40" className="w-12 h-12 -rotate-90">
                            <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4"/>
                            <circle cx="20" cy="20" r="16" fill="none" stroke={ms.color || '#f59e0b'} strokeWidth="4"
                              strokeDasharray={`${pct} 100`} strokeLinecap="round"/>
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white">{pct}%</span>
                        </div>
                        <span className="text-[10px] text-gray-600">{ms.completedCount}/{ms.taskCount} tasks</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: ms.color || '#f59e0b' }} />
                    </div>

                    {/* Admin actions */}
                    {isAdmin && expandedId === ms._id && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-white/[0.06]" onClick={e => e.stopPropagation()}>
                        {ms.status === 'Open' && (
                          <button onClick={() => handleClose(ms._id)}
                            className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg font-bold transition-colors">
                            ✓ Close Milestone
                          </button>
                        )}
                        <button onClick={() => handleDelete(ms._id, ms.name)}
                          className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1.5 rounded-lg font-bold transition-colors">
                          Delete
                        </button>
                      </div>
                    )}

                    {/* Expanded task list */}
                    {expandedId === ms._id && milestoneTasks[ms._id] && (
                      <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2" onClick={e => e.stopPropagation()}>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Tasks</p>
                        {milestoneTasks[ms._id].length === 0 ? (
                          <p className="text-xs text-gray-600 italic">No tasks linked to this milestone.</p>
                        ) : (
                          milestoneTasks[ms._id].map(task => (
                            <div key={task._id} className="flex items-center gap-2 text-xs text-gray-300">
                              <span>{task.status === 'Completed' ? '✅' : '⬜'}</span>
                              <span className={task.status === 'Completed' ? 'line-through text-gray-600' : ''}>{task.title}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MilestoneTimeline;
