import React from 'react'

const TaskListNumbers = ({ taskCount }) => {
  return (
    <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 w-full cursor-default'>
      <div className='rounded-xl p-5 bg-zinc-900/40 border border-zinc-800/80 transition-colors hover:border-zinc-700/80'>
        <span className='text-xs font-mono uppercase tracking-wider text-zinc-500 block mb-1'>Backlog & Inbound</span>
        <h2 className='text-3xl font-semibold text-zinc-100 tracking-tight'>{taskCount?.newTask || 0}</h2>
        <span className='text-xs font-medium text-zinc-400 mt-1 block'>New Tasks</span>
      </div>
      <div className='rounded-xl p-5 bg-zinc-900/40 border border-zinc-800/80 transition-colors hover:border-zinc-700/80'>
        <span className='text-xs font-mono uppercase tracking-wider text-zinc-500 block mb-1'>In Progress</span>
        <h2 className='text-3xl font-semibold text-zinc-100 tracking-tight'>{taskCount?.active || 0}</h2>
        <span className='text-xs font-medium text-zinc-400 mt-1 block'>Active Tasks</span>
      </div>
      <div className='rounded-xl p-5 bg-zinc-900/40 border border-zinc-800/80 transition-colors hover:border-zinc-700/80'>
        <span className='text-xs font-mono uppercase tracking-wider text-zinc-500 block mb-1'>Delivered</span>
        <h2 className='text-3xl font-semibold text-zinc-100 tracking-tight'>{taskCount?.completed || 0}</h2>
        <span className='text-xs font-medium text-zinc-400 mt-1 block'>Completed Tasks</span>
      </div>
      <div className='rounded-xl p-5 bg-zinc-900/40 border border-zinc-800/80 transition-colors hover:border-zinc-700/80'>
        <span className='text-xs font-mono uppercase tracking-wider text-zinc-500 block mb-1'>Attention Required</span>
        <h2 className='text-3xl font-semibold text-zinc-100 tracking-tight'>{taskCount?.failed || 0}</h2>
        <span className='text-xs font-medium text-zinc-400 mt-1 block'>Blocked / Overdue</span>
      </div>
    </div>
  )
}

export default TaskListNumbers
