import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Header from '../Other/Header';
import TaskListNumbers from '../Other/TaskListNumbers';
import TaskList from '../TaskList/TaskList';
import GamificationBanner from '../Other/GamificationBanner';
import PersonalAnalytics from '../Other/PersonalAnalytics';
import AnnouncementsFeed from '../Other/AnnouncementsFeed';
import MyProjects from '../Other/MyProjects';
import FocusMode from '../Other/FocusMode';
import CalendarView from './CalendarView';
import KanbanBoard from './KanbanBoard';
import AttendanceTracker from './AttendanceTracker';
import AttendanceCalendar from './AttendanceCalendar';
import LeaveRequestPanel from '../Other/LeaveRequestPanel';
import TeamChat from '../Other/TeamChat';
import ReportsPage from '../../Pages/ReportsPage';
import AIAssistant from '../AI/AIAssistant';
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
        {/* Left Sidebar */}
        <aside className="hidden lg:flex flex-col w-52 min-h-screen border-r border-white/[0.06] bg-[#0d0f14] py-6 px-3 gap-1 flex-shrink-0">
          <div className="px-3 mb-6">
            <span className="text-lg font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">TeamPulse</span>
            <p className="text-[10px] text-gray-600 mt-0.5 uppercase tracking-widest">Employee Portal</p>
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

        {/* Main */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto flex flex-col gap-5">
            <Header changeUser={props.changeUser} data={props.data} changePage={props.changePage} />

            {/* Mobile nav strip */}
            <div className="flex lg:hidden gap-2 overflow-x-auto pb-1">
              {EMP_NAV.map(item => (
                <button key={item.id} onClick={() => setActiveNav(item.id)}
                  className={`text-xs font-bold px-3 py-2 rounded-xl whitespace-nowrap flex-shrink-0 transition-all ${
                    activeNav === item.id ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-gray-500'
                  }`}>{item.label}</button>
              ))}
            </div>

            {/* Attendance Tracker — always visible at top */}
            <AttendanceTracker onUpdate={onTaskUpdate} />

            {/* ── DASHBOARD ── */}
            {activeNav === 'dashboard' && tasksData && (
              <div className="flex flex-col gap-5">
                <GamificationBanner xp={tasksData.xp} badges={tasksData.badges} />
                <AnnouncementsFeed />
                <PersonalAnalytics taskCount={tasksData.taskCount} />
                <MyProjects />
                <FocusMode tasks={tasksData.tasks} />
              </div>
            )}

            {/* ── KANBAN ── */}
            {activeNav === 'kanban' && <KanbanBoard refreshTrigger={refreshTrigger} />}

            {/* ── TASKS (list) ── */}
            {activeNav === 'tasks' && tasksData && (
              <>
                <TaskListNumbers taskCount={tasksData.taskCount} />
                <TaskList tasks={tasksData.tasks} onTaskUpdate={onTaskUpdate} />
              </>
            )}

            {/* ── CALENDAR ── */}
            {activeNav === 'calendar' && tasksData && (
              <CalendarView embeddedTasks={tasksData.tasks} />
            )}

            {/* ── CHAT ── */}
            {activeNav === 'chat' && <TeamChat />}

            {/* ── ATTENDANCE ── */}
            {activeNav === 'attendance' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white">My Attendance</h2>
                <AttendanceCalendar />
              </div>
            )}

            {/* ── LEAVE ── */}
            {activeNav === 'leave' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-white">Leave Management</h2>
                <LeaveRequestPanel onClose={() => setActiveNav('dashboard')} />
              </div>
            )}

            {/* ── REPORTS ── */}
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
