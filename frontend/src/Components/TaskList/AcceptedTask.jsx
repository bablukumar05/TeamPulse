import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { AuthContext } from "../../Context/AuthProvider";
import TaskInteractions from './TaskInteractions';

const AcceptedTask = ({ data, onTaskUpdate }) => {
  const { authUser, token } = useContext(AuthContext);
  const [isRunning, setIsRunning] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [currentLogId, setCurrentLogId] = useState(null);

  useEffect(() => {
    const fetchTimeLogs = async () => {
      try {
        const res = await axios.get(`/api/timelogs/task/${data._id}`);
        setTimeSpent(res.data.totalSeconds || 0);
        setIsRunning(res.data.isRunning);
        setCurrentLogId(res.data.currentLogId);
      } catch (err) {
        console.error("Error fetching time logs", err);
      }
    };
    fetchTimeLogs();
  }, [data._id]);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTimeSpent((prevTime) => prevTime + 1);
      }, 1000);
    } else if (!isRunning && timeSpent !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeSpent]);

  const toggleTimer = async () => {
    if (!isRunning) {
      try {
        const res = await axios.post('/api/timelogs/start', { taskId: data._id, userId: authUser.data._id });
        setIsRunning(true);
        setCurrentLogId(res.data._id);
        toast.success("Timer started!");
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to start timer');
      }
    } else {
      if (!currentLogId) return;
      try {
        await axios.put(`/api/timelogs/stop/${currentLogId}`);
        setIsRunning(false);
        setCurrentLogId(null);
        toast.success("Timer stopped!");
      } catch (err) {
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

  const handleUpdateStatus = async (status) => {
    try {
      await axios.put(`/api/employee/tasks/${data._id}/status`, 
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Task marked as ${status}!`);
      if (onTaskUpdate) onTaskUpdate();
    } catch (error) {
      toast.error(`Failed to mark task as ${status}`);
    }
  };

  return (
    <div className={`min-w-[320px] max-w-[360px] flex-shrink-0 flex flex-col justify-between p-6 bg-white/10 border border-white/20 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(234,179,8,0.15)] transition-all duration-300 relative overflow-hidden group hover:-translate-y-2 ${new Date(data.date) < new Date() ? 'animate-pulse border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : ''}`}>
        {new Date(data.date) < new Date() && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-20 shadow-lg">OVERDUE</span>}
        <div className='absolute -inset-2 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 blur-xl opacity-0 group-hover:opacity-100 transition duration-500'></div>
        <div className='relative z-10'>
          <div className='flex justify-between items-center mb-4'>
            <span className='bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider'>{data.category}</span>
            <span className={`text-xs font-medium ${new Date(data.date) < new Date() ? 'text-red-400 font-bold' : 'text-gray-400'}`}>{data.date}</span>
          </div>
          <h2 className='text-xl font-bold text-white mb-2 leading-tight group-hover:text-yellow-200 transition-colors'>{data.title}</h2>
          <p className='text-sm text-gray-300 leading-relaxed mb-6 line-clamp-4'>{data.description}</p>
        </div>
        <TaskInteractions task={data} onUpdate={onTaskUpdate} />
        
        <div className="flex bg-black/40 rounded-xl mb-4 border border-white/5 relative z-10 overflow-hidden shadow-inner">
            <div className="flex-1 flex flex-col justify-center items-center py-2 border-r border-white/10">
                <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-1">Time Spent</span>
                <span className={`text-lg font-mono font-bold tracking-wider ${isRunning ? 'text-yellow-400 animate-pulse' : 'text-gray-300'}`}>{formatTime(timeSpent)}</span>
            </div>
            <button 
                onClick={toggleTimer} 
                className={`w-14 flex items-center justify-center transition-colors ${isRunning ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}
            >
                {isRunning ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                ) : (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path></svg>
                )}
            </button>
        </div>

        <div className='flex justify-between gap-3 mt-auto relative z-10'>
            <button onClick={() => handleUpdateStatus('Completed')} className='flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 py-3 rounded-xl text-xs font-bold tracking-wide text-white shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 active:scale-[0.98]'>Complete</button>
            <button onClick={() => handleUpdateStatus('Failed')} className='flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 py-3 rounded-xl text-xs font-bold tracking-wide text-white shadow-lg hover:shadow-red-500/30 transition-all duration-300 active:scale-[0.98]'>Failed</button>
        </div>
      </div>
  )
}

export default AcceptedTask
