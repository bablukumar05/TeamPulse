import React from 'react'
import TaskInteractions from './TaskInteractions'

const FailedTask = ({data, onTaskUpdate}) => {
  return (
    <div className='min-w-[320px] max-w-[360px] flex-shrink-0 flex flex-col justify-between p-6 bg-white/10 border border-red-500/30 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgba(239,68,68,0.08)] hover:shadow-[0_8px_30px_rgba(239,68,68,0.2)] transition-all duration-300 relative overflow-hidden group hover:-translate-y-2 opacity-90'>
        <div className='absolute -inset-2 bg-gradient-to-br from-red-500/20 to-rose-500/20 blur-xl opacity-0 group-hover:opacity-100 transition duration-500'></div>
        <div className='relative z-10'>
          <div className='flex justify-between items-center mb-4'>
            <span className='bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider'>{data.category}</span>
            <span className='text-xs font-medium text-gray-400'>{data.date}</span>
          </div>
          <h2 className='text-xl font-bold text-white mb-2 leading-tight group-hover:text-red-200 transition-colors'>{data.title}</h2>
          <p className='text-sm text-gray-400 leading-relaxed mb-6 line-clamp-4'>{data.description}</p>
        </div>
        <TaskInteractions task={data} onUpdate={onTaskUpdate} />
        <div className='mt-auto relative z-10'>
            <div className='w-full flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/20 py-3 rounded-xl text-sm font-bold text-red-400'>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                Failed
            </div>
        </div>
      </div>
  )
}

export default FailedTask
