import React from 'react'

const TaskListNumbers = ({ taskCount }) => {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8 w-full cursor-default'>
      <div className='relative overflow-hidden rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-md shadow-lg group hover:-translate-y-1 transition duration-300'>
        <div className='absolute -inset-1 bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition duration-500'></div>
        <h2 className='text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent relative drop-shadow-md'>{taskCount?.newTask || 0}</h2>
        <h3 className='text-sm font-semibold text-gray-300 uppercase tracking-widest mt-2 relative'>New Task</h3>
      </div>
      <div className='relative overflow-hidden rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-md shadow-lg group hover:-translate-y-1 transition duration-300'>
        <div className='absolute -inset-1 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 blur-xl opacity-0 group-hover:opacity-100 transition duration-500'></div>
        <h2 className='text-4xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent relative drop-shadow-md'>{taskCount?.completed || 0}</h2>
        <h3 className='text-sm font-semibold text-gray-300 uppercase tracking-widest mt-2 relative'>Completed Task</h3>
      </div>
      <div className='relative overflow-hidden rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-md shadow-lg group hover:-translate-y-1 transition duration-300'>
        <div className='absolute -inset-1 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 blur-xl opacity-0 group-hover:opacity-100 transition duration-500'></div>
        <h2 className='text-4xl font-bold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent relative drop-shadow-md'>{taskCount?.active || 0}</h2>
        <h3 className='text-sm font-semibold text-gray-300 uppercase tracking-widest mt-2 relative'>Accepted Task</h3>
      </div>
      <div className='relative overflow-hidden rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-md shadow-lg group hover:-translate-y-1 transition duration-300'>
        <div className='absolute -inset-1 bg-gradient-to-br from-red-500/20 to-rose-500/20 blur-xl opacity-0 group-hover:opacity-100 transition duration-500'></div>
        <h2 className='text-4xl font-bold bg-gradient-to-r from-red-400 to-rose-400 bg-clip-text text-transparent relative drop-shadow-md'>{taskCount?.failed || 0}</h2>
        <h3 className='text-sm font-semibold text-gray-300 uppercase tracking-widest mt-2 relative'>Failed Task</h3>
      </div>
    </div>
  )
}

export default TaskListNumbers
