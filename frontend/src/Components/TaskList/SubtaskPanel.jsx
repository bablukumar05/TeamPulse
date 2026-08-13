import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const STATUS_MINI = {
  'To Do':       'bg-slate-500/20 text-slate-400',
  'In Progress': 'bg-blue-500/20  text-blue-400',
  'Completed':   'bg-green-500/20 text-green-400',
  'Blocked':     'bg-red-500/20   text-red-400',
};

const SubtaskPanel = ({ task, token, onUpdate, isAdmin }) => {
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding]     = useState(false);
  const headers = { Authorization: `Bearer ${token}` };

  const endpoint = isAdmin
    ? `/api/admin/tasks/${task._id}/details`
    : `/api/employee/tasks/${task._id}/details`;

  const patchTask = async (body) => {
    const res = await axios.put(endpoint, body, { headers });
    if (onUpdate) onUpdate(res.data.task);
    return res.data.task;
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      // We store subtasks as checklist items with a prefix, or as separate task IDs
      // For simplicity: add as a lightweight checklist-style subtask via checklist field
      const updated = [...(task.checklist || [])];
      // Post to subtasks endpoint
      await axios.post(`/api/admin/tasks`, {
        title: newTitle.trim(),
        description: `Subtask of: ${task.title}`,
        assignTo: task.assignedTo?.firstName || 'Unknown',
        dueDate: task.dueDate,
        priority: task.priority || 'Medium',
        parentTaskId: task._id,
      }, { headers });

      toast.success('Subtask created', { style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' } });
      setNewTitle('');
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create subtask');
    } finally {
      setAdding(false);
    }
  };

  const subtasks = task.subtasks || [];

  return (
    <div className="space-y-3">
      {/* Subtask list */}
      {subtasks.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-3xl mb-2">↳</div>
          <p className="text-sm text-gray-500">No subtasks yet.</p>
          <p className="text-xs text-gray-600 mt-1">Break this task into smaller subtasks.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {subtasks.map((sub, i) => {
            const subTask = typeof sub === 'object' ? sub : { _id: sub, title: 'Subtask ' + (i + 1) };
            return (
              <div key={subTask._id || i} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2.5">
                <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_MINI[subTask.status] || 'bg-gray-500/20 text-gray-400'}`}>
                  {subTask.status || 'To Do'}
                </div>
                <span className="text-sm text-gray-200 flex-1 truncate">{subTask.title || `Subtask ${i + 1}`}</span>
                {subTask.assignedTo && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0">
                    {subTask.assignedTo?.firstName?.charAt(0) || '?'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add subtask form */}
      <form onSubmit={handleAddSubtask} className="flex gap-2 pt-2 border-t border-white/[0.06]">
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="Add a subtask…"
          className="flex-1 text-xs px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 outline-none focus:border-indigo-500 transition-colors"
        />
        <button
          type="submit"
          disabled={adding || !newTitle.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex-shrink-0 transition-colors"
        >
          {adding ? '…' : '+ Add'}
        </button>
      </form>

      {/* Story Points display */}
      {task.storyPoints > 0 && (
        <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-xl px-3 py-2">
          <span className="text-purple-400 text-sm">⚡</span>
          <span className="text-xs text-purple-300 font-semibold">{task.storyPoints} Story Points</span>
        </div>
      )}
    </div>
  );
};

export default SubtaskPanel;
