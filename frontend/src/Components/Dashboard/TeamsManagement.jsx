import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../Context/AuthProvider';
import toast from 'react-hot-toast';

const PRESET_DESIGNATIONS = [
  { title: 'AI Engineer', icon: '🤖', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { title: 'Full Stack Developer', icon: '💻', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { title: 'Database Administrator (DBA)', icon: '🗄️', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  { title: 'QA Engineer', icon: '🧪', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { title: 'DevOps & Cloud Engineer', icon: '🐳', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  { title: 'UI/UX Designer', icon: '🎨', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
  { title: 'Lead AI Scientist', icon: '🧠', color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  { title: 'Engineering Manager', icon: '👔', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
];

const PRESET_COLORS = [
  '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#ec4899', '#f59e0b', '#ef4444', '#6366f1'
];

const TeamsManagement = () => {
  const { token } = useContext(AuthContext);

  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');

  // Modal States
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showLeaderModal, setShowLeaderModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Form States
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDept, setNewTeamDept] = useState('');
  const [newTeamColor, setNewTeamColor] = useState('#8b5cf6');
  const [newTeamLeader, setNewTeamLeader] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');

  const [memberUserId, setMemberUserId] = useState('');
  const [memberDesignation, setMemberDesignation] = useState('Full Stack Developer');

  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptColor, setNewDeptColor] = useState('#3b82f6');
  const [newDeptDesc, setNewDeptDesc] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teamsRes, deptsRes, usersRes] = await Promise.allSettled([
        axios.get('/api/workspace/teams/all', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/workspace/departments/all', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/workspace/users/directory', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (teamsRes.status === 'fulfilled') setTeams(teamsRes.value.data || []);
      if (deptsRes.status === 'fulfilled') setDepartments(deptsRes.value.data || []);
      if (usersRes.status === 'fulfilled') setAllUsers(usersRes.value.data || []);
    } catch (err) {
      console.error('Error fetching teams data:', err);
      toast.error('Failed to load squads & departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  // Create Squad Handler
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      toast.error('Squad name is required');
      return;
    }
    setIsSubmitting(true);
    try {
      await axios.post('/api/workspace/teams', {
        name: newTeamName.trim(),
        departmentId: newTeamDept || undefined,
        managerId: newTeamLeader || undefined,
        color: newTeamColor,
        description: newTeamDesc.trim()
      }, { headers: { Authorization: `Bearer ${token}` } });

      toast.success(`Squad "${newTeamName}" created successfully!`);
      setShowCreateTeamModal(false);
      setNewTeamName('');
      setNewTeamDept('');
      setNewTeamLeader('');
      setNewTeamDesc('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create squad');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Member to Squad Handler
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedTeam || !memberUserId) {
      toast.error('Please select an employee');
      return;
    }
    setIsSubmitting(true);
    try {
      // 1. Add to team
      await axios.post(`/api/workspace/teams/${selectedTeam._id}/members`, {
        userId: memberUserId
      }, { headers: { Authorization: `Bearer ${token}` } });

      // 2. Update employee's professional designation & teamId
      await axios.put(`/api/admin/employees/${memberUserId}`, {
        designation: memberDesignation,
        teamId: selectedTeam._id,
        team: selectedTeam.name,
      }, { headers: { Authorization: `Bearer ${token}` } });

      toast.success('Member assigned to squad with designation!');
      setShowAddMemberModal(false);
      setMemberUserId('');
      setMemberDesignation('Full Stack Developer');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member to squad');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove Member from Squad Handler
  const handleRemoveMember = async (teamId, userId, memberName) => {
    if (!window.confirm(`Remove ${memberName} from this squad?`)) return;
    try {
      await axios.post(`/api/workspace/teams/${teamId}/members/remove`, {
        userId
      }, { headers: { Authorization: `Bearer ${token}` } });

      toast.success(`${memberName} removed from squad.`);
      fetchData();
    } catch (err) {
      toast.error('Failed to remove member');
    }
  };

  // Assign Team Leader Handler
  const handleAssignLeader = async (leaderId) => {
    if (!selectedTeam) return;
    setIsSubmitting(true);
    try {
      await axios.put(`/api/workspace/teams/${selectedTeam._id}`, {
        manager: leaderId
      }, { headers: { Authorization: `Bearer ${token}` } });

      toast.success('Team Leader assigned and promoted to Manager!');
      setShowLeaderModal(false);
      setSelectedTeam(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to assign team leader');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create Department Handler
  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    setIsSubmitting(true);
    try {
      await axios.post('/api/workspace/departments', {
        name: newDeptName.trim(),
        color: newDeptColor,
        description: newDeptDesc.trim()
      }, { headers: { Authorization: `Bearer ${token}` } });

      toast.success(`Department "${newDeptName}" created!`);
      setShowDeptModal(false);
      setNewDeptName('');
      setNewDeptDesc('');
      fetchData();
    } catch (err) {
      toast.error('Failed to create department');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Squads
  const filteredTeams = teams.filter((t) => {
    const matchesDept =
      selectedDeptFilter === 'All' ||
      t.department?.name === selectedDeptFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.manager?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.members?.some(
        (m) =>
          m.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.designation?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesDept && matchesSearch;
  });

  // Calculate Metrics
  const totalSquads = teams.length;
  const totalDepts = departments.length;
  const totalAllocated = teams.reduce((acc, t) => acc + (t.members?.length || 0), 0);
  const totalActiveTasks = teams.reduce((acc, t) => acc + (t.activeTasks || 0), 0);

  const getDesignationBadge = (designation) => {
    const preset = PRESET_DESIGNATIONS.find(
      (p) => p.title.toLowerCase() === (designation || '').toLowerCase()
    );
    if (preset) {
      return (
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${preset.color}`}>
          {preset.icon} {preset.title}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border bg-zinc-800 text-zinc-300 border-zinc-700">
        💻 {designation || 'Software Engineer'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="bg-gradient-to-r from-zinc-900/90 via-zinc-900/60 to-zinc-950/80 border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Enterprise Org Architecture
              </span>
              <span className="text-zinc-500 text-xs">Hierarchy & Allocation</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight mt-2">
              🛡️ Specialized Squads & Departments
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Organize employees into autonomous cross-functional teams (AI & ML, Full Stack, DBA, QA). Appoint Team Leaders to distribute high-velocity tasks with precision.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowDeptModal(true)}
              className="px-3.5 py-2 text-xs font-semibold text-zinc-300 bg-zinc-800/70 hover:bg-zinc-800 border border-zinc-700/80 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              🏢 New Department
            </button>
            <button
              onClick={() => setShowCreateTeamModal(true)}
              className="px-4 py-2 text-xs font-semibold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 shadow-md shadow-emerald-500/20 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>+</span> Create Squad
            </button>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-zinc-800/60">
          <div className="bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Active Squads</span>
            <div className="text-xl font-bold text-zinc-100 mt-0.5">{totalSquads}</div>
          </div>
          <div className="bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Departments</span>
            <div className="text-xl font-bold text-zinc-100 mt-0.5">{totalDepts}</div>
          </div>
          <div className="bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Engineers in Squads</span>
            <div className="text-xl font-bold text-indigo-400 mt-0.5">{totalAllocated}</div>
          </div>
          <div className="bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Live Task Load</span>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">⚡ {totalActiveTasks} Tasks</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Department Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          <button
            onClick={() => setSelectedDeptFilter('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedDeptFilter === 'All'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800/80 hover:text-zinc-200'
            }`}
          >
            All Squads ({teams.length})
          </button>
          {departments.map((d) => (
            <button
              key={d._id}
              onClick={() => setSelectedDeptFilter(d.name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedDeptFilter === d.name
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800/80 hover:text-zinc-200'
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <input
            type="text"
            placeholder="Search squad, leader, skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900/80 border border-zinc-800/80 rounded-xl px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Squad Cards Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            <span className="text-xs text-zinc-500 font-mono">Syncing enterprise squads...</span>
          </div>
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-12 text-center">
          <div className="text-4xl mb-2">🛡️</div>
          <h3 className="text-base font-semibold text-zinc-200">No Squads Found</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No squads match the search query "${searchQuery}".`
              : 'Create your first specialized squad or seed enterprise defaults.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredTeams.map((team) => {
            const leader = team.manager;
            const members = team.members || [];
            const squadColor = team.color || '#8b5cf6';

            return (
              <div
                key={team._id}
                className="bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-5 flex flex-col justify-between transition-all relative overflow-hidden group shadow-lg"
                style={{ borderTopColor: squadColor, borderTopWidth: '3px' }}
              >
                <div>
                  {/* Top Bar: Squad Title & Department Pill */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-zinc-100 group-hover:text-white transition-colors">
                          {team.name}
                        </h3>
                        {team.department?.name && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800/90 text-zinc-300 border border-zinc-700/60">
                            🏢 {team.department.name}
                          </span>
                        )}
                      </div>
                      {team.description && (
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                          {team.description}
                        </p>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                      ⚡ {team.activeTasks || 0} tasks
                    </span>
                  </div>

                  {/* Team Leader Section */}
                  <div className="mt-4 p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/60 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs text-white uppercase shadow-inner"
                          style={{ backgroundColor: squadColor + '44', border: `1px solid ${squadColor}88` }}
                        >
                          {leader ? leader.firstName?.[0] || 'L' : '❓'}
                        </div>
                        <span className="absolute -top-1.5 -right-1.5 text-xs select-none">👑</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-zinc-200">
                            {leader ? `${leader.firstName} ${leader.lastName || ''}` : 'No Leader Appointed'}
                          </span>
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            TL / Manager
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-500 block">
                          {leader ? (leader.designation || leader.email) : 'Click to appoint a Team Leader'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedTeam(team);
                        setShowLeaderModal(true);
                      }}
                      className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      {leader ? 'Change TL' : 'Appoint TL'}
                    </button>
                  </div>

                  {/* Members List */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                        Squad Members ({members.length})
                      </span>
                      <button
                        onClick={() => {
                          setSelectedTeam(team);
                          setShowAddMemberModal(true);
                        }}
                        className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        + Add Member
                      </button>
                    </div>

                    {members.length === 0 ? (
                      <div className="text-center py-4 bg-zinc-950/20 border border-dashed border-zinc-800/80 rounded-xl text-xs text-zinc-500">
                        No members assigned to this squad yet.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
                        {members.map((member) => (
                          <div
                            key={member._id}
                            className="flex items-center justify-between gap-2 p-2 rounded-lg bg-zinc-950/30 hover:bg-zinc-800/40 border border-zinc-800/40 transition-colors group/item"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300 uppercase flex-shrink-0">
                                {member.firstName?.[0] || 'U'}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-medium text-zinc-200 truncate">
                                    {member.firstName} {member.lastName || ''}
                                  </span>
                                  {getDesignationBadge(member.designation)}
                                </div>
                                <span className="text-[10px] text-zinc-500 truncate block">
                                  {member.email}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleRemoveMember(team._id, member._id, member.firstName)}
                              title="Remove from squad"
                              className="opacity-0 group-hover/item:opacity-100 text-zinc-500 hover:text-rose-400 text-xs px-2 py-1 rounded transition-all cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="mt-5 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: squadColor }}
                    />
                    <span className="font-mono text-[10px] uppercase">
                      {members.length} Contributor{members.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedTeam(team);
                        setShowAddMemberModal(true);
                      }}
                      className="text-xs text-zinc-300 hover:text-white bg-zinc-800/70 hover:bg-zinc-800 border border-zinc-700/60 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      Assign Role
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Squad */}
      {showCreateTeamModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-base font-bold text-zinc-100">Create New Specialized Squad</h3>
              <button
                onClick={() => setShowCreateTeamModal(false)}
                className="text-zinc-500 hover:text-zinc-300 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-4 mt-4">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1.5">
                  Squad Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI & Machine Learning Squad"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1.5">
                    Department
                  </label>
                  <select
                    value={newTeamDept}
                    onChange={(e) => setNewTeamDept(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">Select Department...</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1.5">
                    Team Leader (Manager)
                  </label>
                  <select
                    value={newTeamLeader}
                    onChange={(e) => setNewTeamLeader(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">No Leader (Assign Later)</option>
                    {allUsers.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.firstName} {u.lastName || ''} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1.5">
                  Accent Color
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewTeamColor(c)}
                      className={`w-7 h-7 rounded-lg transition-transform ${
                        newTeamColor === c ? 'scale-110 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1.5">
                  Squad Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Responsibilities, domain tech stack (e.g. PyTorch, Next.js, PostgreSQL)..."
                  value={newTeamDesc}
                  onChange={(e) => setNewTeamDesc(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCreateTeamModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Creating...' : 'Create Squad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Member to Squad */}
      {showAddMemberModal && selectedTeam && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-zinc-100">Add Member to Squad</h3>
                <span className="text-xs text-emerald-400 font-semibold">{selectedTeam.name}</span>
              </div>
              <button
                onClick={() => {
                  setShowAddMemberModal(false);
                  setSelectedTeam(null);
                }}
                className="text-zinc-500 hover:text-zinc-300 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4 mt-4">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1.5">
                  Select Employee *
                </label>
                <select
                  required
                  value={memberUserId}
                  onChange={(e) => setMemberUserId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="">Choose employee...</option>
                  {allUsers
                    .filter((u) => !selectedTeam.members?.some((m) => m._id === u._id))
                    .map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.firstName} {u.lastName || ''} — {u.email} ({u.designation || u.role})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1.5">
                  Professional Designation *
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {PRESET_DESIGNATIONS.map((preset) => (
                    <button
                      key={preset.title}
                      type="button"
                      onClick={() => setMemberDesignation(preset.title)}
                      className={`text-left px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                        memberDesignation === preset.title
                          ? `${preset.color} ring-1 ring-white/20`
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      <span>{preset.icon}</span>
                      <span className="truncate">{preset.title}</span>
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Or custom title (e.g. Senior Cloud Architect)..."
                  value={memberDesignation}
                  onChange={(e) => setMemberDesignation(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setSelectedTeam(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Adding...' : 'Add to Squad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Appoint / Change Team Leader */}
      {showLeaderModal && selectedTeam && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-zinc-100">Appoint Team Leader</h3>
                <span className="text-xs text-indigo-400 font-semibold">{selectedTeam.name}</span>
              </div>
              <button
                onClick={() => {
                  setShowLeaderModal(false);
                  setSelectedTeam(null);
                }}
                className="text-zinc-500 hover:text-zinc-300 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400 my-3 leading-relaxed">
              Appointing a Team Leader grants them authority to create, assign, and supervise daily sprint tasks for this squad. They will automatically be granted the <span className="text-amber-400 font-semibold">Manager</span> role.
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
              {allUsers.map((u) => {
                const isCurrent = selectedTeam.manager?._id === u._id;
                return (
                  <div
                    key={u._id}
                    onClick={() => handleAssignLeader(u._id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-zinc-950/40 border-zinc-800 hover:bg-zinc-800/50 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-200 uppercase">
                        {u.firstName?.[0] || 'U'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-zinc-100">
                          {u.firstName} {u.lastName || ''}
                        </div>
                        <span className="text-[10px] text-zinc-500 block">{u.designation || u.email}</span>
                      </div>
                    </div>
                    {isCurrent ? (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">
                        Current Leader
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-indigo-400 hover:underline">
                        Appoint →
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Department */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-base font-bold text-zinc-100">Create New Department</h3>
              <button
                onClick={() => setShowDeptModal(false)}
                className="text-zinc-500 hover:text-zinc-300 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDepartment} className="space-y-4 mt-4">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1.5">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI & Data Intelligence"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1.5">
                  Color Accent
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewDeptColor(c)}
                      className={`w-7 h-7 rounded-lg transition-transform ${
                        newDeptColor === c ? 'scale-110 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1.5">
                  Department Scope & Vision
                </label>
                <textarea
                  rows={2}
                  placeholder="Overview of this organizational wing..."
                  value={newDeptDesc}
                  onChange={(e) => setNewDeptDesc(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Creating...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsManagement;
