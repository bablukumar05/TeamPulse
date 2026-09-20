import React, { useState, useContext, useEffect } from "react";
import Header from "../other/Header";
import CreateTask from "../other/CreateTask";
import CreateProject from "../other/CreateProject";
import Announcements from "../other/Announcements";
import ManageEmployees from "../other/ManageEmployees";
import AllTask from "../other/AllTask";
import KanbanBoard from "./KanbanBoard";
import AnalyticsDashboard from "./AnalyticsDashboard";
import AuditTimeline from "./AuditTimeline";
import CalendarView from "./CalendarView";
import LeaveApprovals from "../other/LeaveApprovals";
import JoinRequests from "../other/JoinRequests";
import ProjectWorkspace from "./ProjectWorkspace";
import HRDashboard from "./HRDashboard";
import TeamsManagement from "./TeamsManagement";
import TeamChat from "../other/TeamChat";
import ReportsPage from "../../Pages/ReportsPage";
import AIAssistant from "../ai/AIAssistant";
import WorkspaceSettings from "./WorkspaceSettings";
import OnboardingChecklist from "./OnboardingChecklist";
import TaskReviewHub from "./TaskReviewHub";
import IntegrationsHub from "./IntegrationsHub";
import GuidedTourModal from "../other/GuidedTourModal";
import CommandPalette from "../other/CommandPalette";
import axios from "axios";
import { AuthContext } from "../../Context/AuthProvider";

const NAV_ITEMS = [
  { id: 'dashboard',    label: '🏠 Dashboard' },
  { id: 'reviews',      label: '🔍 Squad Reviews' },
  { id: 'integrations', label: '🔌 Integrations' },
  { id: 'teams',        label: '🛡️ Teams & Squads' },
  { id: 'settings',     label: '⚙️ Workspace Settings' },
  { id: 'projects',     label: '📁 Projects'  },
  { id: 'kanban',       label: '📋 Kanban'    },
  { id: 'calendar',     label: '📅 Calendar'  },
  { id: 'tasks',        label: '✅ All Tasks' },
  { id: 'chat',         label: '💬 Chat'      },
  { id: 'hr',           label: '👥 HR'        },
  { id: 'reports',      label: '📈 Reports'   },
  { id: 'audit',        label: '📊 Audit'     },
];

const AdminDashboard = (props) => {
  const { token } = useContext(AuthContext);
  const [refreshTasks, setRefreshTasks] = useState(false);
  const [activeNav, setActiveNav]       = useState('dashboard');
  const [projects, setProjects]         = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [commandOpen, setCommandOpen]   = useState(false);
  const [tourOpen, setTourOpen]         = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('teampulse_tour_completed')) {
      const timer = setTimeout(() => setTourOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleAdminRefetch = () => setRefreshTasks(prev => !prev);
    window.addEventListener('adminDataRefetch', handleAdminRefetch);
    return () => window.removeEventListener('adminDataRefetch', handleAdminRefetch);
  }, []);

  useEffect(() => {
    if (activeNav === 'projects' && token) {
      axios.get('/api/projects', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => setProjects(r.data))
        .catch(() => {});
    }
  }, [activeNav, token, refreshTasks]);

  // If a project is selected, show its workspace
  if (selectedProject) {
    return (
      <ProjectWorkspace
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
      />
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0B0F19] via-[#0D1322] to-[#111827] text-white selection:bg-indigo-500/30">
      <div className="flex">
        <aside className="hidden lg:flex flex-col w-52 min-h-screen border-r border-white/[0.06] bg-[#0B0F19] py-6 px-3 gap-1 flex-shrink-0">
          <div className="px-3 mb-6">
            <span className="text-base font-semibold text-zinc-100 tracking-tight">TeamPulse</span>
            <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wider font-mono">Administration</p>
            <button
              onClick={() => setTourOpen(true)}
              className="mt-2.5 w-full text-[11px] font-semibold text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-lg py-1 px-2 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>🚀 Take Product Tour</span>
            </button>
          </div>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`text-sm font-semibold px-3 py-2.5 rounded-xl text-left transition-all ${
                activeNav === item.id
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.label}
            </button>
          ))}
        </aside>

        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-3.5 sm:p-5 lg:p-6 flex flex-col gap-6">
            <Header changeUser={props.changeUser} changePage={props.changePage} />

            <div className="flex lg:hidden gap-2 overflow-x-auto pb-1">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={`text-xs font-bold px-3 py-2 rounded-xl whitespace-nowrap transition-all flex-shrink-0 ${
                    activeNav === item.id ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-gray-500'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {activeNav === 'dashboard' && (
              <>
                <OnboardingChecklist setActiveNav={setActiveNav} />
                <AnalyticsDashboard refreshTrigger={refreshTasks} />
                <Announcements allowCreate={true} refreshTrigger={() => setRefreshTasks(!refreshTasks)} />
                <ManageEmployees refreshTrigger={refreshTasks} />
                <JoinRequests refreshTrigger={refreshTasks} />
                <LeaveApprovals refreshTrigger={refreshTasks} />
                <CreateProject refreshTrigger={() => setRefreshTasks(!refreshTasks)} />
                <CreateTask onTaskCreated={() => setRefreshTasks(!refreshTasks)} />
              </>
            )}

            {activeNav === 'projects' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                  <h2 className="text-xl font-semibold text-zinc-100 tracking-tight">Active Projects</h2>
                  <button
                    onClick={() => setActiveNav('dashboard')}
                    className="text-xs text-gray-500 hover:text-white bg-white/5 border border-white/10 px-3 py-2 rounded-xl transition-colors"
                  >
                    + Create Project
                  </button>
                </div>

                {projects.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">📁</div>
                    <p className="text-gray-400 text-lg font-semibold">No projects yet</p>
                    <p className="text-gray-600 text-sm mt-2">Go to Dashboard and use the Create Project form.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {projects.map(project => {
                      const statusColors = {
                        'Planning':    'bg-slate-500/20 text-slate-400 border-slate-500/30',
                        'In Progress': 'bg-blue-500/20  text-blue-400  border-blue-500/30',
                        'Active':      'bg-blue-500/20  text-blue-400  border-blue-500/30',
                        'Completed':   'bg-green-500/20 text-green-400 border-green-500/30',
                        'On Hold':     'bg-amber-500/20 text-amber-400 border-amber-500/30',
                      };
                      const memberCount = project.members?.length || 0;
                      return (
                        <div
                          key={project._id}
                          onClick={() => setSelectedProject(project)}
                          className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 cursor-pointer hover:bg-white/[0.06] hover:border-white/[0.14] hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] transition-all group"
                          style={{ borderTopColor: project.color || '#6366f1', borderTopWidth: 2 }}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl"
                              style={{ background: (project.color || '#6366f1') + '22' }}>
                              🗂️
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[project.status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                              {project.status}
                            </span>
                          </div>
                          <h3 className="font-bold text-white text-base mb-1 group-hover:text-indigo-400 transition-colors">{project.name}</h3>
                          {project.description && (
                            <p className="text-xs text-gray-500 line-clamp-2 mb-3">{project.description}</p>
                          )}
                          <div className="flex items-center justify-between text-xs text-gray-600 mt-auto">
                            <span>👥 {memberCount} member{memberCount !== 1 ? 's' : ''}</span>
                            {project.endDate && (
                              <span>📅 {new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            )}
                          </div>
                          <div className="mt-3 text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                            Open Workspace →
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeNav === 'reviews' && <TaskReviewHub />}
            {activeNav === 'integrations' && <IntegrationsHub />}
            {activeNav === 'teams' && <TeamsManagement />}
            {activeNav === 'settings' && <WorkspaceSettings />}
            {activeNav === 'kanban' && <KanbanBoard refreshTrigger={refreshTasks} />}
            {activeNav === 'calendar' && <CalendarView key={refreshTasks} />}
            {activeNav === 'tasks' && <AllTask refreshTrigger={refreshTasks} />}
            {activeNav === 'chat' && <TeamChat />}
            {activeNav === 'audit' && <AuditTimeline refreshTrigger={refreshTasks} />}
            {activeNav === 'hr' && (
              <HRDashboard onBack={() => setActiveNav('dashboard')} />
            )}
            {activeNav === 'reports' && (
              <ReportsPage onBack={() => setActiveNav('dashboard')} />
            )}
          </div>
        </main>
      </div>
      <AIAssistant />
      <CommandPalette
        isOpen={commandOpen}
        setIsOpen={setCommandOpen}
        setActiveNav={setActiveNav}
      />
      <GuidedTourModal
        isOpen={tourOpen}
        onClose={() => setTourOpen(false)}
        onNavigateTab={setActiveNav}
      />
    </div>
  );
};

export default AdminDashboard;
