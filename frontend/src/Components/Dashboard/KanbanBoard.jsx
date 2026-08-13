import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { AuthContext } from "../../Context/AuthProvider";
import toast from 'react-hot-toast';
import TaskDetailsDrawer from '../TaskList/TaskDetailsDrawer';

const KANBAN_COLUMNS = [
  { key: 'Backlog',               emoji: '📦', accent: '#6366f1', cssClass: 'kanban-col-backlog'    },
  { key: 'To Do',                 emoji: '📋', accent: '#94a3b8', cssClass: 'kanban-col-todo'       },
  { key: 'In Progress',           emoji: '⚡', accent: '#3b82f6', cssClass: 'kanban-col-inprogress' },
  { key: 'Code Review',           emoji: '🔍', accent: '#a855f7', cssClass: 'kanban-col-codereview' },
  { key: 'Testing / QA',          emoji: '🧪', accent: '#10b981', cssClass: 'kanban-col-testing'    },
  { key: 'Ready for Deployment',  emoji: '🚀', accent: '#f59e0b', cssClass: 'kanban-col-deployment' },
  { key: 'Completed',             emoji: '✅', accent: '#22c55e', cssClass: 'kanban-col-completed'  },
  { key: 'Blocked',               emoji: '🛑', accent: '#ef4444', cssClass: 'kanban-col-blocked'    },
];

const initialGrouped = () => {
  const g = {};
  KANBAN_COLUMNS.forEach(c => { g[c.key] = []; });
  return g;
};

const KanbanBoard = ({ refreshTrigger }) => {
  const { token, authUser } = useContext(AuthContext);

  const [tasks, setTasks] = useState(initialGrouped());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [selectedProject, setSelectedProject] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [projectsList, setProjectsList] = useState([]);
  const [selectedTaskForDrawer, setSelectedTaskForDrawer] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchAllTasks = async () => {
    try {
      const endpoint = (authUser?.role === 'Admin' || authUser?.role === 'Manager')
        ? '/api/admin/tasks/all'
        : '/api/employee/tasks';

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const rawTasks = response.data.tasks || response.data || [];
      const grouped = initialGrouped();

      rawTasks.forEach(task => {
        let statusKey = task.status;
        // Map legacy statuses to new workflow
        if (statusKey === 'New')    statusKey = 'To Do';
        if (statusKey === 'Active') statusKey = 'In Progress';
        if (statusKey === 'Failed') statusKey = 'Blocked';

        if (grouped[statusKey] !== undefined) {
          grouped[statusKey].push(task);
        } else {
          grouped['To Do'].push(task);
        }
      });

      setTasks(grouped);
      setTotalCount(rawTasks.length);
    } catch (error) {
      console.error('Failed to fetch tasks for Kanban Board', error);
    }
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axios.get('/api/projects', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProjectsList(res.data);
      } catch (err) {
        console.error('Failed to fetch projects for filter');
      }
    };
    if (token) {
      fetchProjects();
      fetchAllTasks();
    }
  }, [token, refreshTrigger]);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceColumn = [...tasks[source.droppableId]];
    const destColumn = source.droppableId === destination.droppableId
      ? sourceColumn
      : [...tasks[destination.droppableId]];

    const [movedTask] = sourceColumn.splice(source.index, 1);
    const targetStatus = destination.droppableId;
    movedTask.status = targetStatus;

    if (source.droppableId === destination.droppableId) {
      destColumn.splice(destination.index, 0, movedTask);
      setTasks(prev => ({ ...prev, [source.droppableId]: destColumn }));
    } else {
      destColumn.splice(destination.index, 0, movedTask);
      setTasks(prev => ({
        ...prev,
        [source.droppableId]: sourceColumn,
        [destination.droppableId]: destColumn
      }));
    }

    try {
      const updateEndpoint = (authUser?.role === 'Admin' || authUser?.role === 'Manager')
        ? `/api/admin/tasks/${draggableId}/status`
        : `/api/employee/tasks/${draggableId}/status`;

      await axios.put(updateEndpoint, 
        { status: targetStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const col = KANBAN_COLUMNS.find(c => c.key === targetStatus);
      toast.success(`${col?.emoji || ''} Moved to ${targetStatus}`, {
        style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' }
      });

      window.dispatchEvent(new Event('adminDataRefetch'));
      window.dispatchEvent(new Event('newTaskRefetch'));
    } catch (error) {
      toast.error('Failed to update task status');
      fetchAllTasks();
    }
  };

  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 'Critical': return { text: '🔴 Critical', cls: 'bg-red-500/20 text-red-400 border-red-500/40',    dot: '#ef4444' };
      case 'High':     return { text: '🟠 High',     cls: 'bg-orange-500/20 text-orange-400 border-orange-500/40', dot: '#f97316' };
      case 'Medium':   return { text: '🟡 Medium',   cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40', dot: '#eab308' };
      case 'Low':      return { text: '🟢 Low',      cls: 'bg-green-500/20 text-green-400 border-green-500/40',  dot: '#22c55e' };
      default:         return { text: '🟡 Medium',   cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40', dot: '#eab308' };
    }
  };

  const getLabelColor = (label) => {
    const l = (label || '').toLowerCase();
    if (l.includes('backend'))                    return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    if (l.includes('frontend'))                   return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
    if (l.includes('bug'))                        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    if (l.includes('feature'))                    return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    if (l.includes('urgent'))                     return 'bg-red-500/20 text-red-300 border-red-500/30';
    if (l.includes('testing') || l.includes('qa')) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    if (l.includes('research'))                   return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    if (l.includes('documentation') || l.includes('docs')) return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
    return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const getRelativeDueText = (dueDateStr, dateStr) => {
    const target = dueDateStr ? new Date(dueDateStr) : (dateStr ? new Date(dateStr) : null);
    if (!target || isNaN(target.getTime())) return null;

    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `Overdue ${Math.abs(diffDays)}d`, isOverdue: true, isSoon: false };
    if (diffDays === 0) return { text: 'Due Today', isOverdue: false, isSoon: true };
    if (diffDays === 1) return { text: '1 Day Left', isOverdue: false, isSoon: true };
    if (diffDays <= 3) return { text: `${diffDays} Days Left`, isOverdue: false, isSoon: true };
    return { text: `${diffDays} Days Left`, isOverdue: false, isSoon: false };
  };

  const filterAndSortTasks = (taskList) => {
    return taskList.filter(task => {
      const matchesSearch = searchQuery === '' || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPriority = selectedPriority === 'All' || task.priority === selectedPriority;

      const matchesProject = selectedProject === 'All' || 
        (task.project && (task.project._id === selectedProject || task.project === selectedProject));

      return matchesSearch && matchesPriority && matchesProject;
    }).sort((a, b) => {
      if (sortBy === 'newest')   return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      if (sortBy === 'oldest')   return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (sortBy === 'dueDate')  return new Date(a.dueDate || a.date || 0) - new Date(b.dueDate || b.date || 0);
      if (sortBy === 'priority') {
        const pMap = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        return (pMap[b.priority] || 2) - (pMap[a.priority] || 2);
      }
      return 0;
    });
  };

  const getAssigneeName = (task) => {
    if (!task.assignedTo) return 'Unassigned';
    const { firstName, lastName } = task.assignedTo;
    return firstName ? `${firstName}${lastName ? ' ' + lastName : ''}` : 'Unassigned';
  };

  const getAssigneeInitial = (task) => {
    return task.assignedTo?.firstName?.charAt(0).toUpperCase() || '?';
  };

  return (
    <div className="w-full mt-8 bg-[#0d0f14] border border-white/10 backdrop-blur-md p-6 rounded-2xl shadow-2xl">
      
      {/* Board Header & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Enterprise Product Board
            </h2>
            <span className="text-[11px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full">
              {totalCount} tasks
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Jira · Linear · ClickUp style workspace · Drag cards across stages to update status
          </p>
        </div>

        {/* Search, Filter & Sort Bar */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[160px] sm:max-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-blue-500 focus:bg-white/8 text-white placeholder-gray-500 transition-colors"
            />
          </div>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="text-xs px-3 py-2.5 bg-[#1a1d24] border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="All">All Priorities</option>
            <option value="Critical">🔴 Critical</option>
            <option value="High">🟠 High</option>
            <option value="Medium">🟡 Medium</option>
            <option value="Low">🟢 Low</option>
          </select>

          {/* Project Filter */}
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="text-xs px-3 py-2.5 bg-[#1a1d24] border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="All">All Projects</option>
            {projectsList.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs px-3 py-2.5 bg-[#1a1d24] border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="newest">↓ Newest</option>
            <option value="oldest">↑ Oldest</option>
            <option value="priority">🔥 Priority</option>
            <option value="dueDate">📅 Due Date</option>
          </select>
        </div>
      </div>

      {/* Drag Drop Columns Container */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-nowrap overflow-x-auto gap-4 pb-4 pt-1 px-0.5 custom-scrollbar min-h-[600px] snap-x snap-mandatory">
          {KANBAN_COLUMNS.map((col) => {
            const columnTasks = filterAndSortTasks(tasks[col.key] || []);
            
            return (
              <div 
                key={col.key}
                className={`snap-center min-w-[300px] w-[300px] flex-shrink-0 rounded-2xl border border-white/[0.07] bg-white/[0.025] flex flex-col shadow-lg backdrop-blur-md ${col.cssClass}`}
              >
                {/* Column Header */}
                <div className="px-4 pt-4 pb-3 border-b border-white/[0.07]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-lg"
                        style={{ backgroundColor: col.accent, boxShadow: `0 0 8px ${col.accent}60` }}
                      />
                      <span className="font-bold text-xs text-gray-200 tracking-wide uppercase">
                        {col.key}
                      </span>
                    </div>
                    <span
                      className="text-[11px] font-mono px-2 py-0.5 rounded-full font-bold"
                      style={{
                        backgroundColor: `${col.accent}20`,
                        color: col.accent,
                        border: `1px solid ${col.accent}30`
                      }}
                    >
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={col.key}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex-1 flex flex-col gap-2.5 p-3 overflow-y-auto max-h-[640px] custom-scrollbar rounded-b-2xl transition-all duration-200 ${
                        snapshot.isDraggingOver
                          ? 'ring-2 ring-inset'
                          : ''
                      }`}
                      style={snapshot.isDraggingOver ? {
                        ringColor: col.accent,
                        backgroundColor: `${col.accent}08`
                      } : {}}
                    >
                      {columnTasks.map((task, index) => {
                        const pri = getPriorityConfig(task.priority);
                        const dueObj = getRelativeDueText(task.dueDate, task.date);

                        const chkTotal   = task.checklist?.length || 0;
                        const chkDone    = task.checklist?.filter(c => c.completed).length || 0;
                        const chkPercent = chkTotal > 0 ? Math.round((chkDone / chkTotal) * 100) : 0;

                        const est = task.estimatedHours || 0;
                        const act = task.actualHours || 0;
                        const timeProgress = est > 0 ? Math.min(Math.round((act / est) * 100), 100) : 0;

                        const labels = task.labels?.length > 0 ? task.labels : (task.category ? [task.category] : []);

                        return (
                          <Draggable key={task._id} draggableId={task._id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => setSelectedTaskForDrawer(task)}
                                className={`bg-[#16181f] border rounded-xl p-3.5 relative transition-all duration-200 cursor-pointer select-none group ${
                                  snapshot.isDragging
                                    ? 'shadow-2xl opacity-95 scale-[1.03] rotate-1 z-50 border-blue-500/60'
                                    : 'border-white/[0.08] shadow hover:bg-[#1c1f28] hover:border-white/20 hover:-translate-y-0.5 hover:shadow-md'
                                }`}
                              >
                                {/* Top: Labels row */}
                                {labels.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-2.5">
                                    {labels.slice(0, 3).map((lbl, i) => (
                                      <span key={i} className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide ${getLabelColor(lbl)}`}>
                                        {lbl}
                                      </span>
                                    ))}
                                    {labels.length > 3 && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-white/5 text-gray-400 border-white/10">
                                        +{labels.length - 3}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Title */}
                                <h4 className="font-semibold text-white/90 text-[13px] leading-snug mb-2.5 line-clamp-2 group-hover:text-white transition-colors">
                                  {task.title}
                                </h4>

                                {/* Priority Badge */}
                                <div className="mb-2.5">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${pri.cls}`}>
                                    {pri.text}
                                  </span>
                                </div>

                                {/* Due Date Badge */}
                                {dueObj && (
                                  <div className="mb-2.5">
                                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                                      dueObj.isOverdue
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                        : dueObj.isSoon
                                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                        : 'bg-white/5 text-gray-400 border border-white/10'
                                    }`}>
                                      📅 {dueObj.text}
                                    </span>
                                  </div>
                                )}

                                {/* Checklist Progress Bar */}
                                {chkTotal > 0 && (
                                  <div className="mb-2.5">
                                    <div className="flex justify-between items-center text-[10px] mb-1">
                                      <span className="text-gray-500">Checklist</span>
                                      <span className="font-bold text-blue-400">✔ {chkDone}/{chkTotal}</span>
                                    </div>
                                    <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                                      <div
                                        className="h-full transition-all duration-500 rounded-full"
                                        style={{
                                          width: `${chkPercent}%`,
                                          background: chkPercent === 100
                                            ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                                            : 'linear-gradient(90deg, #3b82f6, #6366f1)'
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Time Progress Bar */}
                                {est > 0 && (
                                  <div className="mb-2.5">
                                    <div className="flex justify-between items-center text-[10px] mb-1">
                                      <span className="text-gray-500">Time</span>
                                      <span className={`font-bold ${timeProgress >= 100 ? 'text-red-400' : 'text-emerald-400'}`}>
                                        ⏱ {act}h / {est}h
                                      </span>
                                    </div>
                                    <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                                      <div
                                        className="h-full transition-all duration-500 rounded-full"
                                        style={{
                                          width: `${timeProgress}%`,
                                          background: timeProgress >= 100
                                            ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                                            : 'linear-gradient(90deg, #10b981, #0d9488)'
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Divider */}
                                <div className="border-t border-white/[0.06] mt-2.5 pt-2.5">
                                  <div className="flex items-center justify-between">
                                    {/* Assignee */}
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold shadow-md flex-shrink-0">
                                        {getAssigneeInitial(task)}
                                      </div>
                                      <span className="font-medium text-gray-400 text-[11px] truncate max-w-[80px] group-hover:text-gray-300 transition-colors">
                                        {getAssigneeName(task).split(' ')[0]}
                                      </span>
                                    </div>

                                    {/* Badges: comments, attachments, project */}
                                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-gray-500">
                                      {(task.comments?.length || 0) > 0 && (
                                        <span className="flex items-center gap-0.5 bg-white/5 px-1.5 py-0.5 rounded">
                                          💬 {task.comments.length}
                                        </span>
                                      )}
                                      {(task.attachments?.length || 0) > 0 && (
                                        <span className="flex items-center gap-0.5 bg-white/5 px-1.5 py-0.5 rounded">
                                          📎 {task.attachments.length}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Project tag if exists */}
                                  {task.project?.name && (
                                    <div className="mt-1.5">
                                      <span className="text-[9px] text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded font-medium">
                                        📁 {task.project.name}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}

                      {/* Empty Column Placeholder */}
                      {columnTasks.length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex-1 flex flex-col items-center justify-center py-8 opacity-30">
                          <div className="text-3xl mb-2">{col.emoji}</div>
                          <p className="text-[11px] text-gray-500 text-center">
                            No tasks
                          </p>
                        </div>
                      )}

                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Task Details Slide-Over Drawer */}
      {selectedTaskForDrawer && (
        <TaskDetailsDrawer
          task={selectedTaskForDrawer}
          isOpen={!!selectedTaskForDrawer}
          onClose={() => setSelectedTaskForDrawer(null)}
          onUpdate={fetchAllTasks}
        />
      )}
    </div>
  );
};

export default KanbanBoard;
