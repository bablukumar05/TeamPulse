import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from '../../Context/AuthProvider';
import TaskInteractions from './TaskInteractions';

const TaskCard = ({ data, onTaskUpdate }) => {
  const { authUser, token } = useContext(AuthContext);
  const [isRunning, setIsRunning] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [currentLogId, setCurrentLogId] = useState(null);

  const isCompleted = data.status === 'Completed';
  const isFailed = data.status === 'Failed' || data.status === 'Blocked';
  const isNew = data.status === 'To Do' || data.status === 'New';
  const isOverdue = new Date(data.date) < new Date();

  useEffect(() => {
    if (isCompleted || isFailed || isNew) return;

    const fetchTimeLogs = async () => {
      try {
        const res = await axios.get(`/api/timelogs/task/${data._id}`);
        setTimeSpent(res.data.totalSeconds || 0);
        setIsRunning(res.data.isRunning);
        setCurrentLogId(res.data.currentLogId);
      } catch {
        // silent fail
      }
    };
    fetchTimeLogs();
  }, [data._id, isCompleted, isFailed, isNew]);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    } else if (!isRunning && timeSpent !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeSpent]);

  const toggleTimer = async (e) => {
    e.stopPropagation();
    if (!isRunning) {
      try {
        const res = await axios.post('/api/timelogs/start', {
          taskId: data._id,
          userId: authUser?.data?._id
        });
        setIsRunning(true);
        setCurrentLogId(res.data._id);
        toast.success('Timer started');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to start timer');
      }
    } else {
      if (!currentLogId) return;
      try {
        await axios.put(`/api/timelogs/stop/${currentLogId}`);
        setIsRunning(false);
        setCurrentLogId(null);
        toast.success('Timer stopped');
      } catch {
        toast.error('Failed to stop timer');
      }
    }
  };

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleUpdateStatus = async (status, e) => {
    if (e) e.stopPropagation();
    try {
      await axios.put(
        `/api/employee/tasks/${data._id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Task marked as ${status}`);
      if (onTaskUpdate) onTaskUpdate();
    } catch {
      toast.error(`Failed to mark task as ${status}`);
    }
  };

  const handleAcceptTask = async (e) => {
    if (e) e.stopPropagation();
    try {
      await axios.put(
        `/api/employee/tasks/${data._id}/status`,
        { status: 'Active' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Task accepted');
      if (onTaskUpdate) onTaskUpdate();
    } catch {
      toast.error('Failed to accept task');
    }
  };

  const getCardStyle = () => {
    if (isCompleted) {
      return 'border-emerald-500/30 opacity-85 hover:opacity-100 shadow-[0_8px_30px_rgba(16,185,129,0.08)]';
    }
    if (isFailed) {
      return 'border-red-500/30 opacity-90 shadow-[0_8px_30px_rgba(239,68,68,0.08)]';
    }
    if (isNew) {
      return 'border-white/20 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)]';
    }
    return 'border-white/20 hover:shadow-[0_8px_30px_rgba(234,179,8,0.15)]';
  };

  const getBadgeStyle = () => {
    if (isCompleted) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (isFailed) return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (isNew) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  };

  return (
    <div
      className={`min-w-[320px] max-w-[360px] flex-shrink-0 flex flex-col justify-between p-6 bg-white/10 border backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 relative overflow-hidden group hover:-translate-y-2 ${getCardStyle()} ${
        isOverdue && !isCompleted ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : ''
      }`}
    >
      {isOverdue && !isCompleted && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-20 shadow-lg">
          OVERDUE
        </span>
      )}

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border ${getBadgeStyle()}`}>
            {data.category}
          </span>
          <span className={`text-xs font-medium ${isOverdue && !isCompleted ? 'text-red-400 font-bold' : 'text-gray-400'}`}>
            {data.date}
          </span>
        </div>

        <h2 className={`text-xl font-bold text-white mb-2 leading-tight transition-colors ${
          isCompleted ? 'line-through decoration-emerald-500/50 group-hover:text-emerald-200' : 'group-hover:text-zinc-200'
        }`}>
          {data.title}
        </h2>
        <p className="text-sm text-gray-300 leading-relaxed mb-6 line-clamp-4">{data.description}</p>
      </div>

      <TaskInteractions task={data} onUpdate={onTaskUpdate} />

      <div className="mt-auto relative z-10 pt-4">
        {isCompleted && (
          <div className="w-full flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/20 py-3 rounded-xl text-sm font-bold text-emerald-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Completed
          </div>
        )}

        {isFailed && (
          <div className="w-full flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 py-3 rounded-xl text-sm font-bold text-red-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            {data.status || 'Failed'}
          </div>
        )}

        {isNew && (
          <button
            onClick={handleAcceptTask}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 py-3 rounded-xl text-sm font-bold text-white shadow-lg hover:shadow-blue-500/40 transition-all duration-300 active:scale-[0.98]"
          >
            Accept Task
          </button>
        )}

        {!isCompleted && !isFailed && !isNew && (
          <>
            <div className="flex bg-black/40 rounded-xl mb-4 border border-white/5 relative z-10 overflow-hidden shadow-inner">
              <div className="flex-1 flex flex-col justify-center items-center py-2 border-r border-white/10">
                <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-1">Time Spent</span>
                <span className={`text-lg font-mono font-bold tracking-wider ${isRunning ? 'text-yellow-400 animate-pulse' : 'text-gray-300'}`}>
                  {formatTime(timeSpent)}
                </span>
              </div>
              <button
                onClick={toggleTimer}
                className={`w-14 flex items-center justify-center transition-colors ${
                  isRunning ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                }`}
              >
                {isRunning ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>

            <div className="flex justify-between gap-3 mt-auto relative z-10">
              <button
                onClick={(e) => handleUpdateStatus('Completed', e)}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 py-3 rounded-xl text-xs font-bold tracking-wide text-white shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 active:scale-[0.98]"
              >
                Complete
              </button>
              <button
                onClick={(e) => handleUpdateStatus('Failed', e)}
                className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 py-3 rounded-xl text-xs font-bold tracking-wide text-white shadow-lg hover:shadow-red-500/30 transition-all duration-300 active:scale-[0.98]"
              >
                Failed
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
