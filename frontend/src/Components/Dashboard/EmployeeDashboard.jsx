import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Header from '../other/Header';
import TaskListNumbers from '../other/TaskListNumbers';
import TaskList from '../TaskList/TaskList';
import GamificationBanner from '../other/GamificationBanner';
import PersonalAnalytics from '../other/PersonalAnalytics';
import CalendarView from './CalendarView';
import { AuthContext } from "../../Context/AuthProvider";

const EmployeeDashboard = (props) => {
  const [tasksData, setTasksData] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const [activeView, setActiveView] = useState('list');
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axios.get("/api/employee/tasks", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setTasksData(response.data);
      } catch (error) {
        console.error("Failed to fetch tasks", error);
      }
    };
    if (token) {
      fetchTasks();
    }
  }, [token, refreshTrigger]);

  useEffect(() => {
    const handleNewTask = () => setRefreshTrigger(prev => !prev);
    window.addEventListener('newTaskRefetch', handleNewTask);
    return () => window.removeEventListener('newTaskRefetch', handleNewTask);
  }, []);

  const onTaskUpdate = () => {
    setRefreshTrigger(!refreshTrigger);
  };

  return (
    <div className='p-8 min-h-screen w-full bg-gradient-to-br from-[#0B0B0B] via-[#151515] to-[#1A1A1A] text-white selection:bg-emerald-500/30 flex flex-col'>
      <div className='max-w-7xl mx-auto w-full flex flex-col gap-4 flex-1'>
        <Header changeUser={props.changeUser} data={props.data} />
        {tasksData && (
          <div className="flex flex-col flex-1 pb-6 mt-4">
            <GamificationBanner xp={tasksData.xp} badges={tasksData.badges} />
            <PersonalAnalytics taskCount={tasksData.taskCount} />
            
            <div className="flex justify-end gap-4 mt-8">
                <button onClick={() => setActiveView('list')} className={`px-5 py-2.5 rounded-full text-sm font-bold tracking-widest transition-all ${activeView === 'list' ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>LIST VIEW</button>
                <button onClick={() => setActiveView('calendar')} className={`px-5 py-2.5 rounded-full text-sm font-bold tracking-widest transition-all ${activeView === 'calendar' ? 'bg-white text-emerald-900 shadow-[0_0_15px_rgba(255,255,255,0.5)] bg-gradient-to-r from-gray-100 to-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>CALENDAR</button>
            </div>

            {activeView === 'list' ? (
                <>
                    <TaskListNumbers taskCount={tasksData.taskCount} />
                    <TaskList tasks={tasksData.tasks} onTaskUpdate={onTaskUpdate} />
                </>
            ) : (
                <CalendarView embeddedTasks={tasksData.tasks} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default EmployeeDashboard;
