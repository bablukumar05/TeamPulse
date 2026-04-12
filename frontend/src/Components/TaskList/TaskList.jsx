import React from 'react'
import AcceptedTask from './AcceptedTask'
import NewTask from './NewTask'
import CompleteTask from './CompleteTask'
import FailedTask from './FailedTask'

const TaskList = ({ tasks, onTaskUpdate }) => {
  return (
     <div id='tasklist' className='flex flex-grow shrink overflow-x-auto items-start justify-start gap-6 flex-nowrap w-full py-8 mt-6 scroll-smooth custom-scrollbar'>
      {tasks.map((elem, idx) => {
        if (elem.status === 'Active') {
          return <AcceptedTask key={elem._id || idx} data={elem} onTaskUpdate={onTaskUpdate} />
        }
        if (elem.status === 'New') {
          return <NewTask key={elem._id || idx} data={elem} onTaskUpdate={onTaskUpdate} />
        }
        if (elem.status === 'Completed') {
          return <CompleteTask key={elem._id || idx} data={elem} onTaskUpdate={onTaskUpdate} />
        }
        if (elem.status === 'Failed') {
          return <FailedTask key={elem._id || idx} data={elem} onTaskUpdate={onTaskUpdate} />
        }
        return null;
      })}
      
      {tasks.length === 0 && (
        <div className="w-full flex items-center justify-center p-12 mt-10">
          <p className="text-gray-400 text-lg">No tasks assigned yet.</p>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.5);
        }
      `}} />
    </div>
  )
}

export default TaskList
