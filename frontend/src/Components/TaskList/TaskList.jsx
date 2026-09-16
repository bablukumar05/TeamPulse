import React, { useState } from 'react';
import TaskCard from './TaskCard';
import TaskDetailsDrawer from './TaskDetailsDrawer';

const TaskList = ({ tasks, onTaskUpdate }) => {
  const [selectedTask, setSelectedTask] = useState(null);

  return (
    <div className="w-full">
      <div id='tasklist' className='flex flex-grow shrink overflow-x-auto items-start justify-start gap-6 flex-nowrap w-full py-8 mt-6 scroll-smooth custom-scrollbar'>
        {tasks.map((elem, idx) => (
          <div key={elem._id || idx} onClick={() => setSelectedTask(elem)} className="cursor-pointer">
            <TaskCard data={elem} onTaskUpdate={onTaskUpdate} />
          </div>
        ))}
        
        {tasks.length === 0 && (
          <div className="w-full flex items-center justify-center p-12 mt-10">
            <p className="text-gray-400 text-lg">No tasks assigned yet.</p>
          </div>
        )}
      </div>

      {selectedTask && (
        <TaskDetailsDrawer
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={onTaskUpdate}
        />
      )}
    </div>
  );
};

export default TaskList;
