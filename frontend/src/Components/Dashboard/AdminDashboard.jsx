import React, { useState, useContext, useEffect } from "react";
import Header from "../other/Header";
import CreateTask from "../other/CreateTask";
import CreateProject from "../other/CreateProject";
import CreateAnnouncement from "../other/CreateAnnouncement";
import AnnouncementsFeed from "../other/AnnouncementsFeed";
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
import TeamChat from "../other/TeamChat";
import ReportsPage from "../../Pages/ReportsPage";
import AIAssistant from "../ai/AIAssistant";
import axios from "axios";
import { AuthContext } from "../../Context/AuthProvider";

const NAV_ITEMS = [
  { id: 'dashboard', label: '🏠 Dashboard' },
  { id: 'projects',  label: '📁 Projects'  },
  { id: 'kanban',    label: '📋 Kanban'    },
  { id: 'calendar',  label: '📅 Calendar'  },
  { id: 'tasks',     label: '✅ All Tasks' },
  { id: 'chat',      label: '💬 Chat'      },
  { id: 'hr',        label: '👥 HR'        },
  { id: 'reports',   label: '📈 Reports'   },
  { id: 'audit',     label: '📊 Audit'     },
];

const AdminDashboard = (props) => {
  const { token } = useContext(AuthContext);
  const [refreshTasks, setRefreshTasks] = useState(false);
  const [activeNav, setActiveNav]       = useState('dashboard');
  const [projects, setProjects]         = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

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
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0B0B0B] via-[#151515] to-[#1A1A1A] text-white selection:bg-emerald-500/30">
      {/* Sidebar nav strip */}
      <div className="flex">
        {/* Left sidebar */}
        <aside className="hidden lg:flex flex-col w-52 min-h-screen border-r border-white/[0.06] bg-[#0d0f14] py-6 px-3 gap-1 flex-shrink-0">
          <div className="px-3 mb-6">
            <span className="text-lg font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">TeamPulse</span>
            <p className="text-[10px] text-gray-600 mt-0.5 uppercase tracking-widest">Admin Panel</p>
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

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-6 flex flex-col gap-6">
            <Header changeUser={props.changeUser} changePage={props.changePage} />

            {/* Mobile nav */}
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

            {/* ── DASHBOARD ── */}
            {activeNav === 'dashboard' && (
              <>
                <AnalyticsDashboard refreshTrigger={refreshTasks} />
                <AnnouncementsFeed key={refreshTasks} />
                <CreateAnnouncement refreshTrigger={() => setRefreshTasks(!refreshTasks)} />
                <ManageEmployees refreshTrigger={refreshTasks} />
                <JoinRequests refreshTrigger={refreshTasks} />
                <LeaveApprovals refreshTrigger={refreshTasks} />
                <CreateProject refreshTrigger={() => setRefreshTasks(!refreshTasks)} />
                <CreateTask onTaskCreated={() => setRefreshTasks(!refreshTasks)} />
              </>
            )}

            {/* ── PROJECTS ── */}
            {activeNav === 'projects' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Projects</h2>
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

            {/* ── KANBAN ── */}
            {activeNav === 'kanban' && <KanbanBoard refreshTrigger={refreshTasks} />}

            {/* ── CALENDAR ── */}
            {activeNav === 'calendar' && <CalendarView key={refreshTasks} />}

            {/* ── ALL TASKS ── */}
            {activeNav === 'tasks' && <AllTask refreshTrigger={refreshTasks} />}

            {/* ── CHAT ── */}
            {activeNav === 'chat' && <TeamChat />}

            {/* ── AUDIT ── */}
            {activeNav === 'audit' && <AuditTimeline refreshTrigger={refreshTasks} />}

            {/* ── HR ── */}
            {activeNav === 'hr' && (
              <HRDashboard onBack={() => setActiveNav('dashboard')} />
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

export default AdminDashboard;
