import React, { useState } from 'react';
import AcceptedTask from './AcceptedTask';
import NewTask from './NewTask';
import CompleteTask from './CompleteTask';
import FailedTask from './FailedTask';
import TaskDetailsDrawer from './TaskDetailsDrawer';

const TaskList = ({ tasks, onTaskUpdate }) => {
  const [selectedTask, setSelectedTask] = useState(null);

  return (
    <div className="w-full">
      <div id='tasklist' className='flex flex-grow shrink overflow-x-auto items-start justify-start gap-6 flex-nowrap w-full py-8 mt-6 scroll-smooth custom-scrollbar'>
        {tasks.map((elem, idx) => {
          return (
            <div key={elem._id || idx} onClick={() => setSelectedTask(elem)} className="cursor-pointer">
              {elem.status === 'Completed' ? (
                <CompleteTask data={elem} onTaskUpdate={onTaskUpdate} />
              ) : elem.status === 'Failed' || elem.status === 'Blocked' ? (
                <FailedTask data={elem} onTaskUpdate={onTaskUpdate} />
              ) : elem.status === 'To Do' || elem.status === 'New' ? (
                <NewTask data={elem} onTaskUpdate={onTaskUpdate} />
              ) : (
                <AcceptedTask data={elem} onTaskUpdate={onTaskUpdate} />
              )}
            </div>
          );
        })}
        
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
