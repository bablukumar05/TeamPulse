import React, { useState, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const COLUMNS = [
  { id: 'Backlog',               label: 'Backlog',            color: '#6366f1', emoji: '📋' },
  { id: 'To Do',                 label: 'To Do',              color: '#64748b', emoji: '📌' },
  { id: 'In Progress',           label: 'In Progress',        color: '#3b82f6', emoji: '⚡' },
  { id: 'Code Review',           label: 'Code Review',        color: '#a855f7', emoji: '🔍' },
  { id: 'Testing / QA',          label: 'Testing / QA',       color: '#10b981', emoji: '🧪' },
  { id: 'Ready for Deployment',  label: 'Ready for Deploy',   color: '#f59e0b', emoji: '🚀' },
  { id: 'Completed',             label: 'Completed',          color: '#22c55e', emoji: '✅' },
  { id: 'Blocked',               label: 'Blocked',            color: '#ef4444', emoji: '🚫' },
];

const PRIORITY_DOT  = { Critical: '🔴', High: '🟠', Medium: '🟡', Low: '🟢' };
const PRIORITY_RING = { Critical: 'border-red-500/50', High: 'border-orange-500/50', Medium: 'border-yellow-500/30', Low: 'border-green-500/30' };

const SprintBoard = ({ project, tasks, sprints, activeSprint, setActiveSprint, onRefresh, token }) => {
  const headers = { Authorization: `Bearer ${token}` };

  // Filter tasks by selected sprint (or show all if no sprint selected)
  const sprintTasks = useMemo(() => {
    if (!activeSprint) return tasks;
    return tasks.filter(t => t.sprint === activeSprint._id || t.sprint?._id === activeSprint._id);
  }, [tasks, activeSprint]);

  const grouped = useMemo(() => {
    const map = {};
    COLUMNS.forEach(col => { map[col.id] = []; });
    sprintTasks.forEach(task => {
      const col = COLUMNS.find(c => c.id === task.status);
      if (col) map[col.id].push(task);
      else map['Backlog'].push(task);
    });
    return map;
  }, [sprintTasks]);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId;
    try {
      const isAdmin = true; // SprintBoard only shown to admin/manager
      const endpoint = `/api/admin/tasks/${draggableId}/status`;
      await axios.put(endpoint, { status: newStatus }, { headers });
      toast.success(`→ ${newStatus}`, { style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' }, duration: 1500 });
      onRefresh();
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-4">
      {/* Sprint selector */}
      {sprints.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-gray-500 uppercase font-bold tracking-widest">Sprint:</span>
          <button
            onClick={() => setActiveSprint(null)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
              !activeSprint ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40' : 'bg-white/5 text-gray-500 border-white/10 hover:bg-white/10'
            }`}
          >
            All Tasks
          </button>
          {sprints.map(s => (
            <button
              key={s._id}
              onClick={() => setActiveSprint(s)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                activeSprint?._id === s._id
                  ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
                  : 'bg-white/5 text-gray-500 border-white/10 hover:bg-white/10'
              }`}
            >
              {s.name}
              {s.status === 'Active' && <span className="ml-1 text-blue-400">●</span>}
            </button>
          ))}
        </div>
      )}

      {/* Sprint progress bar */}
      {activeSprint && (
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span className="font-semibold">{activeSprint.name} Progress</span>
              <span className="font-mono">{activeSprint.completedCount || 0}/{activeSprint.taskCount || 0} tasks · {activeSprint.donePoints || 0}/{activeSprint.totalPoints || 0} pts</span>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-400 transition-all duration-700"
                style={{ width: `${activeSprint.taskCount > 0 ? Math.round((activeSprint.completedCount / activeSprint.taskCount) * 100) : 0}%` }} />
            </div>
          </div>
          <div className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
            activeSprint.status === 'Active' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
            activeSprint.status === 'Completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
            'bg-slate-500/20 text-slate-400 border-slate-500/30'
          }`}>
            {activeSprint.status}
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4 min-h-[500px]" style={{ scrollbarWidth: 'thin' }}>
          {COLUMNS.map(col => {
            const colTasks = grouped[col.id] || [];
            return (
              <div key={col.id} className="flex-shrink-0 w-64 flex flex-col">
                {/* Column header */}
                <div className="flex items-center gap-2 px-3 py-2.5 mb-2 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                  style={{ borderTopColor: col.color, borderTopWidth: 2 }}>
                  <span className="text-sm">{col.emoji}</span>
                  <span className="text-xs font-bold text-white flex-1 truncate">{col.label}</span>
                  <span className="text-[10px] font-mono text-gray-500 bg-white/5 rounded-md px-1.5 py-0.5">{colTasks.length}</span>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 space-y-2 rounded-xl p-2 min-h-[200px] transition-colors ${snapshot.isDraggingOver ? 'bg-white/[0.04]' : ''}`}
                    >
                      {colTasks.map((task, index) => (
                        <Draggable key={task._id} draggableId={task._id} index={index}>
                          {(prov, snap) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              className={`bg-[#1a1d27] border rounded-xl p-3 cursor-grab active:cursor-grabbing transition-all ${
                                snap.isDragging ? 'shadow-2xl scale-105 border-indigo-500/50' : `border-white/[0.08] hover:border-white/[0.15] ${PRIORITY_RING[task.priority] || ''}`
                              }`}
                            >
                              {/* Priority + Labels */}
                              <div className="flex items-center gap-1 mb-2 flex-wrap">
                                <span className="text-[10px]">{PRIORITY_DOT[task.priority] || '⚪'}</span>
                                {task.labels?.slice(0, 2).map(l => (
                                  <span key={l} className="text-[9px] bg-white/10 text-gray-400 px-1.5 py-0.5 rounded font-bold">{l}</span>
                                ))}
                                {task.storyPoints > 0 && (
                                  <span className="ml-auto text-[9px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded">{task.storyPoints}p</span>
                                )}
                              </div>

                              {/* Title */}
                              <p className="text-xs font-semibold text-white leading-snug mb-2 line-clamp-2">{task.title}</p>

                              {/* Footer */}
                              <div className="flex items-center justify-between">
                                {task.assignedTo && (
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[9px] text-white font-bold">
                                      {task.assignedTo.firstName?.charAt(0)}
                                    </div>
                                    <span className="text-[10px] text-gray-500">{task.assignedTo.firstName}</span>
                                  </div>
                                )}
                                {task.checklist?.length > 0 && (
                                  <span className="text-[10px] text-gray-600 font-mono">
                                    ✔ {task.checklist.filter(i => i.completed).length}/{task.checklist.length}
                                  </span>
                                )}
                                {task.subtasks?.length > 0 && (
                                  <span className="text-[10px] text-gray-600">↳ {task.subtasks.length}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}

                      {colTasks.length === 0 && !snapshot.isDraggingOver && (
                        <div className="text-center py-6 text-gray-700 text-xs">Drop tasks here</div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};

export default SprintBoard;
