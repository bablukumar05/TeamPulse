import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AuthContext } from '../../Context/AuthProvider';
import SprintBoard from './SprintBoard';
import SprintPlanner from './SprintPlanner';
import MilestoneTimeline from './MilestoneTimeline';

const STATUS_COLORS = {
  'Planning':    'bg-slate-500/20 text-slate-400 border-slate-500/30',
  'In Progress': 'bg-blue-500/20  text-blue-400  border-blue-500/30',
  'Active':      'bg-blue-500/20  text-blue-400  border-blue-500/30',
  'Completed':   'bg-green-500/20 text-green-400 border-green-500/30',
  'On Hold':     'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

const PRIORITY_COLORS = {
  Low:    'bg-green-500/20  text-green-400',
  Medium: 'bg-yellow-500/20 text-yellow-400',
  High:   'bg-orange-500/20 text-orange-400',
  Urgent: 'bg-red-500/20    text-red-400',
};

const TABS = ['Board', 'Backlog', 'Sprints', 'Milestones', 'Members'];

const ProjectWorkspace = ({ project, onBack }) => {
  const { token, authUser } = useContext(AuthContext);
  const [activeTab, setActiveTab]       = useState('Board');
  const [tasks, setTasks]               = useState([]);
  const [sprints, setSprints]           = useState([]);
  const [milestones, setMilestones]     = useState([]);
  const [members, setMembers]           = useState([]);
  const [activeSprint, setActiveSprint] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [backlogFilter, setBacklogFilter] = useState('');

  const isAdmin = authUser?.role === 'admin' || authUser?.role === 'manager';

  const headers = { Authorization: `Bearer ${token}` };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, sprintsRes, milestonesRes] = await Promise.all([
        axios.get(`/api/admin/tasks/all`, { headers }),
        axios.get(`/api/sprints?projectId=${project._id}`, { headers }),
        axios.get(`/api/milestones?projectId=${project._id}`, { headers }),
      ]);
      const projectTasks = tasksRes.data.filter(t => t.project?._id === project._id || t.project === project._id);
      setTasks(projectTasks);
      setSprints(sprintsRes.data);
      setMilestones(milestonesRes.data);
      setActiveSprint(sprintsRes.data.find(s => s.status === 'Active') || sprintsRes.data[0] || null);

      if (project.members?.length) {
        const usersRes = await axios.get(`/api/admin/employees`, { headers });
        const memberIds = project.members.map(m => m._id || m);
        setMembers(usersRes.data.filter(u => memberIds.includes(u._id)));
      }
    } catch (err) {
      toast.error('Failed to load project data');
    } finally {
      setLoading(false);
    }
  }, [project._id, token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Backlog = tasks with no sprint
  const backlogTasks = tasks.filter(t => !t.sprint).filter(t =>
    !backlogFilter || t.title.toLowerCase().includes(backlogFilter.toLowerCase())
  );

  const sprintTasksForActive = tasks.filter(t =>
    activeSprint && (t.sprint === activeSprint._id || t.sprint?._id === activeSprint._id)
  );

  return (
    <div className="min-h-screen bg-[#0a0c11] text-white">
      {/* ── Header ── */}
      <div className="border-b border-white/10 bg-[#111318]/95 backdrop-blur-md sticky top-0 z-30">
        <div className="px-6 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <button onClick={onBack} className="hover:text-white transition-colors">← Dashboard</button>
            <span>/</span>
            <span className="text-white font-semibold">{project.name}</span>
          </div>

          {/* Project info row */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold"
                style={{ background: project.color || '#6366f1' + '33', border: `1px solid ${project.color || '#6366f1'}44` }}>
                🗂️
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{project.name}</h1>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[project.status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                    {project.status}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_COLORS[project.priority] || ''}`}>
                    {project.priority}
                  </span>
                  {project.endDate && (
                    <span className="text-[10px] text-gray-500">
                      Due {new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats chips */}
            <div className="flex gap-3 flex-wrap">
              {[
                { label: 'Tasks',      value: tasks.length,                   color: 'text-blue-400' },
                { label: 'Sprints',    value: sprints.length,                  color: 'text-purple-400' },
                { label: 'Milestones', value: milestones.length,               color: 'text-amber-400' },
                { label: 'Members',    value: project.members?.length || 0,    color: 'text-green-400' },
              ].map(chip => (
                <div key={chip.label} className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-center">
                  <div className={`text-lg font-bold ${chip.color}`}>{chip.value}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest">{chip.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex px-6 border-t border-white/[0.06] overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Loading project…</p>
          </div>
        </div>
      ) : (
        <div className="p-6">
          {/* ── BOARD TAB ── */}
          {activeTab === 'Board' && (
            <SprintBoard
              project={project}
              tasks={tasks}
              sprints={sprints}
              activeSprint={activeSprint}
              setActiveSprint={setActiveSprint}
              onRefresh={fetchAll}
              token={token}
            />
          )}

          {/* ── BACKLOG TAB ── */}
          {activeTab === 'Backlog' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="text-lg font-bold text-white">Product Backlog</h2>
                <div className="flex items-center gap-2">
                  <input
                    value={backlogFilter}
                    onChange={e => setBacklogFilter(e.target.value)}
                    placeholder="Search tasks…"
                    className="text-sm px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 outline-none focus:border-indigo-500 w-48"
                  />
                  <span className="text-xs text-gray-500 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5">
                    {backlogTasks.length} tasks
                  </span>
                </div>
              </div>

              {backlogTasks.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-3">📭</div>
                  <p className="text-gray-400 font-semibold">Backlog is empty</p>
                  <p className="text-gray-600 text-sm mt-1">All tasks are assigned to sprints or none exist yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {backlogTasks.map(task => (
                    <BacklogRow key={task._id} task={task} sprints={sprints} onMove={fetchAll} token={token} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SPRINTS TAB ── */}
          {activeTab === 'Sprints' && (
            <SprintPlanner
              project={project}
              sprints={sprints}
              onRefresh={fetchAll}
              token={token}
              isAdmin={isAdmin}
            />
          )}

          {/* ── MILESTONES TAB ── */}
          {activeTab === 'Milestones' && (
            <MilestoneTimeline
              project={project}
              milestones={milestones}
              onRefresh={fetchAll}
              token={token}
              isAdmin={isAdmin}
            />
          )}

          {/* ── MEMBERS TAB ── */}
          {activeTab === 'Members' && (
            <div className="max-w-3xl mx-auto">
              <h2 className="text-lg font-bold text-white mb-4">Project Team</h2>
              {members.length === 0 ? (
                <p className="text-gray-500 text-sm">No members assigned to this project yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {members.map(member => (
                    <div key={member._id} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 hover:bg-white/[0.06] transition-colors">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                        {member.firstName?.charAt(0).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-semibold text-white text-sm truncate">{member.firstName} {member.lastName || ''}</p>
                        <p className="text-xs text-gray-500 truncate">{member.email}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/30">
                            {member.role}
                          </span>
                          {member.department && (
                            <span className="text-[10px] text-gray-600">{member.department}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Backlog Row component ──────────────────────────────────────────────────

const PRIORITY_DOT = { Critical: '🔴', High: '🟠', Medium: '🟡', Low: '🟢' };

const BacklogRow = ({ task, sprints, onMove, token }) => {
  const [moving, setMoving] = useState(false);
  const headers = { Authorization: `Bearer ${token}` };

  const handleMove = async (sprintId) => {
    setMoving(true);
    try {
      await axios.put(`/api/sprints/task/${task._id}/move`, { sprintId }, { headers });
      toast.success(sprintId ? 'Moved to sprint' : 'Moved to backlog', {
        style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' }
      });
      onMove();
    } catch {
      toast.error('Failed to move task');
    } finally {
      setMoving(false);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-white/[0.025] border border-white/[0.06] rounded-xl px-4 py-3 hover:bg-white/[0.05] transition-colors group">
      <span className="text-sm flex-shrink-0">{PRIORITY_DOT[task.priority] || '⚪'}</span>
      <div className="flex-1 overflow-hidden">
        <p className="text-sm font-semibold text-white truncate">{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {task.labels?.slice(0, 2).map(l => (
            <span key={l} className="text-[10px] bg-white/10 text-gray-400 px-1.5 py-0.5 rounded">{l}</span>
          ))}
          {task.storyPoints > 0 && (
            <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded">
              {task.storyPoints} pts
            </span>
          )}
        </div>
      </div>
      {task.assignedTo && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
          {task.assignedTo.firstName?.charAt(0)}
        </div>
      )}
      {/* Move to sprint dropdown */}
      {sprints.length > 0 && (
        <select
          onChange={e => handleMove(e.target.value || null)}
          disabled={moving}
          defaultValue=""
          className="text-xs bg-white/10 border border-white/10 rounded-lg px-2 py-1.5 text-gray-300 outline-none opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <option value="">Move to sprint…</option>
          {sprints.filter(s => s.status !== 'Completed').map(s => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>
      )}
    </div>
  );
};

export default ProjectWorkspace;
