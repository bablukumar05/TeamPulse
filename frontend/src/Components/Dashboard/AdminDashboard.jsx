import React, { useState } from "react";
import Header from "../other/Header"
import CreateTask from "../other/CreateTask"
import AllTask from "../other/AllTask"
import KanbanBoard from "./KanbanBoard"
import AnalyticsDashboard from "./AnalyticsDashboard"
import AuditTimeline from "./AuditTimeline"
import CalendarView from "./CalendarView"
import LeaveApprovals from "../other/LeaveApprovals"
import JoinRequests from "../other/JoinRequests"

const AdminDashboard = (props) => {
  const [refreshTasks, setRefreshTasks] = useState(false);
  const [activeView, setActiveView] = useState('kanban');

  React.useEffect(() => {
    const handleAdminRefetch = () => setRefreshTasks(prev => !prev);
    window.addEventListener('adminDataRefetch', handleAdminRefetch);
    return () => window.removeEventListener('adminDataRefetch', handleAdminRefetch);
  }, []);

  return (
    <div className="min-h-screen w-full p-8 bg-gradient-to-br from-[#0B0B0B] via-[#151515] to-[#1A1A1A] text-white selection:bg-emerald-500/30">
      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        <Header changeUser={props.changeUser} />
        <AnalyticsDashboard refreshTrigger={refreshTasks} />
        <JoinRequests refreshTrigger={refreshTasks} />
        <LeaveApprovals refreshTrigger={refreshTasks} />
        <CreateTask onTaskCreated={() => setRefreshTasks(!refreshTasks)} />
        
        <div className="flex justify-end gap-4 mt-2">
            <button onClick={() => setActiveView('kanban')} className={`px-5 py-2.5 rounded-full text-sm font-bold tracking-widest transition-all ${activeView === 'kanban' ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>KANBAN</button>
            <button onClick={() => setActiveView('calendar')} className={`px-5 py-2.5 rounded-full text-sm font-bold tracking-widest transition-all ${activeView === 'calendar' ? 'bg-white text-blue-900 shadow-[0_0_15px_rgba(255,255,255,0.5)] bg-gradient-to-r from-gray-100 to-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>CALENDAR</button>
        </div>

        {activeView === 'kanban' ? <KanbanBoard refreshTrigger={refreshTasks} /> : <CalendarView key={refreshTasks} />}
        
        <AllTask refreshTrigger={refreshTasks} />
        <AuditTimeline refreshTrigger={refreshTasks} />
      </div>
    </div>
  );
};

export default AdminDashboard;

