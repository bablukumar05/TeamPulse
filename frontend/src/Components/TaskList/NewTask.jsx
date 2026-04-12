import React, { useContext } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { AuthContext } from "../../Context/AuthProvider";
import TaskInteractions from './TaskInteractions';

const NewTask = ({ data, onTaskUpdate }) => {
  const { token } = useContext(AuthContext);

  const handleAcceptTask = async () => {
    try {
      await axios.put(`/api/employee/tasks/${data._id}/status`, 
        { status: 'Active' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Task accepted!");
      if (onTaskUpdate) onTaskUpdate();
    } catch (error) {
      toast.error("Failed to accept task");
    }
  };

  return (
    <div className={`min-w-[320px] max-w-[360px] flex-shrink-0 flex flex-col justify-between p-6 bg-white/10 border border-white/20 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(59,130,246,0.2)] transition-all duration-300 relative overflow-hidden group hover:-translate-y-2 ${new Date(data.date) < new Date() ? 'animate-pulse border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : ''}`}>
        {new Date(data.date) < new Date() && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-20 shadow-lg">OVERDUE</span>}
        <div className='absolute -inset-2 bg-gradient-to-br from-blue-500/30 to-cyan-500/20 blur-xl opacity-0 group-hover:opacity-100 transition duration-500'></div>
        <div className='relative z-10'>
          <div className='flex justify-between items-center mb-4'>
            <span className='bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider'>{data.category}</span>
            <span className={`text-xs font-medium ${new Date(data.date) < new Date() ? 'text-red-400 font-bold' : 'text-gray-400'}`}>{data.date}</span>
          </div>
          <h2 className='text-xl font-bold text-white mb-2 leading-tight group-hover:text-blue-200 transition-colors'>{data.title}</h2>
          <p className='text-sm text-gray-300 leading-relaxed mb-6 line-clamp-4'>{data.description}</p>
        </div>
        <TaskInteractions task={data} onUpdate={onTaskUpdate} />
        <div className='mt-auto relative z-10'>
            <button onClick={handleAcceptTask} className='w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 py-3 rounded-xl text-sm font-bold text-white shadow-lg hover:shadow-blue-500/40 transition-all duration-300 active:scale-[0.98]'>Accept Task</button>
        </div>
    </div>
  )
}

export default NewTask
