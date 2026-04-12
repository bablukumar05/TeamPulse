import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { AuthContext } from "../../Context/AuthProvider";
import toast from 'react-hot-toast';
import TaskInteractions from '../TaskList/TaskInteractions';

const KanbanBoard = ({ refreshTrigger }) => {
  const { token } = useContext(AuthContext);
  const [tasks, setTasks] = useState({
    New: [],
    Active: [],
    Completed: [],
    Failed: []
  });

  const fetchAllTasks = async () => {
    try {
      const response = await axios.get('/api/admin/tasks/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const groupedTasks = {
        New: [],
        Active: [],
        Completed: [],
        Failed: []
      };

      response.data.forEach(task => {
        if (groupedTasks[task.status]) {
          groupedTasks[task.status].push(task);
        }
      });

      setTasks(groupedTasks);
    } catch (error) {
      console.error('Failed to fetch tasks for Kanban', error);
    }
  };

  useEffect(() => {
    if (token) fetchAllTasks();
  }, [token, refreshTrigger]);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceColumn = [...tasks[source.droppableId]];
    const destColumn = [...tasks[destination.droppableId]];
    const [movedTask] = sourceColumn.splice(source.index, 1);

    // Optimistic UI update
    movedTask.status = destination.droppableId;
    destColumn.splice(destination.index, 0, movedTask);

    setTasks(prev => ({
      ...prev,
      [source.droppableId]: sourceColumn,
      [destination.droppableId]: destColumn
    }));

    try {
      await axios.put(`/api/admin/tasks/${draggableId}/status`, 
        { status: destination.droppableId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Task moved to ${destination.droppableId}`, { style: { background: '#333', color: '#fff'} });
      // Tell employee dashboard task has changed
      window.dispatchEvent(new Event('adminDataRefetch'));
    } catch (error) {
      toast.error('Failed to update task status');
      fetchAllTasks(); // rollback on error
    }
  };

  const getColumnColor = (status) => {
    switch (status) {
      case 'New': return 'from-blue-500/20 to-blue-600/10 border-blue-500/30';
      case 'Active': return 'from-yellow-500/20 to-orange-500/10 border-yellow-500/30';
      case 'Completed': return 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30';
      case 'Failed': return 'from-red-500/20 to-rose-500/10 border-red-500/30';
      default: return 'from-gray-500/20 to-gray-600/10 border-gray-500/30';
    }
  };

  return (
    <div className="w-full mt-8 bg-white/5 border border-white/10 backdrop-blur-md p-6 rounded-2xl shadow-xl">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-6">Kanban Board</h2>
      
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-nowrap overflow-x-auto gap-6 pb-6 pt-2 px-2 custom-scrollbar min-h-[500px] snap-x snap-mandatory">
          {Object.entries(tasks).map(([status, columnTasks]) => (
            <div key={status} className={`snap-center min-w-[320px] w-[320px] flex-shrink-0 rounded-2xl border bg-gradient-to-br ${getColumnColor(status)} p-5 flex flex-col shadow-lg`}>
              <h3 className="font-bold text-lg mb-5 text-gray-200 tracking-wider uppercase flex justify-between items-center border-b border-white/10 pb-3">
                {status}
                <span className="text-xs bg-white/10 px-2.5 py-1 rounded-md text-white shadow-inner">{columnTasks.length}</span>
              </h3>
              
              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div 
                    {...provided.droppableProps} 
                    ref={provided.innerRef}
                    className={`flex-1 flex flex-col gap-4 transition-colors rounded-xl p-1 overflow-y-auto max-h-[600px] custom-scrollbar ${snapshot.isDraggingOver ? 'bg-white/5 shadow-inner' : ''}`}
                  >
                    {columnTasks.map((task, index) => {
                      const isOverdue = new Date(task.date) < new Date() && status !== 'Completed' && status !== 'Failed';
                      
                      return (
                        <Draggable key={task._id} draggableId={task._id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-xl relative transition-all duration-200 ${snapshot.isDragging ? 'shadow-2xl opacity-90 scale-[1.02] rotate-1 z-50' : 'shadow-md hover:bg-white/15 hover:shadow-lg hover:-translate-y-1'} ${isOverdue ? 'animate-pulse border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : ''}`}
                            >
                              {isOverdue && <span className="absolute -top-3 -right-2 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full z-10 shadow-lg ring-2 ring-[#121212]">OVERDUE</span>}
                              
                              <div className="flex justify-between items-start mb-3">
                                <span className="text-[10px] font-bold text-gray-300 bg-black/40 px-2 py-1 rounded uppercase tracking-wider">{task.category}</span>
                                <span className={`text-xs font-semibold bg-black/20 px-2 py-1 rounded ${isOverdue ? 'text-red-400' : 'text-gray-300'}`}>{task.date}</span>
                              </div>
                              <h4 className="font-bold text-white text-base leading-snug mb-2 line-clamp-2">{task.title}</h4>
                              <p className="text-xs text-gray-400 leading-relaxed mb-4 line-clamp-3">{task.description}</p>
                              
                              <div className="flex items-center gap-3 border-t border-white/10 pt-3">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md ring-2 ring-white/10">
                                  {task.assignedTo?.firstName?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <span className="text-sm font-medium text-gray-200">{task.assignedTo?.firstName || 'Unassigned'}</span>
                              </div>
                              <TaskInteractions task={task} onUpdate={fetchAllTasks} />
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;
