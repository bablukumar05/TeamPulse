import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Header from '../other/Header';
import TaskList from '../TaskList/TaskList';
import GamificationBanner from '../other/GamificationBanner';
import PersonalAnalytics from '../other/PersonalAnalytics';
import Announcements from '../other/Announcements';
import MyProjects from '../other/MyProjects';
import FocusMode from '../other/FocusMode';
import CalendarView from './CalendarView';
import KanbanBoard from './KanbanBoard';
import AttendanceTracker from './AttendanceTracker';
import AttendanceCalendar from './AttendanceCalendar';
import LeaveRequestPanel from '../other/LeaveRequestPanel';
import TeamChat from '../other/TeamChat';
import ReportsPage from '../../Pages/ReportsPage';
import AIAssistant from '../ai/AIAssistant';
import { AuthContext } from "../../Context/AuthProvider";

const EMP_NAV = [
  { id: 'dashboard',   label: '🏠 Dashboard'   },
  { id: 'kanban',      label: '📋 Kanban'       },
  { id: 'tasks',       label: '✅ My Tasks'     },
  { id: 'calendar',    label: '📅 Calendar'     },
  { id: 'chat',        label: '💬 Chat'         },
  { id: 'attendance',  label: '🕐 Attendance'   },
  { id: 'leave',       label: '🌴 Leave'        },
  { id: 'reports',     label: '📈 Reports'      },
];

const TaskListNumbers = ({ taskCount }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 w-full cursor-default">
    <div className="rounded-xl p-5 bg-zinc-900/40 border border-zinc-800/80 transition-colors hover:border-zinc-700/80">
      <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 block mb-1">Backlog & Inbound</span>
      <h2 className="text-3xl font-semibold text-zinc-100 tracking-tight">{taskCount?.newTask || 0}</h2>
      <span className="text-xs font-medium text-zinc-400 mt-1 block">New Tasks</span>
    </div>
    <div className="rounded-xl p-5 bg-zinc-900/40 border border-zinc-800/80 transition-colors hover:border-zinc-700/80">
      <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 block mb-1">In Progress</span>
      <h2 className="text-3xl font-semibold text-zinc-100 tracking-tight">{taskCount?.active || 0}</h2>
      <span className="text-xs font-medium text-zinc-400 mt-1 block">Active Tasks</span>
    </div>
    <div className="rounded-xl p-5 bg-zinc-900/40 border border-zinc-800/80 transition-colors hover:border-zinc-700/80">
      <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 block mb-1">Delivered</span>
      <h2 className="text-3xl font-semibold text-zinc-100 tracking-tight">{taskCount?.completed || 0}</h2>
      <span className="text-xs font-medium text-zinc-400 mt-1 block">Completed Tasks</span>
    </div>
    <div className="rounded-xl p-5 bg-zinc-900/40 border border-zinc-800/80 transition-colors hover:border-zinc-700/80">
      <span className="text-xs font-mono uppercase tracking-wider text-zinc-500 block mb-1">Attention Required</span>
      <h2 className="text-3xl font-semibold text-zinc-100 tracking-tight">{taskCount?.failed || 0}</h2>
      <span className="text-xs font-medium text-zinc-400 mt-1 block">Blocked / Overdue</span>
    </div>
  </div>
);

const EmployeeDashboard = (props) => {
  const [tasksData, setTasksData]       = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const [activeNav, setActiveNav]       = useState('dashboard');
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axios.get("/api/employee/tasks", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTasksData(response.data);
      } catch (error) {
        console.error("Failed to fetch tasks", error);
      }
    };
    if (token) fetchTasks();
  }, [token, refreshTrigger]);

  useEffect(() => {
    const handleNewTask = () => setRefreshTrigger(prev => !prev);
    window.addEventListener('newTaskRefetch', handleNewTask);
    return () => window.removeEventListener('newTaskRefetch', handleNewTask);
  }, []);

  const onTaskUpdate = () => setRefreshTrigger(!refreshTrigger);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0B0B0B] via-[#151515] to-[#1A1A1A] text-white selection:bg-emerald-500/30">
      <div className="flex">
        <aside className="hidden lg:flex flex-col w-52 min-h-screen border-r border-white/[0.06] bg-[#0d0f14] py-6 px-3 gap-1 flex-shrink-0">
          <div className="px-3 mb-6">
            <span className="text-base font-semibold text-zinc-100 tracking-tight">TeamPulse</span>
            <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wider font-mono">Contributor Portal</p>
          </div>
          {EMP_NAV.map(item => (
            <button key={item.id} onClick={() => setActiveNav(item.id)}
              className={`text-sm font-semibold px-3 py-2.5 rounded-xl text-left transition-all ${
                activeNav === item.id
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}>
              {item.label}
            </button>
          ))}
        </aside>

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto flex flex-col gap-5">
            <Header changeUser={props.changeUser} data={props.data} changePage={props.changePage} />

            <div className="flex lg:hidden gap-2 overflow-x-auto pb-1">
              {EMP_NAV.map(item => (
                <button key={item.id} onClick={() => setActiveNav(item.id)}
                  className={`text-xs font-bold px-3 py-2 rounded-xl whitespace-nowrap flex-shrink-0 transition-all ${
                    activeNav === item.id ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-gray-500'
                  }`}>{item.label}</button>
              ))}
            </div>

            <AttendanceTracker onUpdate={onTaskUpdate} />

            {activeNav === 'dashboard' && tasksData && (
              <div className="flex flex-col gap-5">
                <GamificationBanner xp={tasksData.xp} badges={tasksData.badges} />
                <Announcements />
                <PersonalAnalytics taskCount={tasksData.taskCount} />
                <MyProjects />
                <FocusMode tasks={tasksData.tasks} />
              </div>
            )}

            {activeNav === 'kanban' && <KanbanBoard refreshTrigger={refreshTrigger} />}

            {activeNav === 'tasks' && tasksData && (
              <>
                <TaskListNumbers taskCount={tasksData.taskCount} />
                <TaskList tasks={tasksData.tasks} onTaskUpdate={onTaskUpdate} />
              </>
            )}

            {activeNav === 'calendar' && tasksData && (
              <CalendarView embeddedTasks={tasksData.tasks} />
            )}

            {activeNav === 'chat' && <TeamChat />}

            {activeNav === 'attendance' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white">My Attendance</h2>
                <AttendanceCalendar />
              </div>
            )}

            {activeNav === 'leave' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white">Leave Management</h2>
                <LeaveRequestPanel onClose={() => setActiveNav('dashboard')} />
              </div>
            )}

            {activeNav === 'reports' && (
              <ReportsPage onBack={() => setActiveNav('dashboard')} />
            )}
          </div>
        </main>
      </div>
      <AIAssistant />
    </div>
  );
};

export default EmployeeDashboard;
