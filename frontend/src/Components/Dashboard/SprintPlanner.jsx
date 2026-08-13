import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from '../../Context/AuthProvider';

const SPRINT_STATUS_COLORS = {
  Planning:  'bg-slate-500/20 text-slate-400 border-slate-500/30',
  Active:    'bg-blue-500/20  text-blue-400  border-blue-500/30',
  Completed: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const SprintPlanner = ({ project, sprints, onRefresh, token, isAdmin }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', goal: '', startDate: '', endDate: '' });
  const [submitting, setSubmitting] = useState(false);
  const headers = { Authorization: `Bearer ${token}` };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post('/api/sprints', { ...form, projectId: project._id }, { headers });
      toast.success('Sprint created!', { style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' } });
      setForm({ name: '', goal: '', startDate: '', endDate: '' });
      setShowForm(false);
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create sprint');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (sprintId, action) => {
    try {
      await axios.put(`/api/sprints/${sprintId}/${action}`, {}, { headers });
      toast.success(action === 'start' ? 'Sprint started! 🚀' : 'Sprint completed! ✅', {
        style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' }
      });
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} sprint`);
    }
  };

  const handleDelete = async (sprintId, name) => {
    if (!window.confirm(`Delete sprint "${name}"? Tasks will move to backlog.`)) return;
    try {
      await axios.delete(`/api/sprints/${sprintId}`, { headers });
      toast.success('Sprint deleted');
      onRefresh();
    } catch { toast.error('Failed to delete sprint'); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Sprints</h2>
        {isAdmin && (
          <button
            onClick={() => setShowForm(v => !v)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
          >
            + New Sprint
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white/[0.03] border border-indigo-500/30 rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-white">Create Sprint</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Sprint name (e.g. Sprint 1)" className="col-span-2 text-sm px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 outline-none focus:border-indigo-500" />
            <input value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
              placeholder="Sprint goal (optional)" className="col-span-2 text-sm px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 outline-none focus:border-indigo-500" />
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Start Date</label>
              <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="w-full text-sm px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-500 [color-scheme:dark]" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">End Date</label>
              <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                className="w-full text-sm px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-500 [color-scheme:dark]" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-5 py-2 rounded-xl transition-colors disabled:opacity-50">
              {submitting ? 'Creating…' : 'Create Sprint'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-white/10 hover:bg-white/20 text-gray-300 text-sm font-bold px-5 py-2 rounded-xl transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {sprints.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">⚡</div>
          <p className="text-gray-400 font-semibold">No sprints yet</p>
          <p className="text-gray-600 text-sm mt-1">Create your first sprint to start organizing work.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sprints.map(sprint => {
            const progress = sprint.totalPoints > 0 ? Math.round((sprint.donePoints / sprint.totalPoints) * 100) : 0;
            const taskProgress = sprint.taskCount > 0 ? Math.round((sprint.completedCount / sprint.taskCount) * 100) : 0;
            return (
              <div key={sprint._id} className={`bg-white/[0.03] border rounded-2xl p-5 transition-all ${sprint.status === 'Active' ? 'border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.08)]' : 'border-white/[0.07]'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-white">{sprint.name}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${SPRINT_STATUS_COLORS[sprint.status]}`}>
                        {sprint.status}
                      </span>
                      {sprint.status === 'Active' && <span className="text-[10px] text-blue-400">● Active</span>}
                    </div>
                    {sprint.goal && <p className="text-sm text-gray-400 mb-3">🎯 {sprint.goal}</p>}

                    {/* Dates */}
                    {(sprint.startDate || sprint.endDate) && (
                      <p className="text-xs text-gray-600 mb-3">
                        {sprint.startDate && new Date(sprint.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {sprint.startDate && sprint.endDate && ' → '}
                        {sprint.endDate && new Date(sprint.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}

                    {/* Progress bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{sprint.completedCount}/{sprint.taskCount} tasks</span>
                        <span>{sprint.donePoints}/{sprint.totalPoints} pts</span>
                      </div>
                      <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-indigo-500 to-blue-500"
                          style={{ width: `${taskProgress}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {isAdmin && (
                    <div className="flex gap-2 flex-shrink-0">
                      {sprint.status === 'Planning' && (
                        <button onClick={() => handleAction(sprint._id, 'start')}
                          className="text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors">
                          ▶ Start
                        </button>
                      )}
                      {sprint.status === 'Active' && (
                        <button onClick={() => handleAction(sprint._id, 'complete')}
                          className="text-xs font-bold bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg transition-colors">
                          ✓ Complete
                        </button>
                      )}
                      {sprint.status === 'Completed' && sprint.velocity > 0 && (
                        <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg font-mono">
                          ⚡ {sprint.velocity} pts
                        </span>
                      )}
                      <button onClick={() => handleDelete(sprint._id, sprint.name)}
                        className="text-xs text-gray-600 hover:text-red-400 border border-white/10 hover:border-red-500/30 px-2 py-1.5 rounded-lg transition-colors">
                        🗑
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SprintPlanner;
