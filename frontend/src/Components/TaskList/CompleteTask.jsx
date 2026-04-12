import React from 'react'
import TaskInteractions from './TaskInteractions'

const CompleteTask = ({data, onTaskUpdate}) => {
  return (
    <div className='min-w-[320px] max-w-[360px] flex-shrink-0 flex flex-col justify-between p-6 bg-white/10 border border-emerald-500/30 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgba(16,185,129,0.08)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.2)] transition-all duration-300 relative overflow-hidden group hover:-translate-y-2 opacity-80 hover:opacity-100'>
        <div className='absolute -inset-2 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 blur-xl opacity-0 group-hover:opacity-100 transition duration-500'></div>
        <div className='relative z-10'>
          <div className='flex justify-between items-center mb-4'>
            <span className='bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider'>{data.category}</span>
            <span className='text-xs font-medium text-gray-400'>{data.date}</span>
          </div>
          <h2 className='text-xl font-bold text-white mb-2 leading-tight group-hover:text-emerald-200 transition-colors line-through decoration-emerald-500/50'>{data.title}</h2>
          <p className='text-sm text-gray-400 leading-relaxed mb-6 line-clamp-4'>{data.description}</p>
        </div>
        <TaskInteractions task={data} onUpdate={onTaskUpdate} />
        <div className='mt-auto relative z-10'>
            <div className='w-full flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/20 py-3 rounded-xl text-sm font-bold text-emerald-400'>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                Completed
            </div>
        </div>
      </div>
  )
}

export default CompleteTask
